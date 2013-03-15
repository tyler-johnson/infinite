_ = require 'underscore'
json = require 'json-toolkit'
#Doctor = require 'directory-doctor'
fs = require 'fs-extra'
path = require 'path'
EventEmitter = require('events').EventEmitter
exec = require('child_process').exec
async = require 'async'

class Infinite extends EventEmitter
	constructor: (folder, options) ->
		# Options
		@options = _.defaults options or {},
			dirname: '.infinite',
			cache_drives: true,
			cache_name: '.inf_cache',
			autoload: true

		# Properties
		@location = path.resolve process.cwd(), folder or "", @options.dirname
		@drives = {}
		@types = {}
		
		# Make/find the directory
		fs.mkdirs @location, (err) =>
			if err then @emit "error", err
			else if @options.autoload then @load (err) =>
				if err then @emit "error", err
				else @emit "ready"
			else @emit "ready"

	use: (name) ->
		return if _.has(@drives, name) then @drives[name].obj else undefined

	start: (name, type, cb) ->
		try
			# other syntax: start({ name: type, ... }, callback)
			if _.isObject(name)
				return async.each(_.keys(name), (key, callback) =>
					@start key, name[key], callback
				, (err) =>
					if _.isFunction(type) then type err
					else if err then @emit "error", err
				)

			if _.has(@drives, name) then throw new Error "Drive #{name} already exists and cannot be overridden."
			
			finish = (obj, file, t) =>
				@drives[name] = { obj: obj, file: file, type: t }
				@saveCache (err) =>
					if err
						if _.isFunction(cb) then cb err
						else @emit "error", err
					else
						if _.isFunction(cb) then cb null, obj
						@emit "start", name, obj, t

			if _.isString type
				unless _.has(@types, type) then throw new Error "Unknown drive type #{type}."

				# Run the type builder
				@types[type].call @, name, (err, obj, file) =>
					if err or !_.isObject(obj) or !_.isString(file)
						unless _.isObject(obj) then err = new Error "Expected an object to be returned from type builder."
						unless _.isString(file) then err = new Error "Expected the name of a file or directory to be returned from type builder."
						if _.isFunction(cb) then cb err
						else @emit "error", err
					else finish obj, file, type
			else if _.isObject type then finish type
		catch err
			if _.isFunction(cb) then cb err
			else if err then @emit "error", err

	stop: (name) ->
		if _.has(@drives, name)
			delete @drives[name]
			@emit "stop", name

	destroy: (name, cb) ->
		if _.has(@drives, name) and @drives[name].file?
			fs.remove path.resolve(@location, @drives[name].file), (err) =>
				if err
					if _.isFunction(cb) then cb err
					else @emit "error", err
				else
					@stop name
					if _.isFunction(cb) then cb null
					@emit "destroy", name
		else
			err = new Error "Drive does not have an associated file/folder to remove. You will have to remove it manually."
			if _.isFunction(cb) then cb err
			else @emit "error", err

	setType: (type, build) ->
		if _.has(@types, type) then throw new Error "Type #{type} already exists."
		unless _.isFunction(build) then throw new Error "Expecting a functions."
		@types[type] = build

	saveCache: (cb) ->
		unless @options.cache_drives then cb()

		file = path.join(@location, @options.cache_name)
		json.saveToFile _.object(_.keys(@drives), _.pluck(@drives, "type")), file, (err) =>
			if _.isFunction(cb) then cb err
			else if err then @emit "error", err

	load: (cb) ->
		file = path.join(@location, @options.cache_name)
		fs.exists file, (exists) =>
			if exists then json.parseFile file, (err, data) =>
				if err then @emit "error", err
				else @start data, (err) =>
					if _.isFunction(cb) then cb err
					else if err then @emit "error", err
			else if _.isFunction(cb) then cb null

module.exports = Infinite