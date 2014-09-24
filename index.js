var request = require('request');
var courselistURL = 'http://www.imooc.com/api2/courselist_ver2',
	clParams = {
		timestamp: Date.now(),
		uid: 0,
		page: 2,
		token: '7f75e24cb1f7e5c358f03a7b40a60976'
	};

request.post({url: courselistURL, form: clParams}, function(err, response, body) {
	if (!err && response.statusCode == 200) {
		var courses = JSON.parse(body).data;
		for (var i = 0, len = courses.length; i < len; i++) {
			console.log(courses[i].id, courses[i].name);
		}
	} else {

	}
});

// var courseURL = 'http://www.imooc.com/api2/getcpinfo_ver2',
// 	params = {
// 		uid: 0,
// 		cid: 96,
// 		token: '8a23e151eacfe1e9556e71f8eb6b3c9b'
// 	};
// request.post({url: courseURL, form: params}, function(err, response, body) {
// 	console.log(JSON.parse(body));
// });