var fs = require("fs");
var http = require("http");
var https = require("https");
var pathlib = require("path");
var urllib = require("url");
var fsutil = require("../fsutil");
var notify = require("../notify");
var player = require("./player");
var httpStream = require("./http-stream");
var torrentStreamer = require("./torrent-streamer");
var SubtitleFile = require("./subtitle-file");

exports.httpPath = player.httpPath;

exports.cleanupFiles = [];

var app;
var conf

exports.onTerm = function() {
	SubtitleFile.onTerm();
}

exports.init = function(_app, _conf) {
	app = _app;
	conf = _conf;
	SubtitleFile.init(app, conf);
	player.init(app, conf);
	httpStream.init(app, conf);
	torrentStreamer.init(app, conf);
}

/*
 * Filename is optional; in case you want to provide a filename for subtitles
 * but want a different path
 */
exports.playFile = function(path, cb, filename) {
	filename = filename || pathlib.basename(path);

	notify("Playing file", filename);

	// Find file's length
	fs.stat(path, (err, stat) => {
		if (err) {
			console.trace(err);
			return cb();
		}

		// Play!
		player.play(path, null, cb);
	});
}

exports.playUrl = function(url, cb) {

	notify("Playing url...", url);
	player.play(url, null, cb);
}

exports.playTorrent = function(magnet, cb) {

	notify("Playing torrent...");

	// Stream torrent
	torrentStreamer.stream(magnet, (err, filesize, filename, subtitles) => {
		if (err)
			return cb(err);

		// Play!
		notify("Starting playback.", filename);
		player.play(app.getAddress()+httpStream.httpPath, subtitles, cb);
	});
}

exports.playTorrentPage = function(url, cb) {
	function findMagnet(str) {
		var rx = /['"](magnet:[^'"]+)['"]/;
		var match = str.match(rx);
		if (!match)
			return null;

		return match[1];
	}

	notify("Finding magnet on torrent page...", url);

	var urlobj = urllib.parse(url);
	var o = urlobj.protocol === "https:" ? https : http;
	o.request(urlobj, res => {
		var str = "";

		res
			.on("data", d => str += d )
			.on("error", err => {
				notify("Error downloading page!", err.toString());
				console.trace(err);
				cb();
			})
			.on("end", () => {
				var magnet = findMagnet(str);
				if (!magnet) {
					notify("No magnet link on page!");
					cb();
					return;
				}

				exports.playTorrent(magnet, cb);
			});
	}).end();
}

exports.isPlaying = player.isPlaying;

player.onstop = function() {
	torrentStreamer.stop();
	httpStream.stop();

	exports.cleanupFiles.forEach(f => {
		try {
			fs.unlink(f, err => { if (err) console.trace(err) });
		} catch (err) {
			console.log(err.toString());
		}
	});
	exports.cleanupFiles = [];

	fsutil.rmdir(conf.tmpdir+"/torrent-stream");
}
