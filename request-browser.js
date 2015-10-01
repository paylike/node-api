'use strict';

var Promise = require('bluebird');
var serialize = require('qs/lib/stringify');

module.exports = xhr;

xhr.HttpError = HttpError;

var withoutBody = [ 'GET', 'DELETE' ];

function xhr( verb, url, query, headers, cb ){
	var r = new XMLHttpRequest();

	return new Promise(function( rs, rj ){
		r.open(verb, url + querify(~withoutBody.indexOf(verb) && query), true /* async*/);

		r.addEventListener('readystatechange', function(){
			if (r.readyState !== 4)
				return;

			var status;
			var body;

			try { status = r.status } catch(e) { status = 0; }
			try { body = JSON.parse(r.responseText) } catch(e) { body = {}; };

			var ok = status && (status / 100 | 0) === 2;


			if (!ok)
				rj(new HttpError(status, r.statusText || 'Connection trouble', body));
			else
				rs(body);
		});

		if (verb !== 'GET' && query)
			r.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

		if (headers)
			Object.keys(headers).forEach(function( key ){
				r.setRequestHeader(key, headers[key]);
			});

		r.send(verb !== 'GET' && query && serialize(query));
	})
		.cancellable()
		.catch(Promise.CancellationError, function( e ){
			r.abort();

			throw e;
		});
}

function querify( data ){
	return data
		? '?' + serialize(data)
		: '';
}

function HttpError( code, message ){
	this.code = code;
	this.message = message;
}

HttpError.prototype = Object.create(Error.prototype);
