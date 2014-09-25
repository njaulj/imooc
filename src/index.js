var request = require('request');
var async = require('async');
var path = require('path');
var fs = require('fs');


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

iMooc.prototype.list = function(page, keyword) {
	clParams.page = page;
	clParams.keyword = keyword || '';
	var options = { url: courselistURL, form: clParams };
	moocPost(options, function(err, data) {
		if (!err) {
			var courses = data;
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
	moocPost(options, function(err, response) {
		if (!err) {
			var chapters = response;
			for (var i = 0, len = chapters.length; i < len; i++) {
				console.log(chapters[i].chapter.seq);
				console.log(chapters[i].chapter.name);
			}
		} else {

		}
	});
};

iMooc.prototype.download = function(cid, chapterids, dest) {
	ciParams.cid = cid;
	var options = {url: courseinfoURL, form: ciParams};

	moocPost(options, function(err, chapters) {
		if (!err) {
			var len = chapters.length,
				seqs = [];
			chapters.forEach(function(chapter) {
				seqs.push(chapter.chapter.seq);
			});
			chapterids = typeof chapterids === 'undefined' ? 
				seqs : chapterids;

			async.eachLimit(chapterids, 5, function(chapterid, next) {
				if (seqs.indexOf(chapterid) != -1) {
					var chapter = chapters[chapterid - 1],
						chapterInfo = chapter.chapter,
						medias = chapter.media;
					for (var i = 0, mlen = medias.length; i < mlen; i++) {
						moocDownload(medias[i].media_url, medias[i].name, dest, next);
					}
				} else {
					console.log('no chapter ', chapterid);
				}
			}, function(err) {
				console.log('download over.');
			});
		} else {

		}
	});
};

function moocDownload(url, name, dest, callback) {
	var extname = path.extname(url),
		basename = path.basename(url, extname),
		dirname = path.dirname(url),
		savename = path.join(dest, name + extname),
		vstream = null;

	if (basename == 'L' && /mp4/.test(extname)) {
		url = path.join(dirname, 'H' + extname);
	}

	vstream = fs.createWriteStream(savename);

	request.get(url)
		.on('data', function(data) {
			console.log(data);
			vstream.write(data);
		}).on('end', function(err) {
			callback(err);
		}).on('error', function(err) {
			console.log(err);
		});
}

function moocPost(options, callback) {
	request.post(options, function(err, response, body) {
		if (!err && response.statusCode == 200) {
			var response = JSON.parse(body);
			if (response.errorCode == 1000) {
				return callback(err, response.data);
			}
		}
		callback(err);
	});
}



module.exports = iMooc;