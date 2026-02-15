import os
import sys
import django
from datetime import timedelta
from django.utils import timezone

# Add project root to path
sys.path.append(r'f:\BRRI\agenda-project-tracker-website')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agenda_project.settings')
django.setup()

from agendas.models import Notification, Agenda, Project
from django.contrib.auth.models import User

def run():
    # Get user 'niaz'
    try:
        user = User.objects.get(username='niaz')
    except User.DoesNotExist:
        print("User 'niaz' not found. Available users:")
        for u in User.objects.all():
            print(f"- {u.username}")
        user = User.objects.first()
        print(f"Fallback: Creating notifications for '{user.username}' instead.")

    if not user:
        print("No users found in database.")
        return

    print(f"Creating dummy archived notifications for user: {user.username}")

    # specific dummy data
    dummies = [
        {
            "type": "agenda_overdue",
            "title": "Task Overdue: 'Annual Report'",
            "message": "The task 'Annual Report' was due on Oct 12, 2023.",
            "days_ago": 2,
        },
        {
            "type": "project_created",
            "title": "New Project: 'Website Redesign'",
            "message": "You created a new project 'Website Redesign'.",
            "days_ago": 5,
        },
        {
            "type": "collaborator_added",
            "title": "Collaborator Joined",
            "message": "Sarah Jones joined the project 'Marketing Campaign'.",
            "days_ago": 7,
        },
        {
            "type": "agenda_updated",
            "title": "Meeting Rescheduled",
            "message": "The 'Weekly Sync' meeting was moved to 3:00 PM.",
            "days_ago": 1, 
            "hours_ago": 26 # Just over 24h
        },
         {
            "type": "deadline_warning",
            "title": "Upcoming Deadline",
            "message": "Task 'Submit Budget' is due in 2 hours.",
            "days_ago": 10,
        },
         {
            "type": "stagnation",
            "title": "Gentle Reminder",
            "message": "Task 'Review Mockups' hasn't taught yet.",
            "days_ago": 3,
        }
    ]

    count = 0
    for data in dummies:
        # Create notification
        days = data.get('days_ago', 1)
        hours = data.get('hours_ago', 0)
        
        past_time = timezone.now() - timedelta(days=days, hours=hours)
        
        notif = Notification.objects.create(
            user=user,
            title=data['title'],
            message=data['message'],
            notification_type=data['type'],
            is_read=True, # Archived usually read, but not strictly required
        )
        # Manually set created_at because auto_now_add overrides it on save()
        notif.created_at = past_time
        notif.save()
        
        print(f"Created: {notif.title} ({past_time.strftime('%Y-%m-%d')})")
        count += 1
        
    print(f"Successfully created {count} archived notifications.")

if __name__ == '__main__':
    run()
