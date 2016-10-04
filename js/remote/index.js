var WSServer = require("ws").Server;
var spawnSync = require("child_process").spawnSync;
var fs = require("fs");

var cmd = require("./cmd");

exports.httpPath = "/remote";

var handlers = {
	type: function(data) {
		cmd.xdo(["type", data.chars]);
		cmd.xdo(["key", "Return"]);
	},

	key: function(data) {
		cmd.xdo(["key", data.key]);
	},

	mousemove: function(data) {
		cmd.xdo(["mousemove", data.x, data.y]);
	},

	mousedown: function(data) {
		cmd.xdo(["mousedown", data.btn]);
	},

	mouseup: function(data) {
		cmd.xdo(["mouseup", data.btn]);
	},

	click: function(data) {
		cmd.xdo(["click", data.btn]);
	}
}

var sockets = [];
function broadcast(name) {
	sockets.forEach((sock, i) => {
		if (sock) {
			try {
				sock.send(name);
			} catch (err) {
				sockets[i] = undefined;
			}
		}
	});
}

exports.init = function(app, conf) {
	var server = new WSServer({ server: app.server });

	var nSockets = 0;

	server.on("connection", socket => {
		nSockets += 1;
		var id = sockets.length;
		sockets[id] = socket;

		socket.on("disconnect", () => {
			nSockets -= 1
			sockets[id] = undefined;
		});
		socket.on("close", () => {
			sockets[id] = undefined;
		});

		socket.on("message", (data) => {
			var obj;
			try {
				obj = JSON.parse(data);
			} catch (err) {
				console.trace(err);
			}

			if (!obj.name || !obj.data)
				return console.trace("Missing name or data property");

			var fn = handlers[obj.name];
			if (!fn)
				return console.trace("No handler for event '"+obj.name+"'");

			fn(obj.data);
		});
	});

	var screenshotFile = cmd.mktemp(".jpg");
	cmd.screenshot(screenshotFile);
	app.get("/remote/screenshot", (req, res) => {
		res.writeHead(200, {
			"Cache-Control": "no-store, must-revalidate",
			"Pragma": "no-cache",
			"Expires": "0",
			"Content-Type": "image/jpg"
		});
		fs.createReadStream(screenshotFile)
			.pipe(res);
	});

	setInterval(() => {
		if (nSockets > 0) {
			cmd.screenshot(screenshotFile);
			broadcast("reload-screenshot");
		}
	}, 1000);

	function onTerm() {
		fs.unlinkSync(screenshotFile);
	}

	exports.onTerm = onTerm;
}
