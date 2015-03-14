var packageInfo = require('./package.json');

var get_time_str = function () {
  var now = new Date();
  var str = now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();
  return str;
};

exports.log = function (text) {
  console.log('[' + packageInfo.name + ' log ' + get_time_str() + '] - ' + text);
};

exports.objectLength = function (obj) {
  var cnt = 0; for(key in obj) cnt++; return cnt;
};

exports.arrayContains = function (arr, obj) {
  for (i=0; i < arr.length; i++) {
    if (arr[i] == obj) {
      return true;
    }
  }
  return false;
}
