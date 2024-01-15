from django.contrib import admin

# # The following are used for the User model
# from django.contrib import admin
# from django.contrib.auth.admin import UserAdmin
# # end user model

# Register your models here.
from .models import Author, Genre, Language, Book, BookInstance
# from .models import User

# Register base models
admin.site.register(Genre)
admin.site.register(Language)
# admin.site.register(User, UserAdmin)

class BookInlineToAuthor(admin.TabularInline):
    model = Book
    extra = 0

# Define the admin class
class AuthorAdmin(admin.ModelAdmin):
    # pass # do nothing
    list_display = ('last_name', 'first_name', 'date_of_birth', 'date_of_death')
     # Fields changes how the input form is displayed. The () tupple parenthesis mean that the inside fields wil be displayed horizontally rather than the verticle default.
    fields = ['first_name', 'last_name', ('date_of_birth', 'date_of_death')]
    
    inlines = [BookInlineToAuthor]

# Register the admin class with the associated model
admin.site.register(Author, AuthorAdmin)


class BooksInstanceInline(admin.TabularInline):
    model = BookInstance
    # The "extra" attribute is used to display additional non-declared objects of the model type. Setting to zero is a more intuitive design.
    extra = 0

# Register the Admin classes for Book using the decorator
@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'display_genre', 'language')
    
    # Display book instances, horizontally (tabular), at the bottom of the book form. See "BookInstanceInline" class
    inlines = [BooksInstanceInline]
    

# Register the Admin classes for BookInstance using the decorator
@admin.register(BookInstance)
class BookInstanceAdmin(admin.ModelAdmin):
    
    list_display = ('book', 'status', 'borrower', 'due_back', 'id')
    
    # List_filter displays a filter option set to the right of the table display in the admin portal
    list_filter = ('book', 'status', 'due_back', 'id')

    # fieldsets changes how the input form is disaplyed. each tupple () member (E.g. None and Avaialbility) is it's own distinct section on the form.
    fieldsets = (
        (None, {
            'fields': ('book', 'imprint', 'id')
        }),
        ('Availability', {
            'fields': ('status', 'due_back', 'borrower',)
        }),
    )
