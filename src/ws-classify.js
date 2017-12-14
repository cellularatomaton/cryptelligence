const config = require('../config.js');
const twitter_client = require('./twitter-client.js');
const natural = require('natural');
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

// Broadcast to all.
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

// wss.on('connection', function connection(ws) {
//   ws.on('message', function incoming(data) {
//     // Broadcast to everyone else.
//     wss.clients.forEach(function each(client) {
//       if (client !== ws && client.readyState === WebSocket.OPEN) {
//         client.send(data);
//       }
//     });
//   });
// });

const classification_config = config.classifications[0];
const classifier_file = `${config.data_dir}/${classification_config.output}`;

natural.BayesClassifier.load(classifier_file, null, function(classifier_error, classifier) {
    twitter_client.createTweetStream(
        process.env.TWITTER_SCREEN_NAME, 
        null,
        classification_config.filters,
        function(tweet_error, tweet){
            if(tweet_error){
                throw tweet_error;
            }
            let result = classifier.classify(tweet.text);
            // utils.logClassResult(tweet.text, result);
            wss.broadcast(JSON.stringify({
                result: result, 
                timestamp: (new Date(tweet.created_at)).getTime()
            }));
        });
});