var spawn = require("child_process").spawn;
var fs = require("fs");
var net = require("net");
var Queue = require("../queue");

exports.httpPath = "/playback";

var child = null;

var ipcServer = process.cwd()+"/mpv-ipc-socket";

function cmd(params, cb) {
	if (child == null || child.sock == null)
		return;

	child.sock.write(JSON.stringify({
		command: params
	})+"\n");

	child.msgqueue.dequeue(obj => {
		if (cb)
			cb(obj);
	});
}

function getState(cb) {
	if (child == null) {
		cb({
			playing: false,
			paused: false,
			muted: false,
			duration: 0,
			time_pos: 0,
			volume: 0,
			volume_max: 0
		});
		return;
	}

	var state = {
		playing: true
	};

	var cbs = 6;
	function next() {
		cbs -= 1;
		if (cbs === 0)
			cb(state);
	}

	cmd(["get_property", "pause"], res => {
		state.paused = res.data;
		next();
	});

	cmd(["get_property", "mute"], res => {
		state.muted = res.data;
		next();
	});

	cmd(["get_property", "duration"], res => {
		state.duration = res.data;
		next();
	});

	cmd(["get_property", "time-pos"], res => {
		state.time_pos = res.data;
		next();
	});

	cmd(["get_property", "volume"], res => {
		state.volume = res.data;
		next();
	});

	cmd(["get_property", "volume-max"], res => {
		state.volume_max = res.data;
		next();
	});
}

exports.isPlaying = function() {
	return child != null;
}

exports.play = function(path, subFile, cb) {
	exports.stop();

	var args = [
		path,
		"--no-cache-pause",
		"--no-resume-playback",
		"--input-ipc-server", ipcServer
	];

	if (subFile) {
		args.push("--sub-file");
		args.push(subFile);
	}

	var lchild = spawn("mpv", args, { stdio: "inherit" });
	child = lchild;

	lchild.running = true;

	lchild.once("close", () => {
		if (lchild.running) exports.stop();
	});
	lchild.on("error", err => console.error(err.toString()));

	lchild.state = {};
	lchild.msgqueue = Queue();

	lchild.initTimeout = setTimeout(() => {
		// Create socket
		lchild.sock = net.connect(ipcServer, () => {

			// Add output from mpv to the queue
			lchild.sock.on("data", d => {
				d.toString().split("\n").forEach(str => {
					if (str == "") return;
					var obj = JSON.parse(str);
					if (obj.event) return;
					lchild.msgqueue.push(obj);
				});
			});

			lchild.sock.on("error", err => console.trace(err));

			cmd(["set_property", "fullscreen", "yes"]);

			cb();
		});
	}, 1000);
}

exports.stop = function() {
	if (child) {
		child.running = false;
		child.kill("SIGKILL");
		clearTimeout(child.initTimeout);
		child = null;

		exports.onstop();
	}
	try {
		fs.unlinkSync(ipcServer);
	} catch (err) {}
}

exports.init = function(app) {
	function evt(p, cb) {
		app.post(exports.httpPath+"/"+p, (req, res) => cb(req, res));
	}

	evt("exit", (req, res) => { res.end(); exports.stop() });

	evt("state", (req, res) => {
		getState((state) => {
			res.json(state);
		});
	});

	evt("set/:key/:val", (req, res) => {
		cmd(["set_property", req.params.key, req.params.val]);
		res.end();
	});
}
