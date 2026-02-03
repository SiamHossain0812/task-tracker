from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import OperationalError
from .models import PushSubscription
import time

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def subscribe_push(request):
    """
    Register a device's push notification subscription
    """
    subscription_data = request.data.get('subscription')
    if not subscription_data:
        return Response({'error': 'Subscription data is required'}, status=status.HTTP_400_BAD_REQUEST)

    endpoint = subscription_data.get('endpoint')
    keys = subscription_data.get('keys', {})
    p256dh = keys.get('p256dh')
    auth = keys.get('auth')

    if not endpoint or not p256dh or not auth:
        return Response({'error': 'Invalid subscription data'}, status=status.HTTP_400_BAD_REQUEST)

    # Retry logic for database locked errors
    max_retries = 3
    for attempt in range(max_retries):
        try:
            # Update or create subscription
            PushSubscription.objects.update_or_create(
                endpoint=endpoint,
                defaults={
                    'user': request.user,
                    'p256dh': p256dh,
                    'auth': auth,
                }
            )
            return Response({'status': 'Subscription saved'}, status=status.HTTP_201_CREATED)
        except OperationalError as e:
            if 'database is locked' in str(e) and attempt < max_retries - 1:
                # Wait with exponential backoff before retrying
                time.sleep(0.1 * (2 ** attempt))
                continue
            # If final attempt or different error, return error response
            return Response(
                {'error': 'Failed to save subscription. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

