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

var getPackage =
exports.getPackage = function getPackage(pkgdir) {
	pkgdir = path.resolve(pkgdir || ".");
	var filename = path.join(pkgdir, "package.json");
	return fs.readFileAsync(filename, { encoding: "utf-8" })
	.then(JSON.parse).then(function(data) {
		data.__filename = filename;
		data.__dirname = pkgdir;
		return data;
	});
}

exports.setPackage = function setPackage(data, pkgdir) {
	return fs.writeFileAsync(
		path.resolve(pkgdir || ".", "package.json"),
		JSON.stringify(_.omit(data, "__dirname", "__filename"), null, 2)
	);
}

exports.parsePackageNames = function parsePkgNames(dir, pkgnames, lookup) {
	if (!_.isArray(pkgnames)) pkgnames = pkgnames != null ? [ pkgnames ] : [];
	
	pkgnames = pkgnames.reduce(function(names, n) {
		if (typeof n !== "string") names.push(n);
		names = names.concat(_.compact(_.invoke(n.split(/\s+/), "trim")));
		return names;
	}, []).map(function(n) {
		var ispath = typeof n === "string";
		if (ispath) n = path.resolve(dir, n);
		return ispath && lookup ? getPackage(n) : n;
	});

	var out = lookup ? Promise.all(pkgnames) : pkgnames;

	return out.map(function(n) {
		return lookup || n == null || typeof n === "string" ? n : n.__dirname;
	}).filter(function(n) {
		return n != null && n != "";
	});
}