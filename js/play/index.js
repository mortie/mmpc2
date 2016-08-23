var fs = require("fs");
var pathlib = require("path");
var fsutil = require("../fsutil");
var player = require("./player");
var httpStream = require("./http-stream");
var torrentStreamer = require("./torrent-streamer");
var subtitleFinder = require("./subtitle-finder");

exports.httpPath = player.httpPath;

exports.cleanupFiles = [];

var app;
var conf

exports.init = function(_app, _conf) {
	app = _app;
	conf = _conf;
	player.init(app, conf);
	httpStream.init(app, conf);
	torrentStreamer.init(app, conf);
	subtitleFinder.init(app, conf);
}

/*
 * Filename is optional; in case you want to provide a filename for subtitles
 * but want a different path
 */
exports.playFile = function(path, cb, filename) {
	filename = filename || pathlib.basename(path);

	// Find file's length
	fs.stat(path, (err, stat) => {
		if (err) {
			console.trace(err);
			return cb();
		}

		// Find subtitles
		subtitleFinder.find(stat.size, filename, subFile => {
			exports.cleanupFiles.push(subFile);

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
			exports.cleanupFiles.push(subFile);

			// Play!
			player.play(app.getAddress()+httpStream.httpPath, subFile, cb);
		});
	});
}

exports.isPlaying = player.isPlaying;

player.onstop = function() {
	torrentStreamer.stop();
	httpStream.stop();

	exports.cleanupFiles.forEach(f => {
		try {
			fs.unlink(f, err => { if (err) console.trace(err) });
		} catch (err) {
			console.trace(err);
		}
	});
	exports.cleanupFiles = [];

	fsutil.rmdir(conf.tmpdir+"/torrent-stream");
}
