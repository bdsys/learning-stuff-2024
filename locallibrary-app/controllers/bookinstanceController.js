// Import modules
const { body,validationResult } = require('express-validator');
const { DateTime } = require("luxon");

var BookInstance = require('../models/bookinstance');
var Prohibiteds = require('../models/prohibiteds');
var Book = require('../models/book');

var async = require('async');
var mongoose = require('mongoose'); // Needed to evaluate errors coming from MongoDB or Mongoose

var debug = require('debug')('bookinstance');

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {

  BookInstance.find()
    .populate('book')
    .exec(function (err, list_bookinstances) {
      if (err) { return next(err); }
      // Successful, so render
      res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
    });

};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {

    if (req.params.id.length == 24) { // Validate Id request parameter 
        var id = mongoose.Types.ObjectId(req.params.id); // Convert Id request parameter to a Mongoose id data type
    }
    else {
        var err = new Error('Unable to query bookinstance with Id: ' + req.params.id);
        err.status = 418; // I'm a teapot
        return next(err);
    }

    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) { return next(err); }
      if (bookinstance==null) { // No results.
          var err = new Error('Book copy not found');
          err.status = 404;
          return next(err);
        }
      // Successful, so render.
      res.render('bookinstance_detail', { title: 'Copy: '+bookinstance.book.title, bookinstance:  bookinstance});
    })

};
// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {

    Book.find({},'title')
    .exec(function (err, books) {
      if (err) { return next(err); }
      // Successful, so render.
      res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books});
    });

};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [

    // Validate and sanitise fields.
    body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

         // Force capitalization scheme
        var requestBodyImprintLower = req.body.imprint.toLowerCase();

        // Rebuild request body name paramter as compliant string
        var requestBodyImprintSchemeCompliant = "";
        
        for (var i = 0; i < requestBodyImprintLower.length; i++) {
            
            if(i == 0 || requestBodyImprintLower[i - 1] == " " && i > 0) { // Capitalize first letter in the string and each letter following a space
                requestBodyImprintSchemeCompliant = requestBodyImprintSchemeCompliant + requestBodyImprintLower[i].toUpperCase();
            }
            else {
                requestBodyImprintSchemeCompliant = requestBodyImprintSchemeCompliant + requestBodyImprintLower[i];
            }
        }

        // Double validate the due_date is not null or in the past
        
        var due_date_error = false;
        let due_date_custom_errors = [];
        
        var due_back_js =  DateTime.fromJSDate(req.body.due_back);
        var todays_date = DateTime.now();
        
        console.error("DEBUG DATE: About to start if evals with date_value as: " + req.body.due_back);
        debug("DEBUG DATE: About to start if evals with date_value as: " + req.body.due_back)

        console.error(req.body.due_back == "");
        debug(req.body.due_back == "");
        
        if (req.body.due_back == "") {
            due_date_custom_errors = [ "No Due Date Set" ];
            due_date_error = true;
            console.error("DEBUG DATE: ENTERED IF 1");
            debug("DEBUG DATE: ENTERED IF 1");
        }
        else if (due_back_js < todays_date) {
            
            due_date_custom_errors = [ "Due date must be after today!"];
            due_date_error = true;    
            console.error("DEBUG DATE: ENTERED ELSE IF 1");
            debug("DEBUG DATE: ENTERED ELSE IF 1");
            console.error("DEBUG DATE: From JS date_value as: " + due_back_js);
            debug("DEBUG DATE: From JS date_value as: " + due_back_js);
        }
            
        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance(
          { book: req.body.book,
            imprint: requestBodyImprintSchemeCompliant,
            status: req.body.status,
            due_back: req.body.due_back
           });
           
           
          // Prohibited string check
        async.parallel({
            title_prohibited_check: function(callback) {
                Prohibiteds.findOne({name: requestBodyImprintLower}, callback);
            }
        }, function(err, results) {
            
                if(err) {
                   return next(err);
                }
           
                if (!errors.isEmpty() || results.title_prohibited_check || due_date_error) {
                    // There are errors. Render form again with sanitized values and error messages.
                    Book.find({},'title')
                        .exec(function (err, books) {
                            if (err) { 
                                return next(err); 
                            }
                            
                            console.error("SELECTOR PASS BACK DEBUG: State: " + req.body.status);
                            debug("SELECTOR PASS BACK DEBUG: State: " + req.body.status);
                            
                            if (!errors.isEmpty()) {
                                // Successful, so render.
                                res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id , errors: errors.array(), bookinstance: bookinstance, selected_value: req.body.status });
                                console.error("DEBUG DATE: RENDERING SANTIZATION ERROR VARIATION");
                                debug("DEBUG DATE: RENDERING SANTIZATION ERROR VARIATION");
                            }
                            else if (results.title_prohibited_check) {
                                let custom_errors = [ requestBodyImprintLower ];
                                res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id , custom_errors: custom_errors, bookinstance: bookinstance, selected_value: req.body.status });                                
                                console.error("DEBUG DATE: RENDERING PROHIBITED IMPRINT ERROR VARIATION");
                                debug("DEBUG DATE: RENDERING PROHIBITED IMPRINT ERROR VARIATION");
                            }
                            else if (due_date_error) {
                                res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id , due_date_custom_errors: due_date_custom_errors, bookinstance: bookinstance, selected_value: req.body.status });
                                console.error("DEBUG DATE: RENDERING DUE DATE ERROR VARIATION");
                                debug("DEBUG DATE: RENDERING DUE DATE ERROR VARIATION");
                            }
                    });
                    return;
                }
                else {
                    // Data from form is valid.
                    bookinstance.save(function (err) {
                        if (err) { return next(err); }
                           // Successful - redirect to new record.
                           res.redirect(bookinstance.url);
                        });
                }
        });
    }
];

// Display Bookinstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {

    async.parallel({
        bookinstance: function(callback) {
            BookInstance.findById(req.params.id)
            .populate("book")
            .exec(callback)
        }
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.bookinstance==null) { // No results.
            res.redirect('/catalog/bookinstances');
        }
        // Successful, so render.
        res.render('bookinstance_delete', { title: 'Delete Bookinstance', bookinstance: results.bookinstance} );
    });

};

// Handle Bookinstance delete on POST.
exports.bookinstance_delete_post = function(req, res, next) {

    async.parallel({
        bookinstance: function(callback) {
            BookInstance.findById(req.params.id)
            .populate("book")
            .exec(callback)
        }
    }, function(err, results) {
        if (err) { return next(err); }
        
        if (results.bookinstance == undefined) {
            // No Bookinstance found. Render bookinstance_delete with error
            console.error("DEBUG: No bookinstance found triggered!");
            let custom_errors = ["Bookinstance not found with Id: " + req.body.bookinstanceid];
            res.render('bookinstance_delete', { title: 'Delete Bookinstance', bookinstance: results.bookinstance} );
            return;
        }
        else {
            // BookInstance has no books. Delete object and redirect to the list of bookinstances.
            BookInstance.findByIdAndRemove(req.body.bookinstanceid, function deleteBookinstance(err) {
                if (err) { return next(err); }
                // Success - go to bookinstances list
                res.redirect('/catalog/bookinstances')
            })
        }
    });
};

// Display book update form on GET.
exports.bookinstance_update_get = function(req, res, next) {
    
    async.parallel({
        bookinstance: function(callback) {
            BookInstance.findById(req.params.id)
            .populate("book")
            .exec(callback)
        }
    }, function(err, results) {
        if (err) { return next(err); }
          // Successful, so render.
          res.render('bookinstance_update', { title: 'Update BookInstance', selected_book: results.bookinstance.book._id, bookinstance: results.bookinstance, selected_value: req.body.status });
          //   res.render('bookinstance_form', {title: 'Update BookInstance', book_list: books});   
    });
};

// // Handle bookinstance update on POST.
// exports.bookinstance_update_post = function(req, res) {
//     res.send('NOT IMPLEMENTED: BookInstance update POST');
// };

// Handle BookInstance update on POST.
exports.bookinstance_update_post = [

    // Validate and sanitise fields.
    body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

         // Force capitalization scheme
        var requestBodyImprintLower = req.body.imprint.toLowerCase();

        // Rebuild request body name paramter as compliant string
        var requestBodyImprintSchemeCompliant = "";
        
        for (var i = 0; i < requestBodyImprintLower.length; i++) {
            
            if(i == 0 || requestBodyImprintLower[i - 1] == " " && i > 0) { // Capitalize first letter in the string and each letter following a space
                requestBodyImprintSchemeCompliant = requestBodyImprintSchemeCompliant + requestBodyImprintLower[i].toUpperCase();
            }
            else {
                requestBodyImprintSchemeCompliant = requestBodyImprintSchemeCompliant + requestBodyImprintLower[i];
            }
        }

        // Double validate the due_date is not null or in the past
        
        var due_date_error = false;
        let due_date_custom_errors = [];
        
        var due_back_js =  DateTime.fromJSDate(req.body.due_back);
        var todays_date = DateTime.now();
        
        console.error("DEBUG DATE: About to start if evals with date_value as: " + req.body.due_back);

        console.error(req.body.due_back == "");
        
        if (req.body.due_back == "") {
            due_date_custom_errors = [ "No Due Date Set" ];
            due_date_error = true;
            console.error("DEBUG DATE: ENTERED IF 1");
        }
        else if (due_back_js < todays_date) {
            
            due_date_custom_errors = [ "Due date must be after today!"];
            due_date_error = true;    
            console.error("DEBUG DATE: ENTERED ELSE IF 1");
            console.error("DEBUG DATE: From JS date_value as: " + due_back_js);
        }
        
        console.error("DEBUG: about to instansiate update object.");
        
        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance({ 
            //book: results.bookinstance_query_object.book,
            book: req.body.book,
            imprint: requestBodyImprintSchemeCompliant,
            status: req.body.status,
            due_back: req.body.due_back,
            _id:req.params.id //This is required, or a new ID will be assigned!
        });

          // Prohibited string check
        async.parallel({
            title_prohibited_check: function(callback) {
                Prohibiteds.findOne({name: requestBodyImprintLower}, callback);
            },
            bookinstance_query_object: function(callback) {
            BookInstance.findById(req.params.id)
            .populate("book")
            .exec(callback)
            },
        }, function(err, results) {
            
                if(err) {
                  return next(err);
                }
                
                if (!errors.isEmpty() || results.title_prohibited_check || due_date_error) {
                    // There are errors. Render form again with sanitized values and error messages.
                            
                    console.error("SELECTOR PASS BACK DEBUG: State: " + req.body.status);
                    
                    if (!errors.isEmpty()) {
                        // Successful, so render.
                        res.render('bookinstance_update', { title: 'Update BookInstance', selected_book: bookinstance.book._id , errors: errors.array(), bookinstance: bookinstance, selected_value: req.body.status });
                        console.error("DEBUG DATE: RENDERING SANTIZATION ERROR VARIATION");
                    }
                    else if (results.title_prohibited_check) {
                        let custom_errors = [ requestBodyImprintLower ];
                        res.render('bookinstance_update', { title: 'Update BookInstance', selected_book: bookinstance._id , custom_errors: custom_errors, bookinstance: bookinstance, selected_value: req.body.status });                                
                        console.error("DEBUG DATE: RENDERING PROHIBITED IMPRINT ERROR VARIATION");
                    }
                    else if (due_date_error) {
                        res.render('bookinstance_update', { title: 'Update BookInstance', selected_book: bookinstance._id , due_date_custom_errors: due_date_custom_errors, bookinstance: bookinstance, selected_value: req.body.status });
                        
                        
                        res.render('bookinstance_update', { title: 'Update BookInstance', selected_book: bookinstance._id, bookinstance: bookinstance, selected_value: req.body.status });
                        console.error("DEBUG DATE: RENDERING DUE DATE ERROR VARIATION");
                    }
                    return;
                }
                else {
                    console.error("DEBUG: about to write");
                    
                    
                    BookInstance.findOneAndUpdate({_id: req.params.id}, {$set: bookinstance}, {new: true, useFindAndModify: false}, function (err,thebookinstance) {
                        if (err) { return next(err); }
                          // Successful - redirect to new record.
                          res.redirect(thebookinstance.url);
                        });

                    // findByIdAndUpdate has been deprecated in favor of fineOneAndUpdate, which is more flexible.
                    // // Data from form is valid.
                    // BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function (err,thebookinstance) {
                    //     if (err) { return next(err); }
                    //       // Successful - redirect to new record.
                    //       res.redirect(thebookinstance.url);
                    //     });
                }
        });
    }
];
