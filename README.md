# Infinite

## Usage

```
infinite( pkgdir [, options ][, callback ] ) -> Promise
```

Infinite is a function which accomplishes two tasks with a packages directory, `pkgdir`:

1. Installs NPM dependencies in all immediate subdirectories with a `package.json` file.
2. Symlinks all non-conflicting subdirectories into the `node_modules` folder.

The `callback` is called when the process completes, possibly with an `error`. Infinite also returns a Promise that fulfills at the same time.

These are valid properties for `options`:

* `node_modules` - A path relative to `pkgdir` that points to a directory the packages should be symlinked into. This directory is created if it does not exist. Defaults to `../node_modules`.
* `production` - This passes the `--production` flag to `npm install`, ensuring that no `devDependencies` are installed.
* `loglevel` - This sets the [NPM log level](https://www.npmjs.org/doc/misc/npm-config.html#loglevel). Helpful if you are tired of those annoying NPM warnings.
