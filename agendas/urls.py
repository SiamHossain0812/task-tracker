from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('calendar/', views.calendar_view, name='calendar_view'),
    path('undone/', views.undone_tasks, name='undone_tasks'),
    path('search/', views.search, name='search'),
    path('about/', views.about, name='about'),
    
    # Project URLs
    path('project/create/', views.project_create, name='project_create'),
    path('project/analytics/', views.project_analytics, name='project_analytics'),
    path('project/<int:pk>/edit/', views.project_edit, name='project_edit'),
    path('project/<int:pk>/delete/', views.project_delete, name='project_delete'),
    
    # Agenda URLs
    path('agenda/create/', views.agenda_create, name='agenda_create_global'),
    path('project/<int:project_pk>/agenda/create/', views.agenda_create, name='agenda_create'),
    path('agenda/<int:pk>/edit/', views.agenda_edit, name='agenda_edit'),
    path('agenda/<int:pk>/delete/', views.agenda_delete, name='agenda_delete'),
    path('agenda/<int:pk>/toggle/', views.agenda_toggle_status, name='agenda_toggle'),
    
    # Collaborator URLs
    path('collaborators/', views.collaborator_list, name='collaborator_list'),
    path('user/<int:pk>/approve/', views.approve_user, name='approve_user'),
    path('collaborators/create/', views.collaborator_create, name='collaborator_create'),
    path('collaborators/api/create/', views.api_collaborator_create, name='api_collaborator_create'),
    path('collaborators/<int:pk>/edit/', views.collaborator_edit, name='collaborator_edit'),
    path('collaborators/<int:pk>/delete/', views.collaborator_delete, name='collaborator_delete'),
    
    # Export URLs
    path('export/pdf/', views.export_past_work_pdf, name='export_past_work_pdf'),
]
