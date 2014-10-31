#!/usr/bin/env node

var infinite = require("../"),
	minimist = require("minimist");

var argv = minimist(process.argv.slice(2), {
	strings: [ "modules" ],
	boolean: [ "version", "production", "silent" ],
	alias: { v: "version", p: "production" },
	default: { silent: false }
});

if (argv.version) {
	var pkg = require("../package.json");
	console.log(pkg.name + " v" + pkg.version);
	process.exit(0);
}

infinite(argv._[0], {
	production: argv.production,
	node_modules: argv.modules,
	loglevel: argv.silent ? "silent" : null
}).then(function(res) {
	if (!argv.silent) {
		console.log("Installed dependencies in " + res[0].length + " packages.");
		console.log("Symlinked " + res[1].length + " packages.");
	}
});