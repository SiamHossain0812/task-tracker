import os
import django
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agenda_project.settings')
django.setup()

from agendas.models import Notification

now = timezone.now()
threshold = now - timedelta(hours=24)

print(f"DEBUG_START")
print(f"Server Time: {now}")
print(f"Threshold: {threshold}")

notifications = Notification.objects.all().order_by('-created_at')
print(f"Total Notifications: {len(notifications)}")

for n in notifications[:10]:
    is_recent = n.created_at >= threshold
    print(f"ID={n.id} | User={n.user.username} | Created={n.created_at} | Recent={is_recent} | Type={n.notification_type}")
print(f"DEBUG_END")
