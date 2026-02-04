from django.conf import settings
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


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
from channels.layers import get_channel_layer
from .models import Agenda, Notification

def check_and_create_alerts(user):
    """
    Checks for overdue, stagnant, or warning-state agendas for the user
    and creates notifications if needed.
    """
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

        # --- Rule 2: Deadline Approaching (Within 2 hours) ---
        elif agenda.status != 'completed' and now < finish_dt and (finish_dt - now) <= timedelta(hours=2):
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

        # --- Rule 3: Overdue (Missed Deadline) ---
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
            created_alerts.append(f"{alert_type}: {agenda.title}")
            
            # Send Real-time WebSocket update
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
        'details': created_alerts
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
