'use strict';

var assign = require('object-assign');

module.exports = Transactions;

function Transactions( service ){
	this.service = service;
}

assign(Transactions.prototype, {
	// https://github.com/paylike/api-docs#create-a-transaction
	create: function( merchantPk, opts, cb ){
		if (!opts || (!opts.cardPk && !opts.transactionPk))
			throw new Error('Missing either a card pk or a transaction pk');

		return this.service.request('POST', '/merchants/'+merchantPk+'/transactions', {
				transactionPk: opts.transactionPk,
				cardPk: !opts.transactionPk && opts.cardPk,

				descriptor: opts.descriptor,
				currency: opts.currency,
				amount: opts.amount,
				custom: opts.custom,
			})
			.get('transaction')
			.get('pk')
			.nodeify(cb);
	},

	// https://github.com/paylike/api-docs#fetch-all-transactions
	find: function( merchantPk ){
		return new this.service.Cursor(this.service, '/merchants/'+merchantPk+'/transactions', 'transactions');
	},
});
