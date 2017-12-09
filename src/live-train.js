#!/usr/bin/env node
'use strict';

const config = require('../config.js');
const utils = require('./utils.js');
const twitter_client = require('./twitter-client.js');
const natural = require('natural');
// const colors = require('colors');
const _ = require('lodash');
const Gdax = require('gdax');

const classification_config = config.classifications[0];
const class_config = config.classifications[0];
const classifier = new natural.BayesClassifier();
const PRODS = [class_config.market];
const URI = 'wss://ws-feed.gdax.com';
const AUTH = null;
const HEARTBEAT = false;
const CHANNELS = [
    'heartbeat',
    'ticker'
];
const OPTS = {
    heartbeat: false,
    channels: CHANNELS
}
const websocket = new Gdax.WebsocketClient(PRODS, URI, AUTH, OPTS);

websocket.on('open', function(){
    console.log('Websocket opened.');
    twitter_client.createTweetStream(
        process.env.TWITTER_SCREEN_NAME, 
        classification_config.slug, 
        classification_config.filters,
        function(tweet_error, tweet){
            if(tweet_error){
                throw tweet_error;
            }
            // let result = classifier.classify(tweet.text);
            utils.logClassResult(tweet, result);
        });
});

websocket.on('message', function(data) { 
    if(data.type === 'ticker'){
        console.log(`${data.last_size} ${data.side} ${data.price}`);
    }
});

websocket.on('error', function(err){
    console.log(err);
});

websocket.on('close', function(){
    console.log('Websocket closed.');
});