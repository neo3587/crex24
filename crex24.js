'use strict';

const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const crypto = require("crypto");

const base_url = "https://api.crex24.com/v2/";

/**
* @param {string} path -
* @param {Array<string>} [params] -
* @returns {Promise<object>} -
*/
function http_req(path, params = []) {
    return new Promise((resolve, reject) => {
        let req = new XMLHttpRequest();
        params = params.filter((x, i) => x !== undefined);
        req.open("GET", base_url + path + (params.length ? "?" + params.reduce((pv, cv, i) => pv + "&" + cv) : ""));
        req.onload = () => {
            if (req.status === 200)
                try {
                    resolve(JSON.parse(req.responseText));
                }
                catch (e) {
                    reject(e);
                }
            else
                reject(Error(req.responseText));
            
        };
        req.send();
    });
}
/**
* @param {Crex24} cr24 - 
* @param {"GET"|"POST"} method -
* @param {string} path -
* @param {Array<string>|object} params -
* @returns {Promise<object>} -
*/
function http_req_log(cr24, method, path, params) {
    return new Promise((resolve, reject) => {

        let req = new XMLHttpRequest();
        let nonce = Date.now();
        let msg = "/v2/" + path;
        
        if (method === "GET") {
            params = params.filter((x, i) => x !== undefined);
            params = params.length ? "?" + params.reduce((pv, cv, i) => pv + "&" + cv) : "";
            req.open("GET", base_url + path + params);
            msg += params + nonce;
            params = null;
        }
        else {
            Object.getOwnPropertyNames(params).forEach((x, i) => {
                if (params[x] === undefined || params[x] === null)
                    delete params[x];
            });
            params = JSON.stringify(params);
            req.open("POST", base_url + path);
            msg += nonce + (params !== "{}" ? params : "");
        }

        req.setRequestHeader("X-CREX24-API-KEY", cr24._api_key);
        req.setRequestHeader("X-CREX24-API-NONCE", nonce);
        req.setRequestHeader("X-CREX24-API-SIGN", crypto.createHmac("sha512", cr24._secret).update(msg).digest("base64"));

        req.onload = () => {
            if (req.status === 200)
                try {
                    resolve(JSON.parse(req.responseText));
                }
                catch (e) {
                    reject(e);
                }
            else
                reject(Error(req.responseText));

        };
        req.send(params);
    });
}


class Crex24Market {

    /**
      * @typedef {object} Crex24MarketCurrencies
      * @property {string} symbol Unique identifier of the currency, e.g. "BTC"
      * @property {string} name Currency name, e.g. "Bitcoin"
      * @property {boolean} isFiat Reports whether the currency is fiat
      * @property {boolean} depositsAllowed Contains the value false if deposits for the currency are not accepted at the moment
      * @property {number} depositConfirmationCount The number of blockchain confirmations the deposit is required to receive before the funds are credited to the account (for cryptocurrencies only; in case of fiat currency, the field contains the value null)
      * @property {number} minDeposit Minimum deposit threshold (for cryptocurrencies only; in case of fiat currency, the field contains the value null)
      *  If the deposit doesn’t meet the minimum threshold, the funds will not be credited to the account until the moment, when in the result of following deposits, their total amount will have reached the threshold
      * @property {boolean} withdrawalsAllowed Contains the value false if withdrawals are not currently available for the currency
      * @property {number} withdrawalPrecision Precision of withdrawal amount, expressed in the number of decimal places (digits to the right of a decimal point)
      * @property {number} minWithdrawal Minimum withdrawal amount (for cryptocurrencies only; in case of fiat currency, the field contains the value null)
      * @property {number} maxWithdrawal Maximum withdrawal amount (for cryptocurrencies only; in case of fiat currency, the field contains the value null). If a currency doesn’t have an upper withdrawal limit, the field contains the value null
      * @property {number} flatWithdrawalFee The amount of fee charged per withdrawal (this field is for cryptocurrencies with flat withdrawal fee only, in case of cryptocurrency with non-flat fee or in case of fiat currency, the field contains the value null).
      *  For cryptocurrencies with non-flat withdrawal fee, its size can be estimated using the previewWithdrawal method
      * @property {boolean} isDelisted Reports whether the currency is delisted
    */
    /**
      * @typedef {object} Crex24MarketInstruments
      * @property {string} symbol Unique identifier of the instrument, e.g. "LTC-BTC" for trading in LTC/BTC pair
      * @property {string} nbaseCurrency Base currency of the instrument
      * @property {string} quoteCurrency Quote currency of the instrument
      * @property {string} feeCurrency Currency in which the fee is charged (rebate is paid), when trading the instrument
      * @property {number} tickSize The minimum price movement of the instrument (the smallest price increment of an order placed for the instrument)
      * @property {number} minPrice Minimum price of an order placed for the instrument
      * @property {number} minVolume Minimum volume of an order placed for the instrument
      * @property {Array<"limit"|"market"|"stopLimit">} supportedOrderTypes Array of order types supported by the instrument. May contain the following items:
      *  "limit" - limit order;
      *  "market" - market order;
      *  "stopLimit" - stop-limit order.
      *  More about order types in the corresponding section of documentation: https://docs.crex24.com/trade-api/v2/#order-types
      * @property {"active"|"suspended"|delisted"} state Instrument state, can have one of the following values:
      *  "active" - working in a normal mode;
      *  "suspended" - trading is suspended;
      *  "delisted" - instrument is delisted
    */
    /**
      * @typedef {object} Crex24MarketTickers
      * @property {string} instrument Unique ticker identifier, e.g. "LTC-BTC"
      * @property {number} last Last price. If this information is not available, the field contains the value null
      * @property {number} percentChange Percentage change of the price over the last 24 hours. If this information is not available, the field contains the value null
      * @property {number} low Lowest price over the last 24 hours. If this information is not available, the field contains the value null
      * @property {number} high Highest price over the last 24 hours. If this information is not available, the field contains the value null
      * @property {number} baseVolume Total trading volume of the instrument over the last 24 hours, expressed in base currency
      * @property {number} quoteVolume Total trading volume of the instrument over the last 24 hours, expressed in quote currency
      * @property {number} volumeInBtc Total trading volume of the instrument over the last 24 hours, expressed in BTC
      * @property {number} volumeInUsd Total trading volume of the instrument over the last 24 hours, expressed in USD
      * @property {number} ask Best ask price. If there are no active selling orders, the field contains the value null
      * @property {number} bid Best bid price. If there are no active buying orders at the moment, the field contains the value null
      * @property {string} timestamp Date and time when the ticker was updated
    */
    /**
      * @typedef {object} Crex24MarketRecentTrades
      * @property {number} price Price for which the base currency was bought or sold
      * @property {number} volume Trade volume (the amount of base currency that was bought or sold)
      * @property {"buy"|"sell"} side Trade direction, can have either of the two values: "buy" or "sell"
      * @property {string} timestamp Date and time when the trade took place
    */
    /**
      * @typedef {object} Crex24MarketOrderBook_PriceLevel
      * @property {number} price Price for which the base currency is bought or sold
      * @property {number} volume Total volume of base currency that is bought or sold on the price level
      * 
      * @typedef {object} Crex24MarketOrderBook
      * @property {Array<Crex24MarketOrderBook_PriceLevel>} buyLevels An array of price levels for buying orders, sorted by price from highest to lowest
      * @property {Array<Crex24MarketOrderBook_PriceLevel>} sellLevels An array of price levels for selling orders, sorted by price from lowest to highest
    */
    /**
      * @typedef {object} Crex24MarketOHLCV
      * @property {string} timestamp Date and time when the timeframe started
      * @property {number} open Opening price
      * @property {number} high Highest price
      * @property {number} low Lowest price
      * @property {number} close Closing price
      * @property {number} volume Total amount of base currency traded within the timeframe
    */

    /** Returns the list of available currencies (including coins, tokens, etc.) with detailed information
    * @param {string|Array<string>} [filter] - Currency or array of currencies for which the detailed information is requested. If the parameter is not specified, the detailed information about all available currencies is returned
    * @returns {Promise<Array<Crex24MarketCurrencies>>} -
    */
    currencies(filter) {
        return http_req("public/currencies", [
            filter && `filter=${Array.isArray(filter) ? filter.reduce((pv, cv, i) => pv + "," + cv) : filter}`
        ]);
    }
    /** Returns the list of available trade instruments with detailed information
    * @param {string|Array<string>} [filter] - Instrument or array of instruments for which the detailed information is requested. If the parameter is not specified, the detailed information about all available instruments is returned
    * @returns {Promise<Array<Crex24MarketInstruments>>} -
    */
    instruments(filter) {
        return http_req("public/instruments", [
            filter && `filter=${Array.isArray(filter) ? filter.reduce((pv, cv, i) => pv + "," + cv) : filter}`
        ]);
    }
    /** Returns the list of tickers with detailed information
    * @param {string|Array<string>} [instrument] - Tickers or array of tickers for which the detailed information is requested. If the parameter is not specified, the detailed information about all available tickers is returned
    * @returns {Promise<Array<Crex24MarketTickers>>} -
    */
    tickers(instrument) {
        return http_req("public/tickers", [
            instrument && `instrument=${Array.isArray(instrument) ? instrument.reduce((pv, cv, i) => pv + "," + cv) : instrument}`
        ]);
    }
    /** Returns the list of recent trades made with the specified instrument, sorted from newest to oldest
    * @param {string} instrument - Trade instrument for which the trades are requested
    * @param {number} [limit] - Maximum number of results per call. Accepted values: 1 - 1000. If the parameter is not specified, the number of results is limited to 100
    * @returns {Promise<Array<Crex24MarketRecentTrades>>} -
    */
    recent_trades(instrument, limit) {
        return http_req("public/recentTrades", [
            `instrument=${instrument}`,
            limit && `limit=${limit}`
        ]);
    }
    /** Returns information about bids and asks for the specified instrument, organized by price level
    * @param {string} instrument - Trade instrument for which the order book is requested
    * @param {number} [limit] - Maximum number of returned price levels (both buying and selling) per call. If the parameter is not specified, the number of levels is limited to 100
    * @returns {Promise<Crex24MarketOrderBook>} -
    */
    order_book(instrument, limit) {
        return http_req("public/orderBook", [
            `instrument=${instrument}`,
            limit && `limit=${limit}`
        ]);
    }
    /** Returns the most recent OHLCV (Open, High, Low, Close, Volume) data for the specified instrument
    * @param {string} instrument - Trade instrument for which the OHLCV data is requested
    * @param {string} granularity - OHLCV data granularity, can have one of the following values:
    *  1m, 3m, 5m, 15m, 30m - 1, 3, 5, 15 or 30 minutes respectively
    *  1h, 4h - 1 or 4 hours respectively
    *  1d - 1 day
    *  1w - 1 week
    *  1mo - 1 month
    * @param {number} [limit] - Maximum number of results per call. Accepted values: 1 - 1000. If the parameter is not specified, the number of results is limited to 100
    * @returns {Promise<Array<Crex24MarketOHLCV>>} -
    */
    ohlcv(instrument, granularity, limit) {
        return http_req("public/ohlcv", [
            `instrument=${instrument}`,
            `granularity=${granularity}`,
            limit && `limit=${limit}`
        ]);
    }

}
class Crex24Trading {

    /**
      * @typedef {object} Crex24TradingPlaceOrder
      * @property {number} id Unique order identifier
      * @property {string} timestamp Date and time of creation
      * @property {string} instrument Trade instrument identifier
      * @property {"buy"|"sell"} side Direction of trade, can have either of the two values:
      *  "buy" - buying order
      *  "sell" - selling order
      * @property {"limit"|"market"|"stopLimit"} type Order type, can have one of the following values:
      *  "limit" - limit order
      *  "market" - market order
      *  "stopLimit" - stop-limit order
      * @property {"submitting"|"unfilledActive"|"partiallyFilledActive"|"filled"|"unfilledCancelled"|"partiallyFilledCancelled"|"waiting"} status Order status, can have one of the following values:
      *  "submitting" - in the process of submission
      *  "unfilledActive" - active, no trades have taken place yet
      *  "partiallyFilledActive" - part of the order is active, the other part has already been filled
      *  "filled" - the order has been filled and is no longer active
      *  "unfilledCancelled" - cancelled, no trades had been completed
      *  "partiallyFilledCancelled" - cancelled being partially filled: part of the order has been filled, the other part has been cancelled
      *  "waiting" - stop-limit order is waiting to be triggered to place a limit order
      * @property {"cancelledByUser"|"failedToFillRightAway"|"failedToPassValidation"|"marketClosed"|"orderExpired"} cancellationReason Reason why the order has been cancelled (only for orders, that have status "unfilledCancelled" or "partiallyFilledCancelled", in other cases the field contains the value null). Can have one of the following values:
      *  "cancelledByUser" - the user has cancelled the order
      *  "failedToFillRightAway" - an attempt to immediately fill an IOC or FOK order has failed, consequently the order has been cancelled
      *  "failedToPassValidation" - the order has not passed validation
      *  "marketClosed" - the instrument has been suspended from trading
      *  "orderExpired" - the order has expired (reserved for future use)
      *  Reserved for future use. Currently is always set to null
      * @property {"GTC"|"IOC"|"FOK"} timeInForce Length of time over which the order will continue working before it’s cancelled, can have one of the following values:
      *  "GTC" - Good-Til-Cancelled
      *  "IOC" - Immediate-Or-Cancel
      *  "FOK" - Fill-Or-Kill.
      *  This field is for limit orders only. If the order is of different type, the field contains the value null
      * @property {number} volume Initial volume of the order
      * @property {number} price Initial price of the order. In case of market order, this field contains the value null
      * @property {number} stopPrice Stop-price (for stop-limit orders only; if the order is of different type, this field contains the value null)
      * @property {number} remainingVolume Remaining volume of the order (volume that hasn’t been filled)
      * @property {string} lastUpdate Last time the order had undergone changes (remaining volume decreased, status changed, etc.). If this information is not available, the field contains the value null.
      * @property {number} parentOrderId ID of an order that served as a base order for the current one. This field contains an integer value if the current order has been placed due to triggering of a stop-limit order or as a result of modification of another order. Otherwise the field contains the value null.
      *  Reserved for future use. Currently is always set to null
      * @property {number} childOrderId ID of an order that has been created based on the current order. This field contains an integer value if the current order is a stop-limit order that has been triggered or the current order is a limit order that has been modified. Otherwise the field contains the value null.
      *  Reserved for future use. Currently is always set to null
     */
    /**
      * @typedef {object} Crex24TradingTradeHistory
      * @property {number} id Unique trade identifier
      * @property {number} orderId Identifier of the order that generated the trade
      * @property {string} timestamp Date and time when the trade took place
      * @property {string} instrument Trade instrument identifier
      * @property {string} side Trade direction, can have either of the two values: "buy" or "sell"
      * @property {number} price Price for which the base currency was bought or sold
      * @property {number} volume Trade volume (the amount of base currency that was bought or sold)
      * @property {number} fee The amount of fee charged (negative value means rebate)
      * @property {string} feeCurrency Fee/rebate currency
     */
    /**
      * @typedef {object} Crex24TradingTradeFee
      * @property {number} makerFeeRate Relative size of market-maker fee, e.g. the value 0.001 stands for a fee that amounts to 0.1% of the trade value (negative value means rebate)
      * @property {number} takerFeeRate Relative size of market-taker fee, e.g. the value 0.001 stands for a fee that amounts to 0.1% of the trade value
      * @property {number} tradeVolume Total volume of trades that took place over the last 30 days, expressed in BTC
      * @property {string} lastUpdate Date and time when the values of trade fees and trailing 30-day volume were last updated
    */

    constructor(base) {
        this._base = base;
    }

    /** Places a new order. In order to invoke this method, authentication key must have R2 access permission
    * @param {string} instrument - Trade instrument for which the order should be placed, e.g. "ETH-BTC"
    * @param {"buy"|"sell"} side - Order side, can have either of the two values:
    *  "buy" - buying order
    *  "sell" - selling order
    * @param {number} price - Order price. The value must be greater than or equal to the minPrice of the instrument
    *   This parameter is not necessary for market-orders types (if set explicitly, the value is ignored)
    * @param {number} volume - The amount of base currency to be bought or sold. The value must be greater than or equal to the minVolume of the instrument
    * @param {"limit"|"market"|"stopLimit"} [type] - Order type. Accepted values:
    *  "limit" - limit order
    *  "market" - market order
    *  "stopLimit" - stop-limit order
    *  The value must comply with the list of order types supported by the instrument (see the value of parameter supportedOrderTypes of the Instrument)
    *  If the parameter is not specified (null or undefined), the default value "limit" is used
    * @param {"GTC"|"IOC"|"FOK"} [timeInForce] - Sets the length of time over which the order will continue working before it’s cancelled. Accepted values:
    *  "GTC" - Good-Til-Cancelled
    *  "IOC" - Immediate-Or-Cancel (currently not supported, reserved for future use)
    *  "FOK" - Fill-Or-Kill (currently not supported, reserved for future use)
    *  If the parameter is not specified (null or undefined), the default value "GTC" is used for limit orders
    * @param {number} [stopPrice] - Stop-price. This parameter is mandatory for stop-limit orders only. In case of alternate order types, the value is ignored
    * @param {boolean} [strictValidation] - Values of parameters price and stopPrice must be a multiple of tickSize of the instrument. This field defines how such values should be processed, if they don’t meet the requirement:
    *  false - prices will be rounded to meet the requirement
    *  true - execution of the method will be aborted and an error message will be returned
    *  The default value is false
    * @returns {Promise<Crex24TradingPlaceOrder>} -
    */
    place_order(instrument, side, price, volume, type, timeInForce, stopPrice, strictValidation) {
        return http_req_log(this._base, "POST", "trading/placeOrder", {
            instrument: instrument,
            side: side,
            type: type,
            timeInForce: timeInForce,
            volume: volume,
            price: price,
            stopPrice: stopPrice,
            strictValidation: strictValidation
        });
    }
    /** Returns detailed information about the specified order(s). In order to invoke this method, authentication key must have R1 access permission
    * @param {number|Array<number>} id - Identifier or array of identifiers of orders for which the detailed information is requested
    * @returns {Promise<Array<Crex24TradingPlaceOrder>>} -
    */
    order_status(id) {
        return http_req_log(this._base, "GET", "trading/orderStatus", [
            `id=${Array.isArray(id) ? id.reduce((pv, cv, i) => pv + "," + cv) : id}`
        ]);
    }
    /** Returns information about trades generated by the specified order. In order to invoke this method, authentication key must have R1 access permission
    * @param {number} id - ID of the order for which the information about trades is requested
    * @returns {Promise<Array<Crex24TradingTradeHistory>>} -
    */
    order_trades(id) {
        return http_req_log(this._base, "GET", "trading/orderTrades", [
            `id=${id}`
        ]);
    }
    /** Returns information about trades generated by the specified order. In order to invoke this method, authentication key must have R1 access permission
    * @param {number} id - ID of the order for which the information about trades is requested
    * @param {number} [newPrice] - New value of price. If the parameter is not specified or its value is null or 0, the price of the order will be left unchanged
    * @param {number} [newVolume] - New value of volume. If the parameter is not specified or its value is null or 0, the volume of the order will be left unchanged
    * @param {boolean} [strictValidation] - The value of parameter newPrice must be a multiple of tickSize of the Instrument. This field defines how the value should be processed, if it doesn’t meet the requirement:
    *  false - price will be rounded to meet the requirement
    *  true - execution of the method will be aborted and an error message will be returned
    * @returns {Promise<Crex24TradingPlaceOrder>} -
    */
    modify_order(id, newPrice, newVolume, strictValidation) {
        return http_req_log(this._base, "POST", "trading/modifyOrder", {
            id: id,
            newPrice: newPrice,
            newVolume: newVolume,
            strictValidation: strictValidation
        });
    }
    /** Returns the list of active orders with detailed information. In order to invoke this method, authentication key must have R1 access permission
    * @param {string|Array<string>} [instrument] - Trade instrument or array of trade instruments for which the active orders are requested. If the parameter is not specified, the active orders for all instruments are returned
    * @returns {Promise<Array<Crex24TradingPlaceOrder>>} -
    */
    active_orders(instrument) {
        return http_req_log(this._base, "GET", "trading/activeOrders", [
            instrument && `instrument=${Array.isArray(instrument) ? instrument.reduce((pv, cv, i) => pv + "," + cv) : instrument}`
        ]);
    }
    /** Cancels orders with the specified identifiers. In order to invoke this method, authentication key must have R2 access permission
    * @param {number|Array<number>} ids - Id or array of identifiers of orders that should be cancelled
    * @returns {Promise<Array<number>>} - Cancelled orders
    */
    cancel_order_by_id(ids) {
        return http_req_log(this._base, "POST", "trading/cancelOrdersById", {
            ids: Array.isArray(ids) ? ids : [ids]
        });
    }
    /** Cancels all orders for each of the specified trade instruments. In order to invoke this method, authentication key must have R2 access permission
    * @param {string|Array<string>} instruments - Identifier or array of identifiers of trade instruments for which all orders should be cancelled
    * @returns {Promise<Array<number>>} - Cancelled orders
    */
    cancel_order_by_instrument(instruments) {
        return http_req_log(this._base, "POST", "trading/cancelOrdersByInstrument", {
            instruments: Array.isArray(instruments) ? instruments : [instruments]
        });
    }
    /** Cancels all active orders and all orders that are in the process of submission. In order to invoke this method, authentication key must have R2 access permission
    * @returns {Promise<Array<number>>} - Cancelled orders
    */
    cancel_all_orders() {
        return http_req_log(this._base, "POST", "trading/cancelAllOrders", {});
    }
    /** Returns the list of trader’s orders with detailed information. In order to invoke this method, authentication key must have R1 access permission
    * @param {string|Array<string>} [instrument] - Trade instrument or array of trade instruments for which the information about orders is requested. If the parameter is not specified, the information about orders is provided for all instruments
    * @param {Date} [from] - The start point of the time frame from which the information about orders should be collected
    * @param {Date} [till] - The end point of the time frame from which the information about orders should be collected
    * @param {number} [limit] - Maximum number of results per call. Accepted values: 1 - 1000. If the parameter is not specified, the number of results is limited to 100
    * @returns {Promise<Array<Crex24TradingPlaceOrder>>} -
    */
    order_history(instrument, from, till, limit) {
        return http_req_log(this._base, "GET", "trading/orderHistory", [
            instrument && `instrument=${Array.isArray(instrument) ? instrument.reduce((pv, cv, i) => pv + "," + cv) : instrument}`,
            from && `from=${from.toJSON().replace(/\.[0-9]{3}/, "")}`,
            till && `till=${till.toJSON().replace(/\.[0-9]{3}/, "")}`,
            limit && `limit=${limit}`
        ]);
    }
    /** Returns the list of trades with detailed information, authentication key must have R1 access permission
    * @param {string|Array<string>} [instrument] - Trade instrument or array of trade instruments for which the information about trades is requested. If the parameter is not specified, the information about trades is provided for all instruments
    * @param {Date} [from] - The start point of the time frame from which the information about trades should be collected
    * @param {Date} [till] - The end point of the time frame from which the information about orders should be collected
    * @param {number} [limit] - Maximum number of results per call. Accepted values: 1 - 1000. If the parameter is not specified, the number of results is limited to 100
    * @returns {Promise<Array<Crex24TradingTradeHistory>>} -
    */
    trade_history(instrument, from, till, limit) {
        return http_req_log(this._base, "GET", "trading/tradeHistory", [
            instrument && `instrument=${Array.isArray(instrument) ? instrument.reduce((pv, cv, i) => pv + "," + cv) : instrument}`,
            from && `from=${from.toJSON().replace(/\.[0-9]{3}/, "")}`,
            till && `till=${till.toJSON().replace(/\.[0-9]{3}/, "")}`,
            limit && `limit=${limit}`
        ]);
    }
    /** Returns information about trade commissions: market-taker fee and market-maker fee/rebate. 
    * Both values depend on trader’s 30-day trailing volume (expressed in BTC) and updated at least once every 24 hours.
    * In order to invoke this method, authentication key must have R1 access permission
    * @returns {Promise<Array<Crex24TradingTradeFee>>} -
    */
    trade_fee() {
        return http_req_log(this._base, "GET", "trading/tradeFee", []);
    }

}
class Crex24Account {

    /**
      * @typedef {object} Crex24AccountBalances
      * @property {string} currency Currency identifier, e.g. "BTC"
      * @property {number} available Available balance (funds that can be withdrawn or used for trading)
      * @property {number} reserved Reserved balance (funds that are being used in active orders and, consequently, can’t be withdrawn or used elsewhere at the moment)
    */
    /**
      * @typedef {object} Crex24AccountDepositAddress
      * @property {string} currency Currency identifier, e.g. "BTC"
      * @property {string} address Address of the wallet to send the cryptocurrency to
      * @property {string} paymentId Additional information (such as Payment ID, Message, Memo, etc.) that defines the destination of money transfer along with the address and should be specified when sending the deposit. If there’s no need to specify an additional information, the field contains the value null
    */
    /**
      * @typedef {object} Crex24AccountMoneyTransfers
      * @property {number} id Unique identifier of money transfer
      * @property {"deposit"|"withdrawal"} type Type of money transfer, can have either of the two values: "deposit" or "withdrawal"
      * @property {string} currency Cryptocurrency identifier
      * @property {string} address Cryptocurrency wallet address
      *  In case of cryptocurrency deposit, this field contains the address of the CREX24 wallet associated with trader’s account.
      *  In case of cryptocurrency withdrawal, this field contains the address of external wallet, to which the money were transferred from trader’s account
      *  For fiat deposits and withdrawals, this field contains the value null. The field also contains the value null for cryptocurrency deposits and withdrawals, if the information about the wallet address is unavailable
      * @property {string} paymentId Additional information (such as Payment ID, Message, Memo, etc.) that was specified along with the wallet address
      *  For fiat deposits and withdrawals, this field contains the value null. The field also contains the value null for cryptocurrency deposits and withdrawals, if such information is not unavailable
      * @property {number} amount The amount of currency that was deposited or withdrawn
      * @property {number} fee The amount of fee charged for money transfer. If this information is not available, the field contains the value null
      * @property {string} txId Identifier of the transaction in the cryptocurrency blockchain
      *  For fiat deposits and withdrawals, this field contains the value null. The field also contains the value null for cryptocurrency deposits and withdrawals, if the information about the transaction ID is unavailable
      * @property {string} createdAt Date and time when the money transfer was initiated
      * @property {string} processedAt Date and time when the money transfer was processed. If this information is not available or the money transfer hasn’t been processed yet, the field contains the value null
      * @property {number} confirmationsRequired The number of blockchain confirmations the cryptocurrency deposit is required to receive before the funds are credited to the account, or the number of confirmations the cryptocurrency withdrawal is required to receive before it is considered successful
      *  In case of fiat deposits and withdrawals, this field contains the value null
      * @property {number} confirmationCount Current number of blockchain confirmations of the cryptocurrency deposit/withdrawal (in case of fiat deposits and withdrawals, the field contains the value null)
      * @property {"pending"|"success"|"failed"} status Money transfer status, can have one of the following values:
      *  "pending" - transfer is in progress
      *  "success" - completed successfully
      *  "failed" - aborted at some point (money will be credited back to the account of origin)
      * @property {string} errorDescription Error description (only for money transfers with status "failed", in other cases the field contains the value null)
    */
    /**
      * @typedef {object} Crex24AccountPreviewWithdrawal
      * @property {string} warning If withdrawal meets formal requirements (minimum and maximum limits, withdrawal amount covers the fee, etc.), the field contains the value null, and the fields below provide a preview information for a withdrawal with the specified parameters.
      *  Otherwise this field contains a warning message indicating the source of the problem, and the fields below provide information for a substitute withdrawal that is close to the original one but would meet formal requirements. 
      *  It is up to your software to decide whether to use the suggested modification of the withdrawal or not. An attempt to perform an actual withdrawal with the originally specified parameters will result in an error
      * @property {number} balanceDeduction The total amount that will be debited from the account (subtracted from the balance), if the withdrawal is performed
      * @property {number} fee The size of the fee that will be charged, if the withdrawal is performed
      * @property {number} payout The amount that will be transferred to the specified address, if the withdrawal is performed
    */

    constructor(base) {
        this._base = base;
    }

    /** Returns information about trader’s balances in different currencies. In order to invoke this method, authentication key must have R1 access permission
    * @param {string|Array<string>} [currency] - Currency or array of currencies for which the balance information is requested. If the parameter is not specified, the balance information is requested for all currencies
    * @param {boolean} [nonZeroOnly] - Can have either of the two values (The default value is true):
    *  true - return only non-zero balances;
    *  false - return all balances.
    * @returns {Promise<Array<Crex24AccountBalances>>} -
    */
    balances(currency, nonZeroOnly) {
        return http_req_log(this._base, "GET", "account/balance", [
            currency && `currency=${Array.isArray(currency) ? currency.reduce((pv, cv, i) => pv + "," + cv) : currency}`,
            nonZeroOnly && `nonZeroOnly=${nonZeroOnly}`
        ]);
    }
    /** Returns the address (and Payment ID, if necessary) for cryptocurrency deposit. In order to invoke this method, authentication key must have R3 access permission
    * @param {string} currency - Identifier of the cryptocurrency, that you would like to deposit
    * @returns {Promise<Crex24AccountDepositAddress>} -
    */
    deposit_address(currency) {
        return http_req_log(this._base, "GET", "account/depositAddress", [
            `currency=${currency}`
        ]);
    }
    /** Returns information about deposits and withdrawals. In order to invoke this method, authentication key must have R3 access permission
    * @param {"deposit"|"withdrawal"} [type] - Filters money transfers by type, can have either of the two values:
    *  "deposit" - get deposits only
    *  "withdrawal" - get withdrawals only
    *  If the parameter is not specified, both the deposits and withdrawals are returned
    * @param {string|Array<string>} [currency] - Currency or array of currencies for which the money transfer history is requested. If the parameter is not specified, the money transfers are returned for all currencies
    * @param {Date} [from] - The start point of the time frame from which the money transfer history is collected
    * @param {Date} [till] - The end point of the time frame from which the money transfer history is collected
    * @param {number} [limit] - Maximum number of results per call. Accepted values: 1 - 1000. If the parameter is not specified, the number of results is limited to 100
    * @returns {Promise<Array<Crex24AccountMoneyTransfers>>} -
    */
    money_transfers(type, currency, from, till, limit) {
        return http_req_log(this._base, "GET", "account/moneyTransfers", [
            type && `type=${type}`,
            currency && `currency=${Array.isArray(currency) ? currency.reduce((pv, cv, i) => pv + "," + cv) : currency}`,
            from && `from=${from.toJSON().replace(/\.[0-9]{3}/, "")}`,
            till && `till=${till.toJSON().replace(/\.[0-9]{3}/, "")}`,
            limit && `limit=${limit}`
        ]);
    }
    /** Returns information about the specified money transfer(s). In order to invoke this method, authentication key must have R3 access permission
    * @param {number|Array<number>} id - Identifiers or array of identifiers of money transfers for which the detailed information is requested
    * @returns {Promise<Array<Crex24AccountMoneyTransfers>>} -
    */
    money_transfer_status(id) {
        return http_req_log(this._base, "GET", "trading/moneyTransferStatus", [
            id && `id=${Array.isArray(id) ? id.reduce((pv, cv, i) => pv + "," + cv) : id}`
        ]);
    }
    /** Returns information about the specified money transfer(s). In order to invoke this method, authentication key must have R3 access permission
    * @param {string} currency - The value of parameter currency that will be specified in the actual withdrawal request
    * @param {number} amount - The value of parameter amount that will be specified in the actual withdrawal request
    * @param {boolean} [includeFee] - The value of parameter includeFee that will be specified in the actual withdrawal request
    * @returns {Promise<Crex24AccountPreviewWithdrawal>} -
    */
    preview_withdrawal(currency, amount, includeFee) {
        return http_req_log(this._base, "GET", "account/previewWithdrawal", [
            currency && `currency=${currency}`,
            amount && `amount=${amount}`,
            includeFee && `includeFee=${includeFee}`
        ]);
    }
    /** Withdraws certain amount of cryptocurrency from the account and sends it to the specified crypto address. In order to invoke this method, authentication key must have R4 access permission
    * @param {string} currency - Currency identifier
    * @param {number} amount - Withdrawal amount (the precision is limited to a number of decimal places specified in the withdrawalPrecision field of the Currency, the value is rounded automatically to meet the precision limitation)
    * @param {string} address - Crypto address to which the money will be transferred
    * @param {string} [paymentId] - Additional information (such as Payment ID, Message, Memo, etc.) that specifies the destination of money transfer along with the address. If this information is not required or not supported by the cryptocurrency, the parameter should be omitted
    * @param {boolean} [includeFee] - Sets whether the specified amount includes fee, can have either of the two values:
    *  true - balance will be decreased by amount, whereas [amount - fee] will be transferred to the specified address;
    *  false - amount will be deposited to the specified address, whereas the balance will be decreased by [amount + fee].
    *  The default value is false
    * @returns {Promise<Crex24AccountMoneyTransfers>} -
    */
    withdraw(currency, amount, address, paymentId, includeFee) {
        return http_req_log(this._base, "POST", "account/withdraw", {
            currency: currency,
            amount: amount,
            address: address,
            paymentId: paymentId,
            includeFee: includeFee
        });
    }

}


class Crex24 {

    /** Optionally prepares the object for the authentifications for 'trading' and 'account' functions, you can get the required values from here: https://crex24.com/settings/tokens
    * @param {string} [api_key] - The account api key
    * @param {string} [secret] - The account secret
    */
    constructor(api_key, secret) {
        this.market = new Crex24Market();
        this.trading = new Crex24Trading(this);
        this.account = new Crex24Account(this);
        if (api_key !== undefined && secret !== undefined)
            this.prepare_auth(api_key, secret);
    }

    /** Prepares the object for the authentifications required for 'trading' and 'account' functions, you can get the required values from here: https://crex24.com/settings/tokens
    * @param {string} api_key - The account api key
    * @param {string} secret - The account secret
    */
    prepare_auth(api_key, secret) {
        this._api_key = api_key;
        this._secret = Buffer.from(secret, "base64");
    }

}


module.exports = {
    Crex24: Crex24
};
