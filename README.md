# Crex24

A simple js wrapper for the Crex24 cryptoexchange API

# Usage example

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

    // unlike the cr24.market functions, the Crex24.trading and Crex24.account functions requires authentification and CAN'T be called concurrently
    cr24.prepare_auth(api_key, secret);

    console.log(await cr24.trading.order_history("ETH-BTC"));
    console.log(await cr24.account.balances());

});
```
