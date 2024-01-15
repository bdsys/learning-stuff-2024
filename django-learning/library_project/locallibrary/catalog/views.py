import datetime

from django.shortcuts import render
# Import pre-build view classes called "generic views"
from django.views import generic

# "Require logins" code for function based views
from django.contrib.auth.decorators import login_required, permission_required

# "Require logins" code for class based views, like generics
    # Note that "PermissionRequireMixin", below, requires login and will 302 to the default login page if invoked by an unauthenticated user  
from django.contrib.auth.mixins import LoginRequiredMixin 

# DB permissions for function based views 
# from django.contrib.auth.decorators import permission_required

# DB permissions for class based views 
from django.contrib.auth.mixins import PermissionRequiredMixin

from django.shortcuts import get_object_or_404

from django.http import HttpResponseRedirect

from django.urls import reverse, reverse_lazy

from catalog.forms import RenewBookForm, RenewBookModelFormExample

from django.views.generic.edit import CreateView, UpdateView, DeleteView # Generic classes for form creation

# Create your views here.
from .models import Book, Author, BookInstance, Genre

# /catalog/index.html
# @ login_required -- used to require logins in this function based view
# @permission_required('catalog.can_mark_returned') -- Users must have the appropriate DB permissions to invoke code in this view
# Note: Add an additional arguement to @permissions_required "raise_exception=True" to throw HTTP 403 instead of default HTTP 302 redir to default login screen.
    # - This matches the class based "PermissionRequiredMixin" behavior -- @permission_required('catalog.can_mark_returned', "raise_exception=True")
def index(request):
    """View function for home page of site."""

    # Generate counts of some of the main objects
    num_books = Book.objects.all().count()
    num_instances = BookInstance.objects.all().count()
    num_genres = Genre.objects.all().count()

    # Available books (status = 'a')
    num_instances_available = BookInstance.objects.filter(status__exact='a').count()
    
    # Number of books by a specific hard coded genre because challenge and nothing else
    genre_by_specific = Book.objects.filter(genre__name__icontains='adventure').count()

    # The 'all()' is implied by default.
    num_authors = Author.objects.count()
    
    # Number of vists to the site from a specific cookie
    num_visits = request.session.get('num_visits_cookie_list', 0) # Get cookie "num_visits_cookie_list', if non-existant create new and set to 0
    request.session['num_visits_cookie_list'] = num_visits + 1
    
    # Python dictionary data array
    context = {
        'num_books': num_books,
        'num_instances': num_instances,
        'num_instances_available': num_instances_available,
        'num_authors': num_authors,
        'num_genres': num_genres,
        'genre_by_specific':genre_by_specific,
        'num_visits': num_visits,
    }

    # Render the HTML template index.html with the data in the context variable
    return render(request, 'index.html', context=context)
# /catalog/books
# Prebuild class "ListView", in the "generic" section of the django.views library, that will list all database -
# - objects corresponding to the "model" variable definition
class BookListView(generic.ListView):
    model = Book
    # The paginate variable below in this generic view will limit the number of results pulled from the database into pages
    # E.g. /catalog/books/?page=1 (1-10), /catalog/books/?page=2 (11 - 20), etc.
    paginate_by = 5
    
    # returns "model"_list (I.e. books_list) or object_list to the template as a var
    
    # Examples of other ways to use generic views such as generic.ListView:
    
    # context_object_name = 'my_book_list'   # your own name for the list as a template variable
    # queryset = Book.objects.filter(title__icontains='war')[:5] # Get 5 books containing the title war -- override the .all() implication
    # template_name = 'books/my_arbitrary_template_name_list.html'  # Specify your own template name/location. Uses /application_name/templates/"modelname"_list.html by default (I.e. /catalog/book/)
    
    # Class function for overriding the .all() implication of the class
    # def get_queryset(self):
    #     return Book.objects.filter(title__icontains='war')[:5] # Get 5 books containing the title war
    
    # Class function with context passed in
    # def get_context_data(self, **kwargs): # Note: **kwargs is used to represent a wildcard passed into the function
    #     # Call the base implementation first to get the context
    #     context = super(BookListView, self).get_context_data(**kwargs)
    #     # Create any data and add it to the context
    #     context['some_data'] = 'This is just some data'
    #     return context
    

# Generic class "DetailView" - passes var "modelname" to template (or object)
# /catalog/book/<id>
class BookDetailView(generic.DetailView):
    model = Book
    paginate_by = 5
    
# Below is an example of what we could use instead of a generic view:

# from django.shortcuts import get_object_or_404 
# def book_detail_view(request, pk):
#     try:
#         book = Book.objects.get(pk=pk)
#     except Book.DoesNotExist:
#         raise Http404('Book does not exist')
          
      # OR
      # get_object_or_404(Book, pk=pk)
          
#     return render(request, 'catalog/book_detail.html', context={'book': book})

# /catalog/authors
class AuthorListView(generic.ListView):
    model = Author
    # The paginate variable below in this generic view will limit the number of results pulled from the database into pages
    # E.g. /catalog/books/?page=1 (1-10), /catalog/books/?page=2 (11 - 20), etc.
    paginate_by = 5
    
# /catalog/author/<id>
class AuthorDetailView(generic.DetailView):
    model = Author
    paginate_by = 5

# Note that the first arguement passed into the class "LoginRequiredMixin" uses Django's code for login checks and behavior
# /catalog/mybooks.html
class LoanedBooksByUserListView(LoginRequiredMixin,generic.ListView):
    """Generic class-based view listing books on loan to current user."""
    model = BookInstance
    template_name ='catalog/bookinstance_list_borrowed_user.html' # Overrides the default of "/catalog/bookinstance_list.html" (/catalog/templates/catalog/bookinstance_list.html -> /catalog/templates/catalog/bookinstance_list_borrowed_user.html)
    paginate_by = 5

    # Note that redefining the function "get_queryset" overrides the defaule of BookInstance.objects.all()
    # Note that self.request enumerates the incoming request invoking this view
    # The default parameter passed to the template remains -- "bookinstance_list"
    def get_queryset(self):
        return BookInstance.objects.filter(borrower=self.request.user).filter(status__exact='o').order_by('due_back')

# /catalog/mybooks.html
class AllLoanedBooksByUserListView(PermissionRequiredMixin,generic.ListView):
    """Generic class-based view listing books on loan to all user."""
    model = BookInstance
    template_name ='catalog/bookinstance_list_borrowed_all.html'
    
    # PermissionRequiredMixin parameters
    permission_required = 'catalog.can_mark_returned'
    # Or multiple permissions
    # permission_required = ('catalog.can_mark_returned', 'catalog.can_edit')

    paginate_by = 5

    # The default parameter passed to the template remains -- "bookinstance_list"
    def get_queryset(self):
        return BookInstance.objects.filter(status__exact='o').order_by('due_back')
        
@login_required
@permission_required('catalog.can_renew', raise_exception=True)
def renew_book_librarian(request, pk):
    """View function for renewing a specific BookInstance by librarian."""
    book_instance = get_object_or_404(BookInstance, pk=pk)

    # If this is a POST request then process the Form data
    if request.method == 'POST':

        # Create a form instance and populate it with data from the request (binding):
        form = RenewBookForm(request.POST)

        # Check if the form is valid:
        if form.is_valid():
            # process the data in form.cleaned_data as required (here we just write it to the model due_back field)
            book_instance.due_back = form.cleaned_data['renewal_date']
            book_instance.save()

            # redirect to a new URL:
            return HttpResponseRedirect(reverse('all-borrowed') )

    # If this is a GET (or any other method) create the default form.
    else:
        proposed_renewal_date = datetime.date.today() + datetime.timedelta(weeks=3)
        form = RenewBookForm(initial={'renewal_date': proposed_renewal_date})
        # form = RenewBookModelFormExample(initial={'due_back': proposed_renewal_date}

    context = {
        'form': form,
        'book_instance': book_instance,
    }
    
    # every field is defined in its own table row when rendered using {{ form.as_table }} in the template
    # Other renderings:
        # ul: {{ form.as_ul }}
        # p: {{ form.as_p }}
    # Full control of rendering elements: https://docs.djangoproject.com/en/3.1/topics/forms/#rendering-fields-manually
        # {{ form.renewal_date }}: The whole field.
        # {{ form.renewal_date.errors }}: The list of errors.
        # {{ form.renewal_date.id_for_label }}: The id of the label.
        # {{ form.renewal_date.help_text }}: The field help text.
    return render(request, 'catalog/book_renew_librarian.html', context)
    
# Generic classes for form creation
# Author
class AuthorCreate(PermissionRequiredMixin, CreateView):
    model = Author
    fields = ['first_name', 'last_name', 'date_of_birth', 'date_of_death']
    # initial = {'date_of_death': '11/06/2020'} # Example of setting an initial value
    
    # Note: Create and Update renders to the same tempalte named "model_name_form.html"
        # The below is used to override this
    # template_name_suffix = "suffix_other_than_form"
    
    # PermissionRequiredMixin parameters
    permission_required = 'catalog.can_create_author'

class AuthorUpdate(PermissionRequiredMixin, UpdateView):
    model = Author
    fields = '__all__' # Not recommended (potential security issue if more fields added)
    
    # Renders to the same template as Create

    # PermissionRequiredMixin parameters
    permission_required = 'catalog.can_update_author'

class AuthorDelete(PermissionRequiredMixin, DeleteView):
    model = Author
    # Required for "DeleteView" generic. All other generics send to the generic detail page of the contextual model object.
    # Note: success_url must be defined if the detail page of a model object isn't generic.
    # Note: reverse_lazy() can be used in generics in place of "HttpResponseRedirect(reverse('all-borrowed') )"
    success_url = reverse_lazy('authors') 
    
    # Note: Delete renders to a tempalte named "model_name_confirm_delete.html"
        # template_name_suffix property can be used here, too
        
    # PermissionRequiredMixin parameters
    permission_required = 'catalog.can_delete_author'

# Book
class BookCreate(PermissionRequiredMixin, CreateView):
    model = Book
    fields = ['title', 'author', 'summary', 'isbn', 'genre', 'language']
    # initial = {'date_of_death': '11/06/2020'} # Example of setting an initial value

    
    # PermissionRequiredMixin parameters
    permission_required = 'catalog.can_create_book'

class BookUpdate(PermissionRequiredMixin, UpdateView):
    model = Book
    fields = '__all__' # Not recommended (potential security issue if more fields added)
    

    # PermissionRequiredMixin parameters
    permission_required = 'catalog.can_update_book'

class BookDelete(PermissionRequiredMixin, DeleteView):
    model = Book
    success_url = reverse_lazy('books') 
    
    # PermissionRequiredMixin parameters
    permission_required = 'catalog.can_delete_book'