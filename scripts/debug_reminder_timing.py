import os
import django
from django.utils import timezone
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agenda_project.settings')
django.setup()

from agendas.models import Schedule
from django.contrib.auth.models import User

user = User.objects.get(username='niaz')
now = timezone.now()
local_now = timezone.localtime(now)

print(f"DEBUG_START")
print(f"Server Time (UTC): {now}")
print(f"Local Time: {local_now}")

schedules = Schedule.objects.filter(user=user, is_notified=False)
print(f"Schedules (is_notified=False): {schedules.count()}")

for s in schedules:
    # Combine date and time to get local aware datetime
    # Note: combine creates naive datetime
    naive_dt = datetime.combine(s.date, s.start_time)
    schedule_dt = timezone.make_aware(naive_dt)
    
    diff = schedule_dt - local_now
    in_window = local_now < schedule_dt and diff <= timedelta(minutes=30)
    
    print(f"ID: {s.id} | Subject: {s.subject}")
    print(f"  Start: {s.start_time} | Date: {s.date}")
    print(f"  Schedule DT: {schedule_dt}")
    print(f"  Diff: {diff}")
    print(f"  In Window? {in_window}")

print(f"DEBUG_END")
