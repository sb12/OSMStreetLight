L.GeoLocation = L.extend({
  
	centerMapOnPosition: function (map, zoom) { 
/** Look up location via IP address **/
		var url = "https://api.ipbase.com/v1/json/";
			
		$.ajax({
			url: url,
			type: 'GET',
			dataType: 'json',
			crossDomain: true,
			success: function(data){
				//console.log(data);
				var geoip_response = data;
				var position = L.latLng(0, 0);
				position.lat = geoip_response.latitude;
				position.lng = geoip_response.longitude;
				map.setView(position, zoom);
			},
			error: function(jqXHR, textStatus, errorThrown){
				console.log("Leaflet.GeoIP.getPosition failed because its XMLHttpRequest got this response: " + textStatus);
			},
			timeout: 1000 // timeout after 1s
		});
	},
});
