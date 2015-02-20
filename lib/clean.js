var _ = require("underscore"),
	Promise = require("bluebird"),
	path = require("path"),
	fs = Promise.promisifyAll(require("fs")),
	rmdir = Promise.promisify(require("rimraf"));

module.exports = function(dir, options) {
	dir = path.resolve(dir || ".");
	options = options || {};
	var pkgdir = path.resolve(dir, options.pkgdir || "./packages");

	return fs.readdirAsync(pkgdir).each(function(n) {
		return rmdir(path.join(pkgdir, n, "node_modules"));
	}).then(function() {
		return rmdir(path.join(dir, "node_modules"));
	});
}