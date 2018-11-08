

var MyTubes=function(data,parameters) {
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
	this.xExtent=this.ru100(d3.extent(data,d=>Math.abs(+d.East)));
	this.yExtent=this.ru100(d3.extent(data,d=>Math.abs(+d.TVD)));
	this.zExtent=this.ru100(d3.extent(data,d=>Math.abs(+d.North)));
	var er=ext=>ext[1]-ext[0];
	var lc=Math.max(Math.max(er(this.xExtent),er(this.yExtent)),er(this.zExtent))/this.preferredDivisions;
	this.divUnits=this.rus100(lc);
	var fixExt=ext=>{
	if(ext[0]>=0) ext[0]=-100; while((ext[0]%this.divUnits)<0) ext[0]-=100; while((ext[1]%this.divUnits)>0) ext[1]+=100; return ext; };
	this.xExtent=fixExt(this.xExtent); this.yExtent=fixExt(this.yExtent); this.zExtent=fixExt(this.zExtent); this.yExtent[0]=0;
		//Never got the Line2 working here.
	this.drawShadow=function(scene,path,m4,shadowColor) {	//Currently, this is just the X-wall shadow.
		geometry=new THREE.Geometry(); geometry.setFromPoints(path.getPoints(data.length)); geometry.applyMatrix(m4);
		scene.add(new THREE.Line(geometry,new THREE.LineBasicMaterial({ color: shadowColor })));
	}

	this.drawTube=function(scene,scaleFactor,tubeColors,shadowColor) {
		var cv=[],yMax=this.yExtent[1]; $.each(this.data,(i,v)=>cv.push(new THREE.Vector3(+v.East,yMax-v.TVD,-v.North)));
		var path=new THREE.CatmullRomCurve3(cv); cv=[];
		this.drawShadow(scene,path,new THREE.Matrix4().set(0,0,0,-this.zExtent[0], 0,1,0,0, 0,0,1,0, 0,0,0,1),shadowColor);
		this.drawShadow(scene,path,new THREE.Matrix4().set(1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,1),shadowColor);
		this.drawShadow(scene,path,new THREE.Matrix4().set(1,0,0,0, 0,1,0,0, 0,0,0,this.xExtent[0], 0,0,0,1),shadowColor);

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
		var mt=new MyTubes(data,{preferredDivisions:8});
		var tdv=new ThreeDPlot(mt.xExtent,mt.yExtent,mt.zExtent,mt.divUnits,"270° (East)","180° (South)");
		camera=tdv.getDefaultCamera();
		controls=tdv.applyOrbitControls(camera);
		scene=new THREE.Scene();
		scene.background=new THREE.Color( 0xeffffff );
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

	d3.tsv('https://syork60.github.io/share/GF_A20_5.tsv').then(showIt).catch(err=>console.log('Error: '+err));
