var _ = require("underscore"),
	Promise = require("bluebird"),
	path = require("path"),
	fs = Promise.promisifyAll(require("fs")),
	npm = require("npm"),
	mkdirp = Promise.promisify(require("mkdirp")),
	util = require("./util"),
	Drive = require("./drive"),
	SuperClass = require("./super");

var Infinite =
module.exports = SuperClass.extend({
	constructor: function(cwd, options) {
		if (!(this instanceof Infinite)) {
			return new Infinite(cwd, options);
		}

		if (typeof cwd === "object" && options == null) {
			options = cwd;
			cwd = null;
		}

		this.drives = {};
		this.options = _.defaults(options || {}, {
			dirname: "packages"
		});

		this.directory = path.resolve.apply(null, _.compact([ cwd || this.options.cwd ]));
		this.paths = util.drivePaths(this.directory, this.options.dirname);

		this.load();
	},

	load: function(cb) {
		if (this._loaded) return Promise.bind(this).nodeify(cb);

		return Infinite.load().bind(this)
		.then(function() {
			return mkdirp(this.resolve("node_modules"));
		})
		.then(function() {
			var queue = this._driveQueue;
			if (queue == null) return;
			
			return util.asyncWhile(function() {
				return queue.length;
			}, function() {
				return queue.shift().load();
			});
		})
		.then(function() {
			delete this._driveQueue;
			this._loaded = true;
			this.emit("load");
		})
		.nodeify(cb);
	},

	resolve: function() {
		var args = _.toArray(arguments);
		args.unshift(this.directory);
		return path.resolve.apply(path, args);
	},

	findDrive: function(name) {
		var dir, i;
		
		for (i in this.paths) {
			dir = path.resolve(this.paths[i], name);
			if (fs.existsSync(dir)) return dir;
		}

		return null;
	},

	// gets a drive by name, creating it if need be
	drive: function(name) {
		var drive = this.drives[name];

		if (drive == null) {
			drive = this.drives[name] = new Drive(name, this);
			this._enqueueDrive(drive);
		}
		
		return drive;
	},

	// queues up a drive to be loaded when core infinite hasn't finished yet
	_enqueueDrive: function(drive) {
		if (this._loaded) {
			drive.load();
		} else {
			if (this._driveQueue == null) this._driveQueue = [];
			this._driveQueue.push(drive);
		}
		
		return this;
	},

	// like a normal require, but pulls names directly from packages folder
	require: function(name) {
		var dir = this.findDrive(name);
		
		if (dir == null) {
			throw new Error("Could not locate drive '" + name + "'");
		}

		return require(dir);
	},

	// installs all drives in local packages folder
	install: function(cb) {
		var base = this.paths[0],
			self = this;

		// get all names in the base directory
		return fs.readdirAsync(base).bind(this)

		// run install on folders found
		.map(function(name) {
			return fs.statAsync(path.join(base, name)).then(function(stat) {
				// directories only
				if (!stat.isDirectory()) return;

				var drive = self.drive(name);
				return drive.install().return(drive);
			});	
		}, { concurreny: 1 })

		// return only the list of "installed" drives
		.filter(function(drive) {
			return drive != null;
		})

		.nodeify(cb);
	}
}, {
	// loads NPM only once
	load: (function() {
		var loaded = false,
			rejected, callbacks;

		function load(resolve, reject) {
			if (callbacks == null) {
				callbacks = [];

				npm.load({}, function(err) {
					loaded = true;
					if (err) rejected = err;
					
					callbacks.forEach(function(cb) {
						if (err) cb[1](err);
						else cb[0]();
					});

					callbacks = null;
				});
			}

			callbacks.push([ resolve, reject ]);
		}

		return function() {
			if (loaded) return rejected ? Promise.reject(rejected) : Promise.resolve();
			return new Promise(load);
		}
	})()
});