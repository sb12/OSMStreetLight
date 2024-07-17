// Create a control to select language

L.Control.LanguageSelector = L.Control.extend({
    options: {
        position: 'topright'
    },
    onAdd: function () {
        
        var language_selector_div = L.DomUtil.create('div', 'leaflet-control-layers');
        language_selector_div.innerHTML = '<select id="langselect" onchange="updateLng()">'+
            '<option value="en">EN</option>'+
            '<option value="de">DE</option>'+
            '<option value="nl">NL</option>'+
            '<option value="ru">RU</option>'+
            '</select>';
        $(language_selector_div).attr('id', 'lang');
        
        return language_selector_div;
    }
});
