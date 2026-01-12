from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Q, Count
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
import json
from datetime import date, datetime, timedelta
from .models import Agenda, Project, Collaborator
from .utils import calculate_status


def dashboard(request):
    """Main dashboard view showing all agendas."""
    today = date.today()
    filter_type = request.GET.get('filter')
    
    # Fetch all agendas/tasks
    all_agendas = Agenda.objects.select_related('project').all().order_by('date', 'time')
    
    # Apply filters
    filtered_agendas = None
    if filter_type == 'today':
        filtered_agendas = all_agendas.filter(date=today)
    elif filter_type == 'important':
        filtered_agendas = all_agendas.filter(priority='high')
    
    # Filter groups (standard dashboard view)
    overdue_tasks = all_agendas.filter(date__lt=today).exclude(status='completed')
    today_tasks = all_agendas.filter(date=today).exclude(status='completed')
    upcoming_tasks = all_agendas.filter(date__gt=today).exclude(status='completed')
    completed_tasks = all_agendas.filter(status='completed')
    
    # Calculate stats
    total_projects = Project.objects.count()
    total_pending = all_agendas.filter(status='pending').count()
    total_progress = all_agendas.filter(status='in-progress').count()
    total_completed = completed_tasks.count()
    
    total_agendas = total_pending + total_progress + total_completed
    overall_progress = int((total_completed / total_agendas) * 100) if total_agendas > 0 else 0
    
    # Determine greeting based on time
    hour = datetime.now().hour
    if hour < 12:
        greeting = 'Morning'
    elif hour < 17:
        greeting = 'Afternoon'
    else:
        greeting = 'Evening'
    
    context = {
        'filter_type': filter_type,
        'filtered_agendas': filtered_agendas,
        'overdue_tasks': overdue_tasks,
        'today_tasks': today_tasks,
        'upcoming_tasks': upcoming_tasks,
        'completed_tasks': completed_tasks,
        'agendas': all_agendas, # Keep for total count reference if needed
        'total_projects': total_projects,
        'total_pending': total_pending,
        'total_progress': total_progress,
        'total_completed': total_completed,
        'overall_progress': overall_progress,
        'greeting': greeting,
        'today': today,
        'projects': Project.objects.all(),
    }
    return render(request, 'agendas/dashboard.html', context)


def project_create(request):
    """Create a new project."""
    if request.method == 'POST':
        name = request.POST.get('name')
        description = request.POST.get('description', '')
        color = request.POST.get('color', 'indigo')
        
        Project.objects.create(
            name=name,
            description=description,
            color=color
        )
        return redirect('dashboard')
    
    return render(request, 'agendas/project_form.html', {
        'title': 'Create New Project',
        'colors': Project.COLOR_CHOICES,
    })


def project_edit(request, pk):
    """Edit an existing project."""
    project = get_object_or_404(Project, pk=pk)
    
    if request.method == 'POST':
        project.name = request.POST.get('name')
        project.description = request.POST.get('description', '')
        project.color = request.POST.get('color', 'indigo')
        project.save()
        return redirect('dashboard')
    
    return render(request, 'agendas/project_form.html', {
        'title': 'Edit Project',
        'project': project,
        'colors': Project.COLOR_CHOICES,
    })


def project_delete(request, pk):
    """Delete a project."""
    project = get_object_or_404(Project, pk=pk)
    if request.method == 'POST':
        project.delete()
        return redirect('dashboard')
    return render(request, 'agendas/confirm_delete.html', {
        'object': project,
        'type': 'project'
    })





def agenda_create(request, project_pk=None):
    """Create a new agenda. project_pk is optional."""
    initial_data = {}
    project = None
    if project_pk:
        project = get_object_or_404(Project, pk=project_pk)
        initial_data['project'] = project
    
    if request.method == 'POST':
        form = AgendaForm(request.POST, request.FILES)
        if form.is_valid():
            agenda = form.save(commit=False)
            
            # Calculate status
            status = calculate_status(
                request.POST.get('date'),
                request.POST.get('time'),
                request.POST.get('expected_finish_date'),
                request.POST.get('expected_finish_time')
            )
            agenda.status = status
            agenda.save()
            form.save_m2m() # Important for collaborators
            
            # Send WhatsApp Notification
            if request.POST.get('send_whatsapp') == 'true':
                from .utils import send_whatsapp_notification
                send_whatsapp_notification(agenda.collaborators.all(), agenda)
            
            return redirect('dashboard')
    else:
        initial_data['date'] = date.today()
        form = AgendaForm(initial=initial_data)
        if project:
            form.fields['project'].initial = project

    return render(request, 'agendas/agenda_form_fixed.html', {
        'title': 'Add New Task',
        'form': form,
        'today': date.today().isoformat(),
        'project': project,
        'project_list': Project.objects.all(),
        'collaborator_list': Collaborator.objects.all(),
    })


def agenda_edit(request, pk):
    """Edit an existing agenda."""
    agenda = get_object_or_404(Agenda, pk=pk)
    
    if request.method == 'POST':
        form = AgendaForm(request.POST, request.FILES, instance=agenda)
        if form.is_valid():
            agenda = form.save(commit=False)
            
            # Recalculate status
            status = calculate_status(
                request.POST.get('date'),
                request.POST.get('time'),
                request.POST.get('expected_finish_date'),
                request.POST.get('expected_finish_time')
            )
            agenda.status = status
            agenda.save()
            form.save_m2m()
            
            # Send WhatsApp Notification
            if request.POST.get('send_whatsapp') == 'true':
                from .utils import send_whatsapp_notification
                send_whatsapp_notification(agenda.collaborators.all(), agenda)
            
            return redirect('dashboard')
    else:
        form = AgendaForm(instance=agenda)

    return render(request, 'agendas/agenda_form_fixed.html', {
        'title': 'Edit Task',
        'agenda': agenda,
        'form': form,
        'today': date.today().isoformat(),
        'project': agenda.project,
        'project_list': Project.objects.all(),
        'collaborator_list': Collaborator.objects.all(),
    })


def agenda_delete(request, pk):
    """Delete an agenda."""
    agenda = get_object_or_404(Agenda, pk=pk)
    if request.method == 'POST':
        agenda.delete()
        return redirect('dashboard')
    return render(request, 'agendas/confirm_delete.html', {
        'object': agenda,
        'type': 'task'
    })


@require_POST
def agenda_toggle_status(request, pk):
    """Toggle agenda status via AJAX."""
    agenda = get_object_or_404(Agenda, pk=pk)
    
    status_order = ['pending', 'in-progress', 'completed']
    current_index = status_order.index(agenda.status)
    new_status = status_order[(current_index + 1) % len(status_order)]
    
    agenda.status = new_status
    agenda.save()
    
    return JsonResponse({
        'status': new_status,
        'success': True
    })


def calendar_view(request):
    """Calendar view showing tasks by date."""
    import calendar
    from collections import defaultdict
    
    # Get month and year from query params, default to current
    today = date.today()
    try:
        year = int(request.GET.get('year', today.year))
        month = int(request.GET.get('month', today.month))
    except (ValueError, TypeError):
        year = today.year
        month = today.month
    
    # Ensure valid month/year
    if month < 1:
        month = 12
        year -= 1
    elif month > 12:
        month = 1
        year += 1
    
    # Calculate previous and next month
    prev_month = month - 1 if month > 1 else 12
    prev_year = year if month > 1 else year - 1
    next_month = month + 1 if month < 12 else 1
    next_year = year if month < 12 else year + 1
    
    # Get calendar for the month
    cal = calendar.monthcalendar(year, month)
    month_name = calendar.month_name[month]
    
    # Get all agendas for this month
    first_day = date(year, month, 1)
    if month == 12:
        last_day = date(year + 1, 1, 1)
    else:
        last_day = date(year, month + 1, 1)
    
    agendas = Agenda.objects.filter(
        date__gte=first_day,
        date__lt=last_day
    ).select_related('project').order_by('date', 'time')
    
    # Group agendas by date
    agendas_by_date = defaultdict(list)
    for agenda in agendas:
        agendas_by_date[agenda.date.day].append(agenda)
    
    # Build calendar weeks with task data
    calendar_weeks = []
    for week in cal:
        week_data = []
        for day in week:
            if day == 0:
                week_data.append({'day': None, 'tasks': []})
            else:
                week_data.append({
                    'day': day,
                    'tasks': agendas_by_date.get(day, []),
                    'is_today': (year == today.year and month == today.month and day == today.day)
                })
        calendar_weeks.append(week_data)
    
    context = {
        'calendar_weeks': calendar_weeks,
        'month': month,
        'year': year,
        'month_name': month_name,
        'prev_month': prev_month,
        'prev_year': prev_year,
        'next_month': next_month,
        'next_year': next_year,
        'today': today,
    }
    
    return render(request, 'agendas/calendar.html', context)


def undone_tasks(request):
    """View showing all undone tasks (pending and in-progress)."""
    today = date.today()
    
    # Get all undone tasks (not completed)
    all_undone = Agenda.objects.exclude(status='completed').select_related('project').order_by('date', 'time')
    
    # Categorize undone tasks
    overdue = all_undone.filter(date__lt=today)
    today_tasks = all_undone.filter(date=today)
    upcoming = all_undone.filter(date__gt=today)
    
    # Calculate stats
    total_undone = all_undone.count()
    pending_count = all_undone.filter(status='pending').count()
    in_progress_count = all_undone.filter(status='in-progress').count()
    high_priority_count = all_undone.filter(priority='high').count()
    
    context = {
        'all_undone': all_undone,
        'overdue': overdue,
        'today_tasks': today_tasks,
        'upcoming': upcoming,
        'total_undone': total_undone,
        'pending_count': pending_count,
        'in_progress_count': in_progress_count,
        'high_priority_count': high_priority_count,
        'today': today,
    }
    
    return render(request, 'agendas/undone_tasks.html', context)


def search(request):
    """Global search across projects and tasks."""
    query = request.GET.get('q', '').strip()
    
    projects = []
    agendas = []
    total_results = 0
    
    if query:
        # Search in projects
        projects = Project.objects.filter(
            Q(name__icontains=query) | 
            Q(description__icontains=query)
        ).annotate(
            task_count=Count('agendas')
        )
        
        # Search in agendas/tasks
        agendas = Agenda.objects.filter(
            Q(title__icontains=query) |
            Q(description__icontains=query) |
            Q(project__name__icontains=query) |
            Q(status__icontains=query) |
            Q(priority__icontains=query) |
            Q(date__icontains=query)
        ).select_related('project').order_by('-created_at')
        
        total_results = projects.count() + agendas.count()
    
    context = {
        'query': query,
        'projects': projects,
        'agendas': agendas,
        'total_results': total_results,
        'project_count': projects.count() if query else 0,
        'agenda_count': agendas.count() if query else 0,
    }
    
    return render(request, 'agendas/search.html', context)


def about(request):
    """About page with owner information."""
    return render(request, 'agendas/about.html')




# Collaborator Views
from .forms import CollaboratorForm, AgendaForm

def collaborator_list(request):
    collaborators = Collaborator.objects.all().order_by('-created_at')
    return render(request, 'agendas/collaborator_list.html', {'collaborators': collaborators})

def collaborator_create(request):
    if request.method == 'POST':
        form = CollaboratorForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect('collaborator_list')
    else:
        form = CollaboratorForm()
    return render(request, 'agendas/collaborator_form.html', {'form': form, 'title': 'Add New Collaborator'})

def collaborator_edit(request, pk):
    collaborator = get_object_or_404(Collaborator, pk=pk)
    if request.method == 'POST':
        form = CollaboratorForm(request.POST, request.FILES, instance=collaborator)
        if form.is_valid():
            form.save()
            return redirect('collaborator_list')
    else:
        form = CollaboratorForm(instance=collaborator)
    return render(request, 'agendas/collaborator_form.html', {'form': form, 'title': 'Edit Collaborator'})

def collaborator_delete(request, pk):
    collaborator = get_object_or_404(Collaborator, pk=pk)
    if request.method == 'POST':
        collaborator.delete()
        return redirect('collaborator_list')
    return render(request, 'agendas/confirm_delete.html', {'object': collaborator, 'title': 'Delete Collaborator'}) 
@csrf_exempt
@require_POST
def api_collaborator_create(request):
    """AJAX endpoint to create a collaborator."""
    try:
        data = json.loads(request.body)
        name = data.get('name')
        whatsapp_number = data.get('whatsapp_number')
        
        if not name:
            return JsonResponse({'success': False, 'error': 'Name is required'}, status=400)
            
        collaborator = Collaborator.objects.create(
            name=name,
            whatsapp_number=whatsapp_number
        )
        
        return JsonResponse({
            'success': True,
            'id': collaborator.id,
            'name': collaborator.name,
            'whatsapp_number': collaborator.whatsapp_number
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
