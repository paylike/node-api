'use strict';

var assign = require('object-assign');
var filter = require('object-filter');
var btoa = require('btoa-lite');

var request = require('./request');
var Cursor = require('./cursor');

module.exports = Paylike;

function Paylike( key, opts ){
	if (!(this instanceof Paylike))
		return new Paylike(key, opts);

	this.key = key;
	this.url = opts && opts.api || 'https://midgard.paylike.io';
}

assign(Paylike.prototype, {
	Cursor: Cursor,
	Error: PaylikeError,
	AuthorizationError: AuthorizationError,
	PermissionsError: PermissionsError,
	NotFoundError: NotFoundError,
	ValidationError: ValidationError,

	// https://github.com/paylike/api-docs#fetch-current-app
	findApp: function( cb ){
		return this.request('GET', '/me')
			.then(getIdentity)
			.nodeify(cb);
	},

	// https://github.com/paylike/api-docs#create-a-merchant
	createMerchant: function( opts, cb ){
		return this.request('POST', '/merchants', opts && filter(opts, isDefined))
			.then(getMerchantPk)
			.nodeify(cb);
	},

	// https://github.com/paylike/api-docs#invite-user-to-a-merchant
	invite: function( merchantPk, email, cb ){
		return this.request('POST', '/merchants/'+merchantPk+'/invite', {
			email: email,
		})
			.then(returnNothing)
			.nodeify(cb);
	},

	// https://github.com/paylike/api-docs#fetch-all-merchants
	findMerchants: function( identityPk ){
		return new Cursor(this, identityPk
			? '/identities/'+identityPk+'/merchants'
			: '/merchants'
		, 'merchants');
	},

	//  https://github.com/paylike/api-docs#fetch-a-merchant
	findMerchant: function( merchantPk, cb ){
		return this.request('GET', '/merchants/'+merchantPk)
			.then(getMerchant)
			.nodeify(cb);
	},

	// https://github.com/paylike/api-docs#create-a-transaction
	createTransaction: function( merchantPk, opts, cb ){
		if (opts && !opts.cardPk && !opts.transactionPk)
			throw new Error('Missing either a card pk or a transaction pk');

		return this.request('POST', '/merchants/'+merchantPk+'/transactions', opts && filter(opts, isDefined))
			.then(getTransactionPk)
			.nodeify(cb);
	},

	// https://github.com/paylike/api-docs#capture-a-transaction
	capture: function( transactionPk, opts, cb ){
		return this.request('POST', '/transactions/'+transactionPk+'/captures', filter({
			amount: opts.amount,
			currency: opts.currency,
			descriptor: opts.descriptor,
		}, isDefined))
			.then(returnNothing)
			.nodeify(cb);
	},

	// https://github.com/paylike/api-docs#refund-a-transaction
	refund: function( transactionPk, opts, cb ){
		return this.request('POST', '/transactions/'+transactionPk+'/refunds', filter({
			amount: opts.amount,
			descriptor: opts.descriptor,
		}, isDefined))
			.then(returnNothing)
			.nodeify(cb);
	},

	// https://github.com/paylike/api-docs#void-a-transaction
	void: function( transactionPk, opts, cb ){
		return this.request('POST', '/transactions/'+transactionPk+'/refunds', filter({
			amount: opts.amount,
		}, isDefined))
			.then(returnNothing)
			.nodeify(cb);
	},

	// https://github.com/paylike/api-docs#fetch-all-transactions
	findTransactions: function( merchantPk ){
		return new Cursor(this, merchantPk
			? '/merchants/'+merchantPk+'/transactions'
			: '/transactions'
		, 'transactions');
	},

	// https://github.com/paylike/api-docs#fetch-a-transaction
	findTransaction: function( transactionPk, cb ){
		return this.request('GET', '/transactions/'+transactionPk)
			.then(getTransaction)
			.nodeify(cb);
	},

	// https://github.com/paylike/api-docs#save-a-card
	saveCard: function( merchantPk, opts, cb ){
		return this.request('POST', '/merchants/'+merchantPk+'/cards', filter({
			transactionPk: opts.transactionPk,
			notes: opts.notes,
		}, isDefined))
			.then(getCardPk)
			.nodeify(cb);
	},

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

function isDefined( x ){
	return x !== undefined;
}

function getIdentity( o ){
	return o.identity;
}

function getMerchantPk( o ){
	return o.merchant.pk;
}

function getMerchant( o ){
	return o.merchant;
}

function getTransaction( o ){
	return o.transaction;
}

function getTransactionPk( o ){
	return o.transaction.pk;
}

function getCardPk( o ){
	return o.card.pk;
}

function returnNothing(){
	return;
}


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
