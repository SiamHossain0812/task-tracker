import os
import sys
import django

sys.path.append(r'f:\BRRI\agenda-project-tracker-website')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agenda_project.settings')
django.setup()

from django.contrib.auth.models import User
from agendas.models import Notification

def run():
    try:
        user = User.objects.get(username='niaz')
        print(f"User '{user.username}' found (ID: {user.id}).")
        
        count = Notification.objects.filter(user=user).count()
        print(f"Notification count: {count}")
        
        recent = Notification.objects.filter(user=user).order_by('-created_at')[:5]
        for n in recent:
            print(f"- {n.title} ({n.created_at})")
            
    except User.DoesNotExist:
        print("User 'niaz' NOT FOUND.")
        print("Available users:")
        for u in User.objects.all():
            print(f"- {u.username}")

if __name__ == '__main__':
    run()
