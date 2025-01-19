function MoveCall(action) { //action: 0: map moved, 1: high zoom layer added, 2: low zoom layer added, 3: layer removed, 4: streetlights layer removed, 5: language updated
	const coords = map.getBounds();
	const lefttop = coords.getNorthWest();
	const rightbottom = coords.getSouthEast();
	loadXML(lefttop.lat,lefttop.lng,rightbottom.lat,rightbottom.lng, action);
}

function loadXML(lat1,lon1,lat2,lon2, action) { //action: 0: map moved, 1: high zoom layer added, 2: low zoom layer added, 3: layer removed, 4: streetlights layer removed, 5: language updated
	
	let hasHighZoomLayer = false, hasLowZoomLayer = false, zoomWarning = 1;
	
	// Special case: Low Zoom data loaded once
	if (g_showStreetLightsLowZoomOnce && map.getZoom() < MIN_ZOOM_LOW_ZOOM) {
		hasHighZoomLayer = false;
		hasLowZoomLayer = false;
		zoomWarning = 4
	} else {
		if (map.getZoom() >= MIN_ZOOM) {
			zoomWarning = 0
			
			if (map.hasLayer(StreetLightsLayer) || map.hasLayer(AviationLayer) || map.hasLayer(LitStreetsLayer) || map.hasLayer(UnLitStreetsLayer)) {
				if (!map.hasLayer(StreetLightsLayer) && map.hasLayer(StreetLightsLowZoomLayer)) {
					hasLowZoomLayer = true;
				} else {
					hasLowZoomLayer = false;
				}
				hasHighZoomLayer = true;
			} else if (map.hasLayer(StreetLightsLowZoomLayer)) {  
				hasHighZoomLayer = false;
				hasLowZoomLayer = true;
			} else { // no map layers loaded
				hasHighZoomLayer = false;
				hasLowZoomLayer = false;
				zoomWarning = 2
			}
		} else {
			hasLowZoomLayer = false;
			if (map.hasLayer(StreetLightsLowZoomLayer)) { 
				if (map.getZoom() >= MIN_ZOOM_LOW_ZOOM) {
					hasLowZoomLayer = true;
					zoomWarning = 0;
				} else {
					hasLowZoomLayer = false;
					zoomWarning = 3;
				}
			} else {
				hasHighZoomLayer = false;
				zoomWarning = 1
				if (map.getZoom() < MIN_ZOOM_LOW_ZOOM) {
					zoomWarning = 3;
				}
			}
		}
	}
	// load data if map moved or layer added
	if (hasHighZoomLayer && (action == 0 || action == 1)) {
		loadData('[bbox:' + lat2 + ',' + lon1 + ',' + lat1 + ',' + lon2 +  '];');
	}
	if (hasLowZoomLayer && (action == 0 || action == 2 || action == 4)) {
		loadDataLowZoom('[bbox:' + lat2 + ',' + lon1 + ',' + lat1 + ',' + lon2 + '];');
	}
	
	//remove data:
	if (!hasHighZoomLayer) {
		parseOSM(false);
	}
	if(!hasLowZoomLayer && zoomWarning!=4) {
		parseOSMlowZoom(false);
		g_showStreetLightsLowZoomOnce = false;
	}
	if(!hasHighZoomLayer && !hasLowZoomLayer && zoomWarning!=4) {
		// reset loading counter
		loadingcounter = 0;		
		//update opacity
		current_layer.setOpacity(opacityLow);
		$("#opacity_slider").slider("option", "value", opacityLow * 100);	
	}
	
	//handle zoom warning
	if (zoomWarning)
	{
		//update zoomtext
		let textZoom_value="Zoom in to load data"
		if(i18next.isInitialized && zoomWarning < 4){
			textZoom_value = i18next.t("zoomtext_" + zoomWarning);
		}
		$( "#zoomtext" ).text(textZoom_value)
		
		//show load update and clear low zoom data buttons
		if (zoomWarning == 3) {
			$( "#zoomtext" ).show();
			$( "#load_lowzoom_data" ).show();
			$( "#update_lowzoom_data" ).hide();
			$( "#clear_lowzoom_data" ).hide();

		} else if (zoomWarning == 4) {
			$( "#zoomtext" ).hide();
			$( "#load_lowzoom_data" ).hide();
			$( "#update_lowzoom_data" ).show();
			$( "#clear_lowzoom_data" ).show();
			
		} else {
			$( "#zoomtext" ).show();
			$( "#load_lowzoom_data" ).hide();
			$( "#update_lowzoom_data" ).hide();
			$( "#clear_lowzoom_data" ).hide();
			
		}
		
		// fade in zoom warning
		$( "#zoomwarning_cont" ).fadeIn(500);	

	} else {
		$( "#zoomwarning_cont" ).fadeOut(500);
		current_layer.setOpacity(opacityHigh);
		$("#opacity_slider").slider("option", "value", opacityHigh * 100);
	}
	
}

function loadLowZoomDataOnce() {
	
	g_showStreetLightsLowZoomOnce = true;
	let coords = map.getBounds();
	let lefttop = coords.getNorthWest();
	let rightbottom = coords.getSouthEast();
	let lat1 = lefttop.lat;
	let lon1 = lefttop.lng;
	let lat2 = rightbottom.lat;
	let lon2 = rightbottom.lng;
	
	map.addLayer(StreetLightsLowZoomLayer);
	loadDataLowZoom('[bbox:' + lat2 + ',' + lon1 + ',' + lat1 + ',' + lon2 + '];');
	
	$( "#zoomwarning_cont" ).fadeOut(500);
	current_layer.setOpacity(opacityHigh);
	$("#opacity_slider").slider("option", "value", opacityHigh * 100);
}	

function clearLowZoomData() {
	g_showStreetLightsLowZoomOnce = false;
	map.removeLayer(StreetLightsLowZoomLayer)
}

function loadData(bbox) {
	$( "#loading_text" ).text("")
	$( "#loading" ).attr("class", "");
	$( "#loading_icon" ).attr("class", "loading_spinner")
	$( "#loading_cont" ).fadeIn(100)
	loadingcounter++;

	//CrossoverAPI XML request
	// Street Light query
	XMLRequestText = bbox + '( node["highway"="street_lamp"]; node["light_source"]; node["tower:type"="lighting"]; node["aeroway"="navigationaid"];'

	today = new Date();
	if (today.getMonth() == 11) { // show christmas trees only in December
		XMLRequestText += 'node["xmas:feature"="tree"];'
	}

	if (map.hasLayer(LitStreetsLayer) || map.hasLayer(UnLitStreetsLayer)) {
		XMLRequestText += '(way["highway"][!area]["lit"]; >;); ' +
			'(way["highway"][area]["lit"]; >;); ';
	}
	XMLRequestText += '); out qt; '
	//console.log ( XMLRequestText );

	//URL Codieren
	XMLRequestText = encodeURIComponent(XMLRequestText);

	if (location.protocol == 'https:') {
		RequestProtocol = "https://";
	} else {
		RequestProtocol = "http://";
	}

	RequestURL = RequestProtocol + "overpass-api.de/api/interpreter?data=" + XMLRequestText;
	
	//AJAX REQUEST
	$.ajax({
		url: RequestURL,
		type: 'GET',
		crossDomain: true,
		success: function(data) {
			if (loadingcounter==1) {
				$( "#loading_text" ).html("")
				$( "#loading" ).attr("class", "success");
				$( "#loading_icon" ).attr("class", "loading_success")
			}
			loadingcounter--;
			parseOSM(data);
		},
		error: function(jqXHR, textStatus, errorThrown){
			
			if( i18next.isInitialized) {
				if (textStatus == "timeout" || textStatus == "error" || textStatus == "abort" || textStatus == "parseerror") {
					textStatus_value = i18next.t("ajaxerror_" + textStatus);
				} else {
					textStatus_value = i18next.t("ajaxerror_unknown");
				}
			} else { // fallback in case i18next is not initalized yet.
				textStatus_value = "Error while loading data";
			}
			
			$( "#loading" ).attr("class", "error");
			$( "#loading_icon" ).attr("class", "loading_error")
			$( "#loading_text" ).html("&nbsp;" + textStatus_value)
			loadingcounter--;
		},
		timeout: 10000 // timeout after 10s
	});
}
function loadDataLowZoom(bbox)
{
	$( "#loading_text" ).text("")
	$( "#loading" ).attr("class", "");
	$( "#loading_icon" ).attr("class", "loading_spinner")
	$( "#loading_cont" ).fadeIn(100)
	loadingcounter++;

	//CrossoverAPI XML request
	if (location.protocol == 'https:') {
		RequestProtocol = "https://";
	}
	else {
		RequestProtocol = "http://";
	}

	XMLRequestTextLowZoom = bbox + '( node["highway"="street_lamp"]; node["light_source"];); out skel;'
	RequestURLlowZoom = RequestProtocol + "overpass-api.de/api/interpreter?data=" + XMLRequestTextLowZoom;
	
	//AJAX REQUEST
	$.ajax({
		url: RequestURLlowZoom,
		type: 'GET',
		crossDomain: true,
		success: function(data){
			if (loadingcounter==1) {
				$( "#loading_text" ).html("")
				$( "#loading" ).attr("class", "success");
				$( "#loading_icon" ).attr("class", "loading_success")
			}
			loadingcounter--;
			parseOSMlowZoom(data);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			
			if (i18next.isInitialized) {
					
				if (textStatus == "timeout" || textStatus == "error" || textStatus == "abort" || textStatus == "parseerror") {
					textStatus_value = i18next.t("ajaxerror_" + textStatus);
				} else {
					textStatus_value = i18next.t("ajaxerror_unknown");
				}
			} else { // fallback in case i18next is not initalized yet.
				textStatus_value = "Error while loading data";
			}
			
			$( "#loading" ).attr("class", "error");
			$( "#loading_icon" ).attr("class", "loading_error")
			$( "#loading_text" ).html("&nbsp;" + textStatus_value)
			loadingcounter--;
		},
		timeout: 10000 // timeout after 10s
	});
}

function parseOSM(data)
{
	//console.log(data);
	MarkerArray = new Array();
	CoordObj = new Object();
	StreetLightsLayer.clearLayers();
	AviationLayer.clearLayers();
	LitStreetsLayer.clearLayers();
	UnLitStreetsLayer.clearLayers();

	$(data).find('node,way').each(function() {
		EleID = $(this).attr("id");

		EleCoordArray = new Array();

		if ($(this).attr("lat")) { // Node
			EleLat = $(this).attr("lat");
			EleLon = $(this).attr("lon");
			EleType = "node"
			EleObj = new Object();
			EleObj["lat"] = EleLat;
			EleObj["lon"] = EleLon;
			CoordObj[EleID] = EleObj;
		} else { // Way
			EleType = "way";
			$(this).find('nd').each(function() {
				NdRefID = $(this).attr("ref");
				EleCoordArray.push([CoordObj[NdRefID]["lat"], CoordObj[NdRefID]["lon"]]);
			});
		}




		var EleText = "";
		var highway = "";
		var aeroway = "";
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
		var light_flash = "";
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
		var navigationaid = "";
		var xmas = "";
		var lit = "";
		var area = "";

		$(this).find('tag').each(function(){
			EleKey = $(this).attr("k");
			EleValue = $(this).attr("v");
			if ((EleKey=="highway"))
			{
				highway = EleValue;
			}
			if ((EleKey=="aeroway"))
			{
				aeroway = EleValue;
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
			if ((EleKey=="light:direction" || EleKey=="direction"))
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
			if ((EleKey=="light:flash"))
			{
				light_flash = EleValue;
			}
			if ((EleKey=="light:character" && EleValue != "fixed"))
			{
				light_flash = "yes";
			}
			if ((EleKey=="light_source"))
			{
				light_source = EleValue;
			}
			if ((EleKey=="tower:type"))
			{
				if ((EleValue=="lighting"))
				{
					light_source = "floodlight";
				}
			}
			if ((EleKey=="navigationaid"))
			{
				navigationaid = EleValue;
			}
			if ((EleKey=="xmas:feature"))
			{
				light_source = "xmas";
			}
			if ((EleKey=="area")) {
				area = EleValue
			}
			if ((EleKey=="lit")) {
				lit = EleValue
			}

		});

		if (highway == "street_lamp" && light_source == "") {
			light_source = "lantern";
		}

		if (aeroway == "navigationaid" && light_source == "") {
			light_source = "aviation";
			if (!navigationaid){ // unknown navigationaid
				navigationaid = "unknown"
			}
		}

		if (light_source != "") {

			if(light_source == "lantern") {
				light_type = i18next.t("lamp_lantern");
			} else if(light_source == "floodlight") {
				light_type = i18next.t("lamp_floodlight");
			} else if(light_source == "warning") {
				light_type = i18next.t("lamp_warning");
			} else if(light_source == "aviation") {
				if(navigationaid == "als") { // Approach Lighting System
					light_type = i18next.t("lamp_aviation_als");
				} else if(navigationaid == "papi") { // Precision Approach Path Indicator
					light_type = i18next.t("lamp_aviation_papi");
				} else if(navigationaid == "vasi") { // Visual Approach Slope Indicator
					light_type = i18next.t("lamp_aviation_vasi");
				} else if(navigationaid == "txe") { // Taxiway Edge Light
					light_type = i18next.t("lamp_aviation_txe");
				} else if(navigationaid == "txc") { // Taxiway Centre Light
					light_type = i18next.t("lamp_aviation_txc");
				} else if(navigationaid == "rwe") { // Runway Edge Light
					light_type = i18next.t("lamp_aviation_rwe");
				} else if(navigationaid == "rwc") { // Runway Centre Light
					light_type = i18next.t("lamp_aviation_rwc");
				} else if(navigationaid == "tdz") { // Touchdown Zone
					light_type = i18next.t("lamp_aviation_tdz");
				} else if(navigationaid == "rgl") { // Runway Guard Light
					light_type = i18next.t("lamp_aviation_rgl");
				} else if(navigationaid == "beacon") { // Aerodrome Beacon
					light_type = i18next.t("lamp_aviation_beacon");
				} else {
					light_type = i18next.t("lamp_aviation");
				}
			} else {
				light_type = i18next.t("lamp_unknown");
			}

			if (operator=="") {
				operator = "<i>"+i18next.t("unknown")+"</i>";
			}

			//Tags that are only shown when available
			if (lamp_start_date!="") {
				lamp_start_date = "<tr><td><b>" + i18next.t("lamp_start_date") + ": </b></td><td>" + lamp_start_date + "</td></tr>";
			}
			if (lamp_manufacturer!="") {
				lamp_manufacturer = "<tr><td><b>" + i18next.t("lamp_manufacturer") + ": </b></td><td>" + lamp_manufacturer + "</td></tr>";
			}
			if (lamp_model!="") {
				lamp_model_text = "<tr><td><b>" + i18next.t("lamp_model") + ": </b></td><td>" + lamp_model + "</td></tr>";
			}
			if (lamp_height!="") {
				lamp_height_text = "<tr><td><b>" + i18next.t("lamp_height") + ": </b></td><td>" + lamp_height + " m</td></tr>";
			}
			if (light_height!="") {
				light_height_text = "<tr><td><b>" + i18next.t("lamp_light_height") + ": </b></td><td>" + light_height + " m</td></tr>";
			}
			if (lamp_width!="") {
				lamp_width_text = "<tr><td><b>" + i18next.t("lamp_width") + ": </b></td><td>" + lamp_width + "</td></tr>";
			}
			if (light_method!="") {
				light_method_text = "<tr><td><b>" + i18next.t("lamp_method") + ": </b></td><td>" + get_light_method(light_method) + "</td></tr>";
			}
			if (light_mount!="") {
				light_mount_text = "<tr><td><b>" + i18next.t("lamp_mount") + ": </b></td><td>" + get_light_mount(light_mount) + "</td></tr>";
			}
			if (light_lit!="") {
				light_lit_text = "<tr><td><b>" + i18next.t("lamp_time") + ": </b></td><td>" + get_light_lit(light_lit) + "</td></tr>";
			}
			if (light_count > 1) {
				light_lit_text = "<tr><td><b>" + i18next.t("lamp_count") + ": </b></td><td>" + light_count + "</td></tr>";
			}
			
			// Restrict number of shown light sources for single points to reduce clutter
			if (light_count > 1) {
				light_count = Math.min(light_count, LIGHT_COUNT_MAX)
			}

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
			
			if (light_height == "" && lamp_height != "") {
				light_height = lamp_height;
			}

			if($.inArray(EleID, MarkerArray)==-1) {
				var light_direction_array = light_direction.split(";")
				var ref_array = ref.split(";")
 
				// Handle lights with only one direction given
				var single_dir = false;
				if (light_direction_array.length == 1 && light_count > 1 && (light_direction_array[0] > 0 || light_direction_array[0] === 0))
				{
					var single_dir = true;
					var pos_direction_0 = light_direction_array[0] // keep first value in memory
				}
				
				var i = light_count; 
				var j = 0;
				var pos_direction = new Array();
				while (i > 0) {
					// Positioning of multiple lights at same spot (light_count > 1)
					if (light_count > 1) {
						if (single_dir) { //only one direction value given -> assume all lights are parallel:		
							pos_direction[j] = pos_direction_0 * 1 + 90;
							pos_distance = 1.5 * j - ( (1.5 * light_count) / 2 );
							if ( pos_direction[j] > 360 ) {
								pos_direction[j] = pos_direction[j] - 360;
							}
						} else if (light_direction_array[j] === 0 || (light_direction_array[j] > 0 && light_direction_array[j] <= 360 )) {
							pos_direction[j] = light_direction_array[j];
							pos_distance = 1.5;
						} else if (j > 0) {
							pos_direction[j] = pos_direction[j-1] * 1 + 360 / light_count;
							pos_distance = 1.5 ;
							if ( pos_direction[j] > 360 ) {
								pos_direction[j] = pos_direction[j] - 360;
							}
						} else {
							pos_direction[j] = 0;
							pos_distance = 1.5;
						}
						[EleLatNew,EleLonNew] = addLatLngDistanceM(EleLat,EleLon,(pos_direction[j]),pos_distance);
					} else {
						[EleLatNew,EleLonNew] = [EleLat,EleLon];
					}

					if (!light_direction_array[j]) {
						light_direction_array[j] = light_direction_array[j-1];
					}
					if (!ref_array[j]) {
						ref_array[j] = "";
					}

					var markerLocation = new L.LatLng(EleLatNew,EleLonNew);
					
						var Icon = getMarkerIcon(L,light_source, light_method, light_colour, light_flash, light_direction_array[j], light_shape, light_height, navigationaid, ref_array[j]);
						var marker = new L.Marker(markerLocation,{icon : Icon});

						if(EleText!="")
						{
							marker.bindPopup(EleText);
						}
						
					if(light_source == "aviation" || light_source == "warning") {
						AviationLayer.addLayer(marker);
					} else {
						StreetLightsLayer.addLayer(marker);
					}

					MarkerArray.push(EleID);

					i = i - 1;
					j = j + 1;
				}

			}

		} else if (lit == "no" || lit == "disused") {
			// Draw ways, which have no popup
			if(area) {
				var shape = L.polygon(EleCoordArray.map(p => new L.LatLng(p[0], p[1])), {
					stroke: false, fillColor: '#000000', fillOpacity: 0.4,
					weight: 3
				})
				UnLitStreetsLayer.addLayer(shape);
			} else {
				var line = L.polyline(EleCoordArray.map(p => new L.LatLng(p[0], p[1])), {
					color: '#111111',
					weight: 3
				})
				UnLitStreetsLayer.addLayer(line)
			}
		} else if (lit == "yes" || lit == "24/7" || lit == "automatic" || lit == "limited" || lit == "sunset-sunrise" || lit == "dusk-dawn" || lit == "interval") {
			// Draw ways, which have no popup
			if ((lit == "automatic"))
			{
				strokeDashArray = "2 3";
				strokeColor = "#BBBBBB";
			}
			else if ((lit == "limited" || lit == "interval"))
			{
				strokeDashArray = "8";
				strokeColor = "#BBBBBB";
			}
			else
			{
				strokeDashArray = "0";
				strokeColor = "#BBBBBB";
			}
			if(area) {
				var shape = L.polygon(EleCoordArray.map(p => new L.LatLng(p[0], p[1])), {
					stroke: false, fillColor: strokeColor, fillOpacity: 0.4,
					weight: 3,
					dashArray: strokeDashArray
				})
				LitStreetsLayer.addLayer(shape);
			} else {
				var line = L.polyline(EleCoordArray.map(p => new L.LatLng(p[0], p[1])), {
					color: strokeColor,
					weight: 3,
					dashArray: strokeDashArray
				})
				LitStreetsLayer.addLayer(line)
				
				if ((lit == "24/7")) // dotted outline for 24/7
				{
					var line = L.polyline(EleCoordArray.map(p => new L.LatLng(p[0], p[1])), {
						color: strokeColor,
						weight: 5,
						dashArray: "1 6"
					})
					LitStreetsLayer.addLayer(line)
				}
			}
		}

	});

	// fadeout loading icon and reset loading counter
	if (loadingcounter<=0) {
		loadingcounter = 0;
		$( "#loading_cont" ).delay(500).fadeOut(100);
	};
}


function parseOSMlowZoom(data)
{
	StreetLightsLowZoomLayer.setData({max: 8, data:[]});
	//console.log(data);
	MarkerArray = new Array();
	CoordObj = new Object();
	
	
	var iconClass = "light_13";
	var iconSize = 8;
	
	var LightsData = []
	
	$(data).find('node').each(function(){
		EleID = $(this).attr("id");

		EleCoordArray = new Array();

		//Node
		if ($(this).attr("lat"))
		{
			EleLat = $(this).attr("lat");
			EleLon = $(this).attr("lon");
			EleType = "node"
			EleObj = new Object();
			EleObj["lat"] = EleLat;
			EleObj["lon"] = EleLon;
			CoordObj[EleID] = EleObj;
			var markerLocation = new L.LatLng(EleLat,EleLon);
			var Icon = L.divIcon({
				className: iconClass,
				html: '<div style="background-image: url(\'./img/electric_white.svg\');background-repeat: no-repeat;"> </div>',
				iconSize: [iconSize, iconSize],
				iconAnchor:   [0, 0],
				});
			var marker = new L.Marker(markerLocation,{icon : Icon});
			
		}
		
		LightsData.push({"lat" : EleLat, "lng" : EleLon, "count" : 1});
	});

	console.log(LightsData)
	var lowZoomData = {
    max: 8,
    data: LightsData
    };
	StreetLightsLowZoomLayer.setData(lowZoomData)

	// fadeout loading icon and reset loading counter
	if (loadingcounter<=0) {
		loadingcounter = 0;
		$( "#loading_cont" ).delay(500).fadeOut(100);
	};
}

function addLatLngDistanceM(EleLat,EleLon,angle,distance)
{
	LatRad = EleLat * Math.PI / 180;
	deg_lat_per_m  = 1 / ( 111132.92 - 559.82 * Math.cos( 2 * LatRad ) + 1.175 * Math.cos( 4 * LatRad ) - 0.0023 * Math.cos( 6 * LatRad ) );
	deg_lon_per_m = 1 / ( 111412.84 * Math.cos ( LatRad ) - 93.5 * Math.cos ( 3 * LatRad ) + 0.118 * Math.cos ( 5 * LatRad ) );
	
	Lat_dist_m = 0; // Default fallback value
	Lon_dist_m = 0; // Default fallback value

	angle = angle * Math.PI / 180;
	// for now only on Northern hemisphere
	if ( angle >= 0 && angle < 90 ) {
		Lat_dist_m = Math.cos ( angle ) * distance;
		Lon_dist_m = Math.sin ( angle ) * distance;
	} else if ( angle >= 90 && angle < 180 ) {
		Lat_dist_m = -Math.sin ( Math.PI - angle ) * distance;
		Lon_dist_m = Math.cos ( Math.PI - angle ) * distance;
	} else if ( angle >= 180 && angle < 270 ) {
		Lat_dist_m = -Math.cos ( Math.PI * 3 / 2 - angle ) * distance;
		Lon_dist_m = -Math.sin ( Math.PI * 3 / 2 - angle ) * distance;
	} else if ( angle >= 270 && angle <= 360 ) {
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


function getMarkerIcon(L,light_source,light_method,light_colour,light_flash,light_direction,light_shape,light_height,navigationaid,ref){

	var symbol_url = "electric";

	if(light_source == "xmas") {
		symbol_url = "xmastree";
	} else if(navigationaid == "beacon") {
		symbol_url = "beacon";
	} else if(light_source == "floodlight") {
		symbol_url = "floodlight";
		if(light_direction) {
			symbol_url = "floodlight_directed";
		}
	} else if((light_source == "lantern" || light_source == "aviation") && light_shape == "directed" && light_direction) {
		symbol_url = "electric_directed";
		if (light_flash && light_flash != "no") {
			symbol_url = "electric_directed_flashing";
		}
	} else {
		if (light_flash && light_flash != "no") {
			symbol_url = "electric_flashing";
		}
	}

	colour_url = "";

	// convert Kelvin light temperatures to colour values
	if(light_colour.substr(-1) == "K")
	{
		var Kelvin_length = light_colour.indexOf("K");
		var light_colour_K = Number(light_colour.substr(0,Kelvin_length));
		if (!light_colour_K.isNaN) {
			if (light_colour_K < 2000) {
				colour_url = "_gas";
			} else if (light_colour_K < 2600) {
				colour_url = "_orange";
			} else if (light_colour_K < 3000) {
				colour_url = "_fluorescent";
			} else if (light_colour_K < 4000) {
				colour_url = "_led";
			} else if (light_colour_K > 5600) {
				colour_url = "_mercury";
			} else {
				colour_url = "_white";
			}
		}
	}   
	// add verbal colours:
	if(light_colour == "white") {
		colour_url = "_white";
	} else if(light_colour == "orange") {
		colour_url = "_orange";
	} else if(light_colour == "blue") {
		colour_url = "_blue";
	} else if(light_colour == "red") {
		colour_url = "_red";
	} else if(light_colour == "green") {
		colour_url = "_green";
	} else if(light_colour == "yellow") {
		colour_url = "_yellow";
	}
	
	// default/adapted light colours for different light methods:
	if(light_method == "LED" || light_method == "led") {
		if (!colour_url || colour_url=="_white") {
			colour_url = "_led";
		}
	} else if(light_method == "fluorescent") {
		if (!colour_url || colour_url=="_white") {
			colour_url = "_fluorescent"
		}
	} else if(light_method == "gas" || light_method == "gaslight") {
		if (!colour_url || colour_url=="_orange" || colour_url == "_red") {
			colour_url = "_gas";
		}
	} else if(light_method == "metal_halide" || light_method == "metal-halide") {
		if (!colour_url) {
			colour_url = "_white";
		}
	} else if(light_method == "incandescent") {
		if (!colour_url) {
			colour_url = "_white";
		}
	} else if(light_method == "high_pressure_sodium" || light_method == "high-pressure_sodium" || light_method == "sodium_vapor" || light_method == "sodium") {
		if (!colour_url) {
			colour_url = "_orange";
		}
	} else if(light_method == "mercury") {
		if (!colour_url && colour_url!="white") {
			colour_url = "_mercury";
		}
	}
	// default light colour for warning lights if unset:
	if (light_source == "warning") {
		if (!colour_url) {
			colour_url = "_red";
		}
	}
	// default light colours for aviation lights if unset:
	if(navigationaid == "txe") {
		if (!colour_url) {
			colour_url = "_blue";
		}
	} else if(navigationaid == "txc") {
		if (!colour_url) {
			colour_url = "_green";
		}
	} else if(navigationaid == "rwe") {
		if (!colour_url) {
			colour_url = "_white";
		}
	} else if(navigationaid == "rwc") {
		if (!colour_url) {
			colour_url = "_white";
		}
	} else if(navigationaid == "tdz") {
		if (!colour_url) {
			colour_url = "_white";
		}
	} else if(navigationaid == "rgl") {
		if (!colour_url) {
			colour_url = "_yellow";
		}
	} else if(navigationaid == "vasi" || navigationaid == "papi") {
		if (!colour_url) {
			colour_url = "_redwhite";
		}
	} else if(navigationaid == "beacon") {
		colour_url = "_white";
	}
	
	var direction = "";
	var rotate = "";
	var usedDir = "";
	var iconOffset = 0;
	var iconSize = 0;
	var iconClass = "";
	
	var zoomClass = 0;
	
	if ( map.getZoom() == 19) {
		//if (light_height > 10)
		zoomClass = 19;
		refclass = "lamp_ref_19_text";
		if (navigationaid == "beacon") {
			zoomClass = 21;
		} else if (navigationaid == "als" || navigationaid == "papi" || navigationaid == "vasi" || navigationaid == "rwe" || navigationaid == "rwc" || navigationaid == "tdz" || navigationaid == "rgl" || light_source == "warning") {
			zoomClass = 17;
		} else if (navigationaid) {
			zoomClass = 16
		} else if (light_height >= 10) {
			zoomClass = 21;
		} else if (light_height >= 7) {
			zoomClass = 20;
		} else if (light_height <= 4) {
			zoomClass = 18;
		} else if (light_height <= 2) {
			zoomClass = 17;
		}
	} else if ( map.getZoom() == 18) {  
		zoomClass = 18;
		refclass = "lamp_ref_18_text";
		if (navigationaid == "beacon") {
			zoomClass = 21;
		} else if (navigationaid == "als" || navigationaid == "papi" || navigationaid == "vasi" || navigationaid == "rwe" || navigationaid == "rwc" || navigationaid == "tdz" || navigationaid == "rgl" || light_source == "warning") {
			zoomClass = 16;
		} else if (navigationaid) {
			zoomClass = 15
		} else if (light_height >= 10) {
			zoomClass = 20;
		} else if (light_height >= 7) {
			zoomClass = 19;
		} else if (light_height <= 4) {
			zoomClass = 17;
		} else if (light_height <= 2) {
			zoomClass = 16;
		}
	} else if ( map.getZoom() == 17) {
		zoomClass = 17;
		refclass = "lamp_ref_17_text";
		if (navigationaid == "beacon") {
			zoomClass = 20;
		} else if (navigationaid == "als" || navigationaid == "papi" || navigationaid == "vasi" || navigationaid == "rwe" || navigationaid == "rwc" || navigationaid == "tdz" || navigationaid == "rgl" || light_source == "warning") {
			zoomClass = 15;
		} else if (navigationaid) {
			zoomClass = 14;
		} else if (light_height >= 10) {
			zoomClass = 19;
		} else if (light_height >= 7) {
			zoomClass = 18;
		} else if (light_height <= 4) {
			zoomClass = 16;
		} else if (light_height <= 2) {
			zoomClass = 15;
		}
	} else if ( map.getZoom() == 16) {
		zoomClass = 16;
		refclass = "lamp_ref_none";
		if (navigationaid == "beacon") {
			zoomClass = 19;
		} else if (navigationaid == "als" || navigationaid == "papi" || navigationaid == "vasi" || navigationaid == "rwe" || navigationaid == "rwc" || navigationaid == "tdz" || navigationaid == "rgl" || light_source == "warning") {
			zoomClass = 14;
		} else if (navigationaid) {
			zoomClass = 13;
		} else if (light_height >= 10) {
			zoomClass = 18;
		} else if (light_height >= 7) {
			zoomClass = 17;
		} else if (light_height <= 4) {
			zoomClass = 15;
		} else if (light_height <= 2) {
			zoomClass = 14;
		}
	} else if ( map.getZoom() <= 15) {
		zoomClass = 15;
		refclass = "lamp_ref_none";
		if (navigationaid == "beacon") {
			zoomClass = 18;
		} else if (navigationaid == "als" || navigationaid == "papi" || navigationaid == "vasi" || navigationaid == "rwe" || navigationaid == "rwc" || navigationaid == "tdz" || navigationaid == "rgl" || light_source == "warning") {
			zoomClass = 13;
		} else if (navigationaid) {
			zoomClass = 12;
		} else if (light_height > 0) {
			if (light_height >= 10) {
				zoomClass = 17;
			} else if (light_height >= 7) {
				zoomClass = 16;
			} else if (light_height <= 4) {
				zoomClass = 14;
			} else if (light_height <= 2) {
				zoomClass = 13;
			}
		}
	}
	if (zoomClass == 21) {
		iconClass = "light_21 " + iconClass;
		iconOffset = 52;
		iconSize = 104;
		refclass = "lamp_ref_21 " + refclass;
	} else if (zoomClass == 20) {
		iconClass = "light_20 " + iconClass;
		iconOffset = 46;
		iconSize = 92;
		refclass = "lamp_ref_20 " + refclass;
	} else if (zoomClass == 19) {
		iconClass = "light_19 " + iconClass;
		iconOffset = 40;
		iconSize = 80;
		refclass = "lamp_ref_19 " + refclass;
	} else if ( zoomClass == 18) {
		iconClass = "light_18 " + iconClass;
		iconOffset = 34;
		iconSize = 68;
		refclass = "lamp_ref_18 " + refclass;
	} else if ( zoomClass == 17) {
		iconClass = "light_17 " + iconClass;
		iconOffset = 28;
		iconSize = 56;
		refclass = "lamp_ref_17 " + refclass;
	} else if ( zoomClass == 16) {
		iconClass = "light_16 " + iconClass;
		iconOffset = 22;
		iconSize = 44;
		refclass = "lamp_ref_16 " + refclass;
	} else if ( zoomClass == 15) {
		iconClass = "light_15 " + iconClass;
		iconOffset = 16;
		iconSize = 32;
		refclass = "lamp_ref_15 " + refclass;
	} else if ( zoomClass == 14) {
		iconClass = "light_14 " + iconClass;
		iconOffset = 10;
		iconSize = 20;
		refclass = "lamp_ref_14 " + refclass;
	} else if ( zoomClass == 13) {
		iconClass = "light_13 " + iconClass;
		iconOffset = 4;
		iconSize = 8;
		refclass = "lamp_ref_13 " + refclass;
	}

	if(light_direction || light_direction === 0) {
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
		} else if (light_direction > 0 && light_direction <= 360) { // exclude 0 as it is used as fallback anyway
			usedDir = light_direction;
		} else {/* ignore to_street  to_crossing */
			usedDir = 0
		}
	}
	if (usedDir >= 0 && light_source == "floodlight") {
		if(usedDir >= 135 && usedDir <=360) {
			rotate = usedDir - 135;
		} else if(usedDir >= 0 && usedDir < 135) {
			rotate = usedDir - 135 + 360;
		}
		var translatex = Math.cos( ( 45 + rotate ) * 2 * Math.PI / 360 ) * Math.sqrt( 2 * iconOffset * iconOffset );
		var translatey = Math.sin( ( 45 + rotate ) * 2 * Math.PI / 360 ) * Math.sqrt( 2 * iconOffset * iconOffset );
		direction = '-ms-transform: translate(' + translatex + 'px,' + translatey + 'px) rotate(' + rotate + 'deg); -webkit-transform: translate(' + translatex + 'px,' + translatey + 'px) rotate(' + rotate + 'deg); transform: translate(' + translatex + 'px,' + translatey + 'px) rotate(' + rotate + 'deg); ';
	}
	if (usedDir >= 0 && (light_source == "lantern" || light_source == "aviation")){
		if(usedDir >= 0 && usedDir <=360) {
				rotate = usedDir - 0;
		}/*
		if(usedDir >= 0 && usedDir < 0){
			rotate = usedDir - 0 + 360;
		}*/
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
