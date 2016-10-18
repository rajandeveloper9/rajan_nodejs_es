var express = require('express');
var app = express.Router();
var _ = require('lodash');

var redis = require('./../lib/redis.js');

var serverLoad = require("./../../valutrend_test/dist/server-load.js");
// var serverLoad = require("./dist/server-load.js");
 var server = serverLoad.ServerLoad.bootstrap("error");

var CACHING_ENABLED = true;//false;
/*
var server = {
	searchData: function(query, cb){

		//process.nextTick(cb(null, { 'name' : 'trial'}));
		setTimeout(cb, 3000, null, {'name' : 'trial'});
	}
};*/

function getESQuery(search) {

	var query = {
		"query": {
			"match": {
				"description": search
			}
		}
	};

	return query;
}



app.post('/feed', function(req, res) {
	//server.loadData(1);
	res.send(200);
});

function m1(req, res, next) {

	var search = req.query.description;

	var redisObj = {
		key: search
	};

	if (CACHING_ENABLED) {
		redis.getRedis(redisObj, function(e, r) {
			if (e) {
				next(e);
			} else if (_.isEmpty(r)) {
				hitSearchAndCache(redisObj.key, function(e1, r1) {
					if (e1) {
						next(e1);
					} else {
						res.res_data = r1;
						return next();
					}
				});
			} else{
				res.res_data = r;
				return next();
			}

		});
	} else {
		hitSearchAndCache(redisObj.key, function(e1, r1) {
			if (e1) {
				next(e1);
			} else {
				res.res_data = r1;
				return next();
			}
		});
	}

	function hitSearchAndCache(search, cb) {
		console.log('hitSearchAndCache => ' + search);
		var query = getESQuery(search);

		server.searchData(query, function(e, r) {
			if (e) {
				return cb(e);
			} else {
				if (CACHING_ENABLED) {
					var redisObj = {
						key: search,
						value: JSON.stringify(r)
					}
					redis.insertRedis(redisObj, function(e1, r1) {});
				}
				return cb(null, r);
			}
		});

	}

	// var index = parseInt(Math.random() * queries.length);
	// var query = queries[index];
	// console.log(query);
	// server.searchData(query);
}

function sendResp(req, res, next) {
	res.jsonp(res.res_data);
}

function sendError(err, req, res, next) {
	console.log(err);
	res.send('Some error executing request');
}

app.get('/search', m1, sendResp);

app.get('/', function(req, res, next) {
	res.render('index', {
		title: 'Express'
	});
});

module.exports = app;
