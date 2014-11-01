var Promise = require("bluebird"),
	fs = Promise.promisifyAll(require("fs"));

exports.isDirectory = function(f) {
	return fs.statAsync(f).then(function(stat) {
		return stat.isDirectory();
	});
}

exports.exists = function(f) {
	return new Promise(function(resolve) {
		fs.exists(f, resolve);
	});
}