var fs = require("fs");
var pathlib = require("path");
var player = require("./player");
var httpStream = require("./http-stream");
var torrentStreamer = require("./torrent-streamer");
var subtitleFinder = require("./subtitle-finder");

exports.httpPath = player.httpPath;

var app;

exports.init = function(_app, conf) {
	app = _app;
	player.init(app, conf);
	httpStream.init(app, conf);
	torrentStreamer.init(app, conf);
	subtitleFinder.init(app, conf);
}

exports.playFile = function(path, cb) {

	// Find file's length
	fs.stat(path, (err, stat) => {

		// Find subtitles
		subtitleFinder.find(stat.size, pathlib.basename(path), subFile => {

			// Play!
			player.play(path, subFile, cb);
		});
	});
}

exports.playUrl = function(path, cb) {

	// Just play, we won't bother finding subtitles
	player.play(path, null, cb);
}

exports.playTorrent = function(magnet, cb) {

	// Stream torrent
	torrentStreamer.stream(magnet, (err, filesize, filename) => {
		if (err)
			return cb(err);

		// Find subtitles
		subtitleFinder.find(filesize, filename, subFile => {

			// Play!
			player.play(app.getAddress()+httpStream.httpPath, subFile, cb);
		});
	});
}

exports.isPlaying = player.isPlaying;

player.onstop = function() {
	torrentStreamer.stop();
	httpStream.stop();
}
