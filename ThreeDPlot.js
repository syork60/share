class ThreeDPlotParams
{
	constructor(data,parameters)	//UL,UR,LL,LR.
	{
		this.setValues=function(values) {
			if (values===undefined) return;
			for (var key in values) {
				var newValue=values[key];
				if (newValue===undefined ) { console.warn("'"+key+"' parameter is undefined." ); continue; }
				var currentValue=this[key];
				if (currentValue===undefined) { console.warn("'" + key + "' is not a property of MyTubes." ); continue; }
				this[key]=newValue;
			}
		};

		this.data=data; this.preferredDivisions=8; this.setValues(parameters);
		this.xExtent=d3.extent(data,d=>+d.North); this.yExtent=d3.extent(data,d=>+d.TVD); this.zExtent=d3.extent(data,d=>+d.East);
		if (this.xExtent[1]<0) throw "Invalid 'North' data range!"; this.xExtent[0]=Math.min(0,this.xExtent[0]);
		if (this.zExtent[1]<0) throw "Invalid 'East' data range!"; this.zExtent[0]=Math.min(0,this.zExtent[0]);
		this.rus100=v=>Math.round((v+99.9)/100)*100;
		this.ru100=ext=> { var b=Math.min(0,ext[0]),t=this.rus100(ext[1]); if (b==0) return [0,t]; return [0-this.rus100(0-b),t]; };
		this.xExtent=this.ru100(this.xExtent); this.yExtent=this.ru100(this.yExtent); this.zExtent=this.ru100(this.zExtent);
		var fx=Math.abs(this.xExtent[0])>this.xExtent[1],fz=Math.abs(this.zExtent[0])>this.zExtent[1];
		if (fx && fz) this.quadrant=3; else if (fx) this.quadrant=4; else if (fz) this.quadrant=1; else this.quadrant=2;
		if (fx) { var t=this.xExtent[0]; this.xExtent[0]=this.xExtent[1]; this.xExtent[1]=-t; }
		if (fz) { var t=this.zExtent[0]; this.zExtent[0]=this.zExtent[1]; this.zExtent[1]=-t; }
		var er=ext=>ext[1]-ext[0];
		var lc=Math.max(Math.max(er(this.xExtent),er(this.yExtent)),er(this.zExtent))/this.preferredDivisions;
		this.divSize=this.rus100(lc);
		var fixExt=ext=>{
			if(ext[0]>=0) ext[0]=-100; if (ext[1]<=0) ext[1]=100;
			while((ext[0]%this.divSize)<0) ext[0]-=100; while((ext[1]%this.divSize)>0) ext[1]+=100; return ext;
		};
		this.xExtent=fixExt(this.xExtent); this.yExtent=fixExt(this.yExtent); this.zExtent=fixExt(this.zExtent); this.yExtent[0]=0;
		if (this.quadrant==1) { this.zPlaneName="0° (North)"; this.xPlaneName="270° (West)"; }
		else if (this.quadrant==2) { this.zPlaneName="90° (East)"; this.xPlaneName="0° (North)"; }
		else if (this.quadrant==3) { this.zPlaneName="270° (West)"; this.xPlaneName="180° (South)"; }
		else if (this.quadrant==4) { this.zPlaneName="180° (South)"; this.xPlaneName="90° (East)"; }
		else throw "Invalid quadrant!";
		this.xBack=this.xExtent[0]; this.xFront=this.xExtent[1]; this.zBack=this.zExtent[0]; this.zFront=this.zExtent[1];
	}
}

class ThreeDPlot
{
	constructor(threeDPlotParams)
	{
		this.pp=threeDPlotParams; this.maxY=this.pp.yExtent[1]; var er=ext=>ext[1]-ext[0]; this.flip=this.pp.quadrant==1 || this.pp.quadrant==4;
		this.scaleFactor=Math.max(Math.max(er(this.pp.xExtent),er(this.pp.yExtent)),er(this.pp.zExtent))/100;
	}

	drawOne(scene,material,vtx) { var lg=new THREE.LineGeometry(); lg.setPositions(vtx); scene.add(new THREE.Line2(lg,material)); }
	XAndY(scene,material,val)
	{
		if (this.flip) this.drawOne(scene,material,[val,this.maxY,this.pp.zBack,val,0,this.pp.zBack,val,0,this.pp.xFront]);
		else this.drawOne(scene,material,[val,this.maxY,this.pp.zBack,val,0,this.pp.zBack,val,0,this.pp.zFront]);
	}
	ZAndY(scene,material,val)
	{
		if (this.flip) this.drawOne(scene,material,[this.pp.xBack,this.maxY,val,this.pp.xBack,0,val,this.pp.zFront,0,val]);
		else this.drawOne(scene,material,[this.pp.xBack,this.maxY,val,this.pp.xBack,0,val,this.pp.xFront,0,val]);
	}
	XAndZ(scene,material,val)
	{
		if (this.flip) this.drawOne(scene,material,[this.pp.xBack,val,this.pp.xFront,this.pp.xBack,val,this.pp.zBack,this.pp.zFront,val,this.pp.zBack]);
		else this.drawOne(scene,material,[this.pp.xBack,val,this.pp.zFront,this.pp.xBack,val,this.pp.zBack,this.pp.xFront,val,this.pp.zBack]);
	}

	drawWalls(scene,lineMaterialOptions) {
		var material=new THREE.LineMaterial(lineMaterialOptions),ds=this.pp.divSize;
		if (this.flip)
		{
			for(var i=this.pp.xBack;i<this.pp.zFront;i+=ds) this.XAndY(scene,material,i); this.XAndY(scene,material,this.pp.zFront);
			for(var i=this.pp.zBack;i<this.pp.xFront;i+=ds) this.ZAndY(scene,material,i); this.ZAndY(scene,material,this.pp.xFront);
		}
		else
		{
			for(var i=this.pp.xBack;i<this.pp.xFront;i+=ds) this.XAndY(scene,material,i); this.XAndY(scene,material,this.pp.xFront);
			for(var i=this.pp.zBack;i<this.pp.zFront;i+=ds) this.ZAndY(scene,material,i); this.ZAndY(scene,material,this.pp.zFront);
		}
		for(var i=ds;i<this.maxY;i+=ds) this.XAndZ(scene,material,i); this.XAndZ(scene,material,this.maxY);
	}

	highlightZeros(scene,lineMaterialOptions)
		{ var m=new THREE.LineMaterial(lineMaterialOptions); this.XAndY(scene,m,0); this.ZAndY(scene,m,0); }

	applyDefaultLights(scene) {
		scene.add(new THREE.AmbientLight(0xffffff,2.5));
		var pla=(x,y,z)=>{ var pl=new THREE.PointLight(0xffffff,0.5,0,0); pl.position.set(x,y,z); scene.add(pl); };
    var offset=5000;
			//8 lights - all 8 corners of the cube.
		pla(this.pp.xFront+offset,this.maxY+offset,this.pp.zFront+offset); pla(this.pp.xFront+offset,-offset,this.pp.zFront+offset);
		pla(this.pp.xBack-offset,this.maxY+offset,this.pp.zFront+offset); pla(this.pp.xBack-offset,-offset,this.pp.zFront+offset);
		pla(this.pp.xFront+offset,this.maxY+offset,this.pp.zBack-offset); pla(this.pp.xFront+offset,-offset,this.pp.zBack-offset);
		pla(this.pp.xBack-offset,this.maxY+offset,this.pp.zBack-offset); pla(this.pp.xBack-offset,-offset,this.pp.zBack-offset);
	}

	drawScales(scene,textColor) {
		var self=this; var loader=new THREE.FontLoader();
		var url='https://syork60.github.io/share/gentilis_regular.typeface.json';
		loader.load(url, function (font) {
			var matDark=new THREE.LineBasicMaterial({ color: textColor, side: THREE.DoubleSide });
			var getTG=s=>new THREE.TextGeometry(s,{ font: font, size: self.scaleFactor*2.8, height: 1, curveSegments: 12, bevelEnabled: false});
			var getTGWidth=g=>{ g.computeBoundingBox(); return g.boundingBox.max.x; }
			var doScale=(v,tf)=> { geometry=getTG(""+v); tf(geometry); scene.add(new THREE.Mesh(geometry, matDark)); };
			if (self.flip)
			{
				var geometry=getTG(self.pp.zPlaneName),tw=getTGWidth(geometry);
				geometry.rotateY(Math.PI/2); geometry.translate(self.pp.xBack,self.maxY+self.scaleFactor/2,(self.pp.xFront+self.pp.xBack+tw)/2);
				scene.add(new THREE.Mesh(geometry,matDark));

				geometry=getTG(self.pp.xPlaneName); tw=getTGWidth(geometry);
				var tm=new THREE.Mesh(geometry,matDark); tm.position.x=(self.pp.zFront+self.pp.zBack-tw)/2; tm.position.y=self.maxY+self.scaleFactor/2;
				tm.position.z=self.pp.zBack; scene.add(tm);

				var doX=v=>doScale(v,g=>{ var tw=getTGWidth(g); g.rotateY(Math.PI/2); g.rotateZ(Math.PI/2); g.translate(v+self.scaleFactor/2,0,self.pp.xFront+tw+self.scaleFactor/2); });
				for(var i=self.pp.xBack+self.pp.divSize;i<self.pp.zFront;i+=self.pp.divSize) doX(i); doX(self.pp.zFront);
				var doY1=v=>doScale(v,g=>{ var tw=getTGWidth(g); g.rotateY(Math.PI/2); g.translate(self.pp.xBack,self.maxY-v,self.pp.xFront+tw+self.scaleFactor/2); });
				for(var i=self.maxY;i>0;i-=self.pp.divSize) doY1(i);
				var doY2=v=>doScale(v,g=>{ g.translate(self.pp.zFront+self.scaleFactor/2,self.maxY-v,self.pp.zBack); });
				for(var i=self.maxY;i>0;i-=self.pp.divSize) doY2(i);
				var doZ=v=>doScale(v,g=>{ g.rotateX(-Math.PI/2); g.translate(self.pp.zFront+self.scaleFactor/2,0,v); });
				for(var i=self.pp.zBack+self.pp.divSize;i<self.pp.xFront;i+=self.pp.divSize) doZ(i); doZ(self.pp.xFront);
			}
			else
			{
				var geometry=getTG(self.pp.zPlaneName),tw=getTGWidth(geometry);
				geometry.rotateY(Math.PI/2); geometry.translate(self.pp.xBack,self.maxY+self.scaleFactor/2,(self.pp.zFront+self.pp.zBack+tw)/2);
				scene.add(new THREE.Mesh(geometry,matDark));

				geometry=getTG(self.pp.xPlaneName); tw=getTGWidth(geometry);
				var tm=new THREE.Mesh(geometry,matDark); tm.position.x=(self.pp.xFront+self.pp.xBack-tw)/2; tm.position.y=self.maxY+self.scaleFactor/2;
				tm.position.z=self.pp.zBack; scene.add(tm);

				var doX=v=>doScale(v,g=>{ var tw=getTGWidth(g); g.rotateY(Math.PI/2); g.rotateZ(Math.PI/2); g.translate(v+self.scaleFactor/2,0,self.pp.zFront+tw+self.scaleFactor/2); });
				for(var i=self.pp.xBack+self.pp.divSize;i<self.pp.xFront;i+=self.pp.divSize) doX(i); doX(self.pp.xFront);
				var doY1=v=>doScale(v,g=>{ var tw=getTGWidth(g); g.rotateY(Math.PI/2); g.translate(self.pp.xBack,self.maxY-v,self.pp.zFront+tw+self.scaleFactor/2); });
				for(var i=self.maxY;i>0;i-=self.pp.divSize) doY1(i);
				var doY2=v=>doScale(v,g=>{ g.translate(self.pp.xFront+self.scaleFactor/2,self.maxY-v,self.pp.zBack); });
				for(var i=self.maxY;i>0;i-=self.pp.divSize) doY2(i);
				var doZ=v=>doScale(v,g=>{ g.rotateX(-Math.PI/2); g.translate(self.pp.xFront+self.scaleFactor/2,0,v); });
				for(var i=self.pp.zBack+self.pp.divSize;i<self.pp.zFront;i+=self.pp.divSize) doZ(i); doZ(self.pp.zFront);
			}
		});
	}

	applyOrbitControls(camera,domElement)
	{
		var oc=new THREE.OrbitControls(camera,domElement); oc.target=new THREE.Vector3(-this.pp.xExtent[1]/2,this.maxY/2,0);
		oc.screenSpacePanning=true; oc.enableDamping=true; oc.dampingFactor=0.08;
		oc.rotateSpeed=0.1; oc.panSpeed=0.1; return oc;
	}

	getDefaultCamera()
	{
		var rc=new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000000);
		rc.position.set(this.pp.xExtent[1]*1.4, this.maxY*1.3, this.pp.xExtent[1]*2); return rc;
	}

	static disposeNode(node)
	{
		if (node instanceof THREE.Mesh)
		{
			if (node.geometry) node.geometry.dispose ();
			if (node.material)
			{
				if (node.material instanceof THREE.MeshFaceMaterial || node.material instanceof THREE.MultiMaterial)
				{
					$.each (node.material.materials, function (idx, mtrl) {
						if (mtrl.map)           mtrl.map.dispose ();
						if (mtrl.lightMap)      mtrl.lightMap.dispose ();
						if (mtrl.bumpMap)       mtrl.bumpMap.dispose ();
						if (mtrl.normalMap)     mtrl.normalMap.dispose ();
						if (mtrl.specularMap)   mtrl.specularMap.dispose ();
						if (mtrl.envMap)        mtrl.envMap.dispose ();
						mtrl.dispose ();    // disposes any programs associated with the material
					});
				}
				else
				{
					if (node.material.map)          node.material.map.dispose ();
					if (node.material.lightMap)     node.material.lightMap.dispose ();
					if (node.material.bumpMap)      node.material.bumpMap.dispose ();
					if (node.material.normalMap)    node.material.normalMap.dispose ();
					if (node.material.specularMap)  node.material.specularMap.dispose ();
					if (node.material.envMap)       node.material.envMap.dispose ();
					node.material.dispose ();   // disposes any programs associated with the material
				}
			}
		}
		node.parent.remove(node);
	}   // disposeNode

	static intDispose(node,callback)
	{
		for (var i=node.children.length-1;i>=0;i--)
			{ var child=node.children[i]; ThreeDPlot.intDispose(child,callback); callback (child); }
	}

	static dispose(scene) { if (scene) ThreeDPlot.intDispose(scene,ThreeDPlot.disposeNode); }
}
