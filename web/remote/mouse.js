var mouse = {
	elem: $$("#screen-img"),
	cursor: $$("#screen-cursor"),

	x: 0,
	y: 0,
	px: 0,
	py: 0,

	maxx: 1920 - 1,
	maxy: 1080 - 1,

	setPos: function(x, y) {
		this.px = this.x;
		this.py = this.y;
		x = Math.round(x);
		if (x < 0) x = 0;
		if (x > this.maxx) x = this.maxx;
		y = Math.round(y);
		if (y < 0) y = 0;
		if (y > this.maxy) y = this.maxy;

		if (x !== this.x || y !== this.y) {
			this.x = x;
			this.y = y;
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
	update: function() {
		socket.emit("mousemove", {
			x: this.x,
			y: this.y
		});

		var cx = this.elem.offsetLeft +
			(this.x / (this.maxx / this.elem.offsetWidth));
		var cy = this.elem.offsetTop +
			(this.y / (this.maxy / this.elem.offsetHeight));

		this.cursor.style.transform = "translate("+cx+"px, "+cy+"px)";

		setTimeout(this.update.bind(this), 1000 / 60);
	}
};
mouse.setPos(mouse.maxx / 2, mouse.maxy / 2);
mouse.update();
