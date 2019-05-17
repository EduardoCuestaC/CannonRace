class soundloop {
	constructor(src) {
		this.sound = document.createElement("audio");
		this.sound.src = src;
		this.sound.setAttribute("preload", "auto");
		this.sound.setAttribute("controls", "none");
		this.sound.setAttribute("loop", "true");
		this.sound.style.display = "none";

		document.body.appendChild(this.sound);

		this.play = function () {
			this.sound.play();
		};

		this.stop = function () {
			this.sound.pause();
		};
	}
}

// Intro music
var intro = new soundloop("assets/sounds/intro.mp3");
intro.play();