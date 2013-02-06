# Straßenlaternen in OSM

[Testinstallation](http://osmstreetlight.bplaced.net/) | [Quellcode](https://github.com/ubahnverleih/OSMfahrkartenautomaten) | [flattr](https://flattr.com/submit/auto?fid=4zqqyl&url=http%3A%2F%2Fosmstreetlight.bplaced.net%2F)

Diese Karte zeigt Straßenlaternen und ihre Eigenschaften in den Daten der [OpenStreetMap](http://osm.org). Es werden Betreiber, Referenznummern und Details zu den verwendeten Leuchtmitteln angezeigt.

## Unterstützte Tags

Es werden zur Zeit die folgenden Tags unterstützt:

* `highway = street_lamp` | `light_source=lantern|floodlight|*`

* `ref|lamp_ref=*`

* `operator|lamp_operator=*`

* `light:method|lamp_type=high_pressure_sodium|high-pressure_sodium|low_pressure_sodium|low-pressure_sodium|LED|metal-halide|metal_halide|fluorescent|mercury|electric|gas|gaslight`

* `light:mount|lamp_mount|support=straight mast|straight_mast|bent mast|bent_mast|cast steel mast|cast_steel_mast|mast|pole|wall_mounted|wall|suspended|ceiling`

* `light:count=1|2|3|4`

* `light:direction=*`

* `light:lit=dusk-dawn|demand|*`

* `manufacturer=*`

* `model|lamp_model:de=*`

Es dürfen gerne weitere Keys oder Values über Pull Requests vorgeschlagen werden.

## License

The code for this project is based on OSMfahrkartenautomaten *( [Testinstallation](http://osm.lyrk.de/fahrkartenautomaten/) | [Quellcode](https://github.com/ubahnverleih/OSMfahrkartenautomaten) | [flattr](https://flattr.com/submit/auto?user_id=ubahnverleih&url=http%3A%2F%2Fosm.lyrk.de%2FOSMfahrkartenautomaten) )* by [ubahnverleih](https://github.com/ubahnverleih).


**MIT-License**

Copyright (c) 2013 ubahnverleih, 2015 sb12

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
