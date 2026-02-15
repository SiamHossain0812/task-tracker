from agendas.models import Agenda

def run():
    pending = Agenda.objects.filter(extension_status='pending')
    print(f"Found {pending.count()} pending extension requests.")
    
    for a in pending:
        print(f"\nID: {a.id} | Title: {a.title}")
        print(f"Requested By: {a.extension_requested_by}")
        print(f"Collaborators M2M count: {a.collaborators.count()}")
        for c in a.collaborators.all():
            print(f" - Collab: {c.name} (ID: {c.id})")
            
        print(f"Assignments count: {a.assignments.count()}")
        for assign in a.assignments.all():
            print(f" - Assign: {assign.collaborator.name} (ID: {assign.collaborator.id})")

        if a.extension_requested_by is None:
             # Try to fix again using assignments if M2M failed
             candidate = None
             if a.collaborators.exists():
                 candidate = a.collaborators.first()
                 print(" -> Found candidate from M2M")
             elif a.assignments.exists():
                 candidate = a.assignments.first().collaborator
                 print(" -> Found candidate from Assignments")
             
             if candidate:
                 a.extension_requested_by = candidate
                 a.save()
                 print(f" -> FIXED! Assigned to {candidate.name}")
             else:
                 print(" -> FAILED to fix. No collaborators or assignments found.")
