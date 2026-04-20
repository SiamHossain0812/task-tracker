from django.db import models, transaction
from django.contrib.auth.models import User
from datetime import date


class Project(models.Model):
    COLOR_CHOICES = [
        ('emerald', 'Emerald'),
        ('indigo', 'Indigo'),
        ('blue', 'Blue'),
        ('rose', 'Rose'),
        ('amber', 'Amber'),
        ('purple', 'Purple'),
        ('orange', 'Orange'),
        ('slate', 'Slate'),
    ]
    
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=20, choices=COLOR_CHOICES, default='indigo')
    created_by = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='created_projects', null=True, blank=True)
    members = models.ManyToManyField('Collaborator', related_name='projects', blank=True)
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
    user = models.OneToOneField('auth.User', on_delete=models.CASCADE, null=True, blank=True, related_name='collaborator_profile')
    name = models.CharField(max_length=200)
    institute = models.CharField(max_length=200, blank=True)
    address = models.TextField(blank=True)
    email = models.EmailField(blank=True)
    whatsapp_number = models.CharField(max_length=20, blank=True)
    image = models.ImageField(upload_to='collaborators/', blank=True, null=True)
    
    # Professional Profile Fields
    designation = models.CharField(max_length=200, blank=True, null=True)
    division = models.CharField(max_length=200, blank=True, null=True)
    organization = models.CharField(max_length=200, blank=True, null=True)
    education = models.TextField(blank=True, null=True)
    research_experience = models.TextField(blank=True, null=True)
    publications = models.TextField(blank=True, null=True)
    research_interests = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Synchronize email with User object if linked
        if self.user and self.email:
            if self.user.email != self.email:
                self.user.email = self.email
                self.user.save(update_fields=['email'])
        super().save(*args, **kwargs)

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
    
    CATEGORY_CHOICES = [
        ('short', 'Short-term'),
        ('mid', 'Mid-term'),
        ('long', 'Long-term'),
    ]

    TASK_TAG_CHOICES = [
        ('professional_knowledge', 'Professional Knowledge'),
        ('quality_of_work', 'Quality of Work'),
        ('devotion_to_duty', 'Devotion to Duty'),
        ('quantity_of_work_performed', 'Quantity of Work Performed'),
        ('decision_making_skills', 'Decision-Making Skills'),
        ('ability_to_implement_decisions', 'Ability to Implement Decisions'),
        ('supervise_lead_subordinates', 'Capacity to Supervise and Lead Subordinates'),
        ('teamwork_leadership', 'Capacity for Teamwork, Cooperation, and Leadership'),
        ('efiling_internet_usage', 'Interest and Proficiency in E-filing and Internet Usage'),
        ('innovative_work', 'Interest and Capacity for Innovative Work'),
        ('expression_writing', 'Power of Expression (Writing)'),
        ('expression_verbal', 'Power of Expression (Verbal)'),
        ('morality_ethics', 'Morality / Ethics'),
        ('honesty_integrity', 'Honesty / Integrity'),
        ('discipline', 'Sense of Discipline'),
        ('judgment_proportion', 'Judgment and Sense of Proportion'),
        ('personality', 'Personality'),
        ('cooperative_attitude', 'Cooperative Attitude'),
        ('punctuality', 'Punctuality'),
        ('reliability_dependability', 'Reliability / Dependability'),
        ('responsibility', 'Sense of Responsibility'),
        ('interest_attentiveness', 'Interest and Attentiveness in Work'),
        ('following_instructions', 'Promptness in Following Instructions of Higher Authorities'),
        ('initiative', 'Initiative'),
        ('stakeholder_behavior', 'Behavior with Service Recipients / Stakeholders'),
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
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, blank=True, null=True, help_text="Manual category override")
    task_tag = models.CharField(max_length=100, choices=TASK_TAG_CHOICES, blank=True, null=True, help_text="Formal task classification")
    
    TYPE_CHOICES = [
        ('task', 'Task'),
        ('meeting', 'Meeting'),
    ]
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='task')
    
    # Resourceful Fields
    external_link = models.URLField(blank=True, help_text="Link to external resources (e.g., Google Doc, Research Paper)")
    attachment = models.FileField(upload_to='attachments/', blank=True, help_text="Upload relevant files")
    
    # Google Meet Integration
    meeting_link = models.URLField(blank=True, help_text="Google Meet link for this task")
    google_event_id = models.CharField(max_length=255, blank=True, help_text="Google Calendar event ID")
    
    created_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='created_agendas')
    team_leader = models.ForeignKey(Collaborator, on_delete=models.SET_NULL, null=True, blank=True, related_name='led_agendas')
    collaborators = models.ManyToManyField(Collaborator, blank=True, related_name='agendas', through='AgendaAssignment')
    actual_participants = models.ManyToManyField(Collaborator, blank=True, related_name='attended_meetings')
    
    # Extension Tracking
    was_missed = models.BooleanField(default=False, help_text="Flagged if task passed deadline without completion")
    extension_count = models.IntegerField(default=0, help_text="Number of times time has been extended")
    original_deadline_date = models.DateField(null=True, blank=True)
    original_deadline_time = models.TimeField(null=True, blank=True)
    
    # Extension Request System
    EXTENSION_STATUS_CHOICES = (
        ('none', 'None'),
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    extension_status = models.CharField(max_length=20, choices=EXTENSION_STATUS_CHOICES, default='none')
    requested_finish_date = models.DateField(null=True, blank=True)
    requested_finish_time = models.TimeField(null=True, blank=True)
    extension_reason = models.TextField(null=True, blank=True)
    extension_requested_by = models.ForeignKey(Collaborator, on_delete=models.SET_NULL, null=True, blank=True, related_name='requested_extensions')
    
    # Performance KPIs
    estimated_hours = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text="Estimated time to complete this task (for Efficiency Score)")
    actual_hours = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text="Actual time taken to complete this task")
    is_archived = models.BooleanField(default=False, help_text="Hide from main view while retaining for reference")
    rework_count = models.IntegerField(default=0, help_text="Number of times task was sent back for rework (for Reliability Score)")
    missed_updates = models.IntegerField(default=0, help_text="Number of missed scheduled updates (for Reliability Score)")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True, help_text="Timestamp when status was last set to 'completed'")

    class Meta:
        ordering = ['date', 'time']
    
    @property
    def calculated_category(self):
        """Auto-calculate category based on task duration"""
        if not self.expected_finish_date:
            return 'short'  # Default to short-term if no finish date
        
        duration = (self.expected_finish_date - self.date).days
        
        if duration <= 3:
            return 'short'
        elif duration <= 10:
            return 'mid'
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


class AgendaUpdate(models.Model):
    """
    Logs a progress update provided by a collaborator on a specific task.
    The time elapsed percentage is automatically calculated on creation.
    """
    agenda = models.ForeignKey(Agenda, on_delete=models.CASCADE, related_name='updates')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='agenda_updates')
    text = models.TextField()
    time_elapsed_percentage = models.IntegerField(
        help_text="Auto-calculated percentage of total time elapsed when this was posted"
    )
    attachment = models.FileField(upload_to='agenda_updates/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Update on {self.agenda.title} by {self.author.username}"


class Notification(models.Model):
    """Model for user notifications"""
    NOTIFICATION_TYPES = [
        ('agenda_due', 'Agenda Due Soon'),
        ('agenda_overdue', 'Agenda Overdue'),
        ('status_change', 'Status Changed'),
        ('collaborator_added', 'Collaborator Added'),
        ('agenda_created', 'Agenda Created'),
        ('agenda_updated', 'Agenda Updated'),
        ('meeting_invite', 'Meeting Invitation'),
        ('meeting_updated', 'Meeting Updated'),
        ('project_created', 'Project Created'),
        ('time_elapsed_warning', 'Time Elapsed Warning'),
        ('deadline_warning', 'Deadline Warning'),
        ('stagnation', 'Task Stagnant'),
        ('comment_added', 'New Task Comment'),
    ]
    
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    related_agenda = models.ForeignKey(Agenda, on_delete=models.CASCADE, null=True, blank=True)
    related_project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True, blank=True)
    related_schedule = models.ForeignKey('Schedule', on_delete=models.CASCADE, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"


class PushSubscription(models.Model):
    """Stores browser Push API subscription details for a user"""
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='push_subscriptions')
    endpoint = models.URLField(max_length=500, unique=True)
    p256dh = models.CharField(max_length=200)
    auth = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Push Sub for {self.user.username}"




class UserProfile(models.Model):
    """Extended user profile with phone number"""
    user = models.OneToOneField('auth.User', on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=20, unique=True, blank=True, null=True, help_text="Phone number for login")
    
    def __str__(self):
        return f"Profile for {self.user.username}"


class GoogleToken(models.Model):
    """Stores Google OAuth tokens for a user"""
    user = models.OneToOneField('auth.User', on_delete=models.CASCADE, related_name='google_token')
    access_token = models.TextField()
    refresh_token = models.TextField(null=True, blank=True)
    token_uri = models.CharField(max_length=200, default="https://oauth2.googleapis.com/token")
    client_id = models.CharField(max_length=200)
    client_secret = models.CharField(max_length=200)
    scopes = models.TextField()
    expiry = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Google Token for {self.user.username}"

# --- SIGNALS FOR AUTOMATED PROFILE MANAGEMENT ---
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.models import User
from .utils import ensure_user_profile_sync

@receiver(post_save, sender=User)
def manage_user_profiles(sender, instance, created, **kwargs):
    """
    Automatically manage UserProfile and Collaborator when a User is saved.
    This ensures no user is ever 'orphaned' without their professional profile.
    This is wrapped in a try-except to prevent registration/save crashes if sync fails.
    """
    try:
        ensure_user_profile_sync(instance)
    except Exception as e:
        print(f"[agendas.models] Warning: Profile sync failed for user {instance.username}: {e}")

@receiver(post_delete, sender=Collaborator)
def delete_user_account(sender, instance, **kwargs):
    """
    Ensure the User account is deleted if the Collaborator profile is removed.
    This enforces the rule that every user MUST be a collaborator.
    """
    user_id = getattr(instance, 'user_id', None)
    if user_id:
        try:
            # We use filter().delete() as it is safer and doesn't raise DoesNotExist
            # if the user was already deleted (e.g. via CASCADE from User.delete())
            deleted_count, _ = User.objects.filter(id=user_id).delete()
            if deleted_count:
                print(f"[agendas.models] Collaborator {instance.id} deleted. Removed associated User ID {user_id}.")
        except Exception as e:
            # We catch all exceptions to prevent deletion of collaborator from failing
            # due to a secondary account cleanup issue.
            print(f"[agendas.models] Error in delete_user_account signal for User {user_id}: {e}")


class ProjectRequest(models.Model):
    """Model for project creation requests from collaborators"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='project_requests')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=20, choices=Project.COLOR_CHOICES, default='indigo')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_comment = models.TextField(blank=True, help_text="Reason for rejection or approval notes")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Request for {self.name} by {self.user.username}"

class AgendaAssignment(models.Model):
    """Through model for Agenda collaborators to track invitation status"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    
    agenda = models.ForeignKey(Agenda, on_delete=models.CASCADE, related_name='assignments')
    collaborator = models.ForeignKey(Collaborator, on_delete=models.CASCADE, related_name='assignments')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    rejection_reason = models.TextField(blank=True, null=True)
    duties = models.TextField(blank=True, null=True, help_text="Specific duties assigned to this collaborator for this task")
    
    # Performance Metric Scores
    quality_score = models.IntegerField(null=True, blank=True, help_text="1-5 rating provided by reviewer")
    timeliness_score = models.IntegerField(null=True, blank=True, help_text="TS: 0-100 calculated based on delay penalty")
    efficiency_score = models.IntegerField(null=True, blank=True, help_text="ES: 0-100 calculated from estimated vs actual time")
    reliability_score = models.IntegerField(null=True, blank=True, help_text="RS: 0-100 calculated from reworks and missed updates")
    composite_score = models.IntegerField(null=True, blank=True, help_text="Overall weighted performance score (0-100)")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('agenda', 'collaborator')
        ordering = ['-created_at']


class PersonalNote(models.Model):
    """Simple personal notes for users"""
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='personal_notes')
    related_agenda = models.ForeignKey('Agenda', on_delete=models.CASCADE, null=True, blank=True, related_name='personal_notes')
    title = models.CharField(max_length=200, blank=True)
    content = models.TextField()
    color = models.CharField(max_length=50, default='#ffffff')  # hex color
    is_pinned = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_pinned', '-updated_at']

    def __str__(self):
        return f"Note by {self.user.username}: {self.title or self.content[:30]}"

class Schedule(models.Model):
    """Private individual schedules"""
    STATUS_CHOICES = [
        ('undone', 'Undone'),
        ('done', 'Done'),
    ]
    
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='schedules')
    subject = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='undone')
    place = models.CharField(max_length=255, blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    
    # Notification tracking
    is_notified = models.BooleanField(default=False, help_text="Flagged if 30-minute reminder was sent")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['date', 'start_time']
        verbose_name = "Schedule"
        verbose_name_plural = "Schedules"
    
    def __str__(self):
        return f"{self.subject} ({self.date})"


class TaskComment(models.Model):
    """
    Specialized comment system for agendas.
    Supports Group (Everyone) and Individual (Private) comments.
    """
    agenda = models.ForeignKey(Agenda, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_comments')
    recipients = models.ManyToManyField(User, related_name='private_comments', blank=True, help_text="Empty for Group comments")
    text = models.TextField()
    is_group_comment = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        scope = "Group" if self.is_group_comment else f"Private ({self.recipients.count()} recipients)"
        return f"Comment by {self.author.username} ({scope}) on {self.agenda.title}"
