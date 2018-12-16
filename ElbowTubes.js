class ElbowTubes
{		//Note: tube size is fixed width here, because the dependency on the radial gradient <def> elements.
	constructor(g,width,height) { this.g=g; this.width=width; this.height=height; }
	dv(tubeNum,segNum,start,stop,color)
	{
		if (start<0) start=0; if (stop>0.4) stop=0.4; if (stop<start) stop=start;
		let vs=d3.scaleLinear().domain([0,0.4]).range([0,this.height-55]);
		this.g.selectAll('.vert'+segNum).data([tubeNum]).enter().append('rect').attr('class','vert'+segNum)
			.attr('fill',d=>'url(#'+color+'Vert)').attr('x',d=>45-d*15).attr('y',vs(start))
			.attr("width",11).attr("height",vs(stop)-vs(start));
	}
	dh(tubeNum,segNum,start,stop,color)
	{
		if (start<0.5) start=0.5; if (stop>1) stop=1; if (stop<start) stop=start;
		let vs=d3.scaleLinear().domain([0.5,1]).range([0,this.width-54]);
		this.g.selectAll('.horz'+segNum).data([tubeNum]).enter().append('rect').attr('class','horz'+segNum)
			.attr('fill',d=>'url(#'+color+'Horz)').attr('x',55+vs(start)).attr('y',d=>(this.height-55)+d*15)
			.attr("width",vs(stop)-vs(start)).attr("height",11);
	}
	da(tubeNum,segNum,start,stop,color)
	{
		if (start<0.4) start=0.4; if (stop>0.5) stop=0.5; if (stop<start) stop=start;
		let vs=d3.scaleLinear().domain([0.4,0.5]).range([3*Math.PI/2,Math.PI]);
		let arc=d3.arc().innerRadius(d=>d*15).outerRadius(d=>d*15+11).startAngle(vs(start)).endAngle(vs(stop));
		this.g.selectAll('.arc'+segNum).data([tubeNum]).enter().append('path').attr('transform','translate(56,'+(this.height-55)+')')
			.attr('class','arc'+segNum).attr('fill',d=>'url(#arc'+d+color+')').attr('d',arc);
	}
	ds2(tubeNum,segNum,start,stop,color)
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
		//tubeNum is 1- inner, 3 - outer,  stop values are 0 => x => 1, segments are array of {color,stop}.
	drawTube(tubeNum,segments)
	{
		let start=0,num=tubeNum*10; segments.forEach(s=>{ this.ds2(tubeNum,++num,start,s.stop,s.color); start=s.stop; });
		if (start<1) this.ds2(tubeNum,++num,start,1,'Black');
	}
	getClientRect(tubeNum=1)	//If only drawing 1 or 2 tubes, can specify.
	{
		let td=4-tubeNum,l=td*15,b=td*15;
		return {left:l,top:0,width:this.width-l,height:this.height-b};
	}
	fullDraw(data1,data2,data3,drawClient)
		{ this.drawTube(1,data1); this.drawTube(2,data2); this.drawTube(3,data3); drawClient(this.g,this.getClientRect()); }
}
