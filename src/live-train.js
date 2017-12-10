#!/usr/bin/env node
'use strict';

const config = require('../config.js');
const utils = require('./utils.js');
const twitter_client = require('./twitter-client.js');
const natural = require('natural');
// const colors = require('colors');
const _ = require('lodash');
const Gdax = require('gdax');

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
const trackers = [];
let sample_count = 0;
let training = false;
let tweet_stream = null;
websocket.on('open', function(){
    console.log('Websocket opened.');
    tweet_stream = twitter_client.createTweetStream(
        process.env.TWITTER_SCREEN_NAME, 
        null, 
        class_config.filters,
        function(tweet_error, tweet){
            if(tweet_error){
                throw tweet_error;
            }
            trackers.push({
                tweet_text: tweet.text,
                tweet_ts: utils.getEpochTime(tweet.created_at),
                last_ticker_ts: null,
                open: null,
                high: null,
                low: null,
                close: null,
                buy_volume: 0,
                sell_volume: 0,
            });
            // let result = classifier.classify(tweet.text);
            // utils.logClassResult(tweet.text, result);
        });
});

websocket.on('message', function(data) { 
    if(data.type === 'ticker'){
        utils.logTicker(data);
        trackers.forEach(function(tracker){
            if(!tracker.open){
                tracker.open = data.price;
            }
            tracker.high = tracker.high ? Math.max(tracker.high, data.price) : data.price;
            tracker.low = tracker.low ? Math.min(tracker.low, data.price) : data.price;
            tracker.close = data.price;
            if(data.side === 'buy'){
                tracker.buy_volume += data.last_size;
            }else{
                tracker.sell_volume += data.last_size;
            }
            // console.log(`Ticker timestamp: ${data.time} (${utils.getEpochTime(data.time)})`);
            tracker.last_ticker_ts = utils.getEpochTime(data.time);
            
        });
        const finished_trackers = _.remove(trackers, function(t){
            // console.log(`Timestamps:  Ticker(${t.last_ticker_ts}), Tweet(${t.tweet_ts})`)
            return class_config.time_decay < (t.last_ticker_ts - t.tweet_ts);
        });
        
        finished_trackers.forEach(function(t){
            const result = utils.classifyTracker(t, class_config);
            classifier.addDocument(t.tweet_text, result);
            // let result = classifier.classify(tweet.text);
            utils.logClassResult(t.tweet_text, result);
            sample_count++;
            
        });
        if(finished_trackers.length){
            console.log(`Finished tracking ${finished_trackers.length} tweets, total ${sample_count}, ${trackers.length} queued.`)
        }
        if(class_config.sample_size < sample_count && !training){
            training = true;
            websocket.disconnect();
            tweet_stream.destroy();
            classifier.train();
            const output_path = `${config.data_dir}/${class_config.output}`;
            classifier.save(output_path, function(err, classifier) {
                console.log(`Classification complete.  Saved to ${output_path}`);
            });
        }
        // console.log(`${data.last_size} ${data.side} ${data.price}`);
    }
});

websocket.on('error', function(err){
    console.log(err);
});

websocket.on('close', function(){
    console.log('Websocket closed.');
});