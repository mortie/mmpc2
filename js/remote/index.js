var WSServer = require("ws").Server;
var spawnSync = require("child_process").spawnSync;
var fs = require("fs");

exports.httpPath = "/remote";

function xdo(cmds) {
	var res = spawnSync("xdotool", cmds);
	if (res.status !== 0)
		throw "Couldn't run xdotool: "+(res.error || res.staus);
}

function mktemp(ext) {
	var format = "/tmp/mmpc2-XXXXXXXX";
	if (ext)
		format += ext;

	var res = spawnSync("mktemp", [format]);
	if (res.status === 0)
		return res.stdout.toString().trim();
	else
		throw "Couldn't create temporary file: "+(res.error || res.status);
}
function screenshot(path) {
	var res = spawnSync("import", [
		"-window", "root",
		path
	]);
	if (res.status !== 0)
		throw "Couldn't run import: "+(res.error || res.status);
}

var handlers = {
	type: function(data) {
		xdo(["type", data.chars]);
		xdo(["key", "Return"]);
	},

	key: function(data) {
		xdo(["key", data.key]);
	},

	mousemove: function(data) {
		xdo(["mousemove", data.x, data.y]);
	},

	mousedown: function(data) {
		xdo(["mousedown", data.btn]);
	},

	mouseup: function(data) {
		xdo(["mouseup", data.btn]);
	},

	click: function(data) {
		xdo(["click", data.btn]);
	}
}

var sockets = [];
function broadcast(name) {
	sockets.forEach(sock => {
		if (sock)
			sock.send(name);
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

	var screenshotFile = mktemp(".jpg");
	screenshot(screenshotFile);
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
			screenshot(screenshotFile);
			broadcast("reload-screenshot");
		}
	}, 1000);
}
