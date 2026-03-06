import os
import django
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agenda_project.settings')
django.setup()

from agendas.models import Notification

print(f"Current server time (aware): {timezone.now()}")
threshold = timezone.now() - timedelta(hours=24)
print(f"Threshold (24h ago): {threshold}")

for n in Notification.objects.all().order_by('-created_at'):
    print(f"ID: {n.id}, User: {n.user.username}, Created: {n.created_at}, Recent: {n.created_at >= threshold}")
