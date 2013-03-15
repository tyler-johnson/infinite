# Infinte Drive

Infinite Drive is a dead simple file system caching library. Infinite does not handle the actual file caching, but only sets up a folder with "drives" in it. Drives can really be anything, but Infinite comes with [JSON-Toolkit](https://github.com/appleifreak/json-toolkit) (for object/variable caching) and [Doctor](https://github.com/appleifreak/node-doctor) (for file/folder caching).

Infinite can also maintain a cache of drives, for faster loading between application sessions. This library was made to help you maintain persistent data across multiple environments.

## Install

`npm install infinite --save`

The `--save` will tell npm to add it to your `package.json`.

## Usage

To use `Infinite`, create a new object from the base class. The first argument is the path to the folder you want the drives to live in. Infinite uses a (usually hidden, defaults to `.infinite`) folder in this directory. If the folder doesn't exist, it is created. This argument is optional and defaults to the current working directory. The second argument should be an options object. `Infinite` extends EventEmitter and before it can be used, you will need to wait for the "ready" event.

```js
var InfDrive = require("infinite"),
	drive = InfDrive();

drive.on("ready", function() {
	// Do stuff here
});

drive.on("error", function() {
	// Catch any errors that might pop up
})
```

## Examples

`Infinite` is essentially a drive manager. You tell it to create a drive and then you can use it.

```js
drive.start("static", "directory", function(err, md) {
	md.set("file.txt", "Hello World!", function(err) {
		if (err) console.error(err);
		else console.log("Done!");
	});
});

// Later
drive.use("static"); // Returns the Doctor object, same as `md` above
```

You can also set up multiple drives simultaneously to prevent callback chaos.

```js
drive.start({
	"config": "json",
	"static": "directory",
}, function(err) {
	s = drive.use("static");
	c = drive.use("config");

	s.set("file.txt", "Hello World!", function(err) {
		if (err) console.error(err);
	});

	c.set("Hello", "World");
	c.save(function(err) {
		if (err) console.error(err);
	});

	// Later on, destroy the static drive
	setTimeout(function() {
		drive.destroy("static", function(err) {
			if (err) console.error(err);
			else console.log("Done!");
		});
	}, 2000);
});
```

Set up a custom drive. Drives, simply put, are any JS Object.


```js
drive.start("my-drive", SomeObjectWithMethods, function(err) {});
```