'use strict';

var Promise = require('bluebird');
var serialize = require('qs/lib/stringify');

var responses = require('./request-responses');

xhr.response = responses;

var responseMap = {
	1: responses.Error,
	2: responses.Success,
	3: responses.Error,
	4: responses.ClientError,
	5: responses.ServerError,
};

module.exports = xhr;

var withoutBody = [ 'GET', 'DELETE' ];

function xhr( verb, url, query, headers ){
	return new Promise(function( rs, rj ){
		var r = new XMLHttpRequest();

		var isWithoutBody = ~withoutBody.indexOf(verb);

		r.open(verb, url + querify(isWithoutBody && query));

		r.addEventListener('readystatechange', function(){
			if (r.readyState !== 4)
				return;

			var code;
			var message;
			var body;

			try { code = r.status } catch(e) { code = 0; }
			try { body = JSON.parse(r.responseText) } catch(e) { body = {}; }
			try { message = r.statusText } catch(e) { message = ''; }

			var statusIdentifier = code && (code / 100 | 0);

			var responseType = responseMap[statusIdentifier] || responses.Error;

			var response = new responseType(
				code,
				message || 'Connection trouble',
				null,
				body
			);

			if (statusIdentifier === 2)
				rs(response);
			else
				rj(response);
		});

		if (!~withoutBody.indexOf(verb) && query)
			r.setRequestHeader('Content-Type', 'application/json');

		if (headers)
			Object.keys(headers).forEach(function( key ){
				r.setRequestHeader(key, headers[key]);
			});

		r.send(!isWithoutBody && query && JSON.stringify(query));
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
