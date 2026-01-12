import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','agenda_project.settings')
import django
django.setup()
from agendas.models import Agenda
print([a.title for a in Agenda.objects.all()])
