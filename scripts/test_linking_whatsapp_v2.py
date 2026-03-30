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
    # 1. Setup Test Data (Case A: Matching by UserProfile phone number)
    print("Setting up test data for Case A (UserProfile match)...")
    u_a, _ = User.objects.get_or_create(username='test_user_p', email='test_p@example.com')
    profile_a, _ = UserProfile.objects.get_or_create(user=u_a)
    profile_a.phone_number = '+8801700112233'
    profile_a.save()
    
    collab_a, _ = Collaborator.objects.get_or_create(name='Saida Akter Jui (Phone Test)', whatsapp_number='01700112233')
    collab_a.user = None
    collab_a.save()
    
    # 2. Setup Test Data (Case B: Matching by Username)
    print("Setting up test data for Case B (Username match)...")
    u_b, _ = User.objects.get_or_create(username='01700445566', email='test_u@example.com')
    # No profile phone number for this one
    profile_b, _ = UserProfile.objects.get_or_create(user=u_b)
    profile_b.phone_number = None
    profile_b.save()
    
    collab_b, _ = Collaborator.objects.get_or_create(name='Md. Al Amin (Username Test)', whatsapp_number='1700445566')
    collab_b.user = None
    collab_b.save()
    
    # 3. Run the linking script
    print("\nRunning linking script V2...")
    link_profiles()
    
    # 4. Verify results
    collab_a.refresh_from_db()
    collab_b.refresh_from_db()
    
    print(f"\nCollab A User: {collab_a.user}")
    print(f"Collab B User: {collab_b.user}")
    
    success = True
    if collab_a.user == u_a:
        print("\nSUCCESS: Case A linked correctly via UserProfile.")
    else:
        print("\nFAILURE: Case A NOT linked.")
        success = False
        
    if collab_b.user == u_b:
        print("\nSUCCESS: Case B linked correctly via Username.")
    else:
        print("\nFAILURE: Case B NOT linked.")
        success = False
        
    if success:
        print("\nALL CASES PASSED.")

if __name__ == "__main__":
    verify()
