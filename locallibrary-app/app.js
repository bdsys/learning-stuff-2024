var createError = require('http-errors');
var express = require('express');

// // AWS X-Ray application monitoring
// var AWSXRay = require('aws-xray-sdk');

// New Relic script
require('newrelic');

// Setup MongoDB mongoose connection
// Import the mongoose module and define db conn str
var mongoose = require('mongoose');
var dev_db_url  = 'mongodb+srv://dbuser:2s8q1PfBpZMFBlCO@nodejs-training.awnst.mongodb.net/local_library?retryWrites=true&w=majority';
var mongoDB = process.env.MONGODB_URI || dev_db_url; // use OS environment variable "MONGODB_URI" if exits or use the above conn str.

// Set up default mongoose connection 
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

// Get the default connection
var db = mongoose.connection;

// Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));


var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var catalogRouter = require('./routes/catalog');  //Import routes for "catalog" area of site

// Adds data compression between middlewares
var compression = require('compression');

// Adds basic security
var helmet = require('helmet');


var app = express();
console.error("Starting up express...");

// Use Helmet
app.use(helmet());


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// // Allow app to use AWS X-Ray middleware
// app.use(AWSXRay.express.openSegment('MyApp'));

// Traffic control
// set up a route to redirect http to https -- https://stackoverflow.com/questions/40785393/redirect-http-requests-to-https-for-website-hosted-on-aws-ec2
app.use(function(req, res, next) {
      if ((req.get('X-Forwarded-Proto') !== 'https')) {
        res.redirect('https://' + req.get('Host') + req.url);
      } else
        next();
    });
    
// Compression routes configuration
app.use(compression()); //Compress all routes

// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter);  // Add catalog routes to middleware chain.


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// // Closes AWS X-Ray trace
// app.use(AWSXRay.express.closeSegment());

module.exports = app;
