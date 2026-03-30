import os
import django
import sys
import uuid

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agenda_project.settings')
django.setup()

from django.contrib.auth.models import User
from agendas.models import Collaborator, UserProfile

def verify_automation():
    print("--- BRRI Agenda: User Automation Verification ---")
    
    uid = str(uuid.uuid4())[:8]
    username = f'017{uid}99' # Looks like a phone number
    email = f'user_{uid}@example.com'
    first_name = "Automation"
    last_name = "Test"
    
    print(f"1. Creating User: {username}")
    user = User.objects.create_user(
        username=username,
        email=email,
        password='password123',
        first_name=first_name,
        last_name=last_name
    )
    
    # 2. Check UserProfile
    try:
        profile = user.profile
        print(f"   [SUCCESS] UserProfile created automatically. Phone: {profile.phone_number}")
        if profile.phone_number == username:
            print("   [SUCCESS] Phone number correctly synced from username.")
        else:
            print(f"   [WARNING] Phone number ({profile.phone_number}) does not match username.")
    except Exception as e:
        print(f"   [FAILURE] UserProfile NOT created: {e}")
        
    # 3. Check Collaborator
    try:
        collab = user.collaborator_profile
        print(f"   [SUCCESS] Collaborator created automatically. Name: {collab.name}")
        if collab.whatsapp_number == username:
             print("   [SUCCESS] WhatsApp number correctly synced from username.")
        if collab.email == email:
             print("   [SUCCESS] Email correctly synced.")
        if collab.name == f"{first_name} {last_name}":
             print("   [SUCCESS] Full name correctly synced.")
    except Exception as e:
        print(f"   [FAILURE] Collaborator NOT created: {e}")
        
    print("\nVerification Complete.")

if __name__ == "__main__":
    verify_automation()
