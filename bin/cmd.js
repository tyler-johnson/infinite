#!/usr/bin/env node

var Infinite = require("../"),
	minimist = require("minimist");

var argv = minimist(process.argv.slice(2), {
	strings: [ "dir" ],
	boolean: [ "version" ],
	alias: { v: "version", d: "dir" },
	default: { dir: "packages" }
});

if (argv.version) {
	var pkg = require("../package.json");
	console.log(pkg.name + " v" + pkg.version);
	process.exit(0);
}

Infinite({
	cwd: argv._[0],
	dirname: argv.dir
}).install().then(function(drives) {
	console.log("Successfully installed " + drives.length + " drives.");
});