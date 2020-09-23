function Moveaufruf()
{
	coords = map.getBounds();
	lefttop = coords.getNorthWest();
	rightbottom = coords.getSouthEast();
	XMLLaden(lefttop.lat,lefttop.lng,rightbottom.lat,rightbottom.lng);
}

function XMLLaden(lat1,lon1,lat2,lon2)
{
	//Maximalen Zoom um karten ausschnitt nicht zu gross zu haben
	minzoom = 15;

	if (map.getZoom()>=minzoom)
	{
		$('#zoomwarnung').hide(0.4);
		loadData('[bbox:'+lat2+','+lon1+','+lat1+','+lon2+ '];');
		OSM.setOpacity(opacityHigh);
		showStreetLights = true;
		$("#opacity_slider").slider("option", "value", opacityHigh*100);
	}
	else
	{
		//Zoom zu klein um anzuzeigen
		$('#zoomwarnung').show(1);
		showStreetLights = false;
		OSM.setOpacity(opacityLow);
		$("#opacity_slider").slider("option", "value", opacityLow*100);
		parseOSM(false);
		loadingcounter = 0;
	}
}

function loadData(bbox)
{
	$( "#loading" ).animate({
		color: "black",
		backgroundColor: "rgb( 255, 255, 255 )"},0).show().effect("highlight", {}, 700);
	loadingcounter++;

	//CrossoverAPI XML request
	// Street Light query
	XMLRequestText = bbox+'( node["highway"="street_lamp"]; node["light_source"];'

	today = new Date();
	if (today.getMonth() == 11) // show christmas trees only in December
	{
		XMLRequestText += 'node["xmas:feature"="tree"];'
	}
	XMLRequestText += '); out qt; ' +
		'(way["highway"][!area]["lit"="yes"]; >;); out skel qt; ' +
		'(way["highway"][area]["lit"="yes"]; >;); out qt; ';
	console.log ( XMLRequestText );

	//URL Codieren
	XMLRequestText = encodeURIComponent(XMLRequestText);

	RequestURL = "http://overpass-api.de/api/interpreter?data=" + XMLRequestText;
	//AJAX REQUEST

	$.ajax({
		url: RequestURL,
		type: 'GET',
		crossDomain: true,
		success: parseOSM,
		error: function(jqXHR, textStatus, errorThrown){
			$( "#loading" ).animate({
				color: "red",
				backgroundColor: "rgb( 255, 200, 200 )"
			});
			$( "#loading" ).fadeOut(1500);
			loadingcounter--;
		},
		timeout: 30000 // timeout after 30s
	});
}

function parseOSM(daten)
{
	//console.log(daten);
	MarkerArray = new Array();
	CoordObj = new Object();
	StreetLights.clearLayers();
	LitStreets.clearLayers();

	$(daten).find('node,way').each(function(){
		EleID = $(this).attr("id");

		EleCoordArray = new Array();

		//Knoten
		if ($(this).attr("lat"))
		{
			EleLat = $(this).attr("lat");
			EleLon = $(this).attr("lon");
			EleType = "node"
			EleObj = new Object();
			EleObj["lat"] = EleLat;
			EleObj["lon"] = EleLon;
			CoordObj[EleID] = EleObj;
		}


		//Weg
		else
		{
			EleType = "way";

			$(this).find('nd').each(function(){
				NdRefID = $(this).attr("ref");
				EleCoordArray.push([CoordObj[NdRefID]["lat"], CoordObj[NdRefID]["lon"]]);
			});

		}




		var EleText = "";
		var highway = "";
		var operator = "";
		var ref = "";
		var lamp_start_date = "";
		var lamp_start_date_text = "";
		var lamp_manufacturer = "";
		var lamp_model = "";
		var lamp_model_text = "";
		var lamp_height = "";
		var lamp_height_text = "";
		var lamp_width = "";
		var lamp_width_text = "";
		var light_colour = "";
		var light_count = 1;
		var light_direction = "";
		var light_height = "";
		var light_height_text = "";
		var light_lit = "";
		var light_lit_text = "";
		var light_shape = "";
		var light_method = "";
		var light_method_text = "";
		var light_mount = "";
		var light_mount_text = "";
		var light_source = "";
		var light_type = "";
		var xmas = "";
		var area = "";

		$(this).find('tag').each(function(){
			EleKey = $(this).attr("k");
			EleValue = $(this).attr("v");
			//EleText = EleText + "<b>" + EleKey + ": </b>" + EleValue + "<br/>";
			if ((EleKey=="highway"))
			{
				highway = EleValue;
			}
			if ((EleKey=="operator" || EleKey=="lamp_operator"))
			{
				operator = EleValue;
			}
			if ((EleKey=="ref" || EleKey=="lamp_ref"))
			{
				ref = EleValue;
			}
			if ((EleKey=="start_date"))
			{
				lamp_start_date = EleValue;
			}
			if ((EleKey=="manufacturer"))
			{
				lamp_manufacturer = EleValue;
			}
			if ((EleKey=="lamp_model:de" || EleKey=="model"))
			{
				lamp_model = EleValue;
			}
			if ((EleKey=="lamp_height:de" || EleKey=="height"))
			{
				lamp_height = EleValue;
			}
			if ((EleKey=="lamp_width:de" || EleKey=="width"))
			{
				lamp_width = EleValue;
			}
			if ((EleKey=="light:count"))
			{
				light_count = EleValue;
			}
			if ((EleKey=="light:colour"))
			{
				light_colour = EleValue;
			}
			if ((EleKey=="light:direction"))
			{
				light_direction = EleValue;
			}
			if ((EleKey=="light:height"))
			{
				light_height = EleValue;
			}
			if ((EleKey=="light:method" || EleKey=="lamp_type"))
			{
				light_method = EleValue;
			}
			if ((EleKey=="light:mount" || EleKey=="lamp_mount" || EleKey=="support"))
			{
				light_mount = EleValue;
			}
			if ((EleKey=="light:lit"))
			{
				light_lit = EleValue;
			}
			if ((EleKey=="light:shape"))
			{
				light_shape = EleValue;
			}
			if ((EleKey=="light_source"))
			{
				light_source = EleValue;
			}
			if ((EleKey=="xmas:feature"))
			{
				light_source = "xmas";
			}
			if ((EleKey=="area")) {
				area = EleValue
			}

		});

		if (highway == "street_lamp" && light_source == "") {
			light_source="lantern"
		}

		if (light_source != ""){

			if(light_source == "lantern")
			{
				light_type = i18next.t("lamp_lantern");
			}
			else if(light_source == "floodlight")
			{
				light_type = i18next.t("lamp_floodlight");
			}
			else
			{
				light_type = i18next.t("lamp_unknown");
			}

			if (operator=="") operator = "<i>"+i18next.t("unknown")+"</i>";

			//Dinge die nur angezeigt werden, wenn sie getaggt sind:

			if (lamp_start_date!="") lamp_start_date = "<tr><td><b>" + i18next.t("lamp_start_date") + ": </b></td><td>" + lamp_start_date + "</td></tr>";
			if (lamp_manufacturer!="") lamp_manufacturer = "<tr><td><b>" + i18next.t("lamp_manufacturer") + ": </b></td><td>" + lamp_manufacturer + "</td></tr>";
			if (lamp_model!="") lamp_model_text = "<tr><td><b>" + i18next.t("lamp_model") + ": </b></td><td>" + lamp_model + "</td></tr>";
			if (lamp_height!="") lamp_height_text = "<tr><td><b>" + i18next.t("lamp_height") + ": </b></td><td>" + lamp_height + " m</td></tr>";
			if (light_height!="") light_height_text = "<tr><td><b>" + i18next.t("lamp_light_height") + ": </b></td><td>" + light_height + " m</td></tr>";
			if (lamp_width!="") lamp_width_text = "<tr><td><b>" + i18next.t("lamp_width") + ": </b></td><td>" + lamp_width + "</td></tr>";
			if (light_method!="") light_method_text = "<tr><td><b>" + i18next.t("lamp_method") + ": </b></td><td>" + get_light_method(light_method) + "</td></tr>";
			if (light_mount!="") light_mount_text = "<tr><td><b>" + i18next.t("lamp_mount") + ": </b></td><td>" + get_light_mount(light_mount) + "</td></tr>";
			if (light_lit!="") light_lit_text = "<tr><td><b>" + i18next.t("lamp_time") + ": </b></td><td>" + get_light_lit(light_lit) + "</td></tr>";


			EleText =
				"<b>" + light_type + " " + ref + "</b><br>" +
				"<div class='infoblock'><table>" +
				"<tr><td><b>" + i18next.t("lamp_operator") + ": </b></td><td>" + operator + "</td></tr>" +
				light_method_text +
				light_mount_text +
				lamp_start_date +
				lamp_manufacturer +
				lamp_model_text +
				lamp_height_text +
				lamp_width_text +
				light_height_text +
				light_lit_text +
				"</table></div>" +
				"<br><a href='#' onclick='openinJOSM(\""+EleType+"\",\""+EleID+"\")'>edit in JOSM</a> | <a href='https://www.openstreetmap.org/"+EleType+"/"+EleID+"'>show in OSM</a>"
				;
			
			if (light_height == "" && lamp_height != "")
			{
				light_height = lamp_height;
			}


			if($.inArray(EleID, MarkerArray)==-1)
			{
				i = light_count;

				light_direction_array = light_direction.split(";")
				ref_array = ref.split(";")
				pos_direction = new Array();

				if (light_count > 1)
				{
					if (light_direction_array[0] >= 0 && light_direction_array[0] <= 360)
					{
						pos_direction[0] = light_direction_array[0];
					}
					else
					{
						pos_direction[0] = 0;
					}
				}

				j = 0;
				while (i > 0)
				{

					if (light_count > 1)
					{
						if (light_direction_array[j] >= 0 && light_direction_array[j] <= 360)
						{
							pos_direction[j] = light_direction_array[j];
						}
						else if (j > 0)
						{
							pos_direction[j] = pos_direction[j-1]*1 + 360 / light_count;
							if ( pos_direction[j] > 360 )
							{
								pos_direction[j] = pos_direction[j] - 360;
							}
						}
						[EleLatNew,EleLonNew] = addLatLngDistanceM(EleLat,EleLon,pos_direction[j],1.5)
					}
					else
					{
						[EleLatNew,EleLonNew] = [EleLat,EleLon]
					}

					if (!light_direction_array[j])
					{
						light_direction_array[j] = light_direction_array[j-1];
					}
					if (!ref_array[j])
					{
						ref_array[j] = "";
					}

					var markerLocation = new L.LatLng(EleLatNew,EleLonNew);

					//light_count = 1; // FIXME: should be removed later
					var Icon = getMarkerIcon(L,light_source, light_method, light_colour, light_direction_array[j], light_shape, light_height, ref_array[j]);
					var marker = new L.Marker(markerLocation,{icon : Icon});

					if(EleText!="")
					{
						marker.bindPopup(EleText);
					}
					StreetLights.addLayer(marker);

					MarkerArray.push(EleID);

					i = i - 1;
					j = j + 1;
				}

			}

		} else {
			// Draw ways, which have no popup
			if(area) {
				var shape = L.polygon(EleCoordArray.map(p => new L.LatLng(p[0], p[1])), {
					stroke: false, fillColor: 'white', fillOpacity: 0.4,
					weight: 3,
				})
				LitStreets.addLayer(shape);
			} else {
				var line = L.polyline(EleCoordArray.map(p => new L.LatLng(p[0], p[1])), {
					color: 'lightgray',
					weight: 3,
				})
				LitStreets.addLayer(line)
			}
		}

	});

	//Loading ausblenden
	loadingcounter--;
	if (loadingcounter==0) {
		$("#loading").hide(0.4);
	};
}

function addLatLngDistanceM(EleLat,EleLon,angle,distance)
{
	LatRad = EleLat * Math.PI / 180;
	deg_lat_per_m  = 1 / ( 111132.92 - 559.82 * Math.cos( 2 * LatRad ) + 1.175 * Math.cos( 4 * LatRad ) - 0.0023 * Math.cos( 6 * LatRad ) );
	deg_lon_per_m = 1 / ( 111412.84 * Math.cos ( LatRad ) - 93.5 * Math.cos ( 3 * LatRad ) + 0.118 * Math.cos ( 5 * LatRad ) );

	angle = angle * Math.PI / 180;
	// for now only on Northern hemisphere
	if ( angle >= 0 && angle < 90 )
	{
		Lat_dist_m = Math.cos ( angle ) * distance;
		Lon_dist_m = Math.sin ( angle ) * distance;
	}
	else if ( angle >= 90 && angle < 180 )
	{
		Lat_dist_m = -Math.sin ( Math.PI - angle ) * distance;
		Lon_dist_m = Math.cos ( Math.PI - angle ) * distance;
	}
	else if ( angle >= 180 && angle < 270 )
	{
		Lat_dist_m = -Math.cos ( Math.PI * 3 / 2 - angle ) * distance;
		Lon_dist_m = -Math.sin ( Math.PI * 3 / 2 - angle ) * distance;
	}
	else if ( angle >= 270 && angle <= 360 )
	{
		Lat_dist_m = Math.sin ( Math.PI * 2 - angle ) * distance;
		Lon_dist_m = -Math.cos ( Math.PI * 2 - angle ) * distance;
	}

	EleLat = EleLat*1 + Lat_dist_m * deg_lat_per_m;
	EleLon = EleLon*1 + Lon_dist_m * deg_lon_per_m;

	return [EleLat , EleLon];
}

function isNumeric(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

function get_light_lit(value){
	var result;
	if (value == "dusk-dawn"){
		result = i18next.t("lamp_time_duskdawn");
	}
	else if (value == "demand"){
		result = i18next.t("lamp_time_demand");
	}
	else {
		result = value;
	}
	return result;
}

function get_light_method(value){
	var result;
	if (value == "high_pressure_sodium" || value == "high-pressure_sodium" || value == "HPSV" || value == "SON"){
		result =  i18next.t("lamp_method_high_presssure_sodium");
	}
	else if (value == "low_pressure_sodium" || value == "low-pressure_sodium" || value == "SOX"){
		result =  i18next.t("lamp_method_low_presssure_sodium");
	}
	else if (value == "sodium" || value == "sodium_vapor"){
		result =  i18next.t("lamp_method_sodium");
	}
	else if (value == "LED" || value == "led"){
		result =  i18next.t("lamp_method_led");
	}
	else if (value == "metal_halide" || value == "metal-halide"){
		result =  i18next.t("lamp_method_metal_halide");
	}
	else if (value == "fluorescent"){
		result =  i18next.t("lamp_method_fluorescent");
	}
	else if (value == "incandescent"){
		result =  i18next.t("lamp_method_incandescent");
	}
	else if (value == "mercury"){
		result =  i18next.t("lamp_method_mercury");
	}
	else if (value == "electric" || value == "electrical"){
		result =  i18next.t("lamp_method_electric");
	}
	else if (value == "gas" || value == "gaslight"){
		result =  i18next.t("lamp_method_gas");
	}
	else {
		result = value;
	}
	return result;
}

function get_light_mount(value){
	var result;
	if (value == "straight mast" || value == "straight_mast"){
		result =  i18next.t("lamp_mount_straight_mast");
	}
	else if (value == "bent mast" || value == "bent_mast"){
		result =  i18next.t("lamp_mount_bent_mast");
	}
	else if (value == "cast steel mast" || value == "cast_steel_mast"){
		result =  i18next.t("lamp_mount_cast_steel_mast");
	}
	else if (value == "mast" || value == "pole"){
		result =  i18next.t("lamp_mount_mast");
	}
	else if (value == "power_pole"){
		result =  i18next.t("lamp_mount_power_pole");
	}
	else if (value == "wall_mounted" || value == "wall"){
		result =  i18next.t("lamp_mount_wall");
	}
	else if (value == "suspended" || value == "wire"){
		result =  i18next.t("lamp_mount_wire");
	}
	else if (value == "ceiling"){
		result =  i18next.t("lamp_mount_ceiling");
	}
	else if (value == "ground"){
		result =  i18next.t("lamp_mount_ground");
	}
	else {
		result = value;
	}
	return result;
}


function getMarkerIcon(L,light_source,light_method, light_colour,light_direction,light_shape,light_height,ref){

	var symbol_url = "electric";

	if(light_source == "xmas")
	{
		symbol_url = "xmastree";
	}
	else if(light_source == "floodlight")
	{
		symbol_url = "floodlight";
	}
	else
	{

		if(light_source == "lantern" && light_shape == "directed" && light_direction)
		{
			symbol_url = "electric_directed";
		}
	}

	colour_url = "";

	if(light_colour.substr(-1) == "K")
	{
		var Kelvin_length = light_colour.indexOf("K");
		var light_colour_K = Number(light_colour.substr(0,Kelvin_length));
		if (!light_colour_K.isNaN)
		{
		if (light_colour_K < 2000)
		{
			colour_url = "_gas";
		}
		else if (light_colour_K < 2600)
		{
			colour_url = "_orange";
		}
		else if (light_colour_K < 3000)
		{
			colour_url = "_fluorescent";
		}
		else if (light_colour_K < 4000)
		{
			colour_url = "_led";
		}
		else if (light_colour_K > 5600)
		{
			colour_url = "_mercury";
		}
		else
		{
			colour_url = "_white";
		}
		}
	}    
	if(light_colour == "white")
	{
		colour_url = "_white";
	}
	if(light_colour == "orange")
	{
		colour_url = "_orange";
	}
	if(light_colour == "blue")
	{
		colour_url = "_blue";
	}
	if(light_colour == "red")
	{
		colour_url = "_red";
	}
	if(light_colour == "green")
	{
		colour_url = "_green";
	}
	if(light_colour == "yellow")
	{
		colour_url = "_yellow";
	}
	if(light_method == "LED" || light_method == "led")
	{
		if (!colour_url || colour_url=="_white")
		{
			colour_url = "_led";
		}
	}
	if(light_method == "fluorescent")
	{
		if (!colour_url || colour_url=="_white")
		{
			colour_url = "_fluorescent"
		}
	}
	if(light_method == "gas" || light_method == "gaslight")
	{
		if (!colour_url || colour_url=="_orange" || colour_url == "_red")
		{
			colour_url = "_gas";
		}
	}
	if(light_method == "metal_halide" || light_method == "metal-halide")
	{
		if (!colour_url)
		{
			colour_url = "_white";
		}
	}
	if(light_method == "incandescent")
	{
		if (!colour_url)
		{
			colour_url = "_white";
		}
	}
	if(light_method == "high_pressure_sodium" || light_method == "high-pressure_sodium" || light_method == "sodium_vapor" || light_method == "sodium")
	{
		if (!colour_url)
		{
			colour_url = "_orange";
		}
	}
	if(light_method == "mercury")
	{
		if (!colour_url && colour_url!="white")
		{
			colour_url = "_mercury";
		}
	}
	var direction = "";
	var rotate = "";
	var usedDir = "";
	var iconOffset = 0;
	var iconSize = 0;
	var iconClass = "";
	
	var zoomClass = 0;
	
	if ( map.getZoom() == 19)
	{
		//if (light_height > 10)
		zoomClass = 19;
		refclass = "lamp_ref_19_text";
		if (light_height >= 10)
		{
			zoomClass = 21;
		}
		else if (light_height >= 7)
		{
			zoomClass = 20;
		}
		else if (light_height <= 4)
		{
			zoomClass = 18;
		}
		else if (light_height <= 2)
		{
			zoomClass = 17;
		}
	}
	else if ( map.getZoom() == 18)
	{  
		zoomClass = 18;
		refclass = "lamp_ref_18_text";
		if (light_height >= 10)
		{
			zoomClass = 20;
		}
		else if (light_height >= 7)
		{
			zoomClass = 19;
		}
		else if (light_height <= 4)
		{
			zoomClass = 17;
		}
		else if (light_height <= 2)
		{
			zoomClass = 16;
		}
	}
	else if ( map.getZoom() == 17)
	{
		zoomClass = 17;
		refclass = "lamp_ref_17_text";
		if (light_height >= 10)
		{
			zoomClass = 19;
		}
		else if (light_height >= 7)
		{
			zoomClass = 18;
		}
		else if (light_height <= 4)
		{
			zoomClass = 16;
		}
		else if (light_height <= 2)
		{
			zoomClass = 15;
		}
	}
	else if ( map.getZoom() == 16)
	{
		zoomClass = 16;
		refclass = "lamp_ref_none";
		if (light_height >= 10)
		{
			zoomClass = 18;
		}
		else if (light_height >= 7)
		{
			zoomClass = 17;
		}
		else if (light_height <= 4)
		{
			zoomClass = 15;
		}
		else if (light_height <= 2)
		{
			zoomClass = 14;
		}
	}
	else if ( map.getZoom() == 15)
	{
		zoomClass = 15;
		refclass = "lamp_ref_none";
		if (light_height > 0)
		{
			if (light_height >= 10)
			{
				zoomClass = 17;
			}
			else if (light_height >= 7)
			{
				zoomClass = 16;
			}
			else if (light_height <= 4)
			{
				zoomClass = 14;
			}
			else if (light_height <= 2)
			{
				zoomClass = 13;
			}
		}
	}
	if (zoomClass == 21)
	{
		iconClass = "light_21 " + iconClass;
		iconOffset = 52;
		iconSize = 104;
		refclass = "lamp_ref_21 " + refclass;
	}
	else if (zoomClass == 20)
	{
		iconClass = "light_20 " + iconClass;
		iconOffset = 46;
		iconSize = 92;
		refclass = "lamp_ref_20 " + refclass;
	}
	else if (zoomClass == 19)
	{
		iconClass = "light_19 " + iconClass;
		iconOffset = 40;
		iconSize = 80;
		refclass = "lamp_ref_19 " + refclass;
	}
	else if ( zoomClass == 18)
	{
		iconClass = "light_18 " + iconClass;
		iconOffset = 34;
		iconSize = 68;
		refclass = "lamp_ref_18 " + refclass;
	}
	else if ( zoomClass == 17)
	{
		iconClass = "light_17 " + iconClass;
		iconOffset = 28;
		iconSize = 56;
		refclass = "lamp_ref_17 " + refclass;
	}
	else if ( zoomClass == 16)
	{
		iconClass = "light_16 " + iconClass;
		iconOffset = 22;
		iconSize = 44;
		refclass = "lamp_ref_16 " + refclass;
	}
	else if ( zoomClass == 15)
	{
		iconClass = "light_15 " + iconClass;
		iconOffset = 16;
		iconSize = 32;
		refclass = "lamp_ref_15 " + refclass;
	}
	else if ( zoomClass == 14)
	{
		iconClass = "light_14 " + iconClass;
		iconOffset = 10;
		iconSize = 20;
		refclass = "lamp_ref_14 " + refclass;
	}
	else if ( zoomClass == 13)
	{
		iconClass = "light_13 " + iconClass;
		iconOffset = 4;
		iconSize = 8;
		refclass = "lamp_ref_13 " + refclass;
	}

	if(light_direction)
	{
		var cardinal = new Object();
		cardinal['N'] = 0;
		cardinal['NNE'] = 22.5;
		cardinal['NE'] = 45;
		cardinal['ENE'] = 67.5;
		cardinal['E'] = 90;
		cardinal['ESE'] = 112.5;
		cardinal['SE'] = 135;
		cardinal['SSE'] = 157.5;
		cardinal['S'] = 180;
		cardinal['SSW'] = 202.5;
		cardinal['SW'] = 225;
		cardinal['WSW'] = 247.5;
		cardinal['W'] = 270;
		cardinal['WNW'] = 292.5;
		cardinal['NW'] = 315;
		cardinal['NNW'] = 337.5;

		if (cardinal.hasOwnProperty(light_direction)) {
			usedDir = cardinal[light_direction];
		}
		else
		{
			usedDir = light_direction; /* let's hope it's numeric */
			/* ignore to_street  to_crossing */
		}
	}
	if (usedDir && light_source == "floodlight")
	{
			if(usedDir >= 135 && usedDir <=360)
			{
				rotate = usedDir - 135;
		}
		if(usedDir >= 0 && usedDir < 135)
		{
			rotate = usedDir - 135 + 360;
		}
		var translatex = Math.cos( ( 45 + rotate ) * 2 * Math.PI / 360 ) * Math.sqrt( 2 * iconOffset * iconOffset );
		var translatey = Math.sin( ( 45 + rotate ) * 2 * Math.PI / 360 ) * Math.sqrt( 2 * iconOffset * iconOffset );
		direction = '-ms-transform: translate(' + translatex + 'px,' + translatey + 'px) rotate(' + rotate + 'deg); -webkit-transform: translate(' + translatex + 'px,' + translatey + 'px) rotate(' + rotate + 'deg); transform: translate(' + translatex + 'px,' + translatey + 'px) rotate(' + rotate + 'deg); ';
	}
	if (usedDir && light_source == "lantern")
	{
			if(usedDir >= 0 && usedDir <=360)
			{
				rotate = usedDir - 0;
		}
		if(usedDir >= 0 && usedDir < 0)
		{
			rotate = usedDir - 0 + 360;
		}
		var translatex = 0;//Math.cos( ( 45 + rotate ) * 2 * Math.PI / 360 ) * Math.sqrt( 2 * 24 * 24 );
		var translatey = 0;//Math.sin( ( 45 + rotate ) * 2 * Math.PI / 360 ) * Math.sqrt( 2 * 24 * 24 );
		direction = '-ms-transform: translate(' + translatex + 'px,' + translatey + 'px) rotate(' + rotate + 'deg); -webkit-transform: translate(' + translatex + 'px,' + translatey + 'px) rotate(' + rotate + 'deg); transform: translate(' + translatex + 'px,' + translatey + 'px) rotate(' + rotate + 'deg); ';
	}
	if ( map.getZoom() < 17)
	{
		ref ="";
	}
	var Icon = L.divIcon({
		className: iconClass,
		html: '<div style="background-image: url(\'./img/' + symbol_url + colour_url + '.svg\');background-repeat: no-repeat;' + direction + '"> </div><span class="' + refclass + '">' + ref + '</span>',
		iconSize: [iconSize, iconSize],
		iconAnchor:   [iconOffset, iconOffset],
		popupAnchor:  [0, -5]
	});
	return Icon;
}
