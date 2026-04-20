import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agenda_project.settings')
django.setup()

from django.contrib.auth.models import User
from agendas.models import Collaborator, UserProfile
from agendas.utils import ensure_user_profile_sync

def test_user_management_fixes():
    print("--- Testing User Management Fixes ---")
    
    test_username = "01234567890" # 11 digits
    test_email = "test_fix@example.com"
    
    # Clean up any previous test runs
    User.objects.filter(username=test_username).delete()
    Collaborator.objects.filter(whatsapp_number=test_username).delete()
    
    print("\n1. Testing Registration (Signal check)")
    user = User.objects.create_user(username=test_username, email=test_email, password="password123")
    user.first_name = "Test"
    user.last_name = "User"
    user.save() # Triggers signal
    
    collab = getattr(user, 'collaborator_profile', None)
    if collab:
        print(f"SUCCESS: Collaborator profile created automatically for {user.username}")
        print(f"Details: Name='{collab.name}', Phone='{collab.whatsapp_number}'")
    else:
        print("FAILED: Collaborator profile not created.")
        return

    print("\n2. Testing 'Auto-Healing' (Simulating Dashboard visit)")
    # We disconnect the signal temporarily to create an ORPHAN user (user without collab)
    # This tests the 'healing' capacity of ensure_user_profile_sync
    from agendas.models import delete_user_account, post_delete
    post_delete.disconnect(delete_user_account, sender=Collaborator)
    
    collab_pk = collab.pk
    print("Forcefully creating an orphan (disconnecting signal)...")
    Collaborator.objects.filter(pk=collab_pk).delete()
    
    # Reconnect signal
    post_delete.connect(delete_user_account, sender=Collaborator)
    
    # Reload user and check
    user = User.objects.get(username=test_username)
    if not hasattr(user, 'collaborator_profile'):
        print("Confirmed: Collaborator profile is missing (User is orphaned).")
    
    # Run healing logic
    print("Running healing logic...")
    ensure_user_profile_sync(user)
    
    if hasattr(user, 'collaborator_profile'):
        print(f"SUCCESS: Collaborator profile restored for {user.username}")
    else:
        print("FAILED: Healing logic did not restore profile.")
        return

    print("\n3. Testing Unified Deletion (Signal check)")
    # With the new signals, deleting the collaborator should automatically delete the user
    collab = user.collaborator_profile
    user_id_to_check = user.id
    
    print(f"Deleting collaborator '{collab.name}' (expecting automatic User deletion)...")
    collab.delete()
        
    # Check if both are gone
    user_exists = User.objects.filter(id=user_id_to_check).exists()
    collab_exists = Collaborator.objects.filter(whatsapp_number=test_username).exists()
    
    if not user_exists and not collab_exists:
        print("SUCCESS: Both User and Collaborator deleted automatically via signals.")
        print("Bidirectional integrity is confirmed.")
    else:
        print(f"FAILED: Cleanup failed. User exists: {user_exists}, Collab exists: {collab_exists}")

    print("\n--- Testing Complete ---")

if __name__ == "__main__":
    test_user_management_fixes()
