var ThreeDPlot=function(maxX,maxY,maxZ,divSize,xPlaneName,zPlaneName) {
	this.maxX=maxX; this.maxY=maxY; this.maxZ=maxZ; this.divSize=divSize; this.xPlaneName=xPlaneName; this.zPlaneName=zPlaneName;
	this.scaleFactor=Math.max(Math.max(maxX,maxY),maxZ)/100;
	this.makeWall=function(xVal,yVal,divSize) {
		var vtx=[];
		for(var i=divSize;i<=xVal+1;i+=divSize)
		{
			vtx.push(-i, 0, 0); vtx.push(-i, -yVal, 0);
			if (i<xVal+1) { i+=divSize; if (i>xVal) i=xVal; vtx.push(-i, -yVal, 0); vtx.push(-i, 0, 0); }
		};
		if (i>xVal+1) vtx.push(-xVal,0,0);
		vtx.push(-xVal, -yVal, 0); vtx.push(0, -yVal, 0);
		vtx.push(0, 0, 0); vtx.push(-xVal, 0, 0);
		for(var i=0;i<yVal;i+=divSize)
		{
			vtx.push(-xVal, -i, 0); vtx.push(0, -i, 0);
			i+=divSize; if (i>yVal) i=yVal; vtx.push(-0, -i, 0); vtx.push(-xVal, -i, 0);  
		};
		var lg=new THREE.LineGeometry(); lg.setPositions(vtx);
		var m4=new THREE.Matrix4(); m4.makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI); lg.applyMatrix(m4);  
		return lg;
	}

	this.drawWalls=function(scene,lineMaterialOptions) {
		var material=new THREE.LineMaterial(lineMaterialOptions);
		var l1=new THREE.Line2(this.makeWall(this.maxX,this.maxY,this.divSize), material);
		//l1.computeLineDistances(); l1.scale.set(1, 1, 1);  //Are these necessary?

		var l2=new THREE.Line2(this.makeWall(this.maxZ,this.maxY,this.divSize), material),q1=new THREE.Quaternion();
		q1.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2); l2.applyQuaternion(q1);  

		var l3= new THREE.Line2(this.makeWall(this.maxX,this.maxZ,this.divSize), material),q2=new THREE.Quaternion();
		q2.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2); l3.applyQuaternion(q2);  

		scene.add(l1); scene.add(l2); scene.add(l3);
	}

	this.applyDefaultLights=function(scene) {
		scene.add(new THREE.AmbientLight(0xffffff,2.5));
		var pla=(x,y,z)=>{ var pl=new THREE.PointLight(0xffffff,0.6,0,0); pl.position.set(x,y,z); scene.add(pl); };
			//8 lights - all 8 corners of the cube.
		pla(-this.maxX-200,this.maxY,this.maxZ+200); pla(-this.maxX-200,0,this.maxZ+200);
		pla(200,this.maxY,this.maxZ+200); pla(200,0,this.maxZ+200);
		pla(-this.maxX-200,this.maxY,-200); pla(-this.maxX-200,0,-200);
		pla(200,this.maxY,-200); pla(200,0,-200);
			//6 lights.
		//var Y=this.maxY/2; pla(-this.maxX-200,Y,this.maxZ+200); pla(200,Y,this.maxZ+200); pla(-this.maxX-200,Y,-200); pla(200,Y,-200);
		//pla(-this.maxX/2,this.maxY+200,this.maxZ/2); pla(-this.maxX/2,-200,this.maxZ/2);
	}

	this.drawScales=function(scene,textColor) {
		var self=this; var loader=new THREE.FontLoader();
		var url='https://syork60.github.io/share/gentilis_regular.typeface.json';
		loader.load(url, function (font) {
			var matDark=new THREE.LineBasicMaterial({ color: textColor, side: THREE.DoubleSide });
			var getTG=s=>new THREE.TextGeometry(s,{ font: font, size: self.scaleFactor*2.8, height: 1, curveSegments: 12, bevelEnabled: false});
			var getTGWidth=g=>{ g.computeBoundingBox(); return g.boundingBox.max.x; }
			var geometry=getTG(self.zPlaneName),gWidth=getTGWidth(geometry);
			geometry.rotateY(-Math.PI/2); geometry.translate(0,self.maxY+self.scaleFactor/2,(maxZ-gWidth)/2);
			scene.add(new THREE.Mesh(geometry, matDark));
			geometry=getTG(self.xPlaneName); gWidth=getTGWidth(geometry);
			var tm=new THREE.Mesh(geometry,matDark); tm.position.x=-((self.maxX-gWidth)/2); tm.position.y=self.maxY+self.scaleFactor/2; scene.add(tm);
			var doScale=(v,tf)=> { geometry=getTG(""+v); tf(geometry); scene.add(new THREE.Mesh(geometry, matDark)); };
			var doX=v=>doScale(v,g=>{ g.rotateY(-Math.PI/2); g.rotateZ(-Math.PI/2); g.translate(-v+4,0,self.maxZ+4); });
			for(var i=self.divSize;i<self.maxX;i+=self.divSize) doX(i); doX(self.maxX);
			var doY1=v=>doScale(v,g=>{ geometry.rotateY(-Math.PI/2); geometry.translate(0,self.maxY-v,self.maxZ+4); });
			for(var i=self.maxY;i>0;i-=self.divSize) doY1(i);
			var doY2=v=>doScale(v,g=>{ geometry.translate(-self.maxX-getTGWidth(geometry)-self.scaleFactor/2,self.maxY-v,0); });
			for(var i=self.maxY;i>0;i-=self.divSize) doY2(i);
			var doZ=v=>doScale(v,g=>{ geometry.rotateX(-Math.PI/2); geometry.translate(-self.maxX-getTGWidth(geometry)-self.scaleFactor/2,0,v); });
			for(var i=self.divSize;i<self.maxZ;i+=self.divSize) doZ(i); doZ(self.maxZ);
		});
	}

	this.applyOrbitControls=function(camera)
	{
		var oc=new THREE.OrbitControls(camera); oc.target=new THREE.Vector3(-this.maxX/2,this.maxY/2,0);
		oc.screenSpacePanning=true; oc.enableDamping=true; oc.dampingFactor=0.08;
		oc.rotateSpeed=0.1; oc.panSpeed=0.1; return oc;
	}

	this.getDefaultCamera=function()
	{
		var rc=new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000000);
		rc.position.set(-this.maxX*1.4, this.maxY*1.3, this.maxX*2); return rc;
	}
};

var MyTubes=function(data,preferredDivisions) {
	this.data=data;

	this.ru100=v=>Math.round(v/100)*100;
	this.xMax=this.ru100(d3.max(data,d=>Math.abs(+d.East)));
	this.yMax=this.ru100(d3.max(data,d=>Math.abs(+d.TVD)));
	this.zMax=this.ru100(d3.max(data,d=>Math.abs(+d.North)));
	var lc=Math.max(Math.max(this.xMax,this.yMax),this.zMax)/preferredDivisions;
	this.divUnits=this.ru100(lc);
	while((this.xMax%this.divUnits)>0) this.xMax+=100;
	while((this.yMax%this.divUnits)>0) this.yMax+=100;
	while((this.zMax%this.divUnits)>0) this.zMax+=100;

		//Never got the Line2 working here.
	this.drawShadow=function(scene,path,m4,shadowColor) {	//Currently, this is just the X-wall shadow.
		geometry=new THREE.Geometry(); geometry.setFromPoints(path.getPoints(data.length)); geometry.applyMatrix(m4);
		scene.add(new THREE.Line(geometry,new THREE.LineBasicMaterial({ color: shadowColor })));
	}

	this.drawTube=function(scene,scaleFactor,tubeColors,shadowColor) {
		var cv=[]; $.each(this.data,(i,v)=>cv.push(new THREE.Vector3(+v.East,this.yMax-v.TVD,-v.North)));
		var path=new THREE.CatmullRomCurve3(cv); cv=[];
		this.drawShadow(scene,path,new THREE.Matrix4().set(0,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1),shadowColor);
		this.drawShadow(scene,path,new THREE.Matrix4().set(1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,1),shadowColor);
		this.drawShadow(scene,path,new THREE.Matrix4().set(1,0,0,0, 0,1,0,0, 0,0,0,0, 0,0,0,1),shadowColor);

		var drawSegment=(points,dia,color,style)=>{
			if (points.length<2) return;
			var curve=new THREE.CurvePath(),pv=null; $.each(points,(i,v)=>{ if (pv) curve.add(new THREE.LineCurve3(pv,v)); pv=v; });
			var geometry=new THREE.TubeBufferGeometry(curve,points.length,dia*scaleFactor,32,false);
			var options=(style&1!=0)?{color: tubeColors[+color],roughness:0.5,metalness:0.8,opacity:0.1,transparent:true}:
				{color: tubeColors[+color],roughness:0.5,metalness:0.8};
			material=new THREE.MeshStandardMaterial(options); scene.add(new THREE.Mesh(geometry, material));
			var genCap=(p,pl)=>
			{
				var cg=new THREE.CircleGeometry(dia*scaleFactor,32);
				var v=new THREE.Vector3(p.x-pl.x,p.y-pl.y,p.z-pl.z); v.normalize(); cg.lookAt(v);
				cg.applyMatrix(new THREE.Matrix4().set(1,0,0,p.x, 0,1,0,p.y, 0,0,1,p.z, 0,0,0,1)); return cg;
			};
			scene.add(new THREE.Mesh(genCap(points[0],points[1]),material));
			var pe=points.length-1; scene.add(new THREE.Mesh(genCap(points[pe],points[pe-1]),material));
		};
		var prev=null,points=path.getPoints(data.length),p2=[]; //If color or diameter changes, break it up.
		$.each(this.data,(i,v)=>{
			if (prev && (prev.Dia!=v.Dia || prev.Color!=v.Color || prev.Style!=v.Style))
				{ drawSegment(p2,prev.Dia,prev.Color,prev.Style); p2=[]; p2.push(points[i-1]); }
			p2.push(points[i]); prev=v;
		});
		if (p2.length>0) { drawSegment(p2,prev.Dia,prev.Color,prev.Style); p2=[]; }
	};
};

//--------------------
	var renderer=new THREE.WebGLRenderer({antialias:true});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth-20, window.innerHeight-20);
//Finish - got to pass in the dom element to append to.
	document.body.appendChild(renderer.domElement);
	var scene,camera,controls;

	function animate() {
		requestAnimationFrame(animate);
		controls.update();
		render();
	}

	function render() {
		renderer.render(scene, camera);
	}

	function showIt(data) {
		var mt=new MyTubes(data,8);
		var tdv=new ThreeDPlot(mt.xMax,mt.yMax,mt.zMax,mt.divUnits,"270° (East)","180° (South)");
		camera=tdv.getDefaultCamera();
		controls=tdv.applyOrbitControls(camera);
		scene=new THREE.Scene();
		scene.background=new THREE.Color( 0xeffffff );
		tdv.applyDefaultLights(scene);
		tdv.drawWalls(scene,{color: 0x808080,linewidth: 0.001 });
		//tdv.drawWalls(scene,{color: 0xe0e0e0,linewidth: 0.002 });
		tdv.drawScales(scene,0x4080a0);
		//var tubeColors=[0,0xce9481,0xd04040,0x81849e];
		var tubeColors=[0x404040,0x408040,0xd04040,0x408040];
		mt.drawTube(scene,tdv.scaleFactor,tubeColors,0x6060f0);
		animate();
	};

	d3.tsv('https://syork60.github.io/share/GF_A20_5.tsv').then(showIt).catch(err=>console.log('Error: '+err));
