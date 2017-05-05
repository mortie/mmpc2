var http = require("http");
var https = require("https");
var urllib = require("url");

module.exports = function(url, cb) {
	var urlobj = urllib.parse(url);
	var o = urlobj.protocol === "https:" ? https : http;

	o.request(urlobj, rs => {
		cb(rs);
	}).end();
}

module.exports.read = function(url, cb) {
	module.exports(url, function(rs) {
		var str = "";

		rs.on("data", d => str += d);
		rs.on("error", err => cb(err));
		rs.on("end", () => cb(null, str));
	});
}
