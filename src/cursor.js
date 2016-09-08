'use strict';

var assign = require('object-assign');
var collect = require('pull-stream/sinks/collect');
var pull = require('pull-stream/pull');
var filter = require('object-filter');
var objectIdFromDate = require('date-to-object-id-hex');

module.exports = Cursor;

function Cursor( service, url, batchSize ){
	this._limit = null;
	this._sort = null;
	this._filter = null;
	this._before = null;
	this._after = null;
	this._keepAlive = false;
	this._delay = 5000;
	this._batchSize = batchSize || 50;

	this._service = service;
	this._url = url;

	var cursor = this;

	var size = 0;

	var batch;
	var batchLength = 0;
	var batchIdx = 0;

	this.source = read;

	function read( abort, cb ){
		if (abort)
			return cb && cb(abort);

		if (batchIdx < batchLength)
			return cb(null, batch[batchIdx++]);

		var ask = cursor._limit
			? Math.min(cursor._batchSize, cursor._limit - size)
			: cursor._batchSize;

		if (ask === 0 || (!cursor._keepAlive && batch !== undefined && batchLength < cursor._batchSize))
			return cb(true);

		var query = filter({
			before: cursor._before,
			after: cursor._after,
			sort: cursor._sort,
			filter: cursor._filter,
			limit: ask,
		}, isDefined);

		if (batchLength !== 0) {
			if (query.after && !query.before) {
				query.after = batch[batchLength - 1].id;
			} else {
				query.before = batch[batchLength - 1].id;
			}
		}

		service.request('GET', url, query).then(function( data ){
			if (cursor._keepAlive && data.length === 0)
				return setTimeout(function(){
					read(null, cb);
				}, cursor._delay);

			batch = data;
			batchLength = data.length;
			batchIdx = 0;

			size += batchLength;

			return read(null, cb);
		}, cb);
	}
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

	until: function( date ){
		this._before = date && objectIdFromDate(date);

		return this;
	},

	since: function( date ){
		this._after = date && objectIdFromDate(date);

		return this;
	},

	batchSize: function( batchSize ){
		this._batchSize = batchSize;

		return this;
	},

	keepAlive: function( delay ){
		if (Number.isInteger(delay))
			this._delay = delay;

		this._keepAlive = !!delay;

		return this;
	},

	pull: function(){
		var pipes = new Array(arguments.length);

		for (var i = 0;i < pipes.length;i++)
			pipes[i] = arguments[i];

		pipes.unshift(this.source);

		return pull.apply(null, pipes);
	},

	toArray: function( cb ){
		var source = this.source;

		if (cb)
			return collect(cb)(source);

		return new Promise(function( rslv, rjct ){
			collect(function( err, items ){
				if (err)
					return rjct(err);

				rslv(items);
			})(source);
		});
	},
});

function isDefined( f ){
	return f !== undefined && f !== null;
}
