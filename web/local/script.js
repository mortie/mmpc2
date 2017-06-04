var currdir;

function fileList(dir, cb) {
	dir = encodeURIComponent(dir);
	get("/local/files/"+dir, function(err, res) {
		if (err)
			return cb(err);

		var obj = JSON.parse(res);
		if (obj.err)
			return cb(obj.err);

		cb(null, obj);
	});
}

function elPathComponent(path) {
	var name;
	if (path === "/") {
		name = "/";
	} else {
		var arr = path.split("/");
		var j = 1;
		do {
			name = arr[arr.length - j++];
		} while (name == "");
		name += "/";
	}

	var el = document.createElement("a");
	el.href = "#"+path;
	el.innerText = name;
	var span = document.createElement("span");
	span.className = "component";
	span.appendChild(el);
	return span;
}

function elFile(file) {
	var form = document.createElement("form");
	form.className = "entry";
	form.action = "/local/play/"+
		encodeURIComponent(location.href)+"/"+
		encodeURIComponent(file.path);
	form.method = "post";

	var el = document.createElement("a");
	el.className = "file";
	el.innerText = file.name;
	el.href = "javascript:void";
	el.onclick = form.submit.bind(form);

	form.appendChild(el);

	return form;
}

function elDir(file) {
	var el = document.createElement("a");
	el.className = "dir";
	el.innerText = file.name+"/";
	el.href = "#"+currdir+file.name+"/";

	var div = document.createElement("div");
	div.className = "entry";
	div.appendChild(el);
	return div;
}

function createPath(dir) {
	console.log("dir is", dir);
	$$("#path").innerHTML = "";

	var exitBtn = document.createElement("span");
	exitBtn.className = "component";
	var exitBtnA = document.createElement("a");
	exitBtnA.innerText = "exit";
	exitBtnA.href = "/";
	exitBtn.appendChild(exitBtnA);
	$$("#path").appendChild(exitBtn);

	for (var i = 0; i < dir.length; ++i) {
		if (dir[i] === "/") {
			var part = dir.substr(0, i + 1);

			var sep = document.createElement("span");
			sep.className = "component";
			sep.innerText = ">";

			$$("#path").appendChild(sep);
			$$("#path").appendChild(elPathComponent(part))

			first = false
		}
	}
}

var changingHash = false;
function listDir(dir, changehash) {
	currdir = dir;
	if (changehash) {
		changingHash = true;
		location.hash = dir;
	}

	createPath(dir);

	$$("#content").innerHTML = "";
	fileList(currdir, function(err, files) {
		if (err)
			return alert(err);

		files.forEach(function(file) {
			if (file.type !== "dir") return;
			$$("#content").appendChild(elDir(file));
		});
		files.forEach(function(file) {
			if (file.type !== "file") return;
			$$("#content").appendChild(elFile(file));
		});
	});
}

if (location.hash) {
	listDir(location.hash.substr(1));
} else {
	listDir("/", true);
}

window.addEventListener("hashchange", function() {
	if (changingHash)
		return changingHash = false;

	listDir(location.hash.substr(1));
});
