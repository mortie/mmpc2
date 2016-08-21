var OpenSubtitles = require("opensubtitles-api");
var fs = require("fs");
var http = require("http");
var urllib = require("url");

var subs = new OpenSubtitles({ useragent: "mmpc-media-streamer" });

var conf;

exports.init = function(app, _conf) {
	conf = _conf;
}

exports.find = function(filesize, filename, cb) {
	if (!conf.subtitles)
		return cb();

	var subFile = conf.tmpdir+"/subs.srt";
	try {
		fs.unlinkSync(subFile);
	} catch (err) {}

	subs.search({
		sublanguageid: conf.subtitles,
		filesize: filesize,
		filename: filename
	}).then(subtitles => {
		var sub = subtitles[conf.subtitles];
		if (!sub || !sub.url)
			return cb();

		try {
			var ws = fs.createWriteStream(subFile);
		} catch (err) {
			console.trace(err);
			cb();
		}

		http.request(urllib.parse(sub.url), res => {
			res.pipe(ws);

			res
				.on("error", err => {
					console.trace(err);
					cb();
				})
				.on("end", () => {
					ws.close();
					cb(subFile);
				});
		}).end();
	});
}
