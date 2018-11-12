//Finish - Check for mem leaks.
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

		renderer.render(scene,camera);
	}

	function showIt(data) {
		var pp=new ThreeDPlotParams(data,{preferredDivisions:8});
		var mt=new MyTubes(pp);
		var tdv=new ThreeDPlot(pp);
		yMax=pp.yExtent[1];
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

		camera=tdv.getDefaultCamera();
		var sf=tdv.scaleFactor*125;
		camera.position.set(sf,sf,sf);
		controls=tdv.applyOrbitControls(camera,renderer.domElement);
		if (pp.quadrant==2 || pp.quadrant==3)
			controls.target=new THREE.Vector3(pp.xFront/2,yMax/2,pp.zFront/2);
		else
			controls.target=new THREE.Vector3(pp.zFront/2,yMax/2,pp.xFront/2);

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
