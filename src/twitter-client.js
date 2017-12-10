#!/usr/bin/env node
'use strict';

const config = require('../config.js');
const twitter = require('twitter');

const getMembers = function(twitter_client, twitter_params, callback){
    twitter_client.get('lists/members', twitter_params, function(twitter_err, data, twitter_resp) {
        if(twitter_err){ 
            console.log(twitter_err);
            console.log(twitter_resp);  // Raw response object. 
            throw twitter_err; 
        }
        callback(data);
    });
}

const subscribeToStream = function(twitter_client, twitter_params, user_ids, callback){
    if(user_ids){
        twitter_params.follow = user_ids.join(',');
    }
    const twitter_stream = twitter_client.stream('statuses/filter', twitter_params);
    twitter_stream.on('data', function(event) {
        callback(null, event);
    });
    
    twitter_stream.on('error', function(error) {
        callback(error, null);
    });
    return twitter_stream;
}

const createTweetStream = function(screen_name, slug, filters, callback){
    const twitter_client = new twitter({
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
        access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
    });

    const twitter_params = {
        owner_screen_name: screen_name,
        track: filters.join(',')
        // count: 200
    };
    if(slug){
        twitter_params.slug = slug;
        getMembers(twitter_params, function(data){
            console.log(`Returned ${data.users.length} members.`);
            let user_ids = data.users.reduce(function(agg, user, inx, arr){
                agg.push(user.id);
                return agg;
            },[]);
            return subscribeToStream(twitter_client, twitter_params, user_ids, callback);
        });
    }else{
        return subscribeToStream(twitter_client, twitter_params, null, callback);
    }
}

module.exports = {
    createTweetStream: createTweetStream
}