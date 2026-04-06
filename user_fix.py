import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agenda_project.settings')
django.setup()

from django.contrib.auth.models import User
from agendas.models import Collaborator, UserProfile
from agendas.utils import ensure_user_profile_sync

def fix_orphans():
    print("--- Starting User-Collaborator Sync Cleanup ---")
    
    # 1. Fix Users without Collaborators/Profiles
    all_users = User.objects.all()
    print(f"Checking {all_users.count()} users...")
    
    fixed_count = 0
    for user in all_users:
        if not hasattr(user, 'collaborator_profile') or not hasattr(user, 'profile'):
            print(f"Fixing missing profiles for: {user.username}")
            ensure_user_profile_sync(user)
            fixed_count += 1
            
    print(f"Fixed {fixed_count} users with missing profiles.")
    
    # 2. Identify Collaborators without Users (these are usually manually added contacts)
    orphaned_collabs = Collaborator.objects.filter(user__isnull=True)
    if orphaned_collabs.exists():
        print(f"\nFound {orphaned_collabs.count()} collaborators without associated User accounts:")
        for collab in orphaned_collabs:
            print(f" - {collab.name} ({collab.whatsapp_number or 'No Phone'})")
        print("Note: These are 'Contact-only' collaborators and will not be able to log in until they register.")
    
    print("\n--- Cleanup Complete ---")

if __name__ == "__main__":
    fix_orphans()
