'use strict';

var Promise = require('bluebird');
var request = Promise.promisify(require('request'));

var responses = require('./request-responses');

xhr.response = responses;

var responseMap = {
	1: responses.Error,
	2: responses.Success,
	3: responses.Error,
	4: responses.ClientError,
	5: responses.ServerError,
};

var withoutBody = [ 'GET', 'DELETE' ];

module.exports = xhr;

function xhr( verb, url, query, headers ){
	return request({
		method: verb,
		url: url,
		qs: ~withoutBody.indexOf(verb) && query,
		headers: headers,
		body: !~withoutBody.indexOf(verb) && query || undefined,
		gzip: true,
		json: true,
	})
		.spread(function( httpResponse, body ){
			var code = httpResponse.statusCode;
			var statusIdentifier = code && (code / 100 | 0);

			var responseType = responseMap[statusIdentifier] || responses.Error;

			var response = new responseType(
				code,
				httpResponse.statusMessage || 'Connection trouble',
				httpResponse.headers,
				body
			);

			if (statusIdentifier === 2)
				return response;

			throw response;
		})
		.cancellable();
}
