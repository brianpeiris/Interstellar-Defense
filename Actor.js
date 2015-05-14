function Actor(params)
{
	this.spawnMatrix = null;
	this.spawnOffset = null;
	this.spawnRotation = null;

	if( typeof params.offset != 'undefined' )
		this.spawnOffset = params.offset;
	else
		this.spawnOffset = new THREE.Vector3(0, 0, 0);

	if( typeof params.rotation != 'undefined' )
		this.spawnRotation = params.rotation;
	else
		this.spawnRotation = new THREE.Vector3(0, 0, 0);

	if( typeof params.matrix != 'undefined' )
		this.spawnMatrix = params.matrix;

	this.gameBoard = params.gameBoard;
	this.modelName = params.modelName;
	this.aiClassName = params.aiClassName;

	this.ai = null;
	this.team = null;
	this.collideRadius = null;
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

Actor.prototype.destroy = function()
{
	this.gameBoard.scene.remove(this.sceneObject);
};

Actor.prototype.orbitWorldOrigin = function(degrees)
{
    var rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(new THREE.Vector3(1,0,0).normalize(), (Math.PI / 180) * degrees);
    rotWorldMatrix.multiply(this.sceneObject.matrix);
    this.sceneObject.matrix = rotWorldMatrix;
    this.sceneObject.rotation.setFromRotationMatrix(this.sceneObject.matrix);
};

Actor.prototype.init = function()
{
	this.ai = eval("new " + this.aiClassName + "(this);");

	// loader assumes .mtl file has same basename as .obj file
	var filename = this.modelName;

	var thisActor = this;
	this.gameBoard.loader.load(filename, function ( loadedObject ) {
//		thisActor.ai = eval("new " + thisActor.aiClassName + "(thisActor);");
		thisActor.sceneObject = loadedObject;
		loadedObject.up.set( 0, 0, 1 );

		// If there is a matrix to clone, apply it first
		if( thisActor.spawnMatrix )
			loadedObject.applyMatrix(thisActor.spawnMatrix);
		else
		{
			// Otherwise we still need to apply the board offset
			loadedObject.position.x = thisActor.gameBoard.boardOffset.x;
			loadedObject.position.y = thisActor.gameBoard.boardOffset.y;
			loadedObject.position.z = thisActor.gameBoard.boardOffset.z;
			loadedObject.rotation.x = 0;
			loadedObject.rotation.y = 0;
			loadedObject.rotation.z = 0;
		}

		// Apply the spawn rotation
		loadedObject.rotateX(thisActor.spawnRotation.x * (Math.PI/180));
		loadedObject.rotateY(thisActor.spawnRotation.y * (Math.PI/180));
		loadedObject.rotateZ(thisActor.spawnRotation.z * (Math.PI/180));

		// Apply the spawn offsets
		loadedObject.translateX(thisActor.spawnOffset.x * thisActor.gameBoard.scaleFactor);
		loadedObject.translateY(thisActor.spawnOffset.y * thisActor.gameBoard.scaleFactor);
		loadedObject.translateZ(thisActor.spawnOffset.z * thisActor.gameBoard.scaleFactor);

//		thisActor.deltaRotate(90, new THREE.Vector3(0, 1, 0));
//		thisActor.deltaRotate(90, new THREE.Vector3(1, 0, 0));

//			thisActor.deltaRotate(45, new THREE.Vector3(1, 0, 0));

			// Orbit the whole thing so it looks like it's coming out of the wall
			/*
		if( thisActor.gameBoard.rotationEnabled )
			thisActor.orbitWorldOrigin(thisActor.gameBoard.rotation);
		*/
/*
		if( typeof thisActor.spawnRotation != 'undefined' )
		{
			loadedObject.rotation.x = thisActor.spawnRotation.x;
			loadedObject.rotation.y = thisActor.spawnRotation.y;
			loadedObject.rotation.z = thisActor.spawnRotation.z;

			//thisActor.deltaRotate(thisActor.spawnRotation.y, new THREE.Vector3(0, 0, 1));
		}
*/

/*
		if( typeof thisActor.lookAt != 'undefined' )
		{
			loadedObject.lookAt(thisActor.lookAt);
		}
*/

//		loadedObject.translateX(thisActor.spawnX * thisActor.board.scaleFactor);
//		loadedObject.translateY(-thisActor.spawnY * thisActor.board.scaleFactor);
//		loadedObject.translateZ(thisActor.spawnZ * thisActor.board.scaleFactor);

//		thisActor.deltaRotate(5);

		var scale = new THREE.Vector3( thisActor.gameBoard.scaleFactor, thisActor.gameBoard.scaleFactor, thisActor.gameBoard.scaleFactor);

		if( thisActor.gameBoard.isInAltspace )
			loadedObject.scale.copy( scale );

		thisActor.gameBoard.scene.add(loadedObject);
//		thisActor.gameBoard.cursorEvents.addObject(loadedObject);
	});
};

Actor.prototype.setGameEvent = function(params)
{
	if( !this.gameEvent || this.gameEvent.priority < params.priority )
		this.gameEvent = params;
};

function EnemyShip(actor)
{
	this.gameBoard = actor.gameBoard;
	this.maxDist = 500 * this.gameBoard.scaleFactor;	// If you go further away from the player than this, they blow you up, BOOM!

	this.actor = actor;
	this.actor.team = 1;
	this.gameBoard.lastSpawnedEnemy = this.gameBoard.tickCount;
	this.actor.collideRadius = 20.0;

	this.health = 100;
	this.damageAmount = 100;

	this.sequence = null;
	this.sequences = {};

	var sequenceEntrance0 = {};
	sequenceEntrance0.name = "entrance0";
	sequenceEntrance0.step = null;
	sequenceEntrance0.steps = new Array();

	var step0 = {};
	step0.length = 100;
	step0.deltaRotate = 0;
	step0.deltaTranslate = new THREE.Vector3(0, 0, 1);
	sequenceEntrance0.steps.push(step0);

	var step1 = {};
	step1.length = 150;
	step1.deltaRotate = 2;
	step1.deltaTranslate = new THREE.Vector3(0, 0, 1);
	sequenceEntrance0.steps.push(step1);

	var step3 = {};
	step3.length = 100;
	step3.deltaRotate = 0;
	step3.deltaTranslate = new THREE.Vector3(0, 0, 1);
	sequenceEntrance0.steps.push(step3);

	var step4 = {};
	step4.length = 100;
	step4.deltaRotate = -2;
	step4.deltaTranslate = new THREE.Vector3(0, 0, 1);
	sequenceEntrance0.steps.push(step4);

	var step5 = {};
	step5.length = 100;
	step5.deltaRotate = 0;
	step5.deltaTranslate = new THREE.Vector3(0, 0, 1);
	sequenceEntrance0.steps.push(step5);

	var step6 = {};
	step6.length = 100;
	step6.deltaRotate = -2;
	step6.deltaTranslate = new THREE.Vector3(0, 0, 1);
	sequenceEntrance0.steps.push(step6);

	var step7 = {};
	step7.length = 0;	// infinite
	step7.deltaRotate = 0;
	step7.turning = 0;
	step7.turnStartTick = 0;
	step7.turnMaxLength = 80;
	step7.turnRotation = 0;
	step7.deltaTranslate = new THREE.Vector3(0, 0, 1);
	sequenceEntrance0.steps.push(step7);

	sequenceEntrance0.animStart = null;

	var thisShip = this;
	sequenceEntrance0.onTick = function() {
		if( !this.actor.sceneObject )
			return;

		var currentStep = this.steps[this.step];
		if( this.animStart == -1 )
			this.animStart = this.gameBoard.tickCount;

		if( this.gameBoard.tickCount - this.animStart <= currentStep.length || this.step+1 == this.steps.length )	// Added an infinite behavior at the end of the sequence.
		{
			this.actor.sceneObject.rotateY((Math.PI / 180) * currentStep.deltaRotate);
			this.actor.sceneObject.translateX(currentStep.deltaTranslate.x * this.gameBoard.scaleFactor);
			this.actor.sceneObject.translateY(currentStep.deltaTranslate.y * this.gameBoard.scaleFactor);
			this.actor.sceneObject.translateZ(currentStep.deltaTranslate.z * this.gameBoard.scaleFactor);

			// If we are on the final step, give it some wondering around behavior
			if( this.step+1 == this.steps.length )
			{
				if( this.gameBoard.tickCount - currentStep.turnStartTick > currentStep.turnMaxLength * (0.7 + Math.random() * 0.3)) 
				{
					// Change direction
					var chance = Math.random();
					if( chance < 0.4 )
						currentStep.turning = -1;
					else if( chance > 0.6 )
						currentStep.turning = 1;
					else
						currentStep.turning = 0;

					var plusOrMinus = Math.random() < 0.5 ? -1 : 1;
					currentStep.turnRotation = Math.random() * 2 * plusOrMinus;

					currentStep.turnStartTick = this.gameBoard.tickCount;
				}
			}

			if( currentStep.turnRotation )
				this.actor.sceneObject.rotateY((Math.PI / 180) * currentStep.turnRotation * (currentStep.turning / 1.0));
		}
		else
		{
			if( this.step+1 < this.steps.length )
			{
				//thisShip.sequence.animStart = this.gameBoard.tickCount;
				thisShip.sequence.animStart = -1;
				this.step++;

				thisShip.sequence.onTick();
			}
			else
			{
				console.log("Path has ended!");
				this.step = 0;
				thisShip.sequence = null;
				this.actor.setGameEvent({eventName: "destroy", priority: 100, stopsSequence: true});
			}
		}
	};

	sequenceEntrance0.actor = this.actor;
	sequenceEntrance0.gameBoard = this.gameBoard;
	this.sequences[sequenceEntrance0.name] = sequenceEntrance0;
}

EnemyShip.prototype.playSequence = function(sequence_name, sequence_step)
{
	var sequence = this.sequences[sequence_name];
	if( sequence )
	{
		if( typeof sequence_step == 'undefined' )
			sequence.step = 0;
		else
			sequence.step = sequence_step;

		sequence.animStart = -1;
		this.sequence = sequence;
	}
};

EnemyShip.prototype.onTick = function()
{
	if( !this.actor.gameEvent )
	{
		if( this.sequence && this.sequence.onTick )
		{
			this.sequence.onTick();
		}
	}
	else
	{
		var shouldClearGameEvent = true;
		if( this.actor.gameEvent )
		{
			if( this.actor.gameEvent.eventName == "setLook" )
			{
				var oldPitch = this.sceneObject.rotation.x;
				var oldRoll = this.sceneObject.rotation.z;

				this.actor.sceneObject.lookAt(this.gameBoard.playerCursorPosition);
				this.actor.sceneObject.rotation.x = oldPitch;
				this.actor.sceneObject.rotation.y = -this.actor.sceneObject.rotation.y;
				this.actor.sceneObject.rotation.z = oldRoll;
			}
			else if( this.actor.gameEvent.eventName == "damage" )
			{
				this.health -= this.actor.gameEvent.amount;

				if( this.health <= 0 )
				{
					shouldClearGameEvent = false;
					this.actor.setGameEvent({eventName: "destroy", priority: 100, stopsSequence: true});
				}
				else
				{
					if( this.gameBoard.isInAltspace )
					{
						var object = this.actor.sceneObject;

						if( !object.userData.origTintColor )
							object.userData.origTintColor = object.userData.tintColor;

						var orange = new THREE.Color(1, 1, 0);
						var tintColor = { r: orange.r, g: orange.g, b: orange.b };
						object.userData.tintColor = tintColor;
//							object.position.x += 0.001; // hack to force AltRender to redraw scene
					}
					else
					{
						var orange = new THREE.Color(1, 1, 0);

						var object = this.actor.sceneObject;
						if( object.material )
						object.material.ambient = orange;
					}
				}
			}
			else if( this.actor.gameEvent.eventName == "destroy" )
			{
				this.gameBoard.removeActor(this.actor);
			}
		}

		if( !this.actor.gameEvent.stopsSequence && this.sequence && this.sequence.onTick )
		{
			this.sequence.onTick();
		}

		// Do work
		if( shouldClearGameEvent )
			this.actor.gameEvent = null;
	}

	if( this.actor.gameBoard.playerTurret.sceneObject )
	{
		var lifeDist = this.actor.sceneObject.position.distanceTo(this.actor.gameBoard.playerTurret.sceneObject.position);

		if( lifeDist > this.maxDist && this.actor.gameEventName != "destroy" )
			this.actor.setGameEvent({eventName: "destroy", priority: 100, stopsSequence: true});
	}
};

function PlayerTurret(actor)
{
	this.actor = actor;
	this.actor.team = 0;
	this.collideRadius = 20.0;

	//this.sceneObject = actor.sceneObject;	// doesn't work for some reason
	this.gameBoard = actor.gameBoard;
	this.sequence = null;
	this.sequences = {};

	var sequenceEntrance0 = {};
	sequenceEntrance0.name = "entrance0";
	sequenceEntrance0.step = null;
	sequenceEntrance0.steps = new Array();

	var step0 = {};
	step0.length = 10;
	step0.deltaRotate = 0;
	step0.deltaTranslate = new THREE.Vector3(0, 0, 1);
	sequenceEntrance0.steps.push(step0);

	var step1 = {};
	step1.length = 200;
	step1.deltaRotate = 1;
	step1.deltaTranslate = new THREE.Vector3(0, 0, 1);
	sequenceEntrance0.steps.push(step1);

	sequenceEntrance0.animStart = null;

	var thisShip = this;
	sequenceEntrance0.onTick = function() {
		var currentStep = this.steps[this.step];

		if( this.gameBoard.tickCount - this.animStart <= currentStep.length )
		{
			this.actor.deltaRotate(currentStep.deltaRotate);
			this.actor.sceneObject.translateZ(currentStep.deltaTranslate.z);				
		}
		else
		{
			if( this.step+1 < this.steps.length )
			{
				//thisShip.sequence.animStart = this.gameBoard.tickCount;
				thisShip.sequence.animStart = -1;
				this.step++;

				thisShip.sequence.onTick();
			}
			else
			{
				console.log("Path has ended!");
				this.step = 0;
				thisShip.sequence = null;
			}
		}
	};

	sequenceEntrance0.actor = this.actor;
	sequenceEntrance0.gameBoard = this.gameBoard;
	this.sequences[sequenceEntrance0.name] = sequenceEntrance0;
}

PlayerTurret.prototype.onTick = function()
{
	if( !this.actor.gameEvent )
	{
		if( this.sequence && this.sequence.onTick )
		{
			this.sequence.onTick();
		}
	}
	else
	{
		if( this.actor.gameEvent && this.actor.sceneObject )
		{
			if( this.actor.gameEvent.eventName == "setLook" )
			{
				var oldPitch = this.actor.sceneObject.rotation.x;
				var oldRoll = this.actor.sceneObject.rotation.z;

				this.actor.sceneObject.lookAt(this.gameBoard.playerCursorPosition);
				this.actor.sceneObject.rotation.x = oldPitch;
				this.actor.sceneObject.rotation.y = this.actor.sceneObject.rotation.y;
				this.actor.sceneObject.rotation.z = oldRoll;
			}
		}

		if( !this.actor.gameEvent.stopsSequence && this.sequence && this.sequence.onTick )
		{
			this.sequence.onTick();
		}

		// Do work
		this.actor.gameEvent = null;
	}
};

function PlayerLaser(actor)
{
	this.actor = actor;
	this.actor.team = 0;
	this.actor.collideRadius = 1.0;

	this.gameBoard = actor.gameBoard;

	this.health = 1;
	this.damageAmount = 5000;
	this.maxDist = 400;
	this.maxDist = this.maxDist * this.gameBoard.scaleFactor;
}

PlayerLaser.prototype.onTick = function()
{
	if( !this.actor.gameEvent )
	{
//		this.actor.sceneObject.translateZ(2);
//		this.actor.deltaRotate(currentStep.deltaRotate);
//		this.actor.sceneObject.translateX(currentStep.deltaTranslate.x * this.gameBoard.scaleFactor);
//		this.actor.sceneObject.translateY(currentStep.deltaTranslate.y * this.gameBoard.scaleFactor);
		this.actor.sceneObject.translateZ(2 * this.gameBoard.scaleFactor);

		var i;
		var count = 0;
		for( i = 0; i < this.gameBoard.actors.length; i++ )
		{
			var actor = this.gameBoard.actors[i];
			if(actor == this.actor || actor.team == this.actor.team || !actor.sceneObject )
				continue;

			count++;
			// Check for collisions.  Note that this is expensive.  It would make more sense for actors that want to detect collisions register themselves with the game board, and it check if any registered objects collide and set game events on them accordingly.
			var dist = this.actor.sceneObject.position.distanceTo(actor.sceneObject.position);
			var colDist = (this.actor.collideRadius + actor.collideRadius) * this.actor.gameBoard.scaleFactor;

			if( dist < colDist )
			{
				actor.setGameEvent({eventName: "damage", amount: this.damageAmount, priority: 1, stopsSequence: false});
				this.actor.setGameEvent({eventName: "damage", amount: actor.ai.damageAmount, priority: 1, stopsSequence: false});
			}
		}
	}
	else
	{
		var shouldClearGameEvent = true;
		if( this.actor.gameEvent && this.actor.sceneObject )
		{
			if( this.actor.gameEvent.eventName == "damage" )
			{
				this.health -= this.actor.gameEvent.amount;

				if( this.health <= 0 )
				{
					shouldClearGameEvent = false;
					this.actor.setGameEvent({eventName: "destroy", priority: 100, stopsSequence: true});
				}
			}
			else if( this.actor.gameEvent.eventName == "destroy" )
			{
				this.gameBoard.removeActor(this.actor);
				//this.actor.destroy();
			}
		}

		if( !this.actor.gameEvent.stopsSequence && this.sequence && this.sequence.onTick )
		{
			this.sequence.onTick();
		}

		// Do work
		if( shouldClearGameEvent )
			this.actor.gameEvent = null;
	}

	var lifeDist = this.actor.sceneObject.position.distanceTo(this.actor.gameBoard.playerTurret.sceneObject.position);

	if( lifeDist > this.maxDist && this.actor.gameEventName != "destroy" )
		this.actor.setGameEvent({eventName: "destroy", priority: 100, stopsSequence: true});
};