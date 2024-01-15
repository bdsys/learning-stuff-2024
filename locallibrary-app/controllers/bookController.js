// Import modules
const { body,validationResult } = require('express-validator');

// Imports modles
var Book = require('../models/book');
var Author = require('../models/author');
var Genre = require('../models/genre');
var BookInstance = require('../models/bookinstance');
var Prohibiteds = require('../models/prohibiteds');

var mongoose = require('mongoose'); // Needed to evaluate errors coming from MongoDB or Mongoose

// Imports async module
var async = require('async');

exports.index = function(req, res) {

    async.parallel({
        book_count: function(callback) {
            Book.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
        },
        book_instance_count: function(callback) {
            BookInstance.countDocuments({}, callback);
        },
        book_instance_available_count: function(callback) {
            BookInstance.countDocuments({status:'Available'}, callback);
        },
        author_count: function(callback) {
            Author.countDocuments({}, callback);
        },
        genre_count: function(callback) {
            Genre.countDocuments({}, callback);
        }
    }, function(err, results) {
        res.render('index', { title: 'Local Library Home', error: err, data: results });
    });
};

// Display list of all Books.
exports.book_list = function(req, res, next) {

  Book.find({}, 'title author')
    .populate('author')
    .exec(function (err, list_books) {
      if (err) { return next(err); }
      //Successful, so render
      res.render('book_list', { title: 'Book List', book_list: list_books });
    });

};

// Display detail page for a specific book.
exports.book_detail = function(req, res, next) {

    if (req.params.id.length == 24) { // Validate Id request parameter 
        var id = mongoose.Types.ObjectId(req.params.id); // Convert Id request parameter to a Mongoose id data type
    }
    else {
        var err = new Error('Unable to query book with Id: ' + req.params.id);
        err.status = 418; // I'm a teapot
        return next(err);
    }

    async.parallel({
        book: function(callback) {

            Book.findById(req.params.id)
              .populate('author')
              .populate('genre')
              .exec(callback);
        },
        book_instance: function(callback) {

          BookInstance.find({ 'book': req.params.id })
          .exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.book==null) { // No results.
            var err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }1
        // Successful, so render.
        res.render('book_detail', { title: results.book.title, book: results.book, book_instances: results.book_instance } );
    });

};

// Display book create form on GET.
exports.book_create_get = function(req, res, next) {

    // Get all authors and genres, which we can use for adding to our book.
    async.parallel({
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        res.render('book_form', { title: 'Create Book', authors: results.authors, genres: results.genres });
    });

};

// Handle book create on POST.
exports.book_create_post = [
    // Convert the genre to an array.
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre ==='undefined')
            req.body.genre = [];
            else
            req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    // Validate and sanitise fields.
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('author', 'Author must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
    body('genre.*').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);
        
        // Force capitalization scheme
        
        var requestBodyTitleLower = req.body.title.toLowerCase();
        var requestBodyAuthorLower = req.body.author.toLowerCase();
        var requestBodySummaryLower = req.body.summary.toLowerCase();
        var requestBodyIsbnUpper = req.body.isbn.toUpperCase(); // Upper case for ISBN
        // var requestBodyGenreLower = req.body.genre.toLowerCase(); // genre omission
        
        // Rebuild request body name paramter as compliant string
        const requestBodyTitleSchemeCompliant = requestBodyTitleLower.charAt(0).toUpperCase() + requestBodyTitleLower.slice(1); // https://flaviocopes.com/how-to-uppercase-first-letter-javascript/
        const requestBodyAuthorSchemeCompliant = requestBodyAuthorLower.charAt(0).toUpperCase() + requestBodyAuthorLower.slice(1); // https://flaviocopes.com/how-to-uppercase-first-letter-javascript/
        const requestBodySummarySchemeCompliant = requestBodySummaryLower.charAt(0).toUpperCase() + requestBodySummaryLower.slice(1); // https://flaviocopes.com/how-to-uppercase-first-letter-javascript/
        // const requestBodyGenreSchemeCompliant = requestBodyGenreLower.charAt(0).toUpperCase() + requestBodyGenreLower.slice(1); // https://flaviocopes.com/how-to-uppercase-first-letter-javascript/ //  genre omission
        
        // Split off author name into first and last name for DB searching
        
        const requestBodyAuthorFirstNameSchemeCompliant = requestBodyAuthorSchemeCompliant.split(" ")[0];
        const requestBodyAuthorFamilyNameSchemeCompliant = requestBodyAuthorSchemeCompliant.split(" ")[1];

        // Create a Book object with escaped and trimmed data.
        var book = new Book(
          { title: requestBodyTitleSchemeCompliant,
            author: requestBodyAuthorSchemeCompliant,
            summary: requestBodySummarySchemeCompliant,
            isbn: requestBodyIsbnUpper,
            genre: req.body.genre
           });
           
        // Prohibited string check
        async.parallel({
            title_prohibited_check: function(callback) {
                Prohibiteds.findOne({name: requestBodyTitleLower}, callback);
            },
            author_prohibited_check: function(callback) {
                Prohibiteds.findOne({name: requestBodyAuthorLower}, callback);
            },
            summary_prohibited_check: function(callback) {
                Prohibiteds.findOne({name: requestBodySummaryLower}, callback);
            },
            isbn_prohibited_check: function(callback) {
                Prohibiteds.findOne({name: requestBodyIsbnUpper}, callback);
            },
            // genre_prohibited_check: function(callback) {
            //     Prohibiteds.findOne({name: requestBodyGenreSchemeCompliant}, callback);
            // }, // genre omission
            title_duplicate_check: function(callback) {
                Book.findOne({'title': requestBodyTitleSchemeCompliant}, callback);
            },
            isbn_duplicate_check: function(callback) {
                Book.findOne({'isbn': requestBodyIsbnUpper}, callback);
            }
        }, function(err, results) {
            
               let custom_errors = [];
               var prohibited_render = false;
               var duplicate_title_render = false;
               var duplicate_title_book_id = null;
               var duplicate_isbn = false;
            
               if (err) {
                    return next(err);
               }
               
                if (results.title_prohibited_check) {
                    custom_errors.push(requestBodyTitleSchemeCompliant);
                }
                
                if (results.author_prohibited_check) {
                    custom_errors.push(requestBodyAuthorSchemeCompliant);
                }
                
                if (results.summary_prohibited_check) {
                    custom_errors.push(requestBodySummarySchemeCompliant);
                }
                
                if (results.isbn_prohibited_check) {
                    custom_errors.push(requestBodyIsbnUpper);
                }
                
                // if (results.genre_prohibited_check) {
                //     custom_errors.push(requestBodyGenreSchemeCompliant);
                // } // genre omission
                
                if (results.title_duplicate_check) {
                    duplicate_title_render = true;
                    duplicate_title_book_id = results.title_duplicate_check._id;
                    
                }
                
                if(results.isbn_duplicate_check) {
                    duplicate_title_render = true;
                    duplicate_title_book_id = results.isbn_duplicate_check._id;                 
                }
                
                
                // Check to see if we need to reder book form with prohibited terms error
                if(custom_errors.length > 1) {
                    prohibited_render = true;
                } 
                
                // Check for sanitization errors and render a the page
                if (!errors.isEmpty() || prohibited_render == true || duplicate_title_render == true) {
                    // There are errors. Render form again with sanitized values/error messages.
                    // Get all authors and genres for form.
                    async.parallel({
                        authors: function(callback) {
                            Author.find(callback);
                        },
                        genres: function(callback) {
                            Genre.find(callback);
                        },
                    }, function(err, results) { // Nested aync function within another async function may be an issue
                        if (err) { return next(err); }
        
                        // Mark our selected genres as checked.
                        for (let i = 0; i < results.genres.length; i++) {
                            if (book.genre.indexOf(results.genres[i]._id) > -1) {
                                results.genres[i].checked='true';
                            }
                        }

                        // Decide which error details to render
                        if(prohibited_render == true) {
                            res.render('book_form', { title: 'Create Book',authors:results.authors, genres:results.genres, book: book, custom_errors: custom_errors });
                            // return; // No further action needs to be taken.                            
                        }
                        else if (duplicate_title_render == true) {
                            let duplicate_author_errors = [requestBodyTitleSchemeCompliant, "ISBN: " + requestBodyIsbnUpper, "DB Id: " + duplicate_title_book_id];
                            res.render('book_form', { title: 'Create Book', authors:results.authors, genres:results.genres, book: book, duplicate_author_errors: duplicate_author_errors });
                        }
                        else {
                            res.render('book_form', { title: 'Create Book',authors:results.authors, genres:results.genres, book: book, errors: errors.array() }); // Redner the GET version of the page with some additional input data for guidance
                        }
                    });
                    return;
                }
                else {
                    // Data from form is valid. Save book.
                    book.save(function (Err) {
                        if (Err) { return next(Err); }
                           //successful - redirect to new book record.
                           res.redirect(book.url);
                        });
                }
        });
    }
];

// Display Book delete form on GET.
exports.book_delete_get = function(req, res, next) {

    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id)
            .populate('author')
            .populate('genre')
            .exec(callback)
        },
        books_bookinstances: function(callback) {
          BookInstance.find({ 'book': req.params.id })
          .populate('book')
          .exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.book==null) { // No results.
            res.redirect('/catalog/authors');
        }
        // Successful, so render.
        res.render('book_delete', { title: 'Delete Book', book: results.book, books_bookinstances: results.books_bookinstances } );
    });

};

// Handle Book delete on POST.
exports.book_delete_post = function(req, res, next) {

    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id)
            .populate('author')
            .populate('genre')
            .exec(callback)
        },
        books_bookinstances: function(callback) {
          BookInstance.find({ 'book': req.params.id })
          .populate('book')
          .exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Success
        if (results.books_bookinstances.length > 0) {
            // Book has bookinstances. Render in same way as for GET route.
            res.render('book_delete', { title: 'Delete Book', book: results.book, books_bookinstances: results.books_bookinstances } );
            return;
        }
        else if (results.book == undefined) {
            // No book found. Render book_delete with error
            console.error("DEBUG: No book found triggered!");
            let custom_errors = ["Book not found with Id: " + req.body.bookid];
            res.render('book_delete', { title: 'Delete Book', book: results.book, books_bookinstances: results.books_bookinstances, custom_errors: custom_errors } );
            return;
        }
        else {
            // Book has no bookinstances. Delete object and redirect to the list of books.
            Book.findByIdAndRemove(req.body.bookid, function deleteBook(err) {
                if (err) { return next(err); }
                // Success - go to book list
                res.redirect('/catalog/books')
            })
        }
    });
};

// Display book update form on GET.
exports.book_update_get = function(req, res, next) {

    // Get book, authors and genres for form.
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
        },
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        },
        }, function(err, results) {
            if (err) { return next(err); }
            if (results.book==null) { // No results.
                var err = new Error('Book not found');
                err.status = 404;
                return next(err);
            }
            // Success.
            // Mark our selected genres as checked.
            for (var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
                for (var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
                    if (results.genres[all_g_iter]._id.toString()===results.book.genre[book_g_iter]._id.toString()) {
                        results.genres[all_g_iter].checked='true';
                    }
                }
            }
            res.render('book_form', { title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book, original_title_by_param_id: results.book });
        });

};

// Handle book update on POST.
exports.book_update_post = [

    // Convert the genre to an array
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre==='undefined')
            req.body.genre=[];
            else
            req.body.genre=new Array(req.body.genre);
        }
        next();
    },

    // Validate and sanitise fields.
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('author', 'Author must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
    body('genre.*').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);
        
        // Force capitalization scheme
        
        var requestBodyTitleLower = req.body.title.toLowerCase();
        var requestBodyAuthorLower = req.body.author.toLowerCase();
        var requestBodySummaryLower = req.body.summary.toLowerCase();
        var requestBodyIsbnUpper = req.body.isbn.toUpperCase(); // Upper case for ISBN
        // var requestBodyGenreLower = req.body.genre.toLowerCase(); // genre omission
        
        // Rebuild request body name paramter as compliant string
        const requestBodyTitleSchemeCompliant = requestBodyTitleLower.charAt(0).toUpperCase() + requestBodyTitleLower.slice(1); // https://flaviocopes.com/how-to-uppercase-first-letter-javascript/
        const requestBodyAuthorSchemeCompliant = requestBodyAuthorLower.charAt(0).toUpperCase() + requestBodyAuthorLower.slice(1); // https://flaviocopes.com/how-to-uppercase-first-letter-javascript/
        const requestBodySummarySchemeCompliant = requestBodySummaryLower.charAt(0).toUpperCase() + requestBodySummaryLower.slice(1); // https://flaviocopes.com/how-to-uppercase-first-letter-javascript/
        // const requestBodyGenreSchemeCompliant = requestBodyGenreLower.charAt(0).toUpperCase() + requestBodyGenreLower.slice(1); // https://flaviocopes.com/how-to-uppercase-first-letter-javascript/ //  genre omission
        
        // Split off author name into first and last name for DB searching
        
        const requestBodyAuthorFirstNameSchemeCompliant = requestBodyAuthorSchemeCompliant.split(" ")[0];
        const requestBodyAuthorFamilyNameSchemeCompliant = requestBodyAuthorSchemeCompliant.split(" ")[1];

        // Create a Book object with escaped/trimmed data and old id.
        var book = new Book(
          { title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre,
            _id:req.params.id //This is required, or a new ID will be assigned!
           });



        // Prohibited string check
        async.parallel({
            title_prohibited_check: function(callback) {
                Prohibiteds.findOne({name: requestBodyTitleLower}, callback);
            },
            author_prohibited_check: function(callback) {
                Prohibiteds.findOne({name: requestBodyAuthorLower}, callback);
            },
            summary_prohibited_check: function(callback) {
                Prohibiteds.findOne({name: requestBodySummaryLower}, callback);
            },
            isbn_prohibited_check: function(callback) {
                Prohibiteds.findOne({name: requestBodyIsbnUpper}, callback);
            },
            // genre_prohibited_check: function(callback) {
            //     Prohibiteds.findOne({name: requestBodyGenreSchemeCompliant}, callback);
            // }, // genre omission
            title_duplicate_check: function(callback) {
                Book.findOne({'title': requestBodyTitleSchemeCompliant}, callback);
            },
            isbn_duplicate_check: function(callback) {
                Book.findOne({'isbn': requestBodyIsbnUpper}, callback);
            },
            book_by_id: function(callback) {
            Book.findById(req.params.id)
            .exec(callback);
            },
        }, function(err, results) {
            
               let custom_errors = [];
               var prohibited_render = false;
               var duplicate_title_render = false;
               var duplicate_title_book_id = null;
               var duplicate_isbn = false;
            
               if (err) {
                    return next(err);
               }
               
                if (results.title_prohibited_check) {
                    custom_errors.push(requestBodyTitleSchemeCompliant);
                }
                
                if (results.author_prohibited_check) {
                    custom_errors.push(requestBodyAuthorSchemeCompliant);
                }
                
                if (results.summary_prohibited_check) {
                    custom_errors.push(requestBodySummarySchemeCompliant);
                }
                
                if (results.isbn_prohibited_check) {
                    custom_errors.push(requestBodyIsbnUpper);
                }
                
                if (results.title_duplicate_check) {

                    // If normalized title input is different from the book being updated and is a duplicate
                    // throw duplicate error
                            
                    console.error("DEBUG: title duplication IF invoked");
                    console.error("DEBUG: book_by_id_results.book_by_id.title: " + results.book_by_id.title);
                    console.error("DEBUG: req.body.title: " + req.body.title);
                        
                    if (results.book_by_id.title != req.body.title) {
                        duplicate_title_render = true;
                        duplicate_title_book_id = results.title_duplicate_check._id;

                        console.error("DEBUG: title duplication IF 2 invoked");
                        console.error("DEBUG: duplicate_title_render: " + duplicate_title_render);
                    }
                }

                console.error("DEBUG: (outside of function) duplicate_title_render: " + duplicate_title_render);
                
                // Check to see if we need to reder book form with prohibited terms error
                if(custom_errors.length > 1) {
                    prohibited_render = true;
                }
            
                // Check for sanitization errors and render a the page
                if (!errors.isEmpty() || prohibited_render == true || duplicate_title_render == true) {
            // There are errors. Render form again with sanitized values/error messages.

                    // Get all authors and genres for form.
                    async.parallel({
                        authors: function(callback) {
                            Author.find(callback);
                        },
                        genres: function(callback) {
                            Genre.find(callback);
                        },
                        book_by_id: function(callback) {
                        Book.findById(req.params.id)
                        .exec(callback);
                        },
                    }, function(err, results) {
                        if (err) { return next(err); }
        
                        // Mark our selected genres as checked.
                        for (let i = 0; i < results.genres.length; i++) {
                            if (book.genre.indexOf(results.genres[i]._id) > -1) {
                                results.genres[i].checked='true';
                            }
                        }
                        
                        // Decide which error details to render
                        if(prohibited_render == true) {
                            res.render('book_form', { title: 'Update Book' ,authors:results.authors, genres:results.genres, book: book, custom_errors: custom_errors });
                            // return; // No further action needs to be taken.                            
                        }
                        else if (duplicate_title_render == true) {
                            let duplicate_author_errors = [requestBodyTitleSchemeCompliant, "ISBN: " + requestBodyIsbnUpper, "DB Id: " + duplicate_title_book_id];
                            res.render('book_form', { title: 'Update Book', authors:results.authors, genres:results.genres, book: book, original_title_by_param_id: results.book_by_id, duplicate_author_errors: duplicate_author_errors });
                        }
                        else {
                            res.render('book_form', { title: 'Update Book',authors:results.authors, genres:results.genres, book: book, errors: errors.array() }); // Redner the GET version of the page with some additional input data for guidance
                        }
                    });
                    return;
                }
                else {
                    console.error("DEBUG: about to write");
                    // Data from form is valid. Update the record.
                    Book.findByIdAndUpdate(req.params.id, book, {}, function (err,thebook) {
                        if (err) { return next(err); }
                           // Successful - redirect to book detail page.
                           res.redirect(thebook.url);
                        });
                }
        });
    }
];
