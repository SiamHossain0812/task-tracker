import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agenda_project.settings')
django.setup()

from django.contrib.auth.models import User
from agendas.models import Collaborator, Agenda, Project
from agendas.serializers import AgendaDetailSerializer
from rest_framework.test import APIRequestFactory

def verify():
    # 1. Setup Test Data
    user, _ = User.objects.get_or_create(username='testuser_notif', email='test_notif@example.com')
    collab1, _ = Collaborator.objects.get_or_create(name='Collab 1_notif', user=user)
    
    other_user, _ = User.objects.get_or_create(username='otheruser_notif', email='other_notif@example.com')
    collab2, _ = Collaborator.objects.get_or_create(name='Collab 2_notif', user=other_user)
    
    project, _ = Project.objects.get_or_create(name='Test Project Notif')
    
    # 2. Simulate Agenda Creation via Serializer
    data = {
        'title': 'Test Notification Task Verif',
        'project_id': project.id,
        'type': 'task',
        'date': '2026-04-01',
        'time': '10:00',
        'collaborator_ids': [collab1.id, collab2.id],
        'team_leader_id': collab1.id
    }
    
    factory = APIRequestFactory()
    request = factory.post('/api/agendas/', data)
    request.user = user
    # Add collaborator_duties to context for serializer
    context = {'request': request, 'collaborator_duties': {str(collab2.id): 'Testing duties'}}
    
    serializer = AgendaDetailSerializer(data=data, context=context)
    if serializer.is_valid():
        from django.db import transaction
        with transaction.atomic():
            agenda = serializer.save(created_by=user, team_leader=collab1)
            print(f"Agenda created: {agenda.id} ({agenda.title})")
            
            # 3. Verify M2M Field
            collabs = list(agenda.collaborators.all())
            print(f"Collaborators in M2M: {[c.name for c in collabs]}")
            
            if collab1 in collabs and collab2 in collabs:
                print("SUCCESS: Collaborators correctly synced to M2M field.")
            else:
                print("FAILURE: Collaborators NOT synced to M2M field.")
                
            # 4. Verify Assignments
            assignments = agenda.assignments.all()
            print(f"Assignments count: {assignments.count()}")
            for a in assignments:
                print(f"  - {a.collaborator.name}: {a.status} (Duties: {a.duties})")
                
    else:
        print(f"Serializer errors: {serializer.errors}")

if __name__ == "__main__":
    verify()
