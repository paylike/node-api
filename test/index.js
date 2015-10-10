'use strict';

var Promise = require('bluebird');
var test = require('tape');

var paylike = require('../')('4ff7de37-dddf-4e51-8cc9-48b61a102923');

var appPk = '555eca95ed59804d2cf12b11';
var merchantPk = '55006bdfe0308c4cbfdbd0e1';
var transactionPk = '560fd96b7973ff3d2362a78c';

var merchantAttributes = {
	company: {
		country: 'DK',
	},
	currency: 'DKK',
	email: 'john@example.com',
	website: 'https://example.com',
	descriptor: 'Coffee & John',
	test: true,
};

test('find app', function( t ){
	t.plan(1);

	paylike
		.findApp()
		.tap(function( app ){
			t.ok(app.pk, 'app pk');
		});
});

test('create a merchant', function( t ){
	t.test('validation error', function( t ){
		t.plan(2);

		paylike
			.createMerchant()
			.tap(function(){
				t.fail();
			})
			.catch(paylike.ValidationError, function( e ){
				t.ok(e.message, 'message');
				t.ok(Array.isArray(e.data), 'array of data');
			});
	});

	t.test(function( t ){
		t.plan(1);

		paylike
			.createMerchant(merchantAttributes)
			.tap(function( pk ){
				t.equal(typeof pk, 'string', 'merchant pk');
			});
	});
});

test('invite to merchant', function( t ){
	t.plan(1);

	var merchantPk = paylike.createMerchant(merchantAttributes);

	merchantPk
		.then(function( merchantPk ){
			return paylike.invite(merchantPk, 'john@example.com');
		})
		.then(function( r ){
			t.equal(typeof r, 'undefined', 'returned value when inviting');
		})
		.catch(function(){
			t.fail('should not throw');
		});
});

test('find merchants', function( t ){
	t.plan(3);

	var cursor = paylike.findMerchants(appPk);

	var all = cursor
		.limit(10)
		.toArray();

	all.then(function( merchants ){
		t.ok(Array.isArray(merchants), 'toArray gives an array');
	});

	var selection = paylike
		.findMerchants(appPk)
		.filter({ test: true })
		.skip(2)
		.limit(2)
		.toArray();

	Promise
		.join(all, selection)
		.spread(function( merchants, selection ){
			t.equal(selection.length, 2);

			t.deepEqual(selection, merchants.splice(2, 2));
		});
});

test('transactions', function( t ){
	var transactions = paylike.transactions;

	t.test('find one', function( t ){
		t.plan(2);

		transactions
			.findOne(transactionPk)
			.then(function( transaction ){
				t.equal(transaction.pk, transactionPk, 'primary key');
				t.ok(Array.isArray(transaction.trail), 'trail is an array')
			});
	});

	t.test('find', function( t ){
		t.plan(2);

		transactions
			.find(merchantPk)
			.limit(3)
			.toArray()
			.tap(function( transactions ){
				t.equal(transactions.length, 3, 'count');
				t.ok(transactions[0].pk, 'a primary key is returned');
			});
	});

	t.test('create', function( t ){
		t.plan(1)

		transactions
			.create(merchantPk, {
				transactionPk: transactionPk,
				currency: 'EUR',
				amount: 200,
				custom: { source: 'node client test' },
			})
			.then(function( pk ){
				t.equal(typeof pk, 'string', 'returned primary key');
			})
			.catch(function(){
				t.fail();
			});
	});

	t.test('capture', function( t ){
		t.plan(6);

		var newTransactionPk = transactions.create(merchantPk, {
			transactionPk: transactionPk,
			currency: 'EUR',
			amount: 300,
			custom: { source: 'node client test' },
		});

		var capture = newTransactionPk
			.then(function( transactionPk ){
				return transactions.capture(transactionPk, {
					currency: 'EUR',
					amount: 100,
				});
			})
			.tap(function( r ){
				t.equal(typeof r, 'undefined', 'returned value');
			})
			.catch(function(){
				t.fail();
			});

		Promise
			.join(newTransactionPk, capture)
			.spread(function( transactionPk ){
				return transactions.findOne(transactionPk);
			})
			.then(function( transaction ){
				t.equal(transaction.capturedAmount, 100, 'captured amount');
				t.equal(transaction.pendingAmount, 200, 'pending amount');
				t.equal(transaction.trail.length, 1, 'length of trail');
				t.equal(transaction.trail[0].capture, true, 'type of trail');
				t.equal(transaction.trail[0].amount, 100, 'amount in capture trail');
			});
	});

	t.test('refund', function( t ){
		t.plan(7);

		var newTransactionPk = transactions.create(merchantPk, {
			transactionPk: transactionPk,
			currency: 'EUR',
			amount: 300,
			custom: { source: 'node client test' },
		});

		var capture = newTransactionPk
			.then(function( transactionPk ){
				return transactions.capture(transactionPk, {
					currency: 'EUR',
					amount: 200,
				});
			});

		var refund = Promise
			.join(newTransactionPk, capture)
			.spread(function( transactionPk ){
				return transactions.refund(transactionPk, {
					amount: 120,
				});
			})
			.tap(function( r ){
				t.equal(typeof r, 'undefined', 'returned value');
			})
			.catch(function(){
				t.fail();
			});

		Promise
			.join(newTransactionPk, refund)
			.spread(function( transactionPk ){
				return transactions.findOne(transactionPk);
			})
			.then(function( transaction ){
				t.equal(transaction.capturedAmount, 200, 'captured amount');
				t.equal(transaction.pendingAmount, 100, 'pending amount');
				t.equal(transaction.refundedAmount, 120, 'refunded amount');
				t.equal(transaction.trail.length, 2, 'length of trail');
				t.equal(transaction.trail[1].refund, true, 'type of trail');
				t.equal(transaction.trail[1].amount, 120, 'amount in refund trail');
			});
	});

	t.test('void', function( t ){
		t.plan(6);

		var newTransactionPk = transactions.create(merchantPk, {
			transactionPk: transactionPk,
			currency: 'EUR',
			amount: 300,
			custom: { source: 'node client test' },
		});

		var voids = newTransactionPk
			.then(function( transactionPk ){
				return transactions.void(transactionPk, {
					amount: 260,
				});
			})
			.tap(function( r ){
				t.equal(typeof r, 'undefined', 'returned value');
			})
			.catch(function(){
				t.fail();
			});

		Promise
			.join(newTransactionPk, voids)
			.spread(function( transactionPk ){
				return transactions.findOne(transactionPk);
			})
			.then(function( transaction ){
				t.equal(transaction.voidedAmount, 260, 'voided amount');
				t.equal(transaction.pendingAmount, 40, 'pending amount');
				t.equal(transaction.trail.length, 1, 'length of trail');
				t.equal(transaction.trail[0].void, true, 'type of trail');
				t.equal(transaction.trail[0].amount, 260, 'amount in refund trail');
			});
	});
});
