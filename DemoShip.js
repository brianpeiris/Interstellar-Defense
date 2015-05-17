function Demo()
{
	this.isInAltspace = !!window.Alt;
	this.demoContainer = document.getElementById("demoContainer");

	this.loader = null;
	this.scene = null;
	this.camera = null;
	this.renderer = null;
	//this.cursorEvents = null;
	this.ship = null;
	this.scale = 1.0;

	this.initScene();

	// Start loading the ship...
	var thisDemo = this;
	this.loader.load("models/InterD/enemy_ship.obj", function ( loadedObject ) {
		if( !!window.Alt )
			loadedObject.position.set(0, 57, 750);

		thisDemo.ship = loadedObject;
		thisDemo.scene.add(thisDemo.ship);

		thisDemo.tick();
	});
	// Call the tick after the ship is done loading
	
}

Demo.prototype.initScene = function()
{
	this.loader = new THREE.AltOBJMTLLoader();
	this.scene = new THREE.Scene();

	if ( this.isInAltspace )
	{
		this.renderer = new THREE.AltRenderer();
	}
	else
	{
		this.renderer = new THREE.WebGLRenderer({alpha: true});
		//this.renderer.setClearColor("#000000");
		this.renderer.setSize( 300, 200 );
//		this.renderer.setSize( window.innerWidth, window.innerHeight );

		this.demoContainer.appendChild(this.renderer.domElement);
		//document.body.appendChild( this.renderer.domElement );

		var aspect = 300 / 200;
		//var aspect = window.innerWidth/window.innerHeight;
		this.camera = new THREE.PerspectiveCamera(45, aspect, 1, 2000 );
		this.camera.position.x = 0;
		this.camera.position.y = 0;
		this.camera.position.z = 60;

//		this.camera.lookAt( this.scene.position );

		var ambient = new THREE.AmbientLight( 0xffffff );
		this.scene.add( ambient );

//		this.camera.translateZ(0);
	}
};

Demo.prototype.insertDebugAxis = function()
{
    //Shorten the vertex function
    function v(x,y,z){ 
            return new THREE.Vertex(new THREE.Vector3(x,y,z)); 
    }
    
    //Create axis (point1, point2, colour)
    function createAxis(p1, p2, color){
            var line, lineGeometry = new THREE.Geometry(),
            lineMat = new THREE.LineBasicMaterial({color: color, lineWidth: 1});
            lineGeometry.vertices.push(p1, p2);
            line = new THREE.Line(lineGeometry, lineMat);
            this.scene.add(line);
    }
    
    createAxis(v(-axisLength, 0, 0), v(axisLength, 0, 0), 0xFF0000);
    createAxis(v(0, -axisLength, 0), v(0, axisLength, 0), 0x00FF00);
    createAxis(v(0, 0, -axisLength), v(0, 0, axisLength), 0x0000FF);
};

Demo.prototype.tick = function()
{
	var thisDemo = this;
	requestAnimationFrame( function() { thisDemo.tick(); } );
	//this.cursorEvents.update();

	if( this.ship )
		this.ship.rotation.y += 0.01;
		//this.ship.rotateY(0.1);

	this.renderer.render( this.scene, this.camera );
}

Demo.prototype.initEvents = function()
{
	var params = {};
	this.cursorEvents = new CursorEvents(params);
	this.cursorEvents = new CursorEvents();
	this.cursorEvents.enableMouseEvents(this.camera);
};