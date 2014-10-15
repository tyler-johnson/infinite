var _ = require("underscore"),
	Promise = require("bluebird"),
	path = require("path"),
	fs = Promise.promisifyAll(require("fs")),
	npm = require("npm"),
	SuperClass = require("./super");

module.exports = SuperClass.extend({
	constructor: function(name, inf) {
		this.name = name;
		this.infinite = inf;
		this.meta = {};
	},

	resolve: function() {
		var args = _.toArray(arguments);
		args.unshift(this.directory);
		return path.resolve.apply(path, args);
	},

	load: function(cb) {
		if (this._loaded) return Promise.bind(this).nodeify(cb);
		if (this._loading) return this.ready().nodeify(cb);
		
		var self = this;
		this._loading = true;

		// find the correct directory and load the package.json file
		return Promise.bind(this).then(function() {
			this.directory = this.infinite.findDrive(this.name);
			if (this.directory == null) {
				throw new Error("Could not locate drive '" + this.name + "'");
			}

			return fs.readFileAsync(this.resolve("package.json"), "utf8")
			.then(function(content) {
				self.meta = JSON.parse(content);
			}, function(e) {
				if (e.cause.code !== "ENOENT") throw e;
			});
		})

		// symlink package folder to node_modules directory
		.then(function() {
			var dest = this.infinite.resolve("node_modules", this.name),
				src = this.directory;

			return fs.readlinkAsync(dest).then(function(link) {
				if (link !== src) throw new Error("Cannot replace existing entity '" + dest + "'");
			}, function(e) {
				switch(e.cause.code) {
					case "ENOENT":
						return fs.symlinkAsync(src, dest, "dir");

					case "EINVAL":
						throw new Error("Cannot replace existing entity '" + dest + "'");
				}

				throw e;
			});
		})

		.then(function(content) {
			delete this._loading;
			this._loaded = true;
			this.emit("load");
		})

		.nodeify(cb);
	},

	install: function(cb) {
		var pkgs = _.toArray(arguments),
			self = this;

		function runInstall() {
			return Promise.promisify(npm.commands.install)(self.directory, pkgs);
		}

		// wait for the drive to load
		return this.ready()

		// only run install if there is a package.json file
		.then(function() {
			if (!pkgs.length) return new Promise(function(resolve, reject) {
				fs.exists(self.resolve("package.json"), function(exists) {
					if (exists) runInstall().then(resolve, reject);
					else resolve();
				});
			});

			return runInstall();
		})

		.nodeify(cb);
	},
	
	get: function(key) { return _.isUndefined(key) ? this.meta : this.meta[key]; },
	toJSON: function() { return this.meta; }
});