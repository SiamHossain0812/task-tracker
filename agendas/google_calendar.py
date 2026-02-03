"""
Google Calendar API Integration
Handles OAuth flow and Calendar event creation with Google Meet links
"""
import os
from datetime import datetime, timedelta
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from django.conf import settings

# OAuth 2.0 scopes
SCOPES = ['https://www.googleapis.com/auth/calendar.events']

def get_oauth_flow():
    """Create OAuth flow for Google Calendar"""
    client_config = {
        "web": {
            "client_id": os.getenv('GOOGLE_CLIENT_ID'),
            "client_secret": os.getenv('GOOGLE_CLIENT_SECRET'),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:3000/auth/google/callback')]
        }
    }
    
    flow = Flow.from_client_config(
        client_config,
        scopes=SCOPES,
        redirect_uri=os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:3000/auth/google/callback')
    )
    return flow


def create_calendar_event(agenda, access_token):
    """
    Create a Google Calendar event with Google Meet link
    
    Args:
        agenda: Agenda model instance
        access_token: User's Google OAuth access token
        
    Returns:
        dict: {'event_id': str, 'meeting_link': str}
    """
    try:
        credentials = Credentials(token=access_token)
        service = build('calendar', 'v3', credentials=credentials)
        
        # Construct event datetime
        start_datetime = datetime.combine(agenda.date, agenda.time or datetime.min.time())
        
        # Default 1-hour duration if no finish time specified
        if agenda.expected_finish_date and agenda.expected_finish_time:
            end_datetime = datetime.combine(agenda.expected_finish_date, agenda.expected_finish_time)
        else:
            end_datetime = start_datetime + timedelta(hours=1)
        
        # Build event
        event = {
            'summary': agenda.title,
            'description': agenda.description or 'Created from Agenda Tracker',
            'start': {
                'dateTime': start_datetime.isoformat(),
                'timeZone': 'Asia/Dhaka',  # Adjust to your timezone
            },
            'end': {
                'dateTime': end_datetime.isoformat(),
                'timeZone': 'Asia/Dhaka',
            },
            'conferenceData': {
                'createRequest': {
                    'requestId': f'agenda-{agenda.id}-{int(datetime.now().timestamp())}',
                    'conferenceSolutionKey': {'type': 'hangoutsMeet'}
                }
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'popup', 'minutes': 30},
                ],
            },
        }
        
        # Create event
        created_event = service.events().insert(
            calendarId='primary',
            body=event,
            conferenceDataVersion=1
        ).execute()
        
        # Extract Meet link
        meet_link = created_event.get('hangoutLink', '')
        event_id = created_event.get('id', '')
        
        return {
            'event_id': event_id,
            'meeting_link': meet_link
        }
        
    except HttpError as error:
        print(f'An error occurred: {error}')
        raise Exception(f'Failed to create calendar event: {str(error)}')


def update_calendar_event(event_id, agenda, access_token):
    """Update an existing Google Calendar event"""
    try:
        credentials = Credentials(token=access_token)
        service = build('calendar', 'v3', credentials=credentials)
        
        # Get existing event
        event = service.events().get(calendarId='primary', eventId=event_id).execute()
        
        # Update fields
        start_datetime = datetime.combine(agenda.date, agenda.time or datetime.min.time())
        if agenda.expected_finish_date and agenda.expected_finish_time:
            end_datetime = datetime.combine(agenda.expected_finish_date, agenda.expected_finish_time)
        else:
            end_datetime = start_datetime + timedelta(hours=1)
        
        event['summary'] = agenda.title
        event['description'] = agenda.description or 'Created from Agenda Tracker'
        event['start'] = {
            'dateTime': start_datetime.isoformat(),
            'timeZone': 'Asia/Dhaka',
        }
        event['end'] = {
            'dateTime': end_datetime.isoformat(),
            'timeZone': 'Asia/Dhaka',
        }
        
        updated_event = service.events().update(
            calendarId='primary',
            eventId=event_id,
            body=event
        ).execute()
        
        return updated_event
        
    except HttpError as error:
        print(f'An error occurred: {error}')
        raise Exception(f'Failed to update calendar event: {str(error)}')


def delete_calendar_event(event_id, access_token):
    """Delete a Google Calendar event"""
    try:
        credentials = Credentials(token=access_token)
        service = build('calendar', 'v3', credentials=credentials)
        
        service.events().delete(calendarId='primary', eventId=event_id).execute()
        return True
        
    except HttpError as error:
        print(f'An error occurred: {error}')
        return False
