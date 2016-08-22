var fs = require("fs");
var pathlib = require("path");
var web = require("webstuff");
var play = require("./js/play");
var fsutil = require("./js/fsutil");

var conf = JSON.parse(fs.readFileSync("conf.json"));

var app = web();
play.init(app, conf);

app.express.use((req, res, next) => {
	if (req.url === "/" && play.isPlaying())
		res.redirect(play.httpPath);
	else
		next();
});

app.static("web");

app.post("/play/url", (req, res) => {
	req.parseBody((err, fields) => {
		if (!fields.url)
			return res.redirect("/");

		play.playUrl(fields.url, () => {
			res.redirect(play.httpPath);
		});
	});
});

app.post("/play/magnet", (req, res) => {
	req.parseBody((err, fields) => {
		if (!fields.magnet)
			return res.redirect("/");

		play.playTorrent(fields.magnet, () => {
			res.redirect(play.httpPath);
		});
	});
});

app.post("/play/file", (req, res) => {
	req.parseBody((err, fields, files) => {
		var file = files.file;

		if (file == null || !file.name || file.size === 0)
			return res.redirect("/");

		var fname = conf.tmpdir+"/uploaded-file"+pathlib.extname(file.name);
		fsutil.move(file.path, fname, err => {
			if (err) {
				console.trace(err);
				return res.redirect("/");
			}

			play.cleanupFiles.push(fname);

			play.playFile(fname, () => {
				res.redirect(play.httpPath);
			}, file.name);
		});
	});
});
