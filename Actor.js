function Actor(params)
{
	this.gameBoard = params.gameBoard;
	this.modelName = params.modelName;

	this.ai = eval("new " + params.aiClassName + "(this);");

	this.gameEvent = null;
	this.sceneObject = null;

	this.init();
}

Actor.prototype.onTick = function()
{
	if( !this.sceneObject )
		return;

	this.ai.onTick();
}

Actor.prototype.deltaRotate = function(degrees, axis)
{
	var rotationAxis;

	if( typeof axis != 'undefined' )
		rotationAxis = axis;
	else
		rotationAxis = new THREE.Vector3(-1,0,0);

   	var rotObjectMatrix = new THREE.Matrix4();
   	rotObjectMatrix.makeRotationAxis(rotationAxis.normalize(), (Math.PI / 180) * degrees);

	this.sceneObject.matrix.multiply(rotObjectMatrix);
    this.sceneObject.rotation.setFromRotationMatrix(this.sceneObject.matrix);
};

Actor.prototype.init = function()
{
	// loader assumes .mtl file has same basename as .obj file
	var filename = this.modelName;

	var thisActor = this;
	this.gameBoard.loader.load(filename, function ( loadedObject ) {
		thisActor.sceneObject = loadedObject;

		loadedObject.position.x = 0;
		loadedObject.position.y = 0;
		loadedObject.position.z = 0;

		thisActor.deltaRotate(90, new THREE.Vector3(0, 1, 0));
//		thisActor.deltaRotate(5);

		var scale = new THREE.Vector3( thisActor.gameBoard.scaleFactor, thisActor.gameBoard.scaleFactor, thisActor.gameBoard.scaleFactor);

		if( thisActor.gameBoard.isInAltspace )
			loadedObject.scale.copy( scale );

		thisActor.gameBoard.scene.add(loadedObject);
		thisActor.gameBoard.cursorEvents.addObject(loadedObject);
	});
};

function EnemyBee(actor)
{
	this.actor = actor;
	this.sequenceName = null;
	this.sequences = {};

	var sequence = {};
	sequence.name = "straight-down";
//	sequence.absoluteRotation = 
	sequence.deltaRotation = null;
}

EnemyBee.prototype.onTick = function()
{
	if( !this.actor.gameEvent )
	{
		this.actor.deltaRotate(2);
		this.actor.sceneObject.translateZ(1);
	}
	else
	{
		this.actor.gameEvent = null;
	}
};