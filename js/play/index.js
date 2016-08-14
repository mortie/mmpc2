var player = require("./player.js");

exports.init = function(app) {
	player.init(app);
}

exports.playFile = function(path, cb) {
	player.play(path, cb);
}

exports.isPlaying = player.isPlaying;
