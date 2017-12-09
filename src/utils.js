#!/usr/bin/env node
'use strict';

const colors = require('colors');

const getEpochTime = d => d.getTime()/1000;
const getGdaxDate = ts => new Date(ts*1000);
const getGdaxIsoString = ts => getGdaxDate(ts).toISOString();
const getGdaxEpochTime = ts => getEpochTime(getGdaxDate(ts));
const getTwitterDate = ts => new Date(ts);
const getTwitterIsoString = ts => getTwitterDate(ts).toISOString();
const getTwitterEpochTime = ts => getEpochTime(getTwitterDate(ts));
const classifyCandle = function(candle, min_volume, max_volume){
    const l = candle[1];
    const h = candle[2];
    const o = candle[3];
    const c = candle[4];
    const v = candle[5];
    const dildo = classification_config.dildo_gain < Math.abs(c - o) / Math.abs(h - l);
    const closedUp = o < c; // Up momentum
    const closedDown = c < o; // Down Momentum
    const flow = classification_config.flow_gain < (v - min_volume) / (max_volume - min_volume); // Flow power
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
const logClassResult = function(tweet, result){
    let text = `${result}: ${tweet.text}`;
    if(result === 'FOMO_SELL'){
        text = text.red;
    }else if(result === 'FOMO_BUY'){
        text = text.green;
    }else{
        text = text.rainbow;
    }
    console.log(text);
}
module.exports = {
    getEpochTime: getEpochTime,
    getGdaxDate: getGdaxDate,
    getGdaxIsoString: getGdaxIsoString,
    getGdaxEpochTime: getGdaxEpochTime,
    getTwitterDate: getTwitterDate,
    getTwitterIsoString: getTwitterIsoString,
    getTwitterEpochTime: getTwitterEpochTime,
    classifyCandle: classifyCandle,
    logClassResult: logClassResult,
}