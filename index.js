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
	this.api = opts.api || 'https://midgard.paylike.io';
}

assign(Paylike.prototype, {
	HttpError: request.HttpError,

	// https://github.com/paylike/api-docs#fetch-current-app
	findApp: function( appPk ){
		return this.request('GET', appPk
			? '/identities/'+appPk
			: '/me'
		).then(getIdentity);
	},

	// https://github.com/paylike/api-docs#create-a-merchant
	createMerchant: function( opts ){
		return this.request('POST', '/merchants', filter(opts, isDefined)).then(getMerchantPk);
	},

	// https://github.com/paylike/api-docs#invite-user-to-a-merchant
	invite: function( merchantPk, email ){
		return this.request('POST', '/merchants/'+merchantPk+'/invite', {
			email: email,
		}).then(returnNothing);
	},

	// https://github.com/paylike/api-docs#fetch-all-merchants
	findMerchants: function( identityPk ){
		return new Cursor(this, identityPk
			? '/identities/'+identityPk+'/merchants'
			: '/merchants'
		, 'merchants');
	},

	//  https://github.com/paylike/api-docs#fetch-a-merchant
	findMerchant: function( merchantPk ){
		return this.request('GET', '/merchants/'+merchantPk).then(getMerchant);
	},

	// https://github.com/paylike/api-docs#create-a-transaction
	createTransaction: function( merchantPk, opts ){
		if (!opts.cardPk && !opts.transactionPk)
			throw new Error('Missing either a card pk or a transaction pk');

		return this.request('POST', '/merchants/'+merchantPk+'/transactions', filter(opts, isDefined)).then(getTransactionPk);
	},

	// https://github.com/paylike/api-docs#capture-a-transaction
	capture: function( transactionPk, amount, opts ){
		return this.request('POST', '/transactions/'+transactionPk+'/captures', filter({
			amount: amount,
			currency: opts.currency,
			descriptor: opts.descriptor,
		}, isDefined)).then(returnNothing);
	},

	// https://github.com/paylike/api-docs#refund-a-transaction
	refund: function( transactionPk, amount, opts ){
		return this.request('POST', '/transactions/'+transactionPk+'/refunds', filter({
			amount: amount,
			descriptor: opts.descriptor,
		}, isDefined)).then(returnNothing);
	},

	// https://github.com/paylike/api-docs#void-a-transaction
	void: function( transactionPk, amount ){
		return this.request('POST', '/transactions/'+transactionPk+'/refunds', filter({
			amount: amount,
		}, isDefined)).then(returnNothing);
	},

	// https://github.com/paylike/api-docs#fetch-all-transactions
	findTransactions: function( merchantPk ){
		return new Cursor(this, merchantPk
			? '/merchants/'+merchantPk+'/transactions'
			: '/transactions'
		, 'transactions');
	},

	// https://github.com/paylike/api-docs#fetch-a-transaction
	findTransaction: function( transactionPk ){
		return this.request('GET', '/transactions/'+transactionPk).then(getTransaction);
	},

	// https://github.com/paylike/api-docs#save-a-card
	saveCard: function( merchantPk, transactionPk, opts ){
		return this.request('POST', '/merchants/'+merchantPk+'/cards', filter({
			transactionPk: opts.transactionPk,
			notes: opts.notes,
		}, isDefined)).then(getCardPk);
	},

	request: function( verb, path, query ){
		return request(verb, this.url+path, query, {
			'Authorization': 'Basic ' + btoa(':'+this.key),
		});
	},
});

function isDefined( x ){
	return x !== undefined;
}

function getIdentity( o ){
	retrun o.identity;
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
