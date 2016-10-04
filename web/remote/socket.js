(function() {
	window.socket = {};

	var url = "ws://"+location.host;

	var sock = new WebSocket(url);
	var open = false;
	var cbs = {};
	var emitQueue = [];

	socket.emit = function(name, data) {
		var str = JSON.stringify({
			name: name,
			data: data || {}
		});

		if (open)
			sock.send(str);
		else
			emitQueue.push(str);
	}

	socket.on = function(name, fn) {
		if (!cbs[name])
			cbs[name] = [];

		cbs[name].push(fn);
	}

	function onopen() {
		open = true;
		emitQueue.forEach(function(str) {
			sock.send(str);
		});
	}
	function onmessage(msg) {
		var arr = cbs[msg.data];
		if (arr)
			arr.forEach(function(fn) { fn(); });
		else
			console.log("Warning: no listener for", msg.data);
	}
	function onclose() {
		open = false;

		setTimeout(function() {
			sock = new WebSocket(url);
			sock.onopen = onopen;
			sock.onerror = sock.onclose = onclose;
			sock.onmessage = onmessage;
		}, 2000);
	}

	sock.onopen = onopen;
	sock.onerror = sock.onclose = onclose;
	sock.onmessage = onmessage;
})();
