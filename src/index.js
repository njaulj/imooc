var request = require('request');
var async = require('async');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');


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

iMooc.prototype.download = function(cid, chapterSeqs, dest) {
	ciParams.cid = cid;
	var options = {url: courseinfoURL, form: ciParams};

	moocPost(options, function(err, chapters) {
		if (!err) {
			var len = chapters.length,
				seqs = [];
			// 获取chapter seq
			chapters.forEach(function(chapter) {
				seqs.push(chapter.chapter.seq);
			});
			chapterSeqs = typeof chapterSeqs === 'undefined' ?
				seqs : chapterSeqs;

			async.eachLimit(chapterSeqs, 5, function(seq, next) {
				if (seqs.indexOf(seq) != -1) {
					var chapter = chapters[seq - 1],
						chapterInfo = chapter.chapter,
						medias = chapter.media,
						seqdir = path.join(dest, chapterInfo.name);

					async.waterfall([
						// 检查chapter文件夹是否存在
						function(callback) {
							fs.exists(seqdir, function(exists) {
								callback(null, exists);
							});
						},
						function(exists, callback) { // 存在则执行下一步，不存在则创建
							if (!exists) {
								mkdirp(seqdir, function(err) {
									return callback(err);
								});
							}
							callback(null);
						}
					], function(err) {
						async.each(medias, function(media, callback) {
							moocDownload(media, seqdir, callback);
						}, function(err) {
							next();
						});
					});
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

function moocDownload(media, dest, callback) {
	var url = media.media_url,
		name = media.name,
		seq = media.media_seq,
		extname = path.extname(url),
		basename = path.basename(url, extname),
		dirname = path.dirname(url),
		savename = path.join(dest, seq + '_' + name + extname),
		vstream = null;

	if (basename == 'L' && /mp4/.test(extname)) {
		url = dirname + '/H' + extname;
	}
	vstream = fs.createWriteStream(savename);
	request.get(url)
		.on('data', function(data) {
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
