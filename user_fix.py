import os
import django
import sys

# Setup Django environment
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agenda_project.settings')
django.setup()

from django.contrib.auth.models import User
from agendas.models import Collaborator

def find_broken_users():
    """Find users who do not have a linked Collaborator profile."""
    broken_users = []
    for user in User.objects.all():
        if not hasattr(user, 'collaborator_profile'):
            broken_users.append(user)
    return broken_users

def main():
    print("=== Agenda Tracker User Repair Tool ===")
    
    broken_users = find_broken_users()
    
    if not broken_users:
        print("No broken users (Users without Collaborator profiles) found. Your database is clean.")
        return

    print(f"Found {len(broken_users)} broken user(s):")
    for user in broken_users:
        print(f" - ID: {user.id}, Username: {user.username}, Email: {user.email}, Name: {user.get_full_name()}")

    print("\nHow would you like to proceed?")
    print("1. Delete these broken users (Recommended if they want to re-register)")
    print("2. Create missing Collaborator profiles for them")
    print("3. Do nothing and exit")
    
    choice = input("\nEnter choice (1/2/3): ").strip()
    
    if choice == '1':
        confirm = input(f"Are you sure you want to DELETE {len(broken_users)} user(s)? (y/n): ").strip().lower()
        if confirm == 'y':
            for user in broken_users:
                username = user.username
                user.delete()
                print(f"Deleted user: {username}")
            print("Successfully cleaned up broken users.")
        else:
            print("Deletion cancelled.")
            
    elif choice == '2':
        confirm = input(f"Are you sure you want to create profiles for {len(broken_users)} user(s)? (y/n): ").strip().lower()
        if confirm == 'y':
            for user in broken_users:
                fullname = f"{user.first_name} {user.last_name}".strip() or user.username
                Collaborator.objects.create(
                    user=user,
                    name=fullname,
                    email=user.email,
                    whatsapp_number=user.username
                )
                print(f"Created collaborator profile for: {user.username}")
            print("Successfully repaired broken users.")
        else:
            print("Repair cancelled.")
    else:
        print("Exiting without changes.")

if __name__ == "__main__":
    main()
