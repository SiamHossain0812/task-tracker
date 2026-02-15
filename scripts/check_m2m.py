import os
import sys
import django

sys.path.append(r'f:\BRRI\agenda-project-tracker-website')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agenda_project.settings')
django.setup()

from agendas.models import Agenda

def run():
    total_assignments = 0
    for a in Agenda.objects.all():
        total_assignments += a.collaborators.count()
    print(f"Total M2M assignments: {total_assignments}")

if __name__ == '__main__':
    run()
