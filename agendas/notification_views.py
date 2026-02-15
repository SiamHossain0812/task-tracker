from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer
from django.utils import timezone
from datetime import timedelta


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Notification CRUD operations
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None
    
    def get_queryset(self):
        """
        Filter notifications for current user.
        Supports `filter` query param:
        - 'recent': last 24 hours (default for bell)
        - 'archived': older than 24 hours
        - 'all': everything
        """
        queryset = Notification.objects.filter(user=self.request.user)
        filter_type = self.request.query_params.get('filter', 'all')
        
        if filter_type == 'recent':
            threshold = timezone.now() - timedelta(hours=24)
            queryset = queryset.filter(created_at__gte=threshold)
        elif filter_type == 'archived':
            threshold = timezone.now() - timedelta(hours=24)
            queryset = queryset.filter(created_at__lt=threshold)
            
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get unread notifications"""
        unread_notifications = self.get_queryset().filter(is_read=False)
        serializer = self.get_serializer(unread_notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'count': count})
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'status': 'all notifications marked as read'})

    @action(detail=False, methods=['post'])
    def clear_archived(self, request):
        """Delete all archived notifications (older than 24h)"""
        # We need to manually filter for archived here because get_queryset depends on query params
        threshold = timezone.now() - timedelta(hours=24)
        count, _ = Notification.objects.filter(user=request.user, created_at__lt=threshold).delete()
        return Response({'status': 'archived notifications cleared', 'count': count})
