function GameBoard()
{
	this.isInAltspace = null;

	this.renderer = null;
	this.scene = null;
	this.cursorEvents = null;
	this.loader = null;
	this.actors = null;

	// Only used while INSIDE of AltspaceVR
	this.scaleFactor = 5.0;

	// Only used while OUTSIDE of AltspaceVR
	this.camera = null;
	this.ambient = null;

	// Initialize everything
	this.init();

	// Start the simulation
	this.tick();
}

GameBoard.prototype.init = function()
{
	this.isInAltspace = !!window.Alt;
	this.loader = new THREE.AltOBJMTLLoader();
	this.actors = new Array();

	// Initialize the scene
	this.scene = new THREE.Scene();

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
		this.camera.position.z = 300;
		this.camera.position.y = 0;
		this.camera.lookAt( this.scene.position );

		this.ambient = new THREE.AmbientLight( 0xffffff );
		this.scene.add( this.ambient );
	}

	// Initialize the cursor events
	this.cursorEvents = new CursorEvents();
	this.cursorEvents.enableMouseEvents(this.camera);	// It's OK to pass a null pointer here if we're inside of AltspaceVR
};

GameBoard.prototype.tick = function()
{
	var i;
	for( i = 0; i < this.actors.length; i++)
	{
		this.actors[i].onTick();
	}

	var thisGameBoard = this;
	requestAnimationFrame( function(){ thisGameBoard.tick(); } );

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
};