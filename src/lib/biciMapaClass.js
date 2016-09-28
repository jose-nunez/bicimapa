var biciMapaClass = function(){
	var self = this;

	// self.myLocation;

	self.biciMapa;
	self.mapStyles = {actual:undefined,satelite:undefined,road:undefined};

	self.contextPopup;

	self.zonasPOI = {}; // Almacena el nombre de las zonas_capas que han sido cargadas desde server o cache
	self.zonasQueue = [];
	self.zZona;
	self.limitLoadZones;
	self.limitQueueLoadZones;
	self.alertLoadingZones;

	self.interfacesPOI = undefined;
	self.filterPOI = undefined;

	/*
	self.limitLoadCapas;
	self.zZonaCapas;
	self.zZonaRutas;
	*/

	self.listasPOI={};
	
	self.msg_cargandoPOI = undefined;
	
	self.rutaMarkers = {};
	self.colaboraMarker;

	// self.display_poi=false;
	// self.display_route=false;
	// self.display_route_aux=false;
	// self.display_poi_aux=false;
	
	self.displayType=false;
	self.POIQueue=[];
	self.capasQueue=[];
	self.displayType_aux=false;
	self.POIQueue_aux=[];
	// self.display_poi_aux=false;
	
	self.RUTA = {obj:undefined,layer:undefined};
	// self.RutaOSRM = undefined;

	self.editingPOI;
	self.aprovingPOI;
	self.antVersionPOI;

	self.gcService;
	self.geoCodingRequest = {};
	
	self.mensaje_getCoord;
	self.UID_boxSetting = undefined;

	self.icons = {};
	self.routeStyle = {engine:undefined,cicloway:undefined};
	
	self.minLocateAccuracy;

	// self.expiracionCache = 1000 * 3600  * 24  * 7 * 50; /*50 semanas*/

	self.key_instruction = 0;

	self.zonasDisplay = {};


	self.normalizeCoords = function(latlng){
		var lat = latlng.lat;
		var lng = latlng.lng;
		if(lng>180) lng = lng-360;
		else if(lng<-180) lng = lng+360;
		return new L.LatLng(lat,lng);
	}

	self.getListaPOI = function(listname){
		return self.listasPOI[listname];
	}

	self.cleanCacheRoutes = function(){
		var bicimapaRutas = amplify.store('bicimapaRutas');
		_.each(bicimapaRutas,function(rutaName){
			amplify.store(rutaName,null);
		});
		amplify.store('bicimapaRutas',null);
	}

	self.getCacheIds = function(){
		return amplify.store('bicimapaRutas');
	}

	self.switchClustering = function(){
		var displayed;
		//NO LLAMAR DIRECTO. DEBE SETEARSE LA VAR GLOBAL PRIMERO
		_.each(capasPOI,function(capaPOI){//SOBRE TODAS LAS ACTIVAS Y MOSTRADAS?
			displayed = self.isCapaDisplayed(capaPOI.nombre);
			self.setInterfazCapa(capaPOI.nombre);
			if(displayed) self.interfacesPOI.addLayer(capasPOI[capaPOI.nombre].interfaz);
			self.updateInterfazCapa(capaPOI.nombre);
		});
	}

	self.clearDummyMarkers = function(){
		_.each(biciMapaUI.getDummyMarkers(),function(dummyMarker){
			self.biciMapa.removeLayer(dummyMarker);
		});
		biciMapaUI.clearDummyMarkers();
	}

	self.removeDummyMarker = function(id){
		var dummyMarker = biciMapaUI.getDummyMarkers()[id];
		self.biciMapa.removeLayer(dummyMarker);
		biciMapaUI.removeDummyMarker(id);
	}

	self.dummyMarker = function(UID_box_latlng,text){
		var id = genUID();
		var latlng;
		if(_.isString(UID_box_latlng)){
			var marker = self.getMarker(UID_box_latlng);
			if(marker) latlng = marker.getLatLng();
			else latlng = self.biciMapa.getCenter();
		}
		else latlng = UID_box_latlng;

		var icon = new L.Icon.Default();
		var dummyMarker = new L.marker(latlng,{icon: icon,draggable:true,zIndexOffset:1000});
		
		dummyMarker.on('dragend',function(){
			this.bindPopup('['+this.getLatLng().lat+','+this.getLatLng().lng+']',{closeButton:false});
		});
		
		dummyMarker.on('contextmenu',function(){
			self.removeDummyMarker(id);
		});

		dummyMarker.bindPopup((text?text+'<br/>':'')+'['+dummyMarker.getLatLng().lat+','+dummyMarker.getLatLng().lng+']',{closeButton:false});

		biciMapaUI.addDummyMarkers(id,dummyMarker);
		self.biciMapa.addLayer(dummyMarker);
	}

	self.switchBounds = function(restrict){
		var southWest;
		var northEast;
		if(restrict){
			// Bordes del mapa corresponden al borde de zona Santiago
			southWest = new L.LatLng(-33.930827071342726,-72,-33.930827071342726);
			northEast = new L.LatLng(-33.14215083110535,-69.71786499023438);
			self.biciMapa.options.minZoom = 10;
		}
		else{
			/*southWest = new L.LatLng(-90,-180);
			northEast = new L.LatLng(90,180);*/
			southWest = new L.LatLng(-90,-360);
			northEast = new L.LatLng(90,360);
			self.biciMapa.options.minZoom = 2;
		}
		
		var bounds = new L.LatLngBounds(southWest, northEast);
		self.biciMapa.setMaxBounds(bounds);

	}

	self.unDisplayBounds = function(){
		var zonas_poligon = biciMapaUI.getDisplayBoundsLayers();
		_.each(zonas_poligon,function(zona_poligon){
			self.biciMapa.removeLayer(zona_poligon);
		});
		biciMapaUI.clearDisplayBoundsLayer();
	}
	self.displayBounds = function(){
		var startMarker = self.getMarker('start');
		var endMarker = self.getMarker('end');

		if(_.isUndefined(startMarker)){
			var errorcod=' (r50)';
			biciMapaUI.setMessage(''+errorcod,'Falta el punto de inicio','error');
			return;
		}
		if(_.isUndefined(endMarker)){
			var errorcod=' (r51)';
			biciMapaUI.setMessage(''+errorcod,'Falta el punto de termino','error');
			return;
		}

		var zona_poligon,coords,options;
		var x = startMarker.getLatLng();
		var y = endMarker.getLatLng();
		var NW = self.findNW(x,y);
		var SE = self.findSE(x,y);
		
		coords = [
			{lat:NW.lat,lng:NW.lng},
			{lat:NW.lat,lng:SE.lng},
			{lat:SE.lat,lng:SE.lng},
			{lat:SE.lat,lng:NW.lng}
		];

		options = {
			fill:true,
			color:get_random_color()
		};

		zona_poligon = new L.Polygon(coords,options);
		biciMapaUI.addDisplayBoundsLayer(zona_poligon);
		self.biciMapa.addLayer(zona_poligon);
	}

	// Mayor lat -> mas al sur | Mayor lng -> mas al oeste
	self.findNW = function(x,y){ return {lat:x.lat<y.lat? x.lat : y.lat,lng: x.lng>y.lng? x.lng : y.lng}; }
	self.findNE = function(x,y){ return {lat:x.lat<y.lat? x.lat : y.lat,lng: x.lng<y.lng? x.lng : y.lng}; }
	self.findSW = function(x,y){ return {lat:x.lat>y.lat? x.lat : y.lat,lng: x.lng>y.lng? x.lng : y.lng}; }
	self.findSE = function(x,y){ return {lat:x.lat>y.lat? x.lat : y.lat,lng: x.lng<y.lng? x.lng : y.lng}; }


	self.getDisplayZonasList = function(){
		return _.keys(self.zonasDisplay);
	}
	self.addDisplayZonas = function(zona_nombre,zonaDisplay){
		if(!self.zonasDisplay[zona_nombre]) self.zonasDisplay[zona_nombre] = zonaDisplay;
	}

	self.unDisplayZona = function(zona_nombre,noUpdate){
		self.biciMapa.removeLayer(self.zonasDisplay[zona_nombre].square);
		if(self.zonasDisplay[zona_nombre].label){
			self.biciMapa.removeLayer(self.zonasDisplay[zona_nombre].label);
		}
		delete(self.zonasDisplay[zona_nombre]);
		if(!noUpdate) biciMapaUI.updateTotalZonasDisp();
	}

	self.unDisplayZonas = function(){
		_.each(self.zonasDisplay,function(zonaDisplay,zona_nombre){
			self.unDisplayZona(zona_nombre,true);
		});
		biciMapaUI.updateTotalZonasDisp();
	}

	self.displayZonas = function(zonas,no_borrar){
		if(zonas.length<=100){
			if(!no_borrar) self.unDisplayZonas();
			_.each(zonas,function(zona_nombre){
				self.displayZona(zona_nombre,true);
			});

			biciMapaUI.updateTotalZonasDisp();
		}
		else biciMapaUI.setMessage('','Son demasiadas zonas!','error');
	}

	self.reDisplayZonas = function(){
		var redraw = _.keys(self.zonasDisplay);
		self.unDisplayZonas();
		self.displayZonas(redraw);
	}
	self.displayZonasRuta = function(zZona,no_borrar){
		if(!self.RUTA.layer) return;
		if(!zZona) zZona = biciMapaUI.getZZonaDraw();
		self.displayZonas(self.getZonasRuta(self.RUTA.layer,zZona),no_borrar);
	}

	self.displayZonasBounds = function(zZona,use_markers,no_borrar){
		if(!zZona) zZona = biciMapaUI.getZZonaDraw();
		var bounds;
		var startMarker = self.getMarker('start');
		var endMarker = self.getMarker('end');
		if(use_markers && startMarker && endMarker){
			bounds = new L.latLngBounds([startMarker.getLatLng(),endMarker.getLatLng()]);
		}
		self.displayZonas(self.getZonasBounds(bounds,zZona),no_borrar);
	}

	self.displayZonasAdmin = function(no_borrar){
		self.displayZonas(zonasAdmin,no_borrar);
	}
	self.displayZonasCapa = function(capa_nombre,no_borrar){
		self.displayZonas(capasPOI[capa_nombre].zonas,no_borrar);
	}

	// self.displayZonasLoaded = function(not_loaded,no_borrar){
	// 	if(!no_borrar) self.unDisplayZonas();
	// 	_.each(self.zonasPOI,function(zona,zona_nombre){
	// 		if((zona.loaded && !not_loaded) || (!zona.loaded && not_loaded)) self.displayZona(zona_nombre);			
	// 	});	
	// }

	
	self.displayZona = function(zona_nombre,noUpdate){

		if(self.zonasDisplay[zona_nombre]) self.unDisplayZona(zona_nombre); // Ya está dibujada, mierda.

		var coords = self.getBoundsZona(zona_nombre);
		var options = {fill:true,color:get_random_color()};
		if(!biciMapaUI.isDrawModeTransp()) options.fillOpacity = 1;
		var zona_poligon = new L.rectangle(coords,options);

		var centrozona = coords.getCenter();
		zona_poligon.on('click',function(e){if(biciMapaUI.isDrawModeDelete() && biciMapaUI.isDrawZonasMode())self.unDisplayZona(zona_nombre);else self.biciMapa.fireEvent('click',e)});
		self.biciMapa.addLayer(zona_poligon);

		var infozona;
		if(biciMapaUI.isDrawModeLabel()){
			infozona = L.marker(centrozona,{icon : L.divIcon({html:'<div class="zonalabel"><h3>'+zona_nombre+'</h3></div>',className:''})});
			infozona.on('click',function(e){if(biciMapaUI.isDrawModeDelete() && biciMapaUI.isDrawZonasMode())self.unDisplayZona(zona_nombre);else self.biciMapa.fireEvent('click',e)});
			self.biciMapa.addLayer(infozona);
		}

		self.addDisplayZonas(zona_nombre,{square:zona_poligon,label: infozona});

		if(!noUpdate) biciMapaUI.updateTotalZonasDisp();
	}
	self.drawZona = function(e){
		if(!biciMapaUI.isDrawMode()) return;
		var zZona = biciMapaUI.getZZonaDraw();
		var zona_nombre = self.getZonaCoord(e.latlng,zZona);
		self.displayZona(zona_nombre);
	}
	self.setDrawZonasMode = function(on_off){
		if(on_off) self.biciMapa.on('click',self.drawZona);
		else self.biciMapa.off('click',self.drawZona);
	}


	self.getNombreZona = function(x,y,z){
		if(_.isUndefined(z)) return self.zZona+'|'+x+'|'+y;
		else return z+'|'+x+'|'+y;
	}

	self.getZonaZ = function(zona){return parseInt(zona.split('|')[0]);}
	self.getZonaX = function(zona){return parseInt(zona.split('|')[1]);}
	self.getZonaY = function(zona){return parseInt(zona.split('|')[2]);}

	self.esMayorZ = function(zona_a,zona_b){ return self.getZonaZ(zona_a) < self.getZonaZ(zona_b);}
	self.esMayorIgualZ = function(zona_a,zona_b){ return self.getZonaZ(zona_a) <= self.getZonaZ(zona_b);}
	self.esIgualZ = function(zona_a,zona_b){ return self.getZonaZ(zona_a) == self.getZonaZ(zona_b);}


	self.zonaContiene = function(zona,zona_latlng){
		var latlng = zona_latlng;
		var checkSize = true;
		if(_.isString(zona_latlng)){
			latlng = self.getBoundsZona(zona_latlng).getCenter();
			checkSize = self.esMayorZ(zona,zona_latlng);
		}
		return (self.getBoundsZona(zona).contains(latlng) && checkSize) || (zona == zona_latlng);
	}

	self.isCapaActiveBounds = function(capa_nombre,bounds){
		var zonas = capasPOI[capa_nombre].zonas;
		for (var i = 0; i < zonas.length; i++) {
			if(self.boundIntersecta(bounds,zonas[i])) return true;
		}
		return false;
	}
	self.isCapaActiveZona = function(capa_nombre,zona_nombre){
		var zonas = capasPOI[capa_nombre].zonas;
		return self.zonasIntersectan(zonas,zona_nombre);
	}
	self.isCapaActiveLatLng = function(capa_nombre,zona_latlng){
		var zonas = capasPOI[capa_nombre].zonas;
		return self.zonasContienen(zonas,zona_latlng)	
	}

	self.zonaIntersecta = function(zona_a,zona_b){
		return self.zonaContiene(zona_a,zona_b) || self.zonaContiene(zona_b,zona_a);
	}
	self.zonasIntersectan = function(zonas,zona_b){
		for (var i = 0; i < zonas.length; i++) {
			if(self.zonaIntersecta(zonas[i],zona_b)) return true;
		}
		return false;
	}
	
	self.zonasContienen = function(zonas,zona_latlng){
		for (var i = 0; i < zonas.length; i++) {
			if(self.zonaContiene(zonas[i],zona_latlng)) return true;
		}
		return false;
	}

	self.boundIntersecta = function(bounds,zona){
		var zZona = self.getZonaZ(zona);
		var xZona = self.getZonaX(zona);
		var yZona = self.getZonaY(zona);

		var x1=self.lng2tile(bounds.getNorthWest().lng,zZona);
		var x2=self.lng2tile(bounds.getNorthEast().lng,zZona);
		var y1=self.lat2tile(bounds.getNorthEast().lat,zZona);
		var y2=self.lat2tile(bounds.getSouthEast().lat,zZona);

		return x1<=xZona && x2>=xZona && y1<=yZona && y2>=yZona;
	}


	/*self.getTablaZonasRuta = function(rutaLayer,zZona){
		if(_.isUndefined(rutaLayer)) rutaLayer = self.RUTA.layer;
		if(rutaLayer){
			if(_.isUndefined(zZona)) zZona = self.zZonaRutas;
			var rutaLatLngs = rutaLayer.getLatLngs();
			var latlng_prev,latlng_next;
			var zonas = {};var zona;var totaldist = 0;
			_.each(rutaLatLngs,function(latlng,index){
				zona = self.getZonaCoord(latlng,zZona);
				if(!zonas[zona]) zonas[zona]=0;
				
				latlng_prev = rutaLatLngs[index-1];
				latlng_next = rutaLatLngs[index+1];
				if(latlng_prev && self.getZonaCoord(latlng_prev,zZona)!=zona) zonas[zona] += latlng.distanceTo(latlng_prev);
				if(latlng_next){ 
					zonas[zona] += latlng.distanceTo(latlng_next);
					totaldist += latlng.distanceTo(latlng_next);
				}
			});
			_.each(zonas,function(cobertura,zona){
				zonas[zona] = zonas[zona]*100/totaldist;
			});

			return zonas;
		}
		else return undefined;
	}*/
	/*self.getZonasRuta = function(rutaLayer,zZona){
		if(_.isUndefined(rutaLayer)) rutaLayer = self.RUTA.layer;
		if(rutaLayer){
			// if(_.isUndefined(zZona)) zZona = self.zZonaRutas;
			if(_.isUndefined(zZona)) zZona = self.zZona;
			var zonas = [];var zona;
			_.each(rutaLayer.getLatLngs(),function(latlng){
				zona = self.getZonaCoord(latlng,zZona);
				if(_.indexOf(zonas,zona)==-1) zonas.push(zona);
			});
			return zonas;
		}
		else return undefined;
	}*/
	self.getZonasRuta = function(rutaLayer,zZona){
		if(_.isUndefined(rutaLayer)) rutaLayer = self.RUTA.layer;
		if(rutaLayer){
			// if(_.isUndefined(zZona)) zZona = self.zZonaRutas;
			if(_.isUndefined(zZona)) zZona = self.zZona;
			var zonas = [];var zona;var middle;
			var coords = rutaLayer.getLatLngs();
			for(var i=1;i<coords.length;i++){
				zona = self.getZonaCoord(coords[i],zZona);
				if(_.indexOf(zonas,zona)==-1) zonas.push(zona);
				zona = self.getZonaCoord(coords[i-1],zZona);
				if(_.indexOf(zonas,zona)==-1) zonas.push(zona);
				middle = {lat:(coords[i].lat+coords[i-1].lat)/2,lng:(coords[i].lng+coords[i-1].lng)/2};
				self.getZonasSegmento(zonas,zZona,coords[i],coords[i-1],middle,0);
			}
			return zonas;
		}
		else return undefined;
	}
	self.getZonasSegmento = function(zonas,zZona,latlng_A,latlng_B,latlng_middle,iteracion){
		var zona = self.getZonaCoord(latlng_middle,zZona);
		var new_middle;
		if(_.indexOf(zonas,zona)==-1){
			iteracion = 0;
			zonas.push(zona);
		}
		if(iteracion<3){
			new_middle = {lat:(latlng_A.lat+latlng_middle.lat)/2,lng:(latlng_A.lng+latlng_middle.lng)/2};
			self.getZonasSegmento(zonas,zZona,latlng_A,latlng_middle,new_middle,iteracion+1);
			new_middle = {lat:(latlng_B.lat+latlng_middle.lat)/2,lng:(latlng_B.lng+latlng_middle.lng)/2};
			self.getZonasSegmento(zonas,zZona,latlng_B,latlng_middle,new_middle,iteracion+1);
		}

	}

	self.getZonasBounds = function(bounds,zZona){
		if(!bounds) bounds = self.biciMapa.getBounds();
		if(!zZona) zZona = self.zZona;
		var zonasMap = [];

		var x1=self.lng2tile(bounds.getNorthWest().lng,zZona);
		var x2=self.lng2tile(bounds.getNorthEast().lng,zZona);
		var y1=self.lat2tile(bounds.getNorthEast().lat,zZona);
		var y2=self.lat2tile(bounds.getSouthEast().lat,zZona);
		// 'z: '+self.biciMapa.getZoom()+'=> '+((x2-x1+1)*(y2-y1+1))+' zonas.';
		for (var i=x1;i<=x2;i++) {
			for (var j=y1;j<=y2;j++) {
				zonasMap.push(self.getNombreZona(i,j,zZona));
			}
		}
		return zonasMap;
	}

	self.countZonasBounds = function(bounds,zZona){
		if(!bounds) bounds = self.biciMapa.getBounds();
		if(!zZona) zZona = self.zZona;
		var x1=self.lng2tile(bounds.getNorthWest().lng,zZona);
		var x2=self.lng2tile(bounds.getNorthEast().lng,zZona);
		var y1=self.lat2tile(bounds.getNorthEast().lat,zZona);
		var y2=self.lat2tile(bounds.getSouthEast().lat,zZona);
		return (x2-x1+1)*(y2-y1+1);
	}

	self.getBoundsZona = function(zona_nombre){
		var params  = zona_nombre.split('|');
		var z = parseInt(params[0]);
		var x = parseInt(params[1]);
		var y = parseInt(params[2]);
		var noroeste = {lat:self.tile2lat_aux(y,z),lng:self.tile2lng_aux(x,z)};
		var sudeste = {lat:self.tile2lat_aux(y+1,z),lng:self.tile2lng_aux(x+1,z)};
		return L.latLngBounds([noroeste,sudeste]);
	}

	self.getDiagonalZona = function(zZona){
		var bounds = self.getBoundsZona(self.getZonaCoord({lat:0,lng:0},zZona));
		return bounds.getNorthWest().distanceTo(bounds.getSouthEast());
	}
	self.getLadoZona = function(zZona){
		var bounds = self.getBoundsZona(self.getZonaCoord({lat:0,lng:0},zZona));
		return bounds.getNorthWest().distanceTo(bounds.getSouthWest());
	}

	self.getZonaCoord = function(latlng,zZona){
		if(_.isUndefined(zZona)) zZona = self.zZona;
		var x = self.lng2tile(latlng.lng,zZona);
		var y = self.lat2tile(latlng.lat,zZona);
		return self.getNombreZona(x,y,zZona);
	}

	self.lng2tile = function(lng,zoom){ return (Math.floor((lng+180)/360*Math.pow(2,zoom))); }
	self.lat2tile = function(lat,zoom){ return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom)));}
	
	self.tile2lng = function(x,z){return (self.tile2lng_aux(x,z)+self.tile2lng_aux(x+1,z))/2;}
	self.tile2lng_aux = function(x,z){return (x/Math.pow(2,z)*360-180);}
 
	self.tile2lat = function(y,z){return (self.tile2lat_aux(y,z)+self.tile2lat_aux(y+1,z))/2;}
	self.tile2lat_aux = function(y,z){var n=Math.PI-2*Math.PI*y/Math.pow(2,z);return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));}

	self.getTinyPOI = function(UID){
		var marker = self.findPOILayer(UID);
		if(marker)
			return {
					poi_id: marker.feature.properties.poi_id,
					UID: marker.feature.properties.UID,
					capa: marker.feature.properties.capa,
					nombre: marker.feature.properties.nombre,
					zona: marker.feature.properties.zona,
					lat: marker.feature.properties.lat,
					lng: marker.feature.properties.lng,
					estado: marker.feature.properties.estado
			};
		else return undefined;
	}

	self.displayPOI = function(POI_params){
		if(!biciMapaOBJ.findMarker(POI_params.UID)){
			var coords = new L.LatLng(POI_params.lat,POI_params.lng);
			self.displayType = 'POI';
			self.POIQueue = [{UID:POI_params.UID,latlng:coords}];
			self.capasQueue = [POI_params.capa];

			// Es necesario hacer carga manual, pues puede el mapa moverse o no.
			var active  = biciMapaUI.isAutoLoadActive();
			if(active) biciMapaUI.setAutoLoadActive(false); 
			self.biciMapa.setView(coords,self.biciMapa.getZoom());
			self.setCapasZonas();
			if(active) biciMapaUI.setAutoLoadActive(true);
		}
	}

	self.displayPOI_aux = function(features){
		self.findMarker(features[0].UID);
	}

	self.cleanCacheAll = function(){
		var indices = amplify.store();
		_.each(indices,function(elemento,indice){
			amplify.store(indice,null);
		});
	}

	self.cleanZonasCache = function(all_users){
		var indexZonaCapa = (_.isUndefined(amplify.store('indexZonaCapa')))? [] : amplify.store('indexZonaCapa');
		_.each(indexZonaCapa,function(zona_capa_nombre){
				self.cleanZonaCache(zona_capa_nombre,all_users);
		});
		if(all_users){
			amplify.store('indexZonaCapa',null);
		}
	}

	self.cleanZonaCache = function(zona_capa_nombre,all_users){
		var indexUserUID = amplify.store('indexUserUID')?amplify.store('indexUserUID'):{};
		if(all_users){
			_.each(indexUserUID,function(zona_capa_nombres,userId){
				amplify.store(zona_capa_nombre+'_'+userId+'_fecha',null);
				amplify.store(zona_capa_nombre+'_'+userId,null);
				indexUserUID[user_data.user_id]={};
				amplify.store('indexUserUID',indexUserUID);
			});
			// amplify.store('indexUserUID',null);
		}
		else{
			amplify.store(zona_capa_nombre+'_'+user_data.user_id+'_fecha',null);
			amplify.store(zona_capa_nombre+'_'+user_data.user_id,null);
			indexUserUID[user_data.user_id]={};
			amplify.store('indexUserUID',indexUserUID);
			if(_.size(indexUserUID)==0) amplify.store('indexZonaCapa',null);
		}
	}
	
	self.getZonaCache = function(zona_nombre,capa_nombre){
		var zona_capa_nombre = zona_nombre+'_'+capa_nombre;
		var POIs = amplify.store(zona_capa_nombre+'_'+user_data.user_id);
		return POIs;
	}

	self.setZonaCache = function(zona_nombre,capa_nombre,POIs,fecha){
		var zona_capa_nombre = zona_nombre+'_'+capa_nombre;
		if(_.size(POIs)==0){
			self.cleanZonaCache(zona_capa_nombre);
		}
		else{
			amplify.store(zona_capa_nombre+'_'+user_data.user_id,POIs);
			amplify.store(zona_capa_nombre+'_'+user_data.user_id+'_fecha',fecha);
		}
		
		var indexZonaCapa = (_.isUndefined(amplify.store('indexZonaCapa')))? [] : amplify.store('indexZonaCapa');
		var index = _.indexOf(indexZonaCapa,zona_capa_nombre);
		if(index==-1 && _.size(POIs)>0) indexZonaCapa.push(zona_capa_nombre);
		else if(index!=-1 && _.size(POIs)==0) indexZonaCapa.splice(index,1);
		amplify.store('indexZonaCapa',indexZonaCapa);
	}

	self.getFechaZonaCache = function(zona_nombre,capa_nombre){
		var zona_capa_nombre = zona_nombre+'_'+capa_nombre;
		return amplify.store(zona_capa_nombre+'_'+user_data.user_id+'_fecha');
	}

	self.updateCachePOI = function(UID,feature){
		var fecha;
		var zona_capa_nombre = feature? feature.properties.zona +'_'+ feature.properties.capa : '';
		var indexUserUID = amplify.store('indexUserUID')?amplify.store('indexUserUID'):{};
		var old_zona_capa_nombre = indexUserUID[user_data.user_id]? indexUserUID[user_data.user_id][UID] : undefined;

		if(old_zona_capa_nombre && (!feature || (feature && old_zona_capa_nombre!=zona_capa_nombre))){
			var old_zona_nombre = old_zona_capa_nombre.split('_')[0];
			var old_capa_nombre = old_zona_capa_nombre.split('_')[1];
			var old_zona_cache = self.getZonaCache(old_zona_nombre,old_capa_nombre);
			fecha = self.getFechaZonaCache(old_zona_nombre,old_capa_nombre);
			delete old_zona_cache[UID];
			self.setZonaCache(old_zona_nombre,old_capa_nombre,old_zona_cache,fecha);
		}

		if(!feature){
			delete indexUserUID[user_data.user_id][UID];
		}
		else{ 
			indexUserUID[user_data.user_id][UID] = zona_capa_nombre;
			var zona_cache = self.getZonaCache(feature.properties.zona,feature.properties.capa);
			if(zona_cache){
				fecha = self.getFechaZonaCache(feature.properties.zona,feature.properties.capa);
			}
			else if(feature){
				zona_cache = {};
				zona_cache[UID] = feature;
				fecha = feature.properties.fecha_estado;
			}
			zona_cache[UID] = feature;
			self.setZonaCache(feature.properties.zona,feature.properties.capa,zona_cache,fecha);
		}

		amplify.store('indexUserUID',indexUserUID);
	}

	self.updateCacheZona = function(fecha,zona_nombre,zona){
		var zona_cache;
		var count_added;
		var count_removed;
		var indexUserUID = amplify.store('indexUserUID')?amplify.store('indexUserUID'):{};
		
		_.each(zona,function(capa,capa_nombre){
			count_added = 0;
			count_removed = 0;
			if(!(zona_cache = self.getZonaCache(zona_nombre,capa_nombre))) zona_cache = {};

			_.each(capa,function(feature,UID){
				var zona_capa_nombre = feature.properties.zona +'_'+ feature.properties.capa;
				if(feature.properties.estado=='eliminado' || feature.properties.estado=='inapropiado'){
					if(zona_cache[UID]){
						delete zona_cache[UID];
						count_removed++;
					}
				}
				else{
					var old_zona_capa_nombre = indexUserUID[user_data.user_id]? indexUserUID[user_data.user_id][UID]:undefined;
					if(old_zona_capa_nombre && zona_capa_nombre!=old_zona_capa_nombre){// Se quita del bloque de cache antiguo.
						self.updateCachePOI(UID,feature);
					}
					zona_cache[UID] = feature;
					count_added++;
				}

				if(!indexUserUID[user_data.user_id]) indexUserUID[user_data.user_id]={};
				indexUserUID[user_data.user_id][UID] = zona_capa_nombre;
			});
			
			if(count_added>0 || count_removed>0) self.setZonaCache(zona_nombre,capa_nombre,zona_cache,fecha);
			LOG && console.log(fecha+' Zona '+zona_nombre+', capa '+ capa_nombre +':'+count_added+' nuevos. '+count_removed+' quitados.');
		});
		
		amplify.store('indexUserUID',indexUserUID);

	}


	self.cleanCapasCache = function(all_users){
		if(all_users){
			var indexUserUID = amplify.store('indexUserUID')?amplify.store('indexUserUID'):{};
			_.each(indexUserUID,function(zona_capa_nombres,userId){
				amplify.store('capas_poi'+userId,null);
				amplify.store('capas_poi_'+user_data.user_id+'_fecha',null);
			});
		
		}
		else{
			amplify.store('capas_poi'+userId,null);
			amplify.store('capas_poi_'+user_data.user_id+'_fecha',null);
		}
	}

	self.getCapasCache = function(){ return amplify.store('capas_poi_'+user_data.user_id); }
	
	self.setCapasCache = function(capas_poi,fecha){
		var capas_cache = self.getCapasCache()? self.getCapasCache() : {};
		_.each(capas_poi,function(capa,capa_nombre){
			capas_cache[capa_nombre] = capa;
		});

		amplify.store('capas_poi_'+user_data.user_id,capas_cache);
		amplify.store('capas_poi_'+user_data.user_id+'_fecha',fecha); 
	}
	self.getFechaCapasCache = function(){ return amplify.store('capas_poi_'+user_data.user_id+'_fecha'); }

	self.stopLoadZonas = function(){
		self.zonasQueue = []; //Borra cola de zonas a cargar
		biciMapaUI.unsetCargando();
	}

	self.overLimitQueue = function(){
		return self.countZonasBounds()>self.limitQueueLoadZones;
	}
	self.getZonasShow = function(){
		if(self.overLimitQueue()){
			// Si está fuera de los límites, trae sólo las zonas donde están los POI a mostrar
			var zonasShow = [];
			if(_.size(self.POIQueue)>0){
				_.each(self.POIQueue,function(params){
					zonasShow.push(self.getZonaCoord(params.latlng));
				});
			}
			 /*
			 CUCHUFLETA, por revisar. 
				-> Debe hacerse con callback despues de centrar mapa -> NO hay callback en la librería!!
				-> Se podría en loadPOI final reactivar el loadPOI on move, pero trae consecuencias. REVISAR.
			 */
			// else if(self.displayType=='route'){ 
			// 	zonasShow.push(self.getZonaCoord(new L.LatLng(self.RUTA.obj.params.s_coord.lat,self.RUTA.obj.params.s_coord.lng)));
			// 	zonasShow.push(self.getZonaCoord(new L.LatLng(self.RUTA.obj.params.e_coord.lat,self.RUTA.obj.params.e_coord.lng)));
			// }
			else{
				if(!self.msg_cargandoPOI) biciMapaUI.unsetCargando();
				return;
			}

			return zonasShow;
		}
		else{
			return self.getZonasBounds();
		}
	}

	self.setInterfazCapa = function(capa_nombre){
		if(capasPOI[capa_nombre].interfaz && self.biciMapa.hasLayer(capasPOI[capa_nombre].interfaz)){
			self.interfacesPOI.removeLayer(capasPOI[capa_nombre].interfaz)
		}
		delete capasPOI[capa_nombre].interfaz;

		if(!biciMapaUI.isClusteringActive()) capasPOI[capa_nombre].interfaz = new L.FeatureGroup([]);
		else{ 
			capasPOI[capa_nombre].interfaz = new L.markerClusterGroup({maxClusterRadius:50,iconCreateFunction:self.setClusterIcon,disableClusteringAtZoom:18
			// ,showCoverageOnHover:false,zoomToBoundsOnClick:false
			});
			capasPOI[capa_nombre].interfaz.on('clustercontextmenu',function(cluster){cluster.layer.zoomToBounds();});
		}
	}
	
	self.initCapa = function(capa_nombre){
		self.initIconsCapa(capa_nombre);

		capasPOI[capa_nombre].markers = {};
		self.setInterfazCapa(capa_nombre);
	}

	self.addZonasQueue = function(zona_nombre,capa_nombre){
		if(!self.zonasPOI[zona_nombre]) self.zonasPOI[zona_nombre] = {};
		if(!self.zonasPOI[zona_nombre][capa_nombre]) self.zonasPOI[zona_nombre][capa_nombre] = {};

		if(!self.zonasPOI[zona_nombre][capa_nombre].loaded && !self.zonasPOI[zona_nombre][capa_nombre].loading){
			self.zonasQueue.push({zona_nombre:zona_nombre,capa_nombre:capa_nombre});
		}
	}
	

	self.reLoadCapas = function(){
		biciMapaUI.cleanRoute();
		self.capasQueue=[];
		_.each(capasPOI_actives,function(capaPOI){
			// AÑADIR A CAPASQUEUE PARA TRAER SOLO LAS QUE ESTABAN DESPLEGADAS
			if(self.isCapaDisplayed(capaPOI.nombre)) self.capasQueue.push(capaPOI.nombre);
		});
		self.interfacesPOI.clearLayers();
		biciMapaUI.clearDisplayCapas();
		self.zonasPOI = {};
		self.clearListsPOI();

		self.loadCapas('restart');
	}

	self.loadCapas = function(start){

		var fecha_cache;
		if(!(fecha_cache = self.getFechaCapasCache())) fecha_cache = '1900-01-01';

		LOG && console.log('cargando capas');
		$.ajax({
				type: 'POST',timeout: biciMapaUI.getTimeOut(),
				url: baseUrl + '/wp-admin/admin-ajax.php',
				data:{
					action:'bcbm_get_capas_cache',
					fecha_cache:fecha_cache
				},
				success: function(data, textStatus, XMLHttpRequest){
					try{
						capasloaded = JSON.parse(data);
						self.setCapasCache(capasloaded.capas,capasloaded.fecha);
					}
					catch(e){
						LOG && console.error('Fail loadCapas: '+ e.message);
						LOG && console.log(data);
						var errorcod=' (r69)';
						biciMapaUI.setMessage('Error'+errorcod,'Hay problemas actualizado la información','error',false);
					}
				},
				error: function(MLHttpRequest, textStatus, errorThrown){
					var errorcod=' (r70)';
					biciMapaUI.setMessage('Error'+errorcod,'Hay problemas actualizado la información','error',false);
					LOG && console.error('Fail loadCapas: ' + errorThrown);
				},
				complete: function(jqXHR,textStatus){

					capasPOI = self.getCapasCache();
					capasPOI_actives = {};

					if(_.size(capasPOI)>0){
						_.each(capasPOI,function(capa,capa_nombre){
							self.initCapa(capa_nombre);
						});

						if(start=='start'){// Debee establecer carga automática después de haber cargado las capas.
							self.biciMapa.on('moveend',function(e){
								// $('.popup-inner').getNiceScroll().resize();
								if(biciMapaUI.isAutoLoadActive()) self.setCapasZonas();
							});
						}
						
						self.setCapasZonas(start);
					}
				}
		});
	}
	
	self.loadPOICapas = function(capas){
		// No miporta que la capa no esté mostrada, se cargan igual los POI y luego se ve si se muestran o no.
		var zonasShow;if(!(zonasShow = self.getZonasShow())) return;
		_.each(capas,function(capa_nombre){
			_.each(zonasShow,function(zona_nombre){
				if(self.isCapaActiveZona(capa_nombre,zona_nombre)){
					self.addZonasQueue(zona_nombre,capa_nombre);
				}
			});
		});
		self.loadPOIZonas();
	}

	self.setCapasZonas = function(start){// Esta es la que se llama en cada movimiento del mapa
		var zonasShow;
		// Si no hay zonas para cargar se sale del procedimiento
		if(!(zonasShow = self.getZonasShow())) return;
		self.zonasQueue = []; //Borra cola de zonas a cargar
		var bounds = self.biciMapa.getBounds();
		
		var activar,activa,mostrando,mostrar,changeActiveCapas=false,isCapaActiveZona;

		_.each(capasPOI,function(capa,capa_nombre){
			activar = self.isCapaActiveBounds(capa_nombre,bounds);
			activa = self.isCapaActive(capa_nombre);
			mostrar = (start=='start' && capa.mostrar) || (_.indexOf(self.capasQueue,capa_nombre)!=-1);
			mostrando = self.isCapaDisplayed(capa_nombre);// REdefinir!!!!!!!!!!!!!!!!!!!!!!

			if((!activa && activar) || (activa && !activar)){ //Si no esta activa y hay que activar o viceversa
				changeActiveCapas = true;
				biciMapaUI.activateDisplayCapa(capa_nombre,activar,mostrar);//Ultima variable solo influye en la primera activación
			}
			
			if(mostrar) biciMapaUI.setDisplayCapa(capa_nombre,true,false);

			_.each(zonasShow,function(zona_nombre){
				if((mostrar || mostrando) && self.isCapaActiveZona(capa_nombre,zona_nombre)){
					// aquí se verifica si la zona-capa ya fue cargada antes para no añadirla a la cola de carga
					self.addZonasQueue(zona_nombre,capa_nombre);
				}
			});
		});

		if(changeActiveCapas) biciMapaUI.activateDisplayCapas_final();

		self.capasQueue = [];

		self.loadPOIZonas(start);
	}

	self.loadPOIZonas = function(start){
		if((_.size(self.zonasQueue)>0 || _.size(self.POIQueue)>0) && !self.msg_cargandoPOI){
			self.loadPOIZonas_aux(start);
		}
		else{
			if(self.displayType){ 
				self.displayType_aux = self.displayType;
				self.POIQueue_aux = self.POIQueue;
				self.displayType = false;
				self.POIQueue=[];
			}

			self.loadPOIZonas_final(start);
		}
	}

	self.loadPOIZonas_aux = function(start){
		// var display_route; if(self.display_route){ display_route = self.display_route;self.display_route = false;}
		// var display_poi; if(self.display_poi){ display_poi = self.display_poi;self.display_poi = false; }

		var displayType=false,POIQueue=[]; 
		if(self.displayType){ 
			displayType = self.displayType;
			POIQueue = self.POIQueue;
			self.displayType = false;
			self.POIQueue=[];
		}
		
		self.msg_cargandoPOI = biciMapaUI.setCargando(_.size(self.zonasQueue)>self.alertLoadingZones?1:0);
		
		var zonas_pre = self.zonasQueue.splice(0,self.limitLoadZones); // Extrae de la cola la cantidad máxima de zonas simultaneas de carga

		var zonas = {};
		var fecha_cache;
		var zona_capa_nombre;
		var identificador_carga = genUID();
		_.each(zonas_pre,function(zona_capa){
			self.zonasPOI[zona_capa.zona_nombre][zona_capa.capa_nombre].loading = true;
			if(!(fecha_cache = self.getFechaZonaCache(zona_capa.zona_nombre,zona_capa.capa_nombre))) fecha_cache = '1900-01-01';
			if(!zonas[zona_capa.zona_nombre]) zonas[zona_capa.zona_nombre] = {};
			zonas[zona_capa.zona_nombre][zona_capa.capa_nombre] = fecha_cache;
			LOG && console.log('('+identificador_carga+') '+ zona_capa.zona_nombre+','+zona_capa.capa_nombre);
		});

		var data = {action: 'bcbm_get_poi_zonas',UIDs:[]};
		
		if(_.size(zonas)>0) data.zonas = zonas;

		_.each(POIQueue,function(param){
			data.UIDs.push(param.UID);
		});

		var zonasLoaded = {};
		$.ajax({
			type: 'POST',timeout: biciMapaUI.getTimeOut(),
			url: baseUrl + '/wp-admin/admin-ajax.php',
			data: data
			,
			success: function(data, textStatus, XMLHttpRequest){
				
				try{
					zonasLoaded = JSON.parse(data);
					LOG && console.log('('+identificador_carga+') RESPUESTA');
					
					_.each(zonas,function(capas,zona_nombre){
						
						if(zonasLoaded.zonas[zona_nombre]){
							// LOG && console.log('('+identificador_carga+') Actualizando cache '+zona_nombre);
							self.updateCacheZona(zonasLoaded.fecha,zona_nombre,zonasLoaded.zonas[zona_nombre]);
						}
					});
				}
				catch(e){
					LOG && console.error('Fail loadPOIZonas_aux: '+ e.message);
					LOG && console.log(data);
					var errorcod=' (r52)';
					biciMapaUI.setMessage('Error'+errorcod,'Hay problemas actualizado la información','error',false);
				}
			},
			error: function(MLHttpRequest, textStatus, errorThrown){
				var errorcod=' (r53)';
				biciMapaUI.setMessage('Error'+errorcod,'Hay problemas actualizado la información','error',false);
				LOG && console.error('Fail loadPOIZonas: ' + errorThrown);
			},
			complete: function(jqXHR,textStatus){
				var zona_cache;
				_.each(zonas,function(capas,zona_nombre){
					// LOG && console.log('('+identificador_carga+') Añadiendo POI al mapa '+zona_nombre);
					_.each(capas,function(fecha,capa_nombre){
						self.zonasPOI[zona_nombre][capa_nombre].loading = false;
						//Queda como cargada aunque no haya traido. El user recarga manualmente
						self.zonasPOI[zona_nombre][capa_nombre].loaded = true; 
						
						zona_cache = self.getZonaCache(zona_nombre,capa_nombre);
						_.each(zona_cache,function(feature){
							self.addPOI(feature);
						});
					});
				});

				// LOG && console.log('('+identificador_carga+') Añadiendo POI extra al mapa');
				_.each(zonasLoaded.UIDs,function(feature){ // ESTOS NO VAN A LA CACHE!
					if(!self.findPOILayer(feature.properties.UID)) self.addPOI(feature);
				});

				self.displayType_aux = displayType;
				self.POIQueue_aux = POIQueue;


				if(_.size(self.zonasQueue)>0){
					self.loadPOIZonas_aux(start);
				}
				else{
					self.msg_cargandoPOI = false; // INDEFINIR ANTES DE CERRAR EL MENSAJE
					biciMapaUI.unsetCargando();
					
					self.loadPOIZonas_final(start);
				}
			}
		});
	}

	self.loadPOIZonas_final = function(start){
		var displayType=false,POIQueue=[]; 
		if(self.displayType_aux){ 
			displayType = self.displayType_aux;
			POIQueue = self.POIQueue_aux;
			self.displayType_aux = false;
			self.POIQueue_aux=[];
		}

		if(!self.msg_cargandoPOI) biciMapaUI.unsetCargando();

		if(displayType=='route') self.displayRoute_aux();
		else if(displayType=='POI') self.displayPOI_aux(POIQueue);

		if(start=='start') biciMapaUI.initUI_final();
		else if(start=='restart'){
			if(capasPOI.favoritos && biciMapaUI.isSetPantalla('favoritos')) self.loadListPOI('favoritos');
			if(biciMapaUI.isSetPantalla('administrarpoi')) self.loadListPOI('administrarpoi');
		}

	}

	self.isZonaLoaded = function(zona_nombre,capa_nombre){
		if(self.zonasPOI[zona_nombre] && self.zonasPOI[zona_nombre][capa_nombre])
			return self.zonasPOI[zona_nombre][capa_nombre].loaded;
		else return false;
	}

	self.isCapaActive = function(capa_nombre){
		return capasPOI_actives[capa_nombre];
	}

	self.isCapaDisplayed = function(capa_nombre){
		return self.interfacesPOI.hasLayer(capasPOI[capa_nombre].interfaz);
	}

	self.activateDisplayCapa = function(capa_nombre,activate){
		if(activate && !capasPOI_actives[capa_nombre]) capasPOI_actives[capa_nombre] = capasPOI[capa_nombre];
		else if(!activate) delete(capasPOI_actives[capa_nombre]);
	}
	self.setDisplayCapa = function(capa_nombre,show,load){
		var layer = capasPOI[capa_nombre].interfaz;
		var has = self.interfacesPOI.hasLayer(layer);
		if(!show && has) 		self.interfacesPOI.removeLayer(layer);
		else if(show && !has) 	self.interfacesPOI.addLayer(layer);

		if(load && show) self.loadPOICapas([capa_nombre]);
	}


// ES POSIBLE PERO HAY QUE REFINAR___________________________________________
	self.filtrarPOI = function(listname){
		if(!listname || (listname && self.listasPOI[listname])){ 
			self.filterPOI = listname;
			self.updateInterfazCapas();
			return true;
		}
		else return false;
	}
	self.updateInterfazCapas = function(){
		_.each(capasPOI,function(capa){
			self.updateInterfazCapa(capa.nombre);
		});
	}
	self.updateInterfazCapa = function(capa_nombre){
		capasPOI[capa_nombre].interfaz.clearLayers();
		_.each(capasPOI[capa_nombre].markers,function(marker){
			self.addPOIInterfaz(marker);
		});
	}

	self.clearListsPOI = function(){
		_.each(self.listasPOI,function(lista,listname){
			self.listasPOI[listname] = undefined;
			biciMapaUI.updateListPOI(listname);
		});
		self.listasPOI={};
	}

	self.loadListPOI = function(listname,paramsUpdate){
		if(!self.listasPOI[listname]){
			biciMapaUI.setCargandoList(listname);
			LOG && console.log('cargando '+listname);

			$.ajax({
					type: 'POST',timeout: biciMapaUI.getTimeOut(),
					url: baseUrl + '/wp-admin/admin-ajax.php',
					data:{
						action:'bcbm_get_'+listname
					},
					success: function(data, textStatus, XMLHttpRequest){
						try{
							self.listasPOI[listname] = JSON.parse(data);
						}
						catch(e){
							LOG && console.error('Fail loadListPOI: '+ e.message);
							LOG && console.log(data);
							var errorcod='(r71)';
							biciMapaUI.setMessage('Error'+errorcod,'Hay problemas actualizado la información','error',false);
						}

						if(paramsUpdate) paramsUpdate.callback(paramsUpdate.vars);
						else biciMapaUI.updateListPOI(listname);
					},
					error: function(MLHttpRequest, textStatus, errorThrown){
						var errorcod=' (r72)';
						biciMapaUI.setMessage('Error'+errorcod,'Hay problemas actualizado la información','error',false);
						LOG && console.error('Fail loadListPOI: ' + errorThrown);
					},
					complete: function(jqXHR,textStatus){}
			});
		}
		else if(paramsUpdate) paramsUpdate.callback(paramsUpdate.vars);
	}

	self.updatePOIAdmin = function(UID,estado){
		var paramsUpdate = {callback:self.updatePOIAdmin_aux,vars:{UID:UID,estado:estado}};
		self.loadListPOI('administrarpoi',paramsUpdate);
	}
	self.updatePOIAdmin_aux = function(params){
		var UID = params.UID;
		var estado = params.estado;
		var es_estadoadmin = self.isEstadoAdmin(estado);

		if(!es_estadoadmin) delete self.listasPOI.administrarpoi[UID];
		else self.listasPOI.administrarpoi[UID] = self.getTinyPOI(UID);

		biciMapaUI.updateListPOI('administrarpoi',es_estadoadmin);
	}

	self.isEstadoAdmin = function(estado){
		return estado == 'invalido' || estado == 'moderar' || estado == 'validar';
	}

	self.updatePOIFavorites = function(UID,es_favorito,count_favoritos,puede_editar){
		var paramsUpdate = {callback:self.updatePOIFavorites_aux,vars:{UID:UID,es_favorito:es_favorito,count_favoritos:count_favoritos,puede_editar:puede_editar}};
		self.loadListPOI('favoritos',paramsUpdate);
	}

	self.updatePOIFavorites_aux = function(params){
		var UID = params.UID;
		var es_favorito = params.es_favorito;
		var count_favoritos = params.count_favoritos;
		var puede_editar = params.puede_editar;

		var marker = self.findPOILayer(UID);
		var capa_nombre = marker.feature.properties.capa;
		
		/*
		var update_cache = capa_nombre=='favoritos' || (capasPOI[capa_nombre].tipo=='private' && marker.feature.properties.editor != user_data.user_id);
		if(!es_favorito && update_cache){
			self.removePOI(UID);
			//Debería actualizar cache en cliente, pero NO, pues debe dar aviso a todos los dispositivos del user.
			// self.updateCachePOI(UID);
			delete self.listasPOI.favoritos[UID];
		}
		*/
		if(!es_favorito){ 
			delete self.listasPOI.favoritos[UID];
			if(capasPOI[capa_nombre].tipo=='private' && marker.feature.properties.editor != user_data.user_id){
				//NO BORRAR TODAVÍA, PUEDE ESTAR EN OTRA LISTA
				// self.removePOI(UID);
			}
		}
		else{
			marker.feature.properties.favoritos = count_favoritos;
			marker.feature.properties.es_favorito = es_favorito;
			marker.feature.properties.puede_editar = puede_editar;
			marker.closePopup();
			self.setDetallePOI(marker.feature,marker);
			
			//Actualiza boton para añadir a favoritos
			var UID_box=self.isMarkerPOI(UID);
			if(UID_box) biciMapaUI.setMenuParamRuta(UID_box);

			//Actualiza listado
			// self.listasPOI.favoritos[UID] = {params:self.getTinyPOI(UID),layer:self.findPOILayer(UID)};
			self.listasPOI.favoritos[UID] = self.getTinyPOI(UID);
		}

		biciMapaUI.updateListPOI('favoritos',es_favorito);
	}

	self.puedeEditarPOI = function(UID){
		var POI = self.findPOILayer(UID);
		if(POI)	return 	POI.feature.properties.puede_editar;
		else return undefined;
	}


	self.getDetalleContextMenu = function(latlng){
		var popupContent = '';
		// BOTON INICIO	
		popupContent += '<a id="btn_poi_iniRuta" onclick="biciMapaOBJ.contextmenu.setMarker(\'start\')">';
		popupContent += 	'<div>';
		popupContent += 		'<img class="opt_detallePOI" alt="" src="'+ self.getIconUrl(true,'start') +'" /> Ruta desde aquí';
		popupContent += 	'</div>';		
		popupContent += '</a>';
		// BOTON FIN
		popupContent += '<a id="btn_poi_finRuta" onclick="biciMapaOBJ.contextmenu.setMarker(\'end\')">';
		popupContent += 	'<div>';
		popupContent += 		'<img class="opt_detallePOI" alt="" src="'+ self.getIconUrl(true,'end') + '" /> Ruta hasta aquí';
		popupContent += 	'</div>';
		popupContent += '</a>';
		// NEW POI
		popupContent += '<a id="btn_poi_fav" onclick="biciMapaOBJ.contextmenu.setMarker(\'newPOI\')">';
		popupContent += 	'<div>';
		popupContent += 		'<img class="opt_detallePOI" alt="" src="'+ BC_BM_URL + 'img/state_add.png"/> Nuevo lugar de interés';
		popupContent += 	'</div>';
		popupContent += '</a>';
		// DUMMY
		if(user_data.user_rol=='superadmin' || user_data.user_rol=='admin'){	
			popupContent += '<a id="btn_poi_fav" onclick="biciMapaOBJ.contextmenu.setMarker(\'dummy\')">';
			popupContent += 	'<div>';
			popupContent += 		'<img class="opt_detallePOI" alt="" src="'+ BC_BM_URL + 'img/state_add.png"/> Añadir marcador';
			popupContent += 	'</div>';
			popupContent += '</a>';
			
			popupContent += '<p>['+latlng.lat+','+latlng.lng+']</p>';
		}
		return popupContent;
	}
	self.setDetalleInstructionDot = function(marker,text){
		var popupContent = '';
		popupContent += '<div style="width:100%;text-align:center;">';
		popupContent += 	text+'<br />';
		popupContent += 	'<a onclick="biciMapaOBJ.prevInstruction();">';
		popupContent += 		'<img class="opt_detallePOI" alt="" src="'+ BC_BM_URL + 'img/arrow_left.png"/>';
		popupContent += 	'</a>';
		popupContent += 	'<a onclick="biciMapaOBJ.nextInstruction();">';
		popupContent += 		'<img class="opt_detallePOI" alt="" src="'+ BC_BM_URL + 'img/arrow_right.png"/>';
		popupContent += 	'</a>';
		popupContent += '</div>';
		marker.bindPopup(popupContent,{closeButton:false});
	}

	self.setDetalleMarker = function(UID_box,addr,notes,btns){
		var marker  = self.getMarker(UID_box);
		if(marker){
			marker.closePopup();
			var popupContent = '';
			popupContent += '<div class="popup-inner">';
			popupContent += 	'<div style="width:100%;text-align:center;">';
			if(addr) 
			popupContent += 		"<b>Direccion: </b>" + addr +'<br/>';
			if(notes) 
			popupContent += 		"<b>Notas: </b>" + notes +'<br/>';

			popupContent += 		'<div class="menu_ruta">';
			if(btns.clean){
			popupContent += 			'<a onclick="biciMapaUI.cleanParam(\''+ UID_box +'\');">';
			popupContent += 				'<img class="opt_detallePOI" alt="" src="'+ BC_BM_URL + 'img/clean-marker.png"/>';
			popupContent += 			'</a>';
			}
			if(btns.favorite){
			popupContent += 			'<a onclick="biciMapaUI.initFavoritoPOI(\''+UID_box+'\');">';
			popupContent += 				'<img class="opt_detallePOI" alt="" src="'+ BC_BM_URL + 'img/heart.png"/>';
			popupContent += 			'</a>';
			}
			popupContent += 		'</div>';
			popupContent += 	'</div>';
			popupContent += '</div>';

			// marker.bindPopup(popupContent,{closeButton:false,offset:new L.Point(5,-20)});
			marker.bindPopup(popupContent,{closeButton:false});
			marker.on('contextmenu',function(){this.openPopup();});
		}
	}

	self.setDetallePOI = function(feature,layer) {
		layer.bindPopup(self.getDetallePOI(feature),{closeButton:false});

		layer.on('popupopen',function(){
			$(".fancybox").fancybox();
			// $('#btn_poi_enlacePOI').val(biciMapaUI.getLink(feature.properties.UID));
			// $('#btn_enlacePOI').click(function(){
			// 	$(this).select();
			// });
			// $('.popup-inner').niceScroll();
		});
		layer.on('popupclose',function(){ //CUCHUFLETA
			$('span.tooltip[data-selector*=btn_poi_]').remove(); //CUCHUFLETA
		});

		layer.on('contextmenu',function(){this.openPopup();});

		layer.on('click contextmenu',function(){
			var UID_box = biciMapaUI.isClickTOCoodActive();
			if(UID_box && UID_box!='newPOI'){
				biciMapaUI.clickTOcoord.stop();

				var parMarker = {UID:feature.properties.UID};
				var parBox = {UID_box:UID_box};
				biciMapaUI.addParamRuta(parMarker,parBox);
			}
		});
	}

	self.getDetallePOI = function(feature,modal) {
		var capa_nombre = feature.properties.capa;
		var capa_tipo = capasPOI[capa_nombre].tipo;
		var estado = feature.properties.estado; 
		var popupContent = "";
		
		popupContent += '<div class="popup-'+(modal?'modal':'inner')+'">';

		popupContent += '<div class="boxruta_param">';
			
		popupContent += biciMapaUI.getHeadElement(feature.properties.nombre,feature.properties.imagen,feature.properties.url_imagen);

		// SI NO ES UNA VERSION ANTERIOR o HAY que moderar
		if(!feature.properties.sgte_version && estado!='moderar'){
			popupContent += '<div class="menu_ruta">';
				// BOTON INICIO	
				popupContent += '<a id="btn_poi_iniRuta"  data-tooltip data-options="disable_for_touch:true" class="btn_poi tip-bottom" title="Ruta desde aquí" onclick="biciMapaUI.poiTOparam(\'start\',\''+ feature.properties.UID +'\');">';
				popupContent += 	'<img class="opt_detallePOI" alt="" src="'+ self.getIconUrl(true,'start') + '"/>';
				popupContent += '</a>';
				// BOTON FIN
				popupContent += '<a id="btn_poi_finRuta"  data-tooltip data-options="disable_for_touch:true" class="btn_poi tip-bottom" title="Ruta hasta aquí" onclick="biciMapaUI.poiTOparam(\'end\',\''+ feature.properties.UID +'\');">';
				popupContent += 	'<img class="opt_detallePOI" alt="" src="'+ self.getIconUrl(true,'end') + '"/>';
				popupContent += '</a>';
				
				// BOTON VALORAR
				// var valoracion;while((valoracion=Math.floor(Math.random()*10))>5 || valoracion<1){}
				// popupContent += '<a id="btn_poi_valoracion"  data-tooltip data-options="disable_for_touch:true" class="btn_poi tip-bottom" title="Votación: '+self.nombreValoracion(valoracion)+' (click para votar)" onclick="">';
				// 	popupContent += '<img class="opt_detallePOI" src="'+ BC_BM_URL + 'img/scale_'+valoracion+'.gif"/>('+Math.floor(Math.random()*100)+')';
				// popupContent += '</a>';

				// BOTON FAVORITOS
				if(capasPOI.favoritos){
					var favoritos = feature.properties.favoritos;
					if(!feature.properties.es_favorito){
						popupContent += '<a id="btn_poi_fav" class="btn_poi" data-tooltip data-options="disable_for_touch:true" class="btn_poi tip-bottom" title="Añadir a favoritos" onclick="biciMapaUI.initFavoritoPOI(\''+feature.properties.UID+'\')">';
						popupContent += 	'<img class="opt_detallePOI" alt="" src="'+ BC_BM_URL + 'img/heart.png"/>('+ favoritos +')';
						popupContent += '</a>';
					}
					else{
						popupContent += '<a id="btn_poi_fav" class="btn_poi" data-tooltip data-options="disable_for_touch:true" class="btn_poi tip-bottom" title="Quitar de favoritos" onclick="biciMapaUI.deleteFavoritoPOI(\''+feature.properties.UID+'\')">';
						popupContent += 	'<img class="opt_detallePOI" alt="" src="'+ BC_BM_URL + 'img/heart.png"/>('+ favoritos +')';
						popupContent += '</a>';
					}
				}

				// BOTON COMPARTIR
				popupContent += '<a id="btn_poi_share"  data-tooltip data-options="disable_for_touch:true" class="btn_poi tip-bottom" title="Compartir" onclick="biciMapaUI.initCompartir(\''+feature.properties.UID+'\')">';
				popupContent += 	'<img class="opt_detallePOI" alt="" src="'+ BC_BM_URL + 'img/share-icon.gif"/>';
				popupContent += '</a>';
			popupContent += '</div>';
		}
		popupContent += '</div>';

		popupContent += '<div class="atributos-poi">';
		popupContent += 	'<b>Direccion: </b>' + feature.properties.direccion +'<br/>';
	
		_.each(feature.properties.atributos,function(valor,clave){
			if(valor && clave!='icono'){
				popupContent += "<b>"+ capasPOI[capa_nombre].atributos[clave].nombre +": </b>";				
				if(clave =='web'){ 
					var url = valor;
					if (url.substr(0,7) !== 'http://' && url.substr(0,8) !== 'https://') url = 'http://' + url;
					popupContent +=	'<a href="'+url+'" target="_blank">'+valor+'</a><br/>';
				}
				else{
					popupContent +='<p class="text-justify">';
						if(capa_tipo=='admin') popupContent += $("<div/>").html(valor).text();
						else popupContent += valor;
					popupContent +='</p>';
				}				
			}
		});
		if(feature.properties.secundarias){
			popupContent += "<b>Otros servicios: </b>";
			_.each(feature.properties.secundarias,function(capa_nombre){
				popupContent += '<img class="opt_detallePOI" alt="" src="'+ BC_BM_URL + 'img/'+ capa_nombre +'_nt.png"/> ';
			});
		}	
		popupContent += '</div>';
		
		if(feature.properties.editor_vcard){
			popupContent += '<div class="bloque_detallePOI">';
				popupContent += 'por ';
				popupContent += feature.properties.editor_vcard;
				if(feature.properties.representante == feature.properties.editor) popupContent += '*';
			popupContent += '</div>';
		}

		if(self.puedehaceralgunawea(feature) || estado!='valido'){
			popupContent +='<div class="colaborarContent">';
			if(estado != 'valido'){
				popupContent += '<div class="bloque_detallePOI">';
					if(estado=='validar'){
						popupContent += '<img class="opt_detallePOI" alt="" src="'+ BC_BM_URL + 'img/state_validar.png"/>';
						popupContent += 'Esta información necesita ser corroborada.';
					}
					if(estado=='invalido'){
						popupContent += '<img class="opt_detallePOI" alt="" src="'+ BC_BM_URL + 'img/state_invalido.png"/>';
						popupContent += 'Esta información fue marcada como incorrecta.';
					}
					if(estado=='actualizado'){
						popupContent += '<img class="opt_detallePOI" alt="" src="'+ BC_BM_URL + 'img/state_validar.png"/>';
						popupContent += 'Esta información fue modificada por otro usuario. Pronto estará actualizada.';
					}
					if(estado=='moderar'){
						popupContent += '<img class="opt_detallePOI" alt="" src="'+ BC_BM_URL + 'img/state_moderar.png"/>';
						popupContent += 'Esta información será visible cuando sea aprobada por el administrador.';
					}
			
					if(estado=='eliminar'){
						popupContent += '<img class="opt_detallePOI" alt="" src="'+ BC_BM_URL + 'img/state_moderar.png"/>';
						popupContent += 'Esta información espera la aprobación del administrador para ser quitada del mapa.';
					}
					
					if(feature.properties.mensaje_estado){
						popupContent += '<div class="mensaje_estado">';
						popupContent += feature.properties.usuario_estado_vcard;
						popupContent += ': '+htmlentities(feature.properties.mensaje_estado);
						popupContent += '</div>';
					}
				popupContent += '</div>';
			}

			popupContent += '<div class="bloque_detallePOI">';
			if(is_user_logged_in()){
				// BOTON INFO
				if(user_data.user_rol=='superadmin' || user_data.user_rol=='admin' || biciMapaUI.isInstpectPoiActive()){
					popupContent += '<a id="btn_poi_inspeccionar"  data-tooltip data-options="disable_for_touch:true" class="btn_poi tip-top" title="Inspeccionar" onclick="biciMapaUI.showFullPOI(\''+ feature.properties.UID +'\');">';
						popupContent += '<img class="opt_detallePOI" alt="" src="'+ BC_BM_URL + 'img/info.png"/>';
					popupContent += '</a>';
				}
				// BOTONES MODERAR
				if(feature.properties.puede_moderar){
					popupContent += '<a id="btn_poi_aprobar"  data-tooltip data-options="disable_for_touch:true" class="btn_poi tip-top" title="Aprobar información" onclick="biciMapaUI.initModerarPOI(\''+ feature.properties.UID +'\',true);">';
						popupContent += '<img class="opt_detallePOI" alt="" src="'+ BC_BM_URL + 'img/hand_up.png"/>';
					popupContent += '</a>';

					popupContent += '<a id="btn_poi_desaprobar"  data-tooltip data-options="disable_for_touch:true" class="btn_poi tip-top" title="Desaprobar información" onclick="biciMapaUI.initModerarPOI(\''+ feature.properties.UID +'\',false);">';
						popupContent += '<img class="opt_detallePOI" alt="" src="'+ BC_BM_URL + 'img/hand_down.png"/>';
					popupContent += '</a>';

					if(feature.properties.ant_version){
						popupContent += '<a id="btn_poi_antVer"  data-tooltip data-options="disable_for_touch:true" class="btn_poi tip-top" title="Ver versión anterior" onclick="biciMapaOBJ.switchVersion(\''+ feature.properties.UID +'\');">';
							popupContent += '<img class="opt_detallePOI" alt="" src="'+ BC_BM_URL + 'img/ant_version.jpg"/>';
						popupContent += '</a>';
					}
				}
				// BOTONES VERSIONES
				if(estado == 'actualizado' && feature.properties.sgte_version){
					popupContent += ' <a id="btn_poi_sgteVer"  data-tooltip data-options="disable_for_touch:true" class="btn_poi tip-top" title="Volver a la versión actual" onclick="biciMapaOBJ.switchVersion();">';
						popupContent += '<img class="opt_detallePOI" alt="" src="'+ BC_BM_URL + 'img/sgte_version.jpg"/>';
					popupContent += '</a>';
				}
				// BOTON VALIDAR
				if(feature.properties.puede_validar){
					popupContent += '<a id="btn_poi_validar"  data-tooltip data-options="disable_for_touch:true" class="btn_poi tip-top" title="Corroborar información" onclick="biciMapaUI.initValidarPOI(\''+ feature.properties.UID +'\');">';
						popupContent += '<img class="opt_detallePOI" alt="" src="'+ BC_BM_URL + 'img/validar_btn.png"/>';
					popupContent += '</a>';
				}
				// BOTON INVALIDAR
				if(feature.properties.puede_invalidar){
					popupContent += '<a id="btn_poi_invalidar"  data-tooltip data-options="disable_for_touch:true" class="btn_poi tip-top" title="Alertar información incorrecta" onclick="biciMapaUI.initInvalidarPOI(\''+ feature.properties.UID +'\');">';
						popupContent += '<img class="opt_detallePOI" alt="" src="'+ BC_BM_URL + 'img/invalidar.png"/>';
					popupContent += '</a>';
				}
				// BOTON EDITAR
				if(feature.properties.puede_editar){
					popupContent += '<a id="btn_poi_editar"  data-tooltip data-options="disable_for_touch:true" class="btn_poi tip-top" title="Editar información" onclick="biciMapaUI.initEditarPOI(\''+ feature.properties.UID +'\',\''+feature.properties.capa+'\');">';
						popupContent += '<img class="opt_detallePOI" alt="" src="'+ BC_BM_URL + 'img/edit.png"/>';
					popupContent += '</a>';
				}
				// BOTON BORRAR
				if(feature.properties.puede_eliminar){
					popupContent += '<a id="btn_poi_borrar" data-tooltip data-options="disable_for_touch:true" class="btn_poi tip-top" title="Quitar este lugar del mapa" onclick="biciMapaUI.initEliminarPOI(\''+ feature.properties.UID +'\');">';
					popupContent += 	'<img class="opt_detallePOI" alt="" src="'+ BC_BM_URL + 'img/recycle.png"/>';
					popupContent += '</a>';
				}
				
				if(!modal){
					popupContent += '<a data-tooltip data-options="disable_for_touch:true" class="btn_poi tip-top" title="Expandir" onclick="biciMapaUI.detallePOIPopup(\''+ feature.properties.UID +'\');">';
					popupContent += 	'<img class="opt_detallePOI" alt="" src="'+ BC_BM_URL + 'img/expand.png"/>';
					popupContent += '</a>';
				}
			}
			else{
				var param = encodeURIComponent(encodeURIComponent(feature.properties.UID));
				popupContent += '<a href="'+login_link+'?poi='+param+'">Inicia sesión</a>' + ' para colaborar.';
			}
			popupContent += '</div>';
		}
		popupContent += '</div>';

		popupContent += '</div>';//FIN ELEMENTO

		return popupContent;
	}

	self.nombreValoracion = function(valor){
		switch (valor){
			case 1: return 'Pésimo';break;
			case 2: return 'Malo';break;
			case 3: return 'Regular';break;
			case 4: return 'Bueno';break;
			case 5: return 'Excelente';break;
		}
	}

	/*self.switchVersion = function(UID){
		
		if(UID && UID!='clean'){
			
			self.switchVersion('clean'); // LIBERA EL OTRO POI EN MODERACION

			self.aprovingPOI = self.findPOILayer(UID);
			var feature = self.aprovingPOI.feature.properties.ant_version;
			self.antVersionPOI = self.featureToMarker(feature);
			
			self.POI_layers[self.aprovingPOI.feature.properties.capa].grupo.removeLayer(self.aprovingPOI);
			self.POI_layers[self.aprovingPOI.feature.properties.capa].capa.removeLayer(self.aprovingPOI);

			self.POI_layers[self.antVersionPOI.feature.properties.capa].capa.addLayer(self.antVersionPOI);
			self.POI_layers[self.antVersionPOI.feature.properties.capa].grupo.addLayer(self.antVersionPOI);

			self.findMarker(self.antVersionPOI.feature.properties.UID);

		}
		else if(self.aprovingPOI){
			self.POI_layers[self.antVersionPOI.feature.properties.capa].grupo.removeLayer(self.antVersionPOI);
			self.POI_layers[self.antVersionPOI.feature.properties.capa].capa.removeLayer(self.antVersionPOI);
			// SIEMPPRE AÑADIR PRIMERO A LA CAPA Y LUEGO AL GRUPO
			self.POI_layers[self.aprovingPOI.feature.properties.capa].capa.addLayer(self.aprovingPOI);
			self.POI_layers[self.aprovingPOI.feature.properties.capa].grupo.addLayer(self.aprovingPOI);
			
			if(UID != 'clean')	self.findMarker(self.aprovingPOI.feature.properties.UID);
			
			self.antVersionPOI = undefined;
			self.aprovingPOI = undefined;
		}
	}*/

	self.switchVersion = function(UID){
		if(UID && UID!='clean'){
			self.switchVersion('clean'); // LIBERA EL OTRO POI EN MODERACION

			self.aprovingPOI = self.findPOILayer(UID);
			var feature = self.aprovingPOI.feature.properties.ant_version;
			self.antVersionPOI = self.featureToMarker(feature);
			
			self.POI_layers[self.aprovingPOI.feature.properties.capa].grupo.removeLayer(self.aprovingPOI);
			self.POI_layers[self.aprovingPOI.feature.properties.capa].capa.removeLayer(self.aprovingPOI);

			self.POI_layers[self.antVersionPOI.feature.properties.capa].capa.addLayer(self.antVersionPOI);
			self.POI_layers[self.antVersionPOI.feature.properties.capa].grupo.addLayer(self.antVersionPOI);

			self.findMarker(self.antVersionPOI.feature.properties.UID);

		}
		else if(self.aprovingPOI){
			self.POI_layers[self.antVersionPOI.feature.properties.capa].grupo.removeLayer(self.antVersionPOI);
			self.POI_layers[self.antVersionPOI.feature.properties.capa].capa.removeLayer(self.antVersionPOI);
			// SIEMPPRE AÑADIR PRIMERO A LA CAPA Y LUEGO AL GRUPO
			self.POI_layers[self.aprovingPOI.feature.properties.capa].capa.addLayer(self.aprovingPOI);
			self.POI_layers[self.aprovingPOI.feature.properties.capa].grupo.addLayer(self.aprovingPOI);
			
			if(UID != 'clean')	self.findMarker(self.aprovingPOI.feature.properties.UID);
			
			self.antVersionPOI = undefined;
			self.aprovingPOI = undefined;
		}
	}

	self.checkPOIName = function(POI_name){
		var editingPOI = self.editingPOI;
		var marker = self.findPOILayer(POI_name);
		
		if(marker && editingPOI==POI_name) return true;
		else if(marker)	return false;
		else return true;
	}

	self.featureToMarker = function(feature){
		var latlng = {lat:feature.geometry.coordinates[1],lng:feature.geometry.coordinates[0]};
		
		var icono = self.icons[self.getPrefijoCapa(feature)][feature.properties.estado];
		var marker = L.marker(latlng,{icon: icono});

		marker.feature = feature;
		self.setDetallePOI(feature,marker);

		return marker;
	}

	self.updatePOI = function(feature,showpopup){
		self.removePOI(feature.properties.UID);
		self.addPOI(feature,showpopup,true);
	}
	self.addPOI = function(feature,showpopup,update_admin){
		var marker = self.featureToMarker(feature);
		var UID = feature.properties.UID;
		var capa_nombre = feature.properties.capa;
		capasPOI[capa_nombre].markers[UID] = marker;
		self.addPOIInterfaz(marker);

		if((user_data.user_rol=='admin' || user_data.user_rol=='colab') && update_admin){
			self.updatePOIAdmin(UID,feature.properties.estado); //Debería estar bien esta wea
		}

		if(showpopup) self.findMarker(UID);
	}

	self.addPOIInterfaz = function(marker){
		// añade solo si pertenece al filtro, o si no lo hay
		var UID = marker.feature.properties.UID;
		if(!self.filterPOI || (self.filterPOI && self.listasPOI[self.filterPOI][UID])){
			var capa_nombre = marker.feature.properties.capa;
			capasPOI[capa_nombre].interfaz.addLayer(marker);
		}
	}

	self.removePOIInterfaz = function(marker){
		var capa_nombre = marker.feature.properties.capa;
		var interfaz = capasPOI[capa_nombre].interfaz;
		if(interfaz.hasLayer(marker)) interfaz.removeLayer(marker);
	}

	self.getFirstCapaRutadjunt = function(){
		if(capasPOI.evtprivados) return capasPOI.evtprivados.nombre; // prioriza evento privado
		var nombre = undefined;
		_.each(capasPOI_actives,function(capaPOI){
			if(capaPOI.rutadjunt){
				nombre = capaPOI.nombre;
				return;
			}
		});
		return nombre;
	}
	self.isCapaRutadjunt = function(capa_nombre){
		return capasPOI[capa_nombre].atributos.UID_ruta;
	}

	self.getEditingPOIParams = function(){
		var marker = self.editingPOI;
		if(marker){
			return {
				id: marker.feature.id,
				UID : marker.feature.properties.UID,
				nombrePOI : marker.feature.properties.nombre,
				es_representante : (marker.feature.properties.representante == user_data.user_id),
				capa_nombre : marker.feature.properties.capa,
				zonaPOI: marker.feature.properties.zona,
				direccionPOI : marker.feature.properties.direccion,
				lat : marker.feature.geometry.coordinates[1],
				lng : marker.feature.geometry.coordinates[0],
				fotoPOI : marker.feature.properties.imagen,
				url_imagen : marker.feature.properties.url_imagen,
				secundarias : marker.feature.properties.secundarias,
				atributos : marker.feature.properties.atributos,
				icon : marker.feature.properties.icon
			};
		}
		else return null;
	}

	self.getEditingPOIid = function(){
		var marker = self.editingPOI;
		if(marker) return marker.feature.id;
		else return undefined;
	}
	self.getEditingPOIUID = function(){
		var marker = self.editingPOI;
		if(marker) return marker.feature.properties.UID;
		else return undefined;
	}
	self.getEditingPOIcapa = function(){
		var marker = self.editingPOI;
		if(marker) return marker.feature.properties.capa;
		else return undefined;
	}

	self.setEditPOI = function(UID){ // Devuelve el parMarker
		var UID_box;
		if(UID_box = self.isMarkerPOI(UID)){
			biciMapaUI.cleanParam(UID_box);
		}
		marker = self.findPOILayer(UID);
		self.editingPOI = marker;
		self.removePOIInterfaz(marker);
		
		return {addr:marker.feature.properties.direccion,coord:marker.getLatLng()};
	}

	self.unsetEditPOI = function(POIactualizado){
		var marker = self.editingPOI;
		if(marker && !POIactualizado){ // SI no fue actualizado, regresa el POI al mapa
			self.addPOIInterfaz(marker);
		}
		self.editingPOI = undefined;
	}

	self.updatePOIState = function(UID,options){

		if(options.estado=='eliminado' || options.estado=='inapropiado'){
			self.removePOI(UID);
		}
		else{
			var marker = self.findPOILayer(UID);

			marker.feature.properties.estado = options.estado;

			var icono = self.icons[self.getPrefijoCapa(marker.feature)][options.estado];
			marker.setIcon(icono);
			
			if(options.mensaje_estado){
				marker.feature.properties.usuario_estado = user_data.user_id;
				marker.feature.properties.usuario_estado_vcard = biciMapaUI.getVcard();
				marker.feature.properties.mensaje_estado = options.mensaje_estado;
			}
			else{
				marker.feature.properties.mensaje_estado = false;
			}
			
			_.each(options.permisos,function(permiso,clave){
				marker.feature.properties[clave] = permiso;
			});
			
			self.setDetallePOI(marker.feature,marker);
			self.findMarker(UID);
		}

		if(user_data.user_rol=='admin' || user_data.user_rol=='colab'){
			self.updatePOIAdmin(UID,options.estado);
		}
	}

	self.getPrefijoCapa = function(UID_feature){
		var feature = UID_feature;
		if(_.isString(UID_feature)){
			feature = (self.findPOILayer(UID_feature));
			if(_.isUndefined(feature)) return undefined;
			else if(_.isUndefined(feature.feature)) return undefined;
			else feature = feature.feature;
		}
		
		var prefijo_capa = feature.properties.capa;
		/*var icono_personal = feature.properties.atributos? feature.properties.atributos.icono : undefined;
		if(self.checkPrefijoCapa(icono_personal)) prefijo_capa = icono_personal;*/
		if(self.checkPrefijoCapa(feature.properties.icon)) prefijo_capa = feature.properties.icon;
		
		return prefijo_capa;
	}
	self.checkPrefijoCapa = function(icono_personal){ 
		return (icono_personal && self.icons[icono_personal]);
	}

	self.initIcons = function(){
		self.icons['size'] = {
			iconRouteSize: [32,41],
			iconRouteAnchor: [16, 39], // restar 2px por la sombra
			iconRoutePopupAnchor: [0,-39],

			iconSize: [22,28],
			iconAnchor: [11,28],
			iconPopupAnchor: [0,-28],
			
			iconStatusSize: [25,33],
			iconStatusAnchor: [12,33],
			iconStatusPopupAnchor: [0,-33],
		};

		var iconUrl;
		var icon;
		var cursorUrl;

		iconUrl = BC_BM_URL + 'img/start.png';
		iconUrlNT = BC_BM_URL + 'img/start_nt.png';
		cursorUrl = BC_BM_URL + 'img/start.cur';
		icon = L.icon({iconSize: self.icons['size'].iconRouteSize,iconAnchor: self.icons['size'].iconRouteAnchor,popupAnchor: self.icons['size'].iconRoutePopupAnchor,iconUrl: iconUrl,iconUrlNT:iconUrlNT,cursorUrl:cursorUrl});
		self.icons['start'] = icon;

		iconUrl = BC_BM_URL + 'img/end.png';
		iconUrlNT = BC_BM_URL + 'img/end_nt.png';
		cursorUrl = BC_BM_URL + 'img/end.cur';
		icon = L.icon({iconSize: self.icons['size'].iconRouteSize,iconAnchor: self.icons['size'].iconRouteAnchor,popupAnchor: self.icons['size'].iconRoutePopupAnchor,iconUrl: iconUrl,iconUrlNT:iconUrlNT,cursorUrl:cursorUrl});
		self.icons['end'] = icon;

		iconUrl = BC_BM_URL + 'img/inter.png';
		iconUrlNT = BC_BM_URL + 'img/inter_nt.png';
		cursorUrl = BC_BM_URL + 'img/inter.cur';
		icon = L.icon({iconSize: self.icons['size'].iconRouteSize,iconAnchor: self.icons['size'].iconRouteAnchor,popupAnchor: self.icons['size'].iconRoutePopupAnchor,iconUrl: iconUrl,iconUrlNT:iconUrlNT,cursorUrl:cursorUrl});
		self.icons['inter'] = icon;

		iconUrl = BC_BM_URL + 'img/dot.png';
		icon = L.icon({iconSize: [15,15],iconAnchor:[7.5,7.5],popupAnchor:[0,-15],iconUrl: iconUrl});
		self.icons['dot'] = icon;
	}

	self.initIconsCapa = function(capa_nombre){
		var iconUrl;
		var icon;
		self.icons[capa_nombre] = {};

		iconUrl = BC_BM_URL + 'img/'+ capa_nombre;

		icon = L.icon({iconSize: self.icons['size'].iconSize,iconAnchor: self.icons['size'].iconAnchor,popupAnchor: self.icons['size'].iconPopupAnchor,iconUrl: iconUrl +'.png',iconUrlNT: iconUrl +'_nt.png'});
		self.icons[capa_nombre]['valido'] = icon;
		
		icon = L.icon({iconSize: self.icons['size'].iconStatusSize,iconAnchor: self.icons['size'].iconStatusAnchor,popupAnchor: self.icons['size'].iconStatusPopupAnchor,iconUrl: iconUrl +'_add.png',iconUrlNT: iconUrl +'_nt_add.png',cursorUrl: iconUrl +'.cur'});
		self.icons[capa_nombre]['newPOI'] = icon;
	
		icon = L.icon({iconSize: self.icons['size'].iconStatusSize,iconAnchor: self.icons['size'].iconStatusAnchor,popupAnchor: self.icons['size'].iconStatusPopupAnchor,iconUrl: iconUrl +'_ini.png',iconUrlNT: iconUrl +'_nt_ini.png'});
		self.icons[capa_nombre]['start'] = icon;

		icon = L.icon({iconSize: self.icons['size'].iconStatusSize,iconAnchor: self.icons['size'].iconStatusAnchor,popupAnchor: self.icons['size'].iconStatusPopupAnchor,iconUrl: iconUrl +'_fin.png',iconUrlNT: iconUrl +'_nt_fin.png'});
		self.icons[capa_nombre]['end'] = icon;

		icon = L.icon({iconSize: self.icons['size'].iconStatusSize,iconAnchor: self.icons['size'].iconStatusAnchor,popupAnchor: self.icons['size'].iconStatusPopupAnchor,iconUrl: iconUrl +'_inter.png',iconUrlNT: iconUrl +'_nt_inter.png'});
		self.icons[capa_nombre]['inter'] = icon;

		self.icons[capa_nombre]['cluster'] = iconUrl+'.png';

		if(capasPOI[capa_nombre].tipo == 'community' || capasPOI[capa_nombre].tipo == 'user'){
			icon = L.icon({iconSize: self.icons['size'].iconStatusSize,iconAnchor: self.icons['size'].iconStatusAnchor,popupAnchor: self.icons['size'].iconStatusPopupAnchor,iconUrl: iconUrl +'_moderar.png',iconUrlNT: iconUrl +'_nt_moderar.png'});
			self.icons[capa_nombre]['moderar'] = icon;
			
			icon = L.icon({iconSize: self.icons['size'].iconStatusSize,iconAnchor: self.icons['size'].iconStatusAnchor,popupAnchor: self.icons['size'].iconStatusPopupAnchor,iconUrl: iconUrl +'_validar.png',iconUrlNT: iconUrl +'_nt_validar.png'});
			self.icons[capa_nombre]['validar'] = icon;
			self.icons[capa_nombre]['actualizado'] = icon; // Icono para actualizados es el mismo que para validar

			icon = L.icon({iconSize: self.icons['size'].iconStatusSize,iconAnchor: self.icons['size'].iconStatusAnchor,popupAnchor: self.icons['size'].iconStatusPopupAnchor,iconUrl: iconUrl +'_invalido.png',iconUrlNT: iconUrl +'_nt_invalido.png'});
			self.icons[capa_nombre]['invalido'] = icon;
		}

		// CUSTOM ICONS_____________________________________
		iconUrl = BC_BM_URL + 'img/custom_icons/lhp.png';
		icon = L.icon({iconSize: self.icons['size'].iconSize,iconAnchor: self.icons['size'].iconAnchor,popupAnchor: self.icons['size'].iconPopupAnchor,iconUrl: iconUrl});
		self.icons['lhp'] = {valido:icon,start:icon,end:icon};

	}

	self.setClusterIcon = function(cluster,shownCount) {
		var capa_nombre = (cluster.getAllChildMarkers())[0].feature.properties.capa;
		// var childCount = '';
		// if(shownCount) childCount = cluster.getChildCount();
		var childCount = cluster.getChildCount();
		var apellido = capasPOI[capa_nombre].plural;
		
		var url = self.icons[capa_nombre]['cluster'];
		return new L.DivIcon({ 
			// html: '<div class="cluster-childCount" style="background-image:url('+url+');">'+childCount+'</div>',
			html: '<div class="cluster-childCount" style="background-image:url('+url+');" '
				+' title="'+childCount+' '+ apellido +'" ></div>',
			iconSize: self.icons['size'].iconSize,
			className: 'icon-cluster'
		});
	}
	
	self.setIconMarker = function(UID_box,type_marker){
		var marker = self.getMarker(UID_box);
		if(marker){
			if(self.isPOIMarker(UID_box)){
				var prefijo_capa = self.getPrefijoCapa(marker.feature);
				if(type_marker) marker.setIcon(self.icons[prefijo_capa][type_marker]);
				else marker.setIcon(self.icons[prefijo_capa][estado]);
			}
			else if(UID_box=='newPOI') marker.setIcon(self.icons[biciMapaUI.getTipoColabora()]['newPOI']);
			else if(type_marker) marker.setIcon(self.icons[type_marker]);
		}
	}

	self.getIconUrl = function(nt,type_marker_capa_nombre,estado){
		var tipo = nt=='cursor'? 'cursorUrl' : (nt? 'iconUrlNT' : 'iconUrl');
		if(estado && self.icons[type_marker_capa_nombre] 
			&& self.icons[type_marker_capa_nombre][estado] && self.icons[type_marker_capa_nombre][estado].options)
				return self.icons[type_marker_capa_nombre][estado].options[tipo];
		
		if(self.icons[type_marker_capa_nombre] && self.icons[type_marker_capa_nombre].options)
			return self.icons[type_marker_capa_nombre].options[tipo];
		
		return '';
	}


	self.switchTiles = function(){
		if(self.mapStyles.actual=='road') self.setMapStyle('satelite');
		else self.setMapStyle('road');
	}
	self.initMapStyle = function(back_road,back_satelite){ 
		// SIEMPRE CARGA SOLO UNO POR TIPO, PUES LOS PAGADOS CONSUMEN TAN SOLO CARGANDOLOS
		//_______________________________________________SATELITE MAPS ____________________________________________
		if(back_satelite=='mqs'){
			self.mapStyles.satelite = L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.png',{
				type: 'osm',subdomains: '1234',maxZoom:11,attribution: 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2012 CloudMade'
			});
		}
		else if(back_satelite=='mbps'){
			var MapBox_sat_id = 'bicimapa-prod.hg7he0gg';// PRODUCCIÓN
			self.mapStyles.satelite = L.mapbox.tileLayer(MapBox_sat_id);
		}
		else if(back_satelite=='mbps2'){
			var MapBox_sat_id = 'bicimapa-prod-2.hj5o8gm1';// PRODUCCIÓN 2 
			self.mapStyles.satelite = L.mapbox.tileLayer(MapBox_sat_id);
		}
		//_______________________________________________ROAD MAPS ____________________________________________	
		if(back_road=='mq'){
			self.mapStyles.road = L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/{type}/{z}/{x}/{y}.png', {
				type: 'osm',subdomains: '1234',attribution: 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2012 CloudMade'
			});
		}
		else if(back_road=='rtc'){
			self.mapStyles.road = L.tileLayer('http://stache1.ridethecity.com/tiles.py/composite/{z}/{x}/{y}.png', {
				key: 'BC9A493B41014CAABB98F0471D759707',attribution: 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2012 CloudMade'
			});
		}
		else if(back_road=='osm'){
			self.mapStyles.road = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2012 CloudMade'
			});
		}
		else if(back_road=='ggl'){
			self.mapStyles.road = L.tileLayer('http://mt0.google.com/vt/x={x}&y={y}&z={z}');
		}
		/*else if(back_road=='clm'){
			var BCBM_cloudmade_id = 117061; //SIN CICLOVÍAS
			self.mapStyles.road = L.tileLayer('http://{s}.tile.cloudmade.com/2509d05e9aff4f5d8f54d8fa6641cab5/'+ BCBM_cloudmade_id +'/256/{z}/{x}/{y}.png', {
				subdomains: 'abc',attribution: 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2012 CloudMade'});
		}*/
		/*else if(back_road=='mbp'){
			var MapBox_id = 'bicimapa-prod.hg6bp6o9';// PRODUCCIÓN
			self.mapStyles.road = L.mapbox.tileLayer(MapBox_id);
		}*/
		else if(back_road=='mbp2'){
			var MapBox_id = 'bicimapa-prod-2.hj5lc9j8';// PRODUCCIÓN gratis hasta 22 Junio/2014
			self.mapStyles.road = L.mapbox.tileLayer(MapBox_id);
		}
		else if(back_road=='mbd'){
			var MapBox_id = 'bicimapa-dev.hfpig729';// DEV
			self.mapStyles.road = L.mapbox.tileLayer(MapBox_id);
		}
		else if(back_road=='mbt'){
			var MapBox_id = 'bicimapa-test.hfpj1lhk';// TEST
			self.mapStyles.road = L.mapbox.tileLayer(MapBox_id);
		}
		//_______________________________________________CICLOWAYS MAPS ____________________________________________
		// self.mapStyles.cicloway = L.tileLayer('http://tiles.bicimapa.cl/?z={z}&x={x}&y={y}',{tms:true});
		self.mapStyles.cicloway = L.tileLayer('http://tileserver.bicimapa.net/?z={z}&x={x}&y={y}',{tms:true});
		self.biciMapa.addLayer(self.mapStyles.cicloway);

		self.mapStyles.actual = 'road';
		self.setMapStyle(self.mapStyles.actual);
	}

	self.setMapStyle = function(style){
		self.biciMapa.removeLayer(self.mapStyles[self.mapStyles.actual]);
		self.mapStyles.actual = style;
		var actualTileOBJ = self.mapStyles[self.mapStyles.actual];
		
		var actualZoom = self.biciMapa.getZoom();
		var newMaxZoom = actualTileOBJ.options.maxZoom;
		if(actualZoom > newMaxZoom)	self.biciMapa.setZoom(newMaxZoom);
		
		self.biciMapa.addLayer(actualTileOBJ);
		self.mapStyles[style].bringToBack();
	}

	self.initMap = function(lon,lat,zoom,back_road,back_satelite){
		self.listasPOI = {favoritos:undefined,administrarpoi:undefined};
		
		self.initIcons();
		self.initRouteStyles();

		// self.minLocateAccuracy = 100;
		self.minLocateAccuracy = 10000000;
		self.maxRouteDistance = 200000; // 2 Km
		self.zZona = 8; // Nivel de zoom que regula la división de zonas
		self.limitLoadZones = 10; // Límite de zonas/capas a cargar por iteración
		self.alertLoadingZones = 10; // Si encola más zonas/capas para cargar se muestra advertencia.
		self.limitQueueLoadZones = 16; // 16 es más que suficiente
		/*self.limitLoadCapas = 4; // Límite de zonas de capas a cargar por conexión
		self.zZonaCapas = 5;
		self.zZonaRutas = 12;*/

		//mapquest,yahoo,google,nominatim
		// self.gcService = 'google'; 
		self.gcService = 'mapquest';

		L.mapbox.accessToken = 'pk.eyJ1IjoiYmljaW1hcGFuZXQiLCJhIjoiY2ludjljbW9vMTNraHU2bHkyc3R2bHZhdyJ9.eYI9GUXdRLb-lKlFqqej0Q';
		self.biciMapa = L.mapbox.map('map', 'mapbox.streets');
		/*self.biciMapa = L.map('map',{
			zoomControl:false
			,attributionControl:false
			,noWrap:true
			// ,scrollWheelZoom:false
		});*/
		/*self.biciMapa = new mapboxgl.Map({
			container: 'map', // container id
			style: 'https://www.mapbox.com/mapbox-gl-styles/styles/outdoors-v7.json', //stylesheet location
			// center: [40, -74.50], // starting position
			zoom: 9 // starting zoom
		});*/

		self.interfacesPOI = L.layerGroup().addTo(self.biciMapa);
		L.control.scale({imperial:false}).addTo(self.biciMapa);
		self.biciMapa.setView([lat,lon], zoom);

		// self.initMapStyle(back_road,back_satelite);

		// Mi ubicación actual
		self.biciMapa.on('locationfound',self.locationTOcoord.found);
		self.biciMapa.on('locationerror',self.locationTOcoord.error);
		

		//Menu contextual
		self.biciMapa.on('contextmenu',self.contextmenu.init);
		
		// AQUI PARTE DEPENDENCIA CON BICIMAPA_UI
		self.switchBounds(biciMapaUI.isRestrictZoneActive());

		biciMapaUI.initCleanCache(); //Borra las caché si se dió la orden antes de cargar nada
		self.loadCapas('start'); // Inicio de carga de zonas

		self.biciMapa.on('zoomend',function(){biciMapaUI.updateZoomDisp(biciMapaOBJ.biciMapa.getZoom());});

		//DRAW
		var polygon_options = {
			showArea: false,
			shapeOptions: {
				stroke: true,
				color: '#6e83f0',
				weight: 4,
				opacity: 0.5,
				fill: true,
				fillColor: null, //same as color by default
				fillOpacity: 0.2,
				clickable: true
			}
		};
		self.biciMapa.on('draw:created',function(e){
			var type=e.layerType,layer=e.layer;
			if(layer.getBounds && self.RUTA.layer){
				self.removeVertexRuta(layer.getBounds());
				biciMapaUI.setRemoveVertexRuta.set(false);
			}
		});
		// self.rectangleDrawer = new L.Draw.Rectangle(biciMapaOBJ.biciMapa,polygon_options);
		self.rectangleDrawer = new L.Draw.Rectangle(biciMapaOBJ.biciMapa);
	}


	self.locationTOcoord = {
		locating:false,
		callback:undefined,
		locate: function(callback){
			self.locationTOcoord.callback = callback;
			self.locationTOcoord.locating = true;
			biciMapaUI.setCargando();
			self.biciMapa.locate();
		},
		found: function(location){
			if(location.accuracy<=self.minLocateAccuracy && self.locationTOcoord.locating){ //presision debe ser menor a 100m
				LOG && console.log('Ubicación encontrada. Precisión: '+location.accuracy)
				self.locationTOcoord.callback.callback(location.latlng);
				self.locationTOcoord.callback.stop();
			}
			else if(self.locationTOcoord.locating){
				self.locationTOcoord.error({message:'Precisión: '+location.accuracy});
			}
		},
		error:function(error){
			if(self.locationTOcoord.locating){
				self.locationTOcoord.callback.stop();
				var errorcod=' (r55)';
				biciMapaUI.setMessage('Hay un problema'+errorcod,'No se pudo obtener tu ubicación','error');
				if(!error) error = {message:' Desconocido'};
				LOG && console.error('Error al obtener ubicación: '+error.message);
			}	
		},
		stop: function(){
			self.locationTOcoord.locating = false;
			self.locationTOcoord.callback = undefined;
			biciMapaUI.unsetCargando();
		}
	}

	/*self.cleanMap = function(remove_markers){
		if(!_.isUndefined(self.RUTA.obj)){
			self.biciMapa.removeLayer(self.RUTA.layer);
			self.RUTA = {obj:undefined,layer:undefined};
			_.each(self.instruccionesDots,function(dot){
				self.biciMapa.removeLayer(dot);
			})
			self.instruccionesDots = undefined;
		}
		if(remove_markers){
			self.removeMarkers();
		}
	}*/

	self.removeMarkers = function(){
		var UID_boxs = _.keys(self.rutaMarkers);
		_.each(UID_boxs,function(UID_box){
			self.removeMarker(UID_box);			
		});
	}

	self.removeMarker = function(UID_box){

		if(self.geoCodingRequest[UID_box]) self.geoCodingRequest[UID_box].abort();

		if(UID_box == 'newPOI'){
			if(!_.isUndefined(self.colaboraMarker)){	
				self.biciMapa.removeLayer(self.colaboraMarker);
				self.colaboraMarker = undefined;
			}
		}
		else{
			var marker = self.getMarker(UID_box);
			if(!_.isUndefined(marker)){
				self.biciMapa.removeLayer(marker);
				if(self.isPOIMarker(UID_box)){
					var capa_nombre = marker.feature.properties.capa;
					self.addPOIInterfaz(marker);
					marker.setIcon(self.icons[self.getPrefijoCapa(marker.feature)][marker.feature.properties.estado]);
				}
				delete(self.rutaMarkers[UID_box]);
			}	
		}
	}

	self.removePOI = function(UID){
		var UID_box;
		if(UID_box = self.isMarkerPOI(UID)){
			biciMapaUI.cleanParam(UID_box);
		}
		var marker = self.findPOILayer(UID);
		if(marker){
			var capa_nombre = marker.feature.properties.capa;
			self.removePOIInterfaz(marker);
			delete capasPOI[capa_nombre].markers[marker.feature.properties.UID];
		}
	}
	

	// COMPRESION _______________________________________________________________________________________________________________
	self.decompress = function (encoded,precision) {
		if(!precision) precision = 6;
		precision = Math.pow(10,-precision);
		var len = encoded.length, index=0, lat=0, lng = 0, array = [];
		while (index < len) {
			var b, shift = 0, result = 0;
			do {
				b = encoded.charCodeAt(index++) - 63;
				result |= (b & 0x1f) << shift;
				shift += 5;
			} while (b >= 0x20);
			var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
			lat += dlat;
			shift = 0;
			result = 0;
			do {
				b = encoded.charCodeAt(index++) - 63;
				result |= (b & 0x1f) << shift;
				shift += 5;
			} while (b >= 0x20);
			var dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
			lng += dlng;
			array.push([lat * precision,lng * precision]);
		}
		return array;
	}

	self.compress = function(points,precision){
		if(!precision) precision = 6;
		var oldLat = 0, oldLng = 0, len = points.length, index = 0;
		var encoded = '';
		precision = Math.pow(10, precision);
		_.each(points,function(point){
			var lat = Math.round(point.lat * precision);
			var lng = Math.round(point.lng * precision);
			encoded += self.encodeNumber(lat - oldLat);
			encoded += self.encodeNumber(lng - oldLng);
			oldLat = lat;
			oldLng = lng;
		});
		return encoded;
	}
	self.encodeNumber = function(num){
		var num = num << 1;
		if (num < 0) num = ~(num);
		var encoded = '';
		while (num >= 0x20) {
			encoded += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
			num >>= 5;
		}
		encoded += String.fromCharCode(num + 63);
		return encoded;
	}


	// RUTA _______________________________________________________________________________________________________________

	self.getHeightsRuta = function(){
		if(biciMapaOBJ.RUTA.layer){
			var maxPoints = 1000; //Probado con 100 coordenadas
			// Sacar muestreo?? Cargar ruta completa por pedazos??
			var coords = biciMapaOBJ.RUTA.layer.getLatLngs();
			if(coords.length<=maxPoints){
				var URL = 'http://open.mapquestapi.com/elevation/v1/profile?key=Fmjtd%7Cluub2hu7nd%2C2l%3Do5-9uzglw&inShapeFormat=cmp6&outShapeFormat=none&latLngCollection=';
				URL += self.compress(coords);

				$.ajax({
					type: 'GET',timeout: biciMapaUI.getTimeOut(),
					url: URL,
					success: function(data, textStatus, XMLHttpRequest){
						console.log(data);
						// self.setGraph(self.genGeoJson(coords,data.elevationProfile));
						self.setGraph(data.elevationProfile);
					},
					error: function(MLHttpRequest, textStatus, errorThrown){
						LOG && console.error('Error al invocar servicio: '+errorThrown);
					},
					complete: function(jqXHR,textStatus){}
				});
			}
			else{
				biciMapaUI.setMessage('','Ruta muy compleja','error');
			}
		}
	}

	self.setGraph = function(elevationPairs){
		// http://www.sitepoint.com/creating-simple-line-bar-charts-using-d3-js/
		var txt = '';

		txt += '<style>';
		txt += '.axis path, .axis line{fill: none;stroke: #777;shape-rendering: crispEdges;}';
		txt += '.axis text{font-family: "Arial";font-size: 13px;}';
		txt += '.tick{stroke-dasharray: 1, 2;}';
		txt += '.bar{fill: FireBrick;}';
		txt += '</style>';

		txt += '<svg id="visualisation" width="700" height="200"></svg>';
		biciMapaUI.setBigMessage('Elevación',txt);

		var lineData = [];
		_.each(elevationPairs,function(pair){
			lineData.push({x:pair.distance,y:pair.height});
		});

		var vis = d3.select('#visualisation'),
		WIDTH = 700,HEIGHT = 200,
		MARGINS = {top: 20,right: 20,bottom: 20,left: 50},
		xRange = d3.scale.linear().range([MARGINS.left, WIDTH - MARGINS.right]).domain([d3.min(lineData, function(d){return d.x;}),d3.max(lineData,function(d){return d.x;})]),
		yRange = d3.scale.linear().range([HEIGHT - MARGINS.top, MARGINS.bottom]).domain([d3.min(lineData, function(d){return d.y;}), d3.max(lineData, function(d){return d.y;})]),
		xAxis = d3.svg.axis().scale(xRange).tickSize(5).tickSubdivide(true),
		yAxis = d3.svg.axis().scale(yRange).tickSize(5).orient('left').tickSubdivide(true);
	 
		vis.append('svg:g').attr('class', 'x axis').attr('transform', 'translate(0,' + (HEIGHT - MARGINS.bottom) + ')').call(xAxis);
		vis.append('svg:g').attr('class', 'y axis').attr('transform', 'translate(' + (MARGINS.left) + ',0)').call(yAxis);

		var lineFunc = d3.svg.line().x(function(d){return xRange(d.x);}).y(function(d){return yRange(d.y);}).interpolate('basis');

		vis.append('svg:path').attr('d', lineFunc(lineData)).attr('stroke', 'blue').attr('stroke-width', 2).attr('fill', 'none');
	}

	self.cleanRoute = function(){
		if(self.RUTA.layer && self.biciMapa.hasLayer(self.RUTA.layer)) self.biciMapa.removeLayer(self.RUTA.layer);
		self.RUTA = {obj:undefined,layer:undefined};
	}

	self.routingServices = {};
	self.routingServices.FLAT ={
		getVector: function(ruta_params){
			var coords = [];
			_.each(ruta_params.itinerario,function(param){
				coords.push(param.coord);
			});
			return coords;
		},
		getExtras: function(ruta_params){
			var via_indices = [];
			for (var i=0;i<ruta_params.itinerario.length;i++){
				via_indices.push(i); 
			};
			return via_indices;
		}
	}
	self.routingServices.OSRM ={
		maxParams:25,
		genURL: function(ruta_params){
			var URL = 'http://router.project-osrm.org/viaroute?loc=';		
			_.each(ruta_params.itinerario,function(marker_params,index){
				URL += marker_params.coord.lat+','+marker_params.coord.lng;
				if(index<ruta_params.itinerario.length-1) URL += '&loc=';
			});
			URL += '&instructions=true';
			return URL;
		},
		checkResult: function(data){
			return (data.status==0);
		},
		getVector: function(data){
			return data.route_geometry;
		},
		getExtras: function(data){
			var via_indices = data.via_indices;
			for (var i=1;i<via_indices.length;i++) {
				via_indices[i]--; 
			};
			return via_indices;
		}
	}

	self.initRouteStyles = function(){
		// Para el className. Funciona, pero no se puede cambiar el className dinamicamente :(
		// cursor: url(http://bicimapa.net/wp-content/plugins/bicicultura-bicimapa/img/inter.cur),progress;
		self.routeStyle.engine = 	{"color": "#990099","weight": 7,"opacity": 0.65,"dashArray":undefined,"className":"caca"};
		self.routeStyle.engine_hover = 	{"color": "#000000","weight": 10,"opacity": 0.65,"dashArray":undefined,"className":"caca"};

		self.routeStyle.dotted =	{"color": "#990099","weight": 4,"opacity": 0.65,"dashArray":'10,10'};
		self.routeStyle.dotted_hover =	{"color": "#000","weight": 10,"opacity": 0.65,"dashArray":'10,10'};

		self.routeStyle.error = 	{"color": "#FF0000","weight": 4,"opacity": 0.65,"dashArray":'10,10'};
		self.routeStyle.error_hover = 	{"color": "#FF0000","weight": 4,"opacity": 0.65,"dashArray":'10,10'};
		
		self.routeStyle.cicloway =	{"color": "#00FF00","weight": 2,"opacity": 0.3};
		self.routeStyle.cicloway_hover =	{"color": "#00FF00","weight": 2,"opacity": 0.3};
	}
	self.setRouteStyle = function(style){
		if(self.RUTA.layer){ 
			self.RUTA.layer.setStyle(self.routeStyle[style]);
			self.RUTA.layer.on('mouseover',function(){self.RUTA.layer.setStyle(self.routeStyle[style+'_hover']);});
			self.RUTA.layer.on('mouseout',function(){self.RUTA.layer.setStyle(self.routeStyle[style]);});
		}
	}
	self.setRouteCursor = function(){
		if(self.RUTA.layer){
			var valor = '';
			if(biciMapaUI.isOnInterDefault()){ 
				var cursorUrl = self.getIconUrl('cursor','inter');
				valor = 'url('+cursorUrl+'),auto';
			}
			$($(biciMapaOBJ.RUTA.layer._container).children()[0]).css('cursor',valor);
		}
	}

	self.isSetRuta = function(){
		return !_.isUndefined(self.RUTA.layer);
	}


	self.getRouteFlat = function(ruta_params){
		var vector,extras,style;
		servicio = self.routingServices.FLAT;
		vector = servicio.getVector(ruta_params);
		extras = servicio.getExtras(ruta_params);
		// style = 'dotted';
		// self.setRoute(vector,extras,style);
		self.setRoute(vector,extras);
	}

	self.getRoute = function(ruta_params,loadcache,savecache){
		var hayruta=false,vector,extras,style;

		var servicio = self.routingServices[ruta_params.tipo_ruta];
		var URL = servicio.genURL(ruta_params);
		biciMapaUI.setCargando();

		if(self.geoCodingRequest['ruta']) self.geoCodingRequest['ruta'].abort();
		self.geoCodingRequest['ruta'] = 
		$.ajax({
			type: 'GET',timeout: biciMapaUI.getTimeOut(),
			url: URL,
			success: function(data, textStatus, XMLHttpRequest){
				if(servicio.checkResult(data)){
					
					// *******************************************************+
					/*console.log(data);
					indices = data.via_indices;*/
					// *******************************************************+

					vector = servicio.getVector(data);
					extras = servicio.getExtras(data);
					style = 'engine';
					hayruta=true;
				}
				else{
					LOG && console.error('Error al deplegar ruta');
					var errorcod=' (r73)';
					biciMapaUI.setMessage("Hay un problema"+errorcod,"No encontramos una ruta para ti. Inténtalo de nuevo.",'error');
					LOG && console.log(data);
				}
			},
			error: function(MLHttpRequest, textStatus, errorThrown){
				if(textStatus!='abort'){
					LOG && console.error('Error al invocar servicio: '+errorThrown);
					var errorcod=' (r74)';
					biciMapaUI.setMessage("Hay un problema"+errorcod,"No encontramos una ruta para ti. Inténtalo de nuevo.",'error');
				}
			},
			complete: function(jqXHR,textStatus){
				// biciMapaUI.unsetBuscando(mensaje);
				biciMapaUI.unsetCargando();
				if(textStatus!='abort'){
					if(!hayruta){ 
						servicio = self.routingServices.FLAT;
						vector = servicio.getVector(ruta_params);
						extras = servicio.getExtras(ruta_params);
						style = 'error';
					}
					self.setRoute(vector,extras,style);
					self.geoCodingRequest['ruta'] = undefined;
				}
			}
		});
	}

	self.setRoute = function(coords_vector,extras,style,noUpdateMode){
		self.cleanRoute();
		if(!style) style = 'engine';
		var coords;
		if(_.isString(coords_vector)) coords = self.decompress(coords_vector);
		else coords = coords_vector;

		self.RUTA.obj = {extras:{via_indices:extras}}; // Si cambia la ruta se borran los extras!
		
		self.RUTA.layer = L.polyline(coords);
		
		/*var supercoords = [];
		for(var i=0;i<coords.length-1;i++){
			supercoords[i] = [coords[i],coords[i+1]];
		}
		self.RUTA.layer = L.multiPolyline(supercoords);*/



		self.RUTA.layer.addTo(biciMapaOBJ.biciMapa);
		self.setRouteStyle(style);
		self.setAddInterRoute();
		biciMapaUI.getRuta_callbak(true,noUpdateMode);

		// self.setRouteAddIntermediate();
	}

	self.setAddInterRoute = function(){
		// Normalizar indices cuando genera la ruta
		// _.each(indices,function(val,index){indices[index]++;});indices[0]=0;

		if(self.RUTA.layer){
			if(biciMapaUI.isOnInterDefault()){ 
				self.RUTA.layer.on('click',self.addInterRoute);
				self.RUTA.layer.on('contextmenu',self.addInterRoute);
			}
			else{ 
				self.RUTA.layer.off('click',self.addInterRoute);
				self.RUTA.layer.off('contextmenu',self.addInterRoute);
			}
			self.setRouteCursor();
		}
	}

	self.addInterRoute = function(e){
		var latlng = e.latlng;
		if(self.RUTA.layer){
			var latlngs = self.RUTA.layer.getLatLngs();
			var distancia = 9999999999,newdist,indice=0;
			for(var i=1;i<=latlngs.length-1;i++){
				newdist = distToSegment(latlng,latlngs[i],latlngs[i-1]);
				if(distancia>newdist){
					distancia=newdist;
					indice = i;
				}
			}
			// _clearmarkers
			/*self.dummyMarker(latlngs[indice]);
			self.dummyMarker(latlngs[indice+1]);*/
			latlngs.splice(indice,0,latlng);
			self.RUTA.layer.setLatLngs(latlngs);
			var via_indices=self.RUTA.obj.extras.via_indices;
			var posicion=0;
			for (i=0;i<via_indices.length;i++) {
				if(indice<=via_indices[i]){
					posicion = i;
					break;
				}
			}
			self.RUTA.obj.extras.via_indices.splice(posicion,0,indice);
			biciMapaUI.coordTOaddr.call(latlng,posicion);
		}
	}

	// SE ASUME QUE LOS PUNTOS DE LA RUTA SE CORRESPONDEN EN ORDEN CON EL ITINERARIO
	//YA VIENE!! y si no viene?? Si no viene se desactiva la opcion no mas po
	/*self.linkRouteMarkers = function(){
		var indice=0,indice_aux=0,d1,d2,marker,UID_box;
		var points = self.RUTA.layer.getLatLngs();
		var itinerario = biciMapaUI.getItinerario();
		
		_.each(itinerario,function(UID_box){
			marker = self.rutaMarkers[UID_box];
			for(var i=indice;i<points.length-1;i++){
				d1 = marker.getLatLng().distanceTo(points[i]);
				d2 = marker.getLatLng().distanceTo(points[i+1]);
				if(d1<d2) indice_aux = i;
				else indice_aux = i+1;

			}
			marker.routeLink = indice_aux;
			indice = indice_aux++;
		});	
	}
	self.linkRouteMarker = function(){
	}
	*/


	/*
	//UNA MIERDA, NO SIRVE
	self.setRouteAddIntermediate = function(){
		var time=1000;
		if(self.isSetRuta()){
			self.RUTA.layer.on('mouseover',function(e){
				delay(function(){
					if(!self.markerAddRoute){ 
						self.markerAddRoute = new L.marker(e.latlng,{draggable:false,zIndexOffset:1000,icon:self.icons['inter']});
						self.markerAddRoute.addTo(self.biciMapa);
					}
				},time);
			});
			self.RUTA.layer.on('mousemove',function(e){
				self.markerAddRoute.setLatLng(e.latlng);
			});
			self.RUTA.layer.on('mouseout',function(){
				delay(function(){
					if(self.markerAddRoute){
						self.biciMapa.removeLayer(self.markerAddRoute);
						self.markerAddRoute = undefined;
					}
				},time);
			});
		}
	}*/

	self.getVectorRuta = function(){ if(self.RUTA.layer) return self.compress(self.RUTA.layer.getLatLngs()); }
	self.getExtrasRuta = function(){ if(self.RUTA.obj) return self.RUTA.obj.extras; }
	
	self.getTotalDistanceRuta = function(){ 
		if(self.RUTA.layer){
			var total = 0;
			var coords = self.RUTA.layer.getLatLngs();
			for(var i=0;i<coords.length-1;i++){
				total += coords[i].distanceTo(coords[i+1]);
			}
			return total;
		}
		else return undefined;
	}

	self.saveRouteCache = function(ruta_obj){
		var keyMap =  self.getKeyMap(ruta_obj.params);
		
		// Carga los indices keymap y UID
		var bicimapaRutas = (_.isUndefined(amplify.store('bicimapaRutas')))? {} : amplify.store('bicimapaRutas');

		//Guarda o sobreescribe el objeto ruta
		amplify.store(keyMap,ruta_obj);
		
		// Verifica si ya está indizado
		if(_.isUndefined(bicimapaRutas[ruta_obj.UID])){
			bicimapaRutas[ruta_obj.UID] = keyMap;
		}
		amplify.store('bicimapaRutas',bicimapaRutas);
	}

	self.getKeyMap = function(ruta_params){
		return ruta_params.tipo_ruta +'|'+ 
				ruta_params.s_address +'|'+ 
				ruta_params.s_coord.lat+','+ ruta_params.s_coord.lng +'|'+ 
				ruta_params.e_address +'|'+ 
				ruta_params.e_coord.lat+','+ ruta_params.e_coord.lng +'|'+
				ruta_params.extra_param_1;
	}
	
	self.getRouteCache = function(UID_params){
		var bicimapaRutas = amplify.store('bicimapaRutas');
		
		if(_.isUndefined(bicimapaRutas)) return undefined;

		var keyMap;
		if(_.isString(UID_params)){
			keyMap = bicimapaRutas[UID_params];
			if(!keyMap) keyMap='-1';
		}
		else keyMap = self.getKeyMap(UID_params);
		
		return amplify.store(keyMap);
	}
	
	/*self.getRoute = function(UID_params,loadcache,savecache){
		if(_.isUndefined(loadcache)) loadcache=biciMapaUI.isCacheRoutesActive();
		if(_.isUndefined(savecache)) savecache=biciMapaUI.isCacheRoutesActive();

		var data;
		if(_.isString(UID_params)){
			biciMapaUI.cleanRoute(true);
			data = {action: 'bcbm_get_route',
				UID: UID_params
			};
		}else{
			biciMapaUI.cleanRoute(false);

			data = {action: 'bcbm_get_route',
				tipo_ruta: 		UID_params.tipo_ruta,
				s_address: 		UID_params.s_address,
				e_address: 		UID_params.e_address,
				s_coord_lat: 	UID_params.s_coord.lat,
				s_coord_lng: 	UID_params.s_coord.lng,
				e_coord_lat: 	UID_params.e_coord.lat,
				e_coord_lng: 	UID_params.e_coord.lng,
				extra_param_1: 	UID_params.extra_param_1,
				s_ispoi: 		UID_params.s_ispoi,
				e_ispoi: 		UID_params.e_ispoi 		
			};
		}

		var ruta_obj = undefined;
		if(loadcache) ruta_obj = self.getRouteCache(UID_params);

		if(_.isUndefined(ruta_obj)){
			LOG && console.log("NO esta la ruta en cache");

			var mensaje = biciMapaUI.setCargando(); 
		
			if(self.geoCodingRequest['ruta']) self.geoCodingRequest['ruta'].abort();
			self.geoCodingRequest['ruta'] = 
			$.ajax({
				type: 'POST',timeout: biciMapaUI.getTimeOut(),
				url: baseUrl + '/wp-admin/admin-ajax.php',
				data: data,
				success: function(data, textStatus, XMLHttpRequest){
					
					ruta_obj = JSON.parse(data);
					
					if(ruta_obj.estado=='OK'){ 
						LOG && console.log('Ruta obtenida desde '+ruta_obj.fuente);

						ruta_obj = ruta_obj.ruta;

						//Completa las propiedades faltantes del objeto ruta
						if(_.isString(UID_params)) ruta_obj.UID = UID_params;
						else ruta_obj.params = UID_params;

						self.displayRoute(ruta_obj,savecache);
					}
					else{
						LOG && console.error('Error al deplegar ruta');
						var errorcod=' (r56)';
						biciMapaUI.setMessage("Hay un problema"+errorcod,"No encontramos una ruta para ti. Inténtalo de nuevo.",'error');
						LOG && console.log(ruta_obj);
					}
				},
				error: function(MLHttpRequest, textStatus, errorThrown){
					if(textStatus!='abort'){
						LOG && console.error('Error al invocar servicio: '+errorThrown);
						var errorcod=' (r57)';
						biciMapaUI.setMessage("Hay un problema"+errorcod,"No encontramos una ruta para ti. Inténtalo de nuevo.",'error');
					}
				},
				complete: function(jqXHR,textStatus){
					// biciMapaUI.unsetBuscando(mensaje);
					biciMapaUI.unsetCargando();
					self.geoCodingRequest['ruta'] = undefined;
				}
			});
		}
		else{
			LOG && console.log("SI esta la ruta en cache");

			$.ajax({
				type: 'POST',timeout: biciMapaUI.getTimeOut(),
				url: baseUrl + '/wp-admin/admin-ajax.php',
				data:{
					action:'bcbm_add_history_ruta',
					ruta_id:ruta_obj.id
				},
				success: function(data, textStatus, XMLHttpRequest){
					LOG && console.log('actualizado historial: '+data);
				},
				error: function(MLHttpRequest, textStatus, errorThrown){
					LOG && console.error('Error actualizado historial');
				},
				complete: function(jqXHR,textStatus){}
			});
			
			self.displayRoute(ruta_obj,false);
		}
	}*/

	self.displayRoute = function(ruta_obj,savecache) {
		self.RUTA.obj = ruta_obj;
		self.RUTA.layer = L.geoJson([ruta_obj.vector]);
		// self.setRouteStyle('engine');
		
		self.displayType='route';
		self.POIQueue=[];
		self.capasQueue=[];
		var capa_nombre;
		if(ruta_obj.params.s_ispoi){
			var s_UID = ruta_obj.params.s_ispoi.split('|')[0];
			var coord = new L.LatLng(ruta_obj.params.s_coord.lat,ruta_obj.params.s_coord.lng);
			if(!self.findPOILayer(s_UID)){
				self.POIQueue.push({UID:s_UID,latlng:coord});
				capa_nombre = ruta_obj.params.s_ispoi.split('|')[1];
				self.capasQueue.push(capa_nombre);
			}
		}
		if(ruta_obj.params.e_ispoi){
			var e_UID = ruta_obj.params.e_ispoi.split('|')[0];
			var coord = new L.LatLng(ruta_obj.params.e_coord.lat,ruta_obj.params.e_coord.lng);
			if(!self.findPOILayer(e_UID)){
				self.POIQueue.push({UID:e_UID,latlng:coord});
				capa_nombre = ruta_obj.params.e_ispoi.split('|')[1];
				self.capasQueue.push(capa_nombre);
			}
		}

		var active  = biciMapaUI.isAutoLoadActive();
		if(active) biciMapaUI.setAutoLoadActive(false); // desactiva la carga hasta que se ajuste el mapa a la ruta.
		self.biciMapa.fitBounds(self.RUTA.layer.getBounds());
		self.setCapasZonas();
		if(active) biciMapaUI.setAutoLoadActive(true);
		
		if(savecache) self.saveRouteCache(self.RUTA.obj);
	}
	
	self.getRutaParams = function(){
		return self.RUTA.obj.params;
	}

	self.displayRoute_aux = function(){
		self.RUTA.layer.on('click',function(){
			self.centerRoute();
		});

		self.RUTA.layer.addTo(self.biciMapa);
		self.setRouteStyle('engine');//Definir despues de añadir al mapa
		if(self.RUTA.obj.params.tipo_ruta=='MQ'){
			self.setInstruccionesRuta();
		}

		biciMapaUI.setDetalleRuta(self.RUTA.obj);
	}

	self.setInstruccionesRuta = function(){
		var latlng;
		self.instruccionesDots = [];
		_.each(self.RUTA.obj.extras.instrucciones,function(instruccion,key){
			latlng = {lat:instruccion.point.lat,lng:instruccion.point.lng};
			self.instruccionesDots.push(self.setInstructionDot(latlng,instruccion.narrative,key));
		});
	}

	self.viewInstruction = function(key_instruction){
		if(!_.isUndefined(key_instruction))	self.key_instruction = key_instruction;
		var dot = self.instruccionesDots[self.key_instruction];
		self.biciMapa.setView(dot.getLatLng(),self.biciMapa.getZoom());
		dot.openPopup();
	}

	self.firstInstruction = function(){
		self.key_instruction = 0;
		self.findMarker('end');
	}
	self.lastInstruction = function(){
		self.key_instruction = _.size(self.instruccionesDots)-1;
		self.findMarker('start');
	}
	self.nextInstruction = function(){
		var instrucciones_size = _.size(self.instruccionesDots);
		if(self.key_instruction<instrucciones_size-1) self.key_instruction++;
		// if(self.key_instruction<instrucciones_size-1) 
			self.viewInstruction();
		// else self.findMarker('end');
	}
	self.prevInstruction = function(){
		if(self.key_instruction>0) self.key_instruction--;
		// if(self.key_instruction>0) 
			self.viewInstruction();
		// else self.findMarker('start');
	}

	self.centerRoute = function(){
		if(self.RUTA.layer){ 
			var bounds = self.RUTA.layer.getBounds();
			_.each(self.rutaMarkers,function(marker){
				bounds.extend(marker.getLatLng());
			});
			self.biciMapa.fitBounds(bounds);
		}
	}

	self.setInstructionDot = function(latlng,text,key){
		var icon = self.icons['dot'];
		var dot = new L.marker(latlng,{icon: icon,draggable:false,zIndexOffset:1000});
		self.setDetalleInstructionDot(dot,text);
		dot.on('popupopen',function(){
			self.key_instruction = key;
		});
		self.biciMapa.addLayer(dot);
		return dot;
	}

	self.fixRutaMarker = function(UID_box,onoff){
		var marker = self.rutaMarkers[UID_box];
		if(marker){
			if(onoff) marker.dragging.disable();
			else if(!self.isPOIMarker(UID_box)) marker.dragging.enable();
		}
	}

	self.setEditRuta = function(onoff){
		if(self.RUTA.layer){
			if(onoff) self.RUTA.layer.editing.enable();
			else self.RUTA.layer.editing.disable();
		}
	}
	self.setRemoveVertexRuta = function(onoff){
		if(onoff) self.rectangleDrawer.enable();
		else self.rectangleDrawer.disable();
	}
	self.removeVertexRuta = function(bounds){
		if(self.RUTA.layer){
			var latlngs = self.RUTA.layer.getLatLngs();
			var newLatLngs = [];
			_.each(latlngs,function(latlng){
				if(!bounds.contains(latlng)) newLatLngs.push(latlng);
			});
		}
		if(newLatLngs.length<2){ 
			newLatLngs = [latlngs[0],latlngs[latlngs.length-1]];
		}
		self.RUTA.layer.setLatLngs(newLatLngs);
		if(self.RUTA.layer.editing.enabled()) self.RUTA.layer.editing.updateMarkers();
		else biciMapaUI.updateDistanceRoute(self.getTotalDistanceRuta());
	}

	//_________________________________________________________________________________________________________

	self.setPOIMarker = function(UID,UID_box,type_marker,coord){
		var marker = self.findPOILayer(UID);
		if((marker && !coord) || (marker && marker.getLatLng().equals(coord))){
			// self.setIconPOI(marker,type_marker); // Se hace desde UI
			self.rutaMarkers[UID_box] = marker;
			var capa_nombre = marker.feature.properties.capa;
			self.removePOIInterfaz(marker);
			marker.addTo(self.biciMapa);

			marker.off('contextmenu');
			marker.on('contextmenu',function(){
				biciMapaUI.cleanParam(UID_box);
				marker.off('contextmenu');
				marker.on('contextmenu',function(){this.openPopup();});
			});

			return true; 
		}
		else return false;
	}

	// self.setMarker = function(latlng,addr,notes,UID_box,noDragable){
	self.setMarker = function(latlng,UID_box,noDragable){
		var marker = new L.marker(new L.LatLng(latlng.lat,latlng.lng),{draggable:!noDragable,zIndexOffset:1000});
		
		if(UID_box!='newPOI'){
			self.rutaMarkers[UID_box] = marker;
			// marker.on('dragstart',function(){this.unbindPopup();}); //CUCHUFLETA
			marker.on('dragend',function(){
				if(biciMapaUI.getRoutingMode()=='find'){
					biciMapaUI.coordTOaddr.call(this.getLatLng(),UID_box);
				}
			});
			marker.on('contextmenu',function(){biciMapaUI.cleanParam(UID_box);});
			// self.setIconMarker(marker,type_marker); // NO se necesita, se actualiza después
		}
		else{
			self.colaboraMarker = marker;
			self.setIconMarker(UID_box);
			marker.on('dragend',function(){ 
				if(!self.checkZonaMarker(this.getLatLng())){
					biciMapaUI.errorZona(UID_box);
				}
			});
		}
		
		// self.setDetalleMarker(UID_box,addr,notes); // Se llama despues
		marker.addTo(self.biciMapa);

		return true;
	}

	/*self.findAdminPOI = function(estado,anterior,no_show){
		if(!no_show && estado == 'moderar'){
			self.switchVersion('clean');
		}

		if(self.adminPOI[estado].length == 0){
			biciMapaUI.setOnMarkerAdmin(estado);
		}
		else{
			if(anterior){
				if(anterior!='actual'){
					if(self.adminPOI[estado+'_index'] > 0) self.adminPOI[estado+'_index']--;
					else self.adminPOI[estado+'_index'] = self.adminPOI[estado].length-1;
				}
			}
			else{
				if(self.adminPOI[estado+'_index'] < self.adminPOI[estado].length-1) self.adminPOI[estado+'_index']++;
				else self.adminPOI[estado+'_index'] = 0;
			}
			
			var index = self.adminPOI[estado+'_index'];
			var marker = self.findPOILayer(self.adminPOI[estado][index]);
			
			biciMapaUI.setOnMarkerAdmin(estado,marker.feature.properties.capa,marker.feature.properties.nombre);
			if(!no_show){
				self.findMarker(marker.feature.properties.UID);
			}
		}	
	}*/

/*	self.updatePOIAdmin = function(UID,estado){
		_.each(self.adminPOI,function(pois,estadillo){
			var index = _.indexOf(pois,UID);
			if(index!=-1){
				pois.splice(index,1);
				if(index == self.adminPOI[estadillo+'_index']){
					self.findAdminPOI(estadillo,false,true);
				}
			}
		});

		if(self.isEstadoAdmin(estado)){
			self.adminPOI[estado].push(UID);
			if(self.adminPOI[estado].length == 1){
				self.findAdminPOI(estado,false,true);
			}

		}
	}*/

	/*self.initAdminPOI = function(){
		self.adminPOI = {
			moderar:[],moderar_index:0,
			invalido:[],invalido_index:0,
			validar:[],validar_index:0
		};
		
		var estado;
		_.each(self.POI_layers,function(capa,capa_nombre){
			
			_.each(capa.capa._layers,function(layer){
				estado = layer.feature.properties.estado;

				if(self.isEstadoAdmin(estado)){
					self.adminPOI[estado].push(layer.feature.properties.UID);
				}
			});
		});

		if(user_data.user_rol=='admin'){
			self.findAdminPOI('moderar',false,true);
		}
		self.findAdminPOI('invalido',false,true);
		self.findAdminPOI('validar',false,true);
	}*/

	self.findPOILayer = function(id_UID_name){
		var result;
		if(id_UID_name){
			var condicion = false;
			_.each(capasPOI,function(capa,capa_nombre){//ARREGLAR CON UN ÍNDICE UID->capa_nombre
				_.each(capa.markers,function(marker){
					condicion = (marker.feature.properties.nombre.toUpperCase() == id_UID_name.toUpperCase());
					condicion = condicion || (marker.feature.properties.UID == id_UID_name);
					condicion = condicion || (marker.feature.id == id_UID_name);
					if(condicion){
						result = marker;
					}
				});
			});
		}
		return result;
	}

	self.getPOIUID = function(name_UID_box){
		var POI = self.findPOILayer(name_UID_box);
		if(!POI && self.isPOIMarker(name_UID_box)) POI = self.getMarker(name_UID_box);
		
		if(POI)	return 	POI.feature.properties.UID;
		else return undefined;
	}

	self.getPOIid = function(UID){
		var POI = self.findPOILayer(UID);
		if(POI)	return 	POI.feature.id;
		else return undefined;
	}
	// self.getPOIdate = function(UID){
	// 	var POI = self.findPOILayer(UID);
	// 	if(POI)	return 	POI.feature.properties.fecha_estado;
	// 	else return undefined;
	// }
	self.getPOIlatlng = function(UID){
		var POI = self.findPOILayer(UID);
		if(POI)	return 	POI.getLatLng();
		else return undefined;
	}
	self.getPOIcapa = function(UID){
		var POI = self.findPOILayer(UID);
		if(POI)	return 	POI.feature.properties.capa;
		else return '';
	}
	self.getPOInombre = function(UID){
		var POI = self.findPOILayer(UID);
		if(POI)	return 	POI.feature.properties.nombre;
		else return undefined;
	}
	self.getPOIFeature = function(UID){
		var POI = self.findPOILayer(UID);
		if(POI)	return 	POI.feature;
		else return undefined;
	}

	self.coordTOaddr = function(latlng,UID_box,callback) {
		self.geoCodingServices[self.gcService].revGeoCode(latlng,UID_box,callback);
	}

	self.addrTOpoi = function(addr){
		var marker=self.findPOILayer(addr);
		if(marker) return marker.feature.properties.UID;
		else return undefined;
	}
	self.addrTOcoord = function(addr,UID_box,callback){
		self.geoCodingServices[self.gcService].geoCode(addr,UID_box,callback);
	}

	self.geoCodingServices = {};
	self.geoCodingServices['mapquest'] = {
		// http://developer.mapquest.com/web/products/open/geocoding-service
		geoCode: function(addr,UID_box,callback){
			var geocodeUrl = 'http://open.mapquestapi.com/geocoding/v1/address?location='+addr+'&key=Fmjtd%7Cluub2hu7nd%2C2l%3Do5-9uzglw';
			self.callGeoCoding('mapquest',geocodeUrl,UID_box,callback);
		},
		checkResult: function(data){
			if (data.results.length>0)
				return (data.results[0].locations.length>0);
			else return false;
		},
		getLatLng: function(data){
			return L.latLng({lat: data.results[0].locations[0].displayLatLng.lat,lng:data.results[0].locations[0].displayLatLng.lng});
		},
		revGeoCode: function(latlng,UID_box,callback){
			var geocodeUrl = 'http://open.mapquestapi.com/geocoding/v1/reverse?key=Fmjtd%7Cluub2hu7nd%2C2l%3Do5-9uzglw&location='+latlng.lat+','+latlng.lng;
			self.callRevGeoCoding('mapquest',geocodeUrl,UID_box,callback);
		},
		checkRevResult: function(data){
			return (data.results[0].locations.length>0);
		},
		getAddress: function(data){
			var location = data.results[0].locations[0];
			return location.street + ", " + location.adminArea5 + ", " + location.adminArea4 + ", " + location.adminArea3 + ", " + location.adminArea1;
			// return location.street + ", " + (location.adminArea5?location.adminArea5:(location.adminArea4?location.adminArea4:(location.adminArea3?location.adminArea3:(location.adminArea2?location.adminArea2:location.adminArea1))));
			
		}
	};

	self.geoCodingServices['yahoo'] = {
		// http://developer.yahoo.com/boss/geo/docs/free_YQL.html
		geoCode: function(addr,UID_box,callback){
			var geocodeUrl = encodeURI('http://query.yahooapis.com/v1/public/yql?q=SELECT+*+FROM+geo.places+WHERE+text="'+addr+'"&format=json');
			self.callGeoCoding('yahoo',geocodeUrl,UID_box,callback);
		},
		checkResult: function(data){
			return (_.size(data.query.results)>0);
		},
		getLatLng: function(data){
			var place = (_.values(data.query.results))[0];
			if(_.isArray(place)) place = place[0];
			return L.latLng({lat: parseFloat(place.centroid.latitude),lng:parseFloat(place.centroid.longitude)});
		}, 
		revGeoCode: function(latlng,UID_box,callback){
			var geocodeUrl = 'http://query.yahooapis.com/v1/public/yql?q=select+*+from+geo.placefinder+where+text="'+latlng.lat+','+latlng.lng+'"+and+gflags="R"&format=json';
			self.callRevGeoCoding('yahoo',geocodeUrl,UID_box,callback);
		},
		checkRevResult: function(data){
			return (_.size(data.query.results)>0);
		},
		getAddress: function(data){
			var place = (_.values(data.query.results))[0];
			return (place.line1||'') + ' ' + (place.line2||'') + ' ' + (place.line3||'') + ' ' + (place.line4||'');
		}
	};

	self.geoCodingServices['google']= {
		// https://developers.google.com/maps/documentation/geocoding/#Limits
		geoCode: function(addr,UID_box,callback){
			var geocodeUrl = 'http://maps.googleapis.com/maps/api/geocode/json?address='+replaceAll(addr,' ','+') +'&sensor=false';
			self.callGeoCoding('google',geocodeUrl,UID_box,callback);
		},
		checkResult: function(data){
			return (data.results.length>0);
		},
		getLatLng: function(data){
			return L.latLng({lat: data.results[0].geometry.location.lat,lng: data.results[0].geometry.location.lng});
		},
		revGeoCode: function(latlng,UID_box,callback){
			var geocodeUrl = 'http://maps.googleapis.com/maps/api/geocode/json?latlng='+latlng.lat+','+latlng.lng+'&sensor=false';
			self.callRevGeoCoding('google',geocodeUrl,UID_box,callback);
		},
		checkRevResult: function(data){
			return (data.status == 'OK');
		},
		getAddress: function(data){
			return data.results[0].formatted_address;
		}
	};

	self.geoCodingServices['nominatim']= {
		geoCode: function(addr,UID_box,callback){
			var geocodeUrl = 'http://nominatim.openstreetmap.org/search?q='+addr+'&format=json';
			self.callGeoCoding('nominatim',geocodeUrl,addr,UID_box,callback);
		},
		checkResult: function(data){
			if(_.isArray(data) && data.length>0) data = data[0];
			return !(_.isUndefined(data.lat) || _.isUndefined(data.lon));
		},
		getLatLng: function(data){
			return L.latLng({lat: parseFloat(data[0].lat),lng: parseFloat(data[0].lon)});
		},
		revGeoCode: function(latlng,UID_box,callback){
			var geocodeUrl = ' http://nominatim.openstreetmap.org/reverse?format=json&lat='+latlng.lat+'&lon='+latlng.lng;
			self.callRevGeoCoding('nominatim',geocodeUrl,UID_box,callback);
		},
		checkRevResult: function(data){
			return data.display_name;
		},
		getAddress: function(data){
			return data.display_name;
		}
	};

	self.callGeoCoding = function(service,geocodeUrl,UID_box,callback){
		LOG && console.log('Invocando servicio '+service);
		
		if(self.geoCodingRequest[UID_box]) self.geoCodingRequest[UID_box].abort();
		biciMapaUI.setCargando();

		self.geoCodingRequest[UID_box] = 
		$.ajax({
			type: 'GET',
			url: geocodeUrl,
			success: function(data, textStatus, XMLHttpRequest){
				LOG && console.log('Respuesta '+service);
				LOG && console.log(data);
				if(self.geoCodingServices[service].checkResult(data)){
					var latlng  = self.geoCodingServices[service].getLatLng(data);					
					callback.callback(UID_box,latlng);
				}
				else{
					LOG && console.error('Error callGeoCoding: Sin resultados');
					callback.error(UID_box);
					var errorcod=' (r45)';
					biciMapaUI.setMessage('Hay un problema'+errorcod,'No se pudo encontrar el lugar que indicas','error');
				}
			},
			error: function(MLHttpRequest, textStatus, errorThrown){
				if(textStatus !='abort'){
					LOG && console.error('Error callGeoCoding: ' + errorThrown);
					callback.error(UID_box);
					var errorcod=' (r46)';
					biciMapaUI.setMessage('Hay un problema'+errorcod,'No se pudo encontrar el lugar que indicas','error');
				}
			},
			complete: function(jqXHR,textStatus){
				biciMapaUI.unsetCargando();
				self.geoCodingRequest[UID_box] = undefined;
			}
		});
	}
	
	self.callRevGeoCoding = function(service,geocodeUrl,UID_box,callback){
		var addr = 'Sin dirección';
		if(self.geoCodingRequest[UID_box]) self.geoCodingRequest[UID_box].abort();
		biciMapaUI.setCargando();
		self.geoCodingRequest[UID_box] = 
		$.ajax({
			type: 'GET',
			url: geocodeUrl,
			success: function(data, textStatus, XMLHttpRequest){
				if(self.geoCodingServices[service].checkRevResult(data)){
					addr = self.geoCodingServices[service].getAddress(data);
				}
				else{
					LOG && console.error('Error coordTOaddr: no hay resultados');
					var errorcod=' (r48)';
					biciMapaUI.setMessage('Hay un problema'+errorcod,'No se pudo obtener la dirección','error');
				}
			},
			error: function(MLHttpRequest, textStatus, errorThrown){
				if(textStatus !='abort'){
					LOG && console.error('Error coordTOaddr: ' + errorThrown);
					var errorcod=' (r49)';
					biciMapaUI.setMessage('Hay un problema'+errorcod,'No se pudo obtener la dirección','error');
				}
			},
			complete: function(jqXHR,textStatus){
				self.geoCodingRequest[UID_box] = undefined;
				biciMapaUI.unsetCargando();
				callback(UID_box,addr);
			}
		});
	}

	self.checkZonaMarker = function(latlng){
		var tipo_capa = capasPOI[biciMapaUI.getTipoColabora()].tipo;
		return self.isCapaActiveLatLng(biciMapaUI.getTipoColabora(),latlng) && (self.zonasContienen(zonasAdmin,latlng) || tipo_capa != 'admin');
	}
	
	self.getMulticapasZona = function(capa_nombre){
		var capas = [];
		if(self.colaboraMarker){
			_.each(capasPOI_actives,function(capa){
				if(capa.multicapa && self.isCapaActiveLatLng(capa.nombre,self.colaboraMarker.getLatLng()) && capa.nombre!=capa_nombre) 
					capas.push(capa.nombre);
			});
		}
		return capas;
	}

	self.isGeoCodingRequestActive = function(UID_box){
		if(self.geoCodingRequest[UID_box]) return true;
		else return false;
	}

	self.clickTOcoord = { 
		init: function(callback){
			self.biciMapa.on('click',function(e){
			// self.biciMapa.on('mousedown',function(e){
				callback(e.latlng);
			});
		},
		stop: function(){
			self.biciMapa.off('click');
			// self.biciMapa.off('mousedown');
		}
	}

	self.contextmenu = {
		popup: undefined,
		latlng:undefined,
		init: function(evento){
			self.contextmenu.latlng = evento.latlng;
			self.contextmenu.popup = L.popup().setContent(self.getDetalleContextMenu(self.contextmenu.latlng));
			self.contextmenu.popup.setLatLng(evento.latlng).openOn(self.biciMapa);
		},
		setMarker: function(type_marker){
			self.biciMapa.closePopup(self.contextmenu.popup);
			
			if(type_marker=='dummy'){
				self.dummyMarker(self.contextmenu.latlng);
			}
			else if(type_marker!='newPOI' || is_user_logged_in()){
				if(type_marker!='newPOI') biciMapaUI.preAddParamRuta();
				biciMapaUI.coordTOaddr.call(self.contextmenu.latlng,type_marker);
			}
			else{
				biciMapaUI.setMessage('','<a href="'+login_link+'">Inicia sesión</a> para añadir un lugar.','warning');
			}
		},
	};

	self.findMarker = function(typemarker_UIDbox_poiUID,noOpenPopup){
		var marker;

		// OJO CON ASIGNACIONES EN IF
		if(marker = self.getMarker(typemarker_UIDbox_poiUID)){ 
			self.showMarker(marker,noOpenPopup);
			return true;
		}
		else if(typemarker_UIDbox_poiUID == 'editingPOI' && (marker = self.editingPOI)){
			self.showMarker(marker,noOpenPopup);
			return true;
		}
		else if(marker = self.findPOILayer(typemarker_UIDbox_poiUID)){
			//Quita el filtro si el POI no está en el mapa pero si en memoria
			if(self.filterPOI && !capasPOI[marker.feature.properties.capa].interfaz.hasLayer(marker)) biciMapaUI.filtrarPOI.set();

			var capa_nombre = marker.feature.properties.capa;
			if(!self.isCapaDisplayed(capa_nombre))biciMapaUI.setDisplayCapa(capa_nombre,true,false);

			if(!biciMapaUI.isClusteringActive()) self.showMarker(marker,noOpenPopup);
			else capasPOI[capa_nombre].interfaz.zoomToShowLayer(marker,function(){self.showMarker(marker,noOpenPopup);});
			
			return true;
		}
		return false;
	}
	self.showMarker = function(marker,noOpenPopup){
		zoom = self.biciMapa.getZoom();
		marker.closePopup();
		self.biciMapa.setView(marker.getLatLng(),zoom);
		if(!noOpenPopup) marker.openPopup();
	}

	self.isCoordInMap = function(latlng){
		return self.biciMapa.getBounds().contains(latlng);
	}

	self.countMarkers = function(){
		var count = 0;
		_.each(self.rutaMarkers,function(marker){
			if(!_.isUndefined(marker)) count++;
		});
		return count;
	}
	self.getMarker = function(UID_box_type_marker){
		if(UID_box_type_marker=='newPOI') return self.colaboraMarker;
		else if(UID_box_type_marker == 'start' || UID_box_type_marker == 'end') 
			return self.rutaMarkers[biciMapaUI.getUID_box(UID_box_type_marker)];
		else return self.rutaMarkers[UID_box_type_marker];
	}

	self.isSetMarker = function(UID_box){
		if(UID_box=='newPOI')
			return !_.isUndefined(self.colaboraMarker);
		else
			return !_.isUndefined(self.rutaMarkers[UID_box]);
	}

	// Devuelve la clave para el parámetro de ruta
	self.isPOIMarker = function(UID_box){
		if(self.getMarker(UID_box) && self.getMarker(UID_box).feature){
			var properties = self.getMarker(UID_box).feature.properties;
			return properties.UID;
		}
		else return false;
	}
	
	// Devuelve UID_box
	self.isMarkerPOI = function(UID){
		var is=false;
		_.each(self.rutaMarkers,function(marker,UID_box){
			if(UID==self.isPOIMarker(UID_box)){ 
				is=UID_box;
				return;
			}
		});
		return is;
	}

	self.getCoordMarker = function(UID_box){
		var marker = self.getMarker(UID_box);
		if(!_.isUndefined(marker)) return marker.getLatLng();
		else return undefined;
	}
	self.getZonaMarker = function(UID_box){
		var marker = self.getMarker(UID_box);
		if(!_.isUndefined(marker)) return self.getZonaCoord(marker.getLatLng());
		else return undefined;
	}

	self.isOwnFavorite = function(UID_box_UID){
		var marker;
		if(self.isPOIMarker(UID_box_UID)) marker = self.getMarker(UID_box_UID);
		else marker = self.findPOILayer(UID_box_UID);
			
		if(!_.isUndefined(marker)) return marker.feature.properties.es_favorito;
		else return false;
	}

	self.checkDistance = function(){
		return self.getMarker('start').getLatLng().distanceTo(self.getMarker('end').getLatLng())<self.maxRouteDistance;
	}
	self.zoomIn = function(){
		self.biciMapa.zoomIn();
	}
	self.zoomOut = function(){
		self.biciMapa.zoomOut();
	}


	self.puedehaceralgunawea = function(feature){
		var p = feature.properties;
		// return p.puede_moderar || p.puede_validar || p.puede_invalidar || p.puede_editar || p.puede_eliminar; 
		return p.puede_moderar || p.puede_validar || p.puede_invalidar || p.puede_editar; 
	}

}


function sqr(x) { return x * x }
function dist2(v, w) { return sqr(v.lat - w.lat) + sqr(v.lng - w.lng) }
function distToSegmentSquared(p, v, w) {
	var l2 = dist2(v, w);
	if (l2 == 0) return dist2(p, v);
	var t = ((p.lat - v.lat) * (w.lat - v.lat) + (p.lng - v.lng) * (w.lng - v.lng)) / l2;
	if (t < 0) return dist2(p, v);
	if (t > 1) return dist2(p, w);
	return dist2(p, { lat: v.lat + t * (w.lat - v.lat),	lng: v.lng + t * (w.lng - v.lng) });
}
function distToSegment(p, v, w) { return Math.sqrt(distToSegmentSquared(p, v, w)); }

/*p = {lat:-33.427389690150555,lng:-70.72492718696594},v={lat:-33.427433,lng:-70.725267},w={lat:-33.427523,lng:-70.724628}
distToSegment(p,v,w)*/


/*,
		decodeVector: function(encoded, precision){
			precision = Math.pow(10, -precision);
			var len = encoded.length, index=0, lat=0, lng = 0, array = [];
			while (index < len) {
				var b, shift = 0, result = 0;
				do {b = encoded.charCodeAt(index++) - 63;result |= (b & 0x1f) << shift;shift += 5; } while (b >= 0x20);
				var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
				lat += dlat; shift = 0; result = 0;
				do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
				var dlng = ((result & 1) ? ~(result >> 1) : (result >> 1)); lng += dlng;
				//array.push( {lat: lat * precision, lng: lng * precision} );
				array.push( [lat * precision, lng * precision] );
			}
			return array;
		},
		encodeVector: function(coords){ 
		//http://jeromejaglale.com/doc/javascript/google_static_maps_polyline_encoding 
		// https://github.com/Project-OSRM/osrm-backend/issues/713
			var i = 0;var plat = 0;var plng = 0;var encoded_points = "";
			_.each(coords,function(coord){
				encoded_points += self.routingServices.OSRM.encodePoint(plat, plng, coord.lat, coord.lng);
				plat = coord.lat; plng = coord.lng;
			});
			return encoded_points;
		},
		encodePoint: function(plat, plng, lat, lng) {
			var late5 = Math.round(lat * 1e6); var plate5 = Math.round(plat * 1e6);	var lnge5 = Math.round(lng * 1e6); var plnge5 = Math.round(plng * 1e6);
			dlng = lnge5 - plnge5;dlat = late5 - plate5;
			return self.routingServices.OSRM.encodeSignedNumber(dlat) + self.routingServices.OSRM.encodeSignedNumber(dlng);
		},
		encodeSignedNumber: function(num) {
			var sgn_num = num << 1; if (num < 0){sgn_num = ~(sgn_num);}return(self.routingServices.OSRM.encodeNumber(sgn_num));
		},
		encodeNumber: function(num){
			var encodeString = ""; while (num >= 0x20) { encodeString += (String.fromCharCode((0x20 | (num & 0x1f)) + 63)); num >>= 5;}
			encodeString += (String.fromCharCode(num + 63)); return encodeString;
		}*/