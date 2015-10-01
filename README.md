# Paylike client (Node.js)

## Getting an API key

An API key can be obtained by creating a merchant and adding an app through our [dashboard](https://app.paylike.io). If your app's target audience is third parties, please reach out and we will make your app's API key hidden.

## Basics

### Install

```shell
npm install paylike --save
```

```js
var paylike = require('paylike')(appKey);
```

### Promises

All asynchronous functionality will return [promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).

Any non-successful requests will yield rejected promises.

```js
paylike.void(transactionPk, 200)
	.then(function(){
		// void is successfully done
	}, function(){
		// void failed
	});
```

### Cursors

TODO

## Methods

```
findApp() -> Promise(App)
createMerchant(opts) -> Promise(pk)
invite(email) -> Promise
findMerchants(appPk) -> Cursor
findMerchant(merchantPk) -> Promise(Merchant)
createTransaction(merchantPk, opts) -> Promise(pk)
capture(transactionPk, amount, opts) -> Promise
refund(transactionPk, amount, opts) -> Promise
void(transactionPk, amount) -> Promise
findTransactions(merchantPk) -> Cursor
findTransaction(transactionPk) -> Promise(Transaction)
saveCard(merchantPk, transactionPk, opts) -> pk
```

A webshop would typically need only `capture`, `refund`, `void`. Some might as
well use `findTransaction` and for recurring subscriptions
`createTransaction`.

### Example (capturing a transaction)

```js
paylike.capture(transactionPk, 1200, {
	currency: 'USD',
	descriptor: 'Awesome #5011',
})
	.then(function(){
		console.log('Captured USD 12.00 appearing as "Awesome #5011" on customers bank statement');
	});
```
