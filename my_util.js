var packageInfo = require('./package.json');

var get_time_str = function () {
  var now = new Date();
  var str = now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();
  return str;
};

exports.log = function (text) {
  console.log('[' + packageInfo.name + ' log ' + get_time_str() + '] - ' + text);
};
