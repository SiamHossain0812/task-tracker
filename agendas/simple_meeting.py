"""
Simple Meeting Link Generator
Generates meeting links without requiring Google OAuth
"""
import uuid
from datetime import datetime


def generate_simple_meet_link(agenda):
    """
    Generate a simple meeting link without Google OAuth
    
    Options:
    1. Use a free service like Jitsi Meet
    2. Use Google Meet public links (no auth needed)
    3. Generate a placeholder for manual entry
    """
    
    # Option 1: Jitsi Meet (100% free, no account needed)
    # Creates a unique room based on task ID and title
    room_name = f"agenda-{agenda.id}-{agenda.title.lower().replace(' ', '-')[:30]}"
    jitsi_link = f"https://meet.jit.si/{room_name}"
    
    return {
        'meeting_link': jitsi_link,
        'provider': 'jitsi',
        'instructions': 'Click to join - no account required'
    }


def generate_google_meet_instant_link():
    """
    Generate a Google Meet instant meeting link
    No authentication required - anyone can create these
    """
    # Google Meet allows instant meetings via meet.google.com/new
    # This creates a temporary meeting room
    return {
        'meeting_link': 'https://meet.google.com/new',
        'provider': 'google_meet_instant',
        'instructions': 'Click to create instant meeting'
    }


def generate_zoom_link(meeting_id=None):
    """
    Generate Zoom meeting link
    User can paste their personal meeting ID
    """
    if meeting_id:
        return {
            'meeting_link': f'https://zoom.us/j/{meeting_id}',
            'provider': 'zoom',
            'instructions': 'Join Zoom meeting'
        }
    return None


def generate_teams_link(meeting_url=None):
    """
    Generate Microsoft Teams link
    User can paste their Teams meeting URL
    """
    if meeting_url:
        return {
            'meeting_link': meeting_url,
            'provider': 'teams',
            'instructions': 'Join Teams meeting'
        }
    return None
