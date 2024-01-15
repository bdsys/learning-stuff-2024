import datetime
from django import forms # Django's built-in high level forms code
from django.forms import ModelForm # Built-in form class when only a single model is being manipulated in a form
from django.core.exceptions import ValidationError # Used for raising data validation errors (E.g. raise ValidationError(...))
from django.utils.translation import ugettext_lazy as _

from catalog.models import BookInstance # For example "ModelForm"

# "Middleground" built-in form code FormView (not used) - https://docs.djangoproject.com/en/3.1/ref/class-based-views/generic-editing/#formview

class RenewBookForm(forms.Form):
    renewal_date = forms.DateField(help_text="Enter a date between now and 4 weeks (default 3).")

    # Custom validation function
    # Note - a default function clean_<fieldname> is used to auto-validate. This can be overwritten by making a function of the same name. This is what's happening below.
    def clean_renewal_date(self):
        data = self.cleaned_data['renewal_date']
    
        # Check if a date is not in the past.
        if data < datetime.date.today():
            raise ValidationError(_('Invalid date - renewal in past'))
    
        # Check if a date is in the allowed range (+4 weeks from today).
        if data > datetime.date.today() + datetime.timedelta(weeks=4):
            raise ValidationError(_('Invalid date - renewal more than 4 weeks ahead'))
    
        # Remember to always return the cleaned data.
        return data
    
    # every field is defined in its own table row when rendered using form.as_table

class RenewBookModelFormExample(ModelForm):
    class Meta:
        model = BookInstance # Define the model
        # The below properties override the models.py model properties for this form
        fields = ['due_back']
        labels = {'due_back': _('New renewal date')}
        help_texts = {'due_back': _('Enter a date between now and 4 weeks (default 3).')} 
    
    # Validation code
    def clean_due_back(self):
       data = self.cleaned_data['due_back']

       # Check if a date is not in the past.
       if data < datetime.date.today():
           raise ValidationError(_('Invalid date - renewal in past'))

       # Check if a date is in the allowed range (+4 weeks from today).
       if data > datetime.date.today() + datetime.timedelta(weeks=4):
           raise ValidationError(_('Invalid date - renewal more than 4 weeks ahead'))

       # Remember to always return the cleaned data.
       return data
