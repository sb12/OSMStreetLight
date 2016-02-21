function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function get_light_lit(value){
	var result;
	if (value == "dusk-dawn"){
		result = "nachts und in der Dämmerung"
	}
	else if (value == "demand"){
		result = "auf Anforderung"
	}
	else {
		result = value;
	}
	return result;
}

function get_light_method(value){
	var result;
	if (value == "high_pressure_sodium" || value == "high-pressure_sodium"){
		result = "Natriumdampf-Hochdrucklampe"
	}
	else if (value == "low_pressure_sodium" || value == "low-pressure_sodium"){
		result = "Natriumdampf-Niederdrucklampe"
	}
	else if (value == "LED"){
		result = "LED"
	}
	else if (value == "metal_halide" || value == "metal-halide"){
		result = "Halogen-Metalldampflampe"
	}
	else if (value == "fluorescent"){
		result = "Leuchtstofflampe"
	}
	else if (value == "mercury"){
		result = "Quecksilberdampflampe"
	}
	else if (value == "electric"){
		result = "elektrisch"
	}
	else if (value == "gas" || value == "gaslight"){
		result = "Gaslaterne"
	}
	else {
		result = value;
	}
	return result;
}

function get_light_mount(value){
	var result;
	if (value == "straight mast" || value == "straight_mast"){
		result = "Gerader Mast"
	}
	else if (value == "bent mast" || value == "bent_mast"){
		result = "Gebogener Mast"
	}
	else if (value == "cast steel mast" || value == "cast_steel_mast"){
		result = "Stahlgussmast"
	}
	else if (value == "mast" || value == "pole"){
		result = "Mast"
	}
	else if (value == "wall_mounted" || value == "wall"){
		result = "Wand"
	}
	else if (value == "suspended"){
		result = "hängend"
	}
	else if (value == "ceiling"){
		result = "an der Decke"
	}
	else {
		result = value;
	}
	return result;
}


function getMarkerIcon(L,light_source,light_method,light_direction,light_count,ref){

	if(light_source == "floodlight")
	{
		var iconclass="floodlight";
	}
	else
	{
		if(light_count == 2)
		{
			var iconclass="streetlight2";
		}
		else if(light_count == 3)
		{
			var iconclass="streetlight3";
		}
		else if(light_count == 4)
		{
			var iconclass="streetlight4";
		}
		else
		{
			var iconclass="streetlight1";
		}
	}
	
	colour_hue = "10";
	colour_brightness = "100";
	colour_saturate = "1";
	
	if(light_method == "LED")
	{
		colour_hue = 210;
		colour_brightness = "100";
		colour_saturate = "0.2";
	}
	if(light_method == "fluorescent")
	{
		colour_hue = "60";
		colour_brightness = "100";
		colour_saturate = "0.3";
	}
	if(light_method == "gas" || light_method == "gaslight")
	{
		colour_hue = "3";
		colour_brightness = "60";
		colour_saturate = "0.9";
	}
	if(light_method == "metal_halide" || light_method == "metal-halide")
	{
		colour_hue = "195";
		colour_brightness = "100";
		colour_saturate = "0.1";
	}
	if(light_method == "high_pressure_sodium" || light_method == "high-pressure_sodium" || light_method == "sodium_vapor")
	{
		colour_hue = "4";
		colour_brightness = "200";
		colour_saturate = "0.8";
	}
	if(light_method == "mercury")
	{
		colour_hue = "200";
		colour_brightness = "100";
		colour_saturate = "0.4";
	}
	var direction = "";
	var rotate = "";
	var usedDir =""
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
    if(usedDir >= 135 && usedDir <=360)
    {
    	rotate = usedDir - 135;
	}
	if(usedDir >= 0 && usedDir < 135)
	{
		rotate = usedDir - 135 + 360;
	}
	if (rotate && light_source == "floodlight")
	{
		var translatex = Math.cos( ( 45 + rotate ) * 2 * Math.PI / 360 ) * Math.sqrt( 2 * 24 * 24 );
		var translatey = Math.sin( ( 45 + rotate ) * 2 * Math.PI / 360 ) * Math.sqrt( 2 * 24 * 24 );
		direction = '-ms-transform: translate(' + translatex + 'px,' + translatey + 'px) rotate(' + rotate + 'deg); -webkit-transform: translate(' + translatex + 'px,' + translatey + 'px) rotate(' + rotate + 'deg); transform: translate(' + translatex + 'px,' + translatey + 'px) rotate(' + rotate + 'deg); ';
	}
	if ( map.getZoom() < 18)
	{
		ref ="";
	}
	var Icon = L.divIcon({
		className: iconclass,
		html: '<div style="-webkit-filter: hue-rotate(' + colour_hue + 'deg) brightness(' + colour_brightness + ') saturate(' + colour_saturate + ');filter: hue-rotate(' + colour_hue + 'deg) brightness(' + colour_brightness + ') saturate(' + colour_saturate + ');' + direction + '">' + ref + '</div>',
		iconSize: [48, 48],
		iconAnchor:   [24, 24],
		popupAnchor:  [0, -5]
		});
	return Icon;
}








