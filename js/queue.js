module.exports = function() {
	var self = {};

	var cbs = [];
	var arr = [];

	self.push = function(val) {
		if (cbs.length > 0) {
			cbs.shift()(val);
		} else {
			arr.push(val);
		}
	}

	self.dequeue = function(cb) {
		if (arr.length > 0) {
			cb(arr.shift());
		} else {
			cbs.push(cb);
		}
	}

	return self;
}
