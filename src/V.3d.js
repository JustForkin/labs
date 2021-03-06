/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author l.th / http://lo-th.github.io/labs/
*/

var canvas, info, debug;
var THREE, mainClick, mainDown, mainUp, mainMove, mainRay, v, shader, loader;

var V = {};
var TWEEN = TWEEN || null;
V.AR8 = typeof Uint8Array!="undefined"?Uint8Array:Array;
V.AR16 = typeof Uint16Array!="undefined"?Uint16Array:Array;
V.AR32 = typeof Float32Array!="undefined"?Float32Array:Array;

V.PI = Math.PI;
V.PI90 = V.PI*0.5;
V.PI270 = V.PI+V.PI90;
V.TwoPI = 2.0 * V.PI;
V.ToRad = V.PI / 180;
V.ToDeg = 180 / V.PI;
V.Resolution = { w:1600, h:900, d:200, z:10, f:40 };
V.sqrt = Math.sqrt;
V.abs = Math.abs;
V.max = Math.max;
V.pow = Math.pow;
V.floor = Math.floor;
V.round = Math.round;
V.lerp = function (a, b, percent) { return a + (b - a) * percent; }
V.rand = function (a, b, n) { return V.lerp(a, b, Math.random()).toFixed(n || 3)*1;}
V.randInt = function (a, b, n) { return V.lerp(a, b, Math.random()).toFixed(n || 0)*1;}
V.randColor = function () { return '#'+Math.floor(Math.random()*16777215).toString(16);}

V.MeshList = [ 'plane', 'sphere', 'skull', 'skullhigh', 'head', 'woman', 'babe'];
V.Main = null;

V.View = function(h,v,d, loadbasic){
    this.renderMode = '';
    window.top.main.previewTheme();
    this.dimentions = {w:window.innerWidth,  h:window.innerHeight, r:window.innerWidth/window.innerHeight };

    // memory support
    /*this.isWithMemory = true;
    if (window.performance) this.performance = window.performance;
    if(!this.performance.memory) {this.performance.memory = { usedJSHeapSize : 0 };}
    if( this.performance.memory.totalJSHeapSize === 0 ){ this.isWithMemory = false; }*/
    this.mem = "";

	this.canvas = canvas;
    this.debug = debug;
    this.info = info;
    this.loader = loader;

    // WEBGL 2 TEST

    /*this.isWebGL2 = false;
    var gl = canvas.getContext( 'webgl2', { antialias: false } );
    if (!gl) gl = canvas.getContext( 'experiemental-webgl2', { antialias: false } );
    this.isWebGL2 = !!gl;
    if (this.isWebGL2){
        console.log("I can haz flag, so WebGL 2 is yes!");
        this.renderer = new THREE.WebGLRenderer({canvas:canvas, antialias:false, alpha:false, context:gl });
    } else {
        this.renderer = new THREE.WebGLRenderer({canvas:canvas, precision:"mediump", antialias:true, alpha:true, stencil:false });
    }*/


    this.renderer = new THREE.WebGLRenderer({canvas:canvas, precision:"mediump", antialias:true, alpha:true });

    //logarithmicDepthBuffer: true
    //this.renderer = new THREE.WebGLRenderer({canvas:canvas, antialias:true, alpha: true });
    this.renderer.setSize( this.dimentions.w, this.dimentions.h );
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setClearColor( 0x000000, 0 );
    this.renderer.autoClear = false;

    this.clock = new THREE.Clock();
    this.delta = 0;

    this.z = null;
    this.zones = [];

    this.scene = new THREE.Scene();
    this.sceneBlob = new THREE.Scene();

    this.nav = new V.Nav(this,h,v,d);
    this.base = new THREE.Group();
    this.content = new THREE.Group();
    this.skinned = new THREE.Group();
    this.scene.add(this.base);
    this.scene.add(this.content);
    this.scene.add(this.skinned);

    this.sky = null;
    this.environment = null;
    this.initGeo();
    this.initMat();

    this.pool = new V.SeaPool(this);
    this.impool = new V.ImgPool(this);

    if(loadbasic)this.loadBasic();

    this.postEffect = null;

    this.deb = '';
    this.f = [0,0,0,0];

    this.meshs = [];

    this.cars = [];
    this.speeds = [];
    this.wheels = [];
    this.steering = [];

    this.lines = [];
    this.anchors = {};

    this.ps = [];

    this.model = "skull";
    this.basic = null;
    this.groundMirror = null;

    this.w = null;
    this.isW = false;

    this.isWithSerious = false;

    //this.key = { up:0, down:0, left:0, right:0, ctrl:0, action:0, space:0, shift:0 };
    this.imput = new V.UserImput(this);

    this.material = new V.Material(this);

    

    

	window.onresize = function(e) {this.resize(e)}.bind(this);
}

V.View.prototype = {
    constructor: V.View,
    render:function(){
        var i;
        this.delta = this.clock.getDelta();
        // worker test
        if(this.w && !this.isW){
            if(this.w.isReady){ this.wFun(); this.isW=true; }
        }

        // three animation update
        THREE.AnimationHandler.update( this.delta );

        // serious update
        if(this.isWithSerious) this.renderer.resetGLState();
        // tween update
		if(TWEEN)TWEEN.update();

        if(this.groundMirror) this.groundMirror.render();

        if(this.sky) this.sky.update();
        
        // render
        if(this.postEffect!==null && this.postEffect.isActive){
            this.postEffect.render();
        }else{
            this.renderer.render( this.scene, this.nav.camera );
        }

        var f = this.f;
        f[0] = Date.now();
        if (f[0]-1000 > f[1]){ f[1] = f[0]; f[3] = f[2]; f[2] = 0; } f[2]++;

        /*if(this.isWithMemory){
            this.mem = this.bytesToSize(this.performance.memory.usedJSHeapSize, 2)+ " ";
        }*/

        //this.debug.innerHTML =this.mem + 'THREE ' + f[3] + ' FPS'+ this.deb;
        this.debug.innerHTML ='THREE ' + f[3] + this.deb;
    },
    bytesToSize : function ( bytes, nFractDigit ){
        var sizes = ['bytes', 'kb', 'mb', 'gb', 'tb'];
        if (bytes == 0) return 'n/a';
        nFractDigit = nFractDigit !== undefined ? nFractDigit : 0;
        var precision   = Math.pow(10, nFractDigit);
        var i       = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes*precision / Math.pow(1024, i))/precision + ' ' + sizes[i];
    },
    initSky:function(){
        this.sky = new V.Skylab(this);
    },
    initGui:function(isWithModel){
        this.gui = new V.Gui(isWithModel);
    },
    ssao:function(adv){
        this.renderMode = 'ssao';
        this.postEffect = new V.PostEffect(this,'ssao', adv);
    },
    metaball:function(callback){
        this.renderMode = 'metaball';
        this.postEffect = new V.PostEffect(this,'metaball', false, callback);
    },
    distortion:function(){
        this.renderMode = 'distortion';
        this.postEffect = new V.PostEffect(this,'distortion', false);
    },
    deformSsao:function( g, map ){
        this.postEffect.deformSsao( g, map );
    },
    mirror:function(size, sets){
        size = size || 100;
        sets = sets || {};
        var settings = { 
            clipBias: sets.bias || 0.003, 
            textureWidth:this.dimentions.w, 
            textureHeight:this.dimentions.h, 
            color: sets.color || 0x777777, 
            alpha: sets.alpha || 0.5, 
            power: sets.power || 1, 
            radius: sets.radius || 1.0 
        };
        this.groundMirror = new THREE.Mirror( v.renderer, v.nav.camera, settings );
        var mirrorMesh = new THREE.Mesh( this.geo.plane, this.groundMirror.material );
        mirrorMesh.scale.set(size, size, size);
        mirrorMesh.position.copy(sets.pos || new THREE.Vector3());
        mirrorMesh.rotateX( - V.PI90 );
        mirrorMesh.add( this.groundMirror );
        this.scene.add( mirrorMesh );
    },
    resize:function(){
    	this.dimentions.w = window.innerWidth;
		this.dimentions.h = window.innerHeight;
		this.dimentions.r = this.dimentions.w/this.dimentions.h;
		this.renderer.setSize( this.dimentions.w, this.dimentions.h );
		this.nav.camera.aspect = this.dimentions.r;
		this.nav.camera.updateProjectionMatrix();
        if(this.groundMirror !==null) this.groundMirror.resize(this.dimentions.w, this.dimentions.h, v.nav.camera);
        if(this.postEffect!==null && this.postEffect.isActive){
            this.postEffect.resize(this.dimentions.w, this.dimentions.h);
        }
    },
    colorBack:function(c){
    	if(this.postEffect!==null) this.renderer.setClearColor( c, 1 );
    },
    zone:function(obj){
        obj = obj || {};
        var id = this.zones.length;
        var p = obj.pos || [0,0,0];
        var s = obj.s || 1;
        var m = new THREE.Mesh( this.geo[obj.type || 'ground'], this.mat.zone );
        m.name = 'zone' + id;
        m.scale.set(s,s,s);
        m.position.set(p[0], p[1], p[2]);
        m.visible= obj.v || false;
        this.base.add(m);
        this.zones[id] = m;
    },
    addModel:function(mat){
        if(this.basic!==null){ this.scene.remove(this.basic); }
        if(this.model==='plane'){
            this.basic = new THREE.Mesh( this.geo.ground, mat );
            this.basic.geometry.computeTangents();
            this.basic.scale.set(50,50,50);
            this.scene.add(this.basic);
        }
        else if(this.model==='sphere'){
            this.basic = new THREE.Mesh( this.geo.sphereHigh, mat );
            //this.basic.geometry.computeTangents();
            this.basic.scale.set(25,25,25);
            this.scene.add(this.basic);
        } else { 
            this.tmpmat = mat;
            this.pool.load( this.model, this.onModelLoaded); 
        }
    },
    onModelLoaded:function(){
       // console.log(v.tmpmat.attributes);
        var m = v.pool.meshes[v.model];
        var g = new THREE.Geometry();
        for(var n in m){
            g.merge( m[n].geometry );
        }

        v.basic = new THREE.Mesh( V.TransGeo(g, true), v.tmpmat );
        //for(var a in v.tmpmat.attributes) v.tmpmat.attributes[a].needsUpdate = true;

        if(v.model=='skull')v.basic.scale.set(10,10,-10);
        else if(v.model=='skullhigh')v.basic.scale.set(2,2,-2);
        else if(v.model=='head'){v.basic.scale.set(8,8,-8); v.basic.position.y = -40; }
        else if(v.model=='woman'){v.basic.scale.set(60,60,-60); v.basic.position.y = -37; }
        else v.basic.scale.set(1,1,-1);
        v.scene.add(v.basic);
    },
    loadBasic:function(){
        this.pool.load('object', this.initObject, false, true);
    },
    initObject:function(){
        v.geo['box'] = new THREE.BufferGeometry().fromGeometry(v.pool.getGeometry('object', 'box') );
        v.geo['cylinder'] = new THREE.BufferGeometry().fromGeometry(v.pool.getGeometry('object', 'cylinder') );
    },
    basic:function(){
        this.basic = new THREE.Mesh( this.geo.ground, this.mat.base );
        this.basic.scale.set(50,50,50);
        this.scene.add(this.basic);
    },
    ground:function(){
        this.m = new THREE.Mesh( this.geo.ground, this.mat.base );
        this.m.scale.set(50,50,50);
        this.scene.add(this.m);
    },
    tell:function(s){
        this.info.innerHTML = s;
    },
    addBlob:function(position, radius, isForParticle){
        var b = new V.Blob(this, position, radius);
        if(isForParticle) return b;
        else this.meshs[this.meshs.length] = b;
    },
    addSolid:function(obj){
        var m = new THREE.Mesh( this.geo[obj.type||'box'], this.mat.base );
        obj.pos = obj.pos || [0,0,0];
        obj.size = obj.size || [1,1,1];
        m.scale.set(obj.size[0],obj.size[1],obj.size[2]);
        m.position.set(obj.pos[0],obj.pos[1],obj.pos[2]);
        m.rotation.set(0,0,0);
        this.scene.add(m);
        m.visible = false;
        var g = new THREE.BoxHelper(m);
        g.material = this.mat[obj.mat||'chaine']
        this.scene.add(g);
    },
    quat:function(rot){
        var q = new THREE.Quaternion();
        q.setFromEuler(new THREE.Euler(rot[0]*V.ToRad,rot[1]*V.ToRad,rot[2]*V.ToRad));
        return [q.x,q.y,q.z,q.w];
    },
    add:function(obj){
        var m;
        obj.pos = obj.pos || [0,0,0];
        obj.size = obj.size || [1,1,1];
        if(obj.rot){
            obj.quad = this.quat(obj.rot);//new THREE.Quaternion();
            //obj.quad.setFromEuler(new THREE.Euler(obj.rot[0]*V.ToRad,obj.rot[1]*V.ToRad,obj.rot[2]*V.ToRad), true);
        }
        if(obj.type=='blob'){
            var position = new THREE.Vector3(obj.pos[0],obj.pos[1],obj.pos[2])
            m = new V.Blob(this, position, obj.size[0]*4);
            this.sceneBlob.add(m);
        }else{
            m = new THREE.Mesh( this.geo[obj.type||'box'], this.mat[obj.mat||('shad_'+obj.type)] );
            m.scale.set(obj.size[0],obj.size[1],obj.size[2]);
            m.position.set(obj.pos[0],obj.pos[1],obj.pos[2]);
            m.rotation.set(0,0,0);
            this.scene.add(m);
        }
        this.meshs[this.meshs.length] = m;
        if(this.w) this.w.add(obj);
    },
    addParticle:function(obj){
        var id = this.ps.length;
        this.ps[id] = new V.Particle(this, obj);
        obj.id = id;
        if(this.w) this.w.addParticle(obj);
    },
    initGeo:function(){
        var sph = new THREE.SphereGeometry(1,34,28);
        sph.computeTangents();

    	var geo = {};
		geo['sphere'] = new THREE.BufferGeometry().fromGeometry(new THREE.SphereGeometry(1,12,10));
        geo['sphereHigh'] = sph;//new THREE.BufferGeometry().fromGeometry(sph);//new THREE.SphereGeometry(1,34,28);//new THREE.BufferGeometry().fromGeometry(new THREE.SphereGeometry(1,34,28));
		geo['box'] = new THREE.BufferGeometry().fromGeometry(new THREE.BoxGeometry(1,1,1));
		geo['cylinder'] = new THREE.BufferGeometry().fromGeometry(new THREE.CylinderGeometry(1,1,1,12,1));
	    geo['plane'] = new THREE.PlaneBufferGeometry(1,1);
	    geo['ground'] = new THREE.PlaneBufferGeometry(1,1);
	    geo.ground.applyMatrix(new THREE.Matrix4().makeRotationX(-V.PI90));
	    this.geo = geo;
    },
    initMat:function(){
        this.environment = THREE.ImageUtils.loadTexture( 'images/spherical/e_chrome.jpg');
        this.environment.mapping = THREE.SphericalReflectionMapping;

    	var mat = {};
    	mat['none'] = new THREE.MeshBasicMaterial( { transparent:true, opacity:0, fog:false, depthTest:false, depthWrite:false});
        mat['zone'] = new THREE.MeshBasicMaterial( { color:0X00FF00, transparent:true, opacity:0.1, fog:false, depthTest:false, depthWrite:false});
    	mat['base'] = new THREE.MeshBasicMaterial( { color:0X000000 });
        mat['anchor'] = new THREE.MeshBasicMaterial( { color:0XFF0073 });
        mat['chaine'] = new THREE.LineBasicMaterial({ color: 0xFF0073, transparent:true, opacity:0.3 });
        mat['Sanchor'] = new THREE.MeshBasicMaterial( { color:0XFFFFFF });
        mat['base2'] = new THREE.MeshBasicMaterial( { color:0X00FF00, map:THREE.ImageUtils.loadTexture( 'images/grid1.jpg' ) });
        mat['solid'] = new THREE.MeshBasicMaterial( { color:0XFF0073, transparent:true, opacity:0.05,  depthWrite:false });

        mat['shad_box'] = new THREE.MeshBasicMaterial({color:0XE74C3C, envMap:this.environment, reflectivity:0.4});
        mat['shad_sphere'] = new THREE.MeshBasicMaterial({color:0X2980B9, envMap:this.environment, reflectivity:0.4});
        mat['shad_cylinder'] = new THREE.MeshBasicMaterial({color:0X8E44AD, envMap:this.environment, reflectivity:0.4});
    	this.mat = mat;
    },
    addWorker:function(name, fun){
        this.w = new V.Worker(this, name);
        this.wFun = fun || function(){};
    },
    addRenderTarget:function(w,h){
        var tx = new THREE.WebGLRenderTarget( w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat } );
        this.isWithSerious = true;
        return tx;
    },

    // for physique 2D

    chaine:function(obj){
        var close = obj.close || false;
        var id = this.lines.length;
        var geometry = new THREE.Geometry();
        var l = obj.points.length*0.5, n, pos;
        for(var i=0; i<l; i++){
            n = i*2; 
            pos = new THREE.Vector3(obj.points[n], 0, obj.points[n+1]);
            geometry.vertices.push(pos);
            this.addAnchor(pos, id, i, close);
        }
        if(obj.close) geometry.vertices.push(new THREE.Vector3(obj.points[0], 0, obj.points[1]));
        var line = new THREE.Line(geometry, this.mat.chaine);
        this.scene.add(line);
        //line.geometry.dynamic = true;

        this.lines[id] = line;

        if(this.w) this.w.chaine(obj);
    },
    addAnchor:function(p, id, n, closed){
        var m = new THREE.Mesh(this.geo.sphere, this.mat.anchor);
        m.scale.set(0.5, 0.5, 0.5);
        m.position.copy(p);
        if(closed) m.name = 'ca'+id+'_'+n;
        else m.name = 'oa'+id+'_'+n;
        this.base.add(m);
        this.anchors[ m.name ] = m;
    },
    upAnchor:function(obj){
        var name = obj.name;
        var n = name.lastIndexOf("_")
        var id = name.substring(2, n) || 0;
        id*=1;
        var pid = name.substring(n+1, name.length) || 0;
        pid*=1;
        var line = this.lines[id];
        var l = line.geometry.vertices.length;
        line.geometry.vertices[pid].copy(obj.position);
        if(name.substring(0, 1) == 'c' && pid == 0){
            line.geometry.vertices[l-1].copy(obj.position);
        }
        line.geometry.verticesNeedUpdate = true;

        if(this.w){
            //console.log(pid*2, (pid*2)+1)
            this.w.dr[pid*2] = obj.position.x;
            this.w.dr[(pid*2)+1] = obj.position.z;
           // this.w.msg = 'updecal';
            //this.w.post({m:'updecal'})
            this.w.updateDecal();
        }
    }
}


//---------------------------------------------------
//   BLOBS
//---------------------------------------------------

V.Blob = function(parent, position, radius){
    THREE.Object3D.call( this );
    this.type = 'BLOB';
    this.root = parent;
    var geo = this.root.geo.plane;
    var map = new THREE.MeshBasicMaterial({color:0X000000})
    this.s1 = new THREE.Mesh(geo,map);
    var s = radius || 20;
    s*=2;
    this.s1.scale.set(s,s,s);
    this.root.sceneBlob.add(this.s1);

    if(position) this.position.copy(position);
}
V.Blob.prototype = Object.create( THREE.Object3D.prototype );
V.Blob.prototype.constructor = V.Blob;
//V.Blob.prototype._updateMatrix = V.Blob.prototype.updateMatrix;
/*V.Blob.prototype.updateMatrix = function() {
  //  console.log('up')
  this._updateMatrix();
  if (this.customMatrix != null)
    this.matrix.multiply(this.customMatrix);
};*/
V.Blob.prototype.clear = function(){
    this.root.sceneBlob.remove( this.s1 );
}
V.Blob.prototype.update = function (r) {
    this.s1.position.copy(this.position);
    //this.s1.rotation.copy(r);
    this.s1.quaternion.copy(r);
}


//---------------------------------------------------
//   NAVIGATION
//---------------------------------------------------

V.Nav = function(parent, h, v, d){
	this.isFocus = false;
    this.isRevers = false;
    this.cammode = 'normal';
    this.EPS = 0.000001;
	this.root = parent;

	this.cursor = new V.Cursor();
    this.lockView = false;



	this.camera = new THREE.PerspectiveCamera( V.Resolution.f, this.root.dimentions.r, 0.1, 2000 );
	this.mouse3d = new THREE.Vector3();
	this.selectName = '';

	this.rayVector = new THREE.Vector3( 0, 0, 1 );
	this.raycaster = new THREE.Raycaster();
	this.target = new THREE.Vector3();
    this.position = new THREE.Vector3();
	this.cam = { horizontal:h||0, vertical:v||90, distance:d||20, automove:false, theta:0, phi:0 };
    this.mouse = { x:0, y:0, ox:0, oy:0, h:0, v:0, mx:0, my:0, px:0, py:0, pz:0, r:0, down:false, move:true, button:0 };

    this.key = { up:0, down:0, left:0, right:0, ctrl:0, action:0, space:0, shift:0 };
    //this.imput = new V.UserImput(this);

    this.moveCamera();

    
    this.root.canvas.oncontextmenu = function(e){e.preventDefault()};
    this.root.canvas.onclick = function(e) {this.onMouseClick(e)}.bind( this );
    this.root.canvas.onmousemove = function(e) {this.onMouseMove(e)}.bind( this );
    this.root.canvas.onmousedown = function(e) {this.onMouseDown(e)}.bind( this );
    this.root.canvas.onmouseout = function(e) {this.onMouseOut(e)}.bind( this );
    this.root.canvas.onmouseup = function(e) {this.onMouseUp(e)}.bind( this );
    this.root.canvas.onmousewheel = function(e) {this.onMouseWheel(e)}.bind( this );
    //this.root.canvas.onDOMMouseScroll = function(e) {this.onMouseWheel(e)}.bind( this );
    this.root.canvas.addEventListener('DOMMouseScroll', function(e){this.onMouseWheel(e)}.bind( this ), false );
}

V.Nav.prototype = {
	constructor: V.Nav,
	moveCamera:function(){
        this.orbit();
        this.camera.position.copy(this.position);
        this.camera.lookAt(this.target);
    },
    moveSmooth:function(){
        this.orbit();
        this.camera.position.lerp(this.position, 0.3);
        this.camera.lookAt(this.target);
    },
    revers:function(){
        this.isRevers = true;
        this.camera.scale.x = -1; 
    },
    orbit:function(){
        var p = this.position;
        var d = this.cam.distance;
        var phi = this.cam.vertical*V.ToRad;
        var theta = this.cam.horizontal*V.ToRad;
        phi = Math.max( this.EPS, Math.min( Math.PI - this.EPS, phi ) );
        this.cam.theta = theta;
        this.cam.phi = phi;
        p.x = d * Math.sin(phi) * Math.cos(theta);
        p.y = d * Math.cos(phi);
        p.z = d * Math.sin(phi) * Math.sin(theta);
        p.add(this.target);
    },
    mode:function(){
        if(this.cammode == 'normal'){
            this.cammode = 'fps';
            this.cam.distance = 0.1;
        }else{
            this.cammode = 'normal';
            this.cam.distance = 20;
        }
        this.moveSmooth();
    },
    move:function(v){
        this.target.copy(v);
        this.moveCamera();
    },
    moveto:function(x,y,z){
        this.target.set(x,y,z);
        this.moveCamera();
    },
    onMouseClick:function(e){
        e.preventDefault();
        if (typeof mainClick == 'function') { mainClick(); }
    },
    onMouseDown:function(e){
        this.mouse.down = true;
        this.mouse.button = e.which;
        //console.log(e.which)
        this.mouse.ox = e.clientX;
        this.mouse.oy = e.clientY;
        this.mouse.h = this.cam.horizontal;
        this.mouse.v = this.cam.vertical;
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        this.mouse.px = this.target.x;
        this.mouse.pz = this.target.z;
        this.mouse.py = this.target.y;
        
	    this.rayTest();
        if (typeof mainDown == 'function') { mainDown(); }
        e.preventDefault();
        e.stopPropagation();
        //document.body.contentEditable=true
        //window.top.focus();
    },
    onMouseUp:function(e){
        this.mouse.down = false;
        this.cursor.change();
        if (typeof mainUp == 'function') { mainUp(); }
        e.preventDefault();
        e.stopPropagation();
    },
    onMouseOut:function(e){
    	this.isFocus = false;
        this.mouse.down = false;
        this.cursor.change();
        if (typeof mainUp == 'function') { mainUp(); }
        e.preventDefault();
        e.stopPropagation();
    },
    onMouseMove:function(e){
    	if(!this.isFocus){
    		self.focus();
    		window.top.main.blur();
    		this.isFocus = true;
    	}
        if (this.mouse.down && this.mouse.move && !this.lockView) {
            if(this.mouse.button==3){
                this.cursor.change('drag');
                var px = -((e.clientX - this.mouse.ox) * 0.3);
                if(this.isRevers){
                    this.target.x = -(Math.sin(this.cam.theta) * px) +  this.mouse.px;
                    this.target.z = (Math.cos(this.cam.theta) * px) +  this.mouse.pz;
                }else{
                    this.target.x = (Math.sin(this.cam.theta) * px) +  this.mouse.px;
                    this.target.z = -(Math.cos(this.cam.theta) * px) +  this.mouse.pz;
                }
                this.target.y = ((e.clientY - this.mouse.oy) * 0.3) + this.mouse.py;
            }else{
                this.cursor.change('rotate');
                if(this.isRevers) this.cam.horizontal = -((e.clientX - this.mouse.ox) * 0.3) + this.mouse.h;
                else this.cam.horizontal = ((e.clientX - this.mouse.ox) * 0.3) + this.mouse.h;
                this.cam.vertical = (-(e.clientY - this.mouse.oy) * 0.3) + this.mouse.v;
                if (this.cam.vertical < 0){ this.cam.vertical = 0; }
            }
            this.moveCamera();
        }
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        this.rayTest();
        if (typeof mainMove == 'function') { mainMove(); }
        e.preventDefault();
        e.stopPropagation();
    },
    onMouseWheel:function(e){
        if(this.cammode=='fps') return;
        var delta = 0;
        if(e.wheelDeltaY){delta=e.wheelDeltaY*0.01;}
        else if(e.wheelDelta){delta=e.wheelDelta*0.05;}
        else if(e.detail){delta=-e.detail*1.0;}
        this.cam.distance -= delta;
        if(this.cam.distance<0.5)this.cam.distance = 0.5;
        this.moveCamera();
        e.preventDefault();
        e.stopPropagation();
    },
    rayTest:function(e){
    	this.rayVector.x = ( this.mouse.x / this.root.dimentions.w ) * 2 - 1;
	    this.rayVector.y = - ( this.mouse.y / this.root.dimentions.h ) * 2 + 1;
		this.rayVector.unproject( this.camera );
		this.raycaster.ray.set( this.camera.position, this.rayVector.sub( this.camera.position ).normalize() );
		var intersects = this.raycaster.intersectObjects( this.root.base.children );
		if ( intersects.length > 0 ) {
			//this.mouse.move = false;
			this.selectName = intersects[0].object.name;
            this.mouse3d.copy(intersects[0].point);

            if (typeof mainRay == 'function') { mainRay(this.mouse3d, this.selectName); }
			
		} else {
			this.selectName = '';
			//this.mouse.move = true;
			//this.cursor.change();
		}
	},
    // ACTIVE KEYBOARD
    bindKeys:function(){
    	//this.root.canvas.onkeydown = function(e) {
    	window.onkeydown = function(e) {
        //window.top.onkeydown = function(e) {
            e = e || window.event;
            switch ( e.keyCode ) {
                case 38: case 87: case 90: this.key.up = 1;     break; // up, W, Z
                case 40: case 83:          this.key.down = 1;   break; // down, S
                case 37: case 65: case 81: this.key.left = 1;   break; // left, A, Q
                case 39: case 68:          this.key.right = 1;  break; // right, D
                case 17: case 67:          this.key.ctrl = 1;   break; // ctrl, C
                case 69:                   this.key.action = 1; break; // E
                case 32:                   this.key.space = 1;  break; // space
                case 16:                   this.key.shift = 1;  break; // shift
            }
        }.bind(this);
        //this.root.canvas.onkeyup = function(e) {
        window.onkeyup = function(e) {
        //window.top.onkeyup = function(e) {
            e = e || window.event;
            switch( e.keyCode ) {
                case 38: case 87: case 90: this.key.up = 0;     break; // up, W, Z
                case 40: case 83:          this.key.down = 0;   break; // down, S
                case 37: case 65: case 81: this.key.left = 0;   break; // left, A, Q
                case 39: case 68:          this.key.right = 0;  break; // right, D
                case 17: case 67:          this.key.ctrl = 0;   break; // ctrl, C
                case 69:                   this.key.action = 0; break; // E
                case 32:                   this.key.space = 0;  break; // space
                case 16:                   this.key.shift = 0;  break; // shift
            }
        }.bind(this);
    },
    unwrapDegrees:function(r){
        r = r % 360;
        if (r > 180) r -= 360;
        if (r < -180) r += 360;
        return r;
    },
    unwrapRadian : function(r){
        r = r % V.TwoPI;
        if (r > Math.PI) r -= V.TwoPI;
        if (r < -Math.PI) r += V.TwoPI;
        return r;
    }
}

//---------------------------------------------------
//   CURSOR
//---------------------------------------------------

V.Cursor = function(){
	this.current = 'auto';
	this.type = {
		drag : 'url(images/cursor/hand.png) 16 16,auto',
		draw : 'url(images/cursor/draw.png) 16 16,auto',
		cut  : 'url(images/cursor/cut.png) 0 30,auto',
        rotate  : 'url(images/cursor/rotate.png) 16 16,auto',
		move : 'move',
		auto : 'auto'
	}
}

V.Cursor.prototype = {
	constructor: V.Cursor,
	change: function(name){
		name = name || 'auto';
		if(name!==this.current){
			this.current = name;
			document.body.style.cursor = this.type[this.current];
		}
	}
}



V.randCarColor = function () {
    var carcolors = [
    [0xFFFFFF, 0xD0D1D3, 0XEFEFEF, 0xEEEEEE],//white
    [0x252122, 0x302A2B, 0x27362B, 0x2F312B],//black
    [0x8D9495, 0xC1C0BC, 0xCED4D4, 0xBEC4C4],//silver
    [0x939599, 0x424242, 0x5A5A5A, 0x747675],//gray
    [0xC44920, 0xFF4421, 0x600309, 0xD9141E],//red
    [0x4AD1FB, 0x275A63, 0x118DDC, 0x2994A6],//blue
    [0xA67936, 0x874921, 0xD7A56B, 0x550007],//brown
    [0x5FF12C, 0x188047, 0x8DAE29, 0x1AB619],//green
    [0xFFF10A, 0xFFFFBD, 0xFCFADF, 0xFFBD0A],//yellow/gold
    [0xB92968, 0x5C1A4F, 0x001255, 0xFFB7E7]//other
    ];
    var l;
    var p = V.randInt(0,100);
    var n = V.randInt(0,3);

    if(p<23)l=0;
    else if(p<44)l=1;
    else if(p<62)l=2;
    else if(p<76)l=3;
    else if(p<84)l=4;
    else if(p<90)l=5;
    else if(p<96)l=6;
    else if(p<97)l=7;
    else if(p<98)l=8;
    else l=9;

    var base =carcolors[l][n];

    var resl = base.toString(16);
    if(resl.length<6) resl = '#0'+resl;
    else resl = '#'+resl;
    return resl;
}