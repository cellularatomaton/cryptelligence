const Gdax = require('gdax');
var Twitter = require('twitter');

const PRODUCT_ID = 'btc-usd';
const GRANULARITY = 60*5;

const gdaxPublicClient = new Gdax.PublicClient();
const twitterClient = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

gdaxPublicClient.getProductHistoricRates({'granularity': GRANULARITY}, function(gdax_err, gdax_resp, candles){
    if(gdax_err) {
        console.log(candles);
        console.log(gdax_resp);  // Raw response object. 
        throw gdax_err;
    }
    console.log(`Gdax returned ${candles.length} bars.`);
    console.log(`First bar ${candles[0]}`);
    console.log(`Last bar ${candles[candles.length-1]}`);

    var twitter_params = {
        slug: 'signals',
        owner_screen_name: 'CellularAtom',
        count: 200
    };
    twitterClient.get('lists/statuses', twitter_params, function(twitter_err, tweets, twitter_resp) {
        if(twitter_err){ 
            console.log(twitter_err);
            console.log(twitter_resp);  // Raw response object. 
            throw twitter_err; 
        }
        console.log(`Returned ${tweets.length} tweets.`);
        console.log(`First tweet: ${JSON.stringify(tweets[0])}`);
        console.log(`Last tweet: ${JSON.stringify(tweets[tweets.length-1])}`);
      });
});