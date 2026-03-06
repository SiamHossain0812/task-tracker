import os
import django
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agenda_project.settings')
django.setup()

from agendas.models import Notification
from django.contrib.auth.models import User

user = User.objects.get(username='niaz')
now = timezone.now()
threshold = now - timedelta(hours=24)

print(f"USER: {user.username} (ID: {user.id})")
print(f"NOW: {now}")
print(f"THRESHOLD: {threshold}")

qs_all = Notification.objects.filter(user=user)
print(f"ALL_COUNT: {qs_all.count()}")

qs_recent = Notification.objects.filter(user=user, created_at__gte=threshold)
print(f"RECENT_COUNT: {qs_recent.count()}")

for n in qs_recent:
    print(f"ID: {n.id} | Created: {n.created_at} | Type: {n.notification_type}")
