var spawn = require("child_process").spawn;

module.exports = function(name, msg) {
	var args = ["--urgency", "low"];
	args.push(name);
	if (msg) args.push(msg);

	spawn("notify-send", args);
}
