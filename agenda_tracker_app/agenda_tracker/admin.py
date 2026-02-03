from django.contrib import admin
from .models import Project, Agenda


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
