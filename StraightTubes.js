class StraightTubes
{
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
	rng(v) { if (v<0) return 0; return (v>1)?1:v; }
	dv(tubeNum,segNum,start,stop,color,x)
	{
		start=this.rng(start); stop=this.rng(stop);
		let vs=d3.scaleLinear().domain([0,1]).range([0,this.height-10]),id='vert_'+tubeNum+'_'+segNum;
		this.g.selectAll('#'+id).data([tubeNum]).enter().append('rect').attr('id',id)
			.attr('fill',d=>'url(#'+color+'Vert)').attr('x',x).attr('y',vs(start))
			.attr("width",11).attr("height",vs(stop)-vs(start)).call(e=>this.sm(e,tubeNum,segNum));
	}
	dh(tubeNum,segNum,start,stop,color,y)
	{
		start=this.rng(start); stop=this.rng(stop);
		let vs=d3.scaleLinear().domain([0,1]).range([0,this.width-9]),id='horz_'+tubeNum+'_'+segNum;
		this.g.selectAll('#'+id).data([tubeNum]).enter().append('rect').attr('id',id)
			.attr('fill',d=>'url(#'+color+'Horz)').attr('x',41+vs(start)).attr('y',y)
			.attr("width",vs(stop)-vs(start)).attr("height",11).call(e=>this.sm(e,tubeNum,segNum));
	}

		//tubeNum is 3 to N,  stop values are 0 => x => 1, segments are array of {color,stop}.
		//Note: tubeNum is used for mouse event handling, and element IDs.
	drawHorzTube(tubeNum,y,segments)
	{
		if (tubeNum<3) throw "Invalid tube number!";
		let start=0,num=tubeNum*10; segments.forEach(s=>{ this.dh(tubeNum,++num,start,s.stop,s.color,y); start=s.stop; });
		if (start<1) this.dh(tubeNum,++num,start,1,'Black',y);
	}
	drawVertTube(tubeNum,x,segments)
	{
		if (tubeNum<3) throw "Invalid tube number!";
		let start=0,num=tubeNum*10; segments.forEach(s=>{ this.dv(tubeNum,++num,start,s.stop,s.color,x); start=s.stop; });
		if (start<1) this.dv(tubeNum,++num,start,1,'Black',x);
	}
}
