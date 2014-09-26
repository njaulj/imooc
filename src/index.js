var request = require('request');
var async = require('async');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var os = require('os');

var courselistURL = 'http://www.imooc.com/api2/courselist_ver2',
	courseinfoURL = 'http://www.imooc.com/api2/getcpinfo_ver2',
	courseintroURL = 'http://www.imooc.com/api2/getcourseintro',
	coursekeywordURL = 'http://www.imooc.com/api2/getcoursekeyword',
	clParams = {
		timestamp: Date.now(),
		uid: 0,
		page: 1,
		token: '7f75e24cb1f7e5c358f03a7b40a60976'
	},
	ciParams = {
		uid: 0,
		cid: '',
		token: '8a23e151eacfe1e9556e71f8eb6b3c9b'
	},
	coParams = {
		uid: 0,
		cid: '',
		token: '5f5786aad68fcc240eb2a5e0deaf9f5b'
	},
	ckParams = {
		uid: 0,
		keyword: '',
		token: 'd7d1903bf88289fe10167509c99538ad'
	};

exports.search = function(keyword, cb) {
	ckParams.keyword = keyword;
	var searchOptions = { url: coursekeywordURL, form: ckParams };
	imoocPost(searchOptions, cb);
};

exports.list = function(page, cb) {
	clParams.page = page;
	var listOptions = { url: courselistURL, form: clParams};
	imoocPost(listOptions, cb);
}


exports.error = function(error) {
	console.log('错误'.red + ' ' + (error instanceof Object ? error.message : error));
}

function imoocPost(options, callback) {
	request.post(options, function(err, response, body) {
		if(!err && response.statusCode == 200) {
			var postData = JSON.parse(body);
			return postData.errorCode == 1000 ?
				callback(null, postData.data) :
				callback(postData.errorDesc);
		}
		callback(err);
	});
}


