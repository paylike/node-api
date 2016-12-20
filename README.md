# Paylike client (Node.js)

With [browserify](https://github.com/substack/node-browserify/) you can use
this library in the browser as well. Be aware that you should not bundle your
private API keys for public websites though.

Writing your own client? Checkout the raw [HTTP service](https://github.com/paylike/api-docs).

**Make sure to [subscribe to our mailling list](http://eepurl.com/bCGmg1) for
deprecation notices, API changes and new features**, or you can watch this
repository for changes.

*This is a `0.0.x` release, change might come*

## Getting an API key

An API key can be obtained by creating a merchant and adding an app through
our [dashboard](https://app.paylike.io). If your app's target audience is
third parties, please reach out and we will make your app's API key hidden.

## Install

```shell
npm install paylike --save
```

```js
var paylike = require('paylike')(appKey);
```

## Methods

```js
// change key for authentication
.setKey(key)

// create an app (requires no authentication)
apps.create(opts) -> Promise(app)

// fetch current app (based on key)
apps.findOne() -> Promise(app)

// list app's merchants
apps.merchants.find(appId) -> Cursor(users)


merchants.create(opts) -> Promise(merchantId)
merchants.update(merchantId, opts) -> Promise
merchants.findOne(merchantId) -> Promise(merchant)

merchants.users.add(merchantId, opts) -> Promise
merchants.users.revoke(merchantId, userId) -> Promise
merchants.users.find(merchantId) -> Cursor(users)

merchants.apps.add(merchantId, opts) -> Promise
merchants.apps.revoke(merchantId, appId) -> Promise
merchants.apps.find(merchantId) -> Cursor(apps)

merchants.lines.find(merchantId) -> Cursor(lines)

merchants.transactions.create(merchantId, opts) -> Promise(transactionId)
merchants.transactions.find(merchantId) -> Cursor(transactions)


transactions.capture(transactionId, opts) -> Promise
transactions.refund(transactionId, opts) -> Promise
transactions.void(transactionId, opts) -> Promise
transactions.findOne(transactionId) -> Promise(transaction)


cards.create(merchantId, opts) -> Promise(cardId)
cards.findOne(cardId) -> Promise(card)
```

A webshop would typically need only `capture`, `refund` and `void`. Some might
as well use `transactions.findOne` and for recurring subscriptions
`transactions.create`.

## Promises or callbacks (we support both)

All asynchronous methods will return [promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) or accept a callback as the last argument (node style).

The Promise implementation is [Bluebird](https://github.com/petkaantonov/bluebird) and you can utilize all of [their API](https://github.com/petkaantonov/bluebird/blob/master/API.md).

```js
// Promise style
paylike.transactions.capture(transactionIdA, {
	amount: 100,
})
	.then(function(){
		// capture is successfully done
	}, function(){
		// capture failed
	});

// Callback style
paylike.transactions.refund(transactionIdB, {
	amount: 100,
}, function( err ){
	if (err)
		return console.error(err);	// refund failed

	// refund was successful
});
```

## Cursors (pagination)

```js
after(id) -> cursor
since(Date) -> cursor

before(id) -> cursor
until(Date) -> cursor

limit(limit) -> cursor

stream([highWaterMark]) -> stream
toArray -> Promise(Array)

// never close the stream, poll each `delay` ms
stream.keepAlive([delay]) -> stream
```

All `find` methods return cursors.

A cursor is simply an object wrapping a result of unknown length. It polls the
server in batches as needed.

If you specify a starting point using `before()` you will get the newest
objects first (which is also the default), but using `after` you will receive
them in reverse order. This fits nicely into the stream pattern and infinite
lists that expand in both directions.

The rationale for using `after`/`before` as opposed to `skip` is to achieve
stable lists and reliable data synchronization.

```js
var cursor = paylike.transactions.find(merchantId);

// get a promise for an array of the last 5 transactions
cursor.limit(5).toArray();

// stream all transactions to a HTTP response
paylike.transactions.find(merchantId)
	.stream()
	.pipe(JSONStream.stringify())
	.pipe(response);
```

## Error handling

The API will throw errors when things do not fly. All errors inherit from
`PaylikeError`. A very verbose example of catching all types of errors:

```js
paylike.transactions.capture(transactionId, {
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

### Example (capturing a transaction)

```js
paylike.transactions.capture(transactionId, {
	amount: 1200,
	currency: 'USD',
	descriptor: 'Awesome #5011',
})
	.then(function(){
		console.log('Captured USD 12.00 appearing as "Awesome #5011" on customers bank statement');
	});
```
