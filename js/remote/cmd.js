var spawn = require("child_process").spawn;
var spawnSync = require("child_process").spawnSync;

exports.xdo = xdo;
exports.mktemp = mktemp;
exports.screenshot = screenshot;

function errStr(name, args, child) {
	return  "Error with command "+name+" "+
		args.map(a => "'"+a+"'").join(" ")+
		":\n" +
		child.error || child.stderr.toString() || child.status;
}

function run(name, args, cb) {
	var child = spawn(name, args);
	child.on("close", code => {
		if (code === 0) {
			if (cb)
				cb(child.stdout.toString());
		} else {
			throw errStr(name, args, child);
		}
	});
}

function runSync(name, args) {
	var child = spawnSync(name, args);

	if (child.status === 0)
		return child.stdout.toString();
	else
		throw errStr(name, args, child);
}

function xdo(cmds, cb) {
	return run("xdotool", cmds, cb);
}

function mktemp(ext) {
	var format = "/tmp/mmpc2-XXXXXXXX";
	if (ext)
		format += ext;

	return runSync("mktemp", [format]).trim();
}

function screenshot(path, cb) {
	return run("import", [
		"-window", "root",
		path
	], cb);
}

