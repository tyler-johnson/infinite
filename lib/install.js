var _ = require("underscore"),
	Promise = require("bluebird"),
	path = require("path"),
	fs = Promise.promisifyAll(require("fs")),
	npm = require("npm"),
	mkdirp = Promise.promisify(require("mkdirp")),
	pkgs = require("./pm"),
	util = require("./util");

module.exports = function(dir, pkgnames, options, cb) {
	pkgnames = util.parsePackageNames(pkgnames);
	dir = path.resolve(dir || ".");
	options = options || {};

	var hasPkgs = !!pkgnames.length;
	var pkgdir = options.pkgdir || "./packages";
	var fullpkgdir = path.resolve(dir, pkgdir);

	// load npm
	return new Promise(function(resolve, reject) {
		npm.load(options.npm || {}, function(err) {
			if (err) return reject(err);
			resolve();
		});
	})

	// match names to paths
	.then(function() {
		if (hasPkgs) return Promise.all(pkgnames.map(function(n) {
			var _pkgdir = path.join(pkgdir, n);
			if (!util.isRelativePath(_pkgdir)) _pkgdir = "./" + _pkgdir;
			return util.getPackage(_pkgdir).then(function(pkg) {
				return [ pkg.name, _pkgdir ];
			});
		})).then(_.object);

		return pkgs.list();
	})

	// save to package.json, if specified, before link
	.tap(function() {
		if (options.save && hasPkgs) return pkgs.add(dir, pkgnames, options);
	})

	// run npm link
	.then(function(toLink) {
		npm.config.localPrefix = dir; // so npm installs at the right place
		return Promise.promisify(npm.commands.link)(_.values(toLink)).return(toLink);
	})

	.nodeify(cb);
}