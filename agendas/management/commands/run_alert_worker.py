import time
import traceback
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from agendas.utils import check_and_create_alerts
from django.utils import timezone

class Command(BaseCommand):
    help = 'Starts a continuous background worker to process schedule alerts and deadlines.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS(f"[{timezone.now()}] Starting continuous background alert worker..."))
        self.stdout.write("This worker will check deadlines and schedules every 60 seconds.")
        self.stdout.write("Press CTRL+C to stop.")
        
        while True:
            users = User.objects.filter(is_active=True)
            run_time = timezone.now()
            
            alerts_triggered = 0
            for user in users:
                try:
                    # check_and_create_alerts includes built-in deduplication 
                    # and will fire WebSocket/Push/Email if an alert is created
                    result = check_and_create_alerts(user, emit_websocket=True)
                    if result and isinstance(result, dict):
                        alerts_triggered += result.get('alerts_created', 0)
                except Exception as e:
                    self.stderr.write(self.style.ERROR(f"Error processing user {user.username}: {str(e)}"))
                    traceback.print_exc()

            if alerts_triggered > 0:
                self.stdout.write(self.style.SUCCESS(f"[{run_time.strftime('%H:%M:%S')}] Triggered {alerts_triggered} new alerts."))
            
            # Sleep for 60 seconds before checking again
            time.sleep(60)
