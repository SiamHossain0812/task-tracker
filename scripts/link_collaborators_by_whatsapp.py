import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agenda_project.settings')
django.setup()

from django.contrib.auth.models import User
from agendas.models import Collaborator, UserProfile

def normalize_phone(phone):
    """
    Remove all non-digit characters and standard Bangladesh prefixes.
    E.g., '+8801738785230' -> '1738785230'
    '01738785230' -> '1738785230'
    """
    if not phone:
        return ""
    # Remove all non-digits
    digits = "".join(filter(str.isdigit, str(phone)))
    
    # Remove leading '88' if present
    if digits.startswith('88'):
        digits = digits[2:]
        
    # Remove leading '0' if present (standard for 11-digit local numbers)
    if digits.startswith('0'):
        digits = digits[1:]
        
    return digits

def link_profiles():
    print("--- BRRI Agenda: Collaborator-User Linking Script (By WhatsApp) ---")
    
    disconnected = Collaborator.objects.filter(user__isnull=True)
    count = disconnected.count()
    print(f"Found {count} disconnected Collaborator profiles.")
    
    linked_count = 0
    failed_count = 0
    
    for collab in disconnected:
        if not collab.whatsapp_number:
            print(f"  [SKIPPING] {collab.name}: No WhatsApp number provided.")
            failed_count += 1
            continue
            
        collab_phone = normalize_phone(collab.whatsapp_number)
        print(f"  [CHECKING] {collab.name} (WhatsApp: {collab_phone})")
        
        # Look for UserProfile with matching phone number
        # We also normalize the phone numbers in the database during search
        # or just try to match the normalized version.
        match = None
        for profile in UserProfile.objects.all():
            if normalize_phone(profile.phone_number) == collab_phone:
                match = profile.user
                break
        
        if match:
            collab.user = match
            collab.save()
            print(f"  [SUCCESS] Linked {collab.name} to User: {match.username}")
            linked_count += 1
        else:
            print(f"  [FAILED] No UserProfile found with phone number ending in {collab_phone}")
            failed_count += 1
            
    print("\n--- Summary ---")
    print(f"Successfully linked: {linked_count}")
    print(f"Still disconnected: {failed_count}")
    print("----------------")

if __name__ == "__main__":
    link_profiles()
