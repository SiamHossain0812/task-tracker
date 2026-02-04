from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import Project, Agenda, Collaborator, UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile (Phone Number)'
    fields = ['phone_number']


class CustomUserAdmin(BaseUserAdmin):
    inlines = [UserProfileInline]
    list_display = ['username', 'get_phone_number', 'email', 'first_name', 'last_name', 'is_staff', 'is_active']
    
    def get_phone_number(self, obj):
        try:
            return obj.profile.phone_number or '-'
        except UserProfile.DoesNotExist:
            return '-'
    get_phone_number.short_description = 'Phone Number'


# Unregister the default User admin and register custom one
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)


@admin.register(Collaborator)
class CollaboratorAdmin(admin.ModelAdmin):
    list_display = ['name', 'institute', 'email', 'whatsapp_number']
    search_fields = ['name', 'institute', 'email']


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
