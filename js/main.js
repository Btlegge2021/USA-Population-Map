(function(){
	var attrArray = ['POP_2010', 'POP_2011', 'POP_2012', 'POP_2013', 'POP_2014','POP_2015', 'POP_2016', 'POP_2017', 'POP_2018'];
	var expressed = attrArray[0]
	;
window.onload = setMap();

function setMap() {
	//map frame dimensions
    var width = window.innerWidth * 0.5,
        height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on France
	var projection = d3.geoAlbersUsa() 
		.scale(1010)
        .translate([width/2, height/2]);
	
	var path = d3.geoPath()
		.projection(projection);
	
	d3.queue()
		.defer(d3.csv, "data/StateBounds.Csv")
		.defer(d3.json, "data/USAPOP.json")
		.await(callback)
		
	function callback(error, csvData, usa){
		
		setGraticule(map, path);
		
		var usaStates = topojson.feature(usa, usa.objects.USAPOP),
			usaPops = topojson.feature(usa, usa.objects.USAPOP).features;
		
		
		console.log(csvData);
		console.log(error);
		console.log(usa);
		console.log(usaStates);
		console.log(usaPops);
		
		var pops = map.append("path")
			.datum(usaStates)
			.attr("class", "pops")
			.attr("d", path);
		
		usaPops = joinData(usaPops, csvData);

		var colorScale = makeColorScale(csvData);

		setEnumerationUnits(usaPops, map, path, colorScale);
		
		setChart(csvData, colorScale);
	};
};

function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 460;

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");
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
			var csvKey = csvRegion.Geography;

		for (var a=0; a<usaPops.length; a++){

			var geoJsonProps = usaPops[a].properties;
			var geoJsonKey = geoJsonProps.NAME;

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
				return "states " + d.properties.NAME; 
			})
			.attr("d", path)
			.style("fill", function(d){
				console.log(colorScale(d.properties[expressed]));
				console.log(d.properties[expressed]);
				return choropleth(d.properties, colorScale);
			});
		};
function makeColorScale(data){
	/*var colorClasses = [
		"#D4B9DA",
        "#C994C7",
        "#DF65B0",
        "#DD1C77",
        "#980043",
		"#FAB9DF",
		
	];*/
	
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