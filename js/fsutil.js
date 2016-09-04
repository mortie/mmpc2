var fs = require("fs");
var pathlib = require("path");

/*
 * Move a file by copying it, to let it move across devices
 */
exports.move = function(src, dst, cb) {
	var ws;
	try {
		ws = fs.createWriteStream(dst);
	} catch (err) { return cb(err) }

	var rs;
	try {
		rs = fs.createReadStream(src);
	} catch (err) { return cb(err) }

	rs
		.on("data", d => ws.write(d))
		.on("end", () => {
			ws.end();
			cb();
		})
		.on("error", cb);
}

/*
 * Remove directory, deleting its content in the process
 */
exports.rmdir = function(dir) {
	try {
		fs.accessSync(dir, fs.F_OK)
	} catch (err) {
		console.log(err.toString());
		return;
	}

	fs.readdirSync(dir).forEach(f => {
		var fname = pathlib.join(dir, f);

		var stat = fs.statSync(fname);
		if (stat.isDirectory())
			exports.rmdir(fname);
		else
			fs.unlinkSync(fname)
	});

	fs.rmdir(dir);
}
