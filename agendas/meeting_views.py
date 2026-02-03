from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Agenda
from .simple_meeting import generate_simple_meet_link


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_meeting_link(request, agenda_id):
    """
    Generate a free meeting link for an agenda (no Google Cloud needed)
    Uses Jitsi Meet - 100% free, no account required
    """
    try:
        agenda = Agenda.objects.get(id=agenda_id)
    except Agenda.DoesNotExist:
        return Response({'error': 'Agenda not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Generate Jitsi Meet link
    result = generate_simple_meet_link(agenda)
    
    # Save to agenda
    agenda.meeting_link = result['meeting_link']
    agenda.save()
    
    return Response({
        'meeting_link': result['meeting_link'],
        'provider': result['provider'],
        'instructions': result['instructions']
    }, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_meeting_link(request, agenda_id):
    """Remove meeting link from agenda"""
    try:
        agenda = Agenda.objects.get(id=agenda_id)
        agenda.meeting_link = ''
        agenda.save()
        return Response({'success': True}, status=status.HTTP_200_OK)
    except Agenda.DoesNotExist:
        return Response({'error': 'Agenda not found'}, status=status.HTTP_404_NOT_FOUND)
