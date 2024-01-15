"""locallibrary URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path

# Use include() to add paths from the catalog application
from django.urls import include

#Add URL maps to redirect the base URL to our application
from django.views.generic import RedirectView

# Use static() to add url mapping to serve static files during development (only)
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    # host.tld/admin/
    path('admin/', admin.site.urls),
    # host.tld/catalog/
    path('catalog/', include('catalog.urls')),
    # host.tld/ -> host.tld/catalog/index.html via HTTP 301 redirect
    path('', RedirectView.as_view(url='catalog/', permanent=True)),
    # host.tld/accounts/ - Add Django site authentication urls (for login, logout, password management)
    path('accounts/', include('django.contrib.auth.urls')),
    # Automatically adds the following paths:
        # accounts/ login/ [name='login']
            # path is base_app/templates/registration/login.html -- I.e /library_project/locallibrary/templates/registration/login.html
        # accounts/ logout/ [name='logout']
            # path is base_app/templates/registration/logged_out.html -- I.e /library_project/locallibrary/templates/registration/logged_out.html
        # accounts/ password_change/ [name='password_change']
            # password_reset_email.html

        # accounts/ password_change/done/ [name='password_change_done']

        # accounts/ password_reset/ [name='password_reset']
            # password_reset_form.html

        # accounts/ password_reset/done/ [name='password_reset_done']
            # password_reset_done.html

        # accounts/ reset/<uidb64>/<token>/ [name='password_reset_confirm']
            # password_reset_confirm.html

        # accounts/ reset/done/ [name='password_reset_complete']
            # password_reset_complete.html

        
        
        
    # < Next URL entry here >
]

# Adds static content delivery to the urlpatterns array after the defined items above
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
