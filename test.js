var request = require('request');
var fs = require('fs');
var file = fs.createWriteStream('H.mp4')
request.get('http://video.mukewang.com/d3d52c4b-8cb0-4fd0-b00a-360e2d01087e/H.mp4')
    .on('data', function(data) {
        file.write(data);
    })
    .on('end', function() {
        console.log('download success.');
    });