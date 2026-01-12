import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agenda_project.settings')
django.setup()

from agendas.models import Agenda, Collaborator

print(f"Total Collaborators: {Collaborator.objects.count()}")
print(f"Total Agendas: {Agenda.objects.count()}")

agendas_with_collabs = 0
for agenda in Agenda.objects.all():
    count = agenda.collaborators.count()
    if count > 0:
        agendas_with_collabs += 1
        print(f"Agenda '{agenda.title}' has {count} collaborators: {[c.name for c in agenda.collaborators.all()]}")

print(f"Agendas with collaborators: {agendas_with_collabs}")
