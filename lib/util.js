var Promise = require("bluebird"),
	path = require("path");

// taken from https://github.com/joyent/node/blob/cfcb1de130867197cbc9c6012b7e84e08e53d032/lib/module.js#L200-L219
// modified for use in this library
exports.drivePaths = function(from, dirname) {
	if (dirname == null) dirname = "packages";

	// guarantee that 'from' is absolute.
	from = path.resolve(from);

	// note: this approach *only* works when the path is guaranteed
	// to be absolute.  Doing a fully-edge-case-correct path.split
	// that works on both Windows and Posix is non-trivial.
	var paths = [];
	var parts = from.split(path.sep);

	for (var tip = parts.length - 1; tip >= 0; tip--) {
		// don't search in .../node_modules/node_modules
		if (parts[tip] === dirname) continue;
		var dir = parts.slice(0, tip + 1).concat(dirname).join(path.sep);
		paths.push(dir);
	}

	return paths;
}

exports.asyncWhile = function(condition, action, ctx) {
	var whilst;
	
	return Promise.bind(ctx).then(whilst = function(data) {
		return condition(data) ?
			Promise.cast(action(data)).then(whilst) :
			Promise.resolve(data);
	});
}