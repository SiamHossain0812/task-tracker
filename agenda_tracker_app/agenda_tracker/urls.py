from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    # Any other frontend-specific routes can be added here
]
