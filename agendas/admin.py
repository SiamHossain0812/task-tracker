from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import Project, Agenda, Collaborator, UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Internal Profile (Phone Number)'
    fields = ['phone_number']


class CollaboratorInline(admin.StackedInline):
    model = Collaborator
    can_delete = False
    verbose_name_plural = 'Collaborator Profile (Professional)'
    extra = 0


class CustomUserAdmin(BaseUserAdmin):
    inlines = [UserProfileInline, CollaboratorInline]
    list_display = ['username', 'email', 'get_phone_number', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined']
    list_filter = ['is_staff', 'is_superuser', 'is_active', 'groups', 'date_joined']
    search_fields = ['username', 'first_name', 'last_name', 'email', 'profile__phone_number', 'collaborator_profile__whatsapp_number']
    ordering = ('-date_joined',)
    
    def get_phone_number(self, obj):
        try:
            return obj.profile.phone_number or '-'
        except UserProfile.DoesNotExist:
            return '-'
    get_phone_number.short_description = 'Phone'


# Unregister the default User admin and register custom one
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)


@admin.register(Collaborator)
class CollaboratorAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'is_linked', 'institute', 'email', 'whatsapp_number']
    list_filter = [('user', admin.EmptyFieldListFilter), 'institute', 'division']
    search_fields = ['name', 'institute', 'email', 'whatsapp_number', 'user__username']
    
    def is_linked(self, obj):
        return bool(obj.user)
    is_linked.boolean = True
    is_linked.short_description = 'User Linked'


class AgendaInline(admin.TabularInline):
    model = Agenda
    extra = 1


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'color', 'total_agendas', 'created_at']
    search_fields = ['name', 'description']
    list_filter = ['color', 'created_at']
    inlines = [AgendaInline]


@admin.register(Agenda)
class AgendaAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'date', 'status', 'priority']
    search_fields = ['title', 'description']
    list_filter = ['status', 'priority', 'project', 'date']
    date_hierarchy = 'date'
