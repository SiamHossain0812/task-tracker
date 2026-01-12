from django.conf import settings
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def send_whatsapp_notification(collaborators, agenda):
    """
    Sends a WhatsApp notification to the list of collaborators.
    """
    print(f"DEBUG: Attempting to send WhatsApp for agenda: {agenda.title}")
    
    if not collaborators:
        print("DEBUG: No collaborators to notify.")
        return

    try:
        from twilio.rest import Client
    except ImportError:
        logger.warning("Twilio library not installed. Skipping WhatsApp notification.")
        print("WARNING: Twilio library not installed. Cannot send WhatsApp.")
        # Log the message that WOULD have been sent
        message_body = get_whatsapp_message_body(agenda)
        print(f"MOCK WHATSAPP LOG:\nTo: {[c.name for c in collaborators]}\nBody: {message_body}")
        return

    if not settings.TWILIO_ACCOUNT_SID or 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' in settings.TWILIO_ACCOUNT_SID:
        logger.warning("Twilio credentials not configured. Skipping WhatsApp notification.")
        print("WARNING: Twilio credentials not configured. Cannot send WhatsApp.")
        # Log the message that WOULD have been sent for testing/simulation
        message_body = get_whatsapp_message_body(agenda)
        print(f"SIMULATION LOG:\nTo: {[c.name for c in collaborators]}\nNumbers: {[c.whatsapp_number for c in collaborators]}\nBody: {message_body}")
        return

    client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    message_body = get_whatsapp_message_body(agenda)

    for collaborator in collaborators:
        if collaborator.whatsapp_number:
            try:
                # Ensure number is in correct format (whatsapp:+1234567890)
                to_number = collaborator.whatsapp_number
                if not to_number.startswith('whatsapp:'):
                    # Strip any spaces or dashes from number
                    clean_number = "".join(filter(str.isdigit, to_number))
                    # Ensure it has a plus sign if it looks like an international number
                    if not clean_number.startswith('+'):
                        # Assuming a default or that user provides it. 
                        # For now just prepend plus if missing and looks like it needs one
                        pass 
                    to_number = f"whatsapp:{to_number}"

                message = client.messages.create(
                    from_=settings.TWILIO_WHATSAPP_NUMBER,
                    body=message_body,
                    to=to_number
                )
                logger.info(f"WhatsApp sent to {collaborator.name}: {message.sid}")
                print(f"SUCCESS: WhatsApp sent to {collaborator.name}")
            except Exception as e:
                logger.error(f"Failed to send WhatsApp to {collaborator.name}: {str(e)}")
                print(f"ERROR: Failed to send WhatsApp to {collaborator.name}: {str(e)}")

def get_whatsapp_message_body(agenda):
    """Construct the message body."""
    return (
        f"📅 *New Agenda Assignment*\n"
        f"Title: {agenda.title}\n"
        f"Date: {agenda.date}\n"
        f"Time: {agenda.time}\n"
        f"Description: {agenda.description[:100]}...\n"
        f"Link: {settings.ALLOWED_HOSTS[0] if settings.ALLOWED_HOSTS and settings.ALLOWED_HOSTS[0] != '*' else 'http://localhost:8000'}/agenda/{agenda.pk}/edit/"
    )


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
