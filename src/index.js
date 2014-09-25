var request = require('request');

var clToken = '7f75e24cb1f7e5c358f03a7b40a60976',
	ciToken = '8a23e151eacfe1e9556e71f8eb6b3c9b',
	courselistURL = 'http://www.imooc.com/api2/courselist_ver2',
	courseinfoURL = 'http://www.imooc.com/api2/getcpinfo_ver2',
	clParams = {
		timestamp: Date.now(),
		uid: 0,
		page: 1,
		token: clToken
	}, 
	ciParams = {
		uid: 0,
		cid: '',
		token: ciToken
	};


var iMooc = function() {
};

iMooc.prototype.list = function(page) {
	clParams.page = page;
	var options = { url: courselistURL, form: clParams };
	this.post(options, function(err, resJSON) {
		if (!err) {
			var courses = resJSON.data;
			for (var i = 0, len = courses.length; i < len; i++) {
				console.log(courses[i].id, courses[i].name);
			}
		} else {

		}
	});
};

iMooc.prototype.show = function(cid) {
	ciParams.cid = cid;
	var options = {url: courseinfoURL, form: ciParams};
	this.post(options, function(err, response) {
		if (!err) {
			var chapters = response.data;
			for (var i = 0, len = chapters.length; i < len; i++) {
				console.log(chapters[i].chapter.name);
			}
		} else {

		}
	});
};

iMooc.prototype.download = function(cid, chapterid) {
	ciParams.cid = cid;
	this.post();
};

iMooc.prototype.post = function (options, callback) {
	request.post(options, function(err, response, body) {
		if (!err && response.statusCode == 200) {
			var data = JSON.parse(body);
			callback(err, data);
		} else {
			callback(err);
		}
	});
}

module.exports = iMooc;