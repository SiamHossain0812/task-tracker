# Agenda Project Tracker PWA

A modern React Progressive Web App (PWA) built on top of Django REST Framework.

## Features

- **Project Management**: Organize tasks into PROJECTS with color themes.
- **Agenda Tracking**: Track individual tasks with priority, status, and deadlines.
- **Calendar View**: Visual overview of all agendas.
- **Real-time Notifications**: Get notified instantly via WebSockets for updates and deadlines.
- **Progressive Web App**: Install on desktop or mobile and work offline.
- **Collaborators**: Manage team members and assign them to agendas.

## Installation

1. Install the package:
   ```bash
   pip install agenda-tracker-app
   ```

2. Add to `INSTALLED_APPS` in `settings.py`:
   ```python
   INSTALLED_APPS = [
       ...
       'rest_framework',
       'corsheaders',
       'channels',
       'agenda_tracker',
   ]
   ```

3. Configure Channels and CORS in `settings.py`:
   (See documentation for full configuration)

4. Include URLs in `urls.py`:
   ```python
   urlpatterns = [
       ...
       path('agenda/', include('agenda_tracker.urls')),
       path('api/v1/', include('agenda_tracker.api_urls')),
   ]
   ```

5. Run migrations:
   ```bash
   python manage.py migrate
   ```

6. Collect static files:
   ```bash
   python manage.py collectstatic
   ```
