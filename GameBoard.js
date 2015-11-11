var gNumAssets = 12;

function GameBoard(userDisplayName)
{
	this.isInAltspace = !!window.Alt;

	this.isLocalPlayer = false;
	this.networkEnabled = true;
	this.networkObject = null;
	this.networkLastAimTick = 0;
	this.networkAimRate = 0;	// amount of ticks between syncing aiming position
	this.networkFire = null;
	this.networkState = null;

	this.beamedURL = "beamed.html";

	this.networkedShips = null;	// This is an array of enemy ship actors that is local but will be synced with the deadShips bit mask. Up to 32 ships per sequence.
	this.networkReady = false;	// This is automatically set when its ready.
	this.networkBeamState = false;	// Detect when this game room has been beamed to a location, so we can close it here.

	this.givenAltName = "";
	if( typeof userDisplayName !== 'undefined' )
		this.givenAltName = userDisplayName;

	//this.altLocalUser = (this.isInAltspace) ? window.Alt.Users.getLocalUser() : null;
	this.altLocalUser = null;
	//this.localUserName = (this.altLocalUser) ? this.altLocalUser.displayName : "none";
	this.localUserName = "none";
	this.activeUserName = "none";
	this.crosshair = null;
	this.rayPlane = null;

	this.isTopDownMode = false;
	this.rotationEnabled = true;
	this.mouseAimEnabled = true;

	this.rotationAmount = new THREE.Vector3(0, 0, 0);
	this.boardOffset = new THREE.Vector3(0, 0, 0);
	this.scaleFactor = 1.0;

	this.defaultState = {id: "default", aimingEnabled: false, loading: false, caching: 0};	// States without a tick attribute last for ever.
	this.state = this.defaultState;

	//this.scene.position.z += 10;

	if( this.isInAltspace )
	{
		this.depthOffset = 0;
		this.heightOffset = 0;

		// Default preset for Altspace
		//this.rotationAmount = new THREE.Vector3(40, 0, 0);
		//this.boardOffset = new THREE.Vector3(0, -230, 100);	//0 -50 308
		//this.scaleFactor = 2.0;

		this.rotationAmount = new THREE.Vector3(40, 0, 0);
		this.boardOffset = new THREE.Vector3(0, -230, 100);	//0 -50 308
		this.scaleFactor = 2.0;
	}
	else
	{
		// Default preset for browser
		this.rotationAmount = new THREE.Vector3(25, 0, 0);
		this.boardOffset = new THREE.Vector3(0, 0, 0);
		this.scaleFactor = 1.0;
	}

	var personal = (window.innerDepth == 300);

	var preset = getParameterByName("preset");
	if( preset == "" )
		preset = "gaming";

	// If we are in Altspace, try to determine which presets to use based on window inner dimensions
	/*
	if( !!window.Alt && !personal )
	{
		// Highrise Patio
		if( window.innerDepth == 1024 && window.innerWidth == 819 && window.innerHeight == 819 )	(sometimes 1024x1024)
	}
	*/

	if( preset == "meeting" && this.isInAltspace && !personal)
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
	else if( preset == "meeting2" && this.isInAltspace && !personal)
	{
		this.rotationAmount = new THREE.Vector3(20, 0, 0);
		this.boardOffset = new THREE.Vector3(0, 0, 225);
		this.scaleFactor = 4.0;
	}
	else if( preset == "meeting3" && this.isInAltspace && !personal )
	{
		this.rotationAmount = new THREE.Vector3(0, 0, 0);
		this.boardOffset = new THREE.Vector3(0, 0, 0);
		this.scaleFactor = 4.0;
	}
	else if( preset == "tea" && this.isInAltspace && !personal )
	{
		this.rotationAmount = new THREE.Vector3(40, 0, 0);
		this.boardOffset = new THREE.Vector3(-160, -80, 330);
		this.scaleFactor = 4.0;
	}
	else if( preset == "gaming" && this.isInAltspace && !personal )
	{
			/*
			this.rotationAmount = new THREE.Vector3(30, 0, 0);
			this.boardOffset = new THREE.Vector3(0, -115, 30);	//0 -50 308
			this.scaleFactor = 1.0;
			*/

		this.rotationAmount = new THREE.Vector3(40, 0, 0);
		this.boardOffset = new THREE.Vector3(0, -230, 100);	//0 -50 308
		this.scaleFactor = 2.0;

		/* IRL invasion
			this.rotationAmount = new THREE.Vector3(20, 0, 0);
			this.boardOffset = new THREE.Vector3(200, -50, -150);
			this.scaleFactor = 10.0;
		*/
	}
	else if( preset == "high" && this.isInAltspace && !personal )
	{
		this.rotationAmount = new THREE.Vector3(30, 0, 0);
		this.boardOffset = new THREE.Vector3(0, -50, 308);	//0 -50 308
		this.scaleFactor = 5.0;
	}
	else if( preset == "topdown" )
	{
		if( this.isInAltspace )
		{
			if( !personal )
			{
				this.rotationAmount = new THREE.Vector3(0, 0, 0);
				this.boardOffset = new THREE.Vector3(0, 0, 0);
				this.scaleFactor = 1.0;
				//this.isTopDownMode = true;
			}
			else
			{
				this.rotationAmount = new THREE.Vector3(90, 0, 0);
				this.boardOffset = new THREE.Vector3(0, -150, 20);
				this.scaleFactor = 2.0;

//				document.body.style.backgroundImage = "url('starfield2.jpg')";
			}
		}
		else
		{
			this.rotationAmount = new THREE.Vector3(90, 0, 0);
			this.boardOffset = new THREE.Vector3(0, -150, 0);
			this.scaleFactor = 2.0;
			this.isTopDownMode = true;
		}
	}
	else if( this.isInAltspace && personal )
	{
		this.rotationAmount = new THREE.Vector3(30, 0, 0);
		this.boardOffset = new THREE.Vector3(0, -50, -100);	//0 -50 308
		this.scaleFactor = 9.0;
	}

	this.nextStateName = null;
	this.pendingStateChange = false;

	this.alertSlateElem = null;
	this.alertMessage = null;
	this.alertDuration = 0;

	this.lastSyncedTick = -1;
	this.timeoutTickCount = 0;
	this.timeoutMaxTicks = 500;

	// Init stats
	this.statKills = 0;

	// Quickly grab some DOM elements
	this.statKillsElem = document.getElementById("statKills");
	this.currentPlayerElem = document.getElementById("playerName");
	this.currentPlayerSlateElem = document.getElementById("playerSlate");
	this.numPlayerElem = document.getElementById("playerCount");
	

//	this.controlRight = null;
//	this.controlLeft = null;
//	this.turningAmount = 0;
//	this.turningDirection = 0;

	this.lastLocalUserName = "none";

	this.tickCount = 0;
	this.renderer = null;
	//this.scene = null;
	this.scene = new THREE.Scene();
	this.raycaster = null;
	this.cursorEvents = null;
	this.playerCursorPosition = null;
	this.dragPlane = null;
	this.listener = null;
//	this.loader = null;
	this.loader = new THREE.OBJMTLLoader();
	this.actors = null;
	this.playerTurret = null;
	this.lastSpawnedEnemy = 0;

	this.lastFiredTick = 0;
	this.fireRate = 30;

	this.delayedFireEvent = null;
	this.cachedSounds = {};
	this.cachedModels = {};

	this.shuttingDown = false;

	// Pre-cache some known sounds
	var soundName;
	var soundElem;
	//var ext = (new Audio()).canPlayType('audio/mpeg') ? ".mp3" : ".wav";
/*
	soundElem = document.createElement("audio");
	soundElem.preload = "auto";
	soundName = "sounds/expl_03" + ext;
	soundElem.src = soundName;
	this.cachedSounds["sounds/expl_03"] = soundElem;
	*/


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

	if( this.isInAltspace )
	{
		var board = this;
//		setTimeout( function() {
		board.localUserNameOverride = window.Alt.Users.getLocalUser().displayName;
		//board.localUserNameOverride = "Altspace User";
			//this.altLocalUser = user;
			//this.localUserNameOverride = user.displayName;
			board.loadCrosshair();
		//});

		/*
		window.Alt.Users.getLocalUser().then(function(user) {
			//this.altLocalUser = user;
			this.localUserNameOverride = user.displayName;
			this.loadCrosshair();
		});
		*/
//		}, 1000);
	}
	else
		this.loadCrosshair();
}

GameBoard.prototype.loadCrosshair = function()
{
	var board = this;

	var objFile = "models/InterD/crosshair.obj";
	var mtlFile = objFile.substring(0, objFile.length - 3) + "mtl";
	this.loader.load(objFile, mtlFile, function ( loadedObject ) {
		board.initOffset(loadedObject, new THREE.Vector3(-100, -50, -200), new THREE.Vector3(0, 0, 0), 0.25);
		board.scene.add(loadedObject);
		board.crosshair = loadedObject;

		loadedObject.userData.tintColor = new THREE.Color(0, 1, 0);

		if( board.networkEnabled )
		{
			// Init firebase
			var firebaseRootUrl = "https://inter-d.firebaseio.com/";
    		var appId = "inter-d";

    		board.networkObject = new THREE.Object3D();
    		board.networkObject.isNetworkDirty = false;

    		board.showAlert({text: "CONNECTING TO SESSION...", duration: 1});

    		board.firebaseSync = new FirebaseSync(firebaseRootUrl, appId);
    		board.firebaseSync.addObject(board.networkObject, "gamestate");
    		board.firebaseSync.connect( function() {

   				//var allDataRef = board.firebaseSync.firebaseRoot;
				//allDataRef.remove();

    			// Because the syncData object is not immidately retrieved, a delay must be added.
    			setTimeout(function() {
    				// When we connect, we need to determine if we are the one setting up the room or not

    				//if( typeof board.networkObject.userData.syncData === 'undefined' || !board.networkObject.userData.syncData.isBeamed )
    				if( typeof board.networkObject.userData.syncData === 'undefined' )	// Disable the beam check for debugging!!!!
    				{
   						var isPersonal = (window.innerDepth == 300);

    					// Construct a brand new sync object for this room if one doesn't exist yet.
	    				board.networkObject.userData.syncData = {numPlayers: 1, deadShips: 0x0, state: {name: "none", startTick: -1}, turret: {health: 100, yaw: 0}, fire: {tick: -1, yaw: 0}, isBeamed: isPersonal, lastSyncTick: -1, localPlayerName: "none"};
	    				board.networkObject.userData.syncData.fire.yaw = 0;

	    				if( board.localUserName == "none" )
	    				{
	    					if( typeof window.Alt !== 'undefined' )
	    						board.localUserName = board.givenAltName;
	    					else
	    						board.localUserName = "Player 1";
	    				}

	    				board.firebaseSync.saveObject(board.networkObject);
	    			}
	    			else
	    			{
	    				// DEBUG otherwise just assume we are a different player...
	    				var numPlayersNow = board.networkObject.userData.syncData.numPlayers + 1;
	    				board.networkObject.userData.syncData.numPlayers = numPlayersNow;

	    				if( board.localUserName == "none" )
	    				{
	    					if( typeof window.Alt !== 'undefined' )
	    						board.localUserName = board.givenAltName;
	    					else
	    						board.localUserName = "Player " + numPlayersNow;
	    				}

	    				// Sync the fact that we joined the game (num players increased)
	    				board.firebaseSync.saveObject(board.networkObject);
	    			}

		    		board.init();

//		    		board.networkReady = true;	// Maybe network ready should not happen until after load_stage0 is called
    			//}, 3000);
				}, 1000);
    		});
    	}
    	else
    	{
    		board.init();
//    		this.localUserName = "Player 1";
    	}
	// Initialize everything
//		board.init();	// MULTIPLAYER ALWAYS ON FOR NOW!!

	// Start the simulation
//		board.tick();
	});
};

GameBoard.prototype.showAlert = function(alert_message)
{
	var alertMessage = alert_message;

	if( !this.alertSlateElem )
		this.alertSlateElem = document.getElementById("alertSlate");

	this.alertDuration = 120;
	if( typeof alertMessage.duration != 'undefined' )
		this.alertDuration = alertMessage.duration;


	// If there is currently a message being shown, it should be faded out....
	// DO WORK

	this.alertSlateElem.innerHTML = alertMessage.text;
	this.alertSlateElem.style.opacity = 1.0;
};

GameBoard.prototype.instance = function(model_file_name)
{
	// Only pre-cached models are allowed to be loaded!! (by default)

	var instance = this.cachedModels[model_file_name];
	if( typeof instance == 'undefined' )
		return null;
	else
		return instance.clone();
};

GameBoard.prototype.precacheSound = function(sound_file_name)
{
	if( typeof this.cachedSounds[sound_file_name] != 'undefined' )
		return;

	var soundName = sound_file_name + ".ogg";

	var thisGameBoard = this;
	var soundFileName = sound_file_name;
	var sound = new Audio(soundName);
	//canplay, canplaythrough

	// Just mark the sound as pre-cached already, because sometimes they are not being detected as being cached...
	this.onSoundCached(sound, soundFileName);

/*
	sound.addEventListener("canplaythrough", function() {
		thisGameBoard.onSoundCached(sound, soundFileName);
		sound.removeEventListener("canplaythrough", arguments.callee);
	});
*/
};

GameBoard.prototype.onSoundCached = function(loadedSound, soundFileName)
{
	if( !this.state.loading || this.state.caching < 1 || typeof this.cachedSounds[soundFileName] != 'undefined' )
		return;

	this.cachedSounds[soundFileName] = loadedSound;
	this.state.caching--;

	this.showAlert({text: "LOADING (" + (gNumAssets - this.state.caching) + "/" + gNumAssets + ")", duration: 800});
	console.log("Precached sound: " + soundFileName);

	if( this.state.caching < 1 )
	{
		var nextStateName = this.state.id.substring(5);
		this.setState(nextStateName);
	}
};

GameBoard.prototype.playSound = function(sound_file_name, volume_scale)
{
	if( typeof this.cachedSounds[sound_file_name] == 'undefined' )
	{
		this.precacheSound(sound_file_name);

		// Playing un-cached sounds is disabled!! (by default)
		return;
	}

	var volumeScale = (typeof volume_scale == 'undefined') ? 1.0 : volume_scale;

	var cachedSound = this.cachedSounds[sound_file_name].cloneNode();
	cachedSound.volume = 1.0 * volumeScale;
	cachedSound.play();
};

GameBoard.prototype.changeStat = function(stat_name, stat_amount)
{
	var stat = null;
	var statElem = null;

	if( stat_name == "kills")
	{
		this.statKills += stat_amount;

		stat = this.statKills;
		statElem = this.statKillsElem;

		if( stat == 0 )
			document.getElementById("scoreBoard").style.display = "none";
		else
			document.getElementById("scoreBoard").style.display = "block";
	}

	if( !statElem )
		return;

	statElem.innerText = stat;
};

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

//	if( this.isInAltspace )
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
	this.scene.addEventListener( "cursormove", this.onCursorMove.bind(this));

	var eventParams = { defaultTarget: this.listener };
	this.cursorEvents = new CursorEvents(eventParams);

	this.cursorEvents.enableMouseEvents(this.camera);

/*
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
*/

	// TURRET CONTROL
	var thisGameBoard = this;
	var hoverEffect = new ColorHoverEffect( { color: new THREE.Color(0, 1, 1) });
	this.cursorEvents.addEffect(hoverEffect, this.playerTurret.sceneObject);
	this.cursorEvents.addObject( this.playerTurret.sceneObject );

	if( this.isInAltspace )
	{
		this.playerTurret.sceneObject.addEventListener("cursordown", function(event) {
			if( thisGameBoard.networkReady && thisGameBoard.networkObject.userData.syncData.localPlayerName != "none" && !thisGameBoard.isLocalPlayer )
				return;

			if( thisGameBoard.state.name != "waiting" )	// is this check still needed?
				thisGameBoard.playerFire();
		});
	}

	// FIRE CONTROL
	if( this.crosshair )
	{
//		this.cursorEvents.addEffect(hoverEffect, this.crosshair);
		this.cursorEvents.addObject( this.crosshair );

		if( this.isInAltspace )
		{
			this.crosshair.addEventListener("cursordown", function(event) {
				if( thisGameBoard.networkReady && thisGameBoard.networkObject.userData.syncData.localPlayerName != "none" && !thisGameBoard.isLocalPlayer )
					return;

				if( thisGameBoard.state.name != "waiting" )
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
//	this.loader = new THREE.AltOBJMTLLoader();
	this.actors = new Array();

	// Initialize the scene
//	this.scene = new THREE.Scene();
//	this.scene.position.z = 800 * this.scaleFactor;
	//this.scene.rotation.y = (Math.PI / 180) * 180;
	//this.scene.updateMatrix();
	this.raycaster = new THREE.Raycaster();

	if( this.isInAltspace )
	{
		this.renderer = altspace.getThreeJSRenderer();
		document.getElementById("info").style.visibility = "hidden";	// No regular title while inside of AltspaceVR
	}
	else
	{
		this.renderer = new THREE.WebGLRenderer({alpha: true});
		//this.renderer.setClearColor("#aaaaaa");
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( this.renderer.domElement );

		var aspect = window.innerWidth / window.innerHeight;
		this.camera = new THREE.PerspectiveCamera(45, aspect, 1, 2000 );

		if( this.isTopDownMode )
		{
			this.camera.position.y = 100;
			this.camera.position.z = 0;

/*
			this.camera.rotation.x = (Math.PI/180) * (-90);
			this.camera.rotation.y = 0;
			this.camera.rotation.z = 0;
			*/

			this.camera.translateZ(1300);
			this.camera.translateY(50);
			this.camera.position.x = 0;

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
		new THREE.BoxGeometry(1000, 0.25, 400),
		//new THREE.BoxGeometry(1000, 0.25, 1000),
		new THREE.MeshBasicMaterial( { color: "#00ff00", transparent: true, opacity: 0.0, visible: false })
	);

/*
	var this.defenseGridObject = board.instance(filename);
				defenseGridObject = loadedObject;

				board.initOffset(loadedObject, new THREE.Vector3(0, 0, -200), new THREE.Vector3(0, 0, 0), 1.0);
				board.scene.add(loadedObject);
*/
	this.initOffset(this.rayPlane, new THREE.Vector3(0, 0, -200));

	this.scene.add(this.rayPlane);

	// Set the state to load everything needed for stage 1
	this.setState("load_earthArrival");

	if( !this.isInAltspace )
	{
//		this.localUserNameOverride = "Sith Lord";
		while( !this.localUserNameOverride || this.localUserNameOverride == "" )
			this.localUserNameOverride = prompt("Enter a player name:", "");

		if( !this.localUserNameOverride )
			window.history.back();
	}

	if( typeof this.localUserNameOverride != 'undefined' && this.localUserNameOverride != "" )
		this.localUserName = this.localUserNameOverride;

	this.tick();
};

GameBoard.prototype.removeAllActors = function(target_class_names)
{
	var targetClassNames;
	if( typeof target_class_names != 'undefined' )
		targetClassNames = target_class_names;
	else
		targetClassNames = ["EnemyShip", "PlayerLaser", "StartButton"];

	var i;
	var j;
	for( i = 0; i < this.actors.length; i++ )
	{
		for( j = 0; j < targetClassNames.length; j++ )
		{
			if( this.actors[i].ai.constructor.name == targetClassNames[j] )
			{
				//this.actors[i].setGameEvent({eventName: "destroy", priority: 100, stopsSequence: true});
				this.removeActor(this.actors[i]);

				i = i-1;
				break;
			}
		}
	}
};

GameBoard.prototype.setState = function(stateName)
{
 	this.nextStateName = stateName;
};

GameBoard.prototype.setStateDelayed = function(stateName)
{
	// If we are just now changing to this state, no network ships have been destroyed yet.
	this.networkedShips = new Array();

	this.nextStateName = null;

	//this.lastFiredTick = this.tickCount + 100;
	this.lastFiredTick = this.tickCount;

	if( stateName == "load_earthArrival" )
	{
		// FIXME This is where previous states should be cleaned up? (if the previous state wasn't the same one minus the loading: true)

		// NOT UNTIL DONE LOADING!!
		// Now perform the logic associated with switching to this state...
		// Spawn the player turret
//		var playerParams = {aiClassName: "PlayerTurret", modelName: "models/InterD/player_turret.obj", offset: new THREE.Vector3(0, 0, 0), rotation: new THREE.Vector3(0, 180, 0)};
//		this.playerTurret = this.spawnActor(playerParams);

//	this.loader.load("models/SolarSystem/sun.obj", function ( loadedObject ) {
//		thisBoard.scene.add(loadedObject);
//	});

		this.showAlert({text: "LOADING (0/" + gNumAssets + ")", duration: 800});

		var stateTickEvents = new Array();
		var thisGameBoard = this;

		// A tick event with no tick number gets executed every tick.
		stateTickEvents.push({logic: function(){
			// Otherwise, do work
			thisGameBoard.state.tick++;
			
			if( thisGameBoard.state.tick % 300 == 0 )
			{
				thisGameBoard.showAlert({text: "LOADING (" + (gNumAssets - thisGameBoard.state.caching) + "/" + gNumAssets + ")", duration: 800});
			}
		}});

		// First set the state
		this.state = {id: stateName, tick: 0, aimingEnabled: false, loading: true, caching: gNumAssets};	// gNumAssets number of models/sounds to pre-cache...

		// Now start pre-caching models
		//this.precacheModel("models/InterD/defense_grid.obj");
		this.precacheModel("models/InterD/ship_trail.obj");
		this.precacheModel("models/InterD/player_turret.obj");
		this.precacheModel("models/InterD/player_laser.obj");
		this.precacheModel("models/InterD/enemy_ship.obj");
		this.precacheModel("models/InterD/explosion.obj");
		this.precacheModel("models/SolarSystem/earth.obj");
		this.precacheModel("models/InterD/crosshair.obj");
		this.precacheModel("models/InterD/asteroid.obj");
		this.precacheSound("sounds/pistol-1");
		this.precacheSound("sounds/00electrexplo01");
		this.precacheSound("sounds/00electrexplo03");
		this.precacheSound("sounds/expl_03");
	}
	else if( stateName == "earthArrival" )
	{
		// Spawn the planet, get stuff setup, and animate the planet entry!!
		var playerParams = {aiClassName: "PlayerTurret", modelName: "models/InterD/player_turret.obj", offset: new THREE.Vector3(0, 0, 0), rotation: new THREE.Vector3(0, 180, 0)};
		var player = this.spawnActor(playerParams);


		// SET THE PLAYER TURRET
		this.playerTurret = player;

		// We can now init the cursor events that the player turret exists!
		// FIXME The cursor events should be bound to a more generic object, so the cannon can be swapped out.
		this.initCursorEvents(this.crosshair);

		this.spawnActor({aiClassName: "Planet", modelName: "models/SolarSystem/earth.obj", offset: new THREE.Vector3(-200, 0, -400), rotation: new THREE.Vector3(0, 0, 0), scale: 2.0});

		// We are now ready to begin simulating!!!
		if( this.networkEnabled )
		{
			this.networkReady = true;

			if( this.networkObject.userData.syncData.localPlayerName != "none" )
			{
				if( this.localUserName == "" || this.networkObject.userData.syncData.localPlayerName != this.localUserName )
				{
					// If there is somebody currently playing, move into the WAITING state...
					this.setState("waiting");
				}
				else
				{
					// Otherwise, if it is US who is the active player, re-load the current wave!
//					console.log(this.networkObject.userData.syncData.state.name);
//					this.setState(this.networkObject.userData.syncData.state.name);
				}
			}
			else
				this.setState("stage0");
		}
		else
			this.setState("stage0");
	}
	else if( stateName == "waiting" )
	{
		this.showAlert({text: "WAITING FOR MULTIPLAYER..."});

		//this.networkObject.userData.syncData.isBeamed = true;

		var stateTickEvents = new Array();
		var thisGameBoard = this;

		// A tick event with no tick number gets executed every tick.
		stateTickEvents.push({logic: function(){
			thisGameBoard.state.tick++;
			
			if( thisGameBoard.state.tick % 400 == 0 )
			{
				thisGameBoard.showAlert({text: "WAITING FOR MULTIPLAYER...", duration: 200});
			}
		}});

		this.state = {id: stateName, tick: 0, aimingEnabled: false, loading: false, caching: 0, tickEvents: stateTickEvents};
	}
	else if( stateName == "gameover" )
	{
		if( this.state.id == "load_earthArrival" )
			this.showAlert({text: "WELCOME"});
		else
		{
			if( this.state.id == "stage5" && this.playerTurret.ai.health > 0 )
				this.showAlert({text: "YOU WIN!!"});
			else
				this.showAlert({text: "BETTER LUCK NEXT TIME!"});
		}

		//this.networkObject.userData.syncData.isBeamed = true;

		var stateTickEvents = new Array();
		var thisGameBoard = this;

		// A tick event with no tick number gets executed every tick.
		stateTickEvents.push({logic: function(){
			thisGameBoard.state.tick--;

			if( thisGameBoard.state.tick == 0 )
			{
				//console.log("Debug info: " + this.networkReady + " AND " + this.isLocalPlayer);
				// Reset network status stuff
				if( thisGameBoard.networkReady )
				{
					if( thisGameBoard.isLocalPlayer )
					{
						thisGameBoard.networkObject.userData.syncData.localPlayerName = "none";
						thisGameBoard.networkObject.userData.syncData.lastSyncTick = thisGameBoard.tickCount;
						thisGameBoard.networkObject.userData.syncData.turret = {health: 100, yaw: 0};
						thisGameBoard.isLocalPlayer = false;

						// Sync us RIGHT NOW (because clients usally don't send any sync data during ticks unless they are the local player)
						thisGameBoard.firebaseSync.saveObject(thisGameBoard.networkObject);
					}
				}

				thisGameBoard.setState("stage0");
			}
		}});

		var tickOffset = 0;
		if( this.state.id != "load_earthArrival" )
		{
			stateTickEvents.push({tick: tickOffset + 200, logic: function(){
				thisGameBoard.showAlert({text: "SHIPS DESTROYED: " + thisGameBoard.statKills, duration: 300});
			}});

			stateTickEvents.push({tick: tickOffset + 400, logic: function(){
				thisGameBoard.showAlert({text: "THANKS FOR PLAYING", duration: 350});
			}});
		}
		else
		{
			stateTickEvents.push({tick: tickOffset + 200, logic: function(){
				thisGameBoard.showAlert({text: "DESTROY THE SHIPS TO SAVE EARTH!", duration: 300});
			}});
		}

		this.state = {id: stateName, tick: 500, aimingEnabled: false, loading: false, caching: 0, tickEvents: stateTickEvents, startHasBeenShot: false};	// States without a tick are infinite!
	}
	else if( stateName == "stage0" )
	{
		this.playerTurret.ai.health = this.playerTurret.ai.maxHealth;
		this.changeStat("kills", -this.statKills);

		this.showAlert({text: "INTERSTELLAR DEFENSE", duration: 250});

		var stateTickEvents = new Array();
		var thisGameBoard = this;

		// A tick event with no tick number gets executed every tick.
		stateTickEvents.push({logic: function(){
			if( thisGameBoard.state.startHasBeenShot )
			{
				thisGameBoard.setState("stage1");
				return;
			}

			// Otherwise, do work
			thisGameBoard.state.tick++;
			
			if( thisGameBoard.state.tick % 600 == 0 )
			{
				if( thisGameBoard.state.showDance == 0 )
				{
					thisGameBoard.showAlert({text: "SHOOT TO START<br /><img src='crosshair.png' width=160 height=160 />"});
					thisGameBoard.state.showDance = 1;
				}
				else
				{
					thisGameBoard.showAlert({text: "INTERSTELLAR DEFENSE", duration: 200});
					thisGameBoard.state.showDance = 0;
				}
			}
		}});

		//var startButton = thisGameBoard.spawnActor({aiClassName: "StartButton", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(0, 0, -100), rotation: new THREE.Vector3(0, 0, 0)});

		var tickOffset = 0;

		stateTickEvents.push({tick: tickOffset, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "StartButton", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(0, 0, -100), rotation: new THREE.Vector3(0, 0, 0)});
		}});

		this.state = {id: stateName, tick: 0, aimingEnabled: true, loading: false, caching: 0, tickEvents: stateTickEvents, startHasBeenShot: false, showDance: 0};	// States without a tick are infinite!
	}
	else if( stateName == "stage1" )
	{
		this.showAlert({text: "WAVE 1"});

		// Now setup the tickevents for the first wave of enemies
		var stateTickEvents = new Array();
		var thisGameBoard = this;

		// A tick event with no tick number gets executed every tick.
		stateTickEvents.push({logic: function(){
			if( thisGameBoard.state.enemies < 1)
				thisGameBoard.setState("stage2");
		}});

		var tickOffset = 0;

		// First wave
		stateTickEvents.push({tick: tickOffset + 50, logic: function(){
			/*
			var asteroid = thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/asteroid.obj", offset: new THREE.Vector3(500, 0, -200), rotation: new THREE.Vector3(0, 90, 0), scale: 1.0});
			asteroid.ai.health = 200;
			asteroid.ai.trailEnabled = false;
			asteroid.collideRadius = 80;
			asteroid.ai.playSequence("entrance", "pattern0");
			*/

			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(500, 0, -200), rotation: new THREE.Vector3(0, 90, 0)}).ai.playSequence("entrance", "pattern0");
		}});

		stateTickEvents.push({tick: tickOffset + 100, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(500, 0, -200), rotation: new THREE.Vector3(0, 90, 0)}).ai.playSequence("entrance", "pattern0");
		}});

		stateTickEvents.push({tick: tickOffset + 150, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(500, 0, -200), rotation: new THREE.Vector3(0, 90, 0)}).ai.playSequence("entrance", "pattern0");
		}});

		stateTickEvents.push({tick: tickOffset + 200, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(500, 0, -200), rotation: new THREE.Vector3(0, 90, 0)}).ai.playSequence("entrance", "pattern0");
		}});

		stateTickEvents.push({tick: tickOffset + 250, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(500, 0, -200), rotation: new THREE.Vector3(0, 90, 0)}).ai.playSequence("entrance", "pattern0");
		}});

		this.state = {id: stateName, aimingEnabled: true, loading: false, caching: 0, tickEvents: stateTickEvents, enemies: 5};	// States without a tick are infinite!
		//this.state = {id: stateName, tick: 1600, aimingEnabled: true, loading: false, caching: 0, tickEvents: stateTickEvents, enemies: 10};
	}
	else if( stateName == "stage2" )
	{
		this.showAlert({text: "WAVE 2"});

		// Now setup the tickevents for the first wave of enemies
		var stateTickEvents = new Array();
		var thisGameBoard = this;

		// A tick event with no tick number gets executed every tick.
		stateTickEvents.push({logic: function(){
			if( thisGameBoard.state.enemies < 1)
				thisGameBoard.setState("stage3");
		}});

		var tickOffset = 0;
		// Second wave
		stateTickEvents.push({tick: tickOffset + 0, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(-500, 0, 200), rotation: new THREE.Vector3(0, -90, 0)}).ai.playSequence("entrance", "pattern1");
		}});

		stateTickEvents.push({tick: tickOffset + 50, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(-500, 0, 200), rotation: new THREE.Vector3(0, -90, 0)}).ai.playSequence("entrance", "pattern1");
		}});

		stateTickEvents.push({tick: tickOffset + 100, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(-500, 0, 200), rotation: new THREE.Vector3(0, -90, 0)}).ai.playSequence("entrance", "pattern1");
		}});

		stateTickEvents.push({tick: tickOffset + 150, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(-500, 0, 200), rotation: new THREE.Vector3(0, -90, 0)}).ai.playSequence("entrance", "pattern1");
		}});

		stateTickEvents.push({tick: tickOffset + 200, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(-500, 0, 200), rotation: new THREE.Vector3(0, -90, 0)}).ai.playSequence("entrance", "pattern1");
		}});

		this.state = {id: stateName, aimingEnabled: true, loading: false, caching: 0, tickEvents: stateTickEvents, enemies: 5};
	}
	else if( stateName == "stage3" )
	{
		this.showAlert({text: "WAVE 3"});

		// Now setup the tickevents for the first wave of enemies
		var stateTickEvents = new Array();
		var thisGameBoard = this;

		// A tick event with no tick number gets executed every tick.
		stateTickEvents.push({logic: function(){
			if( thisGameBoard.state.enemies < 1)
				thisGameBoard.setState("stage4");
		}});

		var tickOffset = 0;
		// First wave
		stateTickEvents.push({tick: tickOffset + 50, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(500, 0, -200), rotation: new THREE.Vector3(0, 90, 0)}).ai.playSequence("entrance", "pattern0");
		}});

		stateTickEvents.push({tick: tickOffset + 100, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(500, 0, -200), rotation: new THREE.Vector3(0, 90, 0)}).ai.playSequence("entrance", "pattern0");
		}});

		stateTickEvents.push({tick: tickOffset + 150, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(500, 0, -200), rotation: new THREE.Vector3(0, 90, 0)}).ai.playSequence("entrance", "pattern0");
		}});

		stateTickEvents.push({tick: tickOffset + 200, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(500, 0, -200), rotation: new THREE.Vector3(0, 90, 0)}).ai.playSequence("entrance", "pattern0");
		}});

		stateTickEvents.push({tick: tickOffset + 250, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(500, 0, -200), rotation: new THREE.Vector3(0, 90, 0)}).ai.playSequence("entrance", "pattern0");
		}});

		// Second wave
		tickOffset = 0;
		stateTickEvents.push({tick: tickOffset + 50, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(-500, 0, 200), rotation: new THREE.Vector3(0, -90, 0)}).ai.playSequence("entrance", "pattern1");
		}});

		stateTickEvents.push({tick: tickOffset + 100, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(-500, 0, 200), rotation: new THREE.Vector3(0, -90, 0)}).ai.playSequence("entrance", "pattern1");
		}});

		stateTickEvents.push({tick: tickOffset + 150, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(-500, 0, 200), rotation: new THREE.Vector3(0, -90, 0)}).ai.playSequence("entrance", "pattern1");
		}});

		stateTickEvents.push({tick: tickOffset + 200, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(-500, 0, 200), rotation: new THREE.Vector3(0, -90, 0)}).ai.playSequence("entrance", "pattern1");
		}});

		stateTickEvents.push({tick: tickOffset + 250, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(-500, 0, 200), rotation: new THREE.Vector3(0, -90, 0)}).ai.playSequence("entrance", "pattern1");
		}});

		this.state = {id: stateName, tick: 1600, aimingEnabled: true, loading: false, caching: 0, tickEvents: stateTickEvents, enemies: 10};
	}
	else if( stateName == "stage4" )
	{
		this.showAlert({text: "WAVE 4"});

		// Now setup the tickevents for the first wave of enemies
		var stateTickEvents = new Array();
		var thisGameBoard = this;

		// A tick event with no tick number gets executed every tick.
		stateTickEvents.push({logic: function(){
			if( thisGameBoard.state.enemies < 1)
				thisGameBoard.setState("stage5");
		}});

		var tickOffset = 0;

		// wave 1
		stateTickEvents.push({tick: tickOffset + 50, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(500, 0, -200), rotation: new THREE.Vector3(0, 90, 0)}).ai.playSequence("entrance", "pattern2");
		}});

		stateTickEvents.push({tick: tickOffset + 100, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(500, 0, -200), rotation: new THREE.Vector3(0, 90, 0)}).ai.playSequence("entrance", "pattern2");
		}});

		stateTickEvents.push({tick: tickOffset + 150, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(500, 0, -200), rotation: new THREE.Vector3(0, 90, 0)}).ai.playSequence("entrance", "pattern2");
		}});

		stateTickEvents.push({tick: tickOffset + 200, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(500, 0, -200), rotation: new THREE.Vector3(0, 90, 0)}).ai.playSequence("entrance", "pattern2");
		}});

		stateTickEvents.push({tick: tickOffset + 250, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(500, 0, -200), rotation: new THREE.Vector3(0, 90, 0)}).ai.playSequence("entrance", "pattern2");
		}});

		// wave 2
		tickOffset = 100;
		stateTickEvents.push({tick: tickOffset + 50, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(-500, 0, 200), rotation: new THREE.Vector3(0, -90, 0)}).ai.playSequence("entrance", "pattern3");
		}});

		stateTickEvents.push({tick: tickOffset + 100, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(-500, 0, 200), rotation: new THREE.Vector3(0, -90, 0)}).ai.playSequence("entrance", "pattern3");
		}});

		stateTickEvents.push({tick: tickOffset + 150, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(-500, 0, 200), rotation: new THREE.Vector3(0, -90, 0)}).ai.playSequence("entrance", "pattern3");
		}});

		stateTickEvents.push({tick: tickOffset + 200, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(-500, 0, 200), rotation: new THREE.Vector3(0, -90, 0)}).ai.playSequence("entrance", "pattern3");
		}});

		stateTickEvents.push({tick: tickOffset + 250, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(-500, 0, 200), rotation: new THREE.Vector3(0, -90, 0)}).ai.playSequence("entrance", "pattern3");
		}});

		this.state = {id: stateName, tick: 1600, aimingEnabled: true, loading: false, caching: 0, tickEvents: stateTickEvents, enemies: 10};
	}
	else if( stateName == "stage5" )
	{
		this.showAlert({text: "WAVE 5"});

		// Now setup the tickevents for the first wave of enemies
		var stateTickEvents = new Array();
		var thisGameBoard = this;

		// A tick event with no tick number gets executed every tick.
		stateTickEvents.push({logic: function(){
			if( thisGameBoard.state.enemies < 1)
				thisGameBoard.setState("gameover");
		}});

		var tickOffset = 0;

		// 2 guys attack on the left straight away
		stateTickEvents.push({tick: tickOffset + 0, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(-500, 0, 200), rotation: new THREE.Vector3(0, -90, 0)}).ai.playSequence("entrance", "pattern7");
		}});

		stateTickEvents.push({tick: tickOffset + 50, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(-500, 0, 200), rotation: new THREE.Vector3(0, -90, 0)}).ai.playSequence("entrance", "pattern7");
		}});

		// wave 1
		stateTickEvents.push({tick: tickOffset + 50, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(500, 0, -200), rotation: new THREE.Vector3(0, 90, 0)}).ai.playSequence("entrance", "pattern4");
		}});

		stateTickEvents.push({tick: tickOffset + 100, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(500, 0, -200), rotation: new THREE.Vector3(0, 90, 0)}).ai.playSequence("entrance", "pattern5");
		}});

		stateTickEvents.push({tick: tickOffset + 150, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(500, 0, -200), rotation: new THREE.Vector3(0, 90, 0)}).ai.playSequence("entrance", "pattern4");
		}});

		stateTickEvents.push({tick: tickOffset + 200, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(500, 0, -200), rotation: new THREE.Vector3(0, 90, 0)}).ai.playSequence("entrance", "pattern5");
		}});

		stateTickEvents.push({tick: tickOffset + 250, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(500, 0, -200), rotation: new THREE.Vector3(0, 90, 0)}).ai.playSequence("entrance", "pattern4");
		}});

		// wave 2
		tickOffset = 100;
		stateTickEvents.push({tick: tickOffset + 0, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(-500, 0, 200), rotation: new THREE.Vector3(0, -90, 0)}).ai.playSequence("entrance", "pattern6");
		}});

		stateTickEvents.push({tick: tickOffset + 100, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(-500, 0, 200), rotation: new THREE.Vector3(0, -90, 0)}).ai.playSequence("entrance", "pattern6");
		}});

		stateTickEvents.push({tick: tickOffset + 200, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(-500, 0, 200), rotation: new THREE.Vector3(0, -90, 0)}).ai.playSequence("entrance", "pattern6");
		}});
/*
		stateTickEvents.push({tick: tickOffset + 100, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(-500, 0, 200), rotation: new THREE.Vector3(0, -90, 0)}).ai.playSequence("entrance", "pattern3");
		}});

		stateTickEvents.push({tick: tickOffset + 150, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(-500, 0, 200), rotation: new THREE.Vector3(0, -90, 0)}).ai.playSequence("entrance", "pattern3");
		}});

		stateTickEvents.push({tick: tickOffset + 200, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(-500, 0, 200), rotation: new THREE.Vector3(0, -90, 0)}).ai.playSequence("entrance", "pattern3");
		}});

		stateTickEvents.push({tick: tickOffset + 250, logic: function(){
			thisGameBoard.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(-500, 0, 200), rotation: new THREE.Vector3(0, -90, 0)}).ai.playSequence("entrance", "pattern3");
		}});
*/
		this.state = {id: stateName, tick: 1600, aimingEnabled: true, loading: false, caching: 0, tickEvents: stateTickEvents, enemies: 10};
	}
	else
		this.state = this.defaultState;

	if( this.networkReady )
	{
		if( this.isLocalPlayer )
		{
			this.networkObject.userData.syncData.state.name = this.state.id;
			this.networkObject.userData.syncData.state.startTick = this.tickCount;	// Need to broadcast when we started so our "last fired" tick numbers make sense to clients.
			this.networkObject.userData.syncData.deadShips = 0x0;
			this.networkObject.userData.syncData.fire = {tick: -1, yaw: 0};

			this.networkObject.isNetworkDirty = true;
		}
	}
};

GameBoard.prototype.precacheModel = function(model_file_name)
{
	// Note that it's possible that another call to load this model comes in before this is done caching, but thats okay becuase it will be ignored in the load callback.
	if( typeof this.cachedModels[model_file_name] != 'undefined' )
		return;

	var thisGameBoard = this;
	var thisModelFileName = model_file_name;
	var mtl_file_name = model_file_name.substring(0, model_file_name.length - 3) + "mtl";
	this.loader.load(model_file_name, mtl_file_name, function( loadedObject ) { thisGameBoard.onModelCached(loadedObject, thisModelFileName); });
};

GameBoard.prototype.onModelCached = function(loadedObject, modelFileName)
{
	if( !this.state.loading || this.state.caching < 1 || typeof this.cachedModels[modelFileName] != 'undefined' )
		return;

	this.cachedModels[modelFileName] = loadedObject;
	this.state.caching--;

	var cacheInstance = loadedObject.clone();
	cacheInstance.scale.set(0.01, 0.01, 0.01);
	this.scene.add(cacheInstance);

	this.showAlert({text: "LOADING (" + (gNumAssets - this.state.caching) + "/" + gNumAssets + ")", duration: 800});
	console.log("Precached model: " + modelFileName);

	if( this.state.caching < 1 )
	{
		var nextStateName = this.state.id.substring(5);
		this.setState(nextStateName);
	}
};

//var switcher = false;
GameBoard.prototype.rayCast = function(ray)
{
	if( !this.mouseAimEnabled || typeof this.playerTurret.sceneObject == 'undefined' || !this.listener )	// || switcher
		return;

	if( this.networkReady && this.networkObject.userData.syncData.localPlayerName != "none" && !this.isLocalPlayer )
	{
		if( this.crosshair )
		{
			this.crosshair.position.x = this.playerTurret.sceneObject.position.x;
			this.crosshair.position.y = this.playerTurret.sceneObject.position.y;
			this.crosshair.position.z = this.playerTurret.sceneObject.position.z;
		}
		return;
	}

	this.raycaster.set( ray.origin, ray.direction );

	//this.showAlert({text: ray.origin.distanceTo(new THREE.Vector3(0, 0, 0))});

	/*
	var bIsWithinX = false;
	if( ray.origin.x < window.innerWidth/2 && ray.origin.x > -window.innerWidth/2 )
		bIsWithinX = true;

	var bIsWithinY = false;
	if( ray.origin.y < window.innerHeight/2 && ray.origin.y > -window.innerHeight/2 )
		bIsWithinY = true;

	var bIsWithinZ = false;
	if( ray.origin.z < window.innerDepth/2 && ray.origin.z > -window.innerDepth/2 )
		bIsWithinZ = true;

	if( bIsWithinX && bIsWithinY && bIsWithinZ )
		this.showAlert({text: "STAND OUTSIDE OF BOUNDING BOX TO AIM"});
	*/

/*
	this.playerCursorPosition = ray.origin.add(ray.direction.multiplyScalar(1000.0));
	this.playerTurret.setGameEvent({eventName: "setLook", priority: 0, stopsSequence: false});
*/

	var intersects = this.raycaster.intersectObjects( this.scene.children );

	var pos = ( intersects.length > 0 ) ? intersects[0].point : ray.origin;

	if ( intersects.length > 0 )
	{
		if( this.crosshair )
		{
			this.crosshair.position.x = pos.x;
			this.crosshair.position.y = pos.y;
			this.crosshair.position.z = pos.z;
		}

		this.playerCursorPosition = intersects[0].point;
		// Instead of modifying game objects here, just set a game event that the board handles during the next tick.
		this.playerTurret.setGameEvent({eventName: "setLook", priority: 0, stopsSequence: false});
	}
};

// Note that the "this" pointer in this callback will be to the listener object, NOT the GameBoard object itself.
GameBoard.prototype.onCursorMove = function(e)
{
//	if( this.networkReady && (this.networkObject.userData.syncData.localPlayerName != "none" && !this.isLocalPlayer )
//		return;
	if( this.state.aimingEnabled )
		board.rayCast(e.ray);
};

GameBoard.prototype.tick = function()
{
	this.tickCount++;

	if( this.shuttingDown )
		return;

	// If we used to be not beamed, but now we are beamed, then gtfo
	/*
	if( this.networkReady )
	{
		var personal = (window.innerDepth == 300);

		if( this.networkObject.userData.syncData.isBeamed != personal )
		{
			this.shuttingDown = true;

			document.location.href = this.beamedURL;
			return;
		}
	}
	*/

//console.log("Debug info: " + (this.networkObject.userData.syncData.localPlayerName == this.localUserName) + " and " + (!this.isLocalPlayer));
//console.log("Debug info: " + this.networkObject.userData.syncData.localPlayerName + " and " + this.localUserName);

	//if( this.networkEnabled )
	if( this.networkReady )
	{
		// Determine if we are here and ready to start a networked game...
		if( this.networkObject.userData.syncData.localPlayerName == this.localUserName )
		{
			if( !this.isLocalPlayer )
			{
				// Set us as the local player.
				this.isLocalPlayer = true;
				this.setState("stage1");
			}
		}
		else if( !this.isLocalPlayer )
		{
			// Otherwise, we are in pure CLIENT mode
			// MIRROR THE TURRET ROTATION
			if( this.networkObject.userData.syncData.localPlayerName != "none" )
				this.playerTurret.sceneObject.rotation.y = this.networkObject.userData.syncData.turret.yaw;

			// IF THE CURRENT NETWORKED FIRE IS NOT OUR LAST LOCAL FIRE, FIRE IT
			if( this.networkObject.userData.syncData.fire.tick != -1 && (!this.networkFire || this.networkObject.userData.syncData.fire.tick != this.networkFire.tick) )
			{
				this.networkFire = this.networkObject.userData.syncData.fire;
				this.playerFire();
			}

			// IF THE CURRENT NETWORK STATE IS NOT WHAT IT USED TO BE, THEN FIRE IT
			if( this.networkObject.userData.syncData.state.name != "none" && (!this.networkState || this.networkObject.userData.syncData.state.name != this.networkState.name || this.networkObject.userData.syncData.state.startTick != this.networkState.startTick))
			{
				// Replicate the state change!
				this.networkState = this.networkObject.userData.syncData.state;
				this.setState(this.networkObject.userData.syncData.state.name);
//				return;
			}
		}
	}

	this.crosshair.rotateY(0.01);

	this.pendingStateChange = !!this.nextStateName;

	if( this.pendingStateChange )
	{
// 		if( this.nextStateName == "stage1" )
//			this.removeAllActors(["EnemyShip", "PlayerLaser"]);
//		else
			this.removeAllActors();
	}

	var numEnemies = 0;
	var i;
	for( i = 0; i < this.actors.length; i++)
	{
		if( this.playerTurret && this.playerTurret.team != this.actors[i].team )
			numEnemies++;

		this.actors[i].onTick();
	}

	/*
	if( numEnemies < 5 && this.tickCount - this.lastSpawnedEnemy > 50)
	{
		var randomSequenceName = (Math.random() > 0.5) ? "alpha" : "beta";
		var plusOrMinus = Math.random() < 0.5 ? -1 : 1;
		//this.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(Math.random() * 80 * plusOrMinus, 0, -380), rotation: new THREE.Vector3(0, 0, 0)}).ai.playSequence("entrance", randomSequenceName);
		this.spawnActor({aiClassName: "EnemyShip", modelName: "models/InterD/enemy_ship.obj", offset: new THREE.Vector3(500, 0, -200), rotation: new THREE.Vector3(0, 90, 0)}).ai.playSequence("entrance", "pattern0");
		//new THREE.Vector3(130, 0, -550) 30
	}
	*/

	if( typeof this.state.tickEvents != 'undefined' && !this.pendingStateChange)	// Only do state tick events if we are not about to get a delayed set state
	{
		for( i = 0; i < this.state.tickEvents.length; i++)
		{
			if( typeof this.state.tickEvents[i].tick == 'undefined' )
				this.state.tickEvents[i].logic();
			else
			{
				if(this.state.tickEvents[i].tick > 0)
					this.state.tickEvents[i].tick--;

				if( this.state.tickEvents[i].tick == 0 )
				{
					this.state.tickEvents[i].logic();
					this.state.tickEvents[i].tick--;
				}
			}
		}
	}

	var thisGameBoard = this;
	requestAnimationFrame( function(){ thisGameBoard.tick(); } );

	if( this.cursorEvents )
		this.cursorEvents.update();

	this.renderer.render( this.scene, this.camera );

	// Handle some UI stuff
	if( this.alertDuration > 0)
		this.alertDuration--;

	if( this.alertDuration == 0 )
	{
		this.alertDuration = -1;

		this.alertSlateElem = document.getElementById("alertSlate");
		this.alertSlateElem.style.opacity = 0.0;
	}

	if( this.pendingStateChange )
	{
		this.setStateDelayed(this.nextStateName);
	}

	/*
		XYZ/PYR	: auto-sycned by THREE.js
		deadShips	: int flags of all dead ships
		startWave	: int wave number to initiate
		fire		: int should we fire a laser?
	*/

	// If this the local user name has changed since last tick, update it.
	if( this.networkReady )
	{
		if( this.lastLocalUserName != this.networkObject.userData.syncData.localPlayerName )
		{
			this.lastLocalUserName = this.networkObject.userData.syncData.localPlayerName;
			this.currentPlayerElem.innerText = this.lastLocalUserName;
		}

		if( this.lastPlayerCount != this.networkObject.userData.syncData.numPlayers )
		{
			this.lastNumPlayers = this.networkObject.userData.syncData.numPlayers;
			this.numPlayerElem.innerText = this.lastNumPlayers;	
		}

		if( this.lastLocalUserName == "none" )
			this.currentPlayerSlateElem.style.display = "none";
		else
			this.currentPlayerSlateElem.style.display = "block";
	}

	// AFTER THE SERVER EXECUTES THE LOGIC FOR THE TICK, SYNC THE NETWORK OBJECT
	if( this.networkReady )
	{
		if( this.isLocalPlayer )
		{
			if( this.networkObject.isNetworkDirty )
			{
				this.networkObject.userData.syncData.lastSyncTick = this.tickCount;
				this.firebaseSync.saveObject(this.networkObject);
			//	console.log("Syncing network object...");
			//	console.log(this.networkObject);
			}

			// Clear this sync event out.
			if( this.networkObject )
				this.networkObject.isNetworkDirty = false;
		}
		else
		{
			if( this.lastSyncedTick == this.networkObject.userData.syncData.lastSyncTick && this.networkObject.userData.syncData.localPlayerName != "none" )
			{
				this.timeoutTickCount++;

				if( this.timeoutTickCount >= this.timeoutMaxTicks )
				{
					this.timeoutTickCount = 0;

					// Reset the state cuz the host timed out.
					this.networkObject.userData.syncData.deadShips = 0;
					this.networkObject.userData.syncData.fire = {tick: -1, yaw: 0};
					this.networkObject.userData.syncData.localPlayerName = "none";
//					this.networkObject.userData.syncData.numPlayers--;
					this.networkObject.userData.syncData.state = {name: "gameover", startTick: 0};
					this.networkObject.userData.syncData.turret = {health: 100, yaw: 0};
					this.networkObject.userData.syncData.lastSyncTick = -1;
					this.firebaseSync.saveObject(this.networkObject);
				}
			}
			else
				this.timeoutTickCount = 1;

			this.lastSyncedTick = this.networkObject.userData.syncData.lastSyncTick;
		}
	}
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

GameBoard.prototype.playerFire = function(is_network_fire)
{
	var oldYaw = this.playerTurret.sceneObject.rotation.y;	// Needed for network fire

	var isNetworkFire = false;
	if( typeof is_network_fire != "undefined" && is_network_fire )
	{
		isNetworkFire = true;

		this.playerTurret.sceneObject.rotation.y = this.networkFire.yaw;
		this.playerTurret.sceneObject.updateMatrix();
	}

	if( this.tickCount - this.lastFiredTick < this.fireRate && !isNetworkFire )
		return;

	this.lastFiredTick = this.tickCount;

	var laser1Template = {aiClassName: "PlayerLaser", modelName: "models/InterD/player_laser.obj", offset: new THREE.Vector3(16, 0, 26), matrix: this.playerTurret.sceneObject.matrix};
	var laser2Template = {aiClassName: "PlayerLaser", modelName: "models/InterD/player_laser.obj", offset: new THREE.Vector3(-16, 0, 26), matrix: this.playerTurret.sceneObject.matrix};

	this.playerTurret.setGameEvent({eventName: "fire", priority: 50, projectiles: [laser1Template, laser2Template]});
	this.turningAmount = 0;

	// If we shot, make sure our network state is updated.
	if( this.networkReady )
	{
		if( this.isLocalPlayer )
		{
			var rot = this.playerTurret.sceneObject.rotation;
			this.networkObject.userData.syncData.fire.yaw = rot.y;
			this.networkObject.userData.syncData.fire.tick = this.tickCount;

			this.networkObject.isNetworkDirty = true;
		}
		else
		{
			this.playerTurret.sceneObject.rotation.y = oldYaw;
			this.playerTurret.sceneObject.updateMatrix();
		}
	}
};

GameBoard.prototype.detectCollision = function(actor0, actor1)
{
	if( !actor0.sceneObject || !actor1.sceneObject )
		return;
	
	var dist = actor0.sceneObject.position.distanceTo(actor1.sceneObject.position);
	var colDist = (actor0.collideRadius + actor1.collideRadius) * this.scaleFactor;

	if( dist < colDist )
		return true;

	return false;
};
