#!/usr/bin/env node
'use strict';

const colors = require('colors');

const getEpochTimeFromDate = d => d.getTime()/1000;
const getGdaxDate = ts => new Date(ts*1000);
const getGdaxIsoString = ts => getGdaxDate(ts).toISOString();
const getGdaxEpochTime = ts => getEpochTimeFromDate(getGdaxDate(ts));
const getDate = ts => new Date(ts);
const getIsoString = ts => getDate(ts).toISOString();
const getEpochTime = ts => getEpochTimeFromDate(getDate(ts));
const classifyCandle = function(candle, min_volume, max_volume, config){
    const l = candle[1];
    const h = candle[2];
    const o = candle[3];
    const c = candle[4];
    const v = candle[5];
    const dildo = config.dildo_gain < Math.abs(c - o) / Math.abs(h - l);
    const closedUp = o < c; // Up momentum
    const closedDown = c < o; // Down Momentum
    const flow = config.flow_gain < (v - min_volume) / (max_volume - min_volume); // Flow power
    const fomoBuy = dildo && closedUp && flow;
    const fomoSell = dildo && closedDown && flow;
    if(fomoBuy){
        return 'FOMO_BUY';
    }else if(fomoSell){
        return 'FOMO_SELL';
    }else{
        return 'HODL';
    }
}
const classifyTracker = function(t, config){
    // t.tweet_text;
    // t.tweet_ts;
    // t.last_ticker_ts;
    // t.open;
    // t.high;
    // t.low;
    // t.close;
    // t.buy_volume;
    // t.sell_volume;
    let flow = 0;
    const flow_denominator = Math.max(t.buy_volume, t.sell_volume);
    if(flow_denominator !== 0){
        const flow_measurement = 1 - (Math.min(t.buy_volume, t.sell_volume) / flow_denominator);
        console.log(`Flow: Denominator ${flow_denominator}, Measurement ${flow_measurement}`);
        flow = config.flow_gain < flow_measurement;
    }
    let dildo = 0;
    const dildo_measurement = Math.abs(t.close - t.open) / Math.abs(t.high - t.low);
    if(t.high !== t.low){
        dildo = config.dildo_gain < dildo_measurement;
    }
    const closedUp = t.open < t.close;
    const closedDown = t.close < t.open;
    const fomoBuy = dildo && closedUp && flow;
    const fomoSell = dildo && closedDown && flow;
    console.log(`Closed Up? ${closedUp}, Closed Down? ${closedDown}, Dildo ${dildo_measurement}`);
    if(fomoBuy){
        return 'FOMO_BUY';
    }else if(fomoSell){
        return 'FOMO_SELL';
    }else{
        return 'HODL';
    }
}
const logClassResult = function(text, result){
    let t = `${result}: ${text}`;
    if(result === 'FOMO_SELL'){
        t = t.red;
    }else if(result === 'FOMO_BUY'){
        t = t.green;
    }else{
        t = t.grey;
    }
    console.log(t);
}
const logTicker = function(ticker){
    let t = `${ticker.time} ${ticker.side} ${ticker.last_size} @ ${ticker.price}`;
    if(ticker.side === 'buy'){
        t = t.green;
    }else{
        t = t.red;
    }
    console.log(t);
}
module.exports = {
    getEpochTime: getEpochTime,
    getGdaxDate: getGdaxDate,
    getGdaxIsoString: getGdaxIsoString,
    getGdaxEpochTime: getGdaxEpochTime,
    getDate: getDate,
    getIsoString: getIsoString,
    getEpochTime: getEpochTime,
    classifyCandle: classifyCandle,
    classifyTracker: classifyTracker,
    logClassResult: logClassResult,
    logTicker: logTicker
}