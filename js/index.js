//JS page for rendering custom mapping using GMAPS API V3

//Get variables from URL
var queryString = window.location.search;
var urlParams = new URLSearchParams(queryString);
var username = urlParams.get('user');


//Global variables
var source, destination;
var directionsDisplay;
var routePolyline = null;
var infowindow = new google.maps.InfoWindow();
var directionsService = new google.maps.DirectionsService();

//On page load, initialize google places search boxes...
//google.maps.event.addDomListener(window, 'load', function () {
//    new google.maps.places.SearchBox(document.getElementById('txtSource'));
//    new google.maps.places.SearchBox(document.getElementById('txtDestination'));
//    directionsDisplay = new google.maps.DirectionsRenderer({ 'draggable': true });
//});

function loadMap(){
	
	//On page load, initialize google places api search boxes...
	new google.maps.places.SearchBox(document.getElementById('txtSource'));
    new google.maps.places.SearchBox(document.getElementById('txtDestination'));
	
	//Initialize direction with options...
    directionsDisplay = new google.maps.DirectionsRenderer({
		polylineOptions:({
			strokeColor: 'green',
			strokeOpacity: 1,
			strokeWeight: 4,
		}),
		suppressPolylines: false,
		infoWindow: infowindow,
		'draggable': true 
		
	});
	
	//Polyline for current route marker reference...
	routePolyline = new google.maps.Polyline({
		path: [],
		strokeColor: 'blue',
		strokeOpacity: 1,
		strokeWeight: 4
	});
	
	//Initialize map with selected options...
    map = new google.maps.Map(document.getElementById('dvMap'),{
		zoom: 7,
		center: {
			lat: 39.50,
			lng: -98.35 
		}
	});
	
	//Display username if available...
	if(username){
		var currentUser = document.getElementById("currentUser");
		currentUser.innerHTML = "";
		currentUser.innerHTML += "Current User: <b>" + username + "</b>";
	};
};



//Begin routing functionality...
function GetRoute() {
    directionsDisplay.setMap(map);
    directionsDisplay.setPanel(document.getElementById('dvPanel'));
 
    //*********DIRECTIONS AND ROUTE**********************//
    source = document.getElementById("txtSource").value;
    destination = document.getElementById("txtDestination").value;
	
	if(!source || !destination){
		window.alert("Please enter valid origin and destination...");
	}else{
 
		var request = {
			origin: source,
			destination: destination,
			travelMode: google.maps.TravelMode.DRIVING
		};
		directionsService.route(request, function (response, status) {
			if (status == google.maps.DirectionsStatus.OK) {
				directionsDisplay.setDirections(response);
				
				//Create polyline from route...
				var bounds = new google.maps.LatLngBounds();

				var legs = response.routes[0].legs;
				for (i = 0; i < legs.length; i++) {
					var steps = legs[i].steps;
					for (j = 0; j < steps.length; j++) {
					  var nextSegment = steps[j].path;
					  for (k = 0; k < nextSegment.length; k++) {
						routePolyline.getPath().push(nextSegment[k]);
						bounds.extend(nextSegment[k]);
					  }
					}
				}

				routePolyline.setMap(map);
			}else{
				window.alert('Directions request failed due to ' + status);
			}
		});
	 
		//*********DISTANCE AND DURATION**********************//
		var service = new google.maps.DistanceMatrixService();
		service.getDistanceMatrix({
			origins: [source],
			destinations: [destination],
			travelMode: google.maps.TravelMode.DRIVING,
			unitSystem: google.maps.UnitSystem.IMPERIAL,
			avoidHighways: false,
			avoidTolls: false
		}, function (response, status) {
			if (status == google.maps.DistanceMatrixStatus.OK && response.rows[0].elements[0].status != "ZERO_RESULTS") {
				var distance = response.rows[0].elements[0].distance.text;
				var duration = response.rows[0].elements[0].duration.text;
				var dvDistance = document.getElementById("dvDistance");
			   dvDistance.innerHTML = "";
				dvDistance.innerHTML += "Distance: " + distance + "<br />";
				dvDistance.innerHTML += "Duration:" + duration;
	 
			} else {
				alert("Unable to find the distance via road.");
			}
		});
	};
};





//Parse station markers on routeline...
var stationsOnRouteline = [];

function parseStationMarkers() {
	$.ajax({
		type: "GET",
		async: true,
		url: "../data.xml?" + Math.random(),
		dataType: "xml",
		success:
		function (xml) {
			
			var stations = xml.documentElement.getElementsByTagName('*');

			//Populate stationsOnRouteline array...
			for (var i = 0; i < stations.length; i++) {
				
				//Create lat/lng for reference checking...
				var latLng = new google.maps.LatLng(stations[i].getAttribute('lat'), stations[i].getAttribute('lng'));
				
				//If location is on routeline, create and display marker...
				if (google.maps.geometry.poly.isLocationOnEdge(latLng, routePolyline, 0.01)) {
					
					//Create necessary variables to be used in marker/infowindow creation...
					var station_info = stations[i].getAttribute('station_info');
					var price = stations[i].getAttribute('price');
					var contentString = "<div style = 'width:200px;min-height:40px'> Station: " + station_info + "<br> Price: " + price + "<br></div>";
				
					//Alert for testing
					alert("Location found: " + station_info);
				
					//Create marker with data for each entity...
					var marker = new google.maps.Marker({
						map: map,
						position:  latLng,
						//label: price,
						clickable: true,
						visible: true,
						content: contentString 
					});
				
					//Lisener for each marker click...
					google.maps.event.addListener(marker, 'click', function() { 
						infowindow.setContent(this.content); 
						infowindow.open(map, this);
					});  

					//Add marker to array...
					stationsOnRouteline.push(marker);
					
					//Log array for debugging...
					console.log(stationsOnRouteline);
				}
			}
			alert("Parse Complete");
		}
	})
};


//Listener that draws the map on page load
google.maps.event.addDomListener(window, "load", loadMap);
