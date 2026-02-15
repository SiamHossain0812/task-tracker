from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Q, Count
from django.http import JsonResponse, HttpResponse
from django.contrib import messages
from django.contrib.auth.decorators import login_required, user_passes_test
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
import json
import io
from datetime import date, datetime, timedelta
from django.http import FileResponse
from .models import Agenda, Project, Collaborator
from .utils import calculate_status

# PDF generation imports
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer


@login_required
def dashboard(request):
    """Main dashboard view showing all agendas."""
    today = date.today()
    filter_type = request.GET.get('filter')
    
    # Fetch all agendas/tasks
    if request.user.is_superuser:
        all_agendas = Agenda.objects.select_related('project').all().order_by('date', 'time')
    else:
        # Filter for agendas where the logged-in user is a collaborator
        all_agendas = Agenda.objects.filter(collaborators__user=request.user).select_related('project').order_by('date', 'time')
    
    # Apply filters
    filtered_agendas = None
    if filter_type == 'today':
        filtered_agendas = all_agendas.filter(date=today)
    elif filter_type == 'important':
        filtered_agendas = all_agendas.filter(priority='high')
    
    # Filter groups (standard dashboard view)
    from django.utils import timezone
    now_dt = timezone.now()
    curr_time = now_dt.time()
    
    overdue_cond = (
        Q(expected_finish_date__lt=today) | 
        Q(expected_finish_date__isnull=True, date__lt=today) |
        (
            (Q(expected_finish_date=today) | Q(expected_finish_date__isnull=True, date=today)) & 
            (Q(expected_finish_time__lt=curr_time) | Q(expected_finish_time__isnull=True, time__lt=curr_time))
        )
    )
    
    overdue_tasks = all_agendas.filter(overdue_cond).exclude(status='completed')
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


@user_passes_test(lambda u: u.is_superuser)
@login_required
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


@user_passes_test(lambda u: u.is_superuser)
@login_required
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


@user_passes_test(lambda u: u.is_superuser)
@login_required
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





@login_required
@login_required
def agenda_create(request, project_pk=None):
    """Create a new agenda. project_pk is optional."""
    # Relaxed restriction to allow collaborators

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
            agenda.created_by = request.user
            agenda.team_leader = getattr(request.user, 'collaborator_profile', None)
            agenda.save()
            form.save_m2m() # Important for collaborators
            
            return redirect('dashboard')
    else:
        # Check for date in query parameters
        date_param = request.GET.get('date')
        if date_param:
            try:
                initial_data['date'] = datetime.strptime(date_param, '%Y-%m-%d').date()
            except (ValueError, TypeError):
                initial_data['date'] = date.today()
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
        'current_collaborator_ids': [], # New task has no collaborators yet
    })


@login_required
def agenda_edit(request, pk):
    """Edit an existing agenda."""
    # Allowed for collaborators who are assigned or superusers

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
            agenda.created_by = request.user
            agenda.team_leader = getattr(request.user, 'collaborator_profile', None)
            agenda.save()
            form.save_m2m()
            
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
        'current_collaborator_ids': list(agenda.collaborators.values_list('pk', flat=True)),
    })


@login_required
def agenda_delete(request, pk):
    """Delete an agenda."""
    # Allowed for collaborators who are assigned or superusers

    agenda = get_object_or_404(Agenda, pk=pk)
    if request.method == 'POST':
        agenda.delete()
        return redirect('dashboard')
    return render(request, 'agendas/confirm_delete.html', {
        'object': agenda,
        'type': 'task'
    })


@login_required
@require_POST
def agenda_toggle_status(request, pk):
    """Toggle agenda status via AJAX."""
    agenda = get_object_or_404(Agenda, pk=pk)
    
    # Restrict to Superusers OR assigned Collaborators
    is_collaborator = False
    if hasattr(request.user, 'collaborator_profile'):
        is_collaborator = agenda.collaborators.filter(pk=request.user.collaborator_profile.pk).exists()

    if not request.user.is_superuser and not is_collaborator:
        return JsonResponse({
            'success': False,
            'error': 'Permission denied. Only administrators or assigned collaborators can update status.'
        }, status=403)
    
    status_order = ['pending', 'in-progress', 'completed']
    
    try:
        current_index = status_order.index(agenda.status)
        new_status = status_order[(current_index + 1) % len(status_order)]
        
        agenda.status = new_status
        agenda.save()
        
        return JsonResponse({
            'status': new_status,
            'status_display': agenda.get_status_display(),
            'success': True
        })
    except ValueError:
        return JsonResponse({
            'success': False,
            'error': f'Invalid status: {agenda.status}'
        }, status=400)


@login_required
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
                    'full_date': date(year, month, day).isoformat(),
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


@login_required
def undone_tasks(request):
    """View showing all undone tasks and tasks completed today."""
    today = date.today()
    
    # Get all undone tasks (not completed) - No time limit
    all_undone = Agenda.objects.exclude(status='completed').select_related('project').order_by('date', 'time')
    
    # Get tasks completed today
    completed_today = Agenda.objects.filter(status='completed', date=today).select_related('project').order_by('-time')
    
    # Calculate stats
    pending_count = all_undone.filter(status='pending').count()
    in_progress_count = all_undone.filter(status='in-progress').count()
    high_priority_count = all_undone.filter(priority='high').count()
    completed_today_count = completed_today.count()
    
    context = {
        'all_undone': all_undone,
        'completed_today': completed_today,
        'pending_count': pending_count,
        'in_progress_count': in_progress_count,
        'high_priority_count': high_priority_count,
        'completed_today_count': completed_today_count,
        'today': today,
    }
    
    return render(request, 'agendas/undone_tasks_v2.html', context)


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

@login_required
def collaborator_list(request):
    collaborators = Collaborator.objects.all().order_by('-created_at')
    
    # Check for pending users (active=False) that linked to a collaborator profile?
    # Actually, we just need users where is_active=False.
    # But for display, maybe we want to see if they are linked. 
    # Let's just list all inactive users for approval.
    from django.contrib.auth.models import User
    
    pending_users = []
    if request.user.is_superuser:
        pending_users = User.objects.filter(is_active=False).order_by('-date_joined')
        
    return render(request, 'agendas/collaborator_list.html', {
        'collaborators': collaborators,
        'pending_users': pending_users
    })

@login_required
def approve_user(request, pk):
    """Approve a pending user."""
    if not request.user.is_superuser:
        messages.error(request, "Permission denied.")
        return redirect('dashboard')
        
    from django.contrib.auth.models import User
    user = get_object_or_404(User, pk=pk)
    user.is_active = True
    user.save()
    messages.success(request, f"Approved access for {user.first_name}")
    return redirect('collaborator_list')

@login_required
def collaborator_create(request):
    if request.method == 'POST':
        form = CollaboratorForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect('collaborator_list')
    else:
        form = CollaboratorForm()
    return render(request, 'agendas/collaborator_form.html', {'form': form, 'title': 'Add New Collaborator'})

@login_required
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

@login_required
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


def project_analytics(request):
    """View for detailed project analytics."""
    projects = Project.objects.all().prefetch_related('agendas', 'agendas__collaborators')
    projects_data = []
    today = date.today()
    
    for project in projects:
        # Calculate stats
        total_tasks = project.agendas.count()
        completed_count = project.agendas.filter(status='completed').count()
        pending_count = project.agendas.filter(status='pending').count()
        from django.utils import timezone
        now_dt = timezone.now()
        curr_time = now_dt.time()
        
        overdue_cond = (
            Q(expected_finish_date__lt=today) | 
            Q(expected_finish_date__isnull=True, date__lt=today) |
            (
                (Q(expected_finish_date=today) | Q(expected_finish_date__isnull=True, date=today)) & 
                (Q(expected_finish_time__lt=curr_time) | Q(expected_finish_time__isnull=True, time__lt=curr_time))
            )
        )
        
        overdue_count = project.agendas.filter(overdue_cond).exclude(status='completed').count()
        
        # Get unique collaborators
        collaborators = set()
        for agenda in project.agendas.all():
            for collaborator in agenda.collaborators.all():
                collaborators.add(collaborator)
                
        # Determine performance label
        if total_tasks > 0:
            overdue_ratio = overdue_count / total_tasks
            if overdue_ratio > 0.3:
                performance = 'Low'
            elif overdue_ratio > 0.1:
                performance = 'Medium'
            else:
                performance = 'High'
        else:
            performance = 'High'  # Default for new projects

        projects_data.append({
            'project': project,
            'total_tasks': total_tasks,
            'completed_count': completed_count,
            'pending_count': pending_count,
            'overdue_count': overdue_count,
            'collaborators': list(collaborators),
            'performance': performance
        })
    
    # Calculate global aggregates
    global_total_tasks = sum(p['total_tasks'] for p in projects_data)
    global_completed_tasks = sum(p['completed_count'] for p in projects_data)
    global_pending_tasks = sum(p['pending_count'] for p in projects_data)
    global_overdue_tasks = sum(p['overdue_count'] for p in projects_data)
    
    overall_progress = int((global_completed_tasks / global_total_tasks * 100)) if global_total_tasks > 0 else 0

    return render(request, 'agendas/project_analytics.html', {
        'projects_data': projects_data,
        'global_stats': {
            'total_projects': projects.count(),
            'total_tasks': global_total_tasks,
            'completed_tasks': global_completed_tasks,
            'pending_tasks': global_pending_tasks,
            'overdue_tasks': global_overdue_tasks,
            'progress': overall_progress
        }
    })


@login_required
def export_past_work_pdf(request):
    """View to export completed tasks as an enhanced PDF report."""
    days = int(request.GET.get('days', 7))
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    filters = {'status': 'completed', 'date__range': [start_date, end_date]}
    if not request.user.is_superuser:
        filters['collaborators__user'] = request.user

    past_works = Agenda.objects.filter(**filters).select_related('project').order_by('-date', '-time')
    
    # Aggregations for "Informational" content
    project_stats = {}
    priority_stats = {'high': 0, 'medium': 0, 'low': 0}
    daily_stats = {}
    
    for work in past_works:
        p_name = work.project.name if work.project else "General"
        project_stats[p_name] = project_stats.get(p_name, 0) + 1
        priority_stats[work.priority] = priority_stats.get(work.priority, 0) + 1
        d_str = work.date.strftime('%b %d')
        daily_stats[d_str] = daily_stats.get(d_str, 0) + 1

    # Create PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    elements = []
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=28, textColor=colors.HexColor('#064e3b'), alignment=1, spaceAfter=10)
    header_accent = ParagraphStyle('HeaderAccent', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#059669'), alignment=1, spaceAfter=30, fontName='Helvetica-Bold')
    section_style = ParagraphStyle('Section', parent=styles['Heading2'], fontSize=14, textColor=colors.HexColor('#1f2937'), spaceBefore=25, spaceAfter=15)
    info_text = ParagraphStyle('Info', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#4b5563'), leading=14)
    stat_label = ParagraphStyle('StatLabel', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#6b7280'), alignment=1)
    stat_value = ParagraphStyle('StatValue', parent=styles['Normal'], fontSize=16, textColor=colors.HexColor('#111827'), alignment=1, fontName='Helvetica-Bold')

    # 1. Header Area
    elements.append(Paragraph("WORK PROGRESS REPORT", title_style))
    elements.append(Paragraph("AGROMET LAB TASK TRACKER", header_accent))
    elements.append(Spacer(1, 12))

    # 2. Executive Summary (Tiles)
    summary_data = [
        [Paragraph("Completed Tasks", stat_label), Paragraph("Active Projects", stat_label), Paragraph("High Priority", stat_label)],
        [Paragraph(str(past_works.count()), stat_value), Paragraph(str(len(project_stats)), stat_value), Paragraph(str(priority_stats['high']), stat_value)]
    ]
    summary_table = Table(summary_data, colWidths=[160, 160, 160])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f9fafb')),
        ('ROUNDEDCORNERS', [10, 10, 10, 10]),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 20))

    # 3. Informational Insights Section
    if past_works.exists():
        elements.append(Paragraph("Distributions & Insights", section_style))
        
        # Project distribution table
        dist_data = [['Project Name', 'Tasks Completed', 'Contribution %']]
        total = past_works.count()
        for p_name, count in sorted(project_stats.items(), key=lambda x: x[1], reverse=True):
            percent = int((count / total) * 100)
            dist_data.append([p_name, str(count), f"{percent}%"])
            
        dist_table = Table(dist_data, colWidths=[200, 150, 130])
        dist_table.setStyle(TableStyle([
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#064e3b')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#d1fae5')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
        ]))
        elements.append(dist_table)
        elements.append(Spacer(1, 25))

        # 4. Detailed Log
        elements.append(Paragraph("Detailed Activity Log", section_style))
        log_data = [['Date', 'Task Detail', 'Category', 'Priority']]
        for work in past_works:
            color = colors.HexColor('#991b1b') if work.priority == 'high' else colors.HexColor('#92400e') if work.priority == 'medium' else colors.HexColor('#065f46')
            log_data.append([
                work.date.strftime('%d %b'),
                work.title,
                work.project.name if work.project else "General",
                Paragraph(f"<font color='{color.hexval()}'>{work.priority.upper()}</font>", info_text)
            ])

        log_table = Table(log_data, colWidths=[70, 210, 120, 80], repeatRows=1)
        log_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#111827')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('TOPPADDING', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 0.1, colors.HexColor('#f3f4f6')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
        ]))
        elements.append(log_table)
    else:
        elements.append(Paragraph("No activity recorded in the selected timeframe.", styles['Italic']))

    # 5. Professional Footer
    elements.append(Spacer(1, 50))
    footer_text = f"Report generated on {datetime.now().strftime('%B %d, %Y at %H:%M')}<br/>Authorized by Agromet Lab Task Tracker."
    elements.append(Paragraph(f"<font color='#9ca3af' size='8'>{footer_text}</font>", info_text))

    doc.build(elements)
    buffer.seek(0)
    
    filename = f"work_summary_{end_date.strftime('%Y%m%d')}_{days}d.pdf"
    return FileResponse(buffer, as_attachment=True, filename=filename)
