#!/usr/bin/env node
'use strict';

const config = require('../config.js');
const twitter_client = require('./twitter-client.js');
const utils = require('./utils.js');
const natural = require('natural');
// var colors = require('colors');
const _ = require('lodash');

const classification_config = config.classifications[0];
const classifier_file = `${config.data_dir}/${classification_config.output}`;

natural.BayesClassifier.load(classifier_file, null, function(classifier_error, classifier) {
    twitter_client.createTweetStream(
        process.env.TWITTER_SCREEN_NAME, 
        classification_config.slug,
        classification_config.filters,
        function(tweet_error, tweet){
            if(tweet_error){
                throw tweet_error;
            }
            let result = classifier.classify(tweet.text);
            utils.logClassResult(tweet, result);
            // let text = `${result}: ${tweet.text}`;
            // if(result === 'FOMO_SELL'){
            //     text = text.red;
            // }else if(result === 'FOMO_BUY'){
            //     text = text.green;
            // }else{
            //     text = text.rainbow;
            // }
            // console.log(text);
        });
});