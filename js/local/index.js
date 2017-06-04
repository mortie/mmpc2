var fs = require("fs");
var mime = require("mime");
var pathlib = require("path");
var play = require("../play");

exports.httpPath = "/local";

exports.init = function(app, conf) {
	app.get(exports.httpPath+"/files/:dir", (req, res) => {
		var dir = pathlib.join(
			conf.local_media,
			decodeURIComponent(req.params.dir));

		fs.readdir(dir, (err, files) => {
			if (err)
				return res.json({ err: err.toString() });

			files.sort();

			var arr = [];
			files.forEach(file => {
				if (file[0] === ".")
					return;

				var path = pathlib.join(dir, file);

				var stat;
				try {
					stat = fs.statSync(path);
				} catch (err) {
					return res.json({ err: err.toString() });
				}

				var type = mime.lookup(path);
				if (
					!stat.isDirectory() &&
					type.indexOf("video") !== 0 &&
					type.indexOf("audio") !== 0)
					return;

				arr.push({
					name: file,
					type: stat.isDirectory() ? "dir" : "file",
					path: path,
				});
			});

			res.json(arr);
		});
	});

	app.post(exports.httpPath+"/play/:cb/:path", (req, res) => {
		play.redirectTo(req.params.cb);
		play.playFile(req.params.path, () => {
			res.redirect(play.httpPath);
		});
	});
}

exports.onTerm = function() {
}
