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
	if (value == "high_pressure_sodium" || value == "high-pressure_sodium"){
		result =  i18next.t("lamp_method_high_presssure_sodium");
	}
	else if (value == "low_pressure_sodium" || value == "low-pressure_sodium"){
		result =  i18next.t("lamp_method_low_presssure_sodium");
	}
	else if (value == "sodium" || value == "sodium"){
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
	else if (value == "mercury"){
		result =  i18next.t("lamp_method_mercury");
	}
	else if (value == "electric"){
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


function getMarkerIcon(L,light_source,light_method, light_colour,light_direction,light_shape,ref){

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

	if(light_source == "xmas")
	{
		colour_hue = "0";
		colour_brightness = "1.0";
		colour_saturate = "1.0";
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
	if(light_method == "LED")
	{
		colour_url = "_led";
	}
	if(light_method == "fluorescent")
	{
		colour_url = "_fluorescent";
	}
	if(light_method == "gas" || light_method == "gaslight")
	{
		colour_url = "_gas";
	}
	if(light_method == "metal_halide" || light_method == "metal-halide")
	{
		colour_url = "_white";
	}
	if(light_method == "high_pressure_sodium" || light_method == "high-pressure_sodium" || light_method == "sodium_vapor" || light_method == "sodium")
	{
		colour_url = "_orange";
	}
	if(light_method == "mercury")
	{
		colour_url = "_mercury";
	}
	var direction = "";
	var rotate = "";
	var usedDir = ""
	var iconOffset = 0;
	var iconSize = 0;
	var iconClass = "";

	if ( map.getZoom() == 19)
	{
		iconClass = "light_19 " + iconClass;
		iconOffset = 40;
		iconSize = 80;		
		refclass = "lamp_ref_19";
	}
	else if ( map.getZoom() == 18)
	{
		iconClass = "light_18 " + iconClass;
		iconOffset = 34;	
		iconSize = 68;	
		refclass = "lamp_ref_18";
	}
	else if ( map.getZoom() == 17)
	{
		iconClass = "light_17 " + iconClass;
		iconOffset = 28;	
		iconSize = 56;	
		refclass = "lamp_ref_17";
	}
	else if ( map.getZoom() == 16)
	{
		iconClass = "light_16 " + iconClass;
		iconOffset = 22;	
		iconSize = 44;	
		refclass = "lamp_ref_none";
	}
	else if ( map.getZoom() == 15)
	{
		iconClass = "light_15 " + iconClass;
		iconOffset = 16;
		iconSize = 32;
		refclass = "lamp_ref_none";
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








