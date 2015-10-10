'use strict';

var assign = require('object-assign');
var btoa = require('btoa-lite');

var request = require('./request');
var Cursor = require('./cursor');

var Transactions = require('./transactions');
var Merchants = require('./merchants');

module.exports = Paylike;

function Paylike( key, opts ){
	if (!(this instanceof Paylike))
		return new Paylike(key, opts);

	this.service = new Service(opts && opts.api || 'https://midgard.paylike.io', key || (opts && opts.key));

	this.transactions = new Transactions(this.service);
	this.merchants = new Merchants(this.service);
}

var errors = {
	Error: PaylikeError,
	AuthorizationError: AuthorizationError,
	PermissionsError: PermissionsError,
	NotFoundError: NotFoundError,
	ValidationError: ValidationError,
};

assign(Paylike, errors);
assign(Paylike.prototype, errors);

assign(Paylike.prototype, {
	// https://github.com/paylike/api-docs#fetch-current-app
	findApp: function( cb ){
		return this.service.request('GET', '/me')
			.then(getIdentity)
			.nodeify(cb);
	},

	// https://github.com/paylike/api-docs#save-a-card
	saveCard: function( merchantPk, opts, cb ){
		return this.service.request('POST', '/merchants/'+merchantPk+'/cards', {
			transactionPk: opts.transactionPk,
			notes: opts.notes,
		})
			.then(getCardPk)
			.nodeify(cb);
	},
});

function getIdentity( o ){
	return o.identity;
}

function getCardPk( o ){
	return o.card.pk;
}

function Service( url, key ){
	this.url = url;
	this.key = key;
}

assign(Service.prototype, {
	Cursor: Cursor,

	request: function( verb, path, query, cb ){
		return request(verb, this.url+path, query, {
			'Authorization': 'Basic ' + btoa(':'+this.key),
		})
			.catch(request.response.ClientError, function( e ){
				if (e.code === 401)
					throw new AuthorizationError(e.message);

				if (e.code === 403)
					throw new PermissionsError(e.message);

				if (e.code === 404)
					throw new NotFoundError(e.message);

				if (e.code === 400)
					throw new ValidationError(e.message, e.body);

				throw e;
			})
			.catch(request.response.Error, function( e ){
				throw new PaylikeError(e.message);
			})
			.get('body')
			.nodeify(cb);
	},
});

function PaylikeError( message ){
	this.message = message;
}

PaylikeError.prototype = Object.create(Error.prototype);
PaylikeError.prototype.toString = function(){ return this.message; };

function AuthorizationError( message ){ this.message = message; }
AuthorizationError.prototype = Object.create(PaylikeError.prototype);

function PermissionsError( message ){ this.message = message; }
PermissionsError.prototype = Object.create(PaylikeError.prototype);

function NotFoundError( message ){ this.message = message; }
NotFoundError.prototype = Object.create(PaylikeError.prototype);

function ValidationError( message, data ){
	this.message = message;
	this.data = data;
}

ValidationError.prototype = Object.create(PaylikeError.prototype);
