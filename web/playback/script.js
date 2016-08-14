function timeformat(sec) {
	var d = new Date(null);
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
};

var state = {};

/*
 * Update GUI stuff
 */

function update(state) {

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
	elems.pause.className = state.paused ? "active" : "";
	elems.mute.className = state.muted ? "active" : "";

	// Volume
	elems.volume.min = 0;
	elems.volume.max = state.volume_max;
	elems.volume.value = state.volume;
	elems.volume.step = 5;
	elems.volume_text.innerHTML = state.volume+"%";
}

function checkState() {
	post("/playback/state", null, function(err, res) {
		if (err)
			return;

		state = JSON.parse(res);
		update(state);
	});
}

checkState();
setInterval(checkState, 500);

/*
 * React to input
 */

function playerset(key, val) {
	post("/playback/set/"+key+"/"+val, null, function() {
		checkState();
	});
}

// Set time
elems.progress.addEventListener("click", function(evt) {
	var pos = (evt.clientX - evt.target.offsetLeft) / evt.target.clientWidth;
	pos *= evt.target.max;
	playerset("time-pos", pos);
});

// Toggle pause
elems.pause.addEventListener("click", function() {
	if (state.paused)
		playerset("pause", "no");
	else
		playerset("pause", "yes");
});

// Back 15 seconds
elems.skip_back.addEventListener("click", function() {
	playerset("time-pos", state.time_pos - 15);
});

// Forwards 15 seconds
elems.skip_forward.addEventListener("click", function() {
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
