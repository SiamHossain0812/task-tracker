import os
import sys
import django

# Add project root to Python path if necessary (assuming script is run from project root)
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agenda_project.settings')
django.setup()

from django.contrib.auth.models import User
from agendas.models import Collaborator

def reset_users():
    print("Deleting all existing users...")
    User.objects.all().delete()
    print("All users deleted.")

    # Create Admin
    print("Creating Admin (Dr. Niaz)...")
    admin_user = User.objects.create_superuser('admin', 'niaz@example.com', 'pass')
    admin_user.first_name = 'Dr.'
    admin_user.last_name = 'Niaz'
    admin_user.save()
    print(f"Admin created: {admin_user.username} (pass)")

    # Create Collaborator: Siam
    print("Creating Collaborator (Siam)...")
    siam_user = User.objects.create_user('siam', 'siam@example.com', 'pass')
    siam_user.first_name = 'Siam'
    siam_user.save()
    
    siam_collab = Collaborator.objects.create(
        user=siam_user,
        name='Siam',
        email='siam@example.com',
        designation='Collaborator',
        division='ICT'
    )
    print(f"Collaborator created: {siam_user.username} (pass)")

    # Create Collaborator: Adiba
    print("Creating Collaborator (Adiba)...")
    adiba_user = User.objects.create_user('adiba', 'adiba@example.com', 'pass')
    adiba_user.first_name = 'Adiba'
    adiba_user.save()
    
    adiba_collab = Collaborator.objects.create(
        user=adiba_user,
        name='Adiba',
        email='adiba@example.com',
        designation='Collaborator',
        division='ICT' 
    )
    print(f"Collaborator created: {adiba_user.username} (pass)")

    print("\nDone! Users reset successfully.")

if __name__ == '__main__':
    reset_users()
