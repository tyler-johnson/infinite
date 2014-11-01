var Promise = require("bluebird"),
	fs = Promise.promisifyAll(require("fs")),
	path = require("path"),
	util = require("./util"),
	_ = require("underscore");

exports.add = function(pkgnames, cwd) {
	pkgnames = parsePackageNames(pkgnames);

	return getPackage(cwd).then(function(pkg) {
		if (pkg.infinite == null) pkg.infinite = [];
		
		pkgnames.forEach(function(name) {
			if (pkg.infinite.indexOf(name) < 0) {
				pkg.infinite.push(name);
			}
		});

		return setPackage(pkg, cwd);
	}).return(pkgnames);
}

exports.remove = function(pkgnames, cwd) {
	pkgnames = parsePackageNames(pkgnames);

	return getPackage(cwd).then(function(pkg) {
		if (pkg.infinite == null) return;

		var result = pkgnames.filter(function(name) {
			var i = pkg.infinite.indexOf(name);
			if (i < 0) return false;

			while (i > -1) {
				pkg.infinite.splice(i, 1);
				i = pkg.infinite.indexOf(name);
			}

			return true;
		});
		
		return setPackage(pkg, cwd).return(result);
	});
}

var list =
exports.list = function(cwd) {
	return getPackage(cwd).then(function(pkg) {
		return pkg.infinite == null ? [] : pkg.infinite;
	});
}

function parsePackageNames(pkgnames) {
	if (!_.isArray(pkgnames)) pkgnames = [ pkgnames ];

	return _.unique(pkgnames.filter(function(pkgname) {
		return typeof pkgname === "string" && pkgname !== "";
	}).reduce(function(m, name) {
		return m.concat(_.compact(name.split(/\s+/g)));
	}, []));
}

function getPackage(cwd) {
	return fs.readFileAsync(path.resolve(cwd || ".", "package.json"), "utf-8")
	.then(function(raw) { return JSON.parse(raw); });
}

function setPackage(data, cwd) {
	return fs.writeFileAsync(
		path.resolve(cwd || ".", "package.json"),
		JSON.stringify(data, null, 2)
	);
}