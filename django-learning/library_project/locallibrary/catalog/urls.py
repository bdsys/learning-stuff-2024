from django.urls import path, re_path
from . import views

urlpatterns = [
    # /catalog/
    path('', views.index, name='index'),
    # /catalog/books/
    path('books/', views.BookListView.as_view(), name='books'),
    # /catalog/book/<book_instance model "id" field>
    # <> angle brackets indicate data to be captured for the view
    # int:pk -- "primary key" of integer value (though, it's passed as a string) - 
    # - This is expected by the generic class. Custom functions that use whatever.
    # path('book/<int:pk>', views.BookDetailView.as_view(), name='book-detail'),
    
    # /catalog/book/<id>
    
    # REgex version for "book/<pk>" where pk = unlimited digits
    re_path(r'^book/(?P<pk>\d+)$', views.BookDetailView.as_view(), name='book-detail'),
    
    # Example of how to pass additional parameters to a view function
    # path('myurl/<int:fish>', views.my_view, {'my_template_name': 'some_path'}, name='aurl'),

    # /catalog/authors/
    path('authors/', views.AuthorListView.as_view(), name='authors'),
    
    # /catalog/author/<id>
    re_path(r'^author/(?P<pk>\d+)$', views.AuthorDetailView.as_view(), name='author-detail'),
    # path('author/<int:pk>', views.AuthorDetailView.as_view(), name='author-detail'),

    # /catalog/mybooks/   
    path('mybooks/', views.LoanedBooksByUserListView.as_view(), name='my-borrowed'),
    
    # /catalog/borrowed/   
    path('borrowed/', views.AllLoanedBooksByUserListView.as_view(), name='all-borrowed'),
    
    # Renew book custom form
    # /catalog/book/<bookinstance_id>/renew/
    path('book/<uuid:pk>/renew/', views.renew_book_librarian, name='renew-book-librarian'),
    
    # Author generic forms
    # /catalog/author/create
    path('author/create/', views.AuthorCreate.as_view(), name='author-create'),
    # /catalog/author/<author_id>/update
    path('author/<int:pk>/update/', views.AuthorUpdate.as_view(), name='author-update'),
    # /catalog/author/<author_id>/delete
    path('author/<int:pk>/delete/', views.AuthorDelete.as_view(), name='author-delete'),
    
    # Book generic forms
    # /catalog/book/create
    path('book/create/', views.BookCreate.as_view(), name='book-create'),
    # /catalog/book/<author_id>/update
    path('book/<int:pk>/update/', views.BookUpdate.as_view(), name='book-update'),
    # /catalog/book/<author_id>/delete
    path('book/<int:pk>/delete/', views.BookDelete.as_view(), name='book-delete'),

]


