from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission

class IsSuperUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_superuser)

from django.db.models import Q, Count
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import datetime, timedelta
from django.utils import timezone

from .models import Project, Agenda, Collaborator
from .serializers import (
    ProjectSerializer, AgendaListSerializer, AgendaDetailSerializer,
    CollaboratorSerializer, UserSerializer
)
from .utils import check_and_create_alerts


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Project CRUD operations
    """
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']
    pagination_class = None

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsSuperUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = Project.objects.all()
        # User Isolation: Collaborators only see projects they have tasks in
        if not self.request.user.is_superuser:
            queryset = queryset.filter(agendas__collaborators__user=self.request.user).distinct()
        return queryset


class AgendaViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Agenda CRUD operations
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['date', 'time', 'created_at', 'priority']
    ordering = ['date', 'time']

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsSuperUser()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Filter agendas with query parameters"""
        queryset = Agenda.objects.all().select_related('project').prefetch_related('collaborators')
        
        # User Isolation: Collaborators only see their assigned tasks
        if not self.request.user.is_superuser:
            queryset = queryset.filter(collaborators__user=self.request.user).distinct()
        
        # Filter by project
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by priority
        priority = self.request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        # Filter overdue
        overdue = self.request.query_params.get('overdue')
        if overdue == 'true':
            now = timezone.now()
            queryset = [agenda for agenda in queryset if agenda.is_overdue]
        
        # Filter by category (uses calculated_category if manual category not set)
        category = self.request.query_params.get('category')
        if category:
            queryset = [agenda for agenda in queryset if (agenda.category or agenda.calculated_category) == category]
            
        # Filter by type
        type_filter = self.request.query_params.get('type')
        if type_filter:
            if isinstance(queryset, list):
                queryset = [agenda for agenda in queryset if agenda.type == type_filter]
            else:
                queryset = queryset.filter(type=type_filter)
        
        return queryset
    
    def get_serializer_class(self):
        """Use different serializers for list vs detail"""
        if self.action == 'list':
            return AgendaListSerializer
        return AgendaDetailSerializer
    
    @action(detail=True, methods=['post'], url_path='toggle')
    def toggle_status(self, request, pk=None):
        """Toggle agenda status between pending, in-progress, and completed"""
        agenda = self.get_object()
        current_status = agenda.status
        
        # Cycle through statuses
        status_cycle = {
            'pending': 'in-progress',
            'in-progress': 'completed',
            'completed': 'pending'
        }
        
        agenda.status = status_cycle.get(current_status, 'pending')
        agenda.save()
        
        serializer = self.get_serializer(agenda)
        return Response(serializer.data)

    def perform_create(self, serializer):
        """Override to notify collaborators on creation"""
        agenda = serializer.save()
        self.notify_collaborators(agenda, is_new=True)

    def perform_update(self, serializer):
        """Override to notify newly added collaborators"""
        # Logic to detect new collaborators is tricky in perform_update because
        # the M2M relation is set *after* the instance is saved in standard DRF.
        # However, AgendaDetailSerializer handles M2M manually in Update().
        # So we should rely on the serializer to return the instance and then check.
        # But perform_update just calls serializer.save().
        
        # Let's handle notification trigger in the Serializer's update() method instead?
        # Or just simple 'notify all' here for now to ensure coverage.
        # Given the requirements, let's notify all current collaborators about the update.
        agenda = serializer.save()
        self.notify_collaborators(agenda, is_new=False)

    def notify_collaborators(self, agenda, is_new=True):
        """Helper to send instant notifications to collaborators"""
        # Only if current user is admin? User asked: "if admin creates a task"
        if not self.request.user.is_superuser:
            return

        from .models import Notification
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync

        try:
            channel_layer = get_channel_layer()

            for collaborator in agenda.collaborators.all():
                if not collaborator.user:
                    continue
                    
                if agenda.type == 'meeting':
                    title = "New Meeting Invite" if is_new else "Meeting Updated"
                    message = f"You have been invited to the meeting: '{agenda.title}'." if is_new else f"Details for '{agenda.title}' have been recently updated."
                    notif_type = 'meeting_invite' if is_new else 'meeting_updated'
                else:
                    title = "New Assignment" if is_new else "Task Update"
                    message = f"You've been assigned to the initiative: '{agenda.title}'." if is_new else f"There are new developments regarding: '{agenda.title}'."
                    notif_type = 'collaborator_added' if is_new else 'agenda_updated'
                
                # Avoid dupes?
                # For "Instant", dupes might be okay if verified updates, but let's be safe.
                notification = Notification.objects.create(
                    user=collaborator.user,
                    title=title,
                    message=message,
                    notification_type=notif_type,
                    related_agenda=agenda,
                    related_project=agenda.project
                )
                
                try:
                    if channel_layer:
                        async_to_sync(channel_layer.group_send)(
                            f'notifications_{collaborator.user.id}',
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
                except Exception:
                    pass  # WebSocket push failed silently

                # Trigger Native Push Notification
                try:
                    from .utils import send_push_notification
                    send_push_notification(
                        user=collaborator.user,
                        title=notification.title,
                        message=notification.message,
                        url=f"/agendas/{agenda.id}/edit"
                    )
                except Exception:
                    pass  # Native push failed silently
        except Exception:
            pass  # Notification logic failed silently

class TasksOverviewAPIView(APIView):
    """
    API endpoint for tasks overview with stats and separated lists
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        agendas = Agenda.objects.all().select_related('project')

        if not user.is_superuser:
            agendas = agendas.filter(collaborators__user=user).distinct()

        # Undone tasks (pending + in-progress)
        all_undone = agendas.filter(status__in=['pending', 'in-progress']).order_by('date', 'time')
        
        # Today's completed tasks
        today = timezone.now().date()
        completed_today = agendas.filter(status='completed', updated_at__date=today).order_by('-updated_at')

        # Stats
        pending_count = agendas.filter(status='pending').count()
        in_progress_count = agendas.filter(status='in-progress').count()
        high_priority_count = agendas.filter(status__in=['pending', 'in-progress'], priority='high').count()
        completed_today_count = completed_today.count()

        return Response({
            'all_undone': AgendaListSerializer(all_undone, many=True, context={'request': request}).data,
            'completed_today': AgendaListSerializer(completed_today, many=True, context={'request': request}).data,
            'pending_count': pending_count,
            'in_progress_count': in_progress_count,
            'high_priority_count': high_priority_count,
            'completed_today_count': completed_today_count
        })

class AlertCheckView(APIView):
    """
    Endpoint to manually trigger alert checks for the current user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        result = check_and_create_alerts(request.user)
        return Response(result)


class CollaboratorViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Collaborator CRUD operations
    """
    queryset = Collaborator.objects.all()
    serializer_class = CollaboratorSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'institute', 'email']
    ordering_fields = ['created_at', 'name']
    ordering = ['name']
    pagination_class = None


class DashboardAPIView(APIView):
    """
    API endpoint for dashboard statistics
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get dashboard data"""
        # Get all projects with stats
        projects = Project.objects.all()

        # User Isolation for Projects
        if not request.user.is_superuser:
            projects = projects.filter(agendas__collaborators__user=request.user).distinct()
        
        # Get agenda statistics
        all_agendas_qs = Agenda.objects.all()
        
        # User Isolation
        if not request.user.is_superuser:
            all_agendas_qs = all_agendas_qs.filter(collaborators__user=request.user).distinct()
            # For projects, maybe filtered too? Or show all projects but only relevant stats?
            # Let's show all projects for visibility, but stats within them will be personal.
        
        total_agendas = all_agendas_qs.count()
        completed_agendas = all_agendas_qs.filter(status='completed').count()
        pending_agendas = all_agendas_qs.filter(status='pending').count()
        in_progress_agendas = all_agendas_qs.filter(status='in-progress').count()
        
        # Get overdue agendas
        overdue_agendas = [agenda for agenda in all_agendas_qs if agenda.status != 'completed' and agenda.is_overdue]
        
        # Get today's agendas
        today = timezone.now().date()
        today_agendas = all_agendas_qs.filter(date=today)
        
        # Get recent agendas
        recent_agendas = all_agendas_qs.order_by('-created_at')[:10]
        
        return Response({
            'projects': ProjectSerializer(projects, many=True).data,
            'stats': {
                'total_agendas': total_agendas,
                'completed_agendas': completed_agendas,
                'pending_agendas': pending_agendas,
                'in_progress_agendas': in_progress_agendas,
                'overdue_count': len(overdue_agendas),
                'today_count': today_agendas.count(),
            },
            'recent_agendas': AgendaListSerializer(recent_agendas, many=True, context={'request': request}).data,
            'overdue_agendas': AgendaListSerializer(overdue_agendas, many=True, context={'request': request}).data,
        })


class CalendarAPIView(APIView):
    """
    API endpoint for calendar events
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get calendar events for a date range"""
        # Get date range from query params
        start_date = request.query_params.get('start')
        end_date = request.query_params.get('end')
        
        queryset = Agenda.objects.all()
        
        # User Isolation
        if not request.user.is_superuser:
            queryset = queryset.filter(collaborators__user=request.user).distinct()
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        # Format for calendar component
        events = []
        for agenda in queryset:
            event = {
                'id': agenda.id,
                'title': agenda.title,
                'start': str(agenda.date),
                'end': str(agenda.expected_finish_date or agenda.date),
                'color': agenda.project.color if agenda.project else 'indigo',
                'status': agenda.status,
                'priority': agenda.priority,
                'is_overdue': agenda.is_overdue,
            }
            
            # Add time if available
            if agenda.time:
                event['start'] += f'T{agenda.time}'
            if agenda.expected_finish_time:
                event['end'] += f'T{agenda.expected_finish_time}'
            
            events.append(event)
        
        return Response(events)


class SearchAPIView(APIView):
    """
    Global search across projects and agendas
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Search for projects and agendas"""
        query = request.query_params.get('q', '')
        
        if not query:
            return Response({'projects': [], 'agendas': []})
        
        # Search projects
        projects = Project.objects.filter(
            Q(name__icontains=query) | Q(description__icontains=query)
        )
        
        # User Isolation
        if not request.user.is_superuser:
            projects = projects.filter(agendas__collaborators__user=request.user).distinct()
        
        # Search agendas
        agendas = Agenda.objects.filter(
            Q(title__icontains=query) | Q(description__icontains=query)
        )
        
        # User Isolation
        if not request.user.is_superuser:
            agendas = agendas.filter(collaborators__user=request.user).distinct()
        
        return Response({
            'projects': ProjectSerializer(projects, many=True).data,
            'agendas': AgendaListSerializer(agendas, many=True, context={'request': request}).data,
        })


class AnalyticsAPIView(APIView):
    """
    API endpoint for project analytics
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get analytics data"""
        projects = Project.objects.all().prefetch_related('agendas', 'agendas__collaborators', 'agendas__collaborators__user')
        all_agendas = Agenda.objects.all()
        
        # User Isolation
        if not request.user.is_superuser:
            # Filter projects to only those where user has tasks
            projects = projects.filter(agendas__collaborators__user=request.user).distinct()
            # Filter global agendas
            all_agendas = all_agendas.filter(collaborators__user=request.user).distinct()
            # Note: For strict isolation, we should also filter the 'projects' queryset prefetch,
            # but filtering 'all_agendas' covers the global stats.
            # For the per-project stats loop below, we need to filter `p_agendas` manually.
        
        # Calculate global stats
        total_projects = projects.count()
        total_tasks = all_agendas.count()
        completed_tasks = all_agendas.filter(status='completed').count()
        
        # Calculate global progress
        global_progress = 0
        if total_tasks > 0:
            global_progress = int((completed_tasks / total_tasks) * 100)
            
        # Calculate overdue tasks
        overdue_tasks_count = len([a for a in all_agendas if a.is_overdue])
        
        global_stats = {
            'total_projects': total_projects,
            'total_tasks': total_tasks,
            'progress': global_progress,
            'overdue_tasks': overdue_tasks_count
        }
        
        # Calculate projects data
        projects_data = []
        
        for project in projects:
            p_agendas = project.agendas.all()
            
            # User Isolation for project stats
            if not request.user.is_superuser:
                 p_agendas = p_agendas.filter(collaborators__user=request.user).distinct()
            
            # Counts
            completed = p_agendas.filter(status='completed').count()
            pending = p_agendas.filter(status__in=['pending', 'in-progress']).count()
            overdue = len([a for a in p_agendas if a.is_overdue])
            
            # Performance Metric
            # High: > 75% progress
            # Medium: 40% - 75%
            # Low: < 40%
            progress = project.progress_percent
            if progress >= 75:
                performance = 'High'
            elif progress >= 40:
                performance = 'Medium'
            else:
                performance = 'Low'
                
            # Get distinct collaborators for this project
            # Efficiently gather collaborators from agendas without N+1 if possible, 
            # otherwise just iterate. Since we prefetched agendas__collaborators, iterating is safe.
            collaborators_set = set()
            for agenda in p_agendas:
                for collaborator in agenda.collaborators.all():
                    collaborators_set.add(collaborator)
            
            projects_data.append({
                'project': ProjectSerializer(project).data,
                'collaborators': CollaboratorSerializer(list(collaborators_set), many=True, context={'request': request}).data,
                'completed_count': completed,
                'pending_count': pending,
                'overdue_count': overdue,
                'performance': performance
            })
        
        return Response({
            'global_stats': global_stats,
            'projects_data': projects_data
        })


# Authentication Views



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pending_requests(request):
    """Get list of inactive users pending approval (Admin only via UI check, enforcing superuser here)"""
    if not request.user.is_superuser:
        return Response({'error': 'Admin privileges required'}, status=status.HTTP_403_FORBIDDEN)
        
    pending_users = User.objects.filter(is_active=False).order_by('-date_joined')
    return Response(UserSerializer(pending_users, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_user(request, user_id):
    """Approve a pending user (Admin only)"""
    if not request.user.is_superuser:
        return Response({'error': 'Admin privileges required'}, status=status.HTTP_403_FORBIDDEN)
        
    try:
        user = User.objects.get(id=user_id)
        user.is_active = True
        user.save()
        
        # Auto-create empty collaborator profile if not exists
        if not hasattr(user, 'collaborator_profile'):
            fullname = f"{user.first_name} {user.last_name}".strip() or user.username
            Collaborator.objects.create(
                user=user,
                name=fullname,
                email=user.email,
                whatsapp_number=user.username  # Assuming username is phone
            )
            
        return Response({'message': f'User {user.username} approved successfully'})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)




@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])  # Disable SessionAuth to bypass CSRF check
def register_user(request):
    """Register a new user (inactive until approved)"""
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    
    if not username or not password:
        return Response(
            {'error': 'Username and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Username already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create inactive user
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name
    )
    user.is_active = False
    user.save()
    
    return Response({
        'message': 'Registration successful. Account is pending admin approval.',
        'user': UserSerializer(user).data
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def login_user(request):
    """Login user and return JWT tokens"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    
    if user is None:
        # Check if user exists but password matches (or if user doesn't exist)
        # to give specific error messages as requested.
        try:
            existing_user = User.objects.get(username=username)
            if not existing_user.is_active:
                return Response(
                    {'error': 'Your account is pending admin approval. Please wait for confirmation.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            # If user exists and is active, but authenticate failed -> Wrong password
            return Response(
                {'error': 'Invalid password. Please try again.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except User.DoesNotExist:
            return Response(
                {'error': 'Account not found. Please request access first.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
    
    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'user': UserSerializer(user).data,
        'tokens': {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Get current authenticated user"""
    return Response(UserSerializer(request.user, context={'request': request}).data)
