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
    '1738785230' -> '1738785230'
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
    print("--- BRRI Agenda: Collaborator-User Linking Script V3 (Safety First) ---")
    
    disconnected = Collaborator.objects.filter(user__isnull=True)
    count = disconnected.count()
    print(f"Found {count} disconnected Collaborator profiles.")
    
    linked_count = 0
    failed_count = 0
    conflict_count = 0
    
    # Pre-cache all users and their normalized phone identifiers
    print("Scanning all users for phone number identifiers...")
    user_pool = []
    for user in User.objects.all():
        data = {
            'user': user,
            'norm_username': normalize_phone(user.username),
            'norm_profile_phone': ""
        }
        if hasattr(user, 'profile'):
            data['norm_profile_phone'] = normalize_phone(user.profile.phone_number)
        user_pool.append(data)
    print(f"Scanned {len(user_pool)} users.")

    for collab in disconnected:
        if not collab.whatsapp_number:
            print(f"  [SKIPPING] {collab.name}: No WhatsApp number provided in profile.")
            failed_count += 1
            continue
            
        collab_phone = normalize_phone(collab.whatsapp_number)
        print(f"  [CHECKING] {collab.name} (WhatsApp Normalized: {collab_phone})")
        
        match = None
        match_source = ""
        
        for u_data in user_pool:
            # 1. Try matching against Profile Phone Number
            if u_data['norm_profile_phone'] == collab_phone:
                match = u_data['user']
                match_source = "UserProfile.phone_number"
                break
            
            # 2. Try matching against Username (if username is a phone number)
            if u_data['norm_username'] == collab_phone:
                match = u_data['user']
                match_source = "User.username"
                break
        
        if match:
            # SAFETY CHECK: Is this user already taken by ANOTHER collaborator?
            try:
                # Access the reverse side of the OneToOneField
                existing_collab = getattr(match, 'collaborator_profile', None)
                if existing_collab:
                    print(f"  [CONFLICT] User '{match.username}' is already linked to profile: {existing_collab.name} (ID: {existing_collab.id})")
                    print(f"             Skipping link for {collab.name} to avoid database error.")
                    conflict_count += 1
                    continue
            except Exception:
                pass
            
            # Attempt link
            try:
                collab.user = match
                collab.save()
                print(f"  [SUCCESS] Linked {collab.name} to User: {match.username} (via {match_source})")
                linked_count += 1
            except Exception as e:
                print(f"  [ERROR] Database error linking {collab.name}: {e}")
                failed_count += 1
        else:
            print(f"  [FAILED] No User found where username or profile phone matches {collab_phone}")
            failed_count += 1
            
    print("\n--- Summary ---")
    print(f"Successfully linked: {linked_count}")
    print(f"Conflicts (already linked): {conflict_count}")
    print(f"Still disconnected: {failed_count}")
    print("----------------")

if __name__ == "__main__":
    link_profiles()
