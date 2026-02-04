from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import api_views
from . import push_views
from . import profile_views
from .notification_views import NotificationViewSet

# Create router for ViewSets
router = DefaultRouter()
router.register(r'projects', api_views.ProjectViewSet, basename='project')
router.register(r'agendas', api_views.AgendaViewSet, basename='agenda')
router.register(r'collaborators', api_views.CollaboratorViewSet, basename='collaborator')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    # Router URLs
    path('', include(router.urls)),
    
    # Profile management
    path('auth/profile/', profile_views.get_profile, name='api-profile-get'),
    path('auth/profile/update/', profile_views.update_profile, name='api-profile-update'),
    path('auth/password/change/', profile_views.change_password, name='api-password-change'),
    
    # Custom API endpoints
    path('dashboard/', api_views.DashboardAPIView.as_view(), name='api-dashboard'),
    path('tasks/overview/', api_views.TasksOverviewAPIView.as_view(), name='api-tasks-overview'),
    path('calendar/', api_views.CalendarAPIView.as_view(), name='api-calendar'),
    path('search/', api_views.SearchAPIView.as_view(), name='api-search'),
    path('analytics/', api_views.AnalyticsAPIView.as_view(), name='api-analytics'),
    path('alerts/check/', api_views.AlertCheckView.as_view(), name='api-alerts-check'),
    path('push/subscribe/', push_views.subscribe_push, name='api-push-subscribe'),
    
    # Authentication endpoints
    path('auth/register/', api_views.register_user, name='api-register'),
    path('auth/login/', api_views.login_user, name='api-login'),
    path('auth/pending/', api_views.get_pending_requests, name='api-pending-requests'),
    path('auth/approve/<int:user_id>/', api_views.approve_user, name='api-approve-user'),
    path('auth/user/', api_views.current_user, name='api-current-user'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='api-token-refresh'),
    
    
    # Export
    path('export/past-work-pdf/', api_views.export_past_work_pdf, name='api-export-pdf'),
]

