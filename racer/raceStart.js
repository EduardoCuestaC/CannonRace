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
var objetito;
var scores = [];

var frameId;


class Boost {

	constructor(x, y, z) {
		this.root = new THREE.Group();
		scene.add(this.root);
		let materialShip = new THREE.MeshPhongMaterial({ color: 0x222222 });
		this.width = 70;
		this.length = 40;
		this.height = 2;
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
		this.root.position.x = Math.floor(Math.random() * 401) - 200;
		this.root.position.y = 0;
		this.root.position.z = z - 4000;
		this.x = Math.floor(Math.random() * 401) - 200;
		this.y = 0;
		this.z = z - 4000;
	}
}

class Obstacle {

	constructor(x, y, z) {
		this.root = new THREE.Group();
		scene.add(this.root);

		this.width = 10;
		this.length = 10;
		this.height = 20;

		let material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
		let box = new THREE.Mesh(new THREE.BoxBufferGeometry(this.width, this.height, this.length), material);

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
		this.root.position.x = Math.floor(Math.random() * 401) - 200;
		this.root.position.y = 0;
		this.root.position.z = z - 4000;

		this.x = Math.floor(Math.random() * 401) - 200;
		this.y = 0;
		this.z = z - 4000;
	}
}

class Racer {

	constructor(x, y, z) {
		this.root = new THREE.Group();
		scene.add(this.root);

		this.width = 50;
		this.height = 10;
		this.length = 180;

		let materialShip = new THREE.MeshPhongMaterial({ color: 0xd2d8e0 });
		materialShip.visible = false;
		let box = new THREE.Mesh(new THREE.BoxBufferGeometry(this.width, this.height, this.length), materialShip);

		//this.root.add(box);
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
		this.root.position.x += x;
		this.root.position.y += y;
		this.root.position.z += z;

		this.x += x;
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
		// console.log(this.points, Math.trunc(this.time / 10), this.time);
	}

	render() {
		document.getElementById("time").innerHTML = "Time (s): " + this.time;
		document.getElementById("speed").innerHTML = "Current Speed: " + this.racer.speed;
		document.getElementById("life").innerHTML = "Hull Integrity: " + this.racer.life + "%";
		document.getElementById("points").innerHTML = "Points: " + this.points;
	}
}

function fillScene() {

	scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0x808080, 2000, 4000);

	// LIGHTS

	scene.add(new THREE.AmbientLight(0x222222));

	var light = new THREE.DirectionalLight(0xffffff, 0.7);
	light.position.set(200, 500, 500);

	scene.add(light);

	light = new THREE.DirectionalLight(0xffffff, 0.9);
	light.position.set(-200, -100, -400);

	scene.add(light);

	/*//grid xz
	var gridXZ = new THREE.GridHelper(2000, 100, new THREE.Color(0xCCCCCC), new THREE.Color(0x888888));
	scene.add(gridXZ);*/

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
			objetito = object;
			scene.add(object);
			console.log("loaded");
		});

	});

	let planeGeometry = new THREE.PlaneGeometry(5000, 5000);
	let planeMaterial = new THREE.MeshBasicMaterial({ color: 0x689bed });

	plane = new THREE.Mesh(planeGeometry, planeMaterial);
	plane.rotateX(-Math.PI / 2);
	plane.position.z = -500;
	scene.add(plane);


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
	/*	var loader = new THREE.FontLoader();

		loader.load( 'helv.typeface.json', function ( font ) {
			var geometry = new THREE.TextGeometry( 'Hello three.js!', {
				font: font,
				size: 80,
				height: 5,
				curveSegments: 12,
				bevelEnabled: true,
				bevelThickness: 10,
				bevelSize: 8,
				bevelSegments: 5
			} );
		} );*/
}

function init() {
	var canvasWidth = window.innerWidth;
	var canvasHeight = window.innerHeight;
	var canvasRatio = canvasWidth / canvasHeight;
	// RENDERER
	renderer = new THREE.WebGLRenderer({ antialias: true });

	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.setSize(canvasWidth, canvasHeight);
	renderer.setClearColor(0xAAAAAA, 1.0);

	// CAMERA
	camera = new THREE.PerspectiveCamera(45, canvasRatio, 1, 4000);
	// CONTROLS
	cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
	camera.position.set(0, 100, +500);
	cameraControls.target.set(0, 100, 0);

	clock = new THREE.Clock()

}

function terminate() {
	window.cancelAnimationFrame(frameId);
	scores.push(hud.score);
	scores.sort((a, b) => b - a);

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
	bplay.innerText = "Play again";
	bplay.classList.add("play-again-button");

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

	objetito.position.x = racer.x;
	objetito.position.z = racer.z;
	objetito.position.y = racer.y;

	if (kb.pressed("A"))
		if (racer.x > -200)
			racer.move(-6, 0, 0);

	if (kb.pressed("D"))
		if (racer.x < 200)
			racer.move(6, 0, 0);

	for (let boost of boosts) {
		if (boost.intersects(racer)) {
			if (racer.speed < 50) {
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
			racer.speed = Math.max(5, racer.speed - 10);
			obstacle.relocate(racer.z);
			racer.life -= 10;
			if (racer.life <= 0) {
				terminate();
			}
		}

		if (obstacle.z > (racer.z + 400)) {
			obstacle.relocate(racer.z)
		}
	}
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
