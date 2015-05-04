var mongoose = require('mongoose');

exports.metadataSchema = mongoose.Schema({
  user: String,
  date: Date,
  file_size: Number,
  col_num: Number,
  row_num: Number,
  col_names: Array,
  col_types: Array
});

exports.datasetSchema = mongoose.Schema({
  user: String,
  date: Date,
  data: Array
});
