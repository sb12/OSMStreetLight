# Straßenlaternen in OSM / Street lamps in OSM

[Testinstallation / Demo page](https://sb12.github.io/OSMStreetLight/) | [Quellcode / Source code repository](https://github.com/sb12/OSMStreetLight)

Diese Karte zeigt Straßenlaternen und ihre Eigenschaften in den Daten der [OpenStreetMap](http://osm.org). Es werden Betreiber, Referenznummern und Details zu den verwendeten Leuchtmitteln angezeigt.

This map shows street lamps and their settings in the data of [OpenStreetMap](http://osm.org). It shows e.g. operators, reference numbers and details about the used lights.</p>


## Unterstützte Tags / Supported Tags

Es werden zur Zeit die folgenden Tags für die Straßenlaternen-Ebene unterstützt:

Currently the following tags are supported for the street light layer:

* `highway = street_lamp` | `light_source=lantern|floodlight|*` | `tower:type=lighting`
* `ref|lamp_ref=*`
* `operator|lamp_operator=*`
* `start_date=*`
* `light:colour=white|orange|yellow|blue|red|green`
* `light:method|lamp_type=high_pressure_sodium|high-pressure_sodium|SON|HPSV|low_pressure_sodium|low-pressure_sodium|SOX|sodium|sodium_vapor|LED|led|metal-halide|metal_halide|fluorescent|incandescent|mercury|electric|electrical|gas|gaslight`
* `light:mount|lamp_mount|support=straight mast|straight_mast|bent mast|bent_mast|cast steel mast|cast_steel_mast|mast|pole|power_pole|wall_mounted|wall|suspended|wire|ceiling|ground`
* `light:count=1|2|3|4`
* `light:direction|direction=*`
* `light:lit=dusk-dawn|demand|*`
* `manufacturer=*`
* `model|lamp_model:de=*`
* `height|light:height=*`
* `width=*`
* `support=*`


Es werden zur Zeit die folgenden Tags für die Beleuchtete-Straßen- und Unbeleuchtete-Straßen-Ebene unterstützt:

Currently the following tags are supported for the lit and unlit streets layer:

* `highway=*` 
* `lit=yes|sunrise-sunset|dusk-dawn`
* `lit=24/7` _(with dotted outline)_
* `lit=automatic` _(dotted)_
* `lit=limited|interval` _(dashed)_
* `lit=no|disused` _(unlit, black)_


Es dürfen gerne weitere Keys oder Values über Pull Requests vorgeschlagen werden.

Feel free to propose more key or values by a Pull Request.

## Einstellungen / Settings

Die folgenden Einstellungen können in `settings.json` geändert werden:

The following settings can be changed in `settings.json`:

* `show_geolocate_button` = `true`|`false` Disable the geolocate button (e.g. if only http is available as most modern browsers will deny geolocation without https)

## License

The code for this project is based on OSMfahrkartenautomaten *( [Testinstallation](https://ubahnverleih.github.io/OSMfahrkartenautomaten/) | [Quellcode](https://github.com/ubahnverleih/OSMfahrkartenautomaten) )* by [ubahnverleih](https://github.com/ubahnverleih).


**MIT-License**

Copyright (c) 2013 ubahnverleih, 2015 sb12

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
