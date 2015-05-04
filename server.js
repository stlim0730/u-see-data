// AUTHOR: SEONGTAEK LIM

// read configuration json file
var conf;
if (process.argv.length >= 2 + 1) {
  conf = require(process.argv[2]);
}
else {
  conf = require('./default_conf.json');
}

var chart_reqs = require('./chart_reqs.json');

// set directories
var public_dir = __dirname + conf.public_dir;
var bower_components_dir = __dirname + conf.bower_components_dir;
var node_modules_dir = __dirname + conf.node_modules_dir;
var image_dir = public_dir + conf.image_dir;
var upload_dir = __dirname + conf.upload_dir;

// load modules
var express = require('express');
var multer  = require('multer');
var fs = require('fs');
var mongoose = require('mongoose');
var schema; // require after db connection
var util = require('util');
var my_util = require('./my_util.js');
var csv = require('csv-streamify'); // https://github.com/klaemo/csv-stream

// schema classes
var Metadata; // define after db connection
var Dataset; // define after db connection

// set the server
var app = express();
app.set('port', (process.env.PORT || conf.port_number));
app.use('/public', express.static(public_dir));
app.use('/bower_components', express.static(bower_components_dir));
app.use('/node_modules', express.static(node_modules_dir));
app.use('/images', express.static(image_dir));
app.set('view engine', 'ejs');

// set server parameters
var port_number = app.get('port');
var db_uri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  conf.db_uri;

// set database
mongoose.connect(db_uri, function (err, res) {
  if (err) {
    my_util.log ('Error in connecting to Mongoose: ' + db_uri);
    throw err;
  }
  else {
    my_util.log('Successfully connected to Mongoose: ' + db_uri);
    schema = require('./schema.js');
    Metadata = mongoose.model('Metadata', schema.metadataSchema);
    Dataset = mongoose.model('Dataset', schema.datasetSchema);
  }
});

// routing definitions
app.get('/', function (req, res) {
  res.render('index.ejs'); // res.render('index', { title: 'Hey', message: 'Hello there!'}); // this is how to use templates
});

app.get('/upload', function (req, res) {
  res.render('upload.ejs');
});

app.post('/visualizer', [
  multer({ dest: upload_dir }),
  function (req, res) {
    var user_file = req.files.user_data;
    // TODO: limit file size?
    // TODO: validate the csv file: missing values, missing columns
    // TODO: file management per user: manipulate directory name for data repository
    fs.unlink(upload_dir + '/' + user_file.originalname, function (err) { // remove existing file with the same temporary file name
      var random_file_name = upload_dir + '/' + user_file.name;
      var file_name = upload_dir + '/' + user_file.originalname;

      fs.rename(random_file_name, file_name,
        function (err) {
          if (err) throw err;
          my_util.log('uploading complete');

          var col_names = [];
          var col_types = [];
          var row_num = -1;

          if (file_name.indexOf('.csv') >= 0) {

            var fstream = fs.createReadStream(file_name);
            // parse csv file
            var parser = csv(require('./default_csv_conf.json'), function (err, data) {
              if (err) throw err;
              
              // aggregate datatypes
              // TODO: polish datatype rule
              for (var i=0; i < col_types.length; i++) {
                var types = col_types[i];
                if (types.length == 1) {
                  // homogeneous datatype
                  col_types[i] = types[0];
                }
                else if (my_util.arrayContains(types, typeof 'string')) {
                  // if there is one or more string as a value for this column, the column's datatype is string.
                  col_types[i] = typeof 'string';
                }
                else {
                  my_util.log('Unexpected datatype');
                  col_types[i] = 'undefined';
                }
              }

              // update database after parsing
              var user_id = 'user';
              var now = new Date();
              var metadata = new Metadata({
                user: user_id, // TODO: user identifier
                date: now, // TODO: timezone resolution: currently it uses UTC
                file_size: user_file.size,
                col_num: col_names.length,
                row_num: row_num,
                col_names: col_names,
                col_types: col_types
              });
              var dataset = new Dataset({
                user: user_id,
                date: now,
                data: data
              });

              metadata.save(function (err, md) {
                if (err) throw err;

                my_util.log('The metadata has been saved in database.');

                dataset.save(function (err, d) {
                  if (err) throw err;

                  my_util.log('The dataset has been saved in database.')

                  fs.unlink(upload_dir + '/' + user_file.originalname, function (err) {
                    // send the metadata back to the client
                    res.render('visualizer.ejs', {metadata: metadata, data: data, chart_reqs: chart_reqs});
                  });
                });
              });
            });

            parser.on('readable', function () {
              var record = parser.read();
              row_num = parser.lineNo; // starts from 1
              
              // extract column names
              if (row_num == 1) {
                for (key in record) {
                  col_names.push(key.trim());
                  col_types.push([]);
                }
              }

              // extracts all the possible datatypes
              if (record) {
                for (var i=0; i < col_names.length; i++) {
                  var key = col_names[i];
                  var value = record[key];
                  if (!value) continue; // skip missing values
                  value = value.trim();
                  var type;

                  if (isNaN(value)) {
                    // likely string
                    type = typeof 'string';
                  }
                  else {
                    // number
                    type = typeof 123;
                  }
                  // console.log(value + ', ' + type + ', ' + isNaN(value));

                  // keep it if it's new
                  if (!my_util.arrayContains(col_types[i], type)) {
                    col_types[i].push(type);
                  }
                }
              }
            });

            fstream.pipe(parser);

            // redirect the user to somewhere: it's asynchronous!
            // res.redirect('/renderer');
          }
          else if (file_name.indexOf('.json') >= 0) {
            fs.readFile(file_name, function (err, file_content) {
              if (err) throw err;

              var data = JSON.parse(file_content);

              if (!util.isArray(data) || data.length < 1) {
                return;
              }

              for (key in data[0]) {
                col_names.push(key.trim());
                col_types.push([]);
              }

              for (var i = 0; i < data.length; i++) {
                var record = data[i];

                for (var j = 0; j < col_names.length; j++) {
                  var key = col_names[j];
                  var value = record[key];
                  if (!value) continue; // skip missing values
                  value = value;
                  var type;

                  if (isNaN(value)) {
                    // likely string
                    type = typeof 'string';
                  }
                  else {
                    // number
                    type = typeof 123;
                  }
                  // console.log(value + ', ' + type + ', ' + isNaN(value));

                  // keep it if it's new
                  if (!my_util.arrayContains(col_types[j], type)) {
                    col_types[j].push(type);
                  }
                }
              }

              // aggregate datatypes
              // TODO: polish datatype rule
              for (var i=0; i < col_types.length; i++) {
                var types = col_types[i];
                if (types.length == 1) {
                  // homogeneous datatype
                  col_types[i] = types[0];
                }
                else if (my_util.arrayContains(types, typeof 'string')) {
                  // if there is one or more string as a value for this column, the column's datatype is string.
                  col_types[i] = typeof 'string';
                }
                else {
                  my_util.log('Unexpected datatype');
                  col_types[i] = 'undefined';
                }
              }

              // update database after parsing
              var user_id = 'user';
              var now = new Date();
              var metadata = new Metadata({
                user: user_id, // TODO: user identifier
                date: now, // TODO: timezone resolution: currently it uses UTC
                file_size: user_file.size,
                col_num: col_names.length,
                row_num: row_num,
                col_names: col_names,
                col_types: col_types
              });
              var dataset = new Dataset({
                user: user_id,
                date: now,
                data: data
              });

              metadata.save(function (err, md) {
                if (err) throw err;

                my_util.log('The metadata has been saved in database.');

                dataset.save(function (err, d) {
                  if (err) throw err;

                  my_util.log('The dataset has been saved in database.');

                  fs.unlink(upload_dir + '/' + user_file.originalname, function (err) {
                    // send the metadata back to the client
                    res.render('visualizer.ejs', {metadata: metadata, data: data, chart_reqs:chart_reqs});
                  });
                });
              });
            });
          }
      });
    });
  }
]);

// start the server
app.listen(port_number);
my_util.log('the server is running on ' + port_number);
