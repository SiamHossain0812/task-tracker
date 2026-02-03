from django.shortcuts import render

def index(request):
    """
    Serves the React PWA entry point.
    """
    return render(request, 'agenda_tracker/index.html')
