#!/usr/bin/env node
'use strict';

const config = require('../config.js');
const utils = require('./utils.js');
const Gdax = require('gdax');
const Twitter = require('twitter');
const natural = require('natural');
const mkdirp = require('./mkdirp.js');

const class_config = config.classifications[0];
const classifier = new natural.BayesClassifier();
const gdaxPublicClient = new Gdax.PublicClient();
const twitterClient = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

const PRODUCT_ID = class_config.market;
const GRANULARITY = 60*15;
const TEST_OUTPUT = false;
const trainingFilters = class_config.filters;

classifier.events.on('trainedWithDocument', function (obj) {
    console.log(`Training ${obj.index} of ${obj.total}`);
    /* {
    *   total: 23 // There are 23 total documents being trained against
    *   index: 12 // The index/number of the document that's just been trained against
    *   doc: {...} // The document that has just been indexed
    *  }
    */
 });

const twitter_params = {
    slug: class_config.slug,
    owner_screen_name: process.env.TWITTER_SCREEN_NAME,
    count: 200
};
twitterClient.get('lists/statuses', twitter_params, function(twitter_err, tweets, twitter_resp) {
    if(twitter_err){ 
        console.log(twitter_err);
        console.log(twitter_resp);  // Raw response object. 
        throw twitter_err; 
    }
    console.log(`Returned ${tweets.length} tweets.`);
    let filtered_tweets = [];
    tweets
        .reverse()
        .forEach(function(tweet) {
            trainingFilters.some(function(filter){
                if(tweet.text.includes(filter)){
                    // console.log(`[${tweet.created_at}] ${tweet.text}`);
                    filtered_tweets.push(tweet);
                    return true;
                }else{
                    return false;
                }
            });
        });

    let oldest_tweet = filtered_tweets[0];
    let newest_tweet = filtered_tweets[filtered_tweets.length-1];
    let newest_iso_string = utils.getTwitterIsoString(newest_tweet.created_at);
    let oldest_iso_string = utils.getTwitterIsoString(oldest_tweet.created_at); 
    console.log(`Oldest tweet | ISO ${oldest_iso_string} | UNIX ${utils.getTwitterEpochTime(oldest_tweet.created_at)} | TEXT ${oldest_tweet.text}`);
    console.log(`Newest tweet | ISO ${newest_iso_string} | UNIX ${utils.getTwitterEpochTime(newest_tweet.created_at)} | TEXT ${newest_tweet.text}`);

    let gdax_params = {
        'granularity': GRANULARITY,
        'start': oldest_iso_string,
        'end': newest_iso_string
    };
    gdaxPublicClient.getProductHistoricRates(gdax_params, function(gdax_err, gdax_resp, candles){
        if(gdax_err) {
            console.log(candles);
            console.log(gdax_resp);  // Raw response object. 
            throw gdax_err;
        }
        candles.reverse();
        let oldest_candle = candles[0][0];
        let newest_candle = candles[candles.length-1][0];
        console.log(`Gdax returned ${candles.length} bars.`);
        console.log(`Oldest bar | ISO ${utils.getGdaxIsoString(oldest_candle)}, UNIX ${utils.getGdaxEpochTime(oldest_candle)}`);
        console.log(`Newest bar | ISO ${utils.getGdaxIsoString(newest_candle)}, UNIX ${utils.getGdaxEpochTime(newest_candle)}`);
        console.log(`Synchronizing...`)

        let candle_index = 0;
        const global_vol_metrics = candles.reduce(
            function(vol_metrics, candle, idx, arr){
                v = candle[5];
                vol_metrics.min_vol = Math.min(v, vol_metrics.min_vol);
                vol_metrics.max_vol = Math.max(v, vol_metrics.max_vol);
                return vol_metrics;
            }, 
            {min_vol: Number.MAX_SAFE_INTEGER, max_vol: Number.MIN_SAFE_INTEGER}
        );
        filtered_tweets.forEach(function(tweet){
            // Find time bucket:
            for(let i = candle_index; i < candles.length; i++){
                let tweet_ts = utils.getTwitterEpochTime(tweet.created_at);
                let current_candle_ts = utils.getGdaxEpochTime(candles[i][0]);
                if(current_candle_ts <= tweet_ts){
                    // This tweet is either in the current candle, or ahead of it.  Check the next candle.
                    if(i !== candles.length - 1){
                        let next_candle_ts = utils.getGdaxEpochTime(candles[i+1][0]);
                        if(tweet_ts <= next_candle_ts){
                            // Found bucket!
                            const classification = utils.classifyCandle(
                                candles[i], 
                                global_vol_metrics.min_vol, 
                                global_vol_metrics.max_vol,
                                class_config
                            );
                            if(TEST_OUTPUT){
                                console.log(`Time Delta: ${tweet_ts - current_candle_ts}, Signal: ${classification}, Text: ${tweet.text}`);
                            }else{
                                classifier.addDocument(tweet.text, classification);
                            }
                            candle_index = i;
                            break;
                        }
                    }else{
                        // No next candle found.  Compare against granularity
                        if(tweet_ts < current_candle_ts + GRANULARITY){
                            // Found bucket!
                            const classification = utils.classifyCandle(
                                candles[i], 
                                global_vol_metrics.min_vol, 
                                global_vol_metrics.max_vol
                            );
                            if(TEST_OUTPUT){
                                console.log(`TS Delta: ${tweet_ts - current_candle_ts}, Signal: ${classification}, Text: ${tweet.text}`);
                            }else{
                                classifier.addDocument(tweet.text, classification);
                            }
                            candle_index = i;
                            break;
                        }
                    }
                }
            }
        });
        classifier.train();
        mkdirp(config.data_dir);
        const output_path = `${config.data_dir}/${class_config.output}`;
        classifier.save(output_path, function(err, classifier) {
            console.log(`Classification complete.  Saved to classifier.json`);
        });
    });
  });

