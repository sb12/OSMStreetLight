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
		g_showData = false;
		//update opacity
		current_layer.setOpacity(g_opacityNoData);
		$("#opacity_slider").slider("option", "value", g_opacityNoData * 100);	
	}
	
	//handle zoom warning
	if (zoomWarning)
	{
		//update zoomtext
		let textZoom = "Zoom in to load data";
		if(i18next.isInitialized && zoomWarning < 4){
			textZoom = i18next.t("zoomtext_" + zoomWarning);
		}
		$( "#zoomtext" ).text(textZoom)
		
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
		g_showData = true;
		$( "#zoomwarning_cont" ).fadeOut(500);
		current_layer.setOpacity(g_opacityHasData);
		$("#opacity_slider").slider("option", "value", g_opacityHasData * 100);
	}
	
}

function loadLowZoomDataOnce() {
	
	g_showStreetLightsLowZoomOnce = true;
	g_showData = true;
	let coords = map.getBounds();
	let lefttop = coords.getNorthWest(), rightbottom = coords.getSouthEast();
	let lat1 = lefttop.lat, lon1 = lefttop.lng, lat2 = rightbottom.lat, lon2 = rightbottom.lng;
	
	map.addLayer(StreetLightsLowZoomLayer);
	loadDataLowZoom('[bbox:' + lat2 + ',' + lon1 + ',' + lat1 + ',' + lon2 + '];');
	
	$( "#zoomwarning_cont" ).fadeOut(500);
	current_layer.setOpacity(g_opacityHasData);
	$("#opacity_slider").slider("option", "value", g_opacityHasData * 100);
}	

function clearLowZoomData() {
	g_showStreetLightsLowZoomOnce = false;
	g_showData = false;
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
	let MarkerArray = new Array();
	let CoordObj = new Object();
	StreetLightsLayer.clearLayers();
	AviationLayer.clearLayers();
	LitStreetsLayer.clearLayers();
	UnLitStreetsLayer.clearLayers();

	$(data).find('node,way').each(function() {
		let EleID = $(this).attr("id");
		let EleCoordArray = new Array();
		let EleType = "";
		let EleLat, EleLon, EleObj;

		if ($(this).attr("lat")) { // Node
			EleType = "node"
			EleLat = $(this).attr("lat");
			EleLon = $(this).attr("lon");
			EleObj = new Object();
			EleObj["lat"] = EleLat;
			EleObj["lon"] = EleLon;
			CoordObj[EleID] = EleObj;
		} else { // Way
			EleType = "way";
			$(this).find('nd').each(function() {
				let NdRefID = $(this).attr("ref");
				EleCoordArray.push([CoordObj[NdRefID]["lat"], CoordObj[NdRefID]["lon"]]);
			});
		}

		let EleText = "";
		let tagHighway, tagAeroway, tagOperator, tagRef, tagStartDate, tagManufacturer, tagModel, tagHeight, tagWidth, tagLightColour, tagLightCount, tagLightDirection, tagLightFlash, tagLightHeight, tagLightLit, tagLightShape, tagLightMethod, tagLampMount, tagLightSource, tagNavigationaid, tagLit, tagArea;

		$(this).find('tag').each(function(){
			let EleKey = $(this).attr("k");
			let EleValue = $(this).attr("v");
			if ( EleKey == "highway") {
				tagHighway = EleValue;
			} else if (EleKey == "aeroway") {
				tagAeroway = EleValue;
			} else if ((EleKey == "operator" && !tagOperator) || EleKey == "lamp_operator") {
				tagOperator = EleValue;
			} else if ((EleKey == "ref" && !tagRef) || EleKey == "lamp_ref") {
				tagRef = EleValue;
			} else if (EleKey == "start_date") {
				tagStartDate = EleValue;
			} else if (EleKey == "manufacturer") {
				tagManufacturer = EleValue;
			} else if (EleKey == "lamp_model" || EleKey == "lamp_model:de" || EleKey == "model") {
				tagModel = EleValue;
			} else if (EleKey == "height") {
				tagHeight = EleValue;
			} else if (EleKey == "width") {
				tagWidth = EleValue;
			} else if (EleKey == "light:count") {
				tagLightCount = EleValue;
			} else if (EleKey == "light:colour") {
				tagLightColour = EleValue;
			} else if ((EleKey == "direction" && !tagLightDirection) || EleKey == "light:direction") {
				tagLightDirection = EleValue;
			} else if (EleKey == "light:height") {
				tagLightHeight = EleValue;
			} else if (EleKey == "light:method" || EleKey == "lamp_type") {
				tagLightMethod = EleValue;
			} else if (EleKey == "light:mount" || EleKey == "lamp_mount" || EleKey == "support") {
				tagLampMount = EleValue;
			} else if (EleKey == "light:lit") {
				tagLightLit = EleValue;
			} else if (EleKey == "light:shape") {
				tagLightShape = EleValue;
			} else if (EleKey == "light:flash") {
				tagLightFlash = EleValue;
			} else if (EleKey == "light:character" && EleValue != "fixed") {
				tagLightFlash = "yes";
			} else if (EleKey == "light_source") {
				tagLightSource = EleValue;
			} else if (EleKey == "tower:type" && !tagLightSource) {
				if (EleValue == "lighting")
				{
					tagLightSource = "floodlight";
				}
			} else if (EleKey == "navigationaid") {
				tagNavigationaid = EleValue;
			} else if (EleKey == "xmas:feature") {
				tagLightSource = "xmas";
			} else if (EleKey == "area") {
				tagArea = EleValue;
			} else if (EleKey == "lit") {
				tagLit = EleValue
			}

		});

		if (tagHighway == "street_lamp" && !tagLightSource) {
			tagLightSource = "lantern";
		}

		if (tagAeroway == "navigationaid" && !tagLightSource) {
			tagLightSource = "aviation";
			if (!tagNavigationaid){ // unknown navigationaid
				tagNavigationaid = "unknown";
			}
		}
		
		if (!tagLightCount) {
			tagLightCount = 1;
		}

		if (tagLightSource) {
			
			let textLightType = "", textStartDate = "", textManufacturer = "", textModel = "", textHeight = "", textLightHeight = "", textWidth = "", textLightMethod = "", textLampMount = "", textLightLit = "", textLightCount = "";
			
			if(tagLightSource == "lantern") {
				textLightType = i18next.t("lamp_lantern");
			} else if(tagLightSource == "floodlight") {
				textLightType = i18next.t("lamp_floodlight");
			} else if(tagLightSource == "warning") {
				textLightType = i18next.t("lamp_warning");
			} else if(tagLightSource == "aviation") {
				if(tagNavigationaid == "als") { // Approach Lighting System
					textLightType = i18next.t("lamp_aviation_als");
				} else if(tagNavigationaid == "papi") { // Precision Approach Path Indicator
					textLightType = i18next.t("lamp_aviation_papi");
				} else if(tagNavigationaid == "vasi") { // Visual Approach Slope Indicator
					textLightType = i18next.t("lamp_aviation_vasi");
				} else if(tagNavigationaid == "txe") { // Taxiway Edge Light
					textLightType = i18next.t("lamp_aviation_txe");
				} else if(tagNavigationaid == "txc") { // Taxiway Centre Light
					textLightType = i18next.t("lamp_aviation_txc");
				} else if(tagNavigationaid == "rwe") { // Runway Edge Light
					textLightType = i18next.t("lamp_aviation_rwe");
				} else if(tagNavigationaid == "rwc") { // Runway Centre Light
					textLightType = i18next.t("lamp_aviation_rwc");
				} else if(tagNavigationaid == "tdz") { // Touchdown Zone
					textLightType = i18next.t("lamp_aviation_tdz");
				} else if(tagNavigationaid == "rgl") { // Runway Guard Light
					textLightType = i18next.t("lamp_aviation_rgl");
				} else if(tagNavigationaid == "beacon") { // Aerodrome Beacon
					textLightType = i18next.t("lamp_aviation_beacon");
				} else {
					textLightType = i18next.t("lamp_aviation");
				}
			} else {
				textLightType = i18next.t("lamp_unknown");
			}

			if (!tagOperator) {
				tagOperator = "<i>" + i18next.t("unknown") + "</i>";
			}
			

			//Tags that are only shown when available
			if (tagStartDate) {
				textStartDate = "<tr><td><b>" + i18next.t("lamp_start_date") + ": </b></td><td>" + tagStartDate + "</td></tr>";
			}
			if (tagManufacturer) {
				textManufacturer = "<tr><td><b>" + i18next.t("lamp_manufacturer") + ": </b></td><td>" + tagManufacturer + "</td></tr>";
			}
			if (tagModel) {
				textModel = "<tr><td><b>" + i18next.t("lamp_model") + ": </b></td><td>" + tagModel + "</td></tr>";
			}
			if (tagHeight) {
				textHeight = "<tr><td><b>" + i18next.t("lamp_height") + ": </b></td><td>" + tagHeight + " m</td></tr>";
			}
			if (tagLightHeight) {
				textLightHeight = "<tr><td><b>" + i18next.t("lamp_light_height") + ": </b></td><td>" + tagLightHeight + " m</td></tr>";
			}
			if (tagWidth) {
				textWidth = "<tr><td><b>" + i18next.t("lamp_width") + ": </b></td><td>" + tagWidth + "</td></tr>";
			}
			if (tagLightMethod) {
				textLightMethod = "<tr><td><b>" + i18next.t("lamp_method") + ": </b></td><td>" + getLightMethod(tagLightMethod) + "</td></tr>";
			}
			if (tagLampMount) {
				textLampMount = "<tr><td><b>" + i18next.t("lamp_mount") + ": </b></td><td>" + getLightMount(tagLampMount) + "</td></tr>";
			}
			if (tagLightLit) {
				textLightLit = "<tr><td><b>" + i18next.t("lamp_time") + ": </b></td><td>" + getLightLit(tagLightLit) + "</td></tr>";
			}
			if (tagLightCount > 1) {
				textLightCount = "<tr><td><b>" + i18next.t("lamp_count") + ": </b></td><td>" + tagLightCount + "</td></tr>";
			}
			
			// Restrict number of shown light sources for single points to reduce clutter
			if (tagLightCount > 1) {
				tagLightCount = Math.min(tagLightCount, LIGHT_COUNT_MAX)
			}
			if (!tagRef && tagRef !== 0) {
				tagRef = ""
			}
			EleText =
				"<b>" + textLightType + " " + tagRef + "</b><br>" +
				"<div class='infoblock'><table>" +
				"<tr><td><b>" + i18next.t("lamp_operator") + ": </b></td><td>" + tagOperator + "</td></tr>" +
				textLightMethod +
				textLampMount +
				textStartDate +
				textManufacturer +
				textModel +
				textHeight +
				textWidth +
				textLightHeight +
				textLightLit +
				textLightCount +
				"</table></div>" +
				"<br><a href='#' onclick='openinJOSM(\""+EleType+"\",\""+EleID+"\")'>edit in JOSM</a> | <a href='https://www.openstreetmap.org/"+EleType+"/"+EleID+"'>show in OSM</a>"
				;
			
			if (!tagLightHeight && tagHeight) {
				tagLightHeight = tagHeight;
			}

			if($.inArray(EleID, MarkerArray) == -1) {
				let lightDirectionArray = [], refArray = []
				if (tagLightDirection) {
					lightDirectionArray = tagLightDirection.split(";");
				}
				if (tagRef) {
					refArray = tagRef.split(";")
				}
 
				// Handle lights with only one direction given
				let isSingleDir = false;
				let posDirection0 = 0;
				if (lightDirectionArray.length == 1 && tagLightCount > 1 && (lightDirectionArray[0] > 0 || lightDirectionArray[0] === 0))
				{
					isSingleDir = true;
					posDirection0 = lightDirectionArray[0] // keep first value in memory
				}
				
				let i = tagLightCount; 
				let j = 0;
				let posDirection = new Array();
				while (i > 0) {
					let EleLatNew, EleLonNew;
					// Positioning of multiple lights at same spot (tagLightCount > 1)
					if (tagLightCount > 1) {
						let posDistance = 0;
						if (isSingleDir) { //only one direction value given -> assume all lights are parallel:		
							posDirection[j] = posDirection0 * 1 + 90;
							posDistance = 1.5 * j - ( (1.5 * tagLightCount) / 2 );
							if ( posDirection[j] > 360 ) {
								posDirection[j] = posDirection[j] - 360;
							}
						} else if (lightDirectionArray[j] === 0 || (lightDirectionArray[j] > 0 && lightDirectionArray[j] <= 360 )) {
							posDirection[j] = lightDirectionArray[j];
							posDistance = 1.5;
						} else if (j > 0) {
							posDirection[j] = posDirection[j-1] * 1 + 360 / tagLightCount;
							posDistance = 1.5 ;
							if ( posDirection[j] > 360 ) {
								posDirection[j] = posDirection[j] - 360;
							}
						} else {
							posDirection[j] = 0;
							posDistance = 1.5;
						}
						[EleLatNew,EleLonNew] = addLatLngDistanceM(EleLat,EleLon,(posDirection[j]),posDistance);
					} else {
						[EleLatNew,EleLonNew] = [EleLat,EleLon];
					}

					if (!lightDirectionArray[j]) {
						lightDirectionArray[j] = lightDirectionArray[j-1];
					}
					if (!refArray[j]) {
						refArray[j] = "";
					}

					let markerLocation = new L.LatLng(EleLatNew,EleLonNew);
					
					let Icon = getMarkerIcon(L,tagLightSource, tagLightMethod, tagLightColour, tagLightFlash, lightDirectionArray[j], tagLightShape, tagLightHeight, tagNavigationaid, refArray[j]);
					let marker = new L.Marker(markerLocation,{icon : Icon});

					if(EleText!="")
					{
						marker.bindPopup(EleText);
					}
						
					if(tagLightSource == "aviation" || tagLightSource == "warning") {
						AviationLayer.addLayer(marker);
					} else {
						StreetLightsLayer.addLayer(marker);
					}

					MarkerArray.push(EleID);

					i = i - 1;
					j = j + 1;
				}

			}

		} else if (tagLit == "no" || tagLit == "disused") {
			// Draw ways, which have no popup
			if(tagArea) {
				let shape = L.polygon(EleCoordArray.map(p => new L.LatLng(p[0], p[1])), {
					stroke: false, fillColor: '#000000', fillOpacity: 0.4,
					weight: 3
				})
				UnLitStreetsLayer.addLayer(shape);
			} else {
				let line = L.polyline(EleCoordArray.map(p => new L.LatLng(p[0], p[1])), {
					color: '#111111',
					weight: 3
				})
				UnLitStreetsLayer.addLayer(line)
			}
		} else if (tagLit == "yes" || tagLit == "24/7" || tagLit == "automatic" || tagLit == "limited" || tagLit == "sunset-sunrise" || tagLit == "dusk-dawn" || tagLit == "interval") {
			// Draw ways, which have no popup
			if (tagLit == "automatic") {
				strokeDashArray = "2 3";
				strokeColor = "#BBBBBB";
			} else if (tagLit == "limited" || tagLit == "interval") {
				strokeDashArray = "8";
				strokeColor = "#BBBBBB";
			} else {
				strokeDashArray = "0";
				strokeColor = "#BBBBBB";
			}
			if (tagArea) {
				let shape = L.polygon(EleCoordArray.map(p => new L.LatLng(p[0], p[1])), {
					stroke: false, fillColor: strokeColor, fillOpacity: 0.4,
					weight: 3,
					dashArray: strokeDashArray
				})
				LitStreetsLayer.addLayer(shape);
			} else {
				let line = L.polyline(EleCoordArray.map(p => new L.LatLng(p[0], p[1])), {
					color: strokeColor,
					weight: 3,
					dashArray: strokeDashArray
				})
				LitStreetsLayer.addLayer(line)
				
				if (tagLit == "24/7") { // dotted outline for 24/7
					let line = L.polyline(EleCoordArray.map(p => new L.LatLng(p[0], p[1])), {
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
	let MarkerArray = new Array();
	let CoordObj = new Object();
	
	let iconClass = "light_13";
	let iconSize = 8;
	let LightsData = []
	
	$(data).find('node').each(function(){
		let EleID = $(this).attr("id");
		let EleCoordArray = new Array();
		let EleLat, EleLon, EleType;
		let EleObj = new Object();

		//Node
		if ($(this).attr("lat"))
		{
			EleLat = $(this).attr("lat");
			EleLon = $(this).attr("lon");
			EleType = "node";
			EleObj["lat"] = EleLat;
			EleObj["lon"] = EleLon;
			CoordObj[EleID] = EleObj;
			let markerLocation = new L.LatLng(EleLat,EleLon);
			let markerIcon = L.divIcon({
				className: iconClass,
				html: '<div style="background-image: url(\'./img/electric_white.svg\');background-repeat: no-repeat;"> </div>',
				iconSize: [iconSize, iconSize],
				iconAnchor:   [0, 0],
				});
			let marker = new L.Marker(markerLocation,{icon : markerIcon});
			
		}
		
		LightsData.push({"lat" : EleLat, "lng" : EleLon, "count" : 1});
	});

	//console.log(LightsData)
	let lowZoomData = {
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

function addLatLngDistanceM(EleLat,EleLon,angleDeg,distance) {
	const latRad = EleLat * Math.PI / 180;
	const degLatPerM = 1 / ( 111132.92 - 559.82 * Math.cos( 2 * latRad ) + 1.175 * Math.cos( 4 * latRad ) - 0.0023 * Math.cos( 6 * latRad ) );
	const degLonPerM = 1 / ( 111412.84 * Math.cos ( latRad ) - 93.5 * Math.cos ( 3 * latRad ) + 0.118 * Math.cos ( 5 * latRad ) );
	const angleRad = angleDeg * Math.PI / 180;
	
	let latDistM = 0, lonDistM = 0; // Default fallback values

	
	latDistM = Math.cos ( angleRad ) * distance;
	lonDistM = Math.sin ( angleRad ) * distance;

	EleLat = EleLat * 1 + latDistM * degLatPerM;
	EleLon = EleLon * 1 + lonDistM * degLonPerM;

	return [EleLat , EleLon];
}

function isNumeric(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

function getLightLit(value) {
	let result;
	if (value == "dusk-dawn") {
		result = i18next.t("lamp_time_duskdawn");
	} else if (value == "demand") {
		result = i18next.t("lamp_time_demand");
	} else {
		result = value;
	}
	return result;
}

function getLightMethod(value) {
	let result;
	if (value == "high_pressure_sodium" || value == "high-pressure_sodium" || value == "HPSV" || value == "SON") {
		result =  i18next.t("lamp_method_high_presssure_sodium");
	} else if (value == "low_pressure_sodium" || value == "low-pressure_sodium" || value == "SOX") {
		result =  i18next.t("lamp_method_low_presssure_sodium");
	} else if (value == "sodium" || value == "sodium_vapor") {
		result =  i18next.t("lamp_method_sodium");
	} else if (value == "LED" || value == "led") {
		result =  i18next.t("lamp_method_led");
	} else if (value == "metal_halide" || value == "metal-halide") {
		result =  i18next.t("lamp_method_metal_halide");
	} else if (value == "fluorescent") {
		result =  i18next.t("lamp_method_fluorescent");
	} else if (value == "incandescent") {
		result =  i18next.t("lamp_method_incandescent");
	} else if (value == "mercury") {
		result =  i18next.t("lamp_method_mercury");
	} else if (value == "electric" || value == "electrical") {
		result =  i18next.t("lamp_method_electric");
	} else if (value == "gas" || value == "gaslight") {
		result =  i18next.t("lamp_method_gas");
	} else {
		result = value;
	}
	return result;
}

function getLightMount(value) {
	let result;
	if (value == "straight mast" || value == "straight_mast") {
		result =  i18next.t("lamp_mount_straight_mast");
	} else if (value == "bent mast" || value == "bent_mast") {
		result =  i18next.t("lamp_mount_bent_mast");
	} else if (value == "cast steel mast" || value == "cast_steel_mast") {
		result =  i18next.t("lamp_mount_cast_steel_mast");
	} else if (value == "mast" || value == "pole") {
		result =  i18next.t("lamp_mount_mast");
	} else if (value == "power_pole") {
		result =  i18next.t("lamp_mount_power_pole");
	} else if (value == "wall_mounted" || value == "wall") {
		result =  i18next.t("lamp_mount_wall");
	} else if (value == "suspended" || value == "wire") {
		result =  i18next.t("lamp_mount_wire");
	} else if (value == "ceiling") {
		result =  i18next.t("lamp_mount_ceiling");
	} else if (value == "ground") {
		result =  i18next.t("lamp_mount_ground");
	} else {
		result = value;
	}
	return result;
}

function getMarkerIcon(L,lightSource,lightMethod,lightColour,lightFlash,lightDirection,lightShape,lightHeight,navigationaid,ref) {
	let symbolURL = "electric";
	if (lightSource == "xmas") {
		symbolURL = "xmastree";
	} else if (navigationaid == "beacon") {
		symbolURL = "beacon";
	} else if (lightSource == "floodlight") {
		symbolURL = "floodlight";
		if (lightDirection) {
			symbolURL = "floodlight_directed";
		}
	} else if ((lightSource == "lantern" || lightSource == "aviation") && lightShape == "directed" && lightDirection) {
		symbolURL = "electric_directed";
		if (lightFlash && lightFlash != "no") {
			symbolURL = "electric_directed_flashing";
		}
	} else {
		if (lightFlash && lightFlash != "no") {
			symbolURL = "electric_flashing";
		}
	}

	let colourURL = "";
	
	if (lightColour) {
		// convert Kelvin light temperatures to colour values
		if (lightColour.substr(-1) == "K") {
			let KelvinLength = lightColour.indexOf("K");
			let lightColourK = Number(lightColour.substr(0,KelvinLength));
			if (!lightColourK.isNaN) {
				if (lightColourK < 2000) {
					colourURL = "_gas";
				} else if (lightColourK < 2600) {
					colourURL = "_orange";
				} else if (lightColourK < 3000) {
					colourURL = "_fluorescent";
				} else if (lightColourK < 4000) {
					colourURL = "_led";
				} else if (lightColourK > 5600) {
					colourURL = "_mercury";
				} else {
					colourURL = "_white";
				}
			}
		}   
		// add verbal colours:
		if (lightColour == "white") {
			colourURL = "_white";
		} else if (lightColour == "orange") {
			colourURL = "_orange";
		} else if (lightColour == "blue") {
			colourURL = "_blue";
		} else if (lightColour == "red") {
			colourURL = "_red";
		} else if (lightColour == "green") {
			colourURL = "_green";
		} else if (lightColour == "yellow") {
			colourURL = "_yellow";
		}
	}
	
	// default/adapted light colours for different light methods:
	if (lightMethod == "LED" || lightMethod == "led") {
		if (!colourURL || colourURL == "_white") {
			colourURL = "_led";
		}
	} else if (lightMethod == "fluorescent") {
		if (!colourURL || colourURL == "_white") {
			colourURL = "_fluorescent"
		}
	} else if (lightMethod == "gas" || lightMethod == "gaslight") {
		if (!colourURL || colourURL == "_orange" || colourURL == "_red") {
			colourURL = "_gas";
		}
	} else if (lightMethod == "metal_halide" || lightMethod == "metal-halide") {
		if (!colourURL) {
			colourURL = "_white";
		}
	} else if (lightMethod == "incandescent") {
		if (!colourURL) {
			colourURL = "_white";
		}
	} else if (lightMethod == "high_pressure_sodium" || lightMethod == "high-pressure_sodium" || lightMethod == "sodium_vapor" || lightMethod == "sodium") {
		if (!colourURL) {
			colourURL = "_orange";
		}
	} else if (lightMethod == "mercury") {
		if (!colourURL && colourURL!="white") {
			colourURL = "_mercury";
		}
	}
	// default light colour for warning lights if unset:
	if (lightSource == "warning") {
		if (!colourURL) {
			colourURL = "_red";
		}
	}
	// default light colours for aviation lights if unset:
	if(navigationaid == "txe") {
		if (!colourURL) {
			colourURL = "_blue";
		}
	} else if(navigationaid == "txc") {
		if (!colourURL) {
			colourURL = "_green";
		}
	} else if(navigationaid == "rwe") {
		if (!colourURL) {
			colourURL = "_white";
		}
	} else if(navigationaid == "rwc") {
		if (!colourURL) {
			colourURL = "_white";
		}
	} else if(navigationaid == "tdz") {
		if (!colourURL) {
			colourURL = "_white";
		}
	} else if(navigationaid == "rgl") {
		if (!colourURL) {
			colourURL = "_yellow";
		}
	} else if(navigationaid == "vasi" || navigationaid == "papi") {
		if (!colourURL) {
			colourURL = "_redwhite";
		}
	} else if(navigationaid == "beacon") {
		colourURL = "_white";
	}
	
	let directionCSS, directionDeg;
	let rotate = 0;
	let iconOffset = 0, iconSize = 0, iconClass = "";
	let zoomClass = 0;
	let refClass = "";
	
	if (map.getZoom() == 19) {
		//if (lightHeight > 10)
		zoomClass = 19;
		refClass = "lamp_ref_19_text";
		if (navigationaid == "beacon") {
			zoomClass = 21;
		} else if (navigationaid == "als" || navigationaid == "papi" || navigationaid == "vasi" || navigationaid == "rwe" || navigationaid == "rwc" || navigationaid == "tdz" || navigationaid == "rgl" || lightSource == "warning") {
			zoomClass = 17;
		} else if (navigationaid) {
			zoomClass = 16
		} else if (lightHeight >= 10) {
			zoomClass = 21;
		} else if (lightHeight >= 7) {
			zoomClass = 20;
		} else if (lightHeight <= 4) {
			zoomClass = 18;
		} else if (lightHeight <= 2) {
			zoomClass = 17;
		}
	} else if (map.getZoom() == 18) {  
		zoomClass = 18;
		refClass = "lamp_ref_18_text";
		if (navigationaid == "beacon") {
			zoomClass = 21;
		} else if (navigationaid == "als" || navigationaid == "papi" || navigationaid == "vasi" || navigationaid == "rwe" || navigationaid == "rwc" || navigationaid == "tdz" || navigationaid == "rgl" || lightSource == "warning") {
			zoomClass = 16;
		} else if (navigationaid) {
			zoomClass = 15
		} else if (lightHeight >= 10) {
			zoomClass = 20;
		} else if (lightHeight >= 7) {
			zoomClass = 19;
		} else if (lightHeight <= 4) {
			zoomClass = 17;
		} else if (lightHeight <= 2) {
			zoomClass = 16;
		}
	} else if (map.getZoom() == 17) {
		zoomClass = 17;
		refClass = "lamp_ref_17_text";
		if (navigationaid == "beacon") {
			zoomClass = 20;
		} else if (navigationaid == "als" || navigationaid == "papi" || navigationaid == "vasi" || navigationaid == "rwe" || navigationaid == "rwc" || navigationaid == "tdz" || navigationaid == "rgl" || lightSource == "warning") {
			zoomClass = 15;
		} else if (navigationaid) {
			zoomClass = 14;
		} else if (lightHeight >= 10) {
			zoomClass = 19;
		} else if (lightHeight >= 7) {
			zoomClass = 18;
		} else if (lightHeight <= 4) {
			zoomClass = 16;
		} else if (lightHeight <= 2) {
			zoomClass = 15;
		}
	} else if (map.getZoom() == 16) {
		zoomClass = 16;
		refClass = "lamp_ref_none";
		if (navigationaid == "beacon") {
			zoomClass = 19;
		} else if (navigationaid == "als" || navigationaid == "papi" || navigationaid == "vasi" || navigationaid == "rwe" || navigationaid == "rwc" || navigationaid == "tdz" || navigationaid == "rgl" || lightSource == "warning") {
			zoomClass = 14;
		} else if (navigationaid) {
			zoomClass = 13;
		} else if (lightHeight >= 10) {
			zoomClass = 18;
		} else if (lightHeight >= 7) {
			zoomClass = 17;
		} else if (lightHeight <= 4) {
			zoomClass = 15;
		} else if (lightHeight <= 2) {
			zoomClass = 14;
		}
	} else if (map.getZoom() <= 15) {
		zoomClass = 15;
		refClass = "lamp_ref_none";
		if (navigationaid == "beacon") {
			zoomClass = 18;
		} else if (navigationaid == "als" || navigationaid == "papi" || navigationaid == "vasi" || navigationaid == "rwe" || navigationaid == "rwc" || navigationaid == "tdz" || navigationaid == "rgl" || lightSource == "warning") {
			zoomClass = 13;
		} else if (navigationaid) {
			zoomClass = 12;
		} else if (lightHeight > 0) {
			if (lightHeight >= 10) {
				zoomClass = 17;
			} else if (lightHeight >= 7) {
				zoomClass = 16;
			} else if (lightHeight <= 4) {
				zoomClass = 14;
			} else if (lightHeight <= 2) {
				zoomClass = 13;
			}
		}
	}
	if (zoomClass == 21) {
		iconClass = "light_21 " + iconClass;
		iconOffset = 52;
		iconSize = 104;
		refClass = "lamp_ref_21 " + refClass;
	} else if (zoomClass == 20) {
		iconClass = "light_20 " + iconClass;
		iconOffset = 46;
		iconSize = 92;
		refClass = "lamp_ref_20 " + refClass;
	} else if (zoomClass == 19) {
		iconClass = "light_19 " + iconClass;
		iconOffset = 40;
		iconSize = 80;
		refClass = "lamp_ref_19 " + refClass;
	} else if (zoomClass == 18) {
		iconClass = "light_18 " + iconClass;
		iconOffset = 34;
		iconSize = 68;
		refClass = "lamp_ref_18 " + refClass;
	} else if (zoomClass == 17) {
		iconClass = "light_17 " + iconClass;
		iconOffset = 28;
		iconSize = 56;
		refClass = "lamp_ref_17 " + refClass;
	} else if (zoomClass == 16) {
		iconClass = "light_16 " + iconClass;
		iconOffset = 22;
		iconSize = 44;
		refClass = "lamp_ref_16 " + refClass;
	} else if (zoomClass == 15) {
		iconClass = "light_15 " + iconClass;
		iconOffset = 16;
		iconSize = 32;
		refClass = "lamp_ref_15 " + refClass;
	} else if (zoomClass == 14) {
		iconClass = "light_14 " + iconClass;
		iconOffset = 10;
		iconSize = 20;
		refClass = "lamp_ref_14 " + refClass;
	} else if (zoomClass == 13) {
		iconClass = "light_13 " + iconClass;
		iconOffset = 4;
		iconSize = 8;
		refClass = "lamp_ref_13 " + refClass;
	}

	if (lightDirection || lightDirection === 0) {
		let cardinal = new Object();
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

		if (cardinal.hasOwnProperty(lightDirection)) {
			directionDeg = cardinal[lightDirection];
		} else if (lightDirection > 0 && lightDirection <= 360) { // exclude 0 as it is used as fallback anyway
			directionDeg = lightDirection;
		} else {/* ignore to_street  to_crossing */
			directionDeg = 0
		}
	}
	if (directionDeg >= 0 && lightSource == "floodlight") {
		if(directionDeg >= 135 && directionDeg <=360) {
			rotate = directionDeg - 135;
		} else if(directionDeg >= 0 && directionDeg < 135) {
			rotate = directionDeg - 135 + 360;
		}
		let translateX = Math.cos( ( 45 + rotate ) * 2 * Math.PI / 360 ) * Math.sqrt( 2 * iconOffset * iconOffset );
		let translateY = Math.sin( ( 45 + rotate ) * 2 * Math.PI / 360 ) * Math.sqrt( 2 * iconOffset * iconOffset );
		directionCSS = '-ms-transform: translate(' + translateX + 'px,' + translateY + 'px) rotate(' + rotate + 'deg); -webkit-transform: translate(' + translateX + 'px,' + translateY + 'px) rotate(' + rotate + 'deg); transform: translate(' + translateX + 'px,' + translateY + 'px) rotate(' + rotate + 'deg); ';
	} else if (directionDeg >= 0 && (lightSource == "lantern" || lightSource == "aviation")){
		if(directionDeg >= 0 && directionDeg <=360) {
				rotate = directionDeg - 0;
		}
		let translateX = 0;//Math.cos( ( 45 + rotate ) * 2 * Math.PI / 360 ) * Math.sqrt( 2 * 24 * 24 );
		let translateY = 0;//Math.sin( ( 45 + rotate ) * 2 * Math.PI / 360 ) * Math.sqrt( 2 * 24 * 24 );
		directionCSS = '-ms-transform: translate(' + translateX + 'px,' + translateY + 'px) rotate(' + rotate + 'deg); -webkit-transform: translate(' + translateX + 'px,' + translateY + 'px) rotate(' + rotate + 'deg); transform: translate(' + translateX + 'px,' + translateY + 'px) rotate(' + rotate + 'deg); ';
	}
	if ( map.getZoom() < 17)
	{
		ref = "";
	}
	let Icon = L.divIcon({
		className: iconClass,
		html: '<div style="background-image: url(\'./img/' + symbolURL + colourURL + '.svg\');background-repeat: no-repeat;' + directionCSS + '"> </div><span class="' + refClass + '">' + ref + '</span>',
		iconSize: [iconSize, iconSize],
		iconAnchor:   [iconOffset, iconOffset],
		popupAnchor:  [0, -5]
	});
	return Icon;
}
