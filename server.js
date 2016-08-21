var fs = require("fs");
var web = require("webstuff");
var play = require("./js/play");

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
