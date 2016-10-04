var elems = {
	screen: $$("#screen"),
	keyboard_form: $$("#keyboard-form"),
	keyboard: $$("#keyboard"),
	backspace: $$("#backspace"),
	space: $$("#space"),

	log: $$("#log")
};

function log() {
	for (var i in arguments) {
		elems.log.innerHTML += arguments[i] + "<br>";
	}
}

// Reload the screenshot once in a while
(function() {
	var screenSrc = elems.screen.src;
	socket.on("reload-screenshot", function() {
		elems.screen.src = screenSrc+"?"+(new Date().getTime());
	});
})();

// Touch controls on the image
var touched;
var contexted = false;
(function() {
	var nTouchPoints = 0;
	var start;
	var prev;
	var moved = false;
	elems.screen.addEventListener("touchstart", function(evt) {
		touched = true;
		contexted = false;
		nTouchPoints += 1;
		if (nTouchPoints === 1) {
			start = evt.changedTouches[0];
			prev = evt.changedTouches[0];
		}
	});
	elems.screen.addEventListener("touchend", function(evt) {
		nTouchPoints -= 1;
		if (!moved && !contexted) {
			console.log("emitting click");
			socket.emit("click", { btn: nTouchPoints + 1 });
			moved = true;
		}

		if (nTouchPoints === 0)
			moved = false;

		setTimeout(function() { touched = false; }, 100);
	});
	elems.screen.addEventListener("touchmove", function(evt) {
		if (nTouchPoints !== 1)
			return;

		var curr = evt.changedTouches[0];

		if (!moved &&
			Math.abs(curr.clientX - start.clientX) < 24 &&
				Math.abs(curr.clientY - start.clientY) < 24) {
					return;
				}

		moved = true;
		evt.preventDefault();

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
		if (touched) return;
		down = true;
		mouse.setPosScaled(evt.clientX, evt.clientY);
		socket.emit("mousedown", { btn: 1 });
	});
	elems.screen.addEventListener("mousemove", function(evt) {
		if (touched) return;
		mouse.setPosScaled(evt.clientX, evt.clientY);
	});
	window.addEventListener("mouseup", function(evt) {
		if (touched) return;
		if (down) {
			mouse.setPosScaled(evt.clientX, evt.clientY);
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

elems.backspace.addEventListener("click", function() {
	socket.emit("key", { key: "BackSpace" });
});

elems.space.addEventListener("click", function() {
	socket.emit("key", { key: "Space" });
});
