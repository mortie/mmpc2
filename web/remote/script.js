var elems = {
	screen: $$("#screen"),
	screen_img: $$("#screen-img"),
	keyboard_form: $$("#keyboard-form"),
	keyboard: $$("#keyboard"),
	backspace: $$("#backspace"),
	space: $$("#space")
};

// Reload the screenshot once in a while
(function() {
	var screenSrc = elems.screen_img.src;
	socket.on("reload-screenshot", function() {
		elems.screen_img.src = screenSrc+"?"+(new Date().getTime());
	});
})();

// Touch controls on the image
var touched = false;
var contexted = false;
(function() {
	var nTouchPoints = 0;
	var maxTouchPoints = 0;
	var start;
	var prev;
	var moved = false;
	var touchendTimeout;
	elems.screen.addEventListener("touchstart", function(evt) {
		clearTimeout(touchendTimeout);
		touched = true;
		contexted = false;
		nTouchPoints += evt.changedTouches.length;
		if (nTouchPoints === 1) {
			start = evt.changedTouches[0];
			prev = evt.changedTouches[0];
		}

		if (nTouchPoints > maxTouchPoints)
			maxTouchPoints = nTouchPoints;
	});
	elems.screen.addEventListener("touchcancel", function(evt) {
		nTouchPoints -= evt.changedTouches.length;

		if (nTouchPoints === 0) {
			maxTouchPoints = 0;

			clearTimeout(touchendTimeout);
			touchendTimeout = setTimeout(function() {
				touched = false;
			}, 500);
		}
	});
	elems.screen.addEventListener("touchend", function(evt) {
		nTouchPoints -= evt.changedTouches.length;

		if (!moved && !contexted) {
			socket.emit("click", { btn: maxTouchPoints });
			moved = true;
		}

		if (nTouchPoints === 0) {
			maxTouchPoints = 0;
			moved = false;

			clearTimeout(touchendTimeout);
			touchendTimeout = setTimeout(function() {
				touched = false;
			}, 500);
		}
	});
	elems.screen.addEventListener("touchmove", function(evt) {
		if (maxTouchPoints !== 1)
			return;

		var curr = evt.changedTouches[0];

		evt.preventDefault();

		if (!moved &&
				Math.abs(curr.clientX - start.clientX) < 10 &&
				Math.abs(curr.clientY - start.clientY) < 10) {
			return;
		} else if (!moved) {
			moved = true;
			prev = curr;
			return;
		}

		function f(n) {
			var pow = 1.5;

			var sign = n < 0 ? -1 : 1;
			return Math.pow(Math.abs(n), pow) * sign;
		}

		var dx = curr.clientX - prev.clientX;
		var dy = curr.clientY - prev.clientY;
		mouse.addPos(f(dx), f(dy));

		prev = curr;
	});
})();

// Mouse controls on the image
(function() {
	var down = false;
	elems.screen.addEventListener("mousedown", function(evt) {
		evt.preventDefault();
		if (touched) return;
		if (evt.buttons !== 1) return;

		down = true;
		mouse.setPosScaled(evt.clientX, evt.clientY);
		socket.emit("mousedown", { btn: 1 });
	});
	elems.screen.addEventListener("mousemove", function(evt) {
		evt.preventDefault();
		if (touched) return;

		mouse.setPosScaled(evt.clientX, evt.clientY);
	});
	window.addEventListener("mouseup", function(evt) {
		if (touched) return;

		if (down) {
			socket.emit("mouseup", { btn: 1 });
			down = false;
		}
	});
	elems.screen.addEventListener("contextmenu", function(evt) {
		contexted = true;
		evt.preventDefault();
		socket.emit("click", { btn: 3 });
	});
})();

// Button controls

elems.keyboard_form.addEventListener("submit", function(evt) {
	evt.preventDefault();

	socket.emit("type", {
		chars: elems.keyboard.value
	});
	elems.keyboard.value = "";
	elems.keyboard.blur();
});

elems.keyboard.addEventListener("keydown", function(evt) {
	evt.stopPropagation();
	if (evt.keyCode === 27)
		elems.keyboard.blur();
});

elems.space.addEventListener("click", function() {
	socket.emit("key", { key: "space" });
});

elems.backspace.addEventListener("click", function() {
	socket.emit("key", { key: "BackSpace" });
});

// Keyboard controls

window.addEventListener("keydown", function(evt) {
	if (evt.keyCode === 32) {
		socket.emit("key", { key: "space" });
	} else if (evt.keyCode === 13) {
		socket.emit("key", { key: "Return" });
	} else if (evt.keyCode === 8) {
		socket.emit("key", { key: "BackSpace" });
	} else {
		elems.keyboard.focus();
	}
});
