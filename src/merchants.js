'use strict';

var assign = require('object-assign');

var Apps = require('./merchants-apps');
var Users = require('./merchants-users');
var Lines = require('./merchants-lines');
var Transactions = require('./merchants-transactions');

module.exports = Merchants;

function Merchants( service ){
	this.service = service;

	this.apps = new Apps(service);
	this.users = new Users(service);
	this.lines = new Lines(service);
	this.transactions = new Transactions(service);
}

assign(Merchants.prototype, {
	// https://github.com/paylike/api-docs#create-a-merchant
	create: function( opts, cb ){
		return this.service.request('POST', '/merchants', opts)
			.get('merchant')
			.get('pk')
			.nodeify(cb);
	},

	// https://github.com/paylike/api-docs#update-a-merchant
	update: function( merchantPk, opts, cb ){
		return this.service.request('PUT', '/merchants/'+merchantPk, opts)
			.return()
			.nodeify(cb);
	},

	//  https://github.com/paylike/api-docs#fetch-a-merchant
	findOne: function( merchantPk, cb ){
		return this.service.request('GET', '/merchants/'+merchantPk)
			.get('merchant')
			.nodeify(cb);
	},
});
