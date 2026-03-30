import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agenda_project.settings')
django.setup()

from django.contrib.auth.models import User
from agendas.models import Collaborator
from rest_framework.test import APIRequestFactory, force_authenticate
from agendas.api_views import CollaboratorViewSet

def test_viewset_permanent_delete():
    # 1. Create a test superuser for authentication
    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        admin_user = User.objects.create_superuser(username='admin_test', email='admin@test.com', password='password')
    
    # 2. Create a test user and collaborator
    username = 'test_delete_viewset'
    email = 'delete_viewset@example.com'
    
    # Cleanup if exists
    User.objects.filter(username=username).delete()
    
    user = User.objects.create_user(username=username, email=email, password='password')
    collaborator = Collaborator.objects.create(user=user, name='Delete Target', email=email)
    
    collab_id = collaborator.id
    user_id = user.id
    
    print(f"Initial setup: User ID {user_id}, Collaborator ID {collab_id} exist.")
    
    # 3. Simulate API DELETE request
    factory = APIRequestFactory()
    view = CollaboratorViewSet.as_view({'delete': 'destroy'})
    request = factory.delete(f'/api/collaborators/{collab_id}/')
    force_authenticate(request, user=admin_user)
    
    print(f"Executing DELETE /api/collaborators/{collab_id}/ ...")
    response = view(request, pk=collab_id)
    
    print(f"Response status: {response.status_code}")
    
    # 4. Verify results
    user_exists = User.objects.filter(id=user_id).exists()
    collab_exists = Collaborator.objects.filter(id=collab_id).exists()
    
    print(f"User exists after deletion: {user_exists}")
    print(f"Collaborator exists after deletion: {collab_exists}")
    
    if not user_exists and not collab_exists:
        print("SUCCESS: ViewSet permanent deletion worked as expected.")
    else:
        print("FAILURE: Permanent deletion failed.")
        if user_exists: print("Error: User still exists.")
        if collab_exists: print("Error: Collaborator still exists.")

if __name__ == "__main__":
    test_viewset_permanent_delete()
