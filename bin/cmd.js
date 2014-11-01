#!/usr/bin/env node

var minimist = require("minimist"),
	spawn = require("child_process").spawn;

var argv = minimist(process.argv.slice(2), {
	boolean: [ "version", "production" ],
	alias: { v: "version", p: "production" },
	'--': true
});

if (argv.version) {
	var pkg = require("../package.json");
	console.log(pkg.name + " v" + pkg.version);
	process.exit(0);
}

switch(argv._[0]) {
	case "add":
		require("../lib/pm.js").add(argv._.slice(1)).then(function(names) {
			if (!names.length) return console.log("No packages added.");
			console.log("Added " + names.length + " package" + (names.length === 1 ? "" : "s" ) + ":");
			names.forEach(function(n) { console.log(n); });
		});
		break;

	case "remove":
		require("../lib/pm.js").remove(argv._.slice(1)).then(function(names) {
			if (!names.length) return console.log("No packages removed.");
			console.log("Removed " + names.length + " package" + (names.length === 1 ? "" : "s" ) + ":");
			names.forEach(function(n) { console.log(n); });
		});
		break;

	case "list":
		require("../lib/pm.js").list().then(function(names) {
			if (!names.length) return console.log("No packages.");
			names.forEach(function(n) { console.log(n); });
		});
		break;

	case "start":
		require("../lib/pm.js").list().then(function(names) {
			var expr = "process.argv = " + JSON.stringify(argv["--"]) + ";";
			expr += "process.infinite = true;";

			expr += names.map(function(n) {
				return "require('" + n.replace(/'/g, "\\'") + "');"
			}).join("");
			
			var runtime = spawn("node", [ "-e", expr ]);
			runtime.stdout.pipe(process.stdout);
			runtime.stderr.pipe(process.stderr);
		});
		break;

	case "install":
		require("../lib/install.js")(argv._[1] || "./packages", {
			npm: {
				production: argv.production
			}
		}).then(function(res) {
			console.log("Installed dependencies in " + res[0].length + " packages.");
			console.log("Symlinked " + res[1].length + " packages.");
		});
		break;
}