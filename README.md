# Infinite

Copies a node module somewhere in your system into `node_modules/`. This is similar to `npm link`, but instead of symlinking the folder, it duplicates all of the contents.

To install:

```sh
npm install infinite -g
```

The following will copy the contents `~/some_pkg` to `./node_modules/some_pkg` and then runs `npm install` in that directory.

```sh
inf install ~/some_pkg
```

Infinite will also continuously duplicate files as they change. Use in combination with `inf install` to get everything in the right place.

```sh
inf watch ~/some_pkg
```
