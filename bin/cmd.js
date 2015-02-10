#!/usr/bin/env node

process.title = "inf";

var _ = require("underscore"),
	minimist = require("minimist"),
	spawn = require("child_process").spawn;

var argv = minimist(process.argv.slice(2), {
	string: [ "pkgdir" ],
	boolean: [ "version", "help", "production", "save" ],
	alias: {
		v: "version",
		h: "help",
		p: "production",
		d: "pkgdir"
	},
	default: {
		pkgdir: "./packages"
	},
	'--': true
});

if (argv.version) {
	var pkg = require("../package.json");
	console.log(pkg.name + " v" + pkg.version);
	return process.exit(0);
}

if (argv._[0] == null || argv.help) {
	console.log("Usage: inf <command> [options]");
	return process.exit(0);
}

switch(argv._[0]) {
	case "add":
		require("../lib/pm.js").add(".", argv._.slice(1), argv).then(function(res) {
			var names = _.keys(res);
			if (!names.length) return console.log("No packages added.");
			console.log("Added " + names.length + " package" + (names.length === 1 ? "" : "s" ) + ":");
			names.forEach(function(n) { console.log(n); });
		});
		break;

	case "rm":
	case "remove":
		require("../lib/pm.js").remove(".", argv._.slice(1), argv).then(function(res) {
			var names = _.keys(res);
			if (!names.length) return console.log("No packages removed.");
			console.log("Removed " + names.length + " package" + (names.length === 1 ? "" : "s" ) + ":");
			names.forEach(function(n) { console.log(n); });
		});
		break;

	case "ls":
	case "list":
		require("../lib/pm.js").list(".", argv).then(function(names) {
			if (!_.size(names)) return console.log("No packages.");
			_.keys(names).forEach(function(n) { console.log(n); });
		});
		break;

	case "install":
		require("../lib/install.js")(".", argv._.slice(1), _.extend({}, argv, {
			npm: {
				production: argv.production
			}
		})).then(function(res) {
			var names = _.keys(res);
			if (!names.length) return console.log("No packages installed.");
			console.log("Installed " + names.length + " package" + (names.length === 1 ? "" : "s" ) + ":");
			names.forEach(function(n) { console.log(n); });
		});
		break;

	default:
		console.error("Unknown command '" + argv._[0] + "'");
		break;
}