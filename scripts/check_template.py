import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','agenda_project.settings')
import django
from django.template import TemplateSyntaxError

django.setup()
from django.template.loader import get_template
try:
    t = get_template('agendas/dashboard.html')
    print('OK')
except TemplateSyntaxError as e:
    print('TemplateSyntaxError:', e)
    import traceback
    traceback.print_exc()
except Exception as e:
    print('Other error:', e)
    import traceback
    traceback.print_exc()
