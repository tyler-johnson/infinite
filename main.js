var Infinite = require("./lib/infinite"),
	path = require("path"),
	json = require('json-toolkit'),
	Doctor = require('directory-doctor');

module.exports = function(folder, options) {
	var drive = new Infinite(folder, options);

	drive.setType('json', function(name, callback) {
		var file = path.join(this.location, name + ".json"),
			res = new json.Resource(file, { from_file: true, pretty_output: true }),
			errev = function(err) { callback(err); }

		res.on("error", errev);
		res.once("ready", function() {
			res.removeListener("error", errev);
			callback(null, res, res.file);
		});
	});

	drive.setType('directory', function(name, callback) {
		var folder = path.join(this.location, name),
			doc = new Doctor(folder),
			errev = function(err) { callback(err); }

		doc.on("error", errev);
		doc.once("ready", function() {
			doc.removeListener("error", errev);
			callback(null, doc, doc.location);
		});
	});

	return drive;
}

module.exports.Infinite = Infinite