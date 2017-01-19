'use strict';

var assign = require('object-assign');

module.exports = Apps;

function Apps( service ){
	this.service = service;
}

assign(Apps.prototype, {
	// https://github.com/paylike/api-docs#add-app-to-a-merchant
	add: function( merchantId, opts, cb ){
		return this.service.request('POST', '/merchants/'+merchantId+'/apps', opts)
			.return()
			.nodeify(cb);
	},

	// https://github.com/paylike/api-docs#revoke-app-from-a-merchant
	revoke: function( merchantId, appId, cb ){
		return this.service.request('DELETE', '/merchants/'+merchantId+'/apps/'+appId)
			.return()
			.nodeify(cb);
	},

	// https://github.com/paylike/api-docs#fetch-all-apps-on-a-merchant
	find: function( merchantId ){
		return new this.service.Cursor(this.service, '/merchants/'+merchantId+'/apps');
	},
});
