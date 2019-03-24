(function(){
	var attrArray = ['Pop_2010', 'Pop_2011', 'Pop_2012', 'Pop_2013', 'Pop_2014','Pop_2015', 'Pop_2016', 'Pop_2017', 'Pop_2018'];
	var expressed = attrArray[0]
	;
window.onload = setMap();

function setMap() {
	//map frame dimensions
    var width = 950,
        height = 500;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on France
	var projection = d3.geoAlbersUsa() 
		.scale(1040)
        .translate([width/2, height/2]);
	
	var path = d3.geoPath()
		.projection(projection);
	
	d3.queue()
		.defer(d3.csv, "data/StateBounds.Csv")
		.defer(d3.json, "data/USAPOP.json")
		.await(callback)
		
	function callback(error, csvData, usa){
		
		setGraticule(map, path);

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
            .attr("d", path); //project graticule lines*/
		
		var usaStates = topojson.feature(usa, usa.objects.USAPOP),
			usaPops = topojson.feature(usa, usa.objects.USAPOP).features;
		
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
	};
		console.log(csvData);
		console.log(error);
		console.log(usa);
		console.log(usaStates);
		console.log(usaPops);
		
		var pops = map.append("path")
			.datum(usaStates)
			.attr("class", "pops")
			.attr("d", path);
		var states = map.selectAll(".states")
			.data(usaPops)
			.enter()
			.append("path")
			.attr("class", function(d){
				return "states " + d.properties.NAME; //d.properties.adm1_code; 
			})
			.attr("d", path);
		usaPops = joinData(usaPops, csvData);

		setEnumerationUnits(usaPops, map, path);
	};
	

	
  
}})();