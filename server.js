var web = require("webstuff");
var play = require("./js/play");

var app = web();
play.init(app);

app.express.use((req, res, next) => {
	if (req.url === "/" && play.isPlaying())
		res.redirect("/playback");
	else
		next();
});

app.static("web");

app.post("/plaything", (req, res) => {
	play.playFile("/home/martin/Documents/Assassination Classroom - E01.mkv", () => {
		res.redirect("/playback");
	});
});

