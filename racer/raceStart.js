/*global THREE, Coordinates, document, window  */
var camera, scene, renderer;
var cameraControls;

var clock = new THREE.Clock();
var timer = 0;
var racer;
var kb = new KeyboardState();
var boosts = [];
var obstacles = [];
var plane;
var hud;
var ship;
var scores = [];
var frameId;
var obj1, obj2, obj3, obj4, obj5, obj6, obj7, obj8;

class sound {
	constructor(src) {
		this.sound = document.createElement("audio");
		this.sound.src = src;
		this.sound.setAttribute("preload", "auto");
		this.sound.setAttribute("controls", "none");
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

class Boost {

	constructor(x, y, z) {
		this.root = new THREE.Group();
		scene.add(this.root);

		this.width = 90;
		this.length = 40;
		this.height = 2;

		let materialShip = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
		let box = new THREE.Mesh(new THREE.BoxBufferGeometry(this.width, this.height, this.length), materialShip);

		this.root.add(box);
		this.root.position.x = x;
		this.root.position.y = y;
		this.root.position.z = z;
		this.x = x;
		this.y = y;
		this.z = z;
	}

	intersects(racer) {
		let sright = this.root.position.x + this.width / 2;
		let sleft = this.root.position.x - this.width / 2;
		let stop = this.root.position.z - this.length / 2;
		let sbot = this.root.position.z + this.length / 2;
		return (sleft < racer.x + racer.width / 2)
			&& (sright > racer.x - racer.width / 2)
			&& (stop < racer.z + racer.length / 2)
			&& (sbot > racer.z - racer.length / 2);
	}

	relocate(z) {
		var x = Math.floor(Math.random() * 401) - 200;
		this.root.position.x = x;
		this.root.position.y = 0;
		this.root.position.z = z - 5000;
		this.x = x;
		this.y = 0;
		this.z = z - 5000;
	}
}

class Obstacle {

	constructor(x, y, z) {
		this.root = new THREE.Group();
		scene.add(this.root);

		this.width = 6;
		this.length = 10;
		this.height = 20;

		let material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
		material.visible = false;
		let box = new THREE.Mesh(new THREE.SphereGeometry( 10, 50, 50 ), material);

		this.root.add(box);
		this.root.position.x = x;
		this.root.position.y = y;
		this.root.position.z = z;

		this.x = x;
		this.y = y;
		this.z = z;
	}

	intersects(racer) {
		let sright = this.root.position.x + this.width / 2;
		let sleft = this.root.position.x - this.width / 2;
		let stop = this.root.position.z - this.length / 2;
		let sbot = this.root.position.z + this.length / 2;

		return (sleft < racer.x + racer.width / 2)
			&& (sright > racer.x - racer.width / 2)
			&& (stop < racer.z + racer.length / 2)
			&& (sbot > racer.z - racer.length / 2);
	}

	relocate(z) {
		var x = Math.floor(Math.random() * 801) - 50;
		this.root.position.x = x;
		this.root.position.y = 0;
		this.root.position.z = z - 5000;
		this.x = x;
		this.y = 0;
		this.z = z - 5000;
	}
}

// Initilizes sounds
var crash = new sound("assets/sounds/crash.mp3");
var speedup = new sound("assets/sounds/boost.mp3");
var fly = new soundloop("assets/sounds/fly.mp3");
var background = new soundloop("assets/sounds/soundtrack.mp3");
var gameover = new soundloop("assets/sounds/gameover.mp3");
var death = new sound("assets/sounds/death.mp3");

class Racer {

	constructor(x, y, z) {
		this.root = new THREE.Group();
		scene.add(this.root);

		this.width = 50;
		this.height = 10;
		this.length = 200;

		let materialShip = new THREE.MeshPhongMaterial({ color: 0xd2d8e0 });
		materialShip.visible = true;

		this.root.position.y = 10;
		this.root.position.x = x;
		this.root.position.y = y;
		this.root.position.z = z;

		this.x = x;
		this.y = y;
		this.z = z;

		this.speed = 10;
		this.life = 100;
		this.totalBoosts = 0;
	}

	move(x, y, z) {
		this.root.position.x += x*Math.min(this.speed , 50)/8;
		this.root.position.y += y;
		this.root.position.z += z;

		this.x += x*Math.min(this.speed , 50)/8;
		this.y += y;
		this.z += z;
	}

	moveForward() {
		this.root.position.z -= this.speed;
		this.z -= this.speed;

		camera.position.z -= racer.speed;
		plane.position.z -= racer.speed;
	}
}

class HUD {
	constructor(racer = null) {
		this.points = 0;
		this.time = 0;
		this.racer = racer;
	}

	get score() {
		return this.points;
	}

	update() {
		this.time = clock.getElapsedTime().toFixed(2);
		this.points = Math.trunc(this.time / 10) + this.racer.totalBoosts;
	}

	render() {
		document.getElementById("time").innerHTML = "Time (s): " + this.time;
		document.getElementById("speed").innerHTML = "Current Speed: " + (this.racer.speed * 10) + "km/h";
		document.getElementById("life").innerHTML = "Hull Integrity: " + this.racer.life + "%";
		document.getElementById("points").innerHTML = "Points: " + this.points;
	}
}

function fillScene() {

	// FOG
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0x808080, 2000, 4000);
	//scene.background = new THREE.Color( 0x000000 );

	// LIGHTS
	scene.add(new THREE.AmbientLight(0x222222));

	var light = new THREE.DirectionalLight(0xffffff, 0.7);
	light.position.set(200, 500, 500);

	scene.add(light);

	light = new THREE.DirectionalLight(0xffffff, 0.9);
	light.position.set(-200, -100, -400);

	// SOUNDS
	fly.play();
	background.play();

	scene.add(light);

	// Spaceship model load
	var mtlLoader = new THREE.MTLLoader();
	mtlLoader.setResourcePath('assets/ships/');
	mtlLoader.setPath('assets/ships/');
	mtlLoader.load('u-wing_textured.mtl', function (materials) {
		materials.preload();

		var objLoader = new THREE.OBJLoader();
		objLoader.setMaterials(materials);
		objLoader.load('assets/ships/u-wing_textured.obj', function (object) {

			object.position.x = 10
			object.position.y = 10;
			object.position.z = 0;
			object.scale.x = 30;
			object.scale.y = 30;
			object.scale.z = 30;
			object.rotation.y = Math.PI * -1;
			ship = object;
			scene.add(object);
			console.log("loaded");
		});

	});

	// Asteroid model load
	var mtlLoader = new THREE.MTLLoader();
	mtlLoader.setResourcePath('assets/environment/');
	mtlLoader.setPath('assets/environment/');
	mtlLoader.load('asteroid.mtl', function (materials) {
		materials.preload();

		var objLoader = new THREE.OBJLoader();
		objLoader.setMaterials(materials);
		objLoader.load('assets/environment/asteroid.obj', function (object) {

			object.position.set(10, 20, -4000);
			object.scale.x = .03;
			object.scale.y = .03;
			object.scale.z = .03;
			object.rotation.y = Math.PI * -1;
			obj1 = object;
			scene.add(object);
		});

		objLoader.load('assets/environment/asteroid.obj', function (object) {

			object.position.set(10, 20, -4000);
			object.scale.x = .03;
			object.scale.y = .03;
			object.scale.z = .03;
			object.rotation.y = Math.PI * -1;
			obj2 = object;
			scene.add(object);
		});

		objLoader.load('assets/environment/asteroid.obj', function (object) {

			object.position.set(10, 20, -4000);
			object.scale.x = .03;
			object.scale.y = .03;
			object.scale.z = .03;
			object.rotation.y = Math.PI * -1;
			obj3 = object;
			scene.add(object);
		});

		objLoader.load('assets/environment/asteroid.obj', function (object) {

			object.position.set(10, 20, -4000);
			object.scale.x = .03;
			object.scale.y = .03;
			object.scale.z = .03;
			object.rotation.y = Math.PI * -1;
			obj4 = object;
			scene.add(object);
		});

		objLoader.load('assets/environment/asteroid.obj', function (object) {

			object.position.set(10, 20, -4000);
			object.scale.x = .03;
			object.scale.y = .03;
			object.scale.z = .03;
			object.rotation.y = Math.PI * -1;
			obj5 = object;
			scene.add(object);
		});

		objLoader.load('assets/environment/asteroid.obj', function (object) {

			object.position.set(10, 20, -4000);
			object.scale.x = .03;
			object.scale.y = .03;
			object.scale.z = .03;
			object.rotation.y = Math.PI * -1;
			obj6 = object;
			scene.add(object);
		});

		objLoader.load('assets/environment/asteroid.obj', function (object) {

			object.position.set(10, 20, -4000);
			object.scale.x = .03;
			object.scale.y = .03;
			object.scale.z = .03;
			object.rotation.y = Math.PI * -1;
			obj7 = object;
			scene.add(object);
		});

		objLoader.load('assets/environment/asteroid.obj', function (object) {

			object.position.set(10, 20, -4000);
			object.scale.x = .03;
			object.scale.y = .03;
			object.scale.z = .03;
			object.rotation.y = Math.PI * -1;
			obj8 = object;
			scene.add(object);
		});

	});

	let shipGeometry = new THREE.PlaneGeometry(5000, 5000);
	let shipMaterial = new THREE.MeshBasicMaterial({ color: 0x689bed });

	plane = new THREE.Mesh(shipGeometry, shipMaterial);
	plane.rotateX(-Math.PI / 2);
	plane.position.z = -500;
	//scene.add(plane);


	racer = new Racer(0, 10, 0);

	boosts = [];

	boosts.push(new Boost(40, 0, -800));
	boosts.push(new Boost(20, 0, -1700));
	boosts.push(new Boost(-30, 0, -2500));
	boosts.push(new Boost(0, 0, -3800));

	obstacles = [];

	obstacles.push(new Obstacle(0, 0, -600));
	obstacles.push(new Obstacle(10, 0, -1000));
	obstacles.push(new Obstacle(-20, 0, -1400));
	obstacles.push(new Obstacle(-10, 0, -2100));
	obstacles.push(new Obstacle(0, 0, -2500));
	obstacles.push(new Obstacle(100, 0, -2800));
	obstacles.push(new Obstacle(50, 0, -3400));
	obstacles.push(new Obstacle(-30, 0, -3800));


	hud = new HUD(racer);
}

function init() {

	document.getElementsByTagName("body")[0].style.backgroundImage = "url('assets/background.jpg')";

	var canvasWidth = window.innerWidth;
	var canvasHeight = window.innerHeight;
	var canvasRatio = canvasWidth / canvasHeight;

	// RENDERER
	renderer = new THREE.WebGLRenderer({ antialias: true , alpha: true});

	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.setSize(canvasWidth, canvasHeight);

	// CAMERA
	camera = new THREE.PerspectiveCamera(45, canvasRatio, 1, 4000);
	// CONTROLS
	cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
	camera.position.set(0, 100, +500);
	cameraControls.target.set(0, 100, 0);

	clock = new THREE.Clock()

}

function terminate() {
	// Stop soundtrack
	background.stop();
	fly.stop();

	// Play gameover
	gameover.play();

	window.cancelAnimationFrame(frameId);
	scores.push(hud.score);
	scores.sort((a, b) => b - a);

	document.body.style.backgroundImage = 'url("assets/end.jpg")';
	var screen = document.getElementById('screen');
	screen.innerHTML = "";

	let wr = document.createElement("div");
	wr.classList.add("score-wrapper");
	screen.appendChild(wr);

	let txt = document.createElement("div");
	txt.innerText = "Last score: " + hud.score;
	txt.classList.add("score-text");
	wr.appendChild(txt);

	let listHead = document.createElement("div");
	listHead.innerText = "All scores:";
	listHead.classList.add("score-text");
	wr.appendChild(listHead);

	let scoreList = document.createElement("ul");
	scoreList.classList.add("score-list");

	for (let score of scores) {
		let item = document.createElement("li");
		item.textContent = score;
		item.classList.add("score-item");
		scoreList.appendChild(item);
	}

	wr.appendChild(scoreList);

	let bplay = document.createElement("button");
	bplay.innerText = "Play Again";
	bplay.classList.add("play-again-btn");

	bplay.onclick = function () {
		screen.innerHTML = "" +
			"<div class=\"score-text\" id=\"time\"></div>\n" +
			"    <div class=\"score-text\" id=\"speed\"></div>\n" +
			"    <div class=\"score-text\" id=\"life\"></div>\n" +
			"    <div class=\"score-text\" id=\"points\"></div>\n" +
			"    <div id=\"canvas\">\n" +
			"        <script src=\"racerStart.js\"> </script>\n" +
			"    </div>" +
			"";

		try {

			init();
			fillScene();
			addToDOM();
			animate();

		} catch (error) {
			console.log("Your program encountered an unrecoverable error, can not draw on screen. Error was:");
			console.log(error);
		}

	};

	wr.appendChild(bplay);
}

function addToDOM() {
	var canvas = document.getElementById('canvas');
	canvas.appendChild(renderer.domElement);
}

function animate() {
	frameId = window.requestAnimationFrame(animate);
	render();
}

function render() {
	kb.update();
	var delta = clock.getDelta();
	racer.moveForward();

	ship.position.x = racer.x;
	ship.position.z = racer.z;
	ship.position.y = racer.y;

	if (kb.pressed("A")){
		if (racer.x > -200){
			racer.move(-1, 0, 0);
		}
	}

	if (kb.pressed("D")) {
		if (racer.x < 200){
			racer.move(1, 0, 0);
		}
	}

	for (let boost of boosts) {
		if (boost.intersects(racer)) {

			speedup.play();
			if (racer.speed < 70) {
				racer.speed += 5;
			}
			racer.totalBoosts++;
			boost.relocate(racer.z)
		}

		if (boost.z > (racer.z + 400)) {
			boost.relocate(racer.z)
		}
	}

	for (let obstacle of obstacles) {
		if (obstacle.intersects(racer)) {

			crash.play();
			racer.speed = Math.max(5, racer.speed - 10);
			obstacle.relocate(racer.z);
			racer.life -= 10;

			if (racer.life <= 0) {
				death.play();
				terminate();
			}
		}

		if (obstacle.z > (racer.z + 400)) {
			obstacle.relocate(racer.z)
		}
	}

	obj1.position.x = obstacles[0].x;
	obj1.position.y = 20;
	obj1.position.z = obstacles[0].z;

	obj2.position.x = obstacles[1].x;
	obj2.position.y = 20;
	obj2.position.z = obstacles[1].z;

	obj3.position.x = obstacles[2].x;
	obj3.position.y = 20;
	obj3.position.z = obstacles[2].z;

	obj4.position.x = obstacles[3].x;
	obj4.position.y = 20;
	obj4.position.z = obstacles[3].z;

	obj5.position.x = obstacles[4].x;
	obj5.position.y = 20;
	obj5.position.z = obstacles[4].z;

	obj6.position.x = obstacles[5].x;
	obj6.position.y = 20;
	obj6.position.z = obstacles[5].z;

	obj7.position.x = obstacles[6].x;
	obj7.position.y = 20;
	obj7.position.z = obstacles[6].z;

	obj8.position.x = obstacles[7].x;
	obj8.position.y = 20;
	obj8.position.z = obstacles[7].z;

	//ROTATION ASTEROIDS
	obj1.rotation.x += .02;

	obj2.rotation.x += .01;

	obj3.rotation.z += .02;

	obj4.rotation.z += .01;

	obj5.rotation.z += .01;

	obj6.rotation.x += .02;

	obj7.rotation.z += .03;

	obj8.rotation.x += .03;


	cameraControls.target.set(0, 10, racer.z);
	cameraControls.update(delta);
	renderer.render(scene, camera);
	hud.update();
	hud.render();

}

try {
	init();
	fillScene();
	addToDOM();
	animate();

} catch (error) {
	console.log("Your program encountered an unrecoverable error, can not draw on canvas. Error was:");
	console.log(error);
}
