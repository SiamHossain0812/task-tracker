import os
import django
import sys

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agenda_project.settings')
django.setup()

from django.contrib.auth.models import User
from agendas.models import Agenda, Project
from django.utils import timezone
from datetime import date

def test_archiving():
    print("Starting Archiving Test...")
    
    # Get a superuser
    user = User.objects.filter(is_superuser=True).first()
    if not user:
        print("No superuser found. Please create one.")
        return

    # Create a test project if none exists
    project = Project.objects.first()
    if not project:
        project = Project.objects.create(name="Test Project", created_by=user)

    # 1. Create a task
    task = Agenda.objects.create(
        title="Test Archiving Task",
        date=date.today(),
        created_by=user,
        project=project,
        is_archived=False
    )
    print(f"Created task: {task.title} (ID: {task.id}, is_archived: {task.is_archived})")

    # 2. Archive it (Manually simulating the API action)
    task.is_archived = True
    task.save()
    task.refresh_from_db()
    print(f"Archived task: {task.title} (is_archived: {task.is_archived})")
    assert task.is_archived == True

    # 3. Verify it's in the archived list (simulating get_queryset with ?archived=true)
    archived_tasks = Agenda.objects.filter(is_archived=True)
    assert task in archived_tasks
    print("Verified task is in archived list.")

    # 4. Unarchive it
    task.is_archived = False
    task.save()
    task.refresh_from_db()
    print(f"Unarchived task: {task.title} (is_archived: {task.is_archived})")
    assert task.is_archived == False

    # 5. Cleanup
    task.delete()
    print("Test passed! Cleanup complete.")

if __name__ == "__main__":
    test_archiving()
