var _ = require("underscore"),
	Promise = require("bluebird"),
	fs = Promise.promisifyAll(require("fs")),
	path = require("path");

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

exports.isFileError = function(e, code) {
	return e.code === code && (e.cause && e.cause.code === code);
}

exports.isRelativePath = function(p) {
	if (typeof p !== "string") return false;
	var start = p.substr(0, 2);
	return start === "./" || start === "..";
}

exports.isPackagePath = function(p, pkgdir, cwd) {
	return exports.isRelativePath(p) &&
		path.dirname(path.resolve(cwd || ".", p)) === pkgdir;
}

exports.getPackage = function(cwd) {
	return fs.readFileAsync(path.resolve(cwd || ".", "package.json"), "utf-8")
	.then(function(raw) { return JSON.parse(raw); });
}

exports.setPackage = function(data, cwd) {
	return fs.writeFileAsync(
		path.resolve(cwd || ".", "package.json"),
		JSON.stringify(data, null, 2)
	);
}

exports.parsePackageNames = function(pkgnames) {
	if (!_.isArray(pkgnames)) pkgnames = pkgnames != null ? [ pkgnames ] : [];

	return _.unique(pkgnames.filter(function(pkgname) {
		return typeof pkgname === "string" && pkgname !== "";
	}).reduce(function(m, name) {
		return m.concat(_.compact(name.split(/\s+/g)));
	}, []));
}