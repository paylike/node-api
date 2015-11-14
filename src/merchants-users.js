'use strict';

var assign = require('object-assign');

module.exports = Users;

function Users( service ){
	this.service = service;
}

assign(Users.prototype, {
	// https://github.com/paylike/api-docs#invite-user-to-a-merchant
	add: function( merchantPk, opts, cb ){
		return this.service.request('POST', '/merchants/'+merchantPk+'/invite', opts)
			.return()
			.nodeify(cb);
	},

	// https://github.com/paylike/api-docs#revoke-user-from-a-merchant
	revoke: function( merchantPk, userPk, cb ){
		return this.service.request('DELETE', '/merchants/'+merchantPk+'/users/'+userPk)
			.return()
			.nodeify(cb);
	},

	// https://github.com/paylike/api-docs#fetch-all-users-on-a-merchant
	find: function( merchantPk, cb ){
		return new this.service.Cursor(this.service,
			'/merchants/'+merchantPk+'/users', 'users');
	},
});
