(function(){
	var attrArray = ['POP_2010', 'POP_2011', 'POP_2012', 'POP_2013', 'POP_2014','POP_2015', 'POP_2016', 'POP_2017', 'POP_2018'];
	var expressed = attrArray[0];
	
	var chartWidth = window.innerWidth * 0.5,
    chartHeight = 473,
    leftPadding = 50,
    rightPadding = 20,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
	
	var yScale = d3.scaleLinear()
        .range([463, 0])
        .domain([0, 40000000]);

window.onload = setMap();

function setMap() {
	//map frame dimensions
    var width = window.innerWidth * 0.425,
        height = 460;

    //create new svg container for the map
    var map = d3.select(".d3Tags")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on France
	var projection = d3.geoAlbersUsa() 
		.scale(960)
        .translate([width/2, height/2]);
	
	var path = d3.geoPath()
		.projection(projection);
	
	d3.queue()
		.defer(d3.csv, "data/StateBounds.csv")
		.defer(d3.json, "data/USAPOP.json")
		.await(callback)
		
	function callback(error, csvData, usa){
		
		setGraticule(map, path);
		
		var usaStates = topojson.feature(usa, usa.objects.USAPOP),
			usaPops = topojson.feature(usa, usa.objects.USAPOP).features;
		
		var pops = map.append("path")
			.datum(usaStates)
			.attr("class", "pops")
			.attr("d", path);
		
		usaPops = joinData(usaPops, csvData);

		var colorScale = makeColorScale(csvData);

		setEnumerationUnits(usaPops, map, path, colorScale);
		
		setChart(csvData, colorScale);
		
		createDropdown(csvData, colorScale);
	};
	
};

function setLabel(props){
    //label content
    var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + expressed.slice(4,8) + "</b>";
		
	
    //create info label div
    var infolabel = d3.select(".d3Tags")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.Id + "_label")
        .html(labelAttribute);

    var stateName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.Geography);
};

function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1; 

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};

function highlight(props){
	
	setLabel(props);
	
	var selected = d3.selectAll("." + props.Id)
		.style("stroke", "blue")
		.style("stroke-width", "2");
};

function dehighlight(props){
    var selected = d3.selectAll("." + props.Id)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };
	d3.select(".infolabel")
		.remove();
};

function createDropdown(csvData, colorScale){
    //add select element
    var dropdown = d3.select(".d3Tags")
        .append("select")
        .attr("class", "dropdown")
		.on("change", function(){
			changeAttribute(this.value, csvData)
		});
		
	function changeAttribute(attribute, csvData){
		
		expressed = attribute;
		
		var colorScale = makeColorScale(csvData);
		
		var states = d3.selectAll(".states")
			.transition()
			.duration(1000)
			.style("fill", function(d){
				return choropleth(d.properties, colorScale)
			});
			
		var bars = d3.selectAll(".bar")
			//re-sort bars
			.sort(function(a, b){
				return b[expressed] - a[expressed];
			})
			.transition()
			.delay(function(d, i){
				return i * 20
			})
			.duration(500);
		updateChart(bars, csvData.length, colorScale);
	};
	
    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d.slice(4,8) });
};

function updateChart(bars, n, colorScale){
    //position bars
    bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        //size/resize bars
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
	var chartTitle = d3.select(".chartTitle")
		.text("Population of each state in "+ String(expressed).slice(4,8));
};

function setChart(csvData, colorScale){
    //chart frame dimensions
	console.log(window.innerWidth);
    var chartWidth = (window.innerWidth * 0.5),
		chartHeight = 473,
		leftPadding = 50,
		rightPadding = 20,
		topBottomPadding = 5,
		chartInnerWidth = chartWidth - leftPadding - rightPadding,
		chartInnerHeight = chartHeight - topBottomPadding *2 ,
		translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a second svg element to hold the bar chart
    var chart = d3.select(".d3Tags")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");
	
	var chartBackground = chart.append("rect")
		.attr("class", "chartBackground")
		.attr("width", chartInnerWidth)
		.attr("height", chartInnerHeight)
		.attr("transform", translate);
	
	var yScale = d3.scaleLinear()
        .range([463, 0])
        .domain([0, 40000000]);
	
	var bars = chart.selectAll(".bars")
        .data(csvData)
        .enter()
        .append("rect")
		.sort(function(a, b){
			return a[expressed]-b[expressed]
		})
        .attr("class", function(d){
            return "bar " + d.Id;
        })
        .attr("width", chartWidth / csvData.length - 1)
        .on("mouseover", highlight)
		.on("mouseout", dehighlight)
		.on("mousemove", moveLabel);
		
	var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');
		
	var chartTitle = chart.append("text")
		.attr("x", 80)
		.attr("y", 40)
		.attr("class", "chartTitle")
		.text("Population of each state in "+ String(expressed).slice(4,8));
		
	var yAxis = d3.axisLeft(yScale);
		
	var axis = chart.append("g")
		.attr("class", "axis")
		.attr("transform", translate)
		.call(yAxis);
			
	var chartFrame = chart.append("rect")
		.attr("class", "chartFrame")
		.attr("width", chartInnerWidth)
		.attr("height", chartInnerHeight)
		.attr("transform", translate);
	updateChart(bars, csvData.length, colorScale);
		
};

function setGraticule(map,path){

	var graticule = d3.geoGraticule()
		.step([5,5]);

	var gratBackground = map.append("path")
		.datum(graticule.outline()) //bind graticule background
		.attr("class", "gratBackground") //assign class for styling
		.attr("d", path) //project graticule
	
	var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
		.data(graticule.lines()) //bind graticule lines to each element to be created
		.enter() //create an element for each datum
		.append("path") //append each element to the svg as a path element
		.attr("class", "gratLines") //assign class for styling
		.attr("d", path); //project graticule lines
	};

function joinData(usaPops, csvData){
	var attrArray = ['Pop_2010', 'Pop_2011', 'Pop_2012', 'Pop_2013', 'Pop_2014','Pop_2015', 'Pop_2016', 'Pop_2017', 'Pop_2018'];
		
		for (var i=0; i<csvData.length; i++){
			var csvRegion = csvData[i];
			var csvKey = csvRegion.Id;

		for (var a=0; a<usaPops.length; a++){

			var geoJsonProps = usaPops[a].properties;
			var geoJsonKey = geoJsonProps.Id;

			if(geoJsonKey == csvKey){

				attrArray.forEach(function(attr){
					var val = parseFloat(csvRegion[attr]);
					geoJsonProps[attr] = val;
				});
			};
		};
		return usaPops};
};
function setEnumerationUnits(usaPops, map, path, colorScale){
	
	var states = map.selectAll(".states")
			.data(usaPops)
			.enter()
			.append("path")
			.attr("class", function(d){
				return "states " + d.properties.Id; 
			})
			.attr("d", path)
			.style("fill", function(d){
				return choropleth(d.properties, colorScale);
			})
			.on("mouseover", function(d){
				highlight(d.properties);
			})
			.on("mouseout", function(d){
            dehighlight(d.properties);
			})
			.on("mousemove", moveLabel);
			
	var desc = states.append("desc")
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');
			
		};
function makeColorScale(data){
	
	var colorClasses = [
		"#E50500",
		"#C81C04",
		"#AB3308",
		"#8F4A0D",
		"#726211",
		"#557915",
		"#39901A",
		"#1CA71E",
		"#00BF23"
	];
	
	var colorScale = d3.scaleQuantile()
		.range(colorClasses);
	
	var domainArray = [];
	for (var i=0; i < data.length; i++){
		var val = parseFloat(data[i][expressed]);
		domainArray.push(val);
	};

	//cluster data using ckmeans clustering algorithm to create natural breaks
    var clusters = ss.ckmeans(domainArray, 5);
    //reset domain array to cluster minimums
    domainArray = clusters.map(function(d){
        return d3.min(d);
    });
    //remove first value from domain array to create class breakpoints
    domainArray.shift();

	colorScale.domain(domainArray);

	return colorScale;
  };
  function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};

})();