// Create a control to select language

L.Control.LanguageSelector = L.Control.extend({
    options: {
        position: 'topright'
    },
    onAdd: function () {
        
        var language_selector_div = L.DomUtil.create('div', 'leaflet-control-layers');
        language_selector_div.innerHTML = '<select id="langselect"><option onclick="i18next.changeLanguage(\'en\')" value="en">EN </option><option onclick="i18next.changeLanguage(\'de\')" value="de">DE </option></select>';
        $(language_selector_div).attr('id', 'lang');
        
        return language_selector_div;
    }
});
