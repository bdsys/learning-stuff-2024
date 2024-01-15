const { body,validationResult } = require("express-validator");
// Above is equivalent to the below block
// var validator = require("express-validator");
// body = validator.body();
// validationResult = validator.validationResult();


var mongoose = require('mongoose'); // Needed to evaluate errors coming from MongoDB or Mongoose
var Genre = require('../models/genre');
var Prohibiteds = require('../models/prohibiteds');
var Book = require('../models/book');
var async = require('async');

// Display list of all Genre.
exports.genre_list = function(req, res, next) {

  Genre.find()
    .sort([['name', 'ascending']])
    .exec(function (err, list_genre) {
      if (err) { return next(err); }
      //Successful, so render
      res.render('genre_list', { title: 'Genre List', genre_list: list_genre });
    });
};


// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {

    if (req.params.id.length == 24) { // Validate Id request parameter 
        var id = mongoose.Types.ObjectId(req.params.id); // Convert Id request parameter to a Mongoose id data type
    }
    else {
        var err = new Error('Unable to query genre with Id: ' + req.params.id);
        err.status = 418; // I'm a teapot
        return next(err);
    }

    async.parallel({
        genre: function(callback) {
            Genre.findById(id)
              .exec(callback);
        },

        genre_books: function(callback) {
            Book.find({ 'genre': id })
              .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) { // No results.
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('genre_detail', { genre: results.genre, genre_books: results.genre_books } );
    });

};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res, next) {
  res.render('genre_form', { title: 'Create Genre' });
};

// Handle Genre create on POST.
exports.genre_create_post =  [

  // Validate and santize the name field.
  body('name', 'Genre name required').trim().isLength({ min: 1 }, { max: 24 }).escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {

    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Force capitalization scheme
    var requestBodyNameLower = req.body.name.toLowerCase(); // create new string var all lower case to standardize request parameter
    // Rebuild request body name paramter as compliant string
    const requestBodyNameSchemeCompliant = requestBodyNameLower.charAt(0).toUpperCase() + requestBodyNameLower.slice(1); // https://flaviocopes.com/how-to-uppercase-first-letter-javascript/

    // Prohibted check
    Prohibiteds.findOne({ name: requestBodyNameLower }, 
        function (err, search_result) {
            if (err) {
                return next(err);
            }
            else if (search_result) {
                let custom_errors = ["The following phrases used were found on prohibited words list:", requestBodyNameLower];
                res.render('genre_form', { title: 'Create Genre', custom_errors: custom_errors});
                return; // No further action needs to be taken.
            }
            else {
                
                 // Create a genre object with escaped and trimmed data.
                var genre = new Genre(
                  { name: requestBodyNameSchemeCompliant }
                );
            
                if (!errors.isEmpty()) {
                  // There are errors. Render the form again with sanitized values/error messages.
                  res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array()});
                  return;
                }
                else {
                  // Data from form is valid.
            
                  // Check if Genre with same name already exists.
                  Genre.findOne({ 'name': requestBodyNameSchemeCompliant })
                    .exec( function(err, found_genre) {
                       if (err) { return next(err); }
            
                       if (found_genre) {
                         // Genre exists, redirect to its detail page.
                         res.redirect(found_genre.url);
                       }
                       else {
                        // All checks passed, save.
                        genre.save(function (err) {
                        if (err) { return next(err); }
                        // Genre saved. Redirect to genre detail page.
                        res.redirect(genre.url);
                        });
                       }
                    });
                }
            }
        }
    );
  }
];

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre delete GET');
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre delete POST');
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update GET');
};

// Handle Genre update on POST.
exports.genre_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update POST');
};