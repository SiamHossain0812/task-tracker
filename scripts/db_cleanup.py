import os
import sys
import django

# Add the current directory to sys.path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agenda_project.settings')
django.setup()

from agendas.models import Agenda, AgendaAssignment, Collaborator, Notification
from django.contrib.auth.models import User

print("Starting database cleanup...")

# Check AgendaAssignment
count = 0
for obj in AgendaAssignment.objects.all():
    if not Agenda.objects.filter(id=obj.agenda_id).exists():
        print(f"Deleting orphan AgendaAssignment (ID: {obj.id}) due to missing Agenda (ID: {obj.agenda_id})")
        obj.delete()
        count += 1
    elif not Collaborator.objects.filter(id=obj.collaborator_id).exists():
        print(f"Deleting orphan AgendaAssignment (ID: {obj.id}) due to missing Collaborator (ID: {obj.collaborator_id})")
        obj.delete()
        count += 1

# Check Notification
notif_count = 0
for obj in Notification.objects.all():
    if obj.related_agenda_id and not Agenda.objects.filter(id=obj.related_agenda_id).exists():
        print(f"Deleting orphan Notification (ID: {obj.id}) due to missing Agenda (ID: {obj.related_agenda_id})")
        obj.delete()
        notif_count += 1

print(f"Cleanup complete. Removed {count} assignments and {notif_count} notifications.")
