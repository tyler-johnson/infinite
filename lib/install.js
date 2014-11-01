var Promise = require("bluebird"),
	path = require("path"),
	fs = Promise.promisifyAll(require("fs")),
	npm = require("npm"),
	mkdirp = Promise.promisify(require("mkdirp")),
	util = require("./util");

module.exports = function(pkgdir, options, cb) {
	pkgdir = path.resolve(pkgdir || ".");
	
	options = options || {};
	options.node_modules = path.resolve(pkgdir, options.node_modules || "../node_modules");

	// make sure the package dir exists
	return util.isDirectory(pkgdir).then(function(isDir) {
		if (!isDir) throw new Error("'" + pkgdir + "' exists and is not a directory.");
	})

	// load npm
	.then(function() {
		return new Promise(function(resolve, reject) {
			npm.load(options.npm || {}, function(err) {
				if (err) return reject(err);
				resolve();
			});
		});
	})

	// get all files in dir
	.then(function() {
		return fs.readdirAsync(pkgdir);
	})

	// run the install
	.then(function(names) {
		return Promise.map([
			[ install, names, pkgdir ],
			[ symlink, names, pkgdir, options.node_modules ]
		], function(args) {
			var fn = args.shift();
			return fn.apply(null, args);
		});
	})

	.nodeify(cb);
}

function install(names, base) {
	return Promise.map(names, function(n) {
		return path.join(base, n);
	})

	// must be a directory
	.filter(util.isDirectory)

	// must have a package.json file
	.filter(function(dir) {
		return fs.statAsync(path.join(dir, "package.json"))
		.then(function(stat) {
			return stat.isFile();
		}, function(e) {
			if (e.cause && e.cause.code === "ENOENT") return;
			throw e;
		});
	})

	// run npm install on all of the remaining
	.each(function(dir) {
		return Promise.promisify(npm.commands.install)(dir, []);
	});
}

function symlink(names, base, dest) {
	return Promise.map(names, function(n) {
		return [ path.join(base, n), path.join(dest, n) ];
	})

	// must be a directory
	.filter(function(s) { return util.isDirectory(s[0]); })

	// cannot conflict with existing name in dest
	.filter(function(s) {
		return util.exists(s[1]).then(function(r) { return !r; });
	})

	// ensure destination directory exists
	.then(function(links) {
		if (links.length) return mkdirp(dest).return(links);
		return Promise.resolve(links);
	})

	// complete symlink
	.each(function(s) {
		return fs.symlinkAsync(s[0], s[1], "dir")
	})

	// only return the symlink resulting path
	.map(function(s) { return s[1]; });
}