const { body,validationResult } = require("express-validator");
// Above is equivalent to the below block
// var validator = require("express-validator");
// body = validator.body();
// validationResult = validator.validationResult();

var Author = require('../models/author');
var Book = require('../models/book');
var Prohibiteds = require('../models/prohibiteds');
var mongoose = require('mongoose'); // Needed to evaluate errors coming from MongoDB or Mongoose
var async = require('async');


// Display list of all Authors.
exports.author_list = function(req, res, next) {

  Author.find()
    .sort([['family_name', 'ascending']])
    .exec(function (err, list_authors) {
      if (err) { return next(err); }
      //Successful, so render
      res.render('author_list', { title: 'Author List', author_list: list_authors });
    });

};

// Display detail page for a specific Author.
exports.author_detail = function(req, res, next) {

    if (req.params.id.length == 24) { // Validate Id request parameter 
        var id = mongoose.Types.ObjectId(req.params.id); // Convert Id request parameter to a Mongoose id data type
    }
    else {
        var err = new Error('Unable to query author with Id: ' + req.params.id);
        err.status = 418; // I'm a teapot
        return next(err);
    }

    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id)
              .exec(callback)
        },
        authors_books: function(callback) {
          Book.find({ 'author': req.params.id },'title summary')
          .exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); } // Error in API usage.
        if (results.author==null) { // No results.
            var err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        res.render('author_detail', { title: 'Author Detail', author: results.author, author_books: results.authors_books } );
    });

};
// Display Author create form on GET.
exports.author_create_get = function(req, res, next) {
    res.render('author_form', { title: 'Create Author'});
};

// Handle Author create on POST.
exports.author_create_post = [

    // Validate and sanitize fields.
    body('first_name').trim().isLength({ min: 1 }).escape().withMessage('First name must be specified.')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('family_name').trim().isLength({ min: 1 }).escape().withMessage('Family name must be specified.')
        .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601().toDate(),
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601().toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);
        
        // Force capitalization scheme on first_name and family_name
        var request_body_first_name_lower = req.body.first_name.toLowerCase(); // create new string var all lower case to standardize request parameter+
        var request_body_last_name_lower = req.body.family_name.toLowerCase(); // create new string var all lower case to standardize request parameter

        // Rebuild request body name paramter as compliant string
        const request_body_first_name_scheme_compliant = request_body_first_name_lower.charAt(0).toUpperCase() + request_body_first_name_lower.slice(1); // https://flaviocopes.com/how-to-uppercase-first-letter-javascript/
        const request_body_last_name_scheme_compliant = request_body_last_name_lower.charAt(0).toUpperCase() + request_body_last_name_lower.slice(1); 
        const request_body_first_last_combined_scheme_compliant = request_body_first_name_scheme_compliant + " " + request_body_last_name_scheme_compliant;

        async.parallel({
            first_name_prohibited_check: function(callback) {
                Prohibiteds.findOne({name: request_body_first_name_lower}, callback);
            },
            last_name_prohibited_check: function(callback) {
                Prohibiteds.findOne({name: request_body_last_name_lower}, callback);
            }
        }, function(err, results) {
               if (err) {
                    return next(err);
               }
                else if (results.first_name_prohibited_check) {
                   let custom_errors = ["The following phrases used were found on prohibited words list:", request_body_first_name_lower];
                    res.render('author_form', { title: 'Create Author', author: req.body, custom_errors: custom_errors });
                    return; // No further action needs to be taken.
                }
                else if (results.last_name_prohibited_check)
                {
                   let custom_errors = ["The following phrases used were found on prohibited words list:", request_body_last_name_lower];
                    res.render('author_form', { title: 'Create Author', author: req.body, custom_errors: custom_errors });
                    return; // No further action needs to be taken.
                }
                else if (!errors.isEmpty()) {
                    // There are errors. Render form again with sanitized values/errors messages.
                    res.render('author_form', { title: 'Create Author', author: req.body, errors: errors.array() });
                    return;
                }
                else {
                    // Data from form is valid.


                //   // Check if Genre with same name already exists.
                //   Genre.findOne({ 'name': requestBodyNameSchemeCompliant })
                //     .exec( function(err, found_genre) {
                //       if (err) { return next(err); }

                    // Duplication check
                    Author.findOne({'first_name': request_body_first_name_scheme_compliant, 'family_name': request_body_last_name_scheme_compliant })
                        .exec( function(err, search_result ) {
                            if (err) {
                                 return next(err);
                                
                            } else if (search_result) { // Found duplicate author by name
                                let custom_errors = ["The following author was already found:", request_body_first_name_scheme_compliant + " " + request_body_last_name_scheme_compliant, search_result._id];
                                res.render('author_form', { title: 'Create Author', author: req.body, custom_errors: custom_errors });
                                return; // No further action needs to be taken.
                                
                            } else {
                                // Create an Author object with escaped and trimmed data.
                                var author = new Author(
                                    {
                                        first_name: request_body_first_name_scheme_compliant,
                                        family_name: request_body_last_name_scheme_compliant,
                                        date_of_birth: req.body.date_of_birth,
                                        date_of_death: req.body.date_of_death
                                    });
                                author.save(function (err) {
                                    if (err) { return next(err); }
                                    // Successful - redirect to new author record.
                                    res.redirect(author.url);
                                });
                            }
                        });
                           
                       }
        });
    }
];

// Display Author delete form on GET.
exports.author_delete_get = function(req, res, next) {

    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id).exec(callback)
        },
        authors_books: function(callback) {
          Book.find({ 'author': req.params.id }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.author==null) { // No results.
            res.redirect('/catalog/authors');
        }
        // Successful, so render.
        res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.authors_books } );
    });

};

// Handle Author delete on POST.
exports.author_delete_post = function(req, res, next) {

    async.parallel({
        author: function(callback) {
          Author.findById(req.body.authorid).exec(callback)
        },
        authors_books: function(callback) {1
          Book.find({ 'author': req.body.authorid }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Success
        if (results.authors_books.length > 0) {
            // Author has books. Render in same way as for GET route.
            res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.authors_books } );
            return;
        }
        else if (results.author == undefined) {
            // No author found. Render author_delete with error
            console.error("DEBUG: No author found triggered!");
            let custom_errors = ["Author not found with Id: " + req.body.authorid];
            res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.authors_books, custom_errors: custom_errors } );
            return;
        }
        else {
            // Author has no books. Delete object and redirect to the list of authors.
            Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
                if (err) { return next(err); }
                // Success - go to author list
                res.redirect('/catalog/authors')
            })
        }
    });
};

// Display Author update form on GET.
exports.author_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Author update GET');
};

// Handle Author update on POST.
exports.author_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Author update POST');
};