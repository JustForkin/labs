/**   _     _   _     
*    | |___| |_| |__
*    | / _ \  _|    |
*    |_\___/\__|_||_|
*    @author LoTh / http://lo-th.github.io/labs/
*/

// AMMO for three.js

// By default, Bullet assumes units to be in meters and time in seconds.
// The simulation steps in fraction of seconds (1/60 sec or 60 hertz),
// and gravity in meters per square second (9.8 m/s^2).
// Bullet was designed for (0.05 to 10). 

'use strict';
var Module = { TOTAL_MEMORY: 256*1024*1024 };
var f = [0,0,0,0];
var world = null;
var sim;
var ar;
var dr;
var drn;
var dt = 1/60;
var isTimout = false;
var timer, delay, timerStep, timeStart=0;
var precission = 4;
var key;
var prev = Date.now();
var interval = null;
var time = 0;

var transform = null;

self.onmessage = function (e) {
	var m = e.data.m;
	if(m==='init'){
		importScripts(e.data.url);
		//importScripts("../../js/libs/ammo.js");
		self.postMessage({init:true});
	}
	if(m === 'room') world.room(e.data.obj);
	if(m === 'add') world.addBody(e.data.obj);
	if(m === 'car') world.addCar(e.data.obj);
	/*if(phase == "CLEAR") CLEARWORLD();
	if(phase == "START") STARTWORLD(e.data.option || {});
	
	if(phase == "ADD") world.addBody(e.data.obj);
	if(phase == "JOINT") world.addJoint(e.data.obj);
	if(phase == "CAR") world.addCar(e.data.obj);
	if(phase == "SET") if( world.bodys[e.data.id] ) world.bodys[e.data.id].set(e.data.obj);
	if(phase == "UPTERRAIN") if(world.terrain!== null) world.terrain.update(e.data.Hdata);
	if(phase == "KEY") world.setKey(e.data.key);*/

	if(m==='run'){
		ar = e.data.ar;
		dr = e.data.dr;
		key = e.data.key;
		time = e.data.time;

		//drn = e.data.drn;

		if(world==null) world = new AMMO.World(e.data);
		else world.isWorld = true;

		

		//world.last = Date.now();
		/*function mainLoop() {
			var now = Date.now();
			world.step(now - last);
			last = now;
	    }*/

	    //if (interval) clearInterval(interval);
	    //interval = setInterval(world.loop, 1000/60)
	    world.step(time);
	

		f[1] = Date.now();
	    if(f[1]-1000>f[0]){ f[0]=f[1]; f[3]=f[2]; f[2]=0; } f[2]++;

	    //world.step(f[1]-prev);

	    self.postMessage({ w:world.isWorld, fps:f[3], ar:ar, dr:dr },[ar.buffer, dr.buffer]);
	    prev = f[1];
	}
}

 
var AMMO = { rev : 0.3 };

AMMO.TORAD = Math.PI / 180;

AMMO.STATIC_OBJECT = 1;
AMMO.KINEMATIC_OBJECT = 2;

AMMO.STATIC = 0;
AMMO.DYNAMIC = 1;

AMMO.ACTIVE = 1;
AMMO.ISLAND_SLEEPING = 2;
AMMO.WANTS_DEACTIVATION = 3;
AMMO.DISABLE_DEACTIVATION = 4;
AMMO.DISABLE_SIMULATION = 5;

AMMO.BT_LARGE_FLOAT = 1000000.0;

AMMO.WORLD_SCALE = 10;
AMMO.INV_SCALE = 0.1;

AMMO.MAX_BODY = 1024;
AMMO.MAX_JOINT = 200;
AMMO.MAX_CAR = 20;
AMMO.MAX_CAR_WHEEL = 4;

AMMO.V3 = function(x, y, z){
	return new Ammo.btVector3(x || 0, y || 0, z || 0);
}

AMMO.V3A = function(A){
	return new Ammo.btVector3(A[0], A[1], A[2]);
}

AMMO.copyV3 = function (a,b) { b.setX(a[0]); b.setY(a[1]); b.setZ(a[2]); }

//--------------------------------------------------
//  RIGIDBODY
//--------------------------------------------------

AMMO.World = function(obj){
	
	//this.mtx = new Float32Array(AMMO.MAX_BODY*8);
	//this.jmtx = new Float32Array(AMMO.MAX_JOINT*8);
	//this.mtxCar = new Float32Array(AMMO.MAX_CAR*(8+(8*AMMO.MAX_CAR_WHEEL)));
	transform = new Ammo.btTransform();
	//this.transform = new Ammo.btTransform();
	//this.transformCar = new Ammo.btTransform();

	this.last = 0;

	this.Broadphase = obj.broadphase || "BVT";
	this.gravity = obj.G || -10;
	this.ws = obj.worldScale || 10;
	this.iteration = 2;//obj.iteration || 2;

	this.solver = null;
	this.collisionConfig = null;
	this.dispatcher = null;
	this.broadphase = null;
	this.world = null;

	this.BODYID = 0;
	this.CARID = 0;
	this.JOINTID = 0;

	this.bodys = null;
	this.joints = null;
	this.cars = null;
	this.terrain = null;

	this.dt = 1/60;//0.01667;
	this.isWorld = false;

	//this.key = [0,0,0,0,0,0,0, 0];
	this.currentDrive = 0;

	this.init();
}

AMMO.World.prototype = {
    constructor: AMMO.World,
    init:function(){
		if(this.world == null){
			this.worldscale(10);
			var ws = AMMO.WORLD_SCALE;

			this.solver = new Ammo.btSequentialImpulseConstraintSolver();
			this.collisionConfig = new Ammo.btDefaultCollisionConfiguration();
			this.dispatcher = new Ammo.btCollisionDispatcher(this.collisionConfig);

			switch(this.Broadphase){
				//case 'SAP': this.broadphase = new Ammo.btAxisSweep3(AMMO.V3(-10*ws,-10*this.ws,-10*ws),AMMO.V3(10*ws,10*ws,10*ws), 4096); break;//16384;
				case 'SAP': this.broadphase = new Ammo.btAxisSweep3(AMMO.V3(-10*ws,-10*ws,-10*ws),AMMO.V3(10*ws,10*ws,10*ws), 4096); break;//16384;
				case 'BVT': this.broadphase = new Ammo.btDbvtBroadphase(); break;
				case 'SIMPLE': this.broadphase = new Ammo.btSimpleBroadphase(); break;
			}

			this.world = new Ammo.btDiscreteDynamicsWorld(this.dispatcher, this.broadphase, this.solver, this.collisionConfig);
			this.world.setGravity(AMMO.V3(0, this.gravity, 0));
			

			this.bodys = [];
			this.joints = [];
			this.cars = [];
		}
    },
    clear:function(){
    	var i; 
    	i = this.BODYID;
	    while (i--) {
	        this.world.removeRigidBody(this.bodys[i].body);
	        Ammo.destroy( this.bodys[i].body );
	    }
	    i = this.CARID;
	    while (i--) {
	    	this.world.removeRigidBody(this.cars[i].body);
	        this.world.removeVehicle(this.cars[i].vehicle);
	        Ammo.destroy( this.cars[i].body );
	        Ammo.destroy( this.cars[i].vehicle );
	    }
	    i = this.JOINTID;
	    while (i--) {
	        this.world.removeConstraint(this.joints[i].joint);
	        Ammo.destroy( this.joints[i].joint );
	    }
	    this.world.clearForces();
	    if(this.terrain!== null) this.terrain = null;

	    this.bodys.length = 0;
	    this.BODYID = 0;

	    this.cars.length = 0;
	    this.CARID = 0;

	    this.joints.length = 0;
	    this.JOINTID = 0;

    	this.world.getBroadphase().resetPool(this.world.getDispatcher());
	    this.world.getConstraintSolver().reset();

		Ammo.destroy( this.world );
		Ammo.destroy( this.solver );
		Ammo.destroy( this.collisionConfig );
		Ammo.destroy( this.dispatcher );
		Ammo.destroy( this.broadphase );

		this.world = null;

    },
    worldscale:function(scale){
        AMMO.WORLD_SCALE = scale || 100;
        AMMO.INV_SCALE = 1/AMMO.WORLD_SCALE;
    },
    room:function (obj){
		var s = obj.size;
		var p = obj.pos;
		var id, n = obj.n;
		var w = []
		while(n--){
			id = n*3;
			w[n] = new AMMO.Rigid({ type:'box', size:[s[id],s[id+1],s[id+2]], pos:[p[id],p[id+1],p[id+2]], mass:0 }, this);
		}
	},
    addBody:function(obj){
    	var id = this.BODYID++;
		this.bodys[id] = new AMMO.Rigid(obj, this );
    },
    addCar:function(obj){
    	var id = this.CARID++;
		this.cars[id] = new AMMO.Vehicle(obj, this );
    },
    addJoint:function(obj){
    	var id = this.JOINTID++;
		this.joints[id] = new AMMO.Constraint(obj, this );
    },
    loop:function(){
    	var now = Date.now();
		this.step(now - this.last);
		this.last = now;
    },
    step:function(dt){
    	//dt = dt || 1;
    	//var now = Date.now();
    	//this.dt = now - this.last;
    	//var dtt = dt * 0.002;
    	//dtt = (dtt > 0.5 ? 0.5 : dtt);


    	this.world.stepSimulation( this.dt, this.iteration );
    	
    	var i;
    	var p = precission;
    	var b, n, pos, rot;
    	i = this.BODYID;
	    while (i--) { 
	    	n = i*8;
	    	b = this.bodys[i];
	    	b.body.getMotionState().getWorldTransform(transform);
	    	pos = transform.getOrigin();
	    	rot = transform.getRotation();
	    	ar[n+0] = b.type;
	    	ar[n+1] = pos.x().toFixed(p)*AMMO.WORLD_SCALE;
	    	ar[n+2] = pos.y().toFixed(p)*AMMO.WORLD_SCALE;
		    ar[n+3] = pos.z().toFixed(p)*AMMO.WORLD_SCALE;

		    ar[n+4] = rot.x().toFixed(p)*1;
		    ar[n+5] = rot.y().toFixed(p)*1;
		    ar[n+6] = rot.z().toFixed(p)*1;
		    ar[n+7] = rot.w().toFixed(p)*1;

	    	//this.bodys[i].getMatrix(i); 
	    }
	    i = this.CARID;
	    while (i--) { 
	    	if(i==this.currentDrive) this.cars[i].drive();
	    	this.cars[i].getMatrix(i);
	    }

	    

	    //this.last = now;

    },
    getByName:function(name){
        var i, result = null;
        i = this.BODYID;
        while(i--){
            if(this.bodys[i].name == name) result = this.bodys[i];
        }
        /*i = this.JOINTID;
        while(i--){
            if(this.joints[i].name!== "" && this.joints[i].name == name) result = this.joints[i];
        }*/
        return result;
    }/*,
    setKey:function(k){
    	this.key = k;
    }*/

}

//--------------------------------------------------
//  RIGIDBODY
//--------------------------------------------------

AMMO.Rigid = function(obj, Parent){
	this.parent = Parent;
	this.name = obj.name || "";
	this.body = null;
	this.shape = null;
	this.forceUpdate = false;
	this.forceState = false;
	this.limiteY = obj.limiteY || 20;
	this.init(obj);

	// get only shape for car
	if(this.parent == null ) return this.shape;
}

AMMO.Rigid.prototype = {
    constructor: AMMO.Rigid,
    init:function(obj){
    	var mass = obj.mass || 0;
    	var size = obj.size || [1,1,1];
    	var dir = obj.dir || [0,1,0]; // for infinite plane
    	var div = obj.div || [64,64];
		var pos = obj.pos || [0,0,0];
		var rot = obj.rot || [0,0,0];

		pos = pos.map(function(x) { return x * AMMO.INV_SCALE; });
		size = size.map(function(x) { return x * AMMO.INV_SCALE; });

		// phy = [friction, restitution];
		var phy = obj.phy || [0.5,0];
		var noSleep = obj.noSleep || false;
		

		var shape;
		
		switch(obj.type){
			case 'plane': shape = new Ammo.btStaticPlaneShape(AMMO.V3A(dir), 0);break;
			case 'box': case 'boxbasic': case 'dice': case 'ground': 
			    shape = new Ammo.btBoxShape(AMMO.V3(size[0]*0.5, size[1]*0.5, size[2]*0.5)); 
			break;
			case 'sphere': shape = new Ammo.btSphereShape(size[0]); break;	
			case 'cylinder': shape = new Ammo.btCylinderShape(AMMO.V3(size[0], size[1]*0.5, size[2]*0.5)); break;
			case 'cone': shape = new Ammo.btConeShape(size[0], size[1]*0.5); break;
			case 'capsule': shape = new Ammo.btCapsuleShape(size[0], size[1]*0.5); break;
			case 'compound': shape = new Ammo.btCompoundShape(); break;
			case 'mesh':
			    var mTriMesh = new Ammo.btTriangleMesh();
			    var removeDuplicateVertices = true;
			    var v0 = AMMO.V3(0,0,0);
			    var v1 = AMMO.V3(0,0,0); 
                var v2 = AMMO.V3(0,0,0);
                var vx = obj.v;
                for (var i = 0, fMax = vx.length; i < fMax; i+=9){
	                v0.setValue( vx[i+0], vx[i+1], vx[i+2] );
	                v1.setValue( vx[i+3], vx[i+4], vx[i+5] );
	                v2.setValue( vx[i+6], vx[i+7], vx[i+8] );
	                mTriMesh.addTriangle(v0,v1,v2, removeDuplicateVertices);
	            }
			    if(mass == 0){ 
			    	// btScaledBvhTriangleMeshShape -- if scaled instances
			    	shape = new Ammo.btBvhTriangleMeshShape(mTriMesh, true, true);
			    }else{ 
			    	// btGimpactTriangleMeshShape -- complex?
			    	// btConvexHullShape -- possibly better?
			    	shape = new Ammo.btConvexTriangleMeshShape(mTriMesh,true);
			    }
			break;
			case 'convex':
			    shape = new Ammo.btConvexHullShape();
			    var v = AMMO.V3(0,0,0);
			    var vx = obj.v;
			    for (var i = 0, fMax = vx.length; i < fMax; i+=3){
			    	AMMO.copyV3([vx[i+0], vx[i+1], vx[i+2]], v);
			    	shape.addPoint(v);
			    }
			break;
			case 'terrain': 
			    this.parent.terrain = new AMMO.Terrain(div, size);
			    shape = this.parent.terrain.shape;
			break;
		}
		if(this.parent == null ){ this.shape=shape; return;}


		var startTransform = new Ammo.btTransform();
		startTransform.setIdentity();
		// position
		startTransform.setOrigin(AMMO.V3A(pos));

		// rotation
		//var q = new Ammo.btQuaternion();
		//var q = new Ammo.btMatrix3x3();
		//q.setEulerZYX(rot[2]*AMMO.TORAD,rot[1]*AMMO.TORAD,rot[0]*AMMO.TORAD);
		//q.setEuler(rot[2]*AMMO.TORAD,rot[1]*AMMO.TORAD,rot[0]*AMMO.TORAD);
		//var q = new Ammo.btQuaternion(rot[2]*AMMO.TORAD,rot[1]*AMMO.TORAD,rot[0]*AMMO.TORAD);
		//var q = new Ammo.btQuaternion();//rot[1]*AMMO.TORAD,rot[1]*AMMO.TORAD,rot[2]*AMMO.TORAD, 0);
		//q.setEuler(rot[1]*AMMO.TORAD,rot[1]*AMMO.TORAD,rot[2]*AMMO.TORAD);
		//transform.setRotation(q);

		
		// static
		if(mass == 0){
		    this.forceUpdate = true;
		    //this.flags = AMMO.STATIC_OBJECT;
		    this.type = AMMO.STATIC;
		} else {
			//this.flags = AMMO.KINEMATIC_OBJECT;
			this.type = AMMO.DYNAMIC;
		}

		var localInertia = AMMO.V3(0, 0, 0);
		shape.calculateLocalInertia(mass, localInertia);
		this.motionState = new Ammo.btDefaultMotionState(startTransform);

		var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, this.motionState, shape, localInertia);
		rbInfo.set_m_friction(phy[0]);
		rbInfo.set_m_restitution(phy[1]);

		this.body = new Ammo.btRigidBody(rbInfo);
		

		//this.body.setLinearVelocity(AMMO.V3(0,0,0));
		//this.body.setAngularVelocity(AMMO.V3(0,0,0));

		//this.body.setCollisionFlags(this.flags);
		//this.body.setCollisionFlags
		//this.body.setTypes(this.type);
        
		//this.body.setContactProcessingThreshold(AMMO.BT_LARGE_FLOAT);
		//this.body.setFriction(phy[0]);
		//this.body.setRestitution(phy[1]);

		if(noSleep) this.body.setActivationState(AMMO.DISABLE_DEACTIVATION);
		this.parent.world.addRigidBody(this.body);
		this.body.activate();

		Ammo.destroy(rbInfo);
    },
    getBody:function(){
    	return this.body;
    },
    set:function(obj){
    	var v = AMMO.V3(0,0,0);
    	this.body.setLinearVelocity(v);
    	this.body.setAngularVelocity(v);
    	//this.body.clearForces();
    	if(obj.pos){ this.body.getCenterOfMassTransform().setOrigin(AMMO.V3A(obj.pos));}
    	if(obj.rot){
    		//var q = new Ammo.btQuaternion(obj.rot[2]*AMMO.TORAD,obj.rot[1]*AMMO.TORAD,obj.rot[0]*AMMO.TORAD);
    		/*var q = new Ammo.btQuaternion();
    		q.setEulerZYX(obj.rot[2]*AMMO.TORAD,obj.rot[1]*AMMO.TORAD,obj.rot[0]*AMMO.TORAD);*/
    		//this.body.getCenterOfMassTransform().setRotation(q);
    	}
    },
    getMatrix:function(id){
    	//this.parent.transform
    	//var trans = new Ammo.btTransform();//this.parent.transform;//new Ammo.btTransform()
    	var m = ar;
    	var n = id*8;
    	var p = precission;

    	if(this.forceUpdate){
    		m[n+0] = 1; 
    		this.forceUpdate=false;
    	}
		else{
			m[n+0] = this.type;//this.body.getActivationState();
		}
		if(m[n+0]==2) return;

		//m[n+0] = 1;

	    //var t = this.body.getMotionState().getWorldTransform(trans);//
	    //this.body.getMotionState().getWorldTransform(trans);
	    //var pos = trans.getOrigin();
	    //var rot = trans.getRotation();

	    this.body.getMotionState().getWorldTransform(transform);
	    var pos = transform.getOrigin();
	    var rot = transform.getRotation();

	    //var t = this.body.getWorldTransform();
	    //var pos = t.getOrigin();
	    //var rot = t.getRotation();

	    /*var t = this.body.getWorldTransform();
	    var pos = t.getOrigin();
	    var rot = t.getRotation();
	    */
	    //if(id == 2) console.log(pos.x(), pos.y(), pos.z())
	    //m[n+0] = 1;
	    m[n+1] = pos.x().toFixed(p)*AMMO.WORLD_SCALE;
	    m[n+2] = pos.y().toFixed(p)*AMMO.WORLD_SCALE;
	    m[n+3] = pos.z().toFixed(p)*AMMO.WORLD_SCALE;

	    m[n+4] = rot.x().toFixed(p)*1;
	    m[n+5] = rot.y().toFixed(p)*1;
	    m[n+6] = rot.z().toFixed(p)*1;
	    m[n+7] = rot.w().toFixed(p)*1;

	    /*if(this.limiteY !== 0 && m[n+2]<-this.limiteY){
            this.set({pos:[0, 3+Math.random()*10, 0]});
        }*/
    }
}

//--------------------------------------------------
//  TERRAIN
//--------------------------------------------------

AMMO.Terrain = function(div, size){
	this.div = div;
	this.size = size;
	this.fMax = div[0]*div[1];
	this.maxHeight = 100;
	this.ptr = Ammo.allocate(this.fMax*4, "float", Ammo.ALLOC_NORMAL);
    this.shape = new Ammo.btHeightfieldTerrainShape(this.div[0], this.div[1], this.ptr, 1, -this.maxHeight, this.maxHeight, 1, 0, false);
	this.shape.setUseDiamondSubdivision(true);
	var localScaling = AMMO.V3(this.size[0]/this.div[0],1,this.size[2]/this.div[1]);
	this.shape.setLocalScaling(localScaling);
}

AMMO.Terrain.prototype = {
	constructor: AMMO.Terrain,
    update:function(Hdata){
    	var i = this.fMax;
    	while(i--){
	    	Ammo.setValue(this.ptr+(i<<2), Hdata[i], 'float');
	    }
    }
}

//--------------------------------------------------
//  CONSTRAINT
//--------------------------------------------------

AMMO.Constraint = function(obj, Parent){
	this.parent = Parent;
	this.name = obj.name || "";
	this.joint = null;

	var collision = obj.collision || false;
	if(collision)this.NotAllowCollision = false;
	else this.NotAllowCollision = true;

	this.body1 = this.parent.getByName(obj.body1);
	this.body2 = this.parent.getByName(obj.body2);

	var p1 = obj.pos1 || [0,0,0];
	var p2 = obj.pos2 || [0,0,0];
	this.point1 = AMMO.V3A(p1);
	this.point2 = AMMO.V3A(p2);

	var a1 = obj.axe1 || [0,1,0];
	var a2 = obj.axe2 || [0,1,0];
	this.axe1 = AMMO.V3A(a1);
	this.axe2 = AMMO.V3A(a2);

	this.damping = obj.damping || 1;
	this.strength = obj.strength || 0.1;

	this.min = obj.min || 0;
	this.max = obj.max || 0;

	var spring = obj.spring || [0.9, 0.3, 0.1];
	this.softness = spring[0];
	this.bias =  spring[1];
	this.relaxation =  spring[2];

	this.init(obj);
}

AMMO.Constraint.prototype = {
	constructor: AMMO.Constraint,
	init:function(obj){
		
		switch(obj.type){
			case "p2p": 
			    this.joint = new Ammo.btPoint2PointConstraint(this.body1.getBody(), this.body2.getBody(), this.point1, this.point2);
			    this.joint.get_m_setting().set_m_tau(this.strength);
                this.joint.get_m_setting().set_m_damping(this.damping); 
			break;
			case "hinge": 
			    this.joint = new Ammo.btHingeConstraint(this.body1.getBody(), this.body2.getBody(), this.point1, this.point2, this.axe1, this.axe2, false);
			    if( this.min!==0 || this.max!==0 )this.joint.setLimit( this.min, this.max, this.softness, this.bias, this.relaxation);
			break;
			case "slider": this.joint = new Ammo.btSliderConstraint(this.body1.getBody(),this.body2.getBody(),this.point1,this.point2); break;
			case "conetwist": this.joint = new Ammo.btConeTwistConstraint(this.body1.getBody(),this.body2.getBody(),this.point1,this.point2); break;
			case "gear": this.joint = new Ammo.btGearConstraint(this.body1.getBody(),this.body2.getBody(),this.point1,this.point2, this.ratio); break;
			case "dof": this.joint = new Ammo.btGeneric6DofConstraint(this.body1.getBody(),this.body2.getBody(),this.point1,this.point2); break;
		}
		//


		this.parent.world.addConstraint(this.joint, this.NotAllowCollision);
	},
	getMatrix:function(id){
		//var m = this.parent.jmtx;
	}
}

//--------------------------------------------------
//  VEHICLE
//--------------------------------------------------

AMMO.Vehicle = function(obj, Parent){
	this.parent = Parent;
	this.type = obj.type || 'basic';

	this.size = obj.size || [1,1,1];
	this.pos = obj.pos || [0,0,0];
	this.rot = obj.rot || [0,0,0];
	this.quat = obj.quat || [0,0,0,0];
	this.phy = obj.phy || [0.5,0];
	this.limiteY = obj.limiteY || 20;
	this.massCenter = obj.massCenter || [0,0.05,0];

	this.wRadius = obj.wRadius * AMMO.INV_SCALE;
	this.wDeepth = obj.wDeepth * AMMO.INV_SCALE;
	this.nWheels = obj.nWheels || 4;
	this.wPos = obj.wPos || [20,5,10];

	this.pos = this.pos.map(function(x) { return x * AMMO.INV_SCALE; });
	this.size = this.size.map(function(x) { return x * AMMO.INV_SCALE; });
	this.wPos = this.wPos.map(function(x) { return x * AMMO.INV_SCALE; });
	this.massCenter = this.massCenter.map(function(x) { return x * AMMO.INV_SCALE; });

	this.debugTires = [];
	this.wheels = [];

	/*this.rightIndex = 0; 
    this.upIndex = 1; 
    this.forwardIndex = 2;*/

	this.settings = obj.setting || {
		engine:600, 
		stiffness: 20,//40, 
		relaxation: 2.3,//0.85, 
		compression: 4.4,//0.82, 
		travel: 500, 
		force: 6000, 
		frictionSlip: 1000,//20.5, 
		reslength: 0.1,  // suspension Length
		roll: 0//0.1 // basculement du vehicle	
	};


	this.maxEngineForce = this.settings.engine;//obj.maxEngineForce || 2000.0;
    this.maxBreakingForce = obj.maxBreakingForce || 125.0;
    this.steeringClamp = obj.steeringClamp || 0.51;

	this.engine = 0.0;
    this.breaking = 0.0;
    this.steering = 0.0;
    this.gas = 0;

    this.incEngine = 5;
    this.maxSteering = Math.PI / 6;
	this.incSteering = 0.01;

    this.vehicleRayCaster = null;
    this.tuning = null;
    this.vehicle = null;

    this.wheelDir = AMMO.V3(0, -1, 0);
    this.wheelAxe = AMMO.V3(-1, 0, 0);

    //this.shape = new Ammo.btBoxShape(AMMO.V3(this.size[0]*0.5, this.size[1]*0.5, this.size[2]*0.5, true)); 
    //if(obj.v) this.shape = new AMMO.Rigid({type:'mesh', v:obj.v, mass:obj.mass }, null);
    if(obj.carshape) this.shape = new AMMO.Rigid({type:'convex', v:obj.carshape, mass:obj.mass}, null);
    else this.shape = new AMMO.Rigid({type:'box', size:this.size}, null);
    
    this.compound = new Ammo.btCompoundShape();

    // move center of mass
    var localTrans = new Ammo.btTransform();
    localTrans.setIdentity();
    localTrans.setOrigin(AMMO.V3(this.massCenter[0],this.massCenter[1],this.massCenter[2]));
    this.compound.addChildShape(localTrans, this.shape);

    var startTransform = new Ammo.btTransform();
    startTransform.setIdentity();

    // position and rotation
    startTransform.setOrigin(AMMO.V3(this.pos[0], this.pos[1], this.pos[2], true));
    startTransform.setRotation(new Ammo.btQuaternion(this.quat[0], this.quat[1], this.quat[2], this.quat[3]));
	       // rotation.setX(this.quat[0]);
            //rotation.setY(this.quat[1]);
            //rotation.setZ(this.quat[2]);
            //rotation.setW(this.quat[3]);
    // position
    //this.position = new THREE.Vector3(this.pos[0], this.pos[1], this.pos[2]);
	//this.transform.setOrigin(AMMO.V3(this.pos[0], this.pos[1], this.pos[2], true));
	// rotation
	//var q = new Ammo.btQuaternion();
	//q.setEulerZYX(this.rot[2]*AMMO.TORAD,this.rot[1]*AMMO.TORAD,this.rot[0]*AMMO.TORAD);
	//var q = new Ammo.btQuaternion(this.rot[2]*AMMO.TORAD,this.rot[1]*AMMO.TORAD,this.rot[0]*AMMO.TORAD);
	//var q = new Ammo.btQuaternion(this.rot[1]*AMMO.TORAD,this.rot[0]*AMMO.TORAD,this.rot[2]*AMMO.TORAD);
	//this.transform.setRotation(q);

	//this.q = obj.quad || null;// new THREE.Quaternion();
	//this.q.setFromEuler(new THREE.Euler(this.rot[0]*AMMO.TORAD,this.rot[1]*AMMO.TORAD,this.rot[2]*AMMO.TORAD), true);

	this.mass = obj.mass || 400;

	this.localInertia = AMMO.V3(0, 0, 0);
	//this.shape.calculateLocalInertia(this.mass, this.localInertia);
	this.compound.calculateLocalInertia(this.mass, this.localInertia);
	this.motionState = new Ammo.btDefaultMotionState(startTransform);
	//this.rbInfo = new Ammo.btRigidBodyConstructionInfo(this.mass, this.motionState, this.shape, this.localInertia);
	this.rbInfo = new Ammo.btRigidBodyConstructionInfo(this.mass, this.motionState, this.compound, this.localInertia);
	
	this.rbInfo.set_m_friction(this.phy[0]);
	this.rbInfo.set_m_restitution(this.phy[1]);

	//console.log(this.rbInfo.get_m_linearDamping())//0
	//console.log(this.rbInfo.get_m_angularDamping())//0

	this.body = new Ammo.btRigidBody(this.rbInfo);
	//this.body.setCenterOfMassTransform(t);
	//this.body.setLinearVelocity([0, 0, 0]);
    //this.body.setAngularVelocity([0, 0, 0]);
    this.body.setAngularVelocity( new Ammo.btVector3( 0, 0, 0));
	this.body.setLinearVelocity( new Ammo.btVector3( 0, 0, 0));
    this.body.setActivationState(AMMO.DISABLE_DEACTIVATION);
	//this.body.setFriction(this.phy[0]);
	//this.body.setRestitution(this.phy[1]);

	
	//world.addRigidBody(this.body);
	//this.body.activate();

    

    //this.chassis = world.localCreateRigidBody(50,tr,compound);
	//this.chassis.setActivationState(AMMO.DISABLE_DEACTIVATION);

	//this.wheelShape = new Ammo.btCylinderShapeX(AMMO.V3( this.wDeepth , this.wRadius, this.wRadius));

    // create vehicle
    this.init();
}

AMMO.Vehicle.prototype = {
	constructor: AMMO.Vehicle,
	init:function(){

	    this.vehicleRayCaster = new Ammo.btDefaultVehicleRaycaster(this.parent.world);
	    this.tuning = new Ammo.btVehicleTuning();

		// 10 = Offroad buggy, 50 = Sports car, 200 = F1 Car
		this.tuning.set_m_suspensionStiffness(this.settings.stiffness); //100;
		// 0.1 to 0.3 are good values
		this.tuning.set_m_suspensionDamping(this.settings.relaxation);//0.87
		this.tuning.set_m_suspensionCompression(this.settings.compression);//0.82
		this.tuning.set_m_maxSuspensionTravelCm(this.settings.travel);//500
		this.tuning.set_m_maxSuspensionForce(this.settings.force);//6000
		this.tuning.set_m_frictionSlip(this.settings.frictionSlip);//10.5
		//this.tuning.set_m_rollInfluence(this.settings.roll);
		//this.maxEngineForce = this.settings.engine;
		


	    this.vehicle = new Ammo.btRaycastVehicle(this.tuning, this.body, this.vehicleRayCaster);
    	// choose coordinate system
    	//this.vehicle.setCoordinateSystem(this.rightIndex,this.upIndex,this.forwardIndex);
    	this.vehicle.setCoordinateSystem(0,1,2);

        this.addWheel(this.wPos[0], this.wPos[1], this.wPos[2], true);
        this.addWheel(-this.wPos[0], this.wPos[1], this.wPos[2], true);
        this.addWheel(-this.wPos[0], this.wPos[1], -this.wPos[2], false);
        this.addWheel(this.wPos[0], this.wPos[1], -this.wPos[2], false);
        

        //var isFrontWheel = true
        /*this.vehicle.addWheel( AMMO.V3(this.wPos[0], this.wPos[1], this.wPos[2]), this.wheelDir, this.wheelAxe, this.settings.reslength, this.wRadius, this.tuning, isFrontWheel);
        this.vehicle.addWheel( AMMO.V3(-this.wPos[0], this.wPos[1], this.wPos[2]), this.wheelDir, this.wheelAxe, this.settings.reslength, this.wRadius, this.tuning, isFrontWheel);
        this.vehicle.addWheel( AMMO.V3(-this.wPos[0], this.wPos[1], -this.wPos[2]), this.wheelDir, this.wheelAxe, this.settings.reslength, this.wRadius, this.tuning, false);
        this.vehicle.addWheel( AMMO.V3(this.wPos[0], this.wPos[1], -this.wPos[2]), this.wheelDir, this.wheelAxe, this.settings.reslength, this.wRadius, this.tuning, false);

        for (var i=0; i<this.vehicle.getNumWheels(); i++){
		    var wheel = this.vehicle.getWheelInfo(i);
		    wheel.set_m_rollInfluence( this.settings.roll );//0.1
		    //wheel.set_m_suspensionStiffness( this.settings.suspensionStiffness);
		    //wheel.set_m_suspensionRestLength1( this.settings.suspensionRestLength );//0.1
		    //wheel.set_m_wheelsDampingRelaxation( this.settings.wheelsDampingRelaxation);//0.85
		    //wheel.set_m_wheelsDampingCompression( this.settings.wheelsDampingCompression);//0.82
		    //wheel.set_m_frictionSlip( this.settings.frictionSlip);//10.5
		}*/

		//this.parent.world.addVehicle(this.vehicle);
		this.parent.world.addAction(this.vehicle);
        //this.parent.world.addVehicle(this.vehicle, this.wheelShape);
        this.parent.world.addRigidBody(this.body);

        /*var origin = this.body.getWorldTransform().getOrigin();
        origin.setX(this.pos[0]);
        origin.setY(this.pos[1]);
        origin.setZ(this.pos[2])

	    //this.body.activate();

	    //if(this.q !== null){
	    	//console.log('setrotation', this.q[0], this.q[1], this.q[2], this.q[3])
	        var rotation = this.body.getWorldTransform().getRotation();
	        rotation.setX(this.quat[0]);
            rotation.setY(this.quat[1]);
            rotation.setZ(this.quat[2]);
            rotation.setW(this.quat[3]);*/
        //}

        this.body.activate();
    },
    addWheel:function( x,y,z, isFrontWheel ){
    	var wheel = this.vehicle.addWheel( AMMO.V3(x, y, z),this.wheelDir,this.wheelAxe,this.settings.reslength,this.wRadius,this.tuning,isFrontWheel);
    	//console.log(wheel.get_m_suspensionStiffness())
		/*wheel.set_m_suspensionStiffness(20);
		wheel.set_m_wheelsDampingRelaxation(2.3);
		wheel.set_m_wheelsDampingCompression(4.4);
		wheel.set_m_frictionSlip(1000);*/
		wheel.set_m_rollInfluence(this.settings.roll);
		//return wheel;
    },
    /*updateWheelTransform:function(){
    	var i = this.vehicle.getNumWheels();
    	while(i--){
    		this.vehicle.updateWheelTransform(i,true);
    		var origin = this.vehicle.getWheelInfo(i).get_m_worldTransform().getOrigin();
    		var dt = this.debugTires[i];
    		if( dt) {
    			dt.transformComponent.setTranslation(origin.x(),origin.y(),origin.z());
    		}
    	}
    },*/
    getMatrix:function(id){
    	//var trans = this.parent.transform;
    	var m = dr;
    	var n = id*40;
    	var p = precission;

		m[n+0] = 0//this.vehicle.getCurrentSpeedKmHour().toFixed(0)*1;//this.body.getActivationState();

		//var t = this.body.getCenterOfMassTransform();
		//var t = this.vehicle.getChassisWorldTransform(); 

		this.body.getMotionState().getWorldTransform(transform);
	    var pos = transform.getOrigin();
	    var rot = transform.getRotation();

	    //var pos = this.body.getWorldTransform().getOrigin();
	    //var rot = this.body.getWorldTransform().getRotation();

		//var t = this.body.getWorldTransform(); 
	    //var rot = t.getRotation();
	    //var pos = t.getOrigin();

	    if(this.type==='basic'){
	    	m[n+1] = (pos.x()+this.massCenter[0]).toFixed(p)*AMMO.WORLD_SCALE;
	        m[n+2] = (pos.y()+this.massCenter[1]).toFixed(p)*AMMO.WORLD_SCALE;
	        m[n+3] = (pos.z()+this.massCenter[2]).toFixed(p)*AMMO.WORLD_SCALE;
	    }else{
	    	m[n+1] = pos.x().toFixed(p)*AMMO.WORLD_SCALE;
	        m[n+2] = pos.y().toFixed(p)*AMMO.WORLD_SCALE;
	        m[n+3] = pos.z().toFixed(p)*AMMO.WORLD_SCALE;
	    }
	    m[n+4] = rot.x().toFixed(p)*1;
	    m[n+5] = rot.y().toFixed(p)*1;
	    m[n+6] = rot.z().toFixed(p)*1;
	    m[n+7] = rot.w().toFixed(p)*1;

	    var i = this.nWheels;
	    var w, t;
	    while(i--){
	    	this.vehicle.updateWheelTransform(i,true);
	    	t = this.vehicle.getWheelTransformWS(i);
	    	pos = t.getOrigin();
	    	rot = t.getRotation();
	    	/*t = this.vehicle.getWheelInfo( i ).get_m_worldTransform();
	    	///t = this.wheels[i].get_m_worldTransform();
	    	rot = t.getRotation();
	        pos = t.getOrigin();*/
	        w = 8*(i+1);
	        if(i==0) m[n+w] = this.steering;
	        else m[n+w] = i;
	        m[n+w+1] = pos.x().toFixed(p)*AMMO.WORLD_SCALE;
		    m[n+w+2] = pos.y().toFixed(p)*AMMO.WORLD_SCALE;
		    m[n+w+3] = pos.z().toFixed(p)*AMMO.WORLD_SCALE;
	        m[n+w+4] = rot.x().toFixed(p)*1;
		    m[n+w+5] = rot.y().toFixed(p)*1;
		    m[n+w+6] = rot.z().toFixed(p)*1;
		    m[n+w+7] = rot.w().toFixed(p)*1;
	    }
    },
    drive:function(){
    	//var key = this.parent.key;
    	//var lus = key[7];
    	//if (lus>0.1) lus = 0.1;
    	

    	if(key.left===1)this.steering+=this.incSteering;
    	if(key.right===1)this.steering-=this.incSteering;
    	if(key.left===0 && key.right==0) this.steering *= 0.9;//this.steering = 0;
    	if (this.steering < -this.maxSteering) this.steering = -this.maxSteering;
		if (this.steering > this.maxSteering) this.steering = this.maxSteering;

    	if(key.up===1)this.engine+=this.incEngine;//this.gas = 1; //
    	if(key.down===1)this.engine-=this.incEngine;//this.gas = -1; //
    	if (this.engine > this.maxEngineForce) this.engine = this.maxEngineForce;
    	if (this.engine < -this.maxEngineForce) this.engine = -this.maxEngineForce;
		
    	if(key.up===0 && key.down===0){
    		if(this.engine>1) this.engine *= 0.9;
    		else if (this.engine<-1)this.engine *= 0.9;
    		else {this.engine = 0; this.breaking=10;}
    	}
    	/*
    	if(key[2]==1)this.steering+=this.incSteering;
    	if(key[3]==1)this.steering-=this.incSteering;
    	if(key[2]==0 && key[3]==0) this.steering *= 0.9;//this.steering = 0;
    	if (this.steering < -this.maxSteering) this.steering = -this.maxSteering;
		if (this.steering > this.maxSteering) this.steering = this.maxSteering;

    	if(key[0]==1)this.engine+=this.incEngine;//this.gas = 1; //
    	if(key[1]==1)this.engine-=this.incEngine;//this.gas = -1; //
    	if(key[0]==0 && key[1]==0){
    		if(this.engine>1)this.engine *= 0.9;
    		else if (this.engine<-1)this.engine *= 0.9;
    		else {this.engine = 0; this.breaking=100;}
    	}*/

    	 //this.gas = 0;

    	//console.log(this.engine)

    	/*if (this.gas > 0) {
            this.engine += 5;//lus*300; 
        } else if (this.gas < 0) {
           if (this.engine>0) {
               this.engine *= 0.5//-= this.engine*lus*10.0;                           
           }
           this.engine -= 3;//lus*200.0;
        } else {
        	//this.engine -= this.engine*lus*2.0;
        	this.engine *= 0.9;
           //vehicle.setEngineForce(vehicle.getEngineForce()-(vehicle.getEngineForce()*lus*2.0));
        }*/

        
    	var i = this.nWheels;
    	while(i--){
    		this.vehicle.applyEngineForce( this.engine, i );
    		this.vehicle.setBrake( this.breaking, i );
    		if(i==0 || i==1) this.vehicle.setSteeringValue( this.steering, i );
    	}
    	//this.steering *= 0.9;

    }
}