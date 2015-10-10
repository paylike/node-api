'use strict';

var assign = require('object-assign');

module.exports = Merchants;

function Merchants( service ){
	this.service = service;
}

assign(Merchants.prototype, {
	// https://github.com/paylike/api-docs#create-a-merchant
	create: function( opts, cb ){
		return this.service.request('POST', '/merchants', opts)
			.get('merchant')
			.get('pk')
			.nodeify(cb);
	},

	// https://github.com/paylike/api-docs#invite-user-to-a-merchant
	invite: function( merchantPk, email, cb ){
		return this.service.request('POST', '/merchants/'+merchantPk+'/invite', {
			email: email,
		})
			.return()
			.nodeify(cb);
	},

	// https://github.com/paylike/api-docs#fetch-all-merchants
	find: function( identityPk ){
		return new this.service.Cursor(this.service, identityPk
			? '/identities/'+identityPk+'/merchants'
			: '/merchants'
		, 'merchants');
	},

	//  https://github.com/paylike/api-docs#fetch-a-merchant
	findOne: function( merchantPk, cb ){
		return this.service.request('GET', '/merchants/'+merchantPk)
			.get('merchant')
			.nodeify(cb);
	},
});
