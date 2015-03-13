var _ = require("underscore"),
	Promise = require("bluebird"),
	path = require("path"),
	fs = Promise.promisifyAll(require("fs")),
	// mkdirp = Promise.promisify(require("mkdirp")),
	cpr = Promise.promisify(require("cpr")),
	// pkgs = require("./pm"),
	spawn = require("child_process").spawn,
	util = require("./util");

module.exports = function(dir, pkgnames, options, cb) {
	pkgnames = util.parsePackageNames(pkgnames);
	dir = path.resolve(dir || ".");
	options = options || {};

	var moddir = path.resolve(dir, "node_modules");

	// match names to paths
	return Promise.try(function() {
		if (!pkgnames.length) return [];

		// get all packages
		return Promise.map(pkgnames, function(n) {
			return util.getPackage(path.resolve(dir, n));
		})

		// this is a seperate step to make sure all packages exist before installing any
		.each(function(pkg) {
			var pkgdir = path.join(moddir, pkg.name);

			// copy all items
			return cpr(pkg.__dirname, pkgdir, {
				deleteFirst: false,
				overwrite: false,
				confirm: false
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
	})

	.nodeify(cb);
}