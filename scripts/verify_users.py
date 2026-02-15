import os
import sys
import django

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agenda_project.settings')
django.setup()

from django.contrib.auth.models import User
from agendas.models import Collaborator

print("--- VERIFICATION START ---")
users = User.objects.all()
print(f"Total Users: {users.count()}")
for u in users:
    print(f"User: {u.username} (Superuser: {u.is_superuser})")

collabs = Collaborator.objects.all()
print(f"Total Collaborators: {collabs.count()}")
for c in collabs:
    print(f"Collaborator: {c.name} (Linked User: {c.user.username if c.user else 'None'})")
print("--- VERIFICATION END ---")
