import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agenda_project.settings')
django.setup()

from django.contrib.auth.models import User
from agendas.models import Collaborator

def run_test():
    print('--- SIMULATING COLLISION ---')
    try:
        # Cleanup previous tests
        User.objects.filter(username__in=['1234567890', '01234567890']).delete()
        Collaborator.objects.filter(whatsapp_number__in=['1234567890', '01234567890']).delete()

        # 1. Create User 1 with a number
        u1 = User.objects.create_user(username='1234567890', password='password123')
        u1_collab = Collaborator.objects.get(user=u1)
        print(f'User 1 created with collab {u1_collab.id} and number {u1_collab.whatsapp_number}')

        # 2. Try to create User 2 with a 'colliding' number
        print('Attempting to create User 2 with colliding number...')
        # Note: Normalize logic will match '01234567890' with '1234567890'
        u2 = User.objects.create_user(username='01234567890', password='password234')
        print(f'SUCCESS: User 2 created even though profile sync hit a number collision!')
        
        # 1:1 check
        u2_collab_exists = Collaborator.objects.filter(user=u2).exists()
        print(f'User 2 has collaborator profile: {u2_collab_exists}')

    except Exception as e:
        print(f'SIMULATION FAILED: {e}')
    finally:
        # Cleanup 
        print('Cleaning up test users...')
        User.objects.filter(username__in=['1234567890', '01234567890']).delete()

if __name__ == '__main__':
    run_test()
