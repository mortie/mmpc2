function getRadioVal(name) {
	var btns = document.getElementsByName(name);

	for (var i in btns) {
		var btn = btns[i];
		if (btn.checked)
			return btn.value;
	}

	return null;
}

function timeformat(sec) {
	var d = new Date(null);
	if (typeof sec !== "number") {
		throw "Expected number, got "+(typeof sec);
		return;
	}

	d.setSeconds(Math.floor(sec))
	return d.toISOString().substr(11, 8);
}

var elems = {
	is_playing: $$("#is-playing"),
	progress_text: $$("#progress-text"),
	progress: $$("#progress"),

	pause: $$("#pause"),
	skip_back: $$("#skip-back"),
	skip_forward: $$("#skip-forward"),

	mute: $$("#mute"),
	exit: $$("#exit"),

	volume: $$("#volume"),
	volume_text: $$("#volume-text"),

	sub_delay: $$("#sub-delay"),
	sub_delay_less: $$("#sub-delay-less"),
	sub_delay_less2: $$("#sub-delay-less2"),
	sub_delay_more: $$("#sub-delay-more"),
	sub_delay_more2: $$("#sub-delay-more2"),
	sub_delay_reset: $$("#sub-delay-reset"),

	subtitles_options: $$("#subtitles-options")
};

var state = {};
var oldState = state;

/*
 * Update GUI stuff
 */

function update(state, oldState) {

	// If there's no time_pos, we probably just haven't started yet
	if (state.time_pos === undefined) {
		state.time_pos = 0;
	}

	// If there's no duration, it's probably a live stream
	if (!state.duration) {
		state.livestream = true;
		state.duration = state.time_pos;
	}

	// Playing
	if (state.playing)
		elems.is_playing.innerHTML = "Playing";
	else
		location.href = "/";

	// Progress text
	elems.progress_text.innerHTML =
		timeformat(state.time_pos)+"/"+
		timeformat(state.duration);

	// Progress bar
	elems.progress.value = state.time_pos;
	elems.progress.max = state.duration;

	// Buttons
	elems.pause.className = state.paused ? "small active" : "small";
	elems.mute.className = state.muted ? "small active" : "small";

	// Volume
	elems.volume.min = 0;
	elems.volume.max = state.volume_max;
	elems.volume.value = state.volume;
	elems.volume.step = 5;
	elems.volume_text.innerHTML = state.volume;

	// Sub Delay
	elems.sub_delay.innerHTML = state.sub_delay;

	// Subtitles
	var subChanged = state.subtitle !== oldState.subtitle;
	var noOldSubs = oldState.subtitles === undefined;
	var subsLengthDiffer = oldState.subtitles && 
		oldState.subtitles.length !== state.subtitles.length;

	if (subChanged || noOldSubs || subsLengthDiffer) {
		var opts = elems.subtitles_options;

		// Clear radio buttons
		while (opts.firstChild)
			opts.removeChild(opts.firstChild);

		// Helper to create a radio button
		function btn(name, value, checked) {
			var lbl = document.createElement("label");

			var b = document.createElement("input");
			b.type = "radio";
			b.name = "subtitle";
			b.value = value;
			if (checked)
				b.checked = true;

			var txt = document.createTextNode(name);

			lbl.appendChild(b);
			lbl.appendChild(txt);

			return lbl;
		}

		// Add radio buttons
		opts.appendChild(btn("None", "none", state.subtitle === null));
		state.subtitles.forEach(function(sub) {
			opts.appendChild(btn(
				decodeURIComponent(sub), sub, state.subtitle === sub));
		});
	}
}

function checkState() {
	post("/playback/state", null, function(err, res) {
		if (err)
			return;

		state = JSON.parse(res);
		update(state, oldState);
		oldState = state;
	});
}

checkState();
setInterval(checkState, 500);

/*
 * React to input
 */

function playercmd(ep, args) {
	post("/playback/"+ep+"/"+(args.join("/")), null, function() {
		checkState();
	});
}

function playerset(key, val) {
	playercmd("set", [key, val]);
}

// Set time
elems.progress.addEventListener("click", function(evt) {

	// Doesn't make sense to set the time if it's a live stream
	if (state.livestream)
		return;

	var pos = (evt.clientX - evt.target.offsetLeft) / evt.target.clientWidth;
	pos *= evt.target.max;
	playerset("time-pos", pos);
});

// Toggle pause
elems.pause.addEventListener("click", function() {
	if (state.paused) {
		playerset("pause", "no");
	} else {
		playerset("pause", "yes");
		playerset("time-pos", state.time_pos - 1);
	}
});

// Back 5 seconds
elems.skip_back.addEventListener("click", function() {
	if (state.livestream)
		return;

	playerset("time-pos", state.time_pos - 5);
});

// Forwards 15 seconds
elems.skip_forward.addEventListener("click", function() {
	if (state.livestream)
		return;

	playerset("time-pos", state.time_pos + 15);
});

// Toggle mute
elems.mute.addEventListener("click", function(evt) {
	if (state.muted)
		playerset("mute", "no");
	else
		playerset("mute", "yes");
});

// Exit
elems.exit.addEventListener("click", function(evt) {
	post("/playback/exit", null, function() {});
});

// Set volume
elems.volume.addEventListener("change", function(evt) {
	playerset("volume", evt.target.value);
});
elems.volume.addEventListener("keydown", function(evt) {
	if (evt.keyCode === 37 || evt.keyCode === 40)
		playerset("volume", parseInt(evt.target.value) - parseInt(evt.target.step));
	else if (evt.keyCode === 38 || evt.keyCode === 39)
		playerset("volume", parseInt(evt.target.value) + parseInt(evt.target.step));
});

// Less subtitle delay
elems.sub_delay_less.addEventListener("click", function() {
	playerset("sub-delay", state.sub_delay - 0.1);
});
elems.sub_delay_less2.addEventListener("click", function() {
	playerset("sub-delay", state.sub_delay - 1);
});

// More subtitle delay
elems.sub_delay_more.addEventListener("click", function() {
	playerset("sub-delay", state.sub_delay + 0.1);
});
elems.sub_delay_more2.addEventListener("click", function() {
	playerset("sub-delay", state.sub_delay + 1);
});

// Set subtitle delay to 0
elems.sub_delay_reset.addEventListener("click", function() {
	playerset("sub-delay", 0);
});

// Subtitles
elems.subtitles_options.addEventListener("click", function() {
	var val = getRadioVal("subtitle");

	if (val === state.subtitle || (val === "none" && state.subtitle === null))
		return;

	playercmd("set-subtitle", [val]);
});
