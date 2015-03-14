var _ = require("underscore"),
	Promise = require("bluebird"),
	path = require("path"),
	fs = Promise.promisifyAll(require("fs")),
	cp = Promise.promisify(require("cp")),
	mkdirp = Promise.promisify(require("mkdirp")),
	ipm = require("./pm"),
	exec = require("child_process").exec,
	util = require("./util"),
	igor = require("ignore"),
	chokidar = require("chokidar"),
	semver = require("semver");

module.exports = function(dir, pkgnames, options, cb) {
	dir = path.resolve(dir || ".");
	options = options || {};

	var installDeps = options.deps !== false;
	var moddir = path.resolve(dir, "node_modules");
	var ignore = util.parseIgnoreRules(options.ignore);
	
	// match names to paths
	return ipm.list(dir, pkgnames, options)

	// install each package
	.each(function(pkg) {
		var pkgdir = pkg.__dirname;
		var npkgdir = path.join(moddir, pkg.name);
		var copyQueue = [];
		var flushing = false;
		var installing = false;

		var invalidateQueue = _.debounce(flushQueue, 25);
		var invalidateDeps = _.debounce(installMissingDeps, 500);

		function flushQueue() {
			if (flushing) return invalidateQueue();
			flushing = true;

			var queue = _.clone(copyQueue);
			copyQueue = [];
			
			Promise.map(queue, function(args) {
				copyFile.apply(null, args);
			}).finally(function() {
				flushing = false;
			});
		}

		function installMissingDeps() {
			if (installing) return invalidateDeps();
			installing = true;

			util.getPackage(pkgdir).then(function(npkg) {
				return pkg.dependencies = npkg.dependencies;
			}).then(function(deps) {
				return findModules(npkgdir, _.keys(deps)).then(function(mods) {
					return Promise.all(_.map(mods, function(mod, name) {
						if (mod && semver.satisfies(mod, deps[name])) return;
						return util.npm(npkgdir, "install", name);
					}));
				})
			}).finally(function() {
				installing = false;
			});
		}

		function onChange(file) {
			var relpath =  path.relative(pkgdir, file);
			if (installDeps && relpath === "package.json") invalidateDeps();
			copyQueue.push([ file, path.resolve(npkgdir, relpath) ]);
			invalidateQueue();
		}

		chokidar.watch(pkgdir, {
			persistent: true,
			ignoreInitial: !options.sync,
			ignored: function(file) {
				return !ignore.filter([ path.relative(pkgdir, file) ]).length;
			}
		})
		.on("add", onChange)
		.on("change", onChange)
		.on("unlink", function(file) {
			var lfile = path.resolve(npkgdir, path.relative(pkgdir, file));
			return fs.unlinkAsync(lfile).catch(function(e) {
				if (util.isFileError(e, "ENOENT")) return;
				throw e;
			});
		});
	})

	.nodeify(cb);
}

function copyFile(from, to) {
	return mkdirp(path.dirname(to)).then(function() {
		return cp(from, to);
	});
}

function readPkgVersions(names) {
	return "{" +

	names.map(function(n,i,l) {
		var str = "\"" + n + "\":";
		
		try {
			str += "\"" + require(n + "/package.json").version + "\"";
		} catch(e) {
			str += "false";
		};
		
		return str;
	}).join(",")

	+ "}";
}

function findModules(dir, names) {
	return new Promise(function(resolve, reject) {
		exec([ "node -e '",
			readPkgVersions.toString().replace(/\s+/g, " "),
			"; console.log(readPkgVersions(",
			JSON.stringify(names),
			"));",
			"'"].join(""), {
			cwd: dir
		}, function(err, stdout, stderr) {
			if (err) reject(err);
			else resolve(stdout ? JSON.parse(stdout) : null);
		});
	});
}