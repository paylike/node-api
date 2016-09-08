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

function ServiceStream( service, url, query, end, batchSize, delay ){
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
	this._delay = delay || 5000;
}

ServiceStream.prototype = Object.create(stream.Readable.prototype);

assign(ServiceStream.prototype, {
	_read: function( batchSize ){
		if (this._busy)
			return;

		this._busy = true;

		fetch(this, batchSize);
	},

	keepAlive: function( delay ){
		this._keepAlive = !!delay;

		if (typeof delay === 'number')
			this._delay = delay

		return this;
	},
});

function fetch( stream, batchSize ){
	var askSize = stream._limit
		? Math.min(batchSize, stream._limit - stream._size)
		: batchSize;

	var query = assign({}, stream._query, {
		limit: askSize,
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

		if (length !== 0) {
			for (var i = 0;i < length;i++)
				thirsty = stream.push(data[i]);

			stream._size += length;
			stream._position = data[length - 1].id;
		} else {
			thirsty = true;
		}

		var exhausted = length < askSize;
		var full = stream._size === stream._limit;

		if (thirsty && !full && !exhausted)
			return fetch(stream, batchSize);

		if (!stream._keepAlive && (exhausted || full))
			stream.push(null);

		if (exhausted)
			stream.emit('exhausted');

		if (thirsty && !full && stream._keepAlive)
			return Promise
				.delay(stream._delay)
				.then(function(){
					return fetch(stream, batchSize);
				});

		stream._busy = false;
	}, function( err ){
		stream.emit('error', err);
	});
}

function isDefined( f ){
	return f !== undefined && f !== null;
}
