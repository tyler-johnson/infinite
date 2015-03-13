#!/usr/bin/env node

process.title = "inf";

var _ = require("underscore"),
	minimist = require("minimist"),
	spawn = require("child_process").spawn,
	path = require("path");

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
			console.log("\nAdded " + names.length + " package" + (names.length === 1 ? "" : "s" ) + ":");
			names.forEach(function(n) { console.log("  + " + n); });
			console.log();
		});
		break;

	case "rm":
	case "remove":
		require("../lib/pm.js").remove(".", argv._.slice(1), argv).then(function(res) {
			var names = _.keys(res);
			if (!names.length) return console.log("No packages removed.");
			console.log("\nRemoved " + names.length + " package" + (names.length === 1 ? "" : "s" ) + ":");
			names.forEach(function(n) { console.log("  - " + n); });
			console.log();
		});
		break;

	case "ls":
	case "list":
		require("../lib/pm.js").list(".", argv).then(function(names) {
			if (!_.size(names)) return console.log("No packages.");
			console.log("\nLinked Packages:");
			_.keys(names).forEach(function(n) { console.log("  + " + n); });
			console.log();
		});
		break;

	case "install":
		require("../lib/install.js")(".", argv._.slice(1), _.extend({}, argv, {
			npm: {
				production: argv.production
			}
		})).then(function(res) {
			var names = _.map(res, function(p) {
				return _.pick(p, "name", "__dirname");
			});
			if (!names.length) return console.log("No packages installed.");
			console.log("\nInstalled " + names.length + " package" + (names.length === 1 ? "" : "s" ) + ":");
			names.forEach(function(n) { console.log("  + %s (%s)", n.name, n.__dirname); });
			console.log();
		});
		break;

	case "clean":
		require("../lib/clean.js")(".", _.extend({}, argv)).then(function(res) {
			console.log("Safely removed all 'node_modules' directories.");
		});
		break;

	default:
		console.error("Unknown command '" + argv._[0] + "'");
		break;
}