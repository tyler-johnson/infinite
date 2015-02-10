var Promise = require("bluebird"),
	fs = Promise.promisifyAll(require("fs")),
	path = require("path"),
	util = require("./util"),
	_ = require("underscore");

exports.add = function(dir, pkgnames, options) {
	pkgnames = util.parsePackageNames(pkgnames);

	options = options || {};
	var pkgdir = options.pkgdir || "./packages";
	var fullpkgdir = path.resolve(dir || ".", pkgdir);

	if (!_.isArray(pkgnames) && pkgnames != null) {
		pkgnames = [ pkgnames ];
	}

	return util.getPackage(dir).then(function(pkg) {
		if (pkg.dependencies == null) pkg.dependencies = {};

		return fs.readdirAsync(fullpkgdir)
		.map(function(name) {
			return util.getPackage(path.join(fullpkgdir, name)).then(function(pkg) {
				if (!pkg.name) return;

				var _pkgdir = path.join(pkgdir, name);
				if (!util.isRelativePath(_pkgdir)) {
					_pkgdir = "./" + _pkgdir;
				}

				return [ pkg.name, _pkgdir ];
			}, function(e) {
				if (!util.isFileError(e, "ENOENT")) throw e;
			});
		})
		.filter(function(pkg) {
			return pkg != null && (pkgnames == null || _.contains(pkgnames, pkg[0]));
		})
		.each(function(p) {
			pkg.dependencies[p[0]] = p[1];
		})
		.then(function(pkgs) {
			return util.setPackage(pkg, dir).return(_.object(pkgs));
		});
	});
}

exports.remove = function(dir, pkgnames, options) {
	pkgnames = util.parsePackageNames(pkgnames);

	options = options || {};
	var pkgdir = options.pkgdir || "./packages";
	var fullpkgdir = path.resolve(dir || ".", pkgdir);

	return util.getPackage(dir).then(function(pkg) {
		if (pkg.dependencies == null) return [];
		
		// make sure this is a package we can remove
		var removed = _.chain(pkgnames).map(function(name) {
			var ver = pkg.dependencies[name];

			if (util.isPackagePath(ver, fullpkgdir, dir)) {
				delete pkg.dependencies[name];
				return [ name, ver ];
			}
		}).compact().object().value();

		if (!_.size(removed)) return removed;
		return util.setPackage(pkg, dir).return(removed);
	});
}

var list =
exports.list = function(dir, options) {
	options = options || {};
	var pkgdir = options.pkgdir || "./packages";
	var fullpkgdir = path.resolve(dir || ".", pkgdir);

	return util.getPackage(dir).then(function(pkg) {
		if (pkg.dependencies == null) return;
		
		return _.chain(pkg.dependencies).map(function(ver, name) {
			return util.isPackagePath(ver, fullpkgdir, dir) ? [ name, ver ] : null;
		}).compact().object().value();
	});
}