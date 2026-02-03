from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import api_views
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
    
    # Custom API endpoints
    path('dashboard/', api_views.DashboardAPIView.as_view(), name='api-dashboard'),
    path('calendar/', api_views.CalendarAPIView.as_view(), name='api-calendar'),
    path('search/', api_views.SearchAPIView.as_view(), name='api-search'),
    path('analytics/', api_views.AnalyticsAPIView.as_view(), name='api-analytics'),
    
    # Authentication endpoints
    path('auth/register/', api_views.register_user, name='api-register'),
    path('auth/login/', api_views.login_user, name='api-login'),
    path('auth/user/', api_views.current_user, name='api-current-user'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='api-token-refresh'),
]
