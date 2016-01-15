'use strict';

var Promise = require('bluebird');
var assign = require('object-assign');
var stream = require('readable-stream');
var filter = require('object-filter');

module.exports = Cursor;

function Cursor( service, url, batchSize ){
	stream.Readable.call(this, {
		readableObjectMode: true,
	});

	this._skip = 0;
	this._limit = null;
	this._sort = null;
	this._filter = null;
	this._before = null;
	this._after = null;

	this._service = service;
	this._url = url;
	this._streamBatchSize = batchSize;
}

assign(Cursor.prototype, {
	filter: function( filter ){
		this._filter = filter;

		return this;
	},

	sort: function( sort ){
		this._sort = sort;

		return this;
	},

	skip: function( skip ){
		this._skip = skip;

		return this;
	},

	limit: function( limit ){
		this._limit = limit;

		return this;
	},

	before: function( id ){
		this._before = id;

		return this;
	},

	after: function( id ){
		this._after = id;

		return this;
	},

	stream: function(){
		return new ServiceStream(this._service, this._url, filter({
			before: this._before,
			after: this._after,
			sort: this._sort,
			filter: this._filter,
		}, isDefined), this._skip, this._limit, this._streamBatchSize);
	},

	toArray: function( cb ){
		var results = [];

		var stream = this.stream()
			.on('data', function( d ){
				results.push(d);
			});

		return new Promise(function( rs, rj ){
			stream
				.on('end', function( err ){
					if (err)
						return rj(err);

					return rs(results);
				})
				.on('error', function( err ){
					rj(err);
				});
		})
			.nodeify(cb);
	},
});

function ServiceStream( service, url, query, start, end, batchSize ){
	stream.Readable.call(this, {
		objectMode: true,
	});

	this._service = service;
	this._url = url;
	this._query = query;
	this._position = query.before || query.after || null;
	this._skip = start || 0;
	this._limit = end;
	this._size = 0;
	this.batchSize = batchSize || 50;

	this._ended = false;
	this._busy = false;
}

ServiceStream.prototype = Object.create(stream.Readable.prototype);

assign(ServiceStream.prototype, {
	_read: function( n ){
		if (this._busy || this._ended)
			return;

		this._busy = true;

		this.fetch();
	},

	fetch: function(){
		var that = this;

		var query = assign({}, this._query, {
			limit: this._limit ? Math.min(this.batchSize, this._limit - this._size) : this.batchSize,
		});

		if (this._position) {
			if (query.after)
				query.after = this._position;
			else
				query.before = this._position;
		} else if (this._skip) {
			query.skip = this._skip;
		}

		return this._service.request('GET', this._url, query).then(function( data ){
			var length = data.length;
			var thirsty = false;

			for (var i = 0;i < length;i++)
				thirsty = that.push(data[i]);

			that._size += length;

			if (length < that.batchSize || that._size === that._limit) {
				that._ended = true;
				that.push(null);

				if (that._size !== that._limit)
					that.emit('exhausted');
			} else if (thirsty) {
				that._position = data[length - 1].id;
				return that.fetch();
			}
		}, function( err ){
			that.emit('error', err);
		});
	},
});

function isDefined( f ){
	return f !== undefined && f !== null;
}
