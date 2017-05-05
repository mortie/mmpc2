var fs = require("fs");
var AdmZip = require("adm-zip");

var conf;
var subsdir;

module.exports = SubtitleFile;
module.exports.init = init;
module.exports.onTerm = onTerm;
module.exports.fromTorrent = fromTorrent;
module.exports.fromFile = fromFile;
module.exports.fromZip = fromZip;

// Input:
//     unescapedName: Name, will be escapend and such
//     createReadStream: Object with a .pipe(stream) method,
//                       which should pipe its data to the stream
function SubtitleFile(unescapedName, createReadStream) {
	var self = {};

	// Only get the part after the last /,
	// and encode URI component as it'll be sent
	// as a GET request and such
	self.name = unescapedName.match(/\/?([^\/]+)$/)[1];
	self.escapedName = encodeURIComponent(self.name);

	var downloaded = false;
	var path = subsdir+"/"+self.name;

	self.download = function(cb) {
		if (downloaded) {
			cb(path);
		} else {
			var rs = createReadStream();
			var ws = fs.createWriteStream(path);

			rs.pipe(ws);
			ws.on("close", () => {
				cb(path);
			});
		}
	}

	return self;
}

// Input: torrent file from torrent-stream
// Returns: SubtitleFile
function fromTorrent(f) {
	return SubtitleFile(f.name, f.createReadStream.bind(f));
}

// Input: path to subtitle file
// Returns: SubtitleFile
function fromFile(path, name) {
	return SubtitleFile(name || path, () => fs.createReadStream(path));
}

// Input: path to zip file
// Returns: SubtitleFile[]
function fromZip(path) {
	var zip = new AdmZip(path);
	var subs = [];

	function createReadStream(f) {
		var data = zip.readFile(f);

		var rs = {
			pipe: function(ws) {
				ws.write(data);
				ws.end();
			}
		};

		return rs;
	}

	zip.getEntries().forEach(f => {
		if (/\.srt/.test(f.name)) {
			subs.push(SubtitleFile(f.name, () => createReadStream(f)));
		}
	});

	return subs;
}

// Create tmp/subtitles
function init(app, _conf) {
	conf = _conf;
	subsdir = conf.tmpdir+"/subtitles";

	try {
		fs.mkdirSync(subsdir);
	} catch (err) {
		if (err.code !== "EEXIST")
			throw err;
	}
}

// Destroy tmp/subtitles
function onTerm() {
	try {
		fs.readdirSync(subsdir).forEach(f => {
			fs.unlinkSync(subsdir+"/"+f);
		});
		fs.rmdirSync(subsdir);
	} catch (err) {
		if (err.code !== "ENOENT")
			throw err;
	}
}
