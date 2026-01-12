from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.db.models import Count, Q
from datetime import datetime, date
from .models import Project, Agenda


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


def calculate_status(date_str, time_str, end_date_str, end_time_str):
    """Calculate status based on date/time."""
    if not date_str:
        return 'pending'

    try:
        now = datetime.now()
        
        # Start Datetime
        start_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        if time_str:
            start_time = datetime.strptime(time_str, '%H:%M').time()
        else:
            start_time = datetime.min.time()
        start_dt = datetime.combine(start_date, start_time)
        
        # End Datetime
        end_dt = None
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            if end_time_str:
                end_time = datetime.strptime(end_time_str, '%H:%M').time()
            else:
                end_time = datetime.max.time().replace(microsecond=0) # End of day
            end_dt = datetime.combine(end_date, end_time)
        
        if start_dt > now:
            return 'pending'
        
        # Start is in past or now
        if end_dt:
            if end_dt > now:
                return 'in-progress'
            else:
                return 'completed'
        else:
            # No end date, assume in-progress if started
            return 'in-progress'
            
    except ValueError:
        return 'pending'


def agenda_create(request, project_pk=None):
    """Create a new agenda. project_pk is optional."""
    project = None
    if project_pk:
        project = get_object_or_404(Project, pk=project_pk)
    
    if request.method == 'POST':
        # If project_pk was passed, use it. Otherwise try to get from POST (if we add dropdown)
        post_project_id = request.POST.get('project')
        if not project and post_project_id:
            project = get_object_or_404(Project, pk=post_project_id)

        date_val = request.POST.get('date')
        time_val = request.POST.get('time')
        end_date_val = request.POST.get('expected_finish_date')
        end_time_val = request.POST.get('expected_finish_time')
        
        status = calculate_status(date_val, time_val, end_date_val, end_time_val)

        Agenda.objects.create(
            project=project,
            title=request.POST.get('title'),
            description=request.POST.get('description', ''),
            date=date_val,
            time=time_val or None,
            expected_finish_date=end_date_val or None,
            expected_finish_time=end_time_val or None,
            status=status,
            priority=request.POST.get('priority', 'medium')
        )
        return redirect('dashboard')
    
    return render(request, 'agendas/agenda_form_fixed.html', {
        'title': 'Add New Task',
        'project': project, # Might be None
        'projects': Project.objects.all(), # Pass all projects for dropdown
        'today': date.today().isoformat(),
    })


def agenda_edit(request, pk):
    """Edit an existing agenda."""
    agenda = get_object_or_404(Agenda, pk=pk)
    
    if request.method == 'POST':
        # Handle project change if needed
        project_id = request.POST.get('project')
        if project_id:
            agenda.project = get_object_or_404(Project, pk=project_id)
        elif 'project' in request.POST: # If empty string sent, clear project
            agenda.project = None

        agenda.title = request.POST.get('title')
        agenda.description = request.POST.get('description', '')
        
        date_val = request.POST.get('date')
        time_val = request.POST.get('time')
        end_date_val = request.POST.get('expected_finish_date')
        end_time_val = request.POST.get('expected_finish_time')

        agenda.date = date_val
        agenda.time = time_val or None
        agenda.expected_finish_date = end_date_val or None
        agenda.expected_finish_time = end_time_val or None
        
        agenda.status = calculate_status(date_val, time_val, end_date_val, end_time_val)
        
        agenda.priority = request.POST.get('priority', 'medium')
        agenda.save()
        return redirect('dashboard')
    
    return render(request, 'agendas/agenda_form_fixed.html', {
        'title': 'Edit Task',
        'agenda': agenda,
        'projects': Project.objects.all(),
        'project': agenda.project,
        'today': date.today().isoformat(), # Just for fallback if date is missing
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
