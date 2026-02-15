from agendas.models import Agenda, Collaborator

def run():
    # Find agendas with pending extension but no requester
    pending_agendas = Agenda.objects.filter(extension_status='pending', extension_requested_by__isnull=True)
    
    print(f"Found {pending_agendas.count()} agendas with missing requester.")
    
    for agenda in pending_agendas:
        print(f"Fixing Agenda: {agenda.title} (ID: {agenda.id})")
        
        # Try to assign to the first collaborator found
        # In a real scenario, we might not know, but for testing UI we'll pick one.
        first_collab = agenda.collaborators.first()
        
        if first_collab:
            agenda.extension_requested_by = first_collab
            agenda.save()
            print(f"  -> Assigned to collaborator: {first_collab.name}")
        else:
            print("  -> No collaborators found to assign.")

    print("Done.")
