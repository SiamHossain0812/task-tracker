from agendas.models import Agenda
from django.utils import timezone
from datetime import datetime, timedelta

def run():
    # Fetch the most recent agenda (likely the one the user just created)
    agenda = Agenda.objects.last()
    
    if not agenda:
        print("No agendas found.")
        return

    print(f"Checking Agenda: {agenda.title} (ID: {agenda.id})")
    print(f"Status: {agenda.status}")
    print(f"Date: {agenda.date}")
    print(f"Time (Start): {agenda.time}")
    print(f"Expected Finish Date: {agenda.expected_finish_date}")
    print(f"Expected Finish Time: {agenda.expected_finish_time}")
    
    now = timezone.now()
    print(f"Current Time (Now): {now}")

    # Replicate logic from utils.py
    start_date = agenda.date
    start_time = agenda.time
    
    finish_date = agenda.expected_finish_date or start_date
    finish_time = agenda.expected_finish_time or start_time
    
    if start_time:
        start_dt = datetime.combine(start_date, start_time)
    else:
        start_dt = datetime.combine(start_date, datetime.min.time())
        
    if finish_time:
        finish_dt = datetime.combine(finish_date, finish_time)
    else:
        finish_dt = datetime.combine(finish_date, datetime.max.time())
        
    start_dt = timezone.make_aware(start_dt)
    finish_dt = timezone.make_aware(finish_dt)
    
    print(f"Start DT: {start_dt}")
    print(f"Finish DT: {finish_dt}")
    
    if agenda.status == 'in-progress' and finish_dt > start_dt:
         total_duration = (finish_dt - start_dt).total_seconds()
         elapsed_duration = (now - start_dt).total_seconds()
         
         print(f"Total Duration (s): {total_duration}")
         print(f"Elapsed Duration (s): {elapsed_duration}")
         
         if total_duration > 0:
             percentage = elapsed_duration / total_duration
             print(f"Percentage: {percentage}")
             if percentage >= 0.8:
                 print("-> TRIGGER: 80% Threshold Met")
             else:
                 print("-> NO TRIGGER: Below 80%")
         else:
             print("-> NO TRIGGER: Duration is 0")
    else:
        print("-> NO TRIGGER: Not in-progress or Finish <= Start")
