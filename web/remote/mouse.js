var mouse = {
	elem: $$("#screen-img"),

	x: 0,
	y: 0,

	vx: 0,
	vy: 0,

	maxx: 1920 - 1,
	maxy: 1080 - 1,

	addVel: function(x, y) {
		this.vx += x;
		this.vy += y;
	},

	setPos: function(x, y) {
		x = Math.round(x);
		if (x < 0) x = 0;
		if (x > this.maxx) x = this.maxx;
		y = Math.round(y);
		if (y < 0) y = 0;
		if (y > this.maxy) y = this.maxy;

		if (x !== this.x || y !== this.y) {
			this.x = x;
			this.y = y;
			this.update();
		}
	},

	setPosScaled: function(x, y) {
		var mx = x - this.elem.offsetLeft;
		var my = y - this.elem.offsetTop;
		var sx = this.maxx / this.elem.offsetWidth;
		var sy = this.maxy / this.elem.offsetHeight;

		this.setPos(mx * sx, my * sy);
	},

	addPos: function(x, y) {
		this.setPos(this.x + x, this.y + y);
	},

	// Update at most once every x milliseconds
	updated: false,
	timeoutSet: false,
	update: function() {
		if (this.updated && !this.timeoutSet) {
			this.timeoutSet = true;
			setTimeout(function() {
				this.updated = false;
				this.timeoutSet = false;
				this.update();
			}.bind(this), 100);
		} else {
			this.updated = true;
			socket.emit("mousemove", {
				x: this.x,
				y: this.y
			});
		}
	}
};
mouse.setPos(mouse.maxx / 2, mouse.maxy / 2);
