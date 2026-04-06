import os
import django
import sys
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate

# Set up Django environment
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agenda_project.settings')
django.setup()

from agendas.models import Agenda, PersonalNote, Collaborator, Project
from django.contrib.auth.models import User
from agendas.api_views import CalendarAPIView

def test_calendar_with_notes():
    print("--- Testing Calendar API with Personal Notes & Fixed Filtering ---")
    
    # 1. Setup
    user, _ = User.objects.get_or_create(username='calendartester', email='cal@example.com')
    collab, _ = Collaborator.objects.get_or_create(user=user, defaults={'name': 'Cal Tester'})
    
    now = timezone.now().date()
    
    # Create a task where user is CREATOR (but not collaborator)
    # This was the bug: users couldn't see tasks they created if they weren't assigned
    task = Agenda.objects.create(
        title="Created Task",
        date=now,
        status='pending',
        created_by=user
    )
    
    # Create a personal note for this task
    note = PersonalNote.objects.create(
        user=user,
        related_agenda=task,
        content="Testing calendar note"
    )
    
    print(f"Created task: {task.title} (ID: {task.id})")
    print(f"Created note: {note.content} (Linked to task: {note.related_agenda_id})")

    # 2. Call API
    factory = APIRequestFactory()
    view = CalendarAPIView.as_view()
    
    request = factory.get('/api/v1/calendar/')
    force_authenticate(request, user=user)
    response = view(request)

    # 3. Verify
    print(f"Response status: {response.status_code}")
    data = response.data
    
    found_task = next((e for e in data if e['id'] == task.id), None)
    
    success = True
    if found_task:
        print(f"SUCCESS: Found task '{found_task['title']}' in calendar.")
        if found_task.get('personal_note') and found_task['personal_note']['content'] == note.content:
            print(f"SUCCESS: Note content '{found_task['personal_note']['content']}' correctly returned.")
        else:
            print("FAILURE: Personal note missing or incorrect in payload.")
            success = False
    else:
        print("FAILURE: Task not found in calendar (Filtering bug persists).")
        success = False

    # Cleanup
    note.delete()
    task.delete()
    
    if success:
        print("\n=== CALENDAR & NOTES TEST PASSED ===")
    else:
        print("\n=== CALENDAR & NOTES TEST FAILED ===")
        sys.exit(1)

if __name__ == "__main__":
    test_calendar_with_notes()
