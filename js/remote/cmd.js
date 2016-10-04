var spawnSync = require("child_process").spawnSync;

exports.xdo = xdo;
exports.mktemp = mktemp;
exports.screenshot = screenshot;

function run(name, args) {
	var res = spawnSync(name, args);

	if (res.status === 0) {
		return res.stdout.toString();
	} else {
		var err = "Error with command "+name+" "+
			args.map(a => "'"+a+"'").join(" ")+
			":\n" +
			res.error || res.stderr.toString() || res.status;

		throw err;
	}
}

function xdo(cmds) {
	return run("xdotool", cmds);
}

function mktemp(ext) {
	var format = "/tmp/mmpc2-XXXXXXXX";
	if (ext)
		format += ext;

	return run("mktemp", [format]).trim();
}

function screenshot(path) {
	return run("import", [
		"-window", "root",
		path
	]);
}

