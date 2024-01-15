var mongoose = require('mongoose');

var Schema = mongoose.Schema;

// ProhibitedGenreSchema schema with one string field
var Prohibiteds = new Schema(
  {
    name: { type: String, required: true, minlength: 3, maxlength: 100}
  }
);

// Export model
module.exports = mongoose.model('Prohibiteds', Prohibiteds)
