var fs = require("fs");
var pathlib = require("path");
var web = require("webstuff");
var notify = require("./js/notify");
var fsutil = require("./js/fsutil");
var play = require("./js/play");
var remote = require("./js/remote");
var local = require("./js/local");

var conf = JSON.parse(fs.readFileSync("conf.json"));

try {
	fsutil.rmdir(conf.tmpdir)
} catch (err) {
	if (err.code !== "ENOENT")
		throw err;
}

try {
	fs.mkdirSync(conf.tmpdir);
} catch (err) {
	if (err.code !== "EEXIST")
		throw err;
}

var app = web({
	reload: false
});
play.init(app, conf);
remote.init(app, conf);
local.init(app, conf);

app.static("web");

app.post("/play/url", (req, res) => {
	play.redirectTo("/");
	req.parseBody((err, fields) => {
		if (!fields.url)
			return res.redirect("/");

		function cb() {
			res.redirect(play.httpPath);
		}

		if (fields.url.indexOf("magnet:") === 0) {
			play.playTorrent(fields.url, cb);
		} else if (fields.url.indexOf("/torrent") !== -1) {
			play.playTorrentPage(fields.url, cb);
		} else {
			play.playUrl(fields.url, cb);
		}
	});
});

app.post("/play/file", (req, res) => {
	player.redirectTo("/");
	notify("Receiving file...");
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

app.get("/additional-links", (req, res) => {
	res.json(conf.additional_links);
});

app.get("/is-playing", (req, res) => {
	res.json(play.isPlaying());
});

var termed = false;
function onTerm() {
	if (termed)
		return;
	termed = true;

	// Run exit handlers
	remote.onTerm();
	play.onTerm();
	local.onTerm();

	process.exit();
}

process.on("exit", onTerm);
process.on("SIGINT", onTerm);
process.on("SIGTERM", onTerm);

process.on("uncaughtException", err => {
	console.trace(err);
	onTerm();
});
