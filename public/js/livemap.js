$(document).ready(function(){

	var bgUrl = 'http://{s}.www.toolserver.org/tiles/bw-mapnik/{z}/{x}/{y}.png';
	var bgAttribution = '<a href="http://www.schienenliebe.de">Schinenliebe.de</a>, Map data &copy; 2013 OpenStreetMap contributors';
	var bg = new 	L.TileLayer(
		bgUrl, {
		maxZoom : 18,
		attribution : bgAttribution
	});

	var map = new L.Map('map', {
		center : new L.LatLng(50.937531,6.960279),
		zoom : 13,
		layers : [ bg ],
		zoomControl : true
	});

	var StationIcon = L.Icon.extend({options:{
	    iconUrl: 'images/station_22x22.png',
	    shadowUrl: null,
	    shadowSize: new L.Point(0,0),
	    iconSize: new L.Point(22, 22),
	    iconAnchor: new L.Point(11, 11),
	    popupAnchor: new L.Point(0,-9)
	}});

	var BusIcon = L.Icon.extend({options:{
	    iconUrl: 'images/bus.png',
	    shadowUrl: null,
	    shadowSize: new L.Point(0,0),
	    iconSize: new L.Point(32, 37),
	    iconAnchor: new L.Point(16, 37),
	    popupAnchor: new L.Point(-16,-18)
	}});
	
	var TramIcon = L.Icon.extend({options:{
	    iconUrl: 'images/tramway.png',
	    shadowUrl: null,
	    shadowSize: new L.Point(0,0),
	    iconSize: new L.Point(32, 37),
	    iconAnchor: new L.Point(16, 37),
	    popupAnchor: new L.Point(0,-18)
	}});
	
	var hIcon = new StationIcon();
	var bIcon = new BusIcon();
	var tIcon = new TramIcon();
	
	
	var nulls = function(i) {
		return (i < 10) ? i = '0' + i : i;
	};

	var getOffset = function(d) {
		/* summertime for germany, 2011 */
		if ((d.getUTCMonth() == 3 && d.getUTCDate() >= 27) ||
			(d.getUTCMonth() == 10 && d.getUTCDate() <= 30) || 
			(d.getUTCMonth() > 3 && d.getUTCMonth() < 10))
		    return 2;
		else 
		    return 1;
	}

	window.setInterval(function() {		
		var d = new Date();
		var offset = getOffset(d);

		var hrs = nulls((d.getUTCHours() + offset) % 24);
		var mins = nulls(d.getUTCMinutes());
		var secs = nulls(d.getUTCSeconds());

		$("#clock").html(hrs + ':' + mins + ':' + secs);
	}, 1000);


	/* is it a service free period= */
	var d = new Date();
	var offset = getOffset(d);
	if (
		(((d.getUTCHours() + offset) % 24) >= 23 && d.getUTCMinutes() > 30) || 
		(((d.getUTCHours() + offset) % 24)) < 6){
		$("#warning").show();
	}	
	
	var stopsLayer;
	var shapeLayers = {};
	var trips = {};
	
	$.ajax({
	  url: '/data/trips',
		  success: function(data) {
		  	trips = data;		  
		}

	});
	
	$.ajax({
	  url: '/data/stops',
		  success: function(data) {

			  L.geoJson(data, {
					pointToLayer: function(f, latlng) { return new L.Marker(latlng, {icon : hIcon }).bindPopup('<b>'+f.properties.stop_name+'</b><br>'+f.properties.stop_longname); }
			  }).addTo(map);  
		  }
	});	

	$.ajax({
	  url: '/data/shapes',
		  success: function(data) {
		  
		  
		  	for(var i in data){
			  	if (data.hasOwnProperty(i)) {

			  		L.geoJson(data[i], {
						
					  
				  }).addTo(map); 
			  	}
		  	}
		}

	});
	

	
	var socket = io.connect('/');

	var knownTrips = {};

	
	var delayedMoveMarker = function(delay, trip, lat, lon){
		var marker = knownTrips[trip];
		setTimeout(function(){
			if(lat === 0 && lon === 0){
				map.removeLayer(marker);
				delete knownTrips[trip];
			}
			else{
				marker.setLatLng(new L.LatLng(lat, lon));
			}
		},delay);
	};


	/* event simulator, throws an event every 10 secs. */
	socket.on('event', function (data) {
		for(var trip in data){
			if(data.hasOwnProperty(trip)){
				var newMarker = false;
				if(!knownTrips[trip]){
					var popup;
					var markerIcon = bIcon;
					if(trips && trips[trip]){
						popup = "<b>"+trips[trip].route_short_name+" – "+trips[trip].trip_headsign+"</b><br>"+trips[trip].route_long_name+"<br><i>"+trip+"</i>";
						//bus or tram?
						markerIcon = (trips[trip].route_type == "0" ? tIcon : bIcon);
					}
					else{
						console.dir(trips);
					}
					knownTrips[trip] = new L.Marker(new L.LatLng(data[trip][0][1], data[trip][0][0]), {icon : markerIcon});
					knownTrips[trip].bindPopup(popup || trip);
					newMarker = true;
				}	
				for(var i = 0;i<data[trip].length;i++){
					delayedMoveMarker(1000*i, trip, data[trip][i][1], data[trip][i][0]);
				}
				if(newMarker){
					map.addLayer(knownTrips[trip]);	
				}				
			}
		}
	});
		
});




