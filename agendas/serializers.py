from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Project, Agenda, Collaborator, Notification, ProjectRequest, AgendaAssignment, PersonalNote


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    image_url = serializers.SerializerMethodField()
    collaborator_id = serializers.IntegerField(source='collaborator_profile.id', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_superuser', 'is_staff', 'date_joined', 'image_url', 'collaborator_id']
        read_only_fields = ['id']

    def get_image_url(self, obj):
        try:
            if hasattr(obj, 'collaborator_profile'):
                profile = obj.collaborator_profile
                if profile and profile.image:
                    request = self.context.get('request')
                    if request:
                        return request.build_absolute_uri(profile.image.url)
                    return profile.image.url
        except Exception:
            pass
        return None


class CollaboratorSerializer(serializers.ModelSerializer):
    """Serializer for Collaborator model"""
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='user',
        write_only=True,
        required=False,
        allow_null=True
    )
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Collaborator
        fields = [
            'id', 'user', 'user_id', 'name', 'institute', 'address',
            'email', 'whatsapp_number', 'image', 'image_url',
            'designation', 'division', 'organization', 'education',
            'research_experience', 'publications', 'research_interests',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_image_url(self, obj):
        """Get absolute URL for collaborator image"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ProjectSerializer(serializers.ModelSerializer):
    """Serializer for Project model"""
    total_agendas = serializers.SerializerMethodField()
    completed_agendas = serializers.SerializerMethodField()
    progress_percent = serializers.SerializerMethodField()
    members = CollaboratorSerializer(many=True, read_only=True)
    member_ids = serializers.PrimaryKeyRelatedField(
        queryset=Collaborator.objects.all(),
        source='members',
        many=True,
        write_only=True,
        required=False
    )
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'color', 'created_by', 'created_by_name',
            'members', 'member_ids', 'created_at', 'updated_at',
            'total_agendas', 'completed_agendas', 'progress_percent'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_user_agendas(self, obj):
        """Helper to get agendas visible to current user"""
        try:
            user = self.context['request'].user
            if user.is_superuser:
                return obj.agendas.all()
            return obj.agendas.filter(collaborators__user=user)
        except (KeyError, AttributeError):
            # Fallback if no request context (e.g., nested serialization)
            return obj.agendas.all()

    def get_total_agendas(self, obj):
        return self.get_user_agendas(obj).count()

    def get_completed_agendas(self, obj):
        return self.get_user_agendas(obj).filter(status='completed').count()

    def get_progress_percent(self, obj):
        total = self.get_total_agendas(obj)
        if total == 0:
            return 0
        completed = self.get_completed_agendas(obj)
        return int((completed / total) * 100)


class AgendaAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for AgendaAssignment through model"""
    collaborator_name = serializers.CharField(source='collaborator.name', read_only=True)
    collaborator_image = serializers.SerializerMethodField()
    
    class Meta:
        model = AgendaAssignment
        fields = ['id', 'collaborator', 'collaborator_name', 'collaborator_image', 'status', 'rejection_reason', 'created_at']
        read_only_fields = ['id', 'status', 'created_at']

    def get_collaborator_image(self, obj):
        if obj.collaborator.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.collaborator.image.url)
            return obj.collaborator.image.url
        return None


class AgendaListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for agenda lists"""
    project_name = serializers.CharField(source='project.name', read_only=True)
    project_color = serializers.CharField(source='project.color', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    calculated_category = serializers.CharField(read_only=True)
    collaborator_count = serializers.SerializerMethodField()
    project_info = serializers.SerializerMethodField()
    creator_name = serializers.CharField(source='created_by.get_full_name', read_only=True, default='Administrator')
    team_leader_name = serializers.CharField(source='team_leader.name', read_only=True)
    
    class Meta:
        model = Agenda
        fields = [
            'id', 'title', 'type', 'date', 'time', 'status', 'priority', 'category',
            'project', 'project_name', 'project_color', 'project_info',
            'is_overdue', 'calculated_category', 'collaborator_count', 'meeting_link', 
            'created_by', 'creator_name', 'team_leader', 'team_leader_name', 
            'actual_participants', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'created_by', 'team_leader']
    
    def get_collaborator_count(self, obj):
        return obj.collaborators.count()

    def get_project_info(self, obj):
        if obj.project:
            return {
                'id': obj.project.id,
                'name': obj.project.name,
                'color': obj.project.color
            }
        return None


class AgendaDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for agenda with all relationships"""
    project = ProjectSerializer(read_only=True)
    project_id = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(),
        source='project',
        write_only=True,
        required=False,
        allow_null=True
    )
    collaborators = CollaboratorSerializer(many=True, read_only=True)
    assignments = AgendaAssignmentSerializer(many=True, read_only=True)
    collaborator_ids = serializers.PrimaryKeyRelatedField(
        queryset=Collaborator.objects.all(),
        source='collaborators',
        many=True,
        write_only=True,
        required=False
    )
    actual_participants = CollaboratorSerializer(many=True, read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    calculated_category = serializers.CharField(read_only=True)
    attachment_url = serializers.SerializerMethodField()
    team_leader = CollaboratorSerializer(read_only=True)
    team_leader_id = serializers.PrimaryKeyRelatedField(
        queryset=Collaborator.objects.all(),
        source='team_leader',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = Agenda
        fields = [
            'id', 'project', 'project_id', 'title', 'description', 'type',
            'date', 'time', 'expected_finish_date', 'expected_finish_time',
            'status', 'priority', 'category', 'external_link', 'attachment', 'attachment_url',
            'collaborators', 'collaborator_ids', 'assignments', 'actual_participants', 'team_leader', 'team_leader_id', 'is_overdue', 'calculated_category',
            'meeting_link', 'google_event_id', 'created_by',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_attachment_url(self, obj):
        """Get absolute URL for attachment"""
        if obj.attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.attachment.url)
            return obj.attachment.url
        return None
    
    def create(self, validated_data):
        """Handle creating agenda with collaborators and auto-assignments"""
        request = self.context.get('request')
        if request and request.user and not validated_data.get('created_by'):
            validated_data['created_by'] = request.user
            
        # Also ensure team_leader is set to the creator if not already present
        if request and request.user and not validated_data.get('team_leader'):
            collaborator = getattr(request.user, 'collaborator_profile', None)
            if collaborator:
                validated_data['team_leader'] = collaborator

        collaborators = validated_data.pop('collaborators', [])
        actual_participants = validated_data.pop('actual_participants', [])
        agenda = Agenda.objects.create(**validated_data)
        
        # 1. Creator auto-accepts
        creator_collab = getattr(agenda.created_by, 'collaborator_profile', None)
        if creator_collab:
            AgendaAssignment.objects.update_or_create(
                agenda=agenda,
                collaborator=creator_collab,
                defaults={'status': 'accepted'}
            )

        # 2. Team Leader (if different) gets pending invitation
        if agenda.team_leader and agenda.team_leader != creator_collab:
            AgendaAssignment.objects.get_or_create(
                agenda=agenda,
                collaborator=agenda.team_leader,
                defaults={'status': 'pending'}
            )
            Notification.objects.create(
                user=agenda.team_leader.user,
                title="Leadership Request",
                message=f"You have been assigned as Team Leader for: {agenda.title}",
                notification_type='collaborator_added',
                related_agenda=agenda
            )

        # 3. Create assignments for other collaborators
        for collaborator in collaborators:
            # Skip if already handled (creator/leader)
            if collaborator == creator_collab or collaborator == agenda.team_leader:
                continue
                
            AgendaAssignment.objects.get_or_create(
                agenda=agenda,
                collaborator=collaborator,
                defaults={'status': 'pending'}
            )
            
            # Notify collaborator
            Notification.objects.create(
                user=collaborator.user,
                title="New Task Invitation",
                message=f"You have been invited to join the task: {agenda.title}",
                notification_type='collaborator_added',
                related_agenda=agenda
            )
            
        if actual_participants:
            agenda.actual_participants.set(actual_participants)
        return agenda

    def update(self, instance, validated_data):
        """Handle updating agenda with collaborators and leader changes"""
        new_collaborators = validated_data.pop('collaborators', None)
        actual_participants = validated_data.pop('actual_participants', None)
        old_leader = instance.team_leader
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Ensure new leader has an assignment
        if instance.team_leader and instance.team_leader != old_leader:
            AgendaAssignment.objects.get_or_create(
                agenda=instance,
                collaborator=instance.team_leader,
                defaults={'status': 'pending'}
            )

        if new_collaborators is not None:
            current_collaborators = set(instance.collaborators.all())
            target_collaborators = set(new_collaborators)
            
            # Remove collaborators no longer selected (except creator/leader)
            creator_collab = getattr(instance.created_by, 'collaborator_profile', None)
            collabs_to_remove = current_collaborators - target_collaborators
            if creator_collab: collabs_to_remove.discard(creator_collab)
            if instance.team_leader: collabs_to_remove.discard(instance.team_leader)

            AgendaAssignment.objects.filter(
                agenda=instance, 
                collaborator__in=collabs_to_remove
            ).delete()
            
            # Add new collaborators as pending
            for collaborator in target_collaborators - current_collaborators:
                AgendaAssignment.objects.get_or_create(
                    agenda=instance,
                    collaborator=collaborator,
                    defaults={'status': 'pending'}
                )
                # Notify new collaborator
                Notification.objects.create(
                    user=collaborator.user,
                    title="New Task Invitation",
                    message=f"You have been invited to join the task: {instance.title}",
                    notification_type='collaborator_added',
                    related_agenda=instance
                )
        
        if actual_participants is not None:
            instance.actual_participants.set(actual_participants)
            
        return instance


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications"""
    related_agenda = AgendaListSerializer(read_only=True)
    related_project = ProjectSerializer(read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'notification_type',
            'is_read', 'created_at', 'related_agenda', 'related_project'
        ]
        read_only_fields = ['id', 'created_at']

class ProjectRequestSerializer(serializers.ModelSerializer):
    """Serializer for project creation requests"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = ProjectRequest
        fields = [
            'id', 'user', 'user_name', 'name', 'description', 
            'color', 'status', 'admin_comment', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'status', 'created_at', 'updated_at']

class PersonalNoteSerializer(serializers.ModelSerializer):
    """Serializer for personal notes"""
    
    class Meta:
        model = PersonalNote
        fields = ['id', 'user', 'title', 'content', 'color', 'is_pinned', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
