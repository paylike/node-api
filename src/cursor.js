'use strict';

var Promise = require('bluebird');
var assign = require('object-assign');
var stream = require('readable-stream');

module.exports = Cursor;

function Cursor( service, url, name, batchSize ){
	stream.Readable.call(this, {
		readableObjectMode: true,
	});

	this._skip = 0;
	this._limit = null;
	this._sort = null;
	this._filter = null;

	this._service = service;
	this._url = url;
	this._name = name;
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

	stream: function(){
		return new ServiceStream(this._service, this._url, assign(this._filter || {}, {
			sort: this._sort,
		}), this._skip, this._limit
			? this._skip + this._limit
			: 0
		, this._streamBatchSize, this._name);
	},

	toArray: function(){
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
		});
	},
});

function ServiceStream( service, url, query, start, end, batchSize, name ){
	stream.Readable.call(this, {
		objectMode: true,
	});

	this._service = service;
	this._url = url;
	this._query = query;
	this._position = start || 0;
	this._size = end;
	this._name = name;
	this.batchSize = batchSize || 50;

	this._exhausted = false;
	this._busy = false;
}

ServiceStream.prototype = Object.create(stream.Readable.prototype);

assign(ServiceStream.prototype, {
	_read: function( n ){
		if (this._busy || this._exhausted)
			return;

		this._busy = true;

		this.fetch();
	},

	fetch: function(){
		var that = this;

		this._service.request('GET', this._url, assign({}, this._query, {
			skip: this._position,
			limit: this._size ? Math.min(this.batchSize, this._size - this._position) : this.batchSize,
		})).then(function( r ){
			var data = r[that._name];
			var length = data.length;
			var thirsty = false;

			for (var i = 0;i < length;i++)
				thirsty = that.push(data[i]);

			that._position += data.length;

			if (length < that.batchSize || that._position === that._size) {
				that._exhausted = true;
				that.push(null);
			} else if (thirsty) {
				that.fetch();
			}
		}, function( err ){
			that.emit('error', err);
		});
	},
});
