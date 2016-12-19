var httpStream = require("./http-stream");
var SubtitleFile = require("./subtitle-file");
var torrentStream = require("torrent-stream");

var mediaformats = [
	"webm", "mkv", "flv", "vob", "avi", "mov","wmv", "you",
	"asf", "mp4", "m4p", "m4v", "svi", "ogv", "ogg"
];

var mediarxstr = 
	"\\.("+
	mediaformats.join("|")+
	")$";

var mediarx = new RegExp(mediarxstr, "i");
var subrx = /\.srt$/i;

var engine;
var conf;

exports.init = function(app, _conf) {
	conf = _conf;
}

exports.stream = function(magnet, cb) {
	if (engine)
		return engine.destroy(() =>
			{ engine = null; exports.stream(magnet, cb) });

	try {
		engine = torrentStream(magnet, {
			tmp: conf.tmpdir
		});
	} catch (err) {
		return cb(err.toString());
	}

	engine.on("ready", () => {
		var file = null;
		var subtitles = [];

		engine.files.forEach(f => {
			if (mediarx.test(f.name) &&
					(file == null || f.length > file.length)) {
				file = f;
			} else if (subrx.test(f.name)) {
				subtitles.push(SubtitleFile.fromTorrent(f));
			}
		});

		if (file == null)
			return cb("No media file in the torrent");

		file.select();

		httpStream.readStreamCreator = function(options) {
			var rs = file.createReadStream(options);
			rs.filesize = file.length;
			rs.filename = file.name;

			return rs;
		}

		cb(null, file.length, file.name, subtitles);
	});
}

exports.stop = function() {
	if (engine != null)
		engine.destroy();
}
