//Finish - Check for mem leaks.
//Finish - first time camera position.

class MyTubes
{
	constructor(threeDPlotParams) { this.pp=threeDPlotParams; }

	drawShadow(scene,path,m4,shadowColor) {	//Currently, this is just the X-wall shadow.
		var geometry=new THREE.Geometry(); geometry.setFromPoints(path.getPoints(this.pp.data.length)); geometry.applyMatrix(m4);
		scene.add(new THREE.Line(geometry,new THREE.LineBasicMaterial({ color: shadowColor })));
	}

	drawTube(scene,scaleFactor,tubeColors,shadowColor) {
		var yMax=this.pp.yExtent[1],q=this.pp.quadrant;
		var getVec=v=>{
			var d=yMax-v.TVD;
			if (q==2) return new THREE.Vector3(+v.North,d,+v.East); if (q==3) return new THREE.Vector3(-v.North,d,-v.East);
			if (q==1) return new THREE.Vector3(-v.East,d,+v.North); return new THREE.Vector3(+v.East,d,-v.North);
		};
		var cv=[]; $.each(this.pp.data,(i,v)=>cv.push(getVec(v)));
		var path=new THREE.CatmullRomCurve3(cv); cv=[];
		this.drawShadow(scene,path,new THREE.Matrix4().set(0,0,0,this.pp.xBack, 0,1,0,0, 0,0,1,0, 0,0,0,1),shadowColor);
		this.drawShadow(scene,path,new THREE.Matrix4().set(1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,1),shadowColor);
		this.drawShadow(scene,path,new THREE.Matrix4().set(1,0,0,0, 0,1,0,0, 0,0,0,this.pp.zBack, 0,0,0,1),shadowColor);

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
					var s="Mouse intersection<br>"+Math.round(v.point.x)+", "+Math.round(yMax-v.point.y)+", "+Math.round(v.point.z);
					if ($("#mouse-info").html()!=s) $("#mouse-info").html(s);
				}
			});
		}

		renderer.render(scene, camera);
	}

	function showIt(data) {
		var pp=new ThreeDPlotParams(data,{preferredDivisions:8});
		var mt=new MyTubes(pp);
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

	load(scene,"Sample1");  //This one is - -
	//load(scene,"Sample13");  //This one is + +
