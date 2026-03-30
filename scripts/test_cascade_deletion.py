import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agenda_project.settings')
django.setup()

from django.contrib.auth.models import User
from agendas.models import Collaborator

def test_cascade_deletion():
    # 1. Create a test user
    username = 'test_cascade_user'
    email = 'cascade@example.com'
    password = 'testpassword123'
    
    # Cleanup if exists
    User.objects.filter(username=username).delete()
    
    user = User.objects.create_user(username=username, email=email, password=password)
    print(f"Created User: {user.username}")
    
    # 2. Create a collaborator profile linked to the user
    collaborator = Collaborator.objects.create(
        user=user,
        name='Test Cascade Collaborator',
        email=email
    )
    print(f"Created Collaborator: {collaborator.name} (Linked to User ID: {user.id})")
    
    # Verify both exist
    user_id = user.id
    collab_id = collaborator.id
    
    if User.objects.filter(id=user_id).exists() and Collaborator.objects.filter(id=collab_id).exists():
        print("Initial verification passed: Both User and Collaborator exist.")
    else:
        print("Error: Initial verification failed.")
        return

    # 3. Delete the User
    print(f"Deleting User (ID: {user_id})...")
    user.delete()
    
    # 4. Check if Collaborator is also deleted (CASCADE)
    user_exists = User.objects.filter(id=user_id).exists()
    collab_exists = Collaborator.objects.filter(id=collab_id).exists()
    
    print(f"User exists after deletion: {user_exists}")
    print(f"Collaborator exists after deletion: {collab_exists}")
    
    if not user_exists and not collab_exists:
        print("SUCCESS: CASCADE deletion worked. Deleting User also deleted Collaborator.")
    else:
        print("FAILURE: CASCADE deletion did not work as expected.")
        if collab_exists:
            # Check what happened to the user field
            c = Collaborator.objects.get(id=collab_id)
            print(f"Collaborator user field is: {c.user}")

if __name__ == "__main__":
    test_cascade_deletion()
