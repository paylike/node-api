// Type definitions for Paylike

import * as Promise from 'bluebird'

declare class Paylike {
  constructor(appKey: string)

  transactions: Paylike.Transactions
  merchants: Paylike.Merchants
  cards: Paylike.Cards
  apps: Paylike.Apps
  service: Paylike.Service
}

declare namespace Paylike {

  export interface PaylikeError extends Error {
    message: string
  }
  export interface PaylikeErrorConstructor extends Error {
    new (message: string): PaylikeError
    (message: string): PaylikeError
    prototype: PaylikeError
  }
  export const Error: PaylikeErrorConstructor


  export interface AuthorizationError extends PaylikeError {
    message: string
  }
  export interface AuthorizationErrorConstructor extends PaylikeError {
    new (message: string): AuthorizationError
    (message: string): AuthorizationError
    prototype: AuthorizationError
  }
  export const AuthorizationError: AuthorizationErrorConstructor


  export interface PermissionsError extends PaylikeError {
    message: string
  }
  export interface PermissionsErrorConstructor extends PaylikeError {
    new (message: string): PermissionsError
    (message: string): PermissionsError
    prototype: PermissionsError
  }
  export const PermissionsError: PermissionsErrorConstructor


  export interface NotFoundError extends PaylikeError {
    message: string
  }
  export interface NotFoundErrorConstructor extends PaylikeError {
    new (message: string): NotFoundError
    (message: string): NotFoundError
    prototype: NotFoundError
  }
  export const NotFoundError: NotFoundErrorConstructor


  export interface ConflictError extends PaylikeError {
    message: string
  }
  export interface ConflictErrorConstructor extends PaylikeError {
    new (message: string): ConflictError
    (message: string): ConflictError
    prototype: ConflictError
  }
  export const ConflictError: ConflictErrorConstructor


  export interface ValidationError extends PaylikeError {
    message: string
  }
  export interface ValidationErrorConstructor extends PaylikeError {
    new (message: string): ValidationError
    (message: string): ValidationError
    prototype: ValidationError
  }
  export const ValidationError: ValidationErrorConstructor

  interface Cursor<T> {
    after: (id: string) => Cursor<T>
    before: (id: string) => Cursor<T>
    limit: (limit: number) => Cursor<T>
    stream: (highWaterMark: number) => any
    toArray: () => Promise<Array<T>>
  }

  interface Apps {
    create: (opts: any, cb?: (err) => void) => Promise<void>
    findOne: (cb?: (err) => void) => Promise<App>
  }

  interface App {
    id: string
    name: string
    key: string
  }

  interface Merchants {
    create: (opts: any) => Promise<string>
    update: (merchantId: string, opts: any) => Promise<void>
    findOne: (merchantId: string) => Promise<Merchant>

    apps: Merchants.Apps
    users: Merchants.Users
    lines: Merchants.Lines
    transactions: Merchants.Transactions
  }

  interface Merchant {
    name: string           // optional
    currency: string       // required, three letter ISO
    test: boolean          // optional, defaults to false
    email: string          // required, contact email
    website: string        // required, website with implementation
    descriptor: string     // required, text on client bank statements
    company: Merchant.Company
    bank: Merchant.Bank    // optional
  }

  namespace Merchant {
    interface Company {
      country: string      // required, ISO 3166 code (e.g. DK)
      number: string       // optional, registration number ("CVR" in Denmark)
    }

    interface Bank {
      iban: string         // optional, (format: XX00000000, XX is country code, length varies)
    }
  }

  namespace Merchants {
    interface Users {
      add: (merchantId: string, opts: any, cb?: (err: any, value?: any) => void) => Promise<void>
      revoke: (merchantId: string, userId: string, cb?: (err: any, value?: any) => void) => Promise<void>
      find: (merchantId: string) => Cursor<Merchants.User>
    }

    interface User {
      id: string
      created: Date
      email: string
    }

    interface Apps {
      add: (merchantId: string, opts: any, cb?: (err: any, value?: any) => void) => Promise<void>
      revoke: (merchantId: string, appId: string, cb?: (err: any, value?: any) => void) => Promise<void>
      find: (merchantId: string) => Cursor<App>
    }

    interface Lines {
      find: (merchantId: string) => Cursor<Merchants.Line>
    }

    interface Line {
      id: string
      created: Date
      merchantId: string
      transactionId: string
      amount: Amount
      balance: number
      capture: boolean
      fee: number
    }

    interface Amount {
      amount: number
      currency: string
    }

    interface Transactions {
      create: (merchantId: string, opts: CreateTransactionOptions, cb?: (err: any, value?: string) => void) => Promise<string>
      find: (merchantId: string) => Cursor<Transaction>
    }
  }

  interface CreateTransactionOptions {
    transactionId?: string
    cardId?: string
    amount: number
    currency: string
    descriptor?: any
    custom?: any
  }

  interface VoidTransactionOptions {
    amount: number
  }

  interface RefundTransactionOptions {
    amount: number
    descriptor: string
  }

  interface Transactions {
    capture: (transactionId: string, opts: CaptureTransactionOptions, cb?: (err: any, value?: any) => void) => Promise<void>
    refund: (transactionId: string, opts: RefundTransactionOptions, cb?: (err: any, value?: any) => void) => Promise<void>
    void: (transactionId: string, opts: VoidTransactionOptions, cb?: (err: any, value?: any) => void) => Promise<void>
    findOne: (transactionId: string) => Promise<Transaction>
  }

  interface CaptureTransactionOptions {
    amount: number
    currency: string
    descriptor?: string
  }

  interface Transaction {
    id: string
    merchantId: string     // ID of the owning merchant account
    test: boolean          // whether on a test merchant account
    created: Date          // Date of transaction

    currency: string       // currency ISO code
    amount: number         // amount in minor units
    descriptor: string     // text on bank statement

    pendingAmount: number  // amount available for capture or void
    capturedAmount: number // amount captured (available for refund)
    refundedAmount: number // amount refunded (no further action possible)
    voidedAmount: number   // amount voided (no further action possible)
    disputedAmount: number // amount involed in disputes such as chargebacks

    card: {
      bin: string          // first 6 numbers in PAN (card number)
      last4: string
      expiry: Date
      scheme: string       // "visa" or "mastercard"
    }

    custom: any

    tds: string
    recurring: boolean     // whether the transaction was made from the server
    successful: boolean
    error: false|any       // contains a processing error if unsuccessful

    trail: Array<TrailItem>
  }

  interface TrailItem {
    // only one of the following will be present
    capture?: boolean
    refund?: boolean
    void?: boolean
    dispute?: {
      id: string

      // only one of the following will be present
      won?: boolean
      lost?: boolean
    }

    created: Date

    amount: number     // amount in minor units and transaction currency

    /*
     Amount in the merchant account's currency in minor units that
     the merchant account balance was affected with which in
     practice means the actual profit from the transaction after
     fees and/or currency conversion.
     */
    balance: number

    fee: any           // detailed description of fees applied
    descriptor: string // text on bank statement

    lineId: string     // ID of the related accounting line
  }

  interface Cards {
    create: (merchantId: string, opts: any) => Promise<string>
    findOne: (cardId: string) => Promise<Card>
  }

  interface Card {
    id: string
    merchantId: string
    created: Date
    bin: string         // first 6 numbers in PAN (card number)
    last4: string
    expiry: Date
    scheme: Card.Scheme // "visa" or "mastercard"
  }

  namespace Card {
    type Scheme = 'visa' | 'mastercard'
  }

  interface Service {
    request: (verb: string, path: string, query: any, cb?: (err: any, value?: any) => void) => Promise<any>
  }
}

export = Paylike
