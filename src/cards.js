'use strict';

var assign = require('object-assign');

module.exports = Cards;

function Cards( service ){
	this.service = service;
}

assign(Cards.prototype, {
	// https://github.com/paylike/api-docs#save-a-card
	create: function( merchantPk, opts, cb ){
		return this.service.request('POST', '/merchants/'+merchantPk+'/cards', {
			transactionPk: opts.transactionPk,
			notes: opts.notes,
		})
			.get('card')
			.get('pk')
			.nodeify(cb);
	},
})
