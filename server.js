var fs = require("fs");
var web = require("webstuff");
var play = require("./js/play");

var magnet = "magnet:?xt=urn:btih:13241fe16a2797b2a41b7822bde970274d6b687c&dn=Mad+Max%3A+Fury+Road+%282015%29+1080p+BrRip+x264+-+YIFY&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Fzer0day.ch%3A1337&tr=udp%3A%2F%2Fopen.demonii.com%3A1337&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Fexodus.desync.com%3A6969";

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
