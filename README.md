# Paylike client (Node.js)

With [browserify](https://github.com/substack/node-browserify/) you can use
this library in the browser as well. Be aware that you should not bundle your
private API keys for public websites though.

Writing your own client? Checkout the raw [HTTP service](https://github.com/paylike/api-docs).

## Getting an API key

An API key can be obtained by creating a merchant and adding an app through our [dashboard](https://app.paylike.io). If your app's target audience is third parties, please reach out and we will make your app's API key hidden.

## Install

```shell
npm install paylike --save
```

```js
var paylike = require('paylike')(appKey);
```

## Promises or callbacks (we support both)

All asynchronous methods will return [promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) or accept a callback as the last argument (node style).

The Promise implementation is [Bluebird](https://github.com/petkaantonov/bluebird) and you can utilize all of [their API](https://github.com/petkaantonov/bluebird/blob/master/API.md).

```js
// Promise style
paylike.transactions.capture(transactionPkA, {
	amount: 100,
})
	.then(function(){
		// capture is successfully done
	}, function(){
		// capture failed
	});

// Callback style
paylike.transactions.refund(transactionPkB, {
	amount: 100,
}, function( err ){
	if (err)
		return console.error(err);	// refund failed

	// refund was successful
});
```

## Cursors

All `find` methods return cursors.

A cursor is simply an object wrapping a result of unknown length. It polls the
server in batches as needed.

```js
var cursor = paylike.transactions.find(merchantPk);

// get a promise for an array of 5 items starting after the first 10
cursor.skip(10).limit(5).toArray();

// stream all transactions to a HTTP response
paylike.transactions.find(merchantPk)
	.stream()
	.pipe(JSONStream.stringify())
	.pipe(response);
```

## Error handling

The API will throw errors when things do not fly. All errors inherit from
`PaylikeError`. A very verbose example of catching all types of errors:

```js
paylike.transactions.capture(transactionPk, {
	amount: 100,
	currency: 'EUR',
})
	.catch(paylike.NotFoundError, function(){
		console.error('The transaction was not found');
	})
	.catch(paylike.AuthorizationError, paylike.PermissionsError, function(){
		console.error('The API key does not have access to the transaction');
	})
	.catch(paylike.ValidationError, function( e ){
		console.error('The capture failed:', e.data);
	})
	.catch(paylike.PaylikeError, function( e ){
		console.error('Something went wrong', e);
	});
```

In most cases catching `NotFoundError` and `ValidationError` as client errors
and logging `PaylikeError` would suffice.

## Methods

```
apps.findOne() -> Promise(app)

merchants.create(opts) -> Promise(merchantPk)
merchants.invite(merchantPk, email) -> Promise
merchants.find(appPk) -> Cursor
merchants.findOne(merchantPk) -> Promise(merchant)

transactions.create(merchantPk, opts) -> Promise(transactionPk)
transactions.capture(transactionPk, opts) -> Promise
transactions.refund(transactionPk, opts) -> Promise
transactions.void(transactionPk, opts) -> Promise
transactions.find(merchantPk) -> Cursor
transactions.findOne(transactionPk) -> Promise(transaction)

cards.create(merchantPk, opts) -> Promise(cardPk)

// Cursor

filter -> cursor
sort -> cursor
skip -> cursor
limit -> cursor
stream -> stream
toArray -> Promise(Array)
```

A webshop would typically need only `capture`, `refund` and `void`. Some might
as well use `findTransaction` and for recurring subscriptions
`createTransaction`.

### Example (capturing a transaction)

```js
paylike.transactions.capture(transactionPk, {
	amount: 1200,
	currency: 'USD',
	descriptor: 'Awesome #5011',
})
	.then(function(){
		console.log('Captured USD 12.00 appearing as "Awesome #5011" on customers bank statement');
	});
```
