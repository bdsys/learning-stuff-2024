const { DateTime } = require("luxon");

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var AuthorSchema = new Schema(
  {
    first_name: {type: String, required: true, maxlength: 100},
    family_name: {type: String, required: true, maxlength: 100},
    date_of_birth: {type: Date},
    date_of_death: {type: Date},
  }
);

// Virtual for author's full name
AuthorSchema
.virtual('name')
.get(function () {
  return this.family_name + ', ' + this.first_name;
});

// Virtual for author's lifespan
AuthorSchema
.virtual('lifespan')
.get(function () {
  // return (this.date_of_death.getYear() - this.date_of_birth.getYear()).toString();
  var dob_lifespan = this.date_of_birth ? DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED) : '';
  var dod_lifespan = this.date_of_birth ? DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED) : '';
  
  if (this.date_of_birth && this.date_of_death) {
    return dob_lifespan + " - " + dod_lifespan;
  }
  else if (this.date_of_birth && this.date_of_death == undefined) {
    return dob_lifespan + " - still alive or unknown";
  }
  else if (this.date_of_birth == undefined && this.date_of_death == "") {
    return "Unknown date of birth - " + dod_lifespan;
  }
  else {
    return "Unknown lifespan";
  }
  
});

// Virtual for author's URL
AuthorSchema
.virtual('url')
.get(function () {
  return '/catalog/author/' + this._id;
});

// Virtual of friendly "date of birth" value
AuthorSchema
.virtual("dob_formatted")
.get(function () {
  return this.date_of_birth ? DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED) : '';
});

// Virtual of friendly "date of death" value
AuthorSchema
.virtual("dod_formatted")
.get(function () {
  return this.date_of_death ? DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED) : '';
});

AuthorSchema
.virtual("age")
.get(function () {
  if (this.date_of_birth && this.date_of_death) {
    var dob_js =  DateTime.fromJSDate(this.date_of_birth);
    var dod_js =  DateTime.fromJSDate(this.date_of_death);
    var dateDiff = dod_js.diff(dob_js, ["years", "months", "days", "hours"]);
    return dateDiff.years;
  }
  else if (this.date_of_birth && this.date_of_death == undefined) {
    var dob_js =  DateTime.fromJSDate(this.date_of_birth);
    // var today = DateTime.DateTime.fromISO(DateTime.DateTime.now());
    var today = DateTime.now();
    var dateDiff = today.diff(dob_js, ["years", "months", "days", "hours"]);
    return dateDiff.years;
  }
  else {
    return "Unknown";
  }
});

//Export model
module.exports = mongoose.model('Author', AuthorSchema);
