from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
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


class AgendaViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Agenda CRUD operations
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['date', 'time', 'created_at', 'priority']
    ordering = ['date', 'time']
    
    def get_queryset(self):
        """Filter agendas with query parameters"""
        queryset = Agenda.objects.all().select_related('project').prefetch_related('collaborators')
        
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
        
        return queryset
    
    def get_serializer_class(self):
        """Use different serializers for list vs detail"""
        if self.action == 'list':
            return AgendaListSerializer
        return AgendaDetailSerializer
    
    @action(detail=True, methods=['post'])
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


class DashboardAPIView(APIView):
    """
    API endpoint for dashboard statistics
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get dashboard data"""
        # Get all projects with stats
        projects = Project.objects.all()
        
        # Get agenda statistics
        total_agendas = Agenda.objects.count()
        completed_agendas = Agenda.objects.filter(status='completed').count()
        pending_agendas = Agenda.objects.filter(status='pending').count()
        in_progress_agendas = Agenda.objects.filter(status='in-progress').count()
        
        # Get overdue agendas
        all_agendas = Agenda.objects.exclude(status='completed')
        overdue_agendas = [agenda for agenda in all_agendas if agenda.is_overdue]
        
        # Get today's agendas
        today = timezone.now().date()
        today_agendas = Agenda.objects.filter(date=today)
        
        # Get recent agendas
        recent_agendas = Agenda.objects.all().order_by('-created_at')[:10]
        
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
        
        # Search agendas
        agendas = Agenda.objects.filter(
            Q(title__icontains=query) | Q(description__icontains=query)
        )
        
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
        # Get all projects with agenda counts
        projects = Project.objects.annotate(
            total=Count('agendas'),
            completed=Count('agendas', filter=Q(agendas__status='completed')),
            pending=Count('agendas', filter=Q(agendas__status='pending')),
            in_progress=Count('agendas', filter=Q(agendas__status='in-progress'))
        )
        
        # Get agenda status distribution
        status_distribution = {
            'completed': Agenda.objects.filter(status='completed').count(),
            'in_progress': Agenda.objects.filter(status='in-progress').count(),
            'pending': Agenda.objects.filter(status='pending').count(),
        }
        
        # Get priority distribution
        priority_distribution = {
            'high': Agenda.objects.filter(priority='high').count(),
            'medium': Agenda.objects.filter(priority='medium').count(),
            'low': Agenda.objects.filter(priority='low').count(),
        }
        
        # Get completion trend (last 30 days)
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        completed_by_date = {}
        for i in range(30):
            date = thirty_days_ago + timedelta(days=i)
            count = Agenda.objects.filter(
                status='completed',
                updated_at__date=date
            ).count()
            completed_by_date[str(date)] = count
        
        return Response({
            'projects': [{
                'id': p.id,
                'name': p.name,
                'color': p.color,
                'total': p.total,
                'completed': p.completed,
                'pending': p.pending,
                'in_progress': p.in_progress,
                'progress_percent': int((p.completed / p.total * 100) if p.total > 0 else 0)
            } for p in projects],
            'status_distribution': status_distribution,
            'priority_distribution': priority_distribution,
            'completion_trend': completed_by_date,
        })


# Authentication Views
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Register a new user"""
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
    
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name
    )
    
    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'user': UserSerializer(user).data,
        'tokens': {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """Login user and return JWT tokens"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    
    if user is None:
        return Response(
            {'error': 'Invalid credentials'},
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
    return Response(UserSerializer(request.user).data)
