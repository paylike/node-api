'use strict';

var Promise = require('bluebird');
var request = require('request');
var btoa = require('btoa-lite');

module.exports = xhr;

xhr.HttpError = HttpError;

var withoutBody = [ 'GET', 'DELETE' ];

function xhr( verb, url, query, headers, cb ){
	return new Promise(function( rs, rj ){
		request({
			method: verb,
			url: url,
			qs: ~withoutBody.indexOf(verb) && query,
			headers: headers,
			form: verb !== 'GET' && query || null,
			gzip: true,
			json: true,
		}, function( err, httpResponse, body ){
			if (err)
				return rj(err);

			var status = httpResponse.statusCode;
			var ok = status && (status / 100 | 0) === 2;

			if (!ok)
				rj(new HttpError(status, httpResponse.statusMessage || 'Connection trouble', body));
			else
				rs(body);
		});
	})
		.cancellable();
}

function HttpError( code, message, body ){
	this.code = code;
	this.message = message;
	this.body = body;
}

HttpError.prototype = Object.create(Error.prototype);
HttpError.prototype.toString = function(){
	return this.code+': '+this.message;
};
