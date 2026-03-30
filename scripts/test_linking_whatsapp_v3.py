import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agenda_project.settings')
django.setup()

from django.contrib.auth.models import User
from agendas.models import Collaborator, UserProfile
from scripts.link_collaborators_by_whatsapp import link_profiles

def verify():
    # 1. Setup Test Data (Case A: Success)
    print("Setting up Case A (Success UserProfile match)...")
    import uuid
    uid = str(uuid.uuid4())[:8]
    import random
    phone_a = f'017{random.randint(1000000, 9999999)}'
    ua, _ = User.objects.get_or_create(username=f'user_v3a_{uid}', email=f'v3a_{uid}@example.com')
    profile_a, _ = UserProfile.objects.get_or_create(user=ua)
    profile_a.phone_number = phone_a
    profile_a.save()
    
    collab_a, _ = Collaborator.objects.get_or_create(name=f'Jui V3 Test {uid}', whatsapp_number=phone_a)
    collab_a.user = None
    collab_a.save()
    
    # 2. Setup Test Data (Case B: Conflict)
    print("Setting up Case B (Conflict Check)...")
    # This user already has a linked profile
    phone_b = f'017{random.randint(1000000, 9999999)}'
    ub, _ = User.objects.get_or_create(username=f'user_v3b_{uid}', email=f'v3b_{uid}@example.com')
    profile_b, _ = UserProfile.objects.get_or_create(user=ub)
    profile_b.phone_number = phone_b
    profile_b.save()
    
    already_linked, _ = Collaborator.objects.get_or_create(name=f'Old Profile {uid}', user=ub)
    
    # This new profile has the same number but the user is already taken
    collab_b, _ = Collaborator.objects.get_or_create(name=f'Duplicate Profile {uid}', whatsapp_number=phone_b)
    collab_b.user = None
    collab_b.save()
    
    # 3. Run the linking script V3
    print("\nRunning linking script V3...")
    link_profiles()
    
    # 4. Verify results
    collab_a.refresh_from_db()
    collab_b.refresh_from_db()
    
    print(f"\nCollab A User: {collab_a.user}")
    print(f"Collab B User: {collab_b.user}")
    
    if collab_a.user == ua:
        print("\nSUCCESS: Case A linked correctly.")
    else:
        print("\nFAILURE: Case A NOT linked.")

    if collab_b.user is None:
        print("\nSUCCESS: Case B skipped due to conflict (prevented IntegrityError).")
    else:
        print("\nFAILURE: Case B linked to a user that was already taken!")

if __name__ == "__main__":
    verify()
