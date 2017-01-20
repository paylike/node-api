'use strict';

var assign = require('object-assign');
var btoa = require('btoa-lite');
var fetch = require('fetch-one');

var Cursor = require('./cursor');

var Transactions = require('./transactions');
var Merchants = require('./merchants');
var Cards = require('./cards');
var Apps = require('./apps');

module.exports = Paylike;

function Paylike( key, opts ){
	if (!(this instanceof Paylike))
		return new Paylike(key, opts);

	var service = this.service = new Service({
		url: opts && opts.url,
		key: key || (opts && opts.key),
	});

	this.transactions = new Transactions(service);
	this.merchants = new Merchants(service);
	this.cards = new Cards(service);
	this.apps = new Apps(service);
}

var errors = {
	Error: PaylikeError,
	AuthorizationError: AuthorizationError,
	PermissionsError: PermissionsError,
	NotFoundError: NotFoundError,
	ConflictError: ConflictError,
	ValidationError: ValidationError,
};

assign(Paylike, errors, {
	Transactions: Transactions,
	Merchants: Merchants,
	Cards: Cards,
	Apps: Apps,
	Cursor: Cursor,

	Service: Service,
});

assign(Paylike.prototype, errors, {
	setKey: function( key ){
		this.service.key = key;
	},
});

function Service( opts ){
	this.url = opts.url || 'https://api.paylike.io';
	this.key = opts.key;
	this.agent = opts.agent || 'Node 1.1.0';
}

assign(Service.prototype, {
	Cursor: Cursor,

	request: function( verb, path, query, cb ){
		return fetch(verb, this.url+path, query, {
			'Authorization': 'Basic ' + btoa(':'+this.key),
			'X-Client': this.agent,
		})
			.catch(fetch.response.ClientError, function( e ){
				if (e.code === 401)
					throw new AuthorizationError(e.message);

				if (e.code === 403)
					throw new PermissionsError(e.message);

				if (e.code === 404)
					throw new NotFoundError(e.message);

				if (e.code === 400)
					throw new ValidationError(e.message, e.body);

				if (e.code === 409)
					throw new ConflictError(e.message);

				throw e;
			})
			.catch(fetch.response.Error, function( e ){
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

function ConflictError( message ){ this.message = message; }
ConflictError.prototype = Object.create(PaylikeError.prototype);

function ValidationError( message, data ){
	this.message = message;
	this.data = data;
}

ValidationError.prototype = Object.create(PaylikeError.prototype);
