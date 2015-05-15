function GameBoard()
{
	this.moon = null;
	this.rayPlane = null;

	this.isInAltspace = null;
	this.isTopDownMode = false;
	this.rotationEnabled = true;
	this.mouseAimEnabled = true;

	this.rotationAmount = new THREE.Vector3(30, 0, 0);
	this.boardOffset = new THREE.Vector3(0, 0, 0);
	this.scaleFactor = 1.0;

	if( !!window.Alt )
	{
		this.depthOffset = 0;
		this.heightOffset = 0;
	}

	var loc = document.location.href;
	var foundIndex = loc.indexOf("?preset=");
	if( foundIndex != -1 || !!window.Alt )
	{

		var preset = (foundIndex == -1) ? "meeting" : loc.substring(foundIndex+8);

		if( preset == "meeting" && !!window.Alt )
		{
			this.rotationAmount = new THREE.Vector3(50, 0, 0);
			this.boardOffset = new THREE.Vector3(10, -200, 300);
			this.scaleFactor = 3.0;

			/*
			this.rotationAmount = new THREE.Vector3(20, 0, 0);
			this.boardOffset = new THREE.Vector3(10, -140, 540);
			this.scaleFactor = 4.0;
			*/
		}
			else if( preset == "meeting2" && !!window.Alt )
		{
			this.rotationAmount = new THREE.Vector3(20, 0, 0);
			this.boardOffset = new THREE.Vector3(0, 0, 225);
			this.scaleFactor = 4.0;
		}
		else if( preset == "meeting3" && !!window.Alt )
		{
			this.rotationAmount = new THREE.Vector3(0, 0, 0);
			this.boardOffset = new THREE.Vector3(0, 0, 0);
			this.scaleFactor = 4.0;
		}
		else if( preset == "tea" && !!window.Alt )
		{
			this.rotationAmount = new THREE.Vector3(40, 0, 0);
			this.boardOffset = new THREE.Vector3(-160, -80, 330);
			this.scaleFactor = 4.0;
		}
		else if( preset == "gaming" && !!window.Alt)
		{
			this.rotationAmount = new THREE.Vector3(10, 0, 0);
			this.boardOffset = new THREE.Vector3(0, -50, 380);
			this.scaleFactor = 5;

		/* IRL invasion
			this.rotationAmount = new THREE.Vector3(20, 0, 0);
			this.boardOffset = new THREE.Vector3(200, -50, -150);
			this.scaleFactor = 10.0;
		*/
		}
		else if( preset == "topdown" )
		{
			this.rotationAmount = new THREE.Vector3(0, 0, 0);
			this.boardOffset = new THREE.Vector3(0, 0, 0);
			this.scaleFactor = 1.0;
			this.isTopDownMode = true;
		}

	}

	this.controlRight = null;
	this.controlLeft = null;
	this.turningAmount = 0;
	this.turningDirection = 0;

	this.tickCount = 0;
	this.renderer = null;
	this.scene = null;
	this.raycaster = null;
	this.cursorEvents = null;
	this.playerCursorPosition = null;
	this.dragPlane = null;
	this.listener = null;
	this.loader = null;
	this.actors = null;
	this.playerTurret = null;
	this.lastSpawnedEnemy = 0;

	this.lastFiredTick = 0;
	this.fireRate = 30;

	this.delayedFireEvent = null;

	/*
	if(!window.Alt)
		this.scaleFactor = 1.0;
	*/

	this.yOffset = 60 * this.scaleFactor;

	this.boardOffset = new THREE.Vector3(this.boardOffset.x * this.scaleFactor, this.boardOffset.y * this.scaleFactor, this.boardOffset.z * this.scaleFactor);

	// Only used while INSIDE of AltspaceVR


	// Only used while OUTSIDE of AltspaceVR
	this.camera = null;
	this.ambient = null;

	// Initialize everything
	this.init();

	// Precache some stuff
	this.loader.load("models/InterD/cube.obj", function ( loadedObject ) {
//		thisActor.gameBoard.scene.add(loadedObject);
	});

	this.loader.load("models/InterD/player_turret.obj", function ( loadedObject ) {
//		thisActor.gameBoard.scene.add(loadedObject);
	});

	this.loader.load("models/InterD/player_laser.obj", function ( loadedObject ) {
//		thisActor.gameBoard.scene.add(loadedObject);
	});

	// Start the simulation
	this.tick();
}

GameBoard.prototype.initOffset = function(loadedObject, spawn_offset, spawn_rotation, scale_multiplier)
{
	var spawnRotation = ( typeof spawn_rotation != 'undefined' ) ? spawn_rotation : new THREE.Vector3(0, 0, 0);
	var spawnOffset = ( typeof spawn_offset != 'undefined' ) ? spawn_offset : new THREE.Vector3(0, 0, 0);
	var scaleMultiplier = ( typeof scale_multiplier != 'undefined' ) ? scale_multiplier : 1.0;

	loadedObject.position.x = this.boardOffset.x;
	loadedObject.position.y = this.boardOffset.y;
	loadedObject.position.z = this.boardOffset.z;
	loadedObject.rotation.x = 0;
	loadedObject.rotation.y = 0;
	loadedObject.rotation.z = 0;

	loadedObject.updateMatrix();
	this.orbitObjectAboutWorldOrigin(loadedObject, this.rotationAmount.x);
	loadedObject.updateMatrix();

	// Apply the spawn rotation
	loadedObject.rotateX(spawnRotation.x * (Math.PI/180));
	loadedObject.rotateY(spawnRotation.y * (Math.PI/180));
	loadedObject.rotateZ(spawnRotation.z * (Math.PI/180));

	// Apply the spawn offsets
	loadedObject.translateX(spawnOffset.x * this.scaleFactor);
	loadedObject.translateY(spawnOffset.y * this.scaleFactor);
	loadedObject.translateZ(spawnOffset.z * this.scaleFactor);

	var scale = new THREE.Vector3( this.scaleFactor, this.scaleFactor, this.scaleFactor);

	if( this.isInAltspace )
		loadedObject.scale.copy( scale.multiplyScalar(scaleMultiplier) );
};

GameBoard.prototype.deltaDragPlaneRotate = function(degrees, axis)
{
	var rotationAxis;

	if( typeof axis != 'undefined' )
		rotationAxis = axis;
	else
		rotationAxis = new THREE.Vector3(-1,0,0);

   	var rotObjectMatrix = new THREE.Matrix4();
   	rotObjectMatrix.makeRotationAxis(rotationAxis.normalize(), (Math.PI / 180) * degrees);

	this.dragPlane.matrix.multiply(rotObjectMatrix);
    this.dragPlane.rotation.setFromRotationMatrix(this.dragPlane.matrix);
};

GameBoard.prototype.orbitDragPlaneWorldOrigin = function(degrees)
{
    var rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(new THREE.Vector3(1,0,0).normalize(), (Math.PI / 180) * degrees);
    rotWorldMatrix.multiply(this.dragPlane.matrix);
    this.dragPlane.matrix = rotWorldMatrix;
    this.dragPlane.rotation.setFromRotationMatrix(this.dragPlane.matrix);
};

GameBoard.prototype.orbitObjectAboutWorldOrigin = function(sceneObject, degrees, axis)
{
	var rotAxis;
	if( typeof axis == 'undefined' )
		rotAxis = new THREE.Vector3(1, 0, 0);
	else
		rotAxis = axis;

    var rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(new THREE.Vector3(1,0,0).normalize(), (Math.PI / 180) * degrees);
    rotWorldMatrix.multiply(sceneObject.matrix);
    sceneObject.matrix = rotWorldMatrix;
    sceneObject.rotation.setFromRotationMatrix(sceneObject.matrix);
};

GameBoard.prototype.initCursorEvents = function(listener)
{
	this.listener = listener;
	this.dragPlane = listener;
	this.listener.board = this;
	this.listener.addEventListener( "holocursormove", this.onCursorMove);

	var eventParams = { defaultTarget: this.listener };
	this.cursorEvents = new CursorEvents(eventParams);

	this.cursorEvents.enableMouseEvents(this.camera);

	// LEFT CONTROL
	var hoverEffect = new ColorHoverEffect( { color: new THREE.Color(0, 1, 1) });
	this.cursorEvents.addEffect(hoverEffect, this.controlRight.sceneObject);
	this.cursorEvents.addObject( this.controlRight.sceneObject );

	var thisGameBoard = this;

	if( this.isInAltspace )
	{
		this.controlRight.sceneObject.addEventListener("holocursordown", function(event) {
			thisGameBoard.playerFire();
		});
	}

	this.controlRight.sceneObject.addEventListener("holocursorenter", function(event) {
		thisGameBoard.turningDirection = 1;
	});

	this.controlRight.sceneObject.addEventListener("holocursorleave", function(event) {
		thisGameBoard.turningDirection = 0;
	});

	// RIGHT CONTROL
	this.cursorEvents.addEffect(hoverEffect, this.controlLeft.sceneObject);
	this.cursorEvents.addObject( this.controlLeft.sceneObject );

	if( this.isInAltspace )
	{
		this.controlLeft.sceneObject.addEventListener("holocursordown", function(event) {
			thisGameBoard.playerFire();
		});
	}

	this.controlLeft.sceneObject.addEventListener("holocursorenter", function(event) {
		thisGameBoard.turningDirection = -1;
	});

	this.controlLeft.sceneObject.addEventListener("holocursorleave", function(event) {
		thisGameBoard.turningDirection = 0;
	});

	// TURRET CONTROL
	this.cursorEvents.addEffect(hoverEffect, this.playerTurret.sceneObject);
	this.cursorEvents.addObject( this.playerTurret.sceneObject );

	if( this.isInAltspace )
	{
		this.playerTurret.sceneObject.addEventListener("holocursordown", function(event) {
			thisGameBoard.playerFire();
		});
	}

	// FIRE CONTROL
	if( this.moon )
	{
		this.cursorEvents.addEffect(hoverEffect, this.moon);
		this.cursorEvents.addObject( this.moon );

		if( this.isInAltspace )
		{
			this.moon.addEventListener("holocursordown", function(event) {
				thisGameBoard.playerFire();
			});
		}
	}
//console.log(this.controlRight);

	/*
	var hoverEffect2 = new ColorHoverEffect( { color: new THREE.Color(0, 1, 1) });
	this.cursorEvents.addEffect(hoverEffect2, this.controlRight.sceneObject);
	this.cursorEvents.addObject( this.controlRight.sceneObject );
	*/
};

GameBoard.prototype.init = function()
{
	this.isInAltspace = !!window.Alt;
	this.loader = new THREE.AltOBJMTLLoader();
	this.actors = new Array();

	// Initialize the scene
	this.scene = new THREE.Scene();
	this.raycaster = new THREE.Raycaster();

	if( this.isInAltspace )
	{
		this.renderer = new THREE.AltRenderer();
		document.getElementById("info").style.visibility = "hidden";	// No regular title while inside of AltspaceVR
	}
	else
	{
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setClearColor("#AAAAAA");
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( this.renderer.domElement );

		var aspect = window.innerWidth / window.innerHeight;
		this.camera = new THREE.PerspectiveCamera(45, aspect, 1, 2000 );

		if( this.isTopDownMode )
		{
			this.camera.position.y = 100;
			this.camera.position.z = 0;

			this.camera.rotation.x = (Math.PI/180) * (-90);
			this.camera.rotation.y = 0;
			this.camera.rotation.z = 0;

			this.camera.translateZ(800);
			this.camera.translateY(200);			this.camera.position.x = 0;

		}
		else
		{
			this.camera.position.x = 0;
			this.camera.position.y = 40;
			this.camera.position.z = 180;

			//this.camera.rotation.x = (Math.PI/180) * (-90);
			this.camera.rotation.x = 0;
			this.camera.rotation.y = 0;
			this.camera.rotation.z = 0;

//			this.camera.translateZ(270);
//			this.camera.translateY(200);
		}

//		this.listener = document.createElement("div");
//		this.listener.style.display = "none";
//		this.listener.addEventListener( "holocursormove", this.onCursorMove);
//		this.listener.board = this;

		this.ambient = new THREE.AmbientLight( 0xffffff );
		this.scene.add( this.ambient );
	}

	// Initialize the cursor events
//	this.cursorEvents = new CursorEvents();
//	var evenParams = { defaultTarget: this.listener };
//	this.cursorEvents = new CursorEvents(evenParams);

//	this.cursorEvents.enableMouseEvents(this.camera);	// It's OK to pass a null pointer here if we're inside of AltspaceVR

	// Add the drag plane and apply the same rotation to it as actors do.
	/*
	this.dragPlane = new THREE.Mesh( 
      new THREE.BoxGeometry(230, 0.25, 300),
      //new THREE.MeshBasicMaterial( { color: "#ff0000", transparent: true, opacity: 0.25 })
      new THREE.MeshBasicMaterial( { color: "#00ff00", transparent: true, opacity: 0.5 })
    );
    this.dragPlane.position.x = this.boardOffset.x;
    //this.dragPlane.position.y = 0;
    this.dragPlane.position.y = this.boardOffset.y;// + (10 * this.scaleFactor);
   	//this.dragPlane.position.z = 0;
  	this.dragPlane.position.z = this.boardOffset.z  + (-200 * this.scaleFactor);
	this.dragPlane.up = new THREE.Vector3(0,0,1);
	*/

//   	this.deltaDragPlaneRotate(90, new THREE.Vector3(0, 1, 0));
//	this.deltaDragPlaneRotate(-90, new THREE.Vector3(1, 0, 0));
//			thisActor.deltaRotate(45, new THREE.Vector3(1, 0, 0));

	// Orbit the whole thing so it looks like it's coming out of the wall
//	this.orbitDragPlaneWorldOrigin(90);

//    if( this.rotationEnabled )
//		this.orbitDragPlaneWorldOrigin(this.rotation);
	//else
//		this.orbitDragPlaneWorldOrigin(90);

//	this.dragPlane.translateZ(0);
//	this.dragPlane.translateX(110);

//    this.scene.add(this.dragPlane);

	this.rayPlane = new THREE.Mesh( 
		//new THREE.BoxGeometry(230, 0.25, 300),
		new THREE.BoxGeometry(500, 0.25, 500),
		new THREE.MeshBasicMaterial( { color: "#00ff00", transparent: true, opacity: 0.0 })
	);

	this.initOffset(this.rayPlane, new THREE.Vector3(0, 0, -200));

	this.scene.add(this.rayPlane);
};

//var switcher = false;
GameBoard.prototype.rayCast = function(ray)
{
	if( !this.mouseAimEnabled || typeof this.playerTurret.sceneObject == 'undefined' || !this.listener )	// || switcher
		return;

	this.raycaster.set( ray.origin, ray.direction );

/*
	this.playerCursorPosition = ray.origin.add(ray.direction.multiplyScalar(1000.0));
	this.playerTurret.setGameEvent({eventName: "setLook", priority: 0, stopsSequence: false});
*/

	var intersects = this.raycaster.intersectObjects( this.scene.children );

	var pos = ( intersects.length > 0 ) ? intersects[0].point : ray.origin;

	if( this.moon )
	{
		this.moon.position.x = pos.x;
		this.moon.position.y = pos.y;
		this.moon.position.z = pos.z;

/*
		switcher = true;
		setTimeout(function(){ switcher = false; }, 5000);
*/
	}

	if ( intersects.length > 0 )
	{
		this.playerCursorPosition = intersects[0].point;
		// Instead of modifying game objects here, just set a game event that the board handles during the next tick.
		this.playerTurret.setGameEvent({eventName: "setLook", priority: 0, stopsSequence: false});
	}
};

// Note that the "this" pointer in this callback will be to the listener object, NOT the GameBoard object itself.
GameBoard.prototype.onCursorMove = function(e)
{
	var board = this.board;
	board.rayCast(e.detail.cursorRay);
};

GameBoard.prototype.tick = function()
{
	this.tickCount++;

	var numEnemies = 0;
	var i;
	for( i = 0; i < this.actors.length; i++)
	{
		if( this.playerTurret && this.playerTurret.team != this.actors[i].team )
			numEnemies++;

		this.actors[i].onTick();
	}

	if( numEnemies < 5 && this.tickCount - this.lastSpawnedEnemy > 50)
	{
		var randomSequenceName = (Math.random() > 0.5) ? "alpha" : "beta";
		var plusOrMinus = Math.random() < 0.5 ? -1 : 1;
		this.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(Math.random() * 80 * plusOrMinus, 0, -380), rotation: new THREE.Vector3(0, 0, 0)}).ai.playSequence("entrance", randomSequenceName);
	}

	var thisGameBoard = this;
	requestAnimationFrame( function(){ thisGameBoard.tick(); } );

	if( this.cursorEvents )
		this.cursorEvents.update();

	this.renderer.render( this.scene, this.camera );
};

GameBoard.prototype.spawnActor = function(params)
{
	// Add this game board to the params.
	var alteredParams = params;
	alteredParams.gameBoard = this;

	var actor = new Actor(alteredParams);
	this.actors.push(actor);

	return actor;
};

GameBoard.prototype.removeActor = function(actor)
{
	var i;
	for( i = 0; i < this.actors.length; i++ )
	{
		if( this.actors[i] == actor )
		{
			this.actors.splice(i, 1);
		}
	}

	actor.destroy();
};

GameBoard.prototype.reset = function(rotEnabled)
{
	var i;
	for( i = 0; i < this.actors.length; i++ )
	{
		this.actors.splice(i, 1);
		this.scene.remove(this.actors[i].sceneObject);
	}

	this.rotationEnabled = rotEnabled;

	this.tickCount = 0;
	this.playerCursorPosition = null;
	this.actors = null;
	this.playerTurret = null;
	this.lastSpawnedEnemy = 0;

	// Initialize everything
	this.reInit();	
};

GameBoard.prototype.reInit = function()
{
	this.actors = new Array();

	// Reset the dragplane
	this.dragPlane.rotation.x = 0;
	this.dragPlane.rotation.y = 0;
	this.dragPlane.rotation.z = 0;

	this.dragPlane.position.x = 0;
	this.dragPlane.position.y = 0;
	this.dragPlane.position.z = 0;

	this.dragPlane.up = new THREE.Vector3(0,0,1);

// 	this.deltaDragPlaneRotate(90, new THREE.Vector3(0, 1, 0));
//	this.deltaDragPlaneRotate(-90, new THREE.Vector3(1, 0, 0));

	// Orbit the whole thing so it looks like it's coming out of the wall
    if( this.rotationEnabled )
		this.orbitDragPlaneWorldOrigin(20);
	else
		this.orbitDragPlaneWorldOrigin(90);
	/*
	this.dragPlane.translateZ(0);
	this.dragPlane.translateX(110);
	*/

	// Reset the camera
	if( !this.isInAltspace )
	{
		this.camera.rotation.x = 0;
		this.camera.rotation.y = 0;
		this.camera.rotation.z = 0;

		this.camera.position.x = 0;
		this.camera.position.y = 0;
		this.camera.position.z = 0;

		this.camera.position.z = 70;
		this.camera.lookAt( this.scene.position );
		this.camera.position.y = 20;

		if( !this.rotationEnabled )
		{
			this.camera.translateY(80);
			this.camera.translateZ(230);
		}
	}
};

GameBoard.prototype.playerFire = function()
{
	if( this.tickCount - this.lastFiredTick < this.fireRate )
		return;

	this.lastFiredTick = this.tickCount;

	var laser1Template = {aiClassName: "PlayerLaser", modelName: "models/InterD/player_laser.obj", offset: new THREE.Vector3(16, 0, 20), matrix: this.playerTurret.sceneObject.matrix};
	var laser2Template = {aiClassName: "PlayerLaser", modelName: "models/InterD/player_laser.obj", offset: new THREE.Vector3(-16, 0, 20), matrix: this.playerTurret.sceneObject.matrix};

	this.playerTurret.setGameEvent({eventName: "fire", priority: 50, projectiles: [laser1Template, laser2Template]});
	this.turningAmount = 0;
	//this.turningDirection = 0;
};