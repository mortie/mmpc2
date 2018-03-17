var OpenSubs = require("opensubtitles-api");

var subs = new OpenSubs({ useragent: "mmpc-media-streamer" });

exports.find = function(opts, cb) {
	subs.search({ query: opts.filename }).then(subtitles => {
		var arr = [];
		for (var i in subtitles) {
			arr.push(subtitles[i]);
		}
		cb(arr);
	}).catch(err => {
		console.log("Couldn't find subtitles from opensubtitles:");
		console.log(err);
		cb([]);
	});
}

