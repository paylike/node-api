'use strict';

var Promise = require('bluebird');
var assign = require('object-assign');
var stream = require('readable-stream');
var filter = require('object-filter');

module.exports = Cursor;

function Cursor( service, url, highWaterMark ){
	this._limit = null;
	this._sort = null;
	this._filter = null;
	this._before = null;
	this._after = null;

	this._service = service;
	this._url = url;
	this._highWaterMark = highWaterMark;
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

	stream: function( highWaterMark ){
		return new ServiceStream(this._service, this._url, filter({
			before: this._before,
			after: this._after,
			sort: this._sort,
			filter: this._filter,
		}, isDefined), this._limit, highWaterMark || this._highWaterMark);
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

function ServiceStream( service, url, query, end, batchSize ){
	stream.Readable.call(this, {
		highWaterMark: batchSize || 50,
		objectMode: true,
	});

	this._service = service;
	this._url = url;
	this._query = query;
	this._position = query.before || query.after || null;
	this._limit = end;

	this._size = 0;
	this._busy = false;
}

ServiceStream.prototype = Object.create(stream.Readable.prototype);

assign(ServiceStream.prototype, {
	_read: function( batchSize ){
		if (this._busy)
			return;

		this._busy = true;

		fetch(this, batchSize);
	},
});

function fetch( stream, batchSize ){
	var query = assign({}, stream._query, {
		limit: stream._limit ? Math.min(batchSize, stream._limit - stream._size) : batchSize,
	});

	if (stream._position) {
		if (query.after)
			query.after = stream._position;
		else
			query.before = stream._position;
	}

	return stream._service.request('GET', stream._url, query).then(function( data ){
		var length = data.length;
		var thirsty = false;

		for (var i = 0;i < length;i++)
			thirsty = stream.push(data[i]);

		stream._size += length;

		if (length < batchSize || stream._size === stream._limit) {
			stream.push(null);

			if (stream._size !== stream._limit)
				stream.emit('exhausted');

			return;
		}

		stream._position = data[length - 1].id;

		if (thirsty)
			return fetch(stream, batchSize);

		stream._busy = false;
	}, function( err ){
		stream.emit('error', err);
	});
}

function isDefined( f ){
	return f !== undefined && f !== null;
}
