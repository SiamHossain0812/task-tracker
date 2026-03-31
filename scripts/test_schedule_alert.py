import os
import sys
import django
from datetime import timedelta
from django.utils import timezone
from datetime import time

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "agenda_project.settings")
django.setup()

from django.contrib.auth import get_user_model
from agendas.models import Schedule, Notification
from agendas.utils import check_and_create_alerts

User = get_user_model()

def test_schedule_48h_alert():
    print("--- Testing 48h Schedule Reminder Alert ---")
    
    # 1. Setup Dummy Test User
    email = "test_sched48@example.com"
    user, created = User.objects.get_or_create(email=email, defaults={'username': "test_sched48", 'is_active': True})
    
    if created:
        user.set_password("password123")
        user.save()
        
    print(f"User: {user.email}")
    
    # Clean old test data
    Schedule.objects.filter(user=user).delete()
    Notification.objects.filter(user=user).delete()
    
    # 2. Setup the target time scenario
    # Current time
    now_localtime = timezone.localtime(timezone.now())
    # Create an end_datetime that is exactly 47.5 hours from now
    target_end_dt = now_localtime + timedelta(hours=47, minutes=30)
    
    target_date = target_end_dt.date()
    target_end_time = target_end_dt.time()
    
    print(f"Now local: {now_localtime}")
    print(f"Target End: {target_end_dt} (in 47.5 hours)")

    # 3. Create a Schedule ending at that target time
    sched1 = Schedule.objects.create(
        user=user,
        subject="Important 48h Review",
        date=target_date,
        end_time=target_end_time,
        status="undone"
    )
    print(f"Created Schedule: {sched1.subject} on {sched1.date} ending at {sched1.end_time}")

    # 4. Create another Schedule ending in 72 hours (should NOT trigger)
    target_72_dt = now_localtime + timedelta(hours=72)
    sched2 = Schedule.objects.create(
        user=user,
        subject="Future 72h Review",
        date=target_72_dt.date(),
        end_time=target_72_dt.time(),
        status="undone"
    )

    # 5. Run the alert checker
    print("\nRunning check_and_create_alerts()...")
    result = check_and_create_alerts(user)
    
    print(f"Alerts created output: {result['alerts_created']}")
    for alert in result['alerts']:
        print(f"  -> {alert['type']}: {alert['title']}")

    # 6. Verify Notifications in DB
    print("\n--- Verification ---")
    nots_48h = Notification.objects.filter(user=user, notification_type='schedule_48h_warning')
    if nots_48h.exists():
        print(f"SUCCESS: Found ({nots_48h.count()}) 48h warning(s).")
        for n in nots_48h:
             print(f"  DB Note: {n.title} -> {n.message} (Schedule ID: {n.related_schedule.id})")
             if n.related_schedule.id == sched1.id:
                 print("  -> Correctly matched the 47.5h schedule!")
             else:
                 print("  ERROR: Matched the wrong schedule.")
    else:
        print("FAILED: No 48h warnings were created.")
        
    # Check that running it again does NOT duplicate
    print("\nRunning again to test duplication avoidance...")
    result2 = check_and_create_alerts(user)
    if not any(a['type'] == 'schedule_48h_warning' for a in result2['alerts']):
        print("SUCCESS: No duplicate warnings created.")
    else:
        print("ERROR: Duplicate warnings were created!")

    # Cleanup
    Schedule.objects.filter(user=user).delete()
    user.delete()
    print("Test run completed. Cleanup done.")

if __name__ == "__main__":
    test_schedule_48h_alert()
