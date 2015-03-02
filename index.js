// read configuration json file
var conf;
if (process.argv.length >= 2 + 1) {
  conf = require(process.argv[2]);
} else {
  conf = require('./default_conf.json');
}

// get global varables from conf
var port_number = conf.port_number;

// load modules
var express = require('express');
var util = require('./my_util.js');

// start the server
var app = express();

app.get('/', function(req, res) {
  res.end('Hello, World!');
});

app.listen(port_number);
util.log('the server is running on ' + port_number);
