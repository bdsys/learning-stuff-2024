// Setup MongoDB mongoose connection
// Import the mongoose module and define db conn str
// npm install mongoose
// node --require mongoose
var mongoose = require('mongoose');
var mongoDB = 'mongodb+srv://dbuser:HAg3zHamnT5j2r4q@nodejs-training.awnst.mongodb.net/local_library?retryWrites=true&w=majority';

// Set up default mongoose connection 
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

// Get the default connection
var db = mongoose.connection;

// Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Define modles
var Genre = require('/home/ubuntu/environment/nodejs-training/testing/models/genre');
var Prohibited_Genres = require('/home/ubuntu/environment/nodejs-training/testing/models/prohibited_genres');
var Author = require('/home/ubuntu/environment/nodejs-training/testing//models/author');
var Prohibiteds = require('/home/ubuntu/environment/nodejs-training/testing/models/prohibiteds');




Prohibiteds.countDocuments({}, function (err, count) {console.log('there are %d jungle adventures', count);});

genreAll = Genre.find({}, 'name').exec();
proAll = Prohibiteds.find({}, 'name').exec();

proSearchTerm = Prohibiteds.find({ name: /cunt/i }).exec();

Prohibiteds.find({ name: /cunt/i }, function (err, count) {console.log(count)});

proFindOne = Prohibiteds.findOne({ name: /cunt/i }).exec();

var testString = "cunt"

Prohibiteds.findOne({ name: 'cunt' }, function (err, search_result) {console.log(search_result);});

Prohibiteds.findOne({ name: 'cunt' }, 
    function (err, search_result) {
        if (err) {
            console.log("whomp whomp:" + err);
        }
        else if (search_result)
        {
            console.log("input was found on the prohibited list!");
        }
        else
        {
            console.log("input clean!");
        }
    }
);

var stringVar = 'dog';

Prohibiteds.findOne({ name: 'dog' }, function (err, search_result) {if (err) {console.log("whomp whomp:" + err);}else if (search_result){console.log("input was found on the prohibited list!");}else{console.log("input clean!");}});

Prohibiteds.findOne({ name: stringVar }, function (err, search_result) {if (err) {console.log("whomp whomp:" + err);}else if (search_result){console.log("input was found on the prohibited list!");}else{console.log("input clean!");}});

var stringName = "Andrew";
var stringLastName = "Lass";

Author.findOne({ first_name: stringName, family_name: stringLastName },function (err, search_result) {if (err) {console.log("whomp whomp:" + err);}else if (search_result){console.log("Duplicate input: " + stringName + " " + stringLastName);}else{console.log("Author accepted!");}});

Author.findOne({ first_name: 'Andrew'}, 'date_of_birth').exec();

Author.findOne(
    { 
        first_name: stringName, last_name: stringName 
        
    },
    function (err, search_result) {
        if (err) {
            console.log("whomp whomp:" + err);
            
        }else if (search_result){
            console.log("Duplicate input: " + stringName + " " + stringLastName);
            
        }else{
            console.log("Author accepted!");
            
        }
        
    });
    
    

var DateTime = require('luxon');

var date11 = DateTime.DateTime.fromISO("2020-09-06T12:00")
var date22 = DateTime.DateTime.fromISO("2019-06-10T14:00")

var diff = date11.diff(date22, ["years", "months", "days", "hours"])

console.log(diff.toObject())

testRun3 = Author.findOne({'first_name': 'Isaac'}).exec(function (err, results) {if(err) {}console.log(results.date_of_birth);console.log(results.date_of_death);var isoTime1 = DateTime.DateTime.fromJSDate(results.date_of_birth);})

Author.findOne({'first_name': 'Issac'})
.exec(function (err, results) {
    if(err) {
        //
    }
    
    console.log(results.date_of_birth);
    console.log(results.date_of_death);

    var isoTime1 = DateTime.DateTime.fromJSDate(results.date_of_birth);
    var isoTime2 = DateTime.DateTime.fromISO(results.date_of_death);
    console.log(isoTime1);
    console.log(isoTime2);
    
    var diff = isoTime1.diff(isoTime2, ["years", "months", "days", "hours"]);
    console.log(diff.years);

    
})


    var dob_js =  DateTime.fromJSDate(this.date_of_birth);
    var today = DateTime.DateTime.fromISO(DateTime.DateTime.now());
    
var diff = today.diff(today2, ["years", "months", "days", "hours"]);
