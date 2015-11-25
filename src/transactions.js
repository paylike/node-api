'use strict';

var assign = require('object-assign');

module.exports = Transactions;

function Transactions( service ){
	this.service = service;
}

assign(Transactions.prototype, {
	// https://github.com/paylike/api-docs#capture-a-transaction
	capture: function( transactionPk, opts, cb ){
		return this.service.request('POST', '/transactions/'+transactionPk+'/captures', {
			amount: opts.amount,
			currency: opts.currency,
			descriptor: opts.descriptor,
		})
			.return()
			.nodeify(cb);
	},

	// https://github.com/paylike/api-docs#refund-a-transaction
	refund: function( transactionPk, opts, cb ){
		return this.service.request('POST', '/transactions/'+transactionPk+'/refunds', {
			amount: opts.amount,
			descriptor: opts.descriptor,
		})
			.return()
			.nodeify(cb);
	},

	// https://github.com/paylike/api-docs#void-a-transaction
	void: function( transactionPk, opts, cb ){
		return this.service.request('POST', '/transactions/'+transactionPk+'/voids', {
			amount: opts.amount,
		})
			.return()
			.nodeify(cb);
	},

	// https://github.com/paylike/api-docs#fetch-a-transaction
	findOne: function( transactionPk, cb ){
		return this.service.request('GET', '/transactions/'+transactionPk)
			.get('transaction')
			.nodeify(cb);
	},
});
