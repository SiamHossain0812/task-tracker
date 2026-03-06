import os
import django
from django.utils import timezone
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agenda_project.settings')
django.setup()

from agendas.models import Schedule, Notification
from django.contrib.auth.models import User
from agendas.utils import check_and_create_alerts

user = User.objects.get(username='niaz')
now = timezone.now()
local_now = timezone.localtime(now)

print(f"TRACE_START")
print(f"Now: {now} | LocalNow: {local_now}")

schedules = Schedule.objects.filter(user=user, is_notified=False)
print(f"Eligible schedules: {schedules.count()}")

for s in schedules:
    naive_dt = datetime.combine(s.date, s.start_time)
    schedule_dt = timezone.make_aware(naive_dt)
    diff = schedule_dt - local_now
    
    cond1 = local_now < schedule_dt
    cond2 = diff <= timedelta(minutes=30)
    
    print(f"ID: {s.id} | Sub: {s.subject}")
    print(f"  ScheduleDT: {schedule_dt}")
    print(f"  Condition 1 (IsAfterNow): {cond1}")
    print(f"  Condition 2 (In30mWindow): {cond2}")
    print(f"  Diff: {diff}")

print(f"Result of call: {check_and_create_alerts(user)}")
print(f"TRACE_END")
