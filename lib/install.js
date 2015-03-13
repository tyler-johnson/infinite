var _ = require("underscore"),
	Promise = require("bluebird"),
	path = require("path"),
	fs = Promise.promisifyAll(require("fs")),
	// mkdirp = Promise.promisify(require("mkdirp")),
	cpr = Promise.promisify(require("cpr")),
	ipm = require("./pm"),
	spawn = require("child_process").spawn,
	util = require("./util");

module.exports = function(dir, pkgnames, options, cb) {
	pkgnames = util.parsePackageNames(pkgnames);
	dir = path.resolve(dir || ".");
	options = options || {};

	var moddir = path.resolve(dir, "node_modules");
	// var inffile = path.join(dir, ".infinite");

	// match names to paths
	return Promise.try(function() {
		if (!pkgnames.length) return ipm.list(dir);

		// get all packages and their metadata
		return Promise.map(pkgnames, function(n) {
			return util.getPackage(path.resolve(dir, n));
		});
	})

	// install each package
	.each(function(pkg) {
		var pkgdir = path.join(moddir, pkg.name);

		// copy all items
		return cpr(pkg.__dirname, pkgdir, {
			deleteFirst: false,
			overwrite: options.overwrite,
			confirm: false,
			filter: options.filter || /node_modules/
		})

		// install dependencies
		.then(function() {
			return new Promise(function(resolve, reject) {
				var cp = spawn("npm",  [ "install" ], {
					cwd: pkgdir,
					stdio: "inherit"
				});

				cp.on("error", reject);

				cp.once("exit", function(code) {
					resolve();
				});
			});
		});
	})

	// save to the infinite file
	.tap(function(pkgs) {
		if (options.save) return ipm.add(dir, pkgnames);
	})

	.nodeify(cb);
}