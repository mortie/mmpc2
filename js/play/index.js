var player = require("./player");
var httpStream = require("./http-stream");
var torrentStreamer = require("./torrent-streamer");

exports.httpPath = player.httpPath;

var app;

exports.init = function(_app, conf) {
	app = _app;
	player.init(app, conf);
	httpStream.init(app, conf);
	torrentStreamer.init(app, conf);
}

exports.playFile = function(path, cb) {
	player.play(path, cb);
}

exports.playTorrent = function(magnet, cb) {
	torrentStreamer.stream(magnet, err => {
		if (err)
			return cb(err);

		player.play(app.getAddress()+httpStream.httpPath, cb);
	});
}

exports.isPlaying = player.isPlaying;

player.onstop = function() {
	torrentStreamer.stop();
	httpStream.stop();
}
