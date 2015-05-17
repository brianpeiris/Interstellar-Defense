function Actor(params)
{
	this.spawnMatrix = null;
	this.spawnOffset = null;
	this.spawnRotation = null;
	this.spawnScale = 1.0;

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

	if( typeof params.scale != 'undefined' )
		this.spawnScale = params.scale;

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
	if( this.ai && typeof this.ai != 'undefined' && typeof this.ai.onDestroy != 'undefined' )
		this.ai.onDestroy();

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
//	this.gameBoard.loader.load(filename, function ( loadedObject ) {
	var loadedObject = this.gameBoard.instance(filename);
//		thisActor.ai = eval("new " + thisActor.aiClassName + "(thisActor);");
		thisActor.sceneObject = loadedObject;
		loadedObject.up.set( 0, 0, 1 );

		// If there is a matrix to clone, apply it first
		if( thisActor.spawnMatrix )
		{
			loadedObject.position.x = 0;
			loadedObject.position.y = 0;
			loadedObject.position.z = 0;

			loadedObject.rotation.x = 0;
			loadedObject.rotation.y = 0;
			loadedObject.rotation.z = 0;

			loadedObject.updateMatrix();
			loadedObject.applyMatrix(thisActor.spawnMatrix);
		}
		else
		{
			// Otherwise we still need to apply the board offset
			loadedObject.position.x = thisActor.gameBoard.boardOffset.x;
			loadedObject.position.y = thisActor.gameBoard.boardOffset.y;
			loadedObject.position.z = thisActor.gameBoard.boardOffset.z;
			loadedObject.rotation.x = 0;
			loadedObject.rotation.y = 0;
			loadedObject.rotation.z = 0;
			//loadedObject.updateMatrix();

			loadedObject.updateMatrix();
			thisActor.gameBoard.orbitObjectAboutWorldOrigin(loadedObject, thisActor.gameBoard.rotationAmount.x);
			loadedObject.updateMatrix();

			//loadedObject.updateMatrix();
			//thisActor.gameBoard.orbitObjectAboutWorldOrigin(loadedObject, thisActor.gameBoard.rotationAmount.y, new THREE.Vector3(0, 1, 0);

			//loadedObject.updateMatrix();
			//thisActor.gameBoard.orbitObjectAboutWorldOrigin(loadedObject, thisActor.gameBoard.rotationAmount.z, new THREE.Vector3(0, 0, 1));
			//loadedObject.updateMatrix();
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
		scale = scale.multiplyScalar(thisActor.spawnScale);

//		if( thisActor.gameBoard.isInAltspace )
//		{
			loadedObject.updateMatrix();
			loadedObject.scale.copy( scale.multiplyScalar(thisActor.spawnScale) );
//		}

		thisActor.gameBoard.scene.add(loadedObject);

//		loadedObject.userData.tintColor = new THREE.Color(0.5, 0, 0);

//		thisActor.gameBoard.scene.add(loadedObject);

//		thisActor.gameBoard.cursorEvents.addObject(loadedObject);
//	});
};

Actor.prototype.setGameEvent = function(params)
{
	//console.log(params.priority);
	if( !this.gameEvent || this.gameEvent.priority < params.priority )
		this.gameEvent = params;
};

function EnemyShip(actor)
{
	this.gameBoard = actor.gameBoard;
	this.maxDist = 800 * this.gameBoard.scaleFactor;	// If you go further away from the player than this, they blow you up, BOOM!

	this.actor = actor;
	this.actor.team = 1;
	this.gameBoard.lastSpawnedEnemy = this.gameBoard.tickCount;
	this.actor.collideRadius = 20.0;

	this.lifeMaxZOffset = 20;

	this.health = 100;
	this.damageAmount = 35;

	this.dieSoundFile = "sounds/expl_03";

	this.trailRate = 10;
	this.lastTrailTick = 0;

	this.sequence = null;
	this.sequences = {};

	var sequenceEntrance = {name: "entrance", step: null, steps: new Array()};

	// Dive bomb A
	sequenceEntrance.steps.push({label: "alpha", length: 130, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 1)});	// step 0
	sequenceEntrance.steps.push({length: 150, deltaRotate: 2, deltaTranslate: new THREE.Vector3(0, 0, 1)});	// step 1
	sequenceEntrance.steps.push({length: 100, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 1)});	// step 2
	sequenceEntrance.steps.push({length: 100, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 1)});	// step 3
	sequenceEntrance.steps.push({length: 100, deltaRotate: -2, deltaTranslate: new THREE.Vector3(0, 0, 1)});	// step 4
	sequenceEntrance.steps.push({length: 100, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 1)});	// step 5
	sequenceEntrance.steps.push({length: 100, deltaRotate: -2, deltaTranslate: new THREE.Vector3(0, 0, 1)});	// step 6
	sequenceEntrance.steps.push({length: 0, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 1), turning: 0, turnStartTick: 0, turnMaxLength: 80, turnRotation: 0});	// step 7

	// Dive bomb B
	sequenceEntrance.steps.push({label: "beta", length: 130, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 1)});
	sequenceEntrance.steps.push({length: 150, deltaRotate: -2, deltaTranslate: new THREE.Vector3(0, 0, 1.3)});	// step 8
	sequenceEntrance.steps.push({length: 50, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 2)});	// step 9
	sequenceEntrance.steps.push({length: 50, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 1)});	// step 10
	sequenceEntrance.steps.push({length: 100, deltaRotate: 3, deltaTranslate: new THREE.Vector3(0, 0, 1)});	// step 11
	sequenceEntrance.steps.push({length: 100, deltaRotate: -2, deltaTranslate: new THREE.Vector3(0, 0, 1)});	// step 12
	sequenceEntrance.steps.push({length: 0, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 1), turning: 0, turnStartTick: 0, turnMaxLength: 80, turnRotation: 0});	// step 13

	// Pattern 0
	sequenceEntrance.steps.push({label: "pattern0", length: 70, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 1)});
	sequenceEntrance.steps.push({length: 100, deltaRotate: -1, deltaTranslate: new THREE.Vector3(0, 0, 1.3)});
	sequenceEntrance.steps.push({length: 60, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 1.5)});	// step 8
	sequenceEntrance.steps.push({length: 150, deltaRotate: 1, deltaTranslate: new THREE.Vector3(0, 0, 1.5)});	// step 8
	sequenceEntrance.steps.push({length: 50, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 1.5)});	// step 9
//	sequenceEntrance.steps.push({length: 50, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 1)});	// step 10
	sequenceEntrance.steps.push({length: 140, deltaRotate: -1.2, deltaTranslate: new THREE.Vector3(0, 0, 1.5)});	// step 11
//	sequenceEntrance.steps.push({length: 100, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 1)});	// step 12
	sequenceEntrance.steps.push({length: 0, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 2), divebomb: true, turning: 0, turnStartTick: 0, turnMaxLength: 80, turnRotation: 0});	// step 13

	// Pattern 1 - start facing left, loop around earth, dive down, turn back up, then finally dive bomb
	sequenceEntrance.steps.push({label: "pattern1", length: 70, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 1)});
	sequenceEntrance.steps.push({length: 100, deltaRotate: 1, deltaTranslate: new THREE.Vector3(0, 0, 1.3)});
	sequenceEntrance.steps.push({length: 50, deltaRotate: 0.5, deltaTranslate: new THREE.Vector3(0, 0, 1.3)});
	sequenceEntrance.steps.push({length: 100, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 1.8)});
	sequenceEntrance.steps.push({length: 100, deltaRotate: 1, deltaTranslate: new THREE.Vector3(0, 0, 2.0)});
	sequenceEntrance.steps.push({length: 100, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 1.5)});
	sequenceEntrance.steps.push({length: 150, deltaRotate: -1.2, deltaTranslate: new THREE.Vector3(0, 0, 1.7)});
	sequenceEntrance.steps.push({length: 0, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 2), divebomb: true, turning: 0, turnStartTick: 0, turnMaxLength: 80, turnRotation: 0});

	// Pattern 2 - start facing ?
	sequenceEntrance.steps.push({label: "pattern2", length: 100, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 2)});
	sequenceEntrance.steps.push({length: 100, deltaRotate: -1, deltaTranslate: new THREE.Vector3(0, 0, 2)});
	sequenceEntrance.steps.push({length: 100, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 1.3)});
	sequenceEntrance.steps.push({length: 50, deltaRotate: -0.5, deltaTranslate: new THREE.Vector3(0, 0, 1.3)});
	sequenceEntrance.steps.push({length: 100, deltaRotate: 2, deltaTranslate: new THREE.Vector3(0, 0, 1.3)});
	sequenceEntrance.steps.push({length: 100, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 2.0)});
	sequenceEntrance.steps.push({length: 100, deltaRotate: 1, deltaTranslate: new THREE.Vector3(0, 0, 2.0)});
	sequenceEntrance.steps.push({length: 60, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 1.5)});
	sequenceEntrance.steps.push({length: 150, deltaRotate: -1.2, deltaTranslate: new THREE.Vector3(0, 0, 1.5)});
	sequenceEntrance.steps.push({length: 50, deltaRotate: -2, deltaTranslate: new THREE.Vector3(0, 0, 1.5)});
	sequenceEntrance.steps.push({length: 0, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 2), divebomb: true, turning: 0, turnStartTick: 0, turnMaxLength: 80, turnRotation: 0});

	// Pattern 3 - start facing left, loop around earth and dive bomb straight towards the player
	sequenceEntrance.steps.push({label: "pattern3", length: 70, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 1)});
	sequenceEntrance.steps.push({length: 100, deltaRotate: 1, deltaTranslate: new THREE.Vector3(0, 0, 1.3)});
	sequenceEntrance.steps.push({length: 50, deltaRotate: 0.5, deltaTranslate: new THREE.Vector3(0, 0, 1.3)});
	sequenceEntrance.steps.push({length: 100, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 2.3)});
	sequenceEntrance.steps.push({length: 50, deltaRotate: 0.2, deltaTranslate: new THREE.Vector3(0, 0, 2.3)});
	sequenceEntrance.steps.push({length: 0, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 2), divebomb: true, turning: 0, turnStartTick: 0, turnMaxLength: 80, turnRotation: 0});

//	sequenceEntrance.steps.push({length: 50, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 1.5)});	// step 9
//	sequenceEntrance.steps.push({length: 50, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 1)});	// step 10
//	sequenceEntrance.steps.push({length: 140, deltaRotate: 1.2, deltaTranslate: new THREE.Vector3(0, 0, 1.5)});	// step 11
//	sequenceEntrance.steps.push({length: 100, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 1)});	// step 12
//	sequenceEntrance.steps.push({length: 0, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 2), divebomb: true, turning: 0, turnStartTick: 0, turnMaxLength: 80, turnRotation: 0});	// step 13

/*
		sequenceEntrance.steps.push({label: "pattern0", length: 200, deltaRotate: -1, deltaTranslate: new THREE.Vector3(0, 0, 2)});
	sequenceEntrance.steps.push({length: 130, deltaRotate: 1, deltaTranslate: new THREE.Vector3(0, 0, 1.5)});	// step 8
	sequenceEntrance.steps.push({length: 50, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 1.5)});	// step 9
//	sequenceEntrance.steps.push({length: 50, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 1)});	// step 10
	sequenceEntrance.steps.push({length: 180, deltaRotate: -1, deltaTranslate: new THREE.Vector3(0, 0, 1)});	// step 11
//	sequenceEntrance.steps.push({length: 100, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 1)});	// step 12
	sequenceEntrance.steps.push({length: 0, deltaRotate: 0, deltaTranslate: new THREE.Vector3(0, 0, 2), divebomb: true, turning: 0, turnStartTick: 0, turnMaxLength: 80, turnRotation: 0});	// step 13
*/
	sequenceEntrance.animStart = null;

	var thisShip = this;
	sequenceEntrance.onTick = function() {
		if( !this.actor.sceneObject )
			return;

		var currentStep = this.steps[this.step];
		if( this.animStart == -1 )
			this.animStart = this.gameBoard.tickCount;

		if( this.gameBoard.tickCount - this.animStart <= currentStep.length || currentStep.length < 1 )	// Added an infinite behavior at the end of the sequence.
		{
			this.actor.sceneObject.rotateY((Math.PI / 180) * currentStep.deltaRotate);
			this.actor.sceneObject.translateX(currentStep.deltaTranslate.x * this.gameBoard.scaleFactor);
			this.actor.sceneObject.translateY(currentStep.deltaTranslate.y * this.gameBoard.scaleFactor);
			this.actor.sceneObject.translateZ(currentStep.deltaTranslate.z * this.gameBoard.scaleFactor);

			if( currentStep.length < 1 )
			{
				if( typeof currentStep.divebomb == 'undefined' || !currentStep.divebomb )
				{
					// If we are on the final step, give it some wondering around behavior
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
				else
				{
					// We are dive bombing!
					var oldPitch = this.actor.sceneObject.rotation.x;
					var oldRoll = this.actor.sceneObject.rotation.z;

					this.actor.sceneObject.lookAt(this.actor.gameBoard.playerTurret.sceneObject.position);
					this.actor.sceneObject.rotation.x = oldPitch;
					this.actor.sceneObject.rotation.y = this.actor.sceneObject.rotation.y;
					this.actor.sceneObject.rotation.z = oldRoll;
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

	sequenceEntrance.actor = this.actor;
	sequenceEntrance.gameBoard = this.gameBoard;
	this.sequences[sequenceEntrance.name] = sequenceEntrance;
}

EnemyShip.prototype.playSequence = function(sequence_name, sequence_label)
{
	var sequence = this.sequences[sequence_name];
	if( sequence )
	{
		var sequenceStep = 0;

		if( typeof sequence_label == 'string' )
		{
			var i;
			for( i = 0; i < sequence.steps.length; i++ )
			{
				if( typeof sequence.steps[i].label != 'undefined' && sequence.steps[i].label == sequence_label )
				{
					sequenceStep = i;
					break;
				}
			}
		}

		sequence.step = sequenceStep;
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

//		/*
		var explosionTemplate = {aiClassName: "Explosion", modelName: "models/InterD/ship_trail.obj", offset: new THREE.Vector3(0, 0, -10), rotation: new THREE.Vector3(0, 0, 0), scale: 0.8, matrix: this.actor.sceneObject.matrix};
		var trail = this.actor.gameBoard.spawnActor(explosionTemplate);
		trail.ai.spinRate = 0;
		trail.ai.speedUp = 0.2;
		trail.ai.speedDown = 0.04;
		trail.ai.startScale = 1.0;
		trail.ai.maxScale = 1.0;
		trail.ai.minScale = 0.04;
		trail.ai.explode();
		//trail.sceneObject.updateMatrix();
//		*/
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

					// Increment the stats
					this.actor.gameBoard.changeStat("kills", 1);
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

		// Now check min-z
		var turret = this.actor.gameBoard.playerTurret;
		if( this.actor.sceneObject.position.z > turret.sceneObject.position.z + this.lifeMaxZOffset )
			this.actor.setGameEvent({eventName: "destroy", priority: 100, stopsSequence: true});
//		var absolutePosition = turret.sceneObject.localToWorld(turret.sceneObject.position);
/*
		this.actor.gameBoard.scene.updateMatrixWorld();
		var absolutePosition = new THREE.Vector3();
		absolutePosition.setFromMatrixPosition( this.actor.gameBoard.playerTurret.sceneObject.matrixWorld );
*/
		//console.log(absolutePosition.z);
		//console.log(this.actor.sceneObject.position.z);
	}
};

EnemyShip.prototype.onDestroy = function()
{
	if( !this.actor.gameBoard.pendingStateChange )
	{
		var explosionTemplate = {aiClassName: "Explosion", modelName: "models/InterD/explosion.obj", offset: new THREE.Vector3(0, 0, 0), scale: 0.5, matrix: this.actor.sceneObject.matrix};
		this.actor.gameBoard.spawnActor(explosionTemplate).ai.explode();

		this.actor.gameBoard.playSound(this.dieSoundFile, 0.5);

		if( typeof this.actor.gameBoard.state.enemies != 'undefined' )
			this.actor.gameBoard.state.enemies--;
	}
};

function PlayerTurret(actor)
{
	this.actor = actor;
	this.actor.team = 0;
	this.actor.collideRadius = 20.0;

	this.fireSoundFile = "sounds/pistol-1";
	this.damageSoundFile = "sounds/00electrexplo01";
	this.deathSoundFile = "sounds/00electrexplo03";


	this.maxHealth = 100;
	this.health = this.maxHealth;
	this.damageAmount = 1000;

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

PlayerTurret.prototype.doFire = function(fireEvent)
{
	var i;
	for( i = 0; i < fireEvent.projectiles.length; i++ )
	{
		this.actor.gameBoard.spawnActor(fireEvent.projectiles[i]);
	}

	this.actor.gameBoard.playSound(this.fireSoundFile, 0.2);
	this.actor.gameBoard.delayedFireEvent = null;
};

PlayerTurret.prototype.onTick = function()
{
	if( !this.actor.gameEvent )
	{
		/*
		if( this.actor.gameBoard.turningDirection != 0 )
			this.actor.gameBoard.turningAmount += 0.01 * this.actor.gameBoard.turningDirection;
		else
		{
			 if( this.actor.gameBoard.turningAmount > 0.5 )
				this.actor.gameBoard.turningAmount -= 0.05;
			else  if( this.actor.gameBoard.turningAmount < -0.5 )
				this.actor.gameBoard.turningAmount += 0.05;
			else
			{
				this.actor.gameBoard.turningAmount = 0;
				var delayedFireEvent = this.actor.gameBoard.delayedFireEvent;

//				if( delayedFireEvent )
//					console.log(delayedFireEvent);

				if( delayedFireEvent )
				{
					this.doFire();
				}
			}
		}

		this.actor.sceneObject.rotateY(-this.actor.gameBoard.turningAmount * (Math.PI/180));
		*/

		// Check if a ship has crashed into us
		var i;
		var count = 0;
		for( i = 0; i < this.gameBoard.actors.length; i++ )
		{
			var actor = this.gameBoard.actors[i];
			if(actor == this.actor || actor.team == this.actor.team || !actor.sceneObject )
				continue;

			count++;

			// Check for collisions.  Note that this is expensive.  It would make more sense for actors that want to detect collisions register themselves with the game board, and it check if any registered objects collide and set game events on them accordingly.
			var collides = this.gameBoard.detectCollision(this.actor, actor);
			if( collides )
			{
				this.actor.setGameEvent({eventName: "damage", amount: actor.ai.damageAmount, priority: 1, stopsSequence: false});
				actor.setGameEvent({eventName: "damage", amount: this.damageAmount, priority: 1, stopsSequence: false});
			}
		}
	}
	else
	{
		var shouldClearGameEvent = true;

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
			else if( this.actor.gameEvent.eventName == "fire" )
			{

				if( this.actor.gameBoard.turningAmount != 0 )
					this.actor.gameBoard.delayedFireEvent = this.actor.gameEvent; // FIXME Hacky way to wait until the cannon stops before the cannon shoots.  Not multiplayer-friendly!  Should just fire the projectiles now.
				else
					this.doFire(this.actor.gameEvent);
			}
			else if( this.actor.gameEvent.eventName == "damage" )
			{
				this.health -= this.actor.gameEvent.amount;

				var percentage = Math.round((this.health / this.maxHealth) * 100);
				if( percentage > 0 )
					this.actor.gameBoard.showAlert({text: "Health: " + percentage + "%"});

				if( this.health <= 0 )
				{
					shouldClearGameEvent = false;
					this.actor.setGameEvent({eventName: "destroy", priority: 100, stopsSequence: true});

					// Increment the stats
					//this.actor.gameBoard.changeStat("kills", 1);
				}
				else
				{
					this.gameBoard.playSound(this.damageSoundFile, 0.2);
				}
			}
			else if( this.actor.gameEvent.eventName == "destroy" )
			{
				this.gameBoard.playSound(this.deathSoundFile, 0.4);
				this.gameBoard.setState("gameover");
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
};

function PlayerLaser(actor)
{
	this.actor = actor;
	this.actor.team = 0;
	this.actor.collideRadius = 1.0;

	this.gameBoard = actor.gameBoard;

	this.health = 1;
	this.damageAmount = 5000;
	this.maxDist = 700;
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
			var collides = this.gameBoard.detectCollision(this.actor, actor);
			if( collides )
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

function ControlLeft(actor)
{
	this.actor = actor;
	this.actor.team = 0;
	this.actor.collideRadius = 10;	// not needed for this actor type??

	this.gameBoard = actor.gameBoard;

	// not needed for this actor type??
	this.health = 1;
	this.damageAmount = 5000;
	this.maxDist = 400;
	this.maxDist = this.maxDist * this.gameBoard.scaleFactor;
}

ControlLeft.prototype.onTick = function()
{

};

function Explosion(actor)
{
	this.actor = actor;
	this.actor.team = 0;
	this.actor.collideRadius = 1.0;

	this.gameBoard = actor.gameBoard;

	// This class could be expanded to have customizable attributes here for various sizes and types of explosions. (Maybe they can be passed into the explode message)
	this.speedUp = 0.2;
	this.speedDown = 0.1;
	this.startScale = 0.5;
	this.maxScale = 2.5;
	this.minScale = 0.5;

	this.spinRate = 5.0;

	this.currentScale = this.startScale;
	this.exploding = 0;
}

Explosion.prototype.explode = function()
{
	if( this.exploding != 0 )
		return;

	this.exploding = 1;
};

Explosion.prototype.onTick = function()
{
	if( this.exploding == 0 )
		return;

	this.actor.sceneObject.rotateX(this.spinRate);

	if( this.exploding == 1)
	{
		if( this.currentScale < this.maxScale )
		{
			this.currentScale += this.speedUp;

			var scale = new THREE.Vector3( this.actor.gameBoard.scaleFactor, this.actor.gameBoard.scaleFactor, this.actor.gameBoard.scaleFactor);
//			if( this.actor.gameBoard.isInAltspace )
//			{
				this.actor.sceneObject.scale.copy( scale.multiplyScalar(this.currentScale).multiplyScalar(this.actor.spawnScale) );
//			}
		}
		else
			this.exploding = -1;
	}
	else if( this.exploding == -1 )
	{
		if (this.currentScale > this.minScale )
		{
			this.currentScale -= this.speedDown;

			var scale = new THREE.Vector3( this.actor.gameBoard.scaleFactor, this.actor.gameBoard.scaleFactor, this.actor.gameBoard.scaleFactor);
//			if( this.actor.gameBoard.isInAltspace )
//			{
				this.actor.sceneObject.scale.copy( scale.multiplyScalar(this.currentScale).multiplyScalar(this.actor.spawnScale) );
//			}
		}
		else
			this.actor.gameBoard.removeActor(this.actor);
	}
};

function Planet(actor)
{
	this.actor = actor;
	this.actor.team = 0;
	this.actor.collideRadius = 1.0;

	this.gameBoard = actor.gameBoard;

	// This class could be expanded to have customizable attributes here for various sizes and types of explosions. (Maybe they can be passed into the explode message)
	this.rotSpeed = 0.001;
}

/*
Planet.prototype.explode = function()
{
	if( this.exploding != 0 )
		return;

	this.exploding = 1;
};
*/

Planet.prototype.onTick = function()
{
	this.actor.sceneObject.rotateY(this.rotSpeed);
};

function StartButton(actor)
{
	this.actor = actor;
	this.actor.team = 1;
	this.actor.collideRadius = 20.0;

	this.dieSoundFile = "sounds/expl_03";

	this.gameBoard = actor.gameBoard;

	// This class could be expanded to have customizable attributes here for various sizes and types of explosions. (Maybe they can be passed into the explode message)
//	this.rotSpeed = 0.001;
}

/*
Planet.prototype.explode = function()
{
	if( this.exploding != 0 )
		return;

	this.exploding = 1;
};
*/

StartButton.prototype.onTick = function()
{
	if( !this.actor.gameEvent )
	{
		// do nothing
	}
	else
	{
		if( this.actor.gameEvent.eventName == "damage" )
		{
//			this.actor.setGameEvent({eventName: "destroy", priority: 100, stopsSequence: true});
			this.actor.gameBoard.state.startHasBeenShot = true;

			var explosionTemplate = {aiClassName: "Explosion", modelName: "models/InterD/explosion.obj", offset: new THREE.Vector3(0, 0, 0), scale: 0.5, matrix: this.actor.sceneObject.matrix};
			this.actor.gameBoard.spawnActor(explosionTemplate).ai.explode();

			this.actor.gameBoard.playSound(this.dieSoundFile, 0.5);

			this.actor.gameBoard.removeActor(this.actor);
		}
	}
};