# MMPC2

The second version of Mort's Media PC.

## Goal

MMPC2 is meant to be running constantly on a HTPC, letting you stream media to
a TV and control the playback remotely, all through a web interface. It allows
you to stream three kinds of movies:

* URLs - YouTube, Vimeo, Dailymotion, plain HTTP streams, anything supported by
  mpv and youtube-dl.
* Magnet Links - Stream any torrent.
* Files - Upload files and have them play.

For magnet links and files, subtitles will automatically be downloaded if you
want and subtitles exist for it in OpenSubtitles.

## Installation

Install git, a recent version of node, and npm, clone the repository, run `npm
install`, copy `conf.json.example` to `conf.json`, and run `node server.js`.

	git clone https://github.com/mortie/mmpc2.git
	cd mmpc2
	npm install
	cp conf.json.example
	node server.js

### Getting a recent version of node.js

Many distros ship old versions of node, which won't work with MMPC2. To fix
this, install node.js and npm (`sudo apt-get install nodejs-legacy npm` on
Debian and Ubuntu), then install `n` and install a new version of node with
that.

	sudo apt-get install nodejs-legacy npm
	sudo npm install -g n
	sudo n stable

With rolling release distros, the version of node in the package manager will
generally be new enough - e.g `sudo pacman -S npm node` in arch is enough.

### Getting a recent version of mpv

MMPC2 requires a relatively new version of mpv, newer than what's currently in
Debian and Ubuntu. For Ubuntu, you could just add this ppa to your system:
https://launchpad.net/~mc3man/+archive/Ubuntu/mpv-tests

	sudo add-apt-repository ppa:mc3man/mpv-tests
	sudo apt-get update
	sudo apt-get install mpv

For Debian, you will probably have to either use the testing repositories to
install mpv, get some binary from somewhere, or compile it from source. I
compiled from source when installing it on the Debian stable (jessie), and the
instructions are a bit too long to include here, but you can get the source
from here: https://github.com/mpv-player/mpv/releases/latest and get the source
there. Make sure to compile with luajit support for youtube-dl, and libpulse
for pulseaudio (if you use that).

### Getting a recent version of youtbe-dl

Debian may ship a version of youtube-dl that's so old it doesn't really work
anymore - I had that problem with my Debian box. To fix that, uninstall
youtube-dl if you installed with apt-get (`apt-get remove youtube-dl`), and
install it through pip (installing pip if necessary)

	sudo apt-get install python-pip
	sudo pip install youtube-dl

## Configuration

`conf.json` contains a couple of configuration options (assuming you copied
`conf.json.example` to `conf.json`). These are:

	{
		"tmpdir": String. The directory to store temporary files in.
			Default: "tmp"

		"subtitles": String (or false). The language code for the subtitles,
			or false for no subtitles. Default: "en" (english).

		"additional_links": Array of objects which look like this:
			{ "name": "some name", "url": "some URL" }
			Lets you add more parts to the index page. I use it to link to an
			instance of guacamole, a web based VNC client.
			( https://guacamole.incubator.apache.org/ )
	}
