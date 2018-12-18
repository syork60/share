class ElbowTubes2
{		//Note: tube size is fixed width here, because the dependency on the radial gradient <def> elements.
	constructor(g,width,height)
	{
		this.g=g; this.width=width; this.height=height; this.mouseOver=null; this.mouseMove=null; this.mouseOut=null;
	}
	sm(elem,tubeNum,segNum)
	{
		let sn=segNum-tubeNum*10;
		if (this.mouseOver) elem.node().addEventListener("mouseover",()=>this.mouseOver(tubeNum,sn));
		if (this.mouseMove) elem.node().addEventListener("mousemove",()=>this.mouseMove(tubeNum,sn));
		if (this.mouseOut) elem.node().addEventListener("mouseout",()=>this.mouseOut(tubeNum,sn));
	}
	dv(tubeNum,segNum,start,stop,color)
	{
		if (start<0) start=0; if (stop>0.4) stop=0.4; if (stop<start) stop=start;
		let vs=d3.scaleLinear().domain([0,0.4]).range([0,this.height-40]);
		this.g.selectAll('.vert'+segNum).data([tubeNum]).enter().append('rect').attr('class','vert'+segNum)
			.attr('fill',d=>'url(#'+color+'Vert)').attr('x',d=>30-d*15).attr('y',vs(start))
			.attr("width",11).attr("height",vs(stop)-vs(start)).call(e=>this.sm(e,tubeNum,segNum));
	}
	dh(tubeNum,segNum,start,stop,color)
	{
		if (start<0.5) start=0.5; if (stop>1) stop=1; if (stop<start) stop=start;
		let vs=d3.scaleLinear().domain([0.5,1]).range([0,this.width-39]);
		this.g.selectAll('.horz'+segNum).data([tubeNum]).enter().append('rect').attr('class','horz'+segNum)
			.attr('fill',d=>'url(#'+color+'Horz)').attr('x',41+vs(start)).attr('y',d=>(this.height-40)+d*15)
			.attr("width",vs(stop)-vs(start)).attr("height",11).call(e=>this.sm(e,tubeNum,segNum));
	}
	da(tubeNum,segNum,start,stop,color)
	{
		if (start<0.4) start=0.4; if (stop>0.5) stop=0.5; if (stop<start) stop=start;
		let vs=d3.scaleLinear().domain([0.4,0.5]).range([3*Math.PI/2,Math.PI]);
		let arc=d3.arc().innerRadius(d=>d*15).outerRadius(d=>d*15+11).startAngle(vs(start)).endAngle(vs(stop));
		this.g.selectAll('.arc'+segNum).data([tubeNum]).enter().append('path').attr('transform','translate(41,'+(this.height-40)+')')
			.attr('class','arc'+segNum).attr('fill',d=>'url(#arc'+d+color+')').attr('d',arc).call(e=>this.sm(e,tubeNum,segNum));
	}
	dt2(tubeNum,segNum,start,stop,color)
	{
		if (start<0.4)
		{
			let s2=Math.min(0.4,stop); this.dv(tubeNum,segNum,start,s2,color);
			if (stop>0.4) { s2=Math.min(0.5,stop); this.da(tubeNum,segNum,0.4,s2,color); }
			if (stop>0.5) this.dh(tubeNum,segNum,0.5,stop,color);
		}
		else if (start<0.5)
		{
			let s2=Math.min(0.5,stop); this.da(tubeNum,segNum,start,s2,color);
			if (stop>0.5) this.dh(tubeNum,segNum,0.5,stop,color);
		}
		else this.dh(tubeNum,segNum,start,stop,color);
	}
		//tubeNum is 1- inner, 2 - outer,  stop values are 0 => x => 1, segments are array of {color,stop}.
	drawTube(tubeNum,segments)
	{
		if (tubeNum<1 || tubeNum>2) throw "Invalid tube number!";
		let start=0,num=tubeNum*10; segments.forEach(s=>{ this.dt2(tubeNum,++num,start,s.stop,s.color); start=s.stop; });
		if (start<1) this.dt2(tubeNum,++num,start,1,'Black');
	}
	getClientRect()	//Gets useable area inside of pipes.
	{
		let td=2,l=td*15,b=td*15;
		return {left:l,top:0,width:this.width-l,height:this.height-b};
	}
	fullDraw(data1,data2,drawClient)	//Convenience method.
		{ this.drawTube(1,data1); this.drawTube(2,data2); drawClient(this.g,this.getClientRect()); }
}
