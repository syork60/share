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
