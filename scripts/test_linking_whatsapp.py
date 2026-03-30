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
    # 1. Setup Test Data
    print("Setting up test data...")
    test_user, _ = User.objects.get_or_create(username='test_user_linked', email='test_linked@example.com')
    # Update UserProfile phone_number
    profile, _ = UserProfile.objects.get_or_create(user=test_user)
    profile.phone_number = '+8801738785230'
    profile.save()
    
    # Create a Collaborator with matching phone number but NO user link
    collab, _ = Collaborator.objects.get_or_create(name='Saida Akter Jui (Test)', whatsapp_number='01738785230')
    collab.user = None
    collab.save()
    
    print(f"Test User: {test_user.username} (Phone: {profile.phone_number})")
    print(f"Test Collab: {collab.name} (WhatsApp: {collab.whatsapp_number}, User: {collab.user})")
    
    # 2. Run the linking script
    print("\nRunning linking script...")
    link_profiles()
    
    # 3. Verify results
    collab.refresh_from_db()
    print(f"\nFinal Collab User: {collab.user}")
    
    if collab.user == test_user:
        print("\nSUCCESS: Link established correctly based on WhatsApp number.")
    else:
        print("\nFAILURE: Link NOT established.")

if __name__ == "__main__":
    verify()
