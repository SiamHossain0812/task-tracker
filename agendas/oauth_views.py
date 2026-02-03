"""
Google OAuth and Meeting Integration
Handles OAuth flow and Calendar event creation with Google Meet links
"""
import os
from django.shortcuts import redirect
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from google.oauth2.credentials import Credentials
from .models import Agenda, GoogleToken
from .google_calendar import get_oauth_flow, create_calendar_event


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def init_google_auth(request):
    """Start Google OAuth flow"""
    flow = get_oauth_flow()
    
    # Include user ID in state to recover it in callback
    state_data = f"user_id:{request.user.id}"
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent',
        state=state_data
    )
    
    return Response({'authorization_url': authorization_url})


@api_view(['GET'])
def google_auth_callback(request):
    """Handle Google OAuth callback"""
    state_data = request.GET.get('state', '')
    code = request.GET.get('code')
    
    try:
        flow = get_oauth_flow()
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        # Recover user from state
        if state_data.startswith('user_id:'):
            user_id = state_data.split(':')[1]
            from django.contrib.auth.models import User
            user = User.objects.get(id=user_id)
        else:
            return Response({'error': 'Invalid state'}, status=status.HTTP_400_BAD_REQUEST)

        GoogleToken.objects.update_or_create(
            user=user,
            defaults={
                'access_token': credentials.token,
                'refresh_token': credentials.refresh_token,
                'token_uri': credentials.token_uri,
                'client_id': credentials.client_id,
                'client_secret': credentials.client_secret,
                'scopes': ','.join(credentials.scopes),
                'expiry': credentials.expiry
            }
        )
        
        # Redirect back to frontend
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        return redirect(f"{frontend_url}/meetings?auth=success")
        
    except Exception as e:
        return Response({'error': f"Failed to handle callback: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_meeting(request, agenda_id):
    """
    Creates a real Google Meet link via Google Calendar API
    Requires valid Google OAuth tokens
    """
    try:
        agenda = Agenda.objects.get(id=agenda_id)
        
        # Check if user has Google tokens
        try:
            token = GoogleToken.objects.get(user=request.user)
            
            # Check if token is expired
            if token.expiry < timezone.now():
                # We should refresh the token here using refresh_token
                # But for brevity, we'll ask for re-auth if refresh fails or for now
                return Response({'needs_auth': True, 'error': 'Token expired'})
                
            # Create calendar event
            result = create_calendar_event(agenda, token.access_token)
            
            # Update agenda
            agenda.meeting_link = result['meeting_link']
            agenda.google_event_id = result['event_id']
            agenda.save()
            
            return Response({
                'meeting_link': agenda.meeting_link,
                'event_id': agenda.google_event_id,
                'provider': 'google_calendar',
                'message': 'Shared meeting room created successfully'
            }, status=status.HTTP_200_OK)
            
        except GoogleToken.DoesNotExist:
            return Response({
                'needs_auth': True,
                'message': 'Google authentication required'
            }, status=status.HTTP_200_OK)
            
    except Agenda.DoesNotExist:
        return Response({'error': 'Agenda not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_meeting(request, agenda_id):
    """Remove meeting link from agenda"""
    try:
        try:
            agenda = Agenda.objects.get(id=agenda_id)
        except Agenda.DoesNotExist:
            return Response({'error': 'Agenda not found'}, status=status.HTTP_404_NOT_FOUND)
        
        agenda.meeting_link = ''
        agenda.save()
        
        return Response({
            'success': True,
            'message': 'Meeting link removed'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

