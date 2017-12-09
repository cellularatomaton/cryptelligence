#!/usr/bin/env node
'use strict';

const config = require('../config.js');
const twitter = require('twitter');

const createTweetStream = function(screen_name, slug, filters, callback){
    const twitter_client = new twitter({
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
        access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
    });
    const twitter_params = {
        slug: slug,
        owner_screen_name: screen_name,
        // count: 200
    };

    twitter_client.get('lists/members', twitter_params, function(twitter_err, data, twitter_resp) {
        if(twitter_err){ 
            console.log(twitter_err);
            console.log(twitter_resp);  // Raw response object. 
            throw twitter_err; 
        }
        console.log(`Returned ${data.users.length} members.`);
        let user_ids = data.users.reduce(function(agg, user, inx, arr){
            agg.push(user.id);
            return agg;
        },[]);
        // twitter_params.follow = user_ids.join(',');
        twitter_params.track = filters.join(',');
        const twitter_stream = twitter_client.stream('statuses/filter', twitter_params);
        twitter_stream.on('data', function(event) {
            callback(null, event);
        });
        
        twitter_stream.on('error', function(error) {
            callback(error, null);
        });
    });
}

module.exports = {
    createTweetStream: createTweetStream
}