'use strict';

var Promise = require('bluebird');
var request = require('request');
var btoa = require('btoa-lite');

var response = require('./request-responses');

xhr.response = response;

var responseMap = {
	1: response.Error,
	2: response.Success,
	3: response.Error,
	4: response.ClientError,
	5: response.ServerError,
};

var withoutBody = [ 'GET', 'DELETE' ];

module.exports = xhr;

function xhr( verb, url, query, headers, cb ){
	return new Promise(function( rs, rj ){
		request({
			method: verb,
			url: url,
			qs: ~withoutBody.indexOf(verb) && query,
			headers: headers,
			body: !~withoutBody.indexOf(verb) && query || undefined,
			gzip: true,
			json: true,
		}, function( err, httpResponse, body ){
			if (err)
				return rj(err);

			var code = httpResponse.statusCode;
			var statusIdentifier = code && (code / 100 | 0);

			var responseType = responseMap[statusIdentifier] || response.Error;

			var response = new responseType(
				code,
				httpResponse.statusMessage || 'Connection trouble',
				httpResponse.headers,
				body
			);

			if (statusIdentifier === 2)
				rs(response);
			else
				rj(response);
		});
	})
		.cancellable();
}
