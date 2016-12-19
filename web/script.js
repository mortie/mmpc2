get("/additional-links", function(err, res) {
	if (err)
		return console.trace(err);

	JSON.parse(res).forEach(function(link) {
		var form = document.createElement("form");
		form.className = "part";
		form.method = link.method || "get";
		form.action = link.url;

		var btn = document.createElement("button");
		btn.className = "link";
		btn.innerHTML = link.name;
		form.appendChild(btn);

		$$("#parts").appendChild(form);
	});
});

get("/is-playing", function(err, res) {
	if (JSON.parse(res)) {
		if (confirm("Go to player controls?"))
			location.pathname = "/playback";
	}
});
