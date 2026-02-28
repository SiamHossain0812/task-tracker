from django.conf import settings
import logging
import os
from datetime import datetime

logger = logging.getLogger(__name__)

from .models import Agenda, Notification


def calculate_status(date_str, time_str, end_date_str, end_time_str):
    """
    Calculates the status of an agenda based on date/time.
    """
    if not date_str:
        return 'pending'

    now = datetime.now()
    
    # Construct Start Datetime
    start_dt_str = f"{date_str} {time_str}" if time_str else f"{date_str} 00:00"
    try:
        start_dt = datetime.strptime(start_dt_str, '%Y-%m-%d %H:%M')
    except ValueError:
        try:
             start_dt = datetime.strptime(start_dt_str, '%Y-%m-%d %H:%M:%S')
        except:
             return 'pending'

    # Construct End Datetime
    if end_date_str:
        end_dt_str = f"{end_date_str} {end_time_str}" if end_time_str else f"{end_date_str} 23:59"
        try:
            end_dt = datetime.strptime(end_dt_str, '%Y-%m-%d %H:%M')
        except ValueError:
             try:
                end_dt = datetime.strptime(end_dt_str, '%Y-%m-%d %H:%M:%S')
             except:
                end_dt = None
    else:
        end_dt = None

    if end_dt and now > end_dt:
        return 'completed'
    elif now >= start_dt:
        return 'in-progress'
    else:
        return 'pending'


from django.utils import timezone
from datetime import timedelta
from asgiref.sync import async_to_sync
def check_and_create_alerts(user, emit_websocket=True, loud_types=None):
    """
    Checks for overdue, stagnant, or warning-state agendas for the user
    and creates notifications if needed.
    """
    if loud_types is None:
        loud_types = []
        
    if not user.is_authenticated:
        return {
            'alerts_created': 0,
            'details': []
        }
        
    now = timezone.now()
    created_alerts = []
    
    # Get user's relevant agendas (not completed)
    if user.is_superuser:
        agendas = Agenda.objects.exclude(status='completed')
    else:
        if hasattr(user, 'collaborator_profile'):
            agendas = Agenda.objects.filter(collaborators=user.collaborator_profile).exclude(status='completed')
        else:
            agendas = Agenda.objects.none()

    for agenda in agendas:
        
        # Determine strict deadlines
        start_date = agenda.date
        start_time = agenda.time
        
        # Check agenda timing

        finish_date = agenda.expected_finish_date or start_date
        finish_time = agenda.expected_finish_time or start_time
        
        # Make timezone aware
        if start_time:
            start_dt = datetime.combine(start_date, start_time)
        else:
            start_dt = datetime.combine(start_date, datetime.min.time())
            
        if finish_time:
            finish_dt = datetime.combine(finish_date, finish_time)
        else:
            # If no time, deadline is end of that day
            finish_dt = datetime.combine(finish_date, datetime.max.time())
            
        start_dt = timezone.make_aware(start_dt)
        finish_dt = timezone.make_aware(finish_dt)

        alert_type = None
        title = ""
        message = ""

        # --- Rule 1: Stagnation (Pending but should have started) ---
        if agenda.status == 'pending' and now > start_dt:
            # Check if we already alerted this recently (e.g. today)
            if not Notification.objects.filter(
                user=user, 
                related_agenda=agenda, 
                notification_type='stagnation',
                created_at__date=now.date()
            ).exists():
                alert_type = 'stagnation'
                title = "Gentle Reminder"
                message = f"It looks like '{agenda.title}' is awaiting your start. It was scheduled for {start_dt.strftime('%H:%M')}."

        # --- Rule 2: 80% Time Elapsed (In Progress) ---
        elif agenda.status == 'in-progress' and finish_dt > start_dt:
             total_duration = (finish_dt - start_dt).total_seconds()
             elapsed_duration = (now - start_dt).total_seconds()
             
             if total_duration > 0 and (elapsed_duration / total_duration) >= 0.8:
                 # Check if we already sent this specific warning
                 if not Notification.objects.filter(
                    user=user,
                    related_agenda=agenda,
                    notification_type='time_elapsed_warning'
                 ).exists():
                     alert_type = 'time_elapsed_warning'
                     title = "Time Check"
                     message = f"Heads up! 80% of the allocated time for '{agenda.title}' has passed."

        # --- Rule 3: Deadline Approaching (Within 2 hours) ---
        # Only check if we haven't already triggered the 80% warning (to avoid double alerts in same check)
        elif agenda.status != 'completed' and now < finish_dt and (finish_dt - now) <= timedelta(hours=2) and not alert_type:
            # Check for recent warning
            if not Notification.objects.filter(
                user=user, 
                related_agenda=agenda, 
                notification_type='deadline_warning',
                created_at__date=now.date()
            ).exists():
                alert_type = 'deadline_warning'
                title = "Upcoming Milestone"
                time_left = int((finish_dt - now).total_seconds() / 60)
                message = f"'{agenda.title}' is reaching its milestone soon (in {time_left} minutes)."

        # --- Rule 4: Overdue (Missed Deadline) ---
        elif agenda.status != 'completed' and now > finish_dt:
             if not Notification.objects.filter(
                user=user, 
                related_agenda=agenda, 
                notification_type='agenda_overdue',
                created_at__date=now.date()
            ).exists():
                alert_type = 'agenda_overdue'
                title = "Milestone Overlooked"
                message = f"'{agenda.title}' has passed its expected completion time. Please review current progress or update the schedule."

        # --- Actions ---
        if alert_type:
            notification = Notification.objects.create(
                user=user,
                title=title,
                message=message,
                notification_type=alert_type,
                related_agenda=agenda,
                related_project=agenda.project
            )
            
            # Send Email Notification - DISABLED for reminders as per request
            # send_notification_email(user, title, message, agenda)
            
            # Store structured info for the return value
            alert_info = {
                'id': notification.id,
                'type': alert_type,
                'title': title,
                'message': message,
                'agenda_id': agenda.id,
                'agenda_title': agenda.title,
                'project_name': agenda.project.name if agenda.project else None
            }
            created_alerts.append(alert_info)
            
            # Send Real-time WebSocket update (if not silenced, OR if explicitly loud)
            if emit_websocket or (alert_type in loud_types):
                try:
                    channel_layer = get_channel_layer()
                    if channel_layer:
                        async_to_sync(channel_layer.group_send)(
                            f'notifications_{user.id}',
                            {
                                'type': 'notification_message',
                                'notification': {
                                    'id': notification.id,
                                    'title': notification.title,
                                    'message': notification.message,
                                    'notification_type': notification.notification_type,
                                    'related_agenda': {
                                        'id': agenda.id,
                                        'title': agenda.title
                                    } if agenda else None,
                                    'related_project': {
                                        'id': agenda.project.id,
                                        'name': agenda.project.name
                                    } if agenda and agenda.project else None,
                                    'created_at': notification.created_at.isoformat(),
                                    'is_read': False
                                }
                            }
                        )
                except Exception as e:
                    pass  # WebSocket push failed

                # Trigger Native Push Notification
                try:
                    send_push_notification(
                        user=user,
                        title=title,
                        message=message,
                        url=f"/agendas/{agenda.id}/edit"
                    )
                except Exception as push_e:
                    pass  # Native push failed

    return {
        'alerts_created': len(created_alerts),
        'alerts': created_alerts
    }


def send_push_notification(user, title, message, url=None):
    """
    Sends a native push notification to all subscribed devices for a user.
    """
    from pywebpush import webpush, WebPushException
    from .models import PushSubscription
    import json

    subscriptions = PushSubscription.objects.filter(user=user)
    if not subscriptions.exists():
        return

    payload = {
        'title': title,
        'body': message,
        'icon': '/logo192.png',  # Assuming standard icon path
        'badge': '/favicon.ico',
        'url': url or '/'
    }

    for sub in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {
                        "p256dh": sub.p256dh,
                        "auth": sub.auth
                    }
                },
                data=json.dumps(payload),
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={
                    "sub": f"mailto:{settings.VAPID_ADMIN_EMAIL}"
                }
            )
        except WebPushException as ex:
            pass  # Web push failed
            # If the user has unsubscribed or the token is expired, remove it
            if ex.response and ex.response.status_code in [404, 410]:
                sub.delete()
        except Exception as e:
            pass  # Unexpected push error

def send_notification_email(recipient, title, message, agenda=None):
    """
    Sends a premium HTML email notification to a User or Collaborator.
    """
    email = getattr(recipient, 'email', None)
    if not email:
        return

    from django.core.mail import send_mail
    from django.utils.html import strip_tags
    from django.conf import settings

    subject = f"[Agenda Tracker] {title}"
    
    # Extract specific duty for this user/collaborator if agenda is provided
    user_duty = ""
    if agenda:
        # Check if recipient is a User or Collaborator
        from .models import Collaborator
        if isinstance(recipient, Collaborator):
            assignment = agenda.assignments.filter(collaborator=recipient).first()
        else:
            assignment = agenda.assignments.filter(collaborator__user=recipient).first()
            
        if assignment and assignment.duties:
            user_duty = assignment.duties

    # Frontend URL (assumed based on settings or default)
    base_url = os.getenv('FRONTEND_URL', 'https://task.brri.gov.bd')
    task_url = f"{base_url}/agendas/{agenda.id}/edit" if agenda else base_url
    
    # Premium HTML Email Template
    recipient_name = recipient.get_full_name() if hasattr(recipient, 'get_full_name') and recipient.get_full_name() else (recipient.name if hasattr(recipient, 'name') else 'there')

    # Context-aware header text
    if 'meeting' in title.lower():
        header_eyebrow = "Meeting Invitation"
        header_title = "You have been invited to a meeting"
    else:
        header_eyebrow = title
        header_title = "You have a new task assignment"

    # Helper to format dates nicely — cross-platform
    def fmt_date(d):
        if not d: return ''
        try:
            import datetime as _dt
            if isinstance(d, str):
                d = _dt.date.fromisoformat(d)
            # Use %B %d, %Y then strip leading zero from day
            return d.strftime('%B %d, %Y').replace(' 0', ' ')
        except Exception:
            return str(d)

    # Priority badge style (no emoji, border-based)
    def priority_style(p):
        p = (p or '').lower()
        if p == 'high':   return 'border:1px solid #fca5a5;color:#dc2626;background:#fff5f5;'
        if p == 'medium': return 'border:1px solid #fdba74;color:#c2410c;background:#fff7ed;'
        if p == 'low':    return 'border:1px solid #6ee7b7;color:#047857;background:#f0fdf4;'
        return 'border:1px solid #d1d5db;color:#6b7280;background:#f9fafb;'

    # Task Details Card Component (Refactored to avoid nested f-strings in Python < 3.12)
    task_card_html = ""
    if agenda:
        project_row = ""
        if agenda.project:
            project_row = f'<tr><td style="padding:12px 24px;font-size:11px;color:#9ca3af;font-weight:600;letter-spacing:0.07em;vertical-align:top;">PROJECT</td><td style="padding:12px 24px;font-size:14px;font-weight:500;color:#374151;vertical-align:top;">{agenda.project.name}</td></tr><tr><td colspan="2" style="height:1px;background:#f3f4f6;padding:0;"></td></tr>'
        
        priority_row = ""
        if hasattr(agenda, 'priority'):
            priority_row = f"""<tr>
                              <td style="padding:12px 24px;font-size:11px;color:#9ca3af;font-weight:600;letter-spacing:0.07em;vertical-align:middle;">PRIORITY</td>
                              <td style="padding:12px 24px;vertical-align:middle;">
                                <span style="display:inline-block;padding:3px 12px;border-radius:5px;font-size:12px;font-weight:600;letter-spacing:0.03em;{priority_style(agenda.priority)}">{(agenda.priority or "Normal").capitalize()}</span>
                              </td>
                            </tr>
                            <tr><td colspan="2" style="height:1px;background:#f3f4f6;padding:0;"></td></tr>"""
        
        deadline_row = ""
        if hasattr(agenda, 'expected_finish_date') and agenda.expected_finish_date:
            deadline_row = f'<tr><td style="padding:12px 24px;font-size:11px;color:#9ca3af;font-weight:600;letter-spacing:0.07em;vertical-align:top;">DEADLINE</td><td style="padding:12px 24px;font-size:14px;font-weight:600;color:#0f172a;vertical-align:top;">{fmt_date(agenda.expected_finish_date)}</td></tr><tr ><td colspan="2" style="height:1px;background:#f3f4f6;padding:0;"></td></tr>'
        elif agenda.date:
            deadline_row = f'<tr><td style="padding:12px 24px;font-size:11px;color:#9ca3af;font-weight:600;letter-spacing:0.07em;vertical-align:top;">START DATE</td><td style="padding:12px 24px;font-size:14px;font-weight:600;color:#0f172a;vertical-align:top;">{fmt_date(agenda.date)}</td></tr><tr><td colspan="2" style="height:1px;background:#f3f4f6;padding:0;"></td></tr>'

        duty_row = ""
        if user_duty:
            duty_row = f"""<tr><td colspan="2" style="height:1px;background:#f3f4f6;padding:0;"></td></tr>
                            <tr>
                              <td colspan="2" style="padding:16px 24px 20px;">
                                <div style="background:#f8fffe;border-left:3px solid #059669;border-radius:0 8px 8px 0;padding:14px 18px;">
                                  <p style="margin:0 0 5px 0;font-size:10px;font-weight:700;color:#065f46;text-transform:uppercase;letter-spacing:0.1em;">Your Responsibilities</p>
                                  <p style="margin:0;font-size:14px;color:#374151;line-height:1.75;font-weight:400;">{user_duty}</p>
                                </div>
                              </td>
                            </tr>"""

        status_txt = agenda.get_status_display() if hasattr(agenda, "get_status_display") else agenda.status.capitalize()
        status_padding = '12px' if user_duty else '18px'

        task_card_html = f"""
                          <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #d1fae5;border-radius:14px;overflow:hidden;margin-bottom:36px;">
                            <tr>
                              <td colspan="2" style="background:#f0fdf4;padding:14px 24px 13px;border-bottom:1px solid #d1fae5;">
                                <span style="font-size:10px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:0.12em;">Task Assignment Details</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:18px 24px 10px;font-size:11px;color:#9ca3af;font-weight:600;letter-spacing:0.07em;width:110px;vertical-align:top;">TASK</td>
                              <td style="padding:18px 24px 10px;font-size:16px;font-weight:700;color:#0f172a;vertical-align:top;letter-spacing:-0.01em;">{agenda.title}</td>
                            </tr>
                            <tr><td colspan="2" style="height:1px;background:#f3f4f6;padding:0;"></td></tr>
                            {project_row}
                            {priority_row}
                            {deadline_row}
                            <tr>
                              <td style="padding:12px 24px {status_padding};font-size:11px;color:#9ca3af;font-weight:600;letter-spacing:0.07em;vertical-align:middle;">STATUS</td>
                              <td style="padding:12px 24px {status_padding};vertical-align:middle;">
                                <span style="display:inline-block;padding:3px 12px;border-radius:5px;font-size:12px;font-weight:600;border:1px solid #6ee7b7;color:#065f46;background:#f0fdf4;">{status_txt}</span>
                              </td>
                            </tr>
                            {duty_row}
                          </table>"""

    html_message = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{subject}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    </head>
    <body style="margin:0;padding:0;background-color:#f0f4f2;font-family:'Inter','Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

        <!-- Preheader (hidden preview text) -->
        <span style="display:none;max-height:0;overflow:hidden;color:#f0f4f2;font-size:1px;">{message} — Agromet Lab, BRRI</span>

        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f2;padding:48px 20px;">
          <tr>
            <td align="center">
              <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">

                <!-- Top Logo Bar -->
                <tr>
                  <td style="padding:0 0 28px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:middle;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="vertical-align:middle;padding-right:14px;">
                                <img src="{base_url}/images/brri-logo.png" alt="BRRI" width="46" height="46" style="display:block;border:0;">
                              </td>
                              <td style="vertical-align:middle;">
                                <div style="font-size:16px;font-weight:700;color:#0f1f0f;letter-spacing:-0.01em;line-height:1.2;">Agromet Lab</div>
                                <div style="font-size:11px;color:#6b8f6b;margin-top:2px;font-weight:500;letter-spacing:0.02em;">Bangladesh Rice Research Institute</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td align="right" style="vertical-align:middle;">
                          <span style="font-size:12px;color:#6b7280;background:#ffffff;padding:5px 14px;border-radius:20px;border:1px solid #e5e7eb;font-weight:500;">{datetime.now().strftime('%b %d, %Y')}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Main Card -->
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.11);">

                      <!-- Top Accent Stripe -->
                      <tr>
                        <td style="background:linear-gradient(90deg,#052e1a 0%,#065f46 40%,#10b981 100%);height:4px;font-size:0;line-height:0;">&nbsp;</td>
                      </tr>

                      <!-- Header -->
                      <tr>
                        <td style="background:linear-gradient(150deg,#052e1a 0%,#064e3b 45%,#065f46 100%);padding:40px 48px 34px;">
                          <p style="margin:0 0 10px 0;font-size:10px;font-weight:700;color:#34d399;text-transform:uppercase;letter-spacing:0.14em;">{header_eyebrow}</p>
                          <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;line-height:1.25;letter-spacing:-0.03em;">{header_title}</h1>
                          <p style="margin:14px 0 0 0;font-size:14px;color:#a7f3d0;line-height:1.7;font-weight:400;max-width:440px;">{message}</p>
                        </td>
                      </tr>

                      <!-- White Body -->
                      <tr>
                        <td style="background:#ffffff;padding:40px 48px 36px;">

                          <p style="margin:0 0 6px 0;font-size:17px;color:#111827;line-height:1.5;font-weight:600;">Dear {recipient_name},</p>
                          <p style="margin:0 0 36px 0;font-size:14.5px;color:#52525b;line-height:1.8;font-weight:400;">
                            This is an official coordination from <strong style="color:#111827;font-weight:600;">Agromet Lab, BRRI</strong>. Please review the task details below and take any necessary action at your earliest convenience.
                          </p>

                          <!-- Task Details Card -->
                          {task_card_html}

                          <p style="margin:0 0 30px 0;font-size:14px;color:#6b7280;line-height:1.8;">
                            Please log in to the Agromet Lab Research Portal to review all documents, post updates, and coordinate with your team members.
                          </p>

                          <!-- CTA Button -->
                          <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                            <tr>
                              <td align="center" style="border-radius:10px;background:linear-gradient(135deg,#064e3b 0%,#059669 100%);">
                                <a href="{task_url}" style="display:inline-block;padding:15px 48px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;letter-spacing:0.03em;font-family:'Inter','Segoe UI',Helvetica,Arial,sans-serif;">
                                  Open in Research Portal &rarr;
                                </a>
                              </td>
                            </tr>
                          </table>

                          <p style="margin:0;font-size:11.5px;color:#9ca3af;text-align:center;line-height:1.7;">
                            If the button doesn't work, paste this link into your browser:<br>
                            <a href="{task_url}" style="color:#059669;word-break:break-all;text-decoration:none;font-weight:500;">{task_url}</a>
                          </p>

                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="background:#f8fafc;border-top:1.5px solid #e5e7eb;padding:22px 48px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="vertical-align:middle;">
                                <p style="margin:0;font-size:13px;font-weight:700;color:#1f2937;letter-spacing:-0.01em;">Agromet Lab &mdash; BRRI</p>
                                <p style="margin:3px 0 0 0;font-size:11px;color:#9ca3af;line-height:1.6;">Bangladesh Rice Research Institute, Gazipur-1701, Bangladesh</p>
                              </td>
                              <td align="right" style="vertical-align:middle;">
                                <p style="margin:0;font-size:11px;color:#9ca3af;">&copy; {datetime.now().year} BRRI. All rights reserved.</p>
                                <p style="margin:3px 0 0 0;font-size:11px;color:#d1d5db;">Automated notification &mdash; please do not reply.</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>

    </body>
    </html>
    """
    plain_message = strip_tags(html_message)

    try:
        send_mail(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            html_message=html_message,
            fail_silently=False,
        )
    except Exception as e:
        raise e
