var Promise = require("bluebird"),
	fs = Promise.promisifyAll(require("fs")),
	path = require("path"),
	util = require("./util"),
	_ = require("underscore");

exports.add = function add(dir, pkgnames, options) {
	pkgnames = _.isArray(pkgnames) ? pkgnames : [ pkgnames ];
	dir = dir || ".";
	options = options || {};

	return Promise.all([
		readInfFile(dir),
		Promise.map(pkgnames, function(n) {
			if (typeof n === "string") {
				n = util.parsePackageNames(n);
				return util.getPackage(path.resolve(dir, n));
			}
			
			return n;
		}).filter(function(n) {
			return n != null && n.__dirname;
		})
	])

	.spread(function(names, pkgs) {
		// calculate the added packages while prepping new name list
		var added = pkgs.reduce(function(add, pkg) {
			if (!_.contains(names, pkg.__dirname)) {
				add.push(pkg);
				names.push(pkg.__dirname);
			}

			return add;
		}, []);

		// skip writing if none are being added
		if (!added.length) return [];

		// write names to disk
		return writeInfFile(dir, names).return(added);
	});
}

exports.remove = function remove(dir, pkgnames, options) {
	pkgnames = util.parsePackageNames(pkgnames);
	dir = dir || ".";
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
exports.list = function list(dir, pkgnames, options) {
	if (!_.isArray(pkgnames) && options == null) {
		options = pkgnames;
		pkgnames = [];
	}

	dir = dir || ".";
	options = options || {};

	return Promise.try(function() {
		if (!pkgnames.length) return readInfFile(dir);
		return pkgnames;
	}).map(function(n) {
		return util.getPackage(path.resolve(dir, n));
	});
}

exports.infFileName = ".infinite";

var getInfPath =
exports.getInfPath = function getInfPath(dir) {
	return path.resolve(dir || ".", exports.infFileName);
}

function readInfFile(dir) {
	return fs.readFileAsync(getInfPath(dir), { encoding: "utf-8" })
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

	return fs.writeFileAsync(getInfPath(dir), names, { encoding: "utf-8" });
}