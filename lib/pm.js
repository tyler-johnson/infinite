var Promise = require("bluebird"),
	fs = Promise.promisifyAll(require("fs")),
	path = require("path"),
	util = require("./util"),
	_ = require("underscore");

exports.add = function(dir, pkgnames, options) {
	pkgnames = util.parsePackageNames(pkgnames);
	options = options || {};

	return Promise.all([
		readInfFile(dir),
		Promise.map(pkgnames, function(n) {
			return typeof n === "string"
				? util.getPackage(path.resolve(dir, n))
				: n;
		})
	])

	.spread(function(names, pkgs) {
		return writeInfFile(dir, _.union(names, _.pluck(pkgs, "__dirname")))
		.return(pkgs.reduce(function(add, pkg) {
			if (!_.contains(names, pkg.__dirname)) add.push(pkg);
			return add;
		}, []));
	});
}

exports.remove = function(dir, pkgnames, options) {
	pkgnames = util.parsePackageNames(pkgnames);
	options = options || {};
	
	return Promise.all([
		readInfFile(dir),
		pkgnames.map(function(n) {
			return path.resolve(dir, n);
		})
	])

	.spread(function(names, pkgs) {
		return writeInfFile(dir, _.difference(names, pkgs)).return(_.intersection(names, pkgs));
	});
}

var list =
exports.list = function(dir, options) {
	options = options || {};

	return readInfFile(dir).map(function(n) {
		return util.getPackage(path.resolve(dir, n));
	});
}

function readInfFile(dir) {
	return fs.readFileAsync(path.join(dir, ".infinite"), { encoding: "utf-8" })
	.then(function(data) {
		return data.trim().split("\n").map(function(s) {
			return s.trim();
		}).filter(function(n) {
			return n != "";
		});
	}, function(e) {
		if (util.isFileError(e, "ENOENT")) return [];
		throw e;
	});
}

function writeInfFile(dir, names) {
	names = names.map(function(d) {
		return typeof d === "string" ? d.trim() : "";
	}).filter(function(n) {
		return n != "";
	}).join("\n");

	return fs.writeFileAsync(path.join(dir, ".infinite"), names, { encoding: "utf-8" });
}