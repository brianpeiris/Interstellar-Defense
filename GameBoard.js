function GameBoard()
{
	this.isInAltspace = null;
	this.rotationEnabled = true;
	this.rotation = -70;	//&rotation

	this.boardOffset = new THREE.Vector3(0, -50, 380);	// 0, -80, 350

	if( !!window.Alt )
	{
		this.depthOffset = 0;
		this.heightOffset = 0;
	}

	var loc = document.location.href;
	var foundIndex = loc.indexOf("?rotation=");
	if( foundIndex != -1 )
	{
		var rot = eval(loc.substring(foundIndex+1)) * -1.0;
		this.rotation = rot;

		if( this.rotation == 0 )
			this.rotationEnabled = false;
	}

	this.rotationEnabled = false;
	this.rotation = 0;

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
	this.scaleFactor = 1.0;
	this.playerTurret = null;
	this.lastSpawnedEnemy = 0;

	if(!!window.Alt)
		this.scaleFactor = 5.0;

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

GameBoard.prototype.setHoloCursorMoveListener = function(listener)
{
	this.listener = listener;
	this.dragPlane = listener;
	this.listener.board = this;
	this.listener.addEventListener( "holocursormove", this.onCursorMove);

	var evenParams = { defaultTarget: this.listener };
	this.cursorEvents = new CursorEvents(evenParams);

	this.cursorEvents.enableMouseEvents(this.camera);
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
		//this.camera.position.z = 70;
		this.camera.position.x = 0;
		this.camera.position.y = 100;
		this.camera.position.z = 0;
		//this.camera.lookAt( this.scene.position );
		//this.camera.position.y = 20;

		this.camera.rotation.x = (Math.PI/180) * (-90);
		this.camera.rotation.y = 0;
		this.camera.rotation.z = 0;

		if( !this.rotationEnabled )
		{
//			this.camera.translateY(80);
			this.camera.translateZ(830);	// 230
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
};

GameBoard.prototype.rayCast = function(ray)
{
	if( typeof this.playerTurret.sceneObject == 'undefined' || !this.listener )
		return;

	this.raycaster.set( ray.origin, ray.direction );

	//var destination = ray.origin.add(ray.direction.multiplyScalar(1000.0));
	this.playerCursorPosition = ray.origin.add(ray.direction.multiplyScalar(1000.0));
	this.playerTurret.setGameEvent({eventName: "setLook", priority: 0, stopsSequence: false});

/*
	var geometry = new THREE.Geometry();
	var vert0 = new THREE.Vector3(ray.origin.x, ray.origin.y, ray.origin.z);
	geometry.vertices.push( vert0 );

	var vert1 = new THREE.Vector3(destination.x, destination.y, destination.z);
	geometry.vertices.push( vert1 );

//	var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 0.5 } ) );
//	this.scene.add( line );


	var intersects = this.raycaster.intersectObjects( this.scene.children );

	if ( intersects.length > 0 )
	{
		this.playerCursorPosition = intersects[0].point;

		// Instead of modifying game objects here, just set a game event that the board handles during the next tick.
		this.playerTurret.setGameEvent({eventName: "setLook", priority: 0, stopsSequence: false});
	}
	*/
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
		var plusOrMinus = Math.random() < 0.5 ? -1 : 1;
		this.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(Math.random() * 80 * plusOrMinus, 0, -380), rotation: new THREE.Vector3(0, 0, 0)}).ai.playSequence("entrance0");
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
			this.camera.translateZ(230);	// 230
		}
	}
};

GameBoard.prototype.playerFire = function()
{
	var laser1 = this.spawnActor({aiClassName: "PlayerLaser", modelName: "models/InterD/player_laser.obj", offset: new THREE.Vector3(16, 0, 20), matrix: this.playerTurret.sceneObject.matrix});
	var laser2 = this.spawnActor({aiClassName: "PlayerLaser", modelName: "models/InterD/player_laser.obj", offset: new THREE.Vector3(-16, 0, 20), matrix: this.playerTurret.sceneObject.matrix});
};