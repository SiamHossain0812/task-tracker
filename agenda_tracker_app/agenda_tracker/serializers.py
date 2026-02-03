from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Project, Agenda, Collaborator, Notification


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_superuser', 'is_staff']
        read_only_fields = ['id']


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
            'email', 'whatsapp_number', 'image', 'image_url', 'created_at'
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
    total_agendas = serializers.IntegerField(read_only=True)
    completed_agendas = serializers.IntegerField(read_only=True)
    progress_percent = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'color', 'created_at', 'updated_at',
            'total_agendas', 'completed_agendas', 'progress_percent'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AgendaListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for agenda lists"""
    project_name = serializers.CharField(source='project.name', read_only=True)
    project_color = serializers.CharField(source='project.color', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    collaborator_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Agenda
        fields = [
            'id', 'title', 'date', 'time', 'status', 'priority',
            'project', 'project_name', 'project_color',
            'is_overdue', 'collaborator_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_collaborator_count(self, obj):
        return obj.collaborators.count()


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
    collaborator_ids = serializers.PrimaryKeyRelatedField(
        queryset=Collaborator.objects.all(),
        source='collaborators',
        many=True,
        write_only=True,
        required=False
    )
    is_overdue = serializers.BooleanField(read_only=True)
    attachment_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Agenda
        fields = [
            'id', 'project', 'project_id', 'title', 'description',
            'date', 'time', 'expected_finish_date', 'expected_finish_time',
            'status', 'priority', 'external_link', 'attachment', 'attachment_url',
            'collaborators', 'collaborator_ids', 'is_overdue',
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
        """Handle creating agenda with collaborators"""
        collaborators = validated_data.pop('collaborators', [])
        agenda = Agenda.objects.create(**validated_data)
        if collaborators:
            agenda.collaborators.set(collaborators)
        return agenda
    
    def update(self, instance, validated_data):
        """Handle updating agenda with collaborators"""
        collaborators = validated_data.pop('collaborators', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if collaborators is not None:
            instance.collaborators.set(collaborators)
        
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
