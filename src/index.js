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

exports.get = function(cid, chapters, destdir, cb) {
	coParams.cid = cid;
	var getOptions = { url: courseintroURL, form: coParams};
	async.waterfall([
		function(next) {
			imoocPost(getOptions, function(err, data) {
				if (err) return next(err);
				next(null, data);
			});
		},
		function(data, next) {
			var content = ['课程名称：' + data[0].course_name,
				'课程简介：' + data[0].course_des].join(os.EOL);
			fs.writeFile(path.join(destdir, 'README.txt'), content, function(err) {
				next(err);
			});
		},
		function(next) {
			ciParams.cid = cid;
			var cinOptions = {url: courseinfoURL, form: ciParams};
			imoocPost(cinOptions, function(err, data) {
				if (err) {
					return next(err);
				}
				var len = data.length,
					seqs = [];
				// 获取课程章节
				data.forEach(function(c) {
					seqs.push(c.chapter.seq);
				});
				chapters = chapters.length ? chapters : seqs;
				next(null, chapters, seqs, data);
			});
		},
		function(chapters, seqs, data, next) {
			async.eachLimit(chapters, 5, function(id, callback) {
				if (seqs.indexOf(id) !== -1) {
					var chapter = data[id - 1];
					imoocDownload(chapter, destdir, callback);
				} else {
					callback();
				}
			}, function(err) {
				next(err);
			});
		}
	], function(err) {
		// if (err) ;
		cb(err);
	});
}

exports.error = function(error) {
	console.log('错误'.red + ' ' + (error instanceof Object ? error.message : error));
}

function imoocDownload(course, destdir, callback) {
	var chapter = course.chapter,
		media = course.media,
		chapdir = path.join(destdir, chapter.seq + '_' + chapter.name);
	async.waterfall([
		function(next) {
			fs.exists(chapdir, function(exists) {
				next(null, exists);
			});
		},
		function(exists, next) {
			if (exists) return next(null);
			mkdirp(chapdir, function(err) {
				next(err);
			});
		},
		function(next) {
			async.each(media, function(m, next) {
				var url = m.media_url,
					name = m.name,
					seq = m.media_seq,
					ext = path.extname(url),
					base = path.basename(url, ext),
					dir = path.dirname(url),
					savepath = path.join(chapdir, seq+'_'+name+ext),
					vstream = null;
				if (base == 'L' && /mp4/.test(ext)) {
					url = dir + '/H' + ext;
				}
				vstream = fs.createWriteStream(savepath);
				request.get(url).on('data', function(data) {
					vstream.write(data);
				}).on('end', function() {
					next();
				}).on('error', function(err) {
					next();
				});
			}, function(err) {
				next(err);
			});
		}
	], function(err) {
		callback(err);
	});
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


