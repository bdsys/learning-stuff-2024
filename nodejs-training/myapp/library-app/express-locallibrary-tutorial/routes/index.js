var express = require('express');
var router = express.Router();

// /* GET home page. */ - original
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });

// GET root
// HTTP 302 redirect to /catalog
router.get('/', function(req, res) {
    res.redirect('/catalog');
});

module.exports = router;
