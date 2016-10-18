var redis = require('redis');
var config = require('./../config');

var redisLib = {
  insertRedis: function(redisObj, cb) {

    //console.log('in function insertRedisKey');

    var redisOpts = config.redis;

    var client = redis.createClient(redisOpts.port, redisOpts.host);
    //client.auth(redisOpts.password);

    client.on('connect', function() {

      var redisKey = redisOpts.prefix + redisObj.key;
      var redisValue = redisObj.value;
      var redisKeyTTL = redisOpts.ttl;

      client.set(redisKey, redisValue, function(err, res) {

        if (err) {
          log.error(err);
          cb(err);
        } else {
          client.expire(redisKey, redisKeyTTL);
          cb();
        }
      });
    });

    client.on('error', function(err) {
      client.end(true);
      cb(err);
    });
  },

  getRedis: function(redisObj, cb) {
    //console.log('in function getRedisKey');

    var redisOpts = config.redis;

    var client = redis.createClient(redisOpts.port, redisOpts.host);
    //client.auth(redisOpts.password);

    client.on('connect', function() {

      var redisKey = redisOpts.prefix + redisObj.key;
      client.get(redisKey, function(err, res) {
        // res is null when the key is missing 
        client.end(true);
        if (err) {
          return cb(err, {});
        }

        try {
          res = JSON.parse(res);
        } catch (errCatch) {

          var msg = 'Error parsing json of key =>' + redisKey;
          var error = new Error(msg);
          return cb(error, {});
        }

        return cb(null, res);
      });

      client.on('error', function(err) {
        client.end(true);
        cb(err);
      });
    });
  }
};

module.exports = redisLib;