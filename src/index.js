var request = require('request');
var async = require('async');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var os = require('os');


var clToken = '7f75e24cb1f7e5c358f03a7b40a60976',
	ciToken = '8a23e151eacfe1e9556e71f8eb6b3c9b',
	coToken = '5f5786aad68fcc240eb2a5e0deaf9f5b',
	courselistURL = 'http://www.imooc.com/api2/courselist_ver2',
	courseinfoURL = 'http://www.imooc.com/api2/getcpinfo_ver2',
	courseintroURL = 'http://www.imooc.com/api2/getcourseintro',
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
	},
	coParams = {
		uid: 0,
		cid: '',
		token: coToken
	};

var iMooc = function() {};

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

iMooc.prototype.download = function(cid, cseqs, dest) {
	coParams.cid = cid;
	var ctrOptions = {url: courseintroURL, form: coParams},
		destdir = path.join(dest, cid);
	async.waterfall([
		// 课程文件夹是否存在
		function(callback) {
			fs.exists(destdir, function(exists) {
				callback(null, exists);
			})
		},
		// 不存在创建，存在直接下一步
		function(exists, callback) {
			if (exists) {
				return callback(null);
			}
			mkdirp(destdir, function(err) {
				callback(err);
			}); 
		},
		// 获取课程介绍信息
		function(callback) {
			moocPost(ctrOptions, function(err, data) {
				if (!err) {
					callback(null, data);
				} else {
					callback(err);
				}
			});
		},
		// 写入课程介绍信息
		function(data, callback) {
			var content = ['课程名称：' + data[0].course_name,
				'课程简介：' + data[0].course_des].join(os.EOL);

			fs.writeFile(path.join(destdir, 'README.txt'), content, function(err) {
				callback(err);
			});
		},
		function(callback) {
			ciParams.cid = cid;
			var cinOptions = { url: courseinfoURL, form: ciParams };
			moocPost(cinOptions, function(err, data) {
				if (err) return callback(err);
				var len = data.length,
					seqs = [];
				// 获取课程章节
				data.forEach(function(c) {
					console.log(c);
					seqs.push(c.chapter.seq);
				});
				cseqs = typeof cseqs === 'undefined' ?
					seqs : cseqs;
				callback(null, cseqs, seqs, data);
			});
		},
		function(cseqs, seqs, data, callback) {
			async.eachLimit(cseqs, 5, function(seq, next) {
				if (seqs.indexOf(seq) !== -1) {
					var chapter = data[seq - 1];
					moocDownload(chapter, destdir, next);
				} else {
					// 不存在此章节
					next();
				}
			}, function(err) {
				callback(err);
			});
		}
	], function(err) {
		console.log('hahah');
	});
};

function moocDownload(chapter, dest, callback) {
	var info = chapter.chapter,
		medias = chapter.media,
		chapdir = path.join(dest, info.seq + '_' +info.name);
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
			async.each(medias, function(media, next) {
				var url = media.media_url,
					name = media.name,
					seq = media.media_seq,
					ext = path.extname(url),
					base = path.basename(url, ext),
					dir = path.dirname(url),
					savepath = path.join(chapdir, seq + '_' + name + ext),
					vstream = null;
				if (base == 'L' && /mp4/.test(ext)) {
					url = dir + '/H' + ext;
				}
				vstream = fs.createWriteStream(savepath);

				request.get(url).on('data', function(data) {
					vstream.write(data);
				}).on('end', function(err) {
					next();
				}).on('error', function(err) {
					next();
				})
			}, function(err) {
				next(null);
			});
		}
	], function(err) {
		console.log(info.seq, info.name, ' finish download.');
		callback(err);
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
