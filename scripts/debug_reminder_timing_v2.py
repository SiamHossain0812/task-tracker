import os
import django
from django.utils import timezone
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agenda_project.settings')
django.setup()

from agendas.models import Schedule, Notification
from django.contrib.auth.models import User

user = User.objects.get(username='niaz')
now = timezone.now()
local_now = timezone.localtime(now)

print(f"DEBUG_START")
print(f"Current Date: {local_now.date()}")
print(f"Local Time: {local_now}")

# Check all schedules for today to see status
schedules = Schedule.objects.filter(user=user, date=local_now.date())
print(f"Total schedules for today: {schedules.count()}")

for s in schedules:
    naive_dt = datetime.combine(s.date, s.start_time)
    schedule_dt = timezone.make_aware(naive_dt)
    
    diff = schedule_dt - local_now
    # The actual logic in utils.py:
    # if local_now < schedule_dt and (schedule_dt - local_now) <= timedelta(minutes=30):
    
    is_after_now = local_now < schedule_dt
    is_in_30m = diff <= timedelta(minutes=30)
    
    print(f"--- ID: {s.id} | {s.subject} ---")
    print(f"  Start: {s.start_time} | ScheduleDT: {schedule_dt}")
    print(f"  IsNotified: {s.is_notified}")
    print(f"  IsAfterNow: {is_after_now}")
    print(f"  IsIn30m: {is_in_30m}")
    print(f"  Diff: {diff}")
    
    # Check if a notification already exists for this schedule
    notifs = Notification.objects.filter(related_schedule=s)
    print(f"  Existing Notifications: {notifs.count()}")
    for n in notifs:
        print(f"    - Title: {n.title} | Type: {n.notification_type} | Created: {n.created_at}")

print(f"DEBUG_END")
