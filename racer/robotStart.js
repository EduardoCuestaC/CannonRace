////////////////////////////////////////////////////////////////////////////////
/*global THREE, Coordinates, document, window  */
var camera, scene, renderer;
var cameraControls;

var clock = new THREE.Clock();
var timer = 0;
var root, groupChest, neck, head, hips, lHip, rHip, rKnee, lKnee, lAnkle, rAnkle, rShoulder, lShoulder, lElbow, rElbow, lWrist, rWrist;
var racer;
var kb = new KeyboardState();
var boosts = [];
var obstacles = [];
var plane;

var Boost = function(x, y, z){
	this.root = new THREE.Group();
	scene.add(this.root);
	let materialShip = new THREE.MeshPhongMaterial({color: 0x222222});
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
};

Boost.prototype.intersects = function(racer){
	let sright = this.root.position.x + this.width/2;
	let sleft = this.root.position.x - this.width/2;
	let stop = this.root.position.z - this.length/2;
	let sbot = this.root.position.z + this.length/2;

	return ( sleft < racer.x + racer.width/2)
		&& (sright > racer.x - racer.width/2)
		&& (stop < racer.z + racer.length/2)
		&& (sbot > racer.z - racer.length/2);
};

var Obstacle = function(x, y, z){
	this.root = new THREE.Group();
	scene.add(this.root);
	let material = new THREE.MeshPhongMaterial({color: 0xff0000});
	this.width = 10;
	this.length = 10;
	this.height = 20;
	let box = new THREE.Mesh(new THREE.BoxBufferGeometry(this.width, this.height, this.length), material);
	this.root.add(box);
	this.root.position.x = x;
	this.root.position.y = y;
	this.root.position.z = z;
	this.x = x;
	this.y = y;
	this.z = z;
};

Obstacle.prototype.intersects = function(racer){
	let sright = this.root.position.x + this.width/2;
	let sleft = this.root.position.x - this.width/2;
	let stop = this.root.position.z - this.length/2;
	let sbot = this.root.position.z + this.length/2;

	return ( sleft < racer.x + racer.width/2)
		&& (sright > racer.x - racer.width/2)
		&& (stop < racer.z + racer.length/2)
		&& (sbot > racer.z - racer.length/2);
};


var Racer = function(x, y, z){
	this.root = new THREE.Group();
	scene.add(this.root);
	let materialShip = new THREE.MeshPhongMaterial({color: 0x35ff3f});
	this.width = 100;
	this.height = 20;
	this.length = 100;
	let box = new THREE.Mesh(new THREE.BoxBufferGeometry(this.width, this.height, this.length), materialShip);
	this.root.add(box);
	this.root.position.y = 10;
	this.root.position.x = x;
	this.root.position.y = y;
	this.root.position.z = z;
	this.x = x;
	this.y = y;
	this.z = z;
	this.speed = 2;
};

Racer.prototype.move = function(x, y, z){
	this.root.position.x += x;
	this.root.position.y += y;
	this.root.position.z += z;
	this.x += x;
	this.y += y;
	this.z += z;
};

Racer.prototype.moveForward = function() {
	this.root.position.z -= this.speed;
	this.z -= this.speed;
	camera.position.z -= racer.speed;
	plane.position.z -= racer.speed;
};

function fillScene() {
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x808080, 2000, 4000 );

	// LIGHTS

	scene.add( new THREE.AmbientLight( 0x222222 ) );

	var light = new THREE.DirectionalLight( 0xffffff, 0.7 );
	light.position.set( 200, 500, 500 );

	scene.add( light );

	light = new THREE.DirectionalLight( 0xffffff, 0.9 );
	light.position.set( -200, -100, -400 );

	scene.add( light );

/*//grid xz
 var gridXZ = new THREE.GridHelper(2000, 100, new THREE.Color(0xCCCCCC), new THREE.Color(0x888888));
 scene.add(gridXZ);*/

	let planeGeometry = new THREE.PlaneGeometry( 5000, 5000);
	let planeMaterial = new THREE.MeshBasicMaterial( {color: 0x689bed});
	plane = new THREE.Mesh( planeGeometry , planeMaterial );
	plane.rotateX(-Math.PI/2);
	plane.position.z = -500;
	scene.add( plane );


 racer = new Racer(0, 10, 0);
 boosts.push(new Boost(40, 0, -400));
 boosts.push(new Boost(20, 0, -800));
 boosts.push(new Boost(-30, 0, -1200));
 boosts.push(new Boost(0, 0, -1600));
 boosts.push(new Boost(50, 0, -2000));
 boosts.push(new Boost(-12, 0, -2400));
 boosts.push(new Boost(-50, 0, -2800));

 obstacles.push(new Obstacle(0, 0, -600));
 obstacles.push(new Obstacle(10, 0, -1000));
 obstacles.push(new Obstacle(-20, 0, -1700));
 obstacles.push(new Obstacle(20, 0, -1700));
 obstacles.push(new Obstacle(-10, 0, -2100));


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
	renderer = new THREE.WebGLRenderer( { antialias: true } );

	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.setSize(canvasWidth, canvasHeight);
	renderer.setClearColor( 0xAAAAAA, 1.0 );

	// CAMERA
	camera = new THREE.PerspectiveCamera( 45, canvasRatio, 1, 4000 );
	// CONTROLS
	cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
	camera.position.set(0, 100, +500);
	cameraControls.target.set(0,100,0);

	clock = new THREE.Clock()
}

function addToDOM() {
    var canvas = document.getElementById('canvas');
    canvas.appendChild(renderer.domElement);
}

function animate() {
	window.requestAnimationFrame(animate);
	render();
}
var dangle, cangle = 0, cangle2 = 0, dangle2, timer2 = 0;
var dgangle = 0, cgangle = 0;
function render() {
	kb.update();
	var delta = clock.getDelta();
	racer.moveForward();

	if(kb.pressed("A"))
		racer.move(-2, 0, 0);
	if(kb.pressed("D"))
		racer.move(2, 0, 0);
	if(kb.pressed("W")) {
	}

	for(let boost of boosts){
		if(boost.intersects(racer)){
			racer.speed += 1;
			console.log(1)
		}
	}

	for(let obstacle of obstacles){
		if(obstacle.intersects(racer)){
			racer.speed = Math.max(1, racer.speed - 1);
			console.log(-1)
		}
	}
	cameraControls.target.set(0, 10, racer.z);
	cameraControls.update(delta);
	renderer.render(scene, camera);
	document.getElementById("time").innerHTML = "Time (s): " + clock.getElapsedTime().toFixed(2);
	document.getElementById("speed").innerHTML = "Speed: " + racer.speed;
}

try {
  init();
  fillScene();
  addToDOM();
  animate();
} catch(error) {
    console.log("Your program encountered an unrecoverable error, can not draw on canvas. Error was:");
    console.log(error);
}
