class ThreeDPlotParams
{
	constructor(data,parameters,quadrant)	//UL,UR,LL,LR.
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
		this.rus100=v=>Math.round(v/100)*100;
		this.ru100=ext=> { return [this.rus100(ext[0]),0-this.rus100(0-ext[1])]; };
		this.xExtent=this.ru100(d3.extent(data,d=>+d.East));
		this.yExtent=this.ru100(d3.extent(data,d=>+d.TVD));
		this.zExtent=this.ru100(d3.extent(data,d=>+d.North));
		var er=ext=>ext[1]-ext[0];
		var lc=Math.max(Math.max(er(this.xExtent),er(this.yExtent)),er(this.zExtent))/this.preferredDivisions;
		this.divSize=this.rus100(lc); this.quadrant=quadrant;
		var fixExt=ext=>{
			if(ext[0]>=0) ext[0]=-100; if (ext[1]<=0) ext[1]=100;
			while((ext[0]%this.divSize)<0) ext[0]-=100; while((ext[1]%this.divSize)>0) ext[1]+=100; return ext;
		};
		this.xExtent=fixExt(this.xExtent); this.yExtent=fixExt(this.yExtent); this.zExtent=fixExt(this.zExtent); this.yExtent[0]=0;
		if (quadrant==1) { this.xPlaneName="0° (North)"; this.zPlaneName="270° (West)"; }
		else if (quadrant==2) { this.xPlaneName="90° (East)"; this.zPlaneName="0° (North)"; }
		else if (quadrant==3) { this.xPlaneName="270° (West)"; this.zPlaneName="180° (South)"; }
		else if (quadrant==4) { this.xPlaneName="180° (South)"; this.zPlaneName="90° (East)"; }
		else throw "Invalid quadrant!";
		var f=this.quadrant==1 || this.quadrant==3;
		this.xBack=f?this.xExtent[1]:this.xExtent[0]; this.xFront=f?this.xExtent[0]:this.xExtent[1];
		f=this.quadrant==3 || this.quadrant==4;
		this.zBack=f?0-this.zExtent[1]:this.zExtent[0]; this.zFront=f?0-this.zExtent[0]:this.zExtent[1];
	}
}

class ThreeDPlot
{
	constructor(threeDPlotParams)
	{
//Finish - these max values are bad.  Need to use front/back.
		this.pp=threeDPlotParams; this.maxX=this.pp.xExtent[1]; this.maxY=this.pp.yExtent[1]; this.maxZ=this.pp.zExtent[1];
		var er=ext=>ext[1]-ext[0];
		this.scaleFactor=Math.max(Math.max(er(this.pp.xExtent),er(this.pp.yExtent)),er(this.pp.zExtent))/100;
	}

	drawOne(scene,material,vtx) { var lg=new THREE.LineGeometry(); lg.setPositions(vtx); scene.add(new THREE.Line2(lg,material)); }
	drawXAndY(scene,material,val) { this.drawOne(scene,material,[val,this.pp.yExtent[1],this.pp.zBack,val,0,this.pp.zBack,val,0,this.pp.zFront]); }
	drawZAndY(scene,material,val) { this.drawOne(scene,material,[this.pp.xBack,this.pp.yExtent[1],val,this.pp.xBack,0,val,this.pp.xFront,0,val]); }
	drawXAndZ(scene,material,val) { this.drawOne(scene,material,[this.pp.xBack,val,this.pp.zFront,this.pp.xBack,val,this.pp.zBack,this.pp.xFront,val,this.pp.zBack]); }

	drawWalls(scene,lineMaterialOptions) {
		var material=new THREE.LineMaterial(lineMaterialOptions),ds=this.pp.divSize;
		if (this.pp.xBack>this.pp.xFront) for(var i=this.pp.xBack;i>this.pp.xFront;i-=ds) this.drawXAndY(scene,material,i);
		else for(var i=this.pp.xBack;i<this.pp.xFront;i+=ds) this.drawXAndY(scene,material,i);
		this.drawXAndY(scene,material,this.pp.xFront);
		if (this.pp.zBack<this.pp.zFront) for(var i=this.pp.zBack;i<this.pp.zFront;i+=ds) this.drawZAndY(scene,material,i);
		else for(var i=this.pp.zBack;i>this.pp.zFront;i-=ds) this.drawZAndY(scene,material,i);
		this.drawZAndY(scene,material,this.pp.zFront);
		for(var i=ds;i<this.pp.yExtent[1];i+=ds) this.drawXAndZ(scene,material,i); this.drawXAndZ(scene,material,this.pp.yExtent[1]);
	}

	highlightZeros(scene,lineMaterialOptions)
		{ var m=new THREE.LineMaterial(lineMaterialOptions); this.drawXAndY(scene,m,0); this.drawZAndY(scene,m,0); }

	applyDefaultLights(scene) {
		scene.add(new THREE.AmbientLight(0xffffff,2.5));
		var pla=(x,y,z)=>{ var pl=new THREE.PointLight(0xffffff,0.6,0,0); pl.position.set(x,y,z); scene.add(pl); };
			//8 lights - all 8 corners of the cube.
		pla(-this.maxX-200,this.maxY,this.maxZ+200); pla(-this.maxX-200,0,this.maxZ+200);
		pla(-this.pp.xExtent[0],this.maxY,this.maxZ+200); pla(-this.pp.xExtent[0],0,this.maxZ+200);
		pla(-this.maxX-200,this.maxY,this.pp.zExtent[0]); pla(-this.maxX-200,0,this.pp.zExtent[0]);
		pla(-this.pp.xExtent[0],this.maxY,this.pp.zExtent[0]); pla(-this.pp.xExtent[0],0,this.pp.zExtent[0]);

			//6 lights.
		//var Y=this.maxY/2; pla(-this.maxX-200,Y,this.maxZ+200); pla(200,Y,this.maxZ+200); pla(-this.maxX-200,Y,-200); pla(200,Y,-200);
		//pla(-this.maxX/2,this.maxY+200,this.maxZ/2); pla(-this.maxX/2,-200,this.maxZ/2);
	}

	drawScales(scene,textColor) {
		var self=this; var loader=new THREE.FontLoader();
		var url='https://syork60.github.io/share/gentilis_regular.typeface.json';
		loader.load(url, function (font) {
			var matDark=new THREE.LineBasicMaterial({ color: textColor, side: THREE.DoubleSide });
			var getTG=s=>new THREE.TextGeometry(s,{ font: font, size: self.scaleFactor*2.8, height: 1, curveSegments: 12, bevelEnabled: false});
			var getTGWidth=g=>{ g.computeBoundingBox(); return g.boundingBox.max.x; }
			var geometry=getTG(self.pp.zPlaneName),gWidth=getTGWidth(geometry);
			geometry.rotateY(-Math.PI/2); geometry.translate(self.pp.xBack,self.maxY+self.scaleFactor/2,(self.maxZ-gWidth)/2);
			scene.add(new THREE.Mesh(geometry, matDark));
			geometry=getTG(self.pp.xPlaneName); gWidth=getTGWidth(geometry);
//Finish - why do these two only use scaleFactor for the Y axis?      
			var tm=new THREE.Mesh(geometry,matDark); tm.position.x=-((self.pp.xBack-self.pp.xFront-gWidth)/2); tm.position.y=self.maxY+self.scaleFactor/2;
			tm.position.z=self.pp.zBack; scene.add(tm);
			var doScale=(v,tf)=> { geometry=getTG(""+v); tf(geometry); scene.add(new THREE.Mesh(geometry, matDark)); };
			var doX=v=>doScale(v,g=>{ g.rotateY(-Math.PI/2); g.rotateZ(-Math.PI/2); g.translate(-v+4,0,self.pp.zFront+4); });
			for(var i=self.pp.xBack-self.pp.divSize;i>self.pp.xFront;i-=self.pp.divSize) doX(-i); doX(-self.pp.xFront);
			var doY1=v=>doScale(v,g=>{ geometry.rotateY(-Math.PI/2); geometry.translate(self.pp.xBack,self.maxY-v,self.pp.zFront+4); });
			for(var i=self.maxY;i>0;i-=self.pp.divSize) doY1(i);
			var doY2=v=>doScale(v,g=>{ geometry.translate(self.pp.xFront-getTGWidth(geometry)-self.scaleFactor/2,self.maxY-v,self.pp.zBack); });
			for(var i=self.maxY;i>0;i-=self.pp.divSize) doY2(i);
			var doZ=v=>doScale(v,g=>{ geometry.rotateX(-Math.PI/2); geometry.translate(self.pp.xFront-getTGWidth(geometry)-self.scaleFactor/2,0,v); });
			for(var i=self.pp.zBack+self.pp.divSize;i<self.pp.zFront;i+=self.pp.divSize) doZ(i); doZ(self.pp.zFront);
		});
	}

	applyOrbitControls(camera,domElement)
	{
		var oc=new THREE.OrbitControls(camera,domElement); oc.target=new THREE.Vector3(-this.maxX/2,this.maxY/2,0);
		oc.screenSpacePanning=true; oc.enableDamping=true; oc.dampingFactor=0.08;
		oc.rotateSpeed=0.1; oc.panSpeed=0.1; return oc;
	}

	getDefaultCamera()
	{
		var rc=new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000000);
		rc.position.set(-this.maxX*1.4, this.maxY*1.3, this.maxX*2); return rc;
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

//Finish - handle quadrants properly
//Finish - Check for mem leaks.
//Finish - first time camera position.
//Finish - plane name position on short planes. (4).

class MyTubes
{
	constructor(threeDPlotParams) { this.pp=threeDPlotParams; }

		//Never got the Line2 working here.
	drawShadow(scene,path,m4,shadowColor) {	//Currently, this is just the X-wall shadow.
		var geometry=new THREE.Geometry(); geometry.setFromPoints(path.getPoints(this.pp.data.length)); geometry.applyMatrix(m4);
		scene.add(new THREE.Line(geometry,new THREE.LineBasicMaterial({ color: shadowColor })));
	}

	drawTube(scene,scaleFactor,tubeColors,shadowColor) {
		var cv=[],yMax=this.pp.yExtent[1]; $.each(this.pp.data,(i,v)=>cv.push(new THREE.Vector3(+v.East,yMax-v.TVD,-v.North)));
		var path=new THREE.CatmullRomCurve3(cv); cv=[];
		this.drawShadow(scene,path,new THREE.Matrix4().set(0,0,0,-this.pp.zBack, 0,1,0,0, 0,0,1,0, 0,0,0,1),shadowColor);
		this.drawShadow(scene,path,new THREE.Matrix4().set(1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,1),shadowColor);
		this.drawShadow(scene,path,new THREE.Matrix4().set(1,0,0,0, 0,1,0,0, 0,0,0,-this.pp.xBack, 0,0,0,1),shadowColor);

		var drawSegment=(points,dia,color,style)=>{
			if (points.length<2) return;
			var curve=new THREE.CurvePath(),pv=null; $.each(points,(i,v)=>{ if (pv) curve.add(new THREE.LineCurve3(pv,v)); pv=v; });
			var geometry=new THREE.TubeBufferGeometry(curve,points.length,dia*scaleFactor,32,false);
			var options=(style&1!=0)?{color: tubeColors[+color],roughness:0.5,metalness:0.8,opacity:0.1,transparent:true}:
				{color: tubeColors[+color],roughness:0.5,metalness:0.8};
			var material=new THREE.MeshStandardMaterial(options);
			var mesh=new THREE.Mesh(geometry,material); mesh.name="tube"; scene.add(mesh);
			var genCap=(p,pl)=>
			{
				var cg=new THREE.CircleGeometry(dia*scaleFactor,32);
				var v=new THREE.Vector3(p.x-pl.x,p.y-pl.y,p.z-pl.z); v.normalize(); cg.lookAt(v);
				cg.applyMatrix(new THREE.Matrix4().set(1,0,0,p.x, 0,1,0,p.y, 0,0,1,p.z, 0,0,0,1)); return cg;
			};
			scene.add(new THREE.Mesh(genCap(points[0],points[1]),material));
			var pe=points.length-1; scene.add(new THREE.Mesh(genCap(points[pe],points[pe-1]),material));
		};
		var prev=null,points=path.getPoints(this.pp.data.length),p2=[]; //If color or diameter changes, break it up.
		$.each(this.pp.data,(i,v)=>{
			if (prev && (prev.Dia!=v.Dia || prev.Color!=v.Color || prev.Style!=v.Style))
				{ drawSegment(p2,prev.Dia,prev.Color,prev.Style); p2=[]; p2.push(points[i-1]); }
			p2.push(points[i]); prev=v;
		});
		if (p2.length>0) { drawSegment(p2,prev.Dia,prev.Color,prev.Style); p2=[]; }
	}
}

//--------------------
	var raycaster=new THREE.Raycaster();
	var renderer=new THREE.WebGLRenderer({antialias:true});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth-20, window.innerHeight-20);

//Finish - got to pass in the dom element to append to.
	var v3d=$("#View3D");
	v3d.append(renderer.domElement);
	var scene,camera,controls;

	function onWindowResize() {
		renderer.setSize(v3d.innerWidth(),v3d.innerHeight());
	}

	var mouse=new THREE.Vector2();
	function onMouseMove(event) {
		event.preventDefault();
		mouse.x=(event.offsetX/v3d.innerWidth())*2-1;
		mouse.y=-(event.offsetY/v3d.innerHeight())*2+1;
	}

	function animate() {
		requestAnimationFrame(animate);
		controls.update();
		render();
	}

	var yMax=0;
	function render() {
		raycaster.setFromCamera(mouse,camera);
		var intersects=raycaster.intersectObjects(scene.children);
		if (intersects.length>0) {
			$.each(intersects,(i,v)=>{
				if (v.object.name=="tube")
				{
					var s="Mouse intersection<br>"+(0-Math.round(v.point.x))+", "+Math.round(yMax-v.point.y)+", "+Math.round(v.point.z);
					if ($("#mouse-info").html()!=s) $("#mouse-info").html(s);
				}
			});
		}

		renderer.render(scene, camera);
	}

	function showIt(data) {
		var pp=new ThreeDPlotParams(data,{preferredDivisions:8},3);
		var mt=new MyTubes(pp);
		//var pp=new ThreeDPlotParams(mt.xExtent,mt.yExtent,mt.zExtent,mt.divUnits,3);
		var tdv=new ThreeDPlot(pp);
		yMax=pp.yExtent[1];
		camera=tdv.getDefaultCamera();
		controls=tdv.applyOrbitControls(camera,renderer.domElement);
		scene=new THREE.Scene();
		scene.background=new THREE.Color(0xeffffff);
		tdv.applyDefaultLights(scene);
		tdv.drawWalls(scene,{color: 0x808080,linewidth: 0.001 });
		//tdv.drawWalls(scene,{color: 0xe0e0e0,linewidth: 0.002 });
		tdv.highlightZeros(scene,{color: 0x600000,linewidth: 0.0012 });
		tdv.drawScales(scene,0x4080a0);
		//var tubeColors=[0,0xce9481,0xd04040,0x81849e];
		var tubeColors=[0x404040,0x408040,0xd04040,0x408040];
		mt.drawTube(scene,tdv.scaleFactor,tubeColors,0x6060f0);
		animate();
	};

	function load(scene,name)
	{
		ThreeDPlot.dispose(scene);
//Finish - show a message on error.
		d3.tsv('https://syork60.github.io/share/'+name+".tsv").
			then(showIt).catch(err=>console.log(err));
	}

	function onSampleChange(scene) { load(scene,$("#samples").val()) }

	$("#View3D").mousemove(onMouseMove);
	window.addEventListener('resize',onWindowResize,false );
	$("#samples").change(()=>onSampleChange(scene));

	load(scene,"Sample1");
