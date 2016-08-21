var mime = require("mime");

/*
 * Must be set to a function which takes an options argument with
 * 'start' and 'end', and returns a readStream.
 * The readStream must have the additional properties
 * 'filesize' and 'filename' set.
 */
exports.readStreamCreator = null;

exports.httpPath = "/http-stream";

exports.init = function(app) {
	app.get("/http-stream", (req, res) => {
		if (exports.readStreamCreator == null) {
			res.writeHead(500);
			throw "readStreamCreator not set!";
		}

		var rs;
		var parts = [];
		if (req.headers.range) {
			parts = req.headers.range.replace("bytes=", "").split("-");
			var start = parseInt(parts[0]);
			var end = parseInt(parts[1]);
			var options = {};
			if (!isNaN(start)) options.start = start;
			if (!isNaN(end)) options.end = end;
			rs = exports.readStreamCreator(options);
		} else {
			rs = exports.readStreamCreator();
		}

		var start = parseInt(parts[0])  || 0;
		var end = parts[1] ? parseInt(parts[1]) : rs.filesize - 1;
		var chunksize = end - start + 1;

		if (chunksize > rs.filesize || start > end || end >= rs.filesize) {
			res.writeHead(416);
			res.end("Range not satisfiable. Start: "+start+", end: "+end);
			return;
		}

		res.writeHead(req.headers.range ? 206 : 200, {
			"icy-name": rs.filename,
			"content-length": chunksize,
			"content-type": mime.lookup(rs.filename),
			"content-range": "bytes "+start+"-"+end+"/"+rs.filesize,
			"accept-ranges": "bytes"
		});

		if (req.method === "HEAD")
			return res.end();

		rs.pipe(res);
	});
}

exports.stop = function() {
	exports.readStreamCreator = null;
}
