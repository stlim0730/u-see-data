// read configuration json file
var conf;
if (process.argv.length >= 2 + 1) {
  conf = require(process.argv[2]);
}
else {
  conf = require('./default_conf.json');
}

// set global varables
var port_number = conf.port_number;
var public_dir = __dirname + conf.public_dir;
var bower_components_dir = __dirname + conf.bower_components_dir;
var upload_dir = __dirname + conf.upload_dir;

// load modules
var express = require('express');
var multer  = require('multer');
var fs = require('fs');
var util = require('./my_util.js');

// set the server
var app = express();
app.set('port', (process.env.PORT || port_number));
app.use('/public', express.static(public_dir));
app.use('/bower_components', express.static(bower_components_dir));
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
  res.render('index.ejs'); // res.render('index', { title: 'Hey', message: 'Hello there!'}); // this is how to use templates
});

app.get('/renderer', function (req, res) {
  res.render('renderer.ejs');
});

app.post('/data_upload', [
  multer({ dest: upload_dir }),
  function (req, res) {
    var user_file = req.files.user_data;
    // TODO: file management per user
    fs.unlink(user_file.originalname, function (err) { // remove existing file with the same temporary file name
      fs.rename(upload_dir + '/' + user_file.name,
        upload_dir + '/' + user_file.originalname,
        function (err) {
          if (err) throw err;
          console.log('uploading complete');
          res.redirect('/renderer');
      });
    });
  }
]);

// start the server
app.listen(process.env.PORT || port_number);
util.log('the server is running on ' + port_number);
