from django import forms
from .models import Agenda, Collaborator

class CollaboratorForm(forms.ModelForm):
    class Meta:
        model = Collaborator
        fields = ['name', 'institute', 'address', 'email', 'whatsapp_number', 'image']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-400'}),
            'institute': forms.TextInput(attrs={'class': 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-400'}),
            'address': forms.Textarea(attrs={'rows': 3, 'class': 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-400'}),
            'email': forms.EmailInput(attrs={'class': 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-400'}),
            'whatsapp_number': forms.TextInput(attrs={'class': 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-400'}),
            'image': forms.FileInput(attrs={'class': 'block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all border border-gray-300 rounded-lg'}),
        }

class AgendaForm(forms.ModelForm):
    class Meta:
        model = Agenda
        fields = ['project', 'title', 'description', 'date', 'time', 'expected_finish_date', 'expected_finish_time', 'priority', 'external_link', 'attachment', 'collaborators']
        widgets = {
            'date': forms.DateInput(attrs={'type': 'date'}),
            'time': forms.TimeInput(attrs={'type': 'time'}),
            'expected_finish_date': forms.DateInput(attrs={'type': 'date'}),
            'expected_finish_time': forms.TimeInput(attrs={'type': 'time'}),
            'collaborators': forms.CheckboxSelectMultiple(), # Use checkboxes for multiple selection
        }
