from django.db import models
from datetime import date


class Project(models.Model):
    COLOR_CHOICES = [
        ('indigo', 'Indigo'),
        ('purple', 'Purple'),
        ('pink', 'Pink'),
        ('red', 'Red'),
        ('orange', 'Orange'),
        ('green', 'Green'),
        ('teal', 'Teal'),
        ('cyan', 'Cyan'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=20, choices=COLOR_CHOICES, default='indigo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    @property
    def total_agendas(self):
        return self.agendas.count()
    
    @property
    def completed_agendas(self):
        return self.agendas.filter(status='completed').count()
    
    @property
    def progress_percent(self):
        total = self.total_agendas
        if total == 0:
            return 0
        return int((self.completed_agendas / total) * 100)


class Collaborator(models.Model):
    user = models.OneToOneField('auth.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='collaborator_profile')
    name = models.CharField(max_length=200)
    institute = models.CharField(max_length=200, blank=True)
    address = models.TextField(blank=True)
    email = models.EmailField(blank=True)
    whatsapp_number = models.CharField(max_length=20, blank=True)
    image = models.ImageField(upload_to='collaborators/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Agenda(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in-progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='agendas', null=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    date = models.DateField()
    time = models.TimeField(blank=True, null=True)
    expected_finish_date = models.DateField(blank=True, null=True)
    expected_finish_time = models.TimeField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    
    # Resourceful Fields
    external_link = models.URLField(blank=True, help_text="Link to external resources (e.g., Google Doc, Research Paper)")
    attachment = models.FileField(upload_to='attachments/', blank=True, help_text="Upload relevant files")
    collaborators = models.ManyToManyField(Collaborator, blank=True, related_name='agendas')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['date', 'time']
    
    @property
    def is_overdue(self):
        if self.status == 'completed':
            return False
            
        from django.utils import timezone
        from datetime import datetime
        
        now = timezone.now()
        
        # Determine the deadline for being overdue
        # If expected finish date/time is set, use it. Otherwise fallback to start date/time.
        deadline_date = self.expected_finish_date or self.date
        deadline_time = self.expected_finish_time or self.time
        
        if deadline_time:
            # Combine date and time for a full deadline timestamp
            deadline = timezone.make_aware(datetime.combine(deadline_date, deadline_time))
            return now > deadline
        else:
            # If no time is set, it's overdue after the deadline day ends
            return now.date() > deadline_date

    def __str__(self):
        return self.title


class Notification(models.Model):
    """Model for user notifications"""
    NOTIFICATION_TYPES = [
        ('agenda_due', 'Agenda Due Soon'),
        ('agenda_overdue', 'Agenda Overdue'),
        ('status_change', 'Status Changed'),
        ('collaborator_added', 'Collaborator Added'),
        ('agenda_created', 'Agenda Created'),
        ('agenda_updated', 'Agenda Updated'),
        ('project_created', 'Project Created'),
    ]
    
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    related_agenda = models.ForeignKey(Agenda, on_delete=models.CASCADE, null=True, blank=True)
    related_project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"

