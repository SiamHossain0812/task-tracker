import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agenda_project.settings')
django.setup()

from agendas.models import Project

# Delete all existing projects
print("Deleting all existing projects...")
count = Project.objects.count()
Project.objects.all().delete()
print(f"Deleted {count} projects successfully.")
