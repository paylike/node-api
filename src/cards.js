'use strict';

var assign = require('object-assign');

module.exports = Cards;

function Cards( service ){
	this.service = service;
}

assign(Cards.prototype, {
	// https://github.com/paylike/api-docs#save-a-card
	create: function( merchantId, opts, cb ){
		return this.service.request('POST', '/merchants/'+merchantId+'/cards', {
			transactionId: opts.transactionId,
			notes: opts.notes,
		})
			.get('card')
			.get('id')
			.nodeify(cb);
	},

	// https://github.com/paylike/api-docs#fetch-a-card
	findOne: function( cardId, cb ){
		return this.service.request('GET', '/cards/'+cardId)
			.get('card')
			.nodeify(cb);
	},
})
