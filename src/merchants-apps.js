'use strict';

var assign = require('object-assign');

module.exports = Apps;

function Apps( service ){
	this.service = service;
}

assign(Apps.prototype, {
	// https://github.com/paylike/api-docs#add-app-to-a-merchant
	add: function( merchantPk, opts, cb ){
		return this.service.request('POST', '/merchants/'+merchantPk+'/apps', opts)
			.return()
			.nodeify(cb);
	},

	// https://github.com/paylike/api-docs#revoke-app-from-a-merchant
	revoke: function( merchantPk, appPk, cb ){
		return this.service.request('DELETE', '/merchants/'+merchantPk+'/apps/'+appPk)
			.return()
			.nodeify(cb);
	},

	// https://github.com/paylike/api-docs#fetch-all-apps-on-a-merchant
	find: function( merchantPk, cb ){
		return new this.service.Cursor(this.service,
			'/merchants/'+merchantPk+'/apps', 'apps');
	},
});
