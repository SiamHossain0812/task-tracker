import os
import django
from django.contrib.auth import get_user_model

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "agenda_project.settings")
django.setup()

User = get_user_model()

if not User.objects.filter(username='01711111111').exists():
    User.objects.create_superuser('01711111111', 'admin@example.com', 'admin', first_name='Dr. Niaz')
    print("Superuser created: Phone=01711111111, Password=admin")
else:
    print("Superuser already exists.")
