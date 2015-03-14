var mongoose = require('mongoose');

exports.datasetSchema = mongoose.Schema({
  user: String,
  date: Date,
  path: String,
  file_size: Number,
  col_num: Number,
  row_num: Number,
  col_names: Array,
  col_types: Array
});
