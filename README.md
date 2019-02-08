# Crex24

A simple js wrapper for the Crex24 cryptoexchange API.
Every function returns a promise, most of them are resolved with a documented object.

# Public market functions

These functions doesn't require authentification.

``` ts
Crex24.market.currencies(filter?: string|string[]): Promise<object[]>
Crex24.market.instrumets(filter?: string|string[]): Promise<object[]>
Crex24.market.tickers(instrument?: string|string[]): Promise<object[]>
Crex24.market.order_book(instrument: string, limit?: number): Promise<object>
Crex24.market.ohlcv(instrument: string, granularity: string, limit?: number): Promise<object[]>
```

# Private trading functions

These functions requires authentification with a R1 or R2 permission depending on the function.

``` ts
Crex24.trading.place_order(instrument: string, side: string, price: number, volume: number, type?: string, timeInForce?: string, stopPrice?: number, strictValidation?: boolean): Promise<object>
Crex24.trading.order_status(id: number|number[]): Promise<object[]>
Crex24.trading.order_trades(id: number): Promise<object[]>
Crex24.trading.modify_order(id: number, newPrice?: number, newVolume?: number, strictValidation?: boolean): Promise<object>
Crex24.trading.active_orders(instrument?: string|string[]): Promise<object[]>
Crex24.trading.cancel_order_by_id(ids: number|number[]): Promise<number[]>
Crex24.trading.cancel_order_by_instrument(instruments: string|string[]): Promise<number[]>
Crex24.trading.cancel_all_orders(): Promise<number[]>
Crex24.trading.order_history(instrument?: string|string[], from?: Date, till?: Date, limit?: number): Promise<object[]>
Crex24.trading.trade_history(instrument?: string|string[], from?: Date, till?: Date, limit?: number): Promise<object[]>
Crex24.trading.trade_fee(): Promise<object[]>
```

# Private account functions

These functions requires authentification with a R1, R3 or R4 permission depending on the function.

``` ts
Crex24.account.balances(currency?: string|string[], nonZeroOnly?: boolean): Promise<object[]>
Crex24.account.deposit_address(currency: string): Promise<object>
Crex24.account.money_transfers(type?: string, instrument?: string|string[], from?: Date, till?: Date, limit?: number): Promise<object[]>
Crex24.account.money_transfer_status(id: number|number[]): Promise<object[]>
Crex24.account.preview_withdrawal(currency: string, amount: number, includeFee?: boolean): Promise<object>
Crex24.account.withdraw(currency: string, amount: number, address: string, paymentId?: string, includeFee?: boolean): Promise<object>
```

# Simple usage example

``` js
const { Crex24 } = require("./crex24");

// Your data from https://crex24.com/settings/tokens
const api_key = "YOUR_API_KEY";
const secret = "YOUR_SECRET";

var cr24 = new Crex24();

Promise.all([
    cr24.market.tickers(),
    cr24.market.instruments()
]).then(async ([tickers, instruments]) => {

    console.log(tickers);
    console.log(instruments.filter(x => x.state === "active"));

    // unlike the public Crex24.market functions, the private Crex24.trading and Crex24.account functions CAN'T be called concurrently
    cr24.prepare_auth(api_key, secret);

    console.log(await cr24.trading.order_history("ETH-BTC"));
    console.log(await cr24.account.balances());

});
```
