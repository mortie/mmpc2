var httpStream = require("./http-stream");
var torrentStream = require("torrent-stream");

var mediarx = /\.(mp4|mkv|mov|avi|ogv)$/;
var tmpdir = process.cwd()+"/tmp";

var engine;
var conf;

exports.init = function(app, _conf) {
	conf = _conf;
}

exports.stream = function(magnet, cb) {
	if (engine)
		return engine.destroy(() =>
			{ engine = null; exports.stream(magnet, cb) });

	engine = torrentStream(magnet, {
		tmp: conf.tmpdir
	});

	engine.on("ready", () => {
		var file = null;

		engine.files.forEach(f => {
			if (mediarx.test(f.name) &&
					(file == null || f.length > file.length)) {
				file = f;
			}
		});

		if (file == null)
			return cb("No media file in the torrent");

		file.select();

		httpStream.readStreamCreator = function(options) {
			console.log("creating stream with", options);
			var rs = file.createReadStream(options);
			rs.filesize = file.length;
			rs.filename = file.name;

			rs.on("close", () => console.log("stream closing"));

			return rs;
		}

		cb();
	});
}

exports.stop = function() {
	if (engine != null)
		engine.destroy();
}
