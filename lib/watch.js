var _ = require("underscore"),
	Promise = require("bluebird"),
	path = require("path"),
	fs = Promise.promisifyAll(require("fs")),
	cp = Promise.promisify(require("cp")),
	mkdirp = Promise.promisify(require("mkdirp")),
	ipm = require("./pm"),
	spawn = require("child_process").spawn,
	util = require("./util"),
	igor = require("ignore"),
	chokidar = require("chokidar");

module.exports = function(dir, pkgnames, options, cb) {
	dir = path.resolve(dir || ".");
	options = options || {};

	var moddir = path.resolve(dir, "node_modules");
	var ignore = util.parseIgnoreRules(options.ignore);
	
	// match names to paths
	return ipm.list(dir, pkgnames, options)

	// install each package
	.each(function(pkg) {
		var pkgdir = pkg.__dirname;
		var npkgdir = path.join(moddir, pkg.name);

		function copy(file) {
			var lfile = path.resolve(npkgdir, path.relative(pkgdir, file));
			return mkdirp(path.dirname(lfile)).then(function() {
				return cp(file, lfile);
			});
		}

		chokidar.watch(pkgdir, {
			persistent: true,
			ignoreInitial: !options.sync,
			ignored: function(file) {
				return !ignore.filter([ path.relative(pkgdir, file) ]).length;
			}
		})
		.on("add", copy)
		.on("change", copy)
		.on("unlink", function(file) {
			var lfile = path.resolve(npkgdir, path.relative(pkgdir, file));
			return fs.unlinkAsync(lfile).catch(function(e) {
				if (util.isFileError(e, "ENOENT")) return;
				throw e;
			});
		});
	})

	.nodeify(cb);
}