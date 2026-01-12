from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    
    # Project URLs
    path('project/create/', views.project_create, name='project_create'),
    path('project/<int:pk>/edit/', views.project_edit, name='project_edit'),
    path('project/<int:pk>/delete/', views.project_delete, name='project_delete'),
    
    # Agenda URLs
    path('agenda/create/', views.agenda_create, name='agenda_create_global'),
    path('project/<int:project_pk>/agenda/create/', views.agenda_create, name='agenda_create'),
    path('agenda/<int:pk>/edit/', views.agenda_edit, name='agenda_edit'),
    path('agenda/<int:pk>/delete/', views.agenda_delete, name='agenda_delete'),
    path('agenda/<int:pk>/toggle/', views.agenda_toggle_status, name='agenda_toggle'),
]
