
//***************************************************************
/*
ULTIMO ERROR: r73
cagaron 44,47
*/

//***************************************************************

var LOG = false;

var biciMapaUIClass = function(){


	var self = this;

	self.timeout = 15000;
	//Determina si se está enviando el formulario del POI, para no enviarlo varias veces.
	self.enviandoPOI = false;

	self.lastAddrSearched = {};

	self.comment_pagenum = 1;

	self.POIfilename = '';

	// self.routingMode; // find|draw|show
	self.tipo_ruta;
	self.extraParamsEQ ={
		extra_param_1:[
			{RTC:'SAFE',MQ:'bicycle',OSRM:'segura',app:'segura',nombre:'Ruta segura'},
			{RTC:'DIRECT',MQ:'shortest',OSRM:'directa',app:'directa',nombre:'Ruta directa'}
		]
	};

	self.drawZonasMode = false;
	
	//OPCIONES DE USUARIO
	self.userOptions = {
		 _autorouting: true
		,_multidefault: true
		,_keepclickcoord: true
		,_interdefault: false
	};
	self.isOnAutoRouting = function(){return self.userOptions._autorouting;}
	self.setAutoRouting = function(onoff){$('#autoRouting').prop('checked',onoff);self.setAutoRouting_aux(onoff);}
	self.setAutoRouting_aux = function(onoff){self.userOptions._autorouting=onoff;}
	
	self.isOnMultiDefault = function(){return self.userOptions._multidefault;}
	self.setMultiDefault = function(onoff){$('#multidefault').prop('checked',onoff);self.setMultiDefault_aux(onoff);}
	self.setMultiDefault_aux = function(onoff){self.userOptions._multidefault=onoff;}

	self.isOnKeepClickCoord = function(){return self.userOptions._keepclickcoord;}
	self.setKeepClickCoord = function(onoff){$('#keepclickcoord').prop('checked',onoff);self.setKeepClickCoord_aux(onoff);}
	self.setKeepClickCoord_aux = function(onoff){self.userOptions._keepclickcoord=onoff;}
	
	self.isOnInterDefault = function(){return self.userOptions._interdefault;}
	self.setInterDefault = function(onoff){$('#interDefault').prop('checked',onoff);self.setInterDefault_aux(onoff);}
	self.setInterDefault_aux = function(onoff){self.userOptions._interdefault=onoff;
		biciMapaOBJ.setAddInterRoute();
	}

	// Comandos especiales
	self.commands = {
		_status:true // acción: muestra el estado de cada comando|estado: dummy
		,_getcoord:false // accion: cambia estado|estado->false: búsqueda de direcciones,true: búsqueda de coordenadas
		,_normalcoord:true // accion: cambia estado|estado: decide si hay que trasladar coordenadas al margen [-180,180]
		,_autoload:true // accion: cambia estado|estado->true: carga zonas al mover el mapa automáticamente.
		,_displaybounds:[] // acción: pinta una zona delimitada por start y end|colección: zonas pintadas en el mapa
		,_clearbounds:true // acción: limpia las zonas pintadas por _displaybounds|estado: dummy
		,_restrictzone:false// acción: cambia estado|estado: establece si start o end pueden situarse fuera de las zonas cargadas.
		,_clustering:true // acción: cambia estado|estado: establece si se hace clustering de POI
		,_dummymarker:{} // acción: situa un marcador con coordenadas en el mapa|colección: marcadores situados
		,_clearmarkers:true // acción: limpia los marcadores pintados por _dummymarker|estado: dummy
		,_usecacheroutes:true// acción: cambia estado|estado: establece si se usa cache del cliente para rutas
		,_getcacheroutes:true// acción: muestra ids de rutas en pantalla|estado: dummy
		,_cleancacheall:true // acción: limpia toda la cache|estado: dummy
		,_cleancacheroutes:true // acción: limpia la cache de rutas|estado: dummy
		,_cleancachezones:true // acción: limpia la cache de POI|estado: dummy
		,_routetype:true// acción: establece el motor de ruta a usar comando _routetype:TIPO|estado: dummy
		,_switchtiles:true // acción: cambia el mapa de fondo|estado: dummy
		,_inspectpoi:false // acción: dummy|estado: permite inspeccionar las features de un POI
		
		,_cleanuserscacheall:true // 
		,_cleanuserscacheroutes:true // acción: limpia la cache de rutas de todos los usuarios UNA sola vez|estado: dummy
		,_cleanuserscachepoi:true // 
		,_cleanuserscachecapas:true // 
		// ,_viewroad:true // acción: muestra el mapa de calles|estado: dummy
		// ,_viewsatelite:true // acción: muestra el mapa satelital|estado: dummy
	};
	// COMANDOS ___________________________________________________________________________________

	self.status = function(){
		var result = '';
		result+= '_getcoord: ' + self.commands._getcoord + '<br/>';
		result+= '_normalcoord: ' + self.commands._normalcoord + '<br/>';
		result+= '_autoload: ' + self.commands._autoload + '<br/>';
		result+= '_displaybounds: ' + _.size(self.commands._displaybounds) + '<br/>';
		result+= '_clearbounds<br/>';
		result+= '_restrictzone: '+ self.commands._restrictzone + '<br/>';
		result+= '_clustering: '+ self.commands._clustering + '<br/>';
		result+= '_dummymarker: '+ _.size(self.commands._dummymarker) + '<br/>';
		result+= '_clearmarkers<br/>';
		result+= '_usecacheroutes: ' + self.commands._usecacheroutes + '<br/>';
		result+= '_cleancacheall<br/>';
		result+= '_getcacheroutes<br/>';
		result+= '_cleancacheroutes<br/>';
		result+= '_cleancachezones<br/>';
		result+= '_routetype: RTC|MQ ('+ self.tipo_ruta +')<br/>';
		result+= '_switchtiles<br/>';
		result+= '_inspectpoi<br/>';
		if(user_data.user_rol=='admin'){
			result+= '<strong>_cleanuserscacheall</strong><br/>';
			result+= '<strong>_cleanuserscacheroutes</strong><br/>';
			result+= '<strong>_cleanuserscachepoi</strong><br/>';
			result+= '<strong>_cleanuserscachecapas</strong><br/>';
		}
		self.setMessage('Opciones',result,'warning',true);
	}

	//COMANDOS
	self.execCommand = function(txt,UID_box){
		var param ='';
		if(txt =='_status'){
			self.status();
		}
		else if(txt =='_getcoord'){
			self.commands._getcoord = !self.commands._getcoord;
			var msg = 'desactivado'; if(!self.commands._getcoord) msg = 'activado';
			self.setMessage('','Reverse Geocoding '+msg,'warning');
		}
		else if(txt =='_normalcoord'){
			self.commands._normalcoord = !self.commands._normalcoord;
			var msg = 'desactivada'; if(!self.commands._normalcoord) msg = 'activada';
			self.setMessage('','Normalización de coordenadas '+msg,'warning');
		}
		else if(txt =='_autoload'){
			self.commands._autoload = !self.commands._autoload;
			var msg = 'desactivada'; if(self.commands._autoload) msg = 'activada';
			self.setMessage('','Carga de zonas automática '+msg,'warning');
		}
		else if(txt =='_displaybounds'){
			biciMapaOBJ.displayBounds();
		}
		else if(txt =='_clearbounds'){
			biciMapaOBJ.unDisplayBounds();
		}
		else if(txt =='_restrictzone'){
			self.commands._restrictzone = !self.commands._restrictzone;
			biciMapaOBJ.switchBounds(self.commands._restrictzone); //!!!!!!
			var msg = 'desactivada';if(self.commands._restrictzone) msg = 'activada';
			self.setMessage('','Restricción de zonas '+msg,'warning');
		}
		else if(txt =='_clustering'){
			self.commands._clustering = !self.commands._clustering;

			var msg = biciMapaUI.setMessage('','Procesando...','warning',true,true);
			var interval = setInterval(function(){//Espera a que se ponga el mensaje
				window.clearInterval(interval);

				biciMapaUI.cleanRoute();
				biciMapaUI.limpiarColaboraForm();
				biciMapaOBJ.switchClustering();
			
				self.unsetMessage(msg);
				var txt = 'desactivado';if(self.commands._clustering) txt = 'activado';
				self.setMessage('','POI clustering '+txt,'warning');
			},1000);
		}
		else if(txt =='_dummymarker'){
			biciMapaOBJ.dummyMarker(UID_box);
		}
		else if(txt == '_clearmarkers'){
			biciMapaOBJ.clearDummyMarkers();
		}
		else if(txt == '_cleancacheall'){
			biciMapaOBJ.cleanCacheAll();
			self.setMessage('','Se vació toda la caché','warning');
		}
		else if(txt == '_cleancacheroutes'){
			biciMapaOBJ.cleanCacheRoutes();
			self.setMessage('','Caché de rutas vacía','warning');
		}
		else if(txt == '_cleancachezones'){
			biciMapaOBJ.cleanZonasCache();
			self.setMessage('','Caché de zonas vacía','warning');
		}
		else if(txt == '_getcacheroutes'){
			self.showCacheRoutes();
		}
		else if(txt.split(':')[0] == '_routetype' && txt.split(':')[1] && txt.split(':')[1]!=''){
			param =txt.split(':')[1];
			self.setRouteType(param);
		}
		else if(txt == '_usecacheroutes'){
			self.commands._usecacheroutes = !self.commands._usecacheroutes;
			var msg = 'desactivado'; if(self.commands._usecacheroutes) msg = 'activado';
			self.setMessage('','Cache de rutas cliente '+msg,'warning');
		}
		else if(txt == '_switchtiles'){
			biciMapaOBJ.switchTiles();
		}
		else if(txt == '_inspectpoi'){
			self.commands._inspectpoi = !self.commands._inspectpoi;
			biciMapaOBJ.reLoadCapas();
			var msg = 'desactivado'; if(self.commands._inspectpoi) msg = 'activado';
			self.setMessage('','Inspeccionar POI '+msg,'warning');
		}
		else if(txt == '_cleanuserscacheall'){
			if(user_data.user_rol=='admin') self.confirmMessage('Confirmar borrado','¿Seguro que quieres borrar la cache COMPLETA de todos los usuarios?',false,self.cleanUsersCacheAll);
			else setMessage('','No estas autorizado para esto','error');
		}
		else if(txt == '_cleanuserscacheroutes'){
			if(user_data.user_rol=='admin') self.confirmMessage('Confirmar borrado','¿Seguro que quieres borrar la cache de RUTAS todos los usuarios?',false,self.cleanUsersCacheRoutes);
			else setMessage('','No estas autorizado para esto','error');
		}
		else if(txt == '_cleanuserscachepoi'){
			if(user_data.user_rol=='admin') self.confirmMessage('Confirmar borrado','¿Seguro que quieres borrar la cache de POI todos los usuarios?',false,self.cleanUsersCachePoi);
			else setMessage('','No estas autorizado para esto','error');
		}
		else if(txt == '_cleanuserscachecapas'){
			if(user_data.user_rol=='admin') self.confirmMessage('Confirmar borrado','¿Seguro que quieres borrar la cache de CAPAS todos los usuarios?',false,self.cleanUsersCacheCapas);
			else setMessage('','No estas autorizado para esto','error');
		}
		self.getInputBox(UID_box).val(self.lastAddrSearched[UID_box]);
	}

	self.isCommand = function(txt){
		return !_.isUndefined(self.commands[txt]) ||
				(!_.isUndefined(self.commands[txt.split(':')[0]]) && txt.split(':')[1] && txt.split(':')[1]!='');
	}

	self.showCacheRoutes = function(){
		var rutasUID = biciMapaOBJ.getCacheIds();
		var result = '';
		_.each(rutasUID,function(keyMap,UID){
			result+= UID +'<br/>';
		});

		self.setMessage('ID de rutas:',result,'warning',false,true);
	}

	self.clearDummyMarkers = function(){
		self.commands._dummymarker = {};
	}

	self.removeDummyMarker = function(id){
		delete(self.commands._dummymarker[id]);
	}

	self.getDummyMarkers = function(){
		return self.commands._dummymarker;
	}
	self.addDummyMarkers = function(id,dummyMarker){
		self.commands._dummymarker[id] = dummyMarker;
	}

	self.isRevGeoCodingActive = function(){
		return !self.commands._getcoord;
	}
	self.isNormalCoordActive = function(){
		return self.commands._normalcoord;
	}
	self.isAutoLoadActive = function(){
		return self.commands._autoload;
	}
	self.setAutoLoadActive = function(autoload){
		self.commands._autoload = autoload;
	}
	self.isClusteringActive = function(){
		return self.commands._clustering;
	}

	self.addDisplayBoundsLayer = function(layer){
		self.commands._displaybounds.push(layer);
	}
	self.clearDisplayBoundsLayer = function(){
		self.commands._displaybounds = [];
	}
	self.getDisplayBoundsLayers = function(){
		return self.commands._displaybounds;
	}
	self.isRestrictZoneActive = function(){
		return self.commands._restrictzone;
	}
	self.isCacheRoutesActive = function(){
		return self.commands._usecacheroutes;
	}
	self.isInstpectPoiActive = function(){
		return self.commands._inspectpoi;
	}

	self.cleanUsersCacheRoutes = function(){
		self.setSignalBulk('mustcleancacheroutes',true);	
	}
	self.cleanUsersCacheAll = function(){
		self.setSignalBulk('mustcleanallcache',true);	
	}
	self.cleanUsersCachePoi = function(){
		self.setSignalBulk('mustcleancachepoi',true);	
	}
	self.cleanUsersCacheCapas = function(){
		self.setSignalBulk('mustcleancachecapas',true);	
	}

	self.getTimeOut = function(){
		return self.timeout;
	}

	// RUTA ___________________________________________________________________________________

	self.setRouteType = function(type){
		if(type == 'RTC' || type == 'OSRM' || type == 'MQ'){
			self.tipo_ruta = type;
			self.setMessage('','Tipo de ruta actualizado: '+type,'warning');
		}
		else{
			var errorcod=' (r1)';
			self.setMessage('Hay un problema'+errorcod,'Tipo de ruta no encontrado','error');
		}
	}


	self.getItinerario = function(){
		return $('#itinerario').sortable("toArray");
	}

	self.getRutaParams = function(){

		var extra_param_1 = self.getExtraParamEq('app',self.tipo_ruta,'extra_param_1',$('input[name=extra_param_1]:checked').val());
		
		var itinerarioUIDs = self.getItinerario();
		var itinerarioParams = [],ispoi,coord,address,notes;
		_.each(itinerarioUIDs,function(UID_box){
			if(biciMapaOBJ.isSetMarker(UID_box)){
				address = htmlentities(trim(self.getInputBox(UID_box).val()));
				notes = htmlentities(trim(self.getNotesBox(UID_box).val()));
				coord = biciMapaOBJ.getCoordMarker(UID_box);
				ispoi = undefined;
				if(ispoi = biciMapaOBJ.isPOIMarker(UID_box)) ispoi += '|'+biciMapaOBJ.getPOIcapa(ispoi);	

				itinerarioParams.push({address:address,notes:notes,coord:coord,ispoi:ispoi});
			}
		});

		var ruta_params = {
			itinerario:itinerarioParams,
			tipo_ruta:self.tipo_ruta,
			extra_param_1:extra_param_1
		}

		return ruta_params;
	}

	self.validarParams = function(ruta_params,mensaje){

		if(_.isUndefined(mensaje)) mensaje = true; 

		if(_.isUndefined(ruta_params.s_coord)){
			var errorcod=' (r4)';
			if(mensaje) self.setMessage('Hay un problema'+errorcod,'Debes indicar el punto de inicio','error');
			return false;
		}
		else if(_.isUndefined(ruta_params.e_coord)){
			var errorcod=' (r5)';	
			if(mensaje) self.setMessage('Hay un problema'+errorcod,'Debes indicar el punto de término','error');
			return false;
		}
		/*else if(ruta_params.s_address == ''){
			var errorcod=' (r2)';
			if(mensaje) self.setMessage('Hay un problema'+errorcod,'Debes indicar el punto de inicio','error');
			return false;
		} 
		else if(ruta_params.e_address == ''){
			var errorcod=' (r3)';
			if(mensaje) self.setMessage('Hay un problema'+errorcod,'Debes indicar el punto de término','error');
			return false;
		}*/
		else if(ruta_params.extra_param_1 == ''){
			var errorcod=' (r6)';
			if(mensaje) self.setMessage('Hay un problema'+errorcod,'Debes indicar el tipo de ruta que quieres','error');
			return false;
		}
		else if(!biciMapaOBJ.checkDistance()){
			var errorcod=' (r7)';
			if(mensaje) self.setMessage('¡Vas demasiado lejos!'+errorcod,'Prueba con una ruta más corta.','error');
			return false;
		}
		// else if(ruta_params.s_address == ruta_params.e_address){
			// var errorcod=' (r43)';
		// 	if(mensaje) self.setMessage('Hay un problema'+errorcod,'Los puntos de inicio y fin son los mismos','error');
		// 	return false;
		// }
		else
			return true;
	}

	self.getRuta = function(dotted){
		var boxes = self.countBoxes();
		var markers = biciMapaOBJ.countMarkers();
		if(boxes!=markers){ self.cleanRoute(true); return; }

		var ruta_params = self.getRutaParams();

		// if(self.validarParams(ruta_params,false)){
		if(ruta_params.itinerario.length>1){
			if(!dotted) biciMapaOBJ.getRoute(ruta_params,true,true);
			else biciMapaOBJ.getRouteFlat(ruta_params); 
			// else biciMapaOBJ.setRoute(biciMapaOBJ.getFlatVector(ruta_params),undefined,'dotted');
		}
		else self.cleanRoute(true);
		// }
	}
	self.getRuta_callbak = function(hayruta,noUpdateMode){
		if(!noUpdateMode){
			if(!hayruta && self.getRoutingMode()!='find') self.setRoutingMode('find');
			else self.setMenuRuta(hayruta?'found':'find'); //SI SE NECESITA}
		}
		self.updateDistanceRoute(biciMapaOBJ.getTotalDistanceRuta());
		// ________________________________
		$('#labelruta').html('');
		if(hayruta){
			self.AddlabelDummy('Ripio');
			self.AddlabelDummy('Pavimento');
			self.AddlabelDummy('Montaña');
			self.AddlabelDummy('Cicloturismo');
			self.AddlabelDummy('Pública');
			self.AddlabelDummy('Privada');
			var credits = '<div class="bloque_detallePOI"><a href="https://www.facebook.com/dominique.c.soto" target="_blank"><img src="https://graph.facebook.com/1048718989/picture?width=150&amp;height=150" class="avatar avatar-wordpress-social-login avatar-32 photo" height="32" width="32"><span class="nombre_vcard">Dominique Cabrera Soto</span></a></div>';
			$('#creditruta').html(credits);
		}
		
	}
	self.AddlabelDummy = function(label){
		if(Math.floor((Math.random()*10)%2)==1){
			var txt = '<span class="warning radius label">'+label+'</span>';
			$('#labelruta').append(txt);
		}
	}
	self.updateDistanceRoute = function(dist){
		if(dist){
			var txt = '<span class="success radius label">'+formatDistance(dist)+'</span> ';
			$('#distaciaruta').html(txt);
		}
		else $('#distaciaruta').html('');
	}

	self.setUID_ruta = function(val){ $('#UID_ruta').val(val); }
	self.getUID_ruta = function(){ return $('#UID_ruta').val(); }

	self.saveRuta = function(adjuntar){
		/*var */RUTA = {
			UID_ruta: self.getUID_ruta(),
			nombre: $('#txt_nombreRuta').val(),
			publica: $('#rutapublica').prop('checked'),
			itinerario: self.getRutaParams().itinerario,
			zonas: biciMapaOBJ.getZonasRuta(),
			vector: biciMapaOBJ.getVectorRuta(),
			extras: biciMapaOBJ.getExtrasRuta()
		}
		/*
		AQUI GUARDA LA WEA
		*/
		if(!adjuntar){
			if(RUTA.nombre) $('#rutaTab .menu_title').html(self.getHeadElement(RUTA.nombre));
			self.setRoutingMode('show');
		}
		else{
			biciMapaUI.attachRoute.attach();
		}
	}

	/*self.reGetRuta = function(itinerario){
		if(!itinerario){
			itinerario = [];
			_.each(self.getRutaParams().itinerario,function(param){
				itinerario.push({ispoi:param.ispoi,coord:{lat:param.coord.lat,lng:param.coord.lng}});
			});
		}
		self.cleanRoute();

		if(itinerario[0].ispoi) self.addParamRuta({UID:itinerario[0].ispoi.split('|')[0]},{type_marker:'start'});
		else self.coordTOaddr.call(itinerario[0].coord,'start');
		if(itinerario[1].ispoi) self.addParamRuta({UID:itinerario[1].ispoi.split('|')[0]},{type_marker:'end'});
		else self.coordTOaddr.call(itinerario[1].coord,'end');

		var UID_box;
		for(var i=2;i<itinerario.length;i++){
			UID_box = self.getNewBoxUID();
			self.addBoxMarker(UID_box);
			self.genBoxMarker();
			if(itinerario[i].ispoi) self.addParamRuta({UID:itinerario[i].ispoi.split('|')[0]},{UID_box:UID_box});
			else self.coordTOaddr.call(itinerario[i].coord,UID_box);
		}
		self.refreshIconMarkers();
	}*/

	self.reGetRuta = function(){
		var itinerario = [];
		_.each(self.getRutaParams().itinerario,function(param){
			itinerario.push(param.ispoi? 
				param.ispoi.split('|')[0] :
				'['+param.coord.lat+','+param.coord.lng+']'
			);
		});
		self.setRuta(itinerario);
	}

	self.setRuta = function(addrs){
		// addrs array de strings. Cada elemento puede ser: dirección, coordenadas [lat,lng] o UID_poi
		self.cleanRoute();
		self.addrTOcoord.pre(addrs[0],'start');
		self.addrTOcoord.pre(addrs[1],'end');
		var UID_box;
		for(var i=2;i<addrs.length;i++){
			UID_box = self.getNewBoxUID();
			self.addBoxMarker(UID_box);
			self.genBoxMarker();
			self.addrTOcoord.pre(addrs[i],UID_box);
		}
		self.refreshIconMarkers();
	}

	self.loadRuta = function(){
		// self.setRoutingMode('find');
		if(RUTA){
			self.cleanRoute();
			self.setRoutingMode('show');
			_.each(RUTA.itinerario,function(param){
				var parMarker = {addr:param.address,coord:param.coord,notes:param.notes,UID:param.ispoi?param.ispoi.split('|')[0]:undefined};
				self.addParamRuta(parMarker);
			});
			biciMapaOBJ.setRoute(RUTA.vector,undefined,undefined,true);
			biciMapaOBJ.findMarker('start');

			// $('#rutaTab .menu_title').html(RUTA.nombre);
			$('#rutaTab .menu_title').html(self.getHeadElement(RUTA.nombre));

		}
	}

	/*self.getRuta = function(){
		// ESPERA
		var interval = setInterval(function(){
			if(!biciMapaOBJ.isGeoCodingRequestActive('start') && !biciMapaOBJ.isGeoCodingRequestActive('end')){
				window.clearInterval(interval);
				self.getRuta_aux();
			} 
		},1000);
	}
	self.getRuta_aux = function(){
		var extra_param_1 = self.getExtraParamEq('app',self.tipo_ruta,'extra_param_1',$('input[name=extra_param_1]:checked').val());
		
		var s_address = self.getInputBox('start').val();
		var e_address = self.getInputBox('end').val();

		var s_ispoi;var e_ispoi;
		if(biciMapaOBJ.isPOIMarker('start')){
			s_ispoi = biciMapaOBJ.isPOIMarker('start');
			s_ispoi += '|'+biciMapaOBJ.getPOIcapa(s_ispoi);
		}
		if(biciMapaOBJ.isPOIMarker('end')){
			e_ispoi = biciMapaOBJ.isPOIMarker('end');
			e_ispoi += '|'+biciMapaOBJ.getPOIcapa(e_ispoi);
		}

		var ruta_params={
			tipo_ruta:self.tipo_ruta,
			s_address: htmlentities(trim(s_address)),
			s_coord: biciMapaOBJ.getCoordMarker('start'),
			e_address: htmlentities(trim(e_address)),
			e_coord: biciMapaOBJ.getCoordMarker('end'),
			extra_param_1:extra_param_1,
			s_ispoi: s_ispoi,
			e_ispoi: e_ispoi
		}

		if(self.validarParams(ruta_params,true) && !biciMapaOBJ.isGeoCodingRequestActive('ruta')){
			biciMapaOBJ.getRoute(ruta_params);
		}
		// Desde aqui para abajo no debe haber código.Cualquier acción posterior debe añadirse en la función setDetalleRuta()
		
	}*/

	self.getExtraParamEq = function(from,to,extra_param,val){
		var result = undefined;
		var equivalencias = self.extraParamsEQ[extra_param];
		_.each(equivalencias,function(eq){
			if(eq[from]==val)
				result=eq[to];
		});
		return  result;
	}

	self.showRutaTab = function(){
		$('#link_detalleRutaTab').click();
	}

	self.findStart = function(){biciMapaOBJ.findMarker('start');}
	self.findEnd = function(){ biciMapaOBJ.findMarker('end'); }

	/*self.setParamsRuta = function(ruta_params){
		var result ={
			start: self.setParamRuta('start',ruta_params.s_address,ruta_params.s_coord,ruta_params.s_ispoi),
			end: self.setParamRuta('end',ruta_params.e_address,ruta_params.e_coord,ruta_params.e_ispoi)
		}

		var extra_param_1 = self.getExtraParamEq(ruta_params.tipo_ruta,'app','extra_param_1',ruta_params.extra_param_1);
		if(extra_param_1) 
			$('input[name=extra_param_1]').filter('[value='+extra_param_1+']').prop('checked', true);

		return result;
	}*/

	self.setDetalleRuta = function(ruta_obj){
		
		var result = self.setParamsRuta(ruta_obj.params);
		self.getRouteLbl('start').html(result.start.address);
		self.getRouteLbl('end').html(result.end.address);
		self.setOnMarkerDetalle(biciMapaOBJ.getPrefijoCapa(result.start.ispoi),'start');
		self.setOnMarkerDetalle(biciMapaOBJ.getPrefijoCapa(result.end.ispoi),'end');

		$('#lbl_extra_param_1').html(self.getExtraParamEq(ruta_obj.params.tipo_ruta,'nombre','extra_param_1',ruta_obj.params.extra_param_1));

		self.setDetalleRuta_aux[ruta_obj.params.tipo_ruta](ruta_obj);
		$('#btn_ruta_share').click(function(){self.initCompartir(ruta_obj.UID,true)});
		
		$('.menu_detalle_ruta.detalle').css('display','block');
		$('#dd_link_detalleRutaTab').css('display','block');
		$('#link_detalleRutaTab').click();
		
		if(is_user_logged_in()) self.addHistorial(ruta_obj.UID,ruta_obj.params);
	}

	self.setDetalleRuta_aux = {};
	self.setDetalleRuta_aux.MQ = function(ruta_obj){
		var ruta_extras = ruta_obj.extras;

		var instruccion_html ='';
		instruccion_html +='<h4>Resumen</h4>';
		instruccion_html +='<li class="instruccion" >Distancia total: '+ ruta_extras.distancia+' metros</li>';
		instruccion_html +='<li class="instruccion" >Tiempo estimado: '+ ruta_extras.tiempo + '</li>';
		// instruccion_html +='<li class="instruccion" >Elevación: '+ruta_extras.elevacion+'</li>';

		instruccion_html +='<h4>Instrucciones</h4>';
		var clase = "instruccion-par";
		_.each(ruta_extras.instrucciones,function(instruccion,key){

			if(key%2==0) clase = "instruccion-par";
			else clase = "instruccion-impar";

			instruccion_html += '<a onclick="biciMapaUI.viewInstruction('+key+');">';
			instruccion_html += '<li class="'+clase+'">'+instruccion.narrative+' (alrededor de '+ instruccion.distance +' metros)</li>';
			instruccion_html += '</a>';
		});
		
		$('#resumenRuta').append($(instruccion_html));
	}
	self.viewInstruction= function(key_instruction){
		biciMapaOBJ.viewInstruction(key_instruction);
	}

	self.setDetalleRuta_aux.RTC = function(ruta_obj){
		var ruta_extras = ruta_obj.extras;

		var instruccion_html ='';

		var tiempo_estimado;
		if(ruta_extras.tiempo_min == ruta_extras.tiempo_max) tiempo_estimado = ruta_extras.tiempo_min;
		else tiempo_estimado = ruta_extras.tiempo_min +' - '+ruta_extras.tiempo_max;
		
		instruccion_html +='<h4>Resumen</h4>';
		instruccion_html +='<li class="instruccion" >Distancia total: '+ ruta_extras.distancia+'</li>';
		instruccion_html +='<li class="instruccion" >Tiempo estimado: '+ tiempo_estimado + ' minutos</li>';
		instruccion_html +='<li class="instruccion" >Elevación: '+ruta_extras.elevacion+'</li>';

		instruccion_html +='<h4>Instrucciones</h4>';
		var traductor1,traductor2;
		var distancia;
		var clase = "instruccion-par";
		_.each(ruta_extras.instrucciones,function(instruccion,key){
			distancia = instruccion[2].split(' ')[0];
			traductor1 = instruccion[0];
			traductor2 = instruccion[2].split(' ')[1];
			
			if(traductor1=='Left') traductor1 ='Izquierda';
			else if(traductor1=='Right') traductor1 = 'Derecha';

			if(traductor2=='meters') traductor2 ='metros';
			else if(traductor2=='kilometers') traductor2 = 'kilometros';
			else traductor2 = instruccion[2];

			if(key%2==0) clase = "instruccion-par";
			else clase = "instruccion-impar";

			instruccion_html += '<li class="'+clase+'">'+traductor1+' en '+instruccion[1]+' (alrededor de '+ distancia +' '+traductor2+')</li>';
		});
		
		$('#resumenRuta').append($(instruccion_html));
	}

	self.cleanParams = function(){
		var itinerario = self.getItinerario();
		_.each(itinerario,function(UID_box){
			self.cleanParam(UID_box,false,false,true);
		});

		$('input[name=extra_param_1]').eq(0).prop('checked', true);
	}

	
	self.cleanRoute = function(no_cleanParams){
		if(!no_cleanParams) self.cleanParams();
		biciMapaOBJ.cleanRoute();
		self.getRuta_callbak(false);
	}

	/*self.cleanRoute = function(remove_markers){
		$('#lbl_distancia').html('');
		$('#lbl_tiempo').html('');
		$('#lbl_elevacion').html('');
		$('#resumenRuta').html('');
		// $('#enlace').val('');

		$('#dd_link_detalleRutaTab').css('display','none');
		$('.menu_detalle_ruta.detalle').css('display','none');

		// biciMapaOBJ.cleanMap(remove_markers);
		
	}*/

	/*self.limpiarMapa = function(abrir_control){
		self.cleanParams();
		// self.cleanRoute(true);
		// self.setPantalla('main',!abrir_control);
	}*/

	self.getTipoRuta = function(){
		return self.tipo_ruta;
	}

	// COMENTARIOS ___________________________________________________________________________________

	self.initComments = function(){
		self.getCommentsPage();	
		$('#modalComentarios').foundation('reveal', 'open');
	}

	self.getCommentsPage = function(page_num,comentario_ID){
		self.unSetResponseComment();

		if(!page_num) page_num=1;
		$.ajax({
				type: 'POST',timeout: self.getTimeOut(),
				url: baseUrl + '/wp-admin/admin-ajax.php',
				data: {
					action: 'bcbm_get_comentarios',
					page: page_num
				},
				success: function(data, textStatus, XMLHttpRequest){
					$('#comentarios_list').html(data);
					if(comentario_ID) $('#modalComentarios').animate({scrollTop: $("#div-comment-"+comentario_ID).position().top}, 500);
					self.comment_pagenum = page_num;
				},
				error: function(MLHttpRequest, textStatus, errorThrown){
					LOG && console.error('Fail getCommentsPage: ' + errorThrown);
					var errorcod=' (r8)';
					self.setMessage('Hay un problema'+errorcod,'No se pudo obtener los comentarios','error');
				}
			});
	}

	self.unSetResponseComment = function(){
		$('#comment_parent').attr('value',0);
		$('#reply_to_messaje').html('');
		$('#reply_to_block').css('display','none');
	}
	self.setResponseComment = function(comment_id,comment_auth){
		$('#comment_parent').attr('value',comment_id);
		$('#reply_to_messaje').html(comment_auth);
		$('#reply_to_block').css('display','block');
		$('#txt_comentario').focus();
	}

	self.sendComment = function(){

		var page = $('#comment_post_ID').attr('value');
		var parent = $('#comment_parent').attr('value');
		var text = htmlentities($('#txt_comentario').val());

		if(text!=""){

			$.ajax({
					type: 'POST',timeout: self.getTimeOut(),
					url: baseUrl + '/wp-admin/admin-ajax.php',
					data: {
						action: 'bcbm_add_comentario',
						text: text,
						parent: parent,
						page: page
					},
					success: function(data, textStatus, XMLHttpRequest){
						// self.unSetResponseComment();
						var pagina = 1;
						if(parent != 0){
							pagina = self.comment_pagenum;
						}
						self.getCommentsPage(pagina,data);
						
						$('#txt_comentario').val('');
					},
					error: function(MLHttpRequest, textStatus, errorThrown){
						LOG && console.error('Fail sendComment: ' + errorThrown);
						var errorcod=' (r9)';
						self.setMessage('Hay un problema'+errorcod,'No se pudo enviar tu comentario','error');
					}
				});
		}
	}

	self.confirmDeleteComment = function(comment_id){
		self.confirmMessage('Confirmar borrado','¿Segur@ que quieres borrar el comentario?',false,self.deleteComment,comment_id);
	}
	self.deleteComment = function(comment_id){
		$.ajax({
				type: 'POST',timeout: self.getTimeOut(),
				url: baseUrl + '/wp-admin/admin-ajax.php',
				data: {
					action: 'bcbm_delete_comentario',
					comment_id: comment_id
				},
				success: function(data, textStatus, XMLHttpRequest){
					self.getCommentsPage(self.comment_pagenum);
				},
				error: function(MLHttpRequest, textStatus, errorThrown){
					LOG && console.error('Fail deleteComment: ' + errorThrown);
					var errorcod=' (r10)';
					self.setMessage('Hay un problema'+errorcod,'No se pudo eliminar el comentario','error');
				}
			});
	}

	//  ___________________________________________________________________________________

	self.isSetPantalla = function(param){
		
		var id = 'rutaTab'; // main
		if(param =='colaboraPOI') id='poiTab';
		else if(param =='favoritos') id='favoritosTab';
		else if(param =='administrarpoi') id='adminPOITab';
		else if(param =='main') id='rutaTab';
		/*
		else if(param =='comments')	
		else if(param =='historial') 
		else if(param =='dibujarzonas')
		else if(param =='instrucciones')
		else if(param =='main')
		*/

		return $('#'+id).hasClass('active');
	}

	self.setPantalla = function(param,no_abrir_control){
		var src_screen_aux = src_screen;
		if(param) src_screen_aux = param;

		self.setDrawZonasMode(false);
		self.limpiarColaboraForm();
		var wasRoutingMode = self.getRoutingMode();
		self.setRoutingMode('find');

		if(src_screen_aux =='main'){ 
			$('#link_rutaTab').click();
			if(wasRoutingMode=='show') self.reGetRuta();
		}
		else if(src_screen_aux =='comments')	$('#btn-comentar').click();
		else if(src_screen_aux =='historial') $('#link_historalRutaTab').click();
		else if(src_screen_aux =='dibujarzonas'){ self.setDrawZonasMode(true);$('#link_drawZonasTab').click(); }
		else if(src_screen_aux =='instrucciones') $('#link_detalleRutaTab').click();
		else if(src_screen_aux =='colaboraPOI') $('#link_poiTab').click();
		else if(src_screen_aux =='filtroCapasPOI') $('#link_capasPOITab').click();
		else if(src_screen_aux =='administrarpoi'){ 
			biciMapaOBJ.loadListPOI(src_screen_aux);
			$('#link_adminPOITab').click();
		}
		else if(src_screen_aux =='favoritos'){ 
			biciMapaOBJ.loadListPOI(src_screen_aux);
		 	$('#link_favoritosTab').click(); 
		 }

		if(!no_abrir_control) self.displayControles(true);
	}


	self.stateMessage = function(titulo,contenido,onconfirm,params){
		var idclose = new Date().getTime();
		var texto_aux = '';
		texto_aux += '<div class="alert-box info">';
		texto_aux += 	'<p style="text-align:center"><strong>'+titulo+'</strong></p>';
		texto_aux += 	'<p>'+contenido+'</p>';
		texto_aux += 	'<p style="text-align:center">';
		texto_aux += 		'<button id="btn_confirmar'+idclose+'" class="button tiny alert">Cancelar</button> ';
		texto_aux += 	'</p>';
		texto_aux += '</div>';
		var texto = $(texto_aux);

		var mensaje = $().toastmessage('showToast',{text: texto,sticky:true,inEffectDuration:600,position: 'top-center',close:function(){}});
		$('#'+idclose).click(function(){self.unsetMessage(mensaje);});

		$('#btn_confirmar'+idclose).click(function(){
			self.unsetMessage(mensaje);
			onconfirm(params);
		});
		return mensaje;
	}
	self.confirmMessage = function(titulo,contenido,message,onconfirm,params,oncancel){
		if(!params && message) params = {};

		var idclose = new Date().getTime();
		var texto_aux = '';
		texto_aux += '<div class="alert-box info">';
		texto_aux += 	'<p style="text-align:center"><strong>'+titulo+'</strong></p>';
		texto_aux += 	'<p>'+contenido+'</p>';
		if(message)
		texto_aux += 	'<textarea id="confirm_message'+idclose+'" rows="5" style="width:100%" maxlength="200"></textarea>';
		texto_aux += 	'<p style="text-align:center">';
		texto_aux += 		'<button id="btn_confirmar'+idclose+'" class="button tiny">Confirmar</button> ';
		texto_aux += 		'<button id="btn_cancelar'+idclose+'" class="button tiny alert">Cancelar</button>';
		texto_aux += 	'</p>';
		texto_aux += '</div>';
		var texto = $(texto_aux);

		var mensaje = $().toastmessage('showToast',{text: texto,sticky:true,inEffectDuration:600,position:'top-center',close:function(){}});
		$('#'+idclose).click(function(){ self.unsetMessage(mensaje);});

		$('#btn_cancelar'+idclose).click(function(){
			self.unsetMessage(mensaje);
			if(oncancel) oncancel();
		});
		$('#btn_confirmar'+idclose).click(function(){
			var comentarios = htmlentities($('#confirm_message'+idclose).val());
			if(message && !comentarios){
				var errorcod=' (r11)';
				self.setMessage('Hay un problema'+errorcod,'Debes completar el campo de texto','error');
			}
			else{
				self.unsetMessage(mensaje);
				if(message) params.mensaje = comentarios;
				onconfirm(params);
			}
		});
		return mensaje;
	}

	self.setMessage = function(titulo,contenido,tipo,no_autohide,no_btn_close){
		// success | info | warning | error
		if(_.isUndefined(tipo) || tipo=='confirm') tipo = 'warning'; 
		else if(tipo=='error') tipo = 'alert-box-error';
		
		var txt_close  = '';
		if(!no_btn_close){
			var idclose = new Date().getTime();
			txt_close = '<button type="button" id="'+ idclose +'" class="close">×</button>';
		}
		var texto_aux = '';
		texto_aux += '<div class="alert-box ' + tipo+'">';
		texto_aux += txt_close;
		texto_aux += '<strong>'+titulo+'</strong> ';
		texto_aux += '<p>'+contenido+'</p>';
		texto_aux += '</div>';
		var texto = $(texto_aux);

		// top-left, top-center, top-right, middle-left, middle-center, middle-right
		var mensaje = $().toastmessage('showToast',{text: texto,sticky:no_autohide,inEffectDuration: 600,stayTime: 4000,position:'top-center',close: function(){}});
		if(!no_btn_close){$('#'+idclose).click(function(){self.unsetMessage(mensaje);});
		}

		return mensaje;
	}
	self.unsetMessage = function(mensaje){
		$().toastmessage('removeToast',mensaje);
	}

	self.setBigMessage = function(titulo,contenido){
		$('#modalBigMessage h1').html(titulo);
		$('#modalBigMessage div.parrafo-modal').html(contenido);
		$('#modalBigMessage').foundation('reveal', 'open');
	}

	self.detallePOIPopup = function(UID){
		// $('#modalPOI div.parrafo-modal').html(biciMapaOBJ.getDetallePOI(biciMapaOBJ.findPOILayer(UID).feature));
		$('#modalPOI div').html(biciMapaOBJ.getDetallePOI(biciMapaOBJ.findPOILayer(UID).feature,true));
		// $('#modalPOI .popup-inner').removeClass('popup-inner').addClass('popup-modal');
		$('#modalPOI').foundation('reveal', 'open');
	}
	self.showFullPOI = function(UID){
		var obj = biciMapaOBJ.getPOIFeature(UID);
		var titulo = biciMapaOBJ.getPOInombre(UID);
		self.setBigMessage(titulo,'<pre>'+JSON.stringify(obj,null,4)+'</pre>');
	}

	self.setCargandoList = function(listname){
		var text = '';
		text += '<div class="must-log-in">';
		text += 	'<img class="loadbtn" src="'+ BC_BM_URL +'img/loading_green.gif" /> Cargando información.'
		text += '</div>';
		var listCont = $('#'+listname+'Wrapp');
		listCont.html(text);
	}

	self.setCargando = function(rojo){
		$('#reload').css('display','none');
		$('#blocked').css('display','none');
		$('#load_green').css('display',!rojo?'block':'none');
		$('#load_red').css('display',rojo?'block':'none');
		return true;
	}
	self.unsetCargando = function(){
		if(!biciMapaOBJ.msg_cargandoPOI){
			var rojo = biciMapaOBJ.overLimitQueue();
			$('#reload').css('display',!rojo?'block':'none');
			$('#blocked').css('display',rojo?'block':'none');
			$('#load_green').css('display','none');
			$('#load_red').css('display','none');
		}
	}
	
	self.setBuscando = function(titulo,mensaje){

		var titulin = '';
		var mensajin = 'Buscando...';

		if(titulo) titulin = titulo;
		if(mensaje) mensajin = mensaje;

		$('#enrutar').attr('disabled','disabled');
		$('#enrutar').addClass('disabled');
		contenido = '<img src="'+ BC_BM_URL +'img/busy.gif" /> '+mensajin;
		var mensaje = self.setMessage(titulin,contenido,'warning');
		return mensaje;
	}
	self.unsetBuscando = function(mensaje){
		self.unsetMessage(mensaje);
		$('#enrutar').removeClass('disabled');
		$('#enrutar').removeAttr('disabled');
	}

	self.getBaseLink = function(){
		
		var link = window.location.host + window.location.pathname;

		if(link.indexOf('http://')==-1){
			link = 'http://'+ link;
		}
		return link;
	}	

	self.getLink = function(UID,es_ruta){
		
		var link = self.getBaseLink();

		if(es_ruta){
			link += '?route='+UID;
		}
		else{
			// var latlng = biciMapaOBJ.getPOIlatlng(UID);
			link += '?poi='+UID;
			// link += '&lat='+latlng.lat;
			// link += '&lng='+latlng.lng;
		}
		return encodeURI(link);
	}

	self.getShortLink = function(UID,es_ruta){
		var link = self.getLink(UID,es_ruta);
		return link.replace('www.','').replace('http://','');
	}

	self.compartirMail = function(UID,es_ruta){
		var link = self.getLink(UID,es_ruta);
		$('#txt_message').val(self.compartirTexto(false));
		
		if(!es_ruta) $('#txt_tipo_share').val(capasPOI[biciMapaOBJ.getPOIcapa(UID)].singular);
		else $('#txt_tipo_share').val('ruta');

		$('#txt_link_share').val(self.getLink(UID));
	}

	self.compartirFacebook = function(UID,es_ruta){
		var link = self.getLink(UID,es_ruta);
		link = encodeURIComponent(link);

		var titulo = self.compartirTitulo();
		var facebook_link = 'https://www.facebook.com/sharer/sharer.php?u=';
		open_popup(facebook_link+link,titulo,600,300);
	}
	self.compartirTwitter = function(UID,es_ruta){
		var link = self.getLink(UID,es_ruta);
		link = encodeURIComponent(link);

		var titulo = self.compartirTitulo();
		var texto;
		if(es_ruta) self.compartirTexto(true);
		else texto = self.compartirTexto(true,biciMapaOBJ.getPOInombre(UID));

		var twitter_link = 'http://twitter.com/share?text=';
		open_popup(twitter_link+texto+'&url='+link,titulo,500,300);
	}

	self.compartirTitulo = function(){
		return "Comparte esta ruta";
	}
	self.compartirTexto = function(encode,POI_name){
		var text;
		if(POI_name) text = 'Encuentra "'+POI_name+'" en Bicimapa.cl';
		else text = "Encuentra esta ruta en Bicimapa.cl";
		if(encode) return encodeURI(text);
		else return text;
	}


	self.initCompartir = function(UID,es_ruta){

		$('#btn_enlacePOI').val(self.getShortLink(UID,es_ruta));

		$('#btn_shareFacebook').click(function(){
			$('#modalCompartir').foundation('reveal', 'close');
			self.compartirFacebook(UID,es_ruta);
		});
		
		$('#btn_shareTwitter').click(function(){
			$('#modalCompartir').foundation('reveal', 'close');
			self.compartirTwitter(UID,es_ruta);
		});

		/* INIT MAIL FORM*/
		self.compartirMail(UID,es_ruta);

		// $('#btn_shareMail').click(function(){
		// 	$('#modalCompartir').foundation('reveal', 'close');
		// 	self.compartirMail(UID,es_ruta);
		// });

		$('#modalCompartir_opener').click();
	}

	self.validarShareMail = function(){

		var name = $('#txt_name').val();
		var from = $('#txt_from').val();
		var to = $('#txt_to').val();
		var message = $('#txt_message').val();

		if(name == ''){
			var errorcod=' (r12)';
			self.setMessage('Hay un problema'+errorcod,'Debes indicar tu nombre','error');
			return false;
		}
		else if(from == '' || !validateEmail(from)){
			var errorcod=' (r13)';
			self.setMessage('Hay un problema'+errorcod,'Tu correo electrónico es incorrecto','error');
			return false;
		}
		else if(to == '' || !validateEmail(to,true)){
			var errorcod=' (r14)';
			self.setMessage('Hay un problema'+errorcod,'Algún correo electrónico de tus amigos está incorrecto','error');
			return false;
		}
		else if(message == ''){
			var errorcod=' (r15)';
			self.setMessage('Hay un problema'+errorcod,'Debes añadir un mensaje','error');
			return false;
		} 
		else
			return true;
	}

	self.shareMail = function(){
		if (self.validarShareMail()){
			$.ajax({
				type: 'POST',timeout: self.getTimeOut(),
				url: baseUrl + '/wp-admin/admin-ajax.php',
				data: {
					action: 'bcbm_share_mail',
					tipo: $('#txt_tipo_share').val(),
					url: $('#txt_link_share').val(),
					name: $('#txt_name').val(),
					from: $('#txt_from').val(),
					to: $('#txt_to').val(),
					message: $('#txt_message').val()
				},
				success: function(data, textStatus, XMLHttpRequest){
						// $('#modalCompartirMail').modal('hide');
						$('#modalCompartirMail').foundation('reveal', 'close');
						
						if(data=='true'){
							$('#txt_to').val('');
							$('#txt_message').val('');
							self.setMessage('','Tu correo fue enviado con éxito','success');
						}
						else{
							var errorcod=' (r16)';
							self.setMessage('Hay un problema'+errorcod,'NO se pudo enviar tu correo. Por favor contacta al administrador de Bicimapa','error');
							LOG && console.error('Fail shareMail: ' + data);
							
						}
				},
				error: function(MLHttpRequest, textStatus, errorThrown){
					// $('#modalCompartirMail').modal('hide');
					$('#modalCompartirMail').foundation('reveal', 'close');
					var errorcod=' (r17)';
					self.setMessage('Hay un problema'+errorcod,'NO se pudo enviar tu correo. Por favor contacta al administrador de Bicimapa','error');
					LOG && console.error('Fail shareMail: ' + errorThrown);
				}
			});
		}
	}

	self.expandAll = function(){
		self.displayControles(false);
		self.displayBanner(false);
	}
	self.colapseAll = function(){
		self.displayControles(true);
		self.displayBanner(true);
	}

	self.switchControles = function(){
		var mostrar = false;
		if($('#controles').css('display')=='none') mostrar = true;
		self.displayControles(mostrar);
	}

	self.switchBanner = function(){
		var mostrar = false;
		if($('#banner').css('display')=='none') mostrar = true;
		self.displayBanner(mostrar);
	}
	self.isControlesDisplayed = function(){
		return $('#controles').css('display')!='none';
	}

	self.displayControles = function(mostrar){
		var width = $('#controles').width();	
		if(mostrar){
			$('#controles').css('display','block');
			$('#rightside').css('left',width+'px');
			biciMapaOBJ.biciMapa.invalidateSize();
			// $('#map-logo').css('display','none');
			$('#ocultar-controles').attr('class','flotante ocultar-left');
		}
		else{
			$('#controles').css('display','none');
			$('#rightside').css('left','0px');
			biciMapaOBJ.biciMapa.invalidateSize();
			// $('#map-logo').css('display','block');
			$('#ocultar-controles').attr('class','flotante mostrar-left');
		}
		// $("#displaycapasDiv").getNiceScroll().resize();
		// $("#pestanasWrap").getNiceScroll().resize();
	}
	self.displayBanner = function(mostrar){
		var width = $('#banner').width();	
		if(mostrar){
			$('#banner').css('display','block');
			// $('#map-content').css('right',width+'px');
			$('#map-area').css('right',width+'px');
			biciMapaOBJ.biciMapa.invalidateSize();
			$('#ocultar-banner').attr('class','flotante ocultar-right');
		}
		else{
			$('#banner').css('display','none');
			$('#map-area').css('right','0px');
			biciMapaOBJ.biciMapa.invalidateSize();
			$('#ocultar-banner').attr('class','flotante mostrar-right');
		}
		// $("#displaycapasDiv").getNiceScroll().resize();
		// $("#pestanasWrap").getNiceScroll().resize();
	}

	self.initUI = function(){

		self.tipo_ruta = 'OSRM'; // MQ|RTC|OSRM

		// self.displayControles(false);

		// MENU ________________________________________________________
		// $('#reload').click(function(){biciMapaOBJ.reLoadCapas();});
		$('#load_red').click(function(){biciMapaOBJ.stopLoadZonas();});
		$('#load_green').click(function(){biciMapaOBJ.stopLoadZonas();});

		// ENRUTAR _____________________________________________________
		// $('#rutaTab').keyup(function(event){ if(event.keyCode == 13){ $("#enrutar").click();} });

		$('#itinerario').sortable({
			stop:function(event,ui){
				self.refreshIconMarkers();
				if(self.getRoutingMode()=='find') self.getRuta(!self.isOnAutoRouting());
			}
		});

		//Inicio y fin
		self.addBoxMarker(self.genBoxMarker());
		self.addBoxMarker(self.genBoxMarker());

		/*$('#manualedit').change(function(){
			var onoff = $(this).prop('checked');
			self.editingRuta.set(onoff);
		});*/

		$('#autoRouting').prop('checked',self.isOnAutoRouting());
		$('#autoRouting').change(function(){
			var onoff = $(this).prop('checked');
			self.setAutoRouting_aux(onoff);
		});
		$('#multiDefault').prop('checked',self.isOnMultiDefault());
		$('#multiDefault').change(function(){
			var onoff = $(this).prop('checked');
			self.setMultiDefault_aux(onoff);
		});
		$('#keepclickcoord').prop('checked',self.isOnKeepClickCoord());
		$('#keepclickcoord').change(function(){
			var onoff = $(this).prop('checked');
			self.setKeepClickCoord_aux(onoff);
		});
		$('#interDefault').prop('checked',self.isOnInterDefault());
		$('#interDefault').change(function(){
			var onoff = $(this).prop('checked');
			self.setInterDefault_aux(onoff);
		});

		// $('#rutapublica').change(function(){
		// 	var onoff = $(this).prop('checked');
		// 	$('#txt_tagsRuta').css('display',onoff?'block':'none');
		// });
		

		//Pestaña colaborar _____________________________________________________
		
		if(is_user_logged_in()){

			self.genBoxMarker('newPOI');
			(function(){
    			var anterior;
				$('#selecttipoPOI').focus(function(){
		    		anterior = $(this).val();
				}).change(function(){
					var nuevo = $(this).val();
					if(self.getRutaAdjunta() && !biciMapaOBJ.isCapaRutadjunt(nuevo)){
						var txt = 'Este tipo no admite rutas. La ruta será borrada. ¿Deseas continuar?';
						self.confirmMessage('',txt,false,self.attachRoute.unAttach,true,function(){self.setTipoColabora(anterior);});
					}
					else self.setColaboraForm(self.getParamsColaboraForm());
				});
			})();
			self.initUploadImage();
		}

		//CAPAS  _____________________________________________________

		// $('#displaycapasDiv').niceScroll();
		// $("#pestanasWrap").niceScroll();
		/*$('#displaycapasDiv').jScrollPane({
			// showArrows:true,
			// verticalArrowPositions:'before',
			arrowButtonSpeed:165,
			mouseWheelSpeed:165
		});*/

		//DIBUJAR ZONAS _____________________________________________________

		$('#drawModeLabel').change(biciMapaOBJ.reDisplayZonas);
		$('#drawModeTransp').change(biciMapaOBJ.reDisplayZonas);
		$('#zDrawZonas').focus(function(){this.select();});
		$('#zDrawZonas').change(function(){self.setDetalleZona();});
		self.setDetalleZona();


		//ULTIMAS ACCIONES_____________________________________________________

		self.initHistorial();

		self.initAlert();
	}

	self.initUI_final = function(){ // despues de cargar capas y POI.
		self.setPantalla('main',true);
		/*if(is_user_logged_in()){
			self.initMulticapaColaboraform();
		}*/
		$('#selecttipoPOI').change();

		//Favoritos
		if(capasPOI.favoritos){
			var item = '<li><a onclick="biciMapaUI.setPantalla(\'favoritos\')">Favoritos</a></li>';
			$('#lugaresdropdown').prepend($(item));
		}

		// PRIORIDAD A LA RUTA
		if(!_.isUndefined(route) && route!=''){
			self.displayCapas(false);
			biciMapaOBJ.getRoute(route);
			route = undefined; //Se mata la ruta para no generar cicrulo vicioso con la actualización manual de POI
		}
		else if(poi){
			biciMapaOBJ.displayPOI(poi);
			poi = undefined; //Se mata el poi para no generar cicrulo vicioso con la actualización manual de POI
		}
	}
	
	self.initDisplayPOI = function(){
		self.confirmMessage('Buscar lugar','Ingresa la URL',true,self.displayPOI);
	}

	self.displayPOI = function(params){
		var url = params.mensaje;
		var UID;
		if(!(UID=self.decodeURL(url))) UID=url;

		biciMapaOBJ.displayPOI(UID);
	}

	self.decodeURL = function(url,extract){
		// http://bicimap.org/?poi=OIQxJwx1lFqAx7No
		if(extract=='poi'){ 
			if(url.search(/\?poi=/)) return url.split('?poi=')[1].split('&')[0];
			else return undefined;
		}
	}

	self.initCleanCache = function(){
		if(self.getSignal('mustcleanallcache')){
			biciMapaOBJ.cleanCacheAll();
			LOG && console.log('Se limpió toda la cache');
			self.setSignal('mustcleanallcache',false);
		}
		if(self.getSignal('mustcleancacheroutes')){
			biciMapaOBJ.cleanCacheRoutes();
			LOG && console.log('Se limpió la cache de rutas');
			self.setSignal('mustcleancacheroutes',false);
		}
		if(self.getSignal('mustcleancachepoi')){
			biciMapaOBJ.cleanZonasCache(true);
			LOG && console.log('Se limpió la cache de zonas');
			self.setSignal('mustcleancachepoi',false);
		}
		if(self.getSignal('mustcleanusercachepoi')){
			biciMapaOBJ.cleanZonasCache();
			LOG && console.log('Se limpió la cache de zonas del usuario');
			self.setSignal('mustcleanusercachepoi',false);
		}
		if(self.getSignal('mustcleancachecapas')){
			biciMapaOBJ.cleanCapasCache(true);
			LOG && console.log('Se limpió la cache de capas');
			self.setSignal('mustcleancachecapas',false);
		}
	}

	self.initAlert = function(){
		var showalert = self.getSignal('showalert');
		$('#showalert_check').prop('checked',!showalert);
		if(showalert) $('#modalAlerta').foundation('reveal', 'open');	
	}

	self.confirmAlert = function(){
		$('#modalAlerta').foundation('reveal', 'close');
		// Apaga o enciende la señal según lo que marcó
		self.setSignal('showalert',!($('#showalert_check').prop('checked')));
	}

	self.isUserDeviceSignal = function(signal){
		return (signal=='mustcleanusercachepoi');
	}
	self.isUserSignal = function(signal){
		return (signal=='showalert');
	}

	self.setSignalBulk = function(signal,value,network){
		var data = {action: 'bcbm_set_bulk_signal',signal: signal,value: value};
		if(network) data.network = 1;
		
		$.ajax({
			type: 'POST',timeout: self.getTimeOut(),
			url: baseUrl + '/wp-admin/admin-ajax.php',
			data : data,
			success: function(data, textStatus, XMLHttpRequest){
				if(data=='1') self.setMessage('','Operación realizada con éxito');
				else{
					var errorcod=' (r68)';
					self.setMessage(''+errorcod,'Algo falló','error');
					LOG && console.error('Fail setSignal: ' + data);
				}
			},
			error: function(MLHttpRequest, textStatus, errorThrown){console.error('Fail setSignal: ' + errorThrown);}
		});
	}

	self.setSignal = function(signal,value,userId){
		// -1 para usuario 0 (not logued in)
		// Si es userdevice debe apagarse sólo en el cliente como las señales device.
		if((self.isUserSignal(signal) || (self.isUserDeviceSignal(signal) && value)) && is_user_logged_in()){
			
			var data = {action: 'bcbm_set_user_signal',signal: signal,value: value};
			if(userId) data.user_id = userId;

			$.ajax({
				type: 'POST',timeout: self.getTimeOut(),
				url: baseUrl + '/wp-admin/admin-ajax.php',
				data : data,
				success: function(data, textStatus, XMLHttpRequest){
					if(data!='1'){
						var errorcod=' (r19)';
						LOG && console.error('Fail setSignal: ' + data+ errorcod);
					}
				},
				error: function(MLHttpRequest, textStatus, errorThrown){console.error('Fail setSignal: ' + errorThrown);}
			});
		}
		else{
			var store_signal = signal;
			// if(self.isUserDeviceSignal(signal)) store_signal += '_'+(userId? userId:user_id);
			if(self.isUserDeviceSignal(signal)) store_signal += '_'+(userId? userId:user_data.user_id);

			if(!value) amplify.store(store_signal,signals[signal]);
			else amplify.store(store_signal,null);
		}
	}

	self.getSignal = function(signal){
		if(self.isUserSignal(signal) && is_user_logged_in()){ 
			return Boolean(signals[signal]);
		}
		else{
			var stored;
			var store_signal = signal;
			if(self.isUserDeviceSignal(signal)) store_signal += '_'+ user_data.user_id;

			if(stored=amplify.store(store_signal)){
				if(stored==signals[signal] || !signals[signal]) return false;
				else return true;
			}
			else return Boolean(signals[signal]);
		}
	}

	//  ___________________________________________________________________________________

	self.filtrarPOI = {
		msg: undefined,
		set: function(listname){
			var filtered = biciMapaOBJ.filtrarPOI(listname);

			if(listname && filtered) self.filtrarPOI.msg = self.stateMessage('','Filtrando lista'+listname,self.filtrarPOI.set);
			else if(self.filtrarPOI.msg){
				self.unsetMessage(self.filtrarPOI.msg);
				self.filtrarPOI.msg = undefined;
			}
		}
	}

	self.filtrarListaPOI = function(listname,criterios){
		
	}

	self.linkPOI = function(UID){
		var listname = $(this).attr('listname');
		if(!_.isString(UID)) var UIDreal = $(this).attr('UID');
		else var UIDreal = UID;
		// biciMapaOBJ.displayPOI(biciMapaOBJ.getListaPOI(listname)[UIDreal].params);
		biciMapaOBJ.displayPOI(biciMapaOBJ.getListaPOI(listname)[UIDreal]);
	}

	//El nombre de la lista debe coincidir con el nombre de la pantalla
	self.updateListPOI = function(listname,show_list){
		var listCont = $('#'+listname+'Wrapp');
		var listaPOI = biciMapaOBJ.getListaPOI(listname);

		listCont.html('');
		if(is_user_logged_in() && _.size(listaPOI)>0){
			/*var listaPOI_sort = _.sortBy(listaPOI,function(par){return par.params.nombre.toUpperCase();});
			_.each(listaPOI_sort,function(par,UID){
				listCont.append($(self.listPOIContentHTML(listname,par.params.UID,par.params)));
			});
			*/
			var listaPOI_sort = _.sortBy(listaPOI,function(params){return params.nombre.toUpperCase();});
			_.each(listaPOI_sort,function(params,UID){
				listCont.append($(self.listPOIContentHTML(listname,params.UID,params)));
			});

			$('.listaPOI_desc_content').click(self.linkPOI);
		}
		else if(is_user_logged_in() && _.size(listaPOI)==0){
			listCont.append('No hay nada qué mostrar acá');
		}
		if(show_list) self.setPantalla(listname);
		// $("#pestanasWrap").getNiceScroll().resize();
	}

	self.listPOIContentHTML = function(listname,UID,POI){
		var max_chars = 25;
		var txt ='';
		txt += '<div class="listaPOI_desc_content" listname="'+listname+'" UID="'+ UID +'" title="'+POI.nombre+'">';
			txt += '<div>';
				txt += '<div>';
					// txt += '<img class="iconpoi small" style="background-image: url('+ biciMapaOBJ.getIconUrl(false,POI.capa,POI.estado)+');" />';
					txt += '<img class="iconpoi small" style="background-image: url('+ biciMapaOBJ.getIconUrl(false,biciMapaOBJ.checkPrefijoCapa(POI.icon)?POI.icon:POI.capa,POI.estado)+');" />';
					var nombre = POI.nombre;
					if(nombre.length>max_chars) nombre = POI.nombre.substring(0,max_chars-3)+'...';
					txt += '<span>'+nombre+'</span>';
				txt += '</div>';
			txt += '</div>';
		txt += '</div>';
		return	txt;
	}

	self.linkHistorial = function(UID){
		if(!_.isString(UID)) var route = $(this).attr('UID');
		else var route = UID;
		biciMapaOBJ.getRoute(route);
	}

	self.initHistorial = function(){
		var histCont = $('#historalWrapp');
		histCont.html('');
		if(is_user_logged_in() && _.size(historial)>0){
			_.each(historial,function(historia,UID){
				histCont.append($(self.rutaContentHTML(UID,historia)));
			});

			$('.ruta_desc_content').click(self.linkHistorial);
		}
		else if(is_user_logged_in() && _.size(historial)==0){
			histCont.append('No hay nada en tu historial todavía');
		}
	}

	self.addHistorial = function(UID,ruta_params){
		var histCont = $('#historalWrapp');
		if(_.size(historial)==0){
			histCont.html('');
		}
		if(!historial[UID]){
			historial[UID] = JSON.parse(JSON.stringify(ruta_params));//Se clonan los parametros
			var link_ruta = $(self.rutaContentHTML(UID,ruta_params));
			histCont.prepend(link_ruta);
			link_ruta.click(self.linkHistorial);
		}
	}

	self.rutaContentHTML = function(UID,ruta_params){
		var max_chars = 27;
		var txt ='';
		txt += '<div class="ruta_desc_content" UID="'+ UID +'">';
			txt += '<div>';
				txt += '<div>';
					var s_address = htmlentities_decode(ruta_params.s_address);
					var s_capa_class = ruta_params.s_ispoi? ruta_params.s_ispoi.split('|')[1] : 'start';
					txt += '<img class="iconpoi small" style="background-image: url('+ biciMapaOBJ.getIconUrl(false,biciMapaOBJ.getPrefijoCapa(s_capa_class),'valido') +');" />';
					if(s_address.length>max_chars) s_address = s_address.substring(0,max_chars-3)+'...';
					txt += '<span>'+s_address+'</span>';
				txt += '</div>';
			txt += '</div>';
			txt += '<div>';
				txt += '<div>';
					var e_address = htmlentities_decode(ruta_params.e_address);
					var e_capa_class = ruta_params.e_ispoi? ruta_params.e_ispoi.split('|')[1] : 'end';
					txt += '<img class="iconpoi small" style="background-image: url('+ biciMapaOBJ.getIconUrl(false,biciMapaOBJ.getPrefijoCapa(e_capa_class),'valido') +');" />';
					if(e_address.length>max_chars) e_address = e_address.substring(0,max_chars-3)+'...';
					txt += '<span>'+e_address+'</sapn>';
				txt += '</div>';
			txt += '</div>';
			/*var extra_param_1 = self.getExtraParamEq(ruta_params.tipo_ruta,'nombre','extra_param_1',ruta_params.extra_param_1);
			txt += '<span>'+extra_param_1+'</span>';*/
		txt += '</div>';
		return	txt;
	}
	
/*	self.isCapaActive = function(capa_nombre){
		if(_.size($('#label_check_'+capa_nombre))!=0){
			return !($('#label_check_'+capa_nombre).css('display')=='none');
		}
		else return false;
	}*/

	self.activateDisplayCapas = function(capas){ //EN DESUSO
		var active;
		_.each(capas,function(par){
			active = biciMapaOBJ.isCapaActive(par.capa_nombre);
			if((!active && par.activa) || (active && !par.activa)) 
				self.activateDisplayCapa(par.capa_nombre,par.activa);
		});
		self.activateDisplayCapas_final();
	}
	self.clearDisplayCapas = function(){
		$('#displaycapasDiv').html('');
		$('#capasPOIWrapp').html('');
	}

	self.activateDisplayCapa = function(capa_nombre,activate,checked){
		var control_no_existe = (_.size($('#label_check_'+capa_nombre))==0);
		if(control_no_existe){
			var item; 
			//MINI PANEL____________________________
			var checked='';
			if(!checked) checked= 'check_off';
			item = 
				'<label id="label_check_'+capa_nombre+'" data-tooltip data-options="disable_for_touch:true" class="tip-right" title="'+ toTitleCase(capasPOI[capa_nombre].plural)+'" >'+
					'<input id="check_'+capa_nombre+'" class="checkCapas" type="checkbox"> '+
					'<img class="checkicon iconpoi '+ capa_nombre +' '+ checked +'" style="background-image: url('+ biciMapaOBJ.getIconUrl(true,capa_nombre,'valido') +');"/>'+
				'</label>';
			
			$('#displaycapasDiv').append($(item));
			// $('#displaycapasDiv').jScrollPane().data('jsp').getContentPane().append($(item));

			$('#check_'+capa_nombre).change(function(){
				self.setDisplayCapa(capa_nombre,$(this).prop('checked'),true);
			});

			//PANEL____________________________
			item = 
				'<label id="label_big_check_'+capa_nombre+'">'+
					'<input id="big_check_'+capa_nombre+'" class="checkCapas" type="checkbox"> '+
					'<img class="checkicon iconpoi '+ capa_nombre +' '+ checked +'" style="background-image: url('+ biciMapaOBJ.getIconUrl(true,capa_nombre,'valido') +');"/>'+
					' '+toTitleCase(capasPOI[capa_nombre].plural)+
				'</label>';
			
			$('#capasPOIWrapp').append($(item));

			$('#big_check_'+capa_nombre).change(function(){
				self.setDisplayCapa(capa_nombre,$(this).prop('checked'),true);
			});
		}

		var display = 'block';
		if(!activate) display = 'none';
		$('#label_check_'+capa_nombre).css('display',display);
		$('#label_big_check_'+capa_nombre).css('display',display);

		if(activate && capasPOI[capa_nombre].puede_crear){
			// SI está activa pero ya existe no hace nada!!
			if($('#selecttipoPOI option[value='+capa_nombre+']').length==0){
				$('#selecttipoPOI').append('<option value="'+capa_nombre+'">'+toTitleCase(capasPOI[capa_nombre].singular)+'</option>');
			}
			if($('#selectCapaDrawZonas option[value='+capa_nombre+']').length==0){
				$('#selectCapaDrawZonas').append('<option value="'+capa_nombre+'">'+toTitleCase(capasPOI[capa_nombre].singular)+'</option>');
			}
		}
		else{
			$('#selecttipoPOI option[value='+capa_nombre+']').remove();
		}

		biciMapaOBJ.activateDisplayCapa(capa_nombre,activate);
	}

	self.activateDisplayCapas_final = function(){
		// $('#displaycapasDiv').jScrollPane().data('jsp').reinitialise();
		if(self.isSetPantalla('colaboraPOI')) $('#selecttipoPOI').change();// Se actualiza sólo si se está mirando el formulario.
	}

	self.displayCapas = function(show){
		_.each(capasPOI,function(capa){// RECORRE TODO
			self.setDisplayCapa(capa.nombre,show,false);
		});
		if(show) biciMapaOBJ.loadPOICapas(_.keys(capasPOI));
	}

	self.setDisplayCapa = function(capa_nombre,show,load){
		$("#check_"+capa_nombre).prop('checked',show);
		$("#big_check_"+capa_nombre).prop('checked',show);
		
		var img = $('#label_check_'+capa_nombre+' .checkicon');
		var img2 = $('#label_big_check_'+capa_nombre+' .checkicon');
		if(show){ 
			img.removeClass("check_off");
			img2.removeClass("check_off");
		}
		else{ 
			img.addClass("check_off");
			img2.addClass("check_off");
		}
		
		biciMapaOBJ.setDisplayCapa(capa_nombre,show,load);
	}

	self.doActionPOI = function(params){
		var accion = params.accion;
		var UID = params.UID;
		var mensaje = params.mensaje;

		// var cartel = self.setBuscando('','Enviando formulario...');
		var cartel = self.setCargando();

		$.ajax({
			type: 'POST',timeout: self.getTimeOut(),
			url: baseUrl + '/wp-admin/admin-ajax.php',
			data: {
				action: 'bcbm_do_action_poi',
				poi_id: biciMapaOBJ.getPOIid(UID),
				accion:accion,
				comentarios: mensaje
			},
			success: function(data, textStatus, XMLHttpRequest){
				// self.unsetBuscando(cartel);
				self.unsetCargando();
				try{
					var result = JSON.parse(data);
				}
				catch(e){
					LOG && console.error('Fail doActionPOI 2: '+ e.message);
					LOG && console.log(data);
					return;
				}

				if(result.exito){
					if(result.estado){
						var options = {
							estado:result.estado,
							permisos:result.permisos,
							mensaje_estado:mensaje
						};
						biciMapaOBJ.updatePOIState(UID,options);
					}
					else{
						biciMapaOBJ.updatePOIState(UID,{estado:'inapropiado'});
						biciMapaOBJ.addPOI(result.POI,false);
					}
					self.setMessage('','Formulario enviado con éxito. Gracias por aportar con Bicimapa.','success');
				}
				else if(result.estado == 'actualizado' || result.estado == 'sin_permisos'){
					biciMapaOBJ.updatePOI(result.POI,false,true);
					var errorcod=' (r20)';
					self.setMessage('Hay un problema'+errorcod,'El punto fue modificado por otro usuario. Se ha actualizado automáticamente en tu mapa.','warning',true);	
				}
				else if(result.estado == 'eliminado'){
					biciMapaOBJ.updatePOIState(UID,{estado:result.estado});
					var errorcod=' (r21)';
					self.setMessage('Hay un problema'+errorcod,'El punto fue eliminado por otro usuario. Ya no está disponible.','warning',true);
				}
				else{
					LOG && console.error('Fail doActionPOI 1');
					LOG && console.log(result);
					var errorcod=' (r22)';
					self.setMessage('Hay un problema'+errorcod,'No se pudo actualizar. Por favor intenta de nuevo','error');
				}
			},
			error: function(MLHttpRequest, textStatus, errorThrown){
				// self.unsetBuscando(cartel);
				self.unsetCargando();
				LOG && console.error('Fail doActionPOI 3: ' + errorThrown);
				var errorcod=' (r23)';
				self.setMessage('Hay un problema'+errorcod,'No se pudo actualizar. Por favor intenta de nuevo','error');
			}
		});
	}
	
	self.centerRoute = function(){
		biciMapaOBJ.centerRoute();
	}

	self.initModerarPOI = function(UID,aprobado){
		if(aprobado)
			self.confirmMessage('Confirmar aprobación','Confirma que la información es apta para nuestro mapa',false,self.doActionPOI,{UID:UID,accion:'aprobar'});
		else
			self.confirmMessage('Confirmar rechazo','Confirma que la información es inapropiada. Indica las razones en el cuadro de abajo.',true,self.doActionPOI,{UID:UID,accion:'desaprobar'});
	}

	self.initEliminarPOI = function(UID){
		var txt = 'Confirma que quieres quitar este lugar de forma permanente. Indica las razones en el cuadro de abajo.';
		self.confirmMessage('Confirmar borrado',txt,true,self.doActionPOI,{UID:UID,accion:'eliminar'});
	}

	self.initValidarPOI = function(UID){
		self.confirmMessage('Confirmar información válida','Confirma que la información está correcta.',false,self.doActionPOI,{UID:UID,accion:'validar'});
	}
	self.initInvalidarPOI = function(UID){
		$('#invalidarPOI_message').val('');
		var mensaje = 'Rellena el campo de abajo e indica cuales son los datos que están incorrectos.';
		if(biciMapaOBJ.puedeEditarPOI(UID)){
			mensaje = '<b>Este punto puede ser corregido por ti</b>, si conoces la información que falta. De lo contrario, rellena el campo de abajo e indica cuales son los datos que están incorrectos.';
		}
		self.confirmMessage('Confirmar información incorrecta',mensaje,true,self.doActionPOI,{UID:UID,accion:'invalidar'});
	}

	self.initEditarPOI = function(UID){
		self.setPantalla('colaboraPOI');// LIMPIA EL FORM de paso
		var parMarker = biciMapaOBJ.setEditPOI(UID);
		self.setTipoColabora(biciMapaOBJ.getEditingPOIcapa());
		self.addParamNewPOI(parMarker);
		self.setColaboraForm();
	}

	self.deleteFavoritoPOI = function(UID){
		self.confirmMessage('¿Seguro que quieres quitar de favoritos?','',false,self.setFavoritos,{UID:UID,es_favorito:false});
	} 
	self.initFavoritoPOI = function(type_marker_UID){
		if(!is_user_logged_in()){ 
			self.setMessage('','<a href="'+login_link+'">Inicia sesión</a> para añadir a favoritos.','warning');
		}
		else{
			// Si es type_marker y es POIMarker, saca el UID, si no, puede ser un UID. 
			var UID = biciMapaOBJ.isPOIMarker(type_marker_UID)? biciMapaOBJ.isPOIMarker(type_marker_UID):type_marker_UID;
			// Si lo encuentra es porque era UID. Si no, es porque era una dirección.
			if(biciMapaOBJ.findPOILayer(UID)){
				self.setFavoritos({UID:UID,es_favorito:true});
			}
			else{
				self.initNuevoPOI('favoritos',type_marker_UID);
			}
		}
	}

	self.setFavoritos = function(params){
		var UID = params.UID;
		var es_favorito = params.es_favorito;

		// var cartel = self.setBuscando('','Enviando...');
		var cartel = self.setCargando();
		$.ajax({
			type: 'POST',timeout: self.getTimeOut(),
			url: baseUrl + '/wp-admin/admin-ajax.php',
			data:{
				action:'bcbm_set_favorite',
				UID:UID,
				is_favorite:es_favorito
			},
			success: function(data, textStatus, XMLHttpRequest){
				try{
					var result = JSON.parse(data);
				}
				catch(e){
					LOG && console.error('Fail setFavoritos 1: '+ e.message);
					LOG && console.log(data);
					return;
			}

				if(result.exito){
					biciMapaOBJ.updatePOIFavorites(UID,es_favorito,result.favoritos,result.puede_editar);
					if(es_favorito) self.setMessage('','Se añadió el lugar a favoritos con éxito.');
					else self.setMessage('','Se quitó el lugar de favoritos con éxito.');
				}
				else{
					LOG && console.error('Fail setFavoritos 2');
					LOG && console.log(result);
					var errorcod=' (r24)';
					self.setMessage('Hay un problema'+errorcod,'Ocurrió un error inesperado. Por favor intenta de nuevo.','error');
				}
			},
			error: function(MLHttpRequest, textStatus, errorThrown){
				LOG && console.error('Fail setFavoritos 3: '+errorThrown);
				var errorcod=' (r25)';
				self.setMessage('Hay un problema'+errorcod,'Ocurrió un error inesperado. Por favor intenta de nuevo.','error');
			},
			complete: function(jqXHR,textStatus){
				// self.unsetBuscando(cartel);
				self.unsetCargando();
			}
		});
	}

	self.initNuevoPOI = function(capa_nombre,UID_box,params){
		self.setPantalla('colaboraPOI') // LIMPIA EL FORM de paso
		self.setTipoColabora(capa_nombre);
		self.setColaboraForm(params);
		if(UID_box){
			var parMarker = {addr: self.getInputBox(UID_box).val(),coord: biciMapaOBJ.getCoordMarker(UID_box)};
			self.addParamNewPOI(parMarker);
			// self.cleanParam(UID_box);
		}
	}

	/*self.setOnMarkerAdmin = function(estado,capa_nombre,POI_name){
		var idprefix = $('#img_admin_'+estado+'_');
		
		if(capa_nombre){
			$('#prev_'+estado).css('display','inline');
			$('#next_'+estado).css('display','inline');
			$('#name_admin_'+estado).css('display','inline');
			$('#name_admin_'+estado).html(POI_name);

			$('#msj_admin_'+estado).html('');
			
			url = biciMapaOBJ.getIconUrl(true,capa_nombre,estado);
			idprefix.css('background-image','url('+ url +')');
			
			idprefix.css('display','inline');
			
		}
		else{
			$('#prev_'+estado).css('display','none');
			$('#next_'+estado).css('display','none');
			$('#name_admin_'+estado).css('display','none');

			idprefix.css('display','none');

			var estadillo = estado;
			if(estado == 'invalido') estadillo = 'corregir';
			$('#msj_admin_'+estado).html('Enhorabuena! No hay nada que '+estadillo);
		}

	}*/

	self.setOnMarkerDetalle  = function(capa_nombre,type_marker){
		var url;
		var elem = $('#'+self.getIDDetalleMarker(type_marker));
		if(capa_nombre == ''){ 
			elem.addClass('default');
			elem.removeClass('state');
			url = biciMapaOBJ.getIconUrl(true,type_marker);
		}
		else{ 
			elem.addClass('state');
			elem.removeClass('default');
			url = biciMapaOBJ.getIconUrl(true,capa_nombre,type_marker);
		}
		elem.css('background-image','url('+ url +')');
	}

	self.refreshIconMarkers = function(){
		var itinerario = self.getItinerario();
		_.each(itinerario,function(UID_box){
			self.setIconBoxMarker(UID_box,self.getTypeMarker(UID_box));
		});
	}
	self.setIconBoxMarker = function(UID_box,type_marker){
		var url,UID;
		var elem = $('#icon_'+UID_box);
		if(!type_marker && UID_box!='newPOI') type_marker = self.getTypeMarker(UID_box);
		else if(!type_marker) type_marker = 'newPOI';

		if(type_marker=='start') self.getInputBox(UID_box).attr('placeholder','Desde...');
		else if(UID_box!='newPOI') self.getInputBox(UID_box).attr('placeholder','Hasta...');

		if(UID=biciMapaOBJ.isPOIMarker(UID_box)){
			elem.addClass('state');
			elem.removeClass('default');
			url = biciMapaOBJ.getIconUrl(true,biciMapaOBJ.getPrefijoCapa(UID),type_marker);
		}
		else if(UID_box=='newPOI'){
			url = biciMapaOBJ.getIconUrl(true,self.getTipoColabora(),'newPOI');
		}
		else{
			elem.addClass('default');
			elem.removeClass('state');
			url = biciMapaOBJ.getIconUrl(true,type_marker);
		}
		elem.css('background-image','url('+ url +')');
		
		biciMapaOBJ.setIconMarker(UID_box,type_marker);
	}

	self.getTypeMarker = function(UID_box){
		if(UID_box=='newPOI') return 'newPOI';
		else{
			var itinerario = self.getItinerario();
			var pos = _.indexOf(itinerario,UID_box);
			var ultpos = itinerario.length-1;
			
			if(pos==0) return 'start';
			else if(pos==ultpos || UID_box==self.getNewBoxUID()) return 'end';
			else if(pos!=-1) return 'inter';
			else return undefined;
		}
	}

	self.getUID_box = function(type_marker){
		var itinerario = $('#itinerario').sortable( "toArray" );
		if(type_marker == 'start') return itinerario[0];
		else if(type_marker == 'end') return itinerario[itinerario.length-1];
		else if(type_marker == 'newPOI') return 'newPOI';
		else return undefined;
	}

	/*self.isOnManualedit = function(){
		return $('#manualedit').prop('checked');
	}*/

	self.getNextBoxUID = function(type_marker_Position){
		var newUID_box = self.getNewBoxUID();
		if(type_marker_Position && !_.isNumber(type_marker_Position)){
			var UID_box = self.getUID_box(type_marker_Position);
			if(!biciMapaOBJ.isSetMarker(UID_box) || !self.isOnMultiDefault() || !self.isAviableNewBox()) 
				return UID_box;
			else 
				return newUID_box;
		}
		else if(_.isNumber(type_marker_Position)){
			return newUID_box;
		}
		else{ 
			//Si no hay type_marker rellena de inicio a fin
			var startUID_box = self.getUID_box('start');
			var endUID_box = self.getUID_box('end');
			     if(!biciMapaOBJ.isSetMarker(startUID_box)) return startUID_box;
			else if(!biciMapaOBJ.isSetMarker(endUID_box) || !self.isAviableNewBox()) return endUID_box;
			else return newUID_box;

		}
	}

	self.getNewBoxUID = function(){
		return $('#newParam > li').attr('id');
	}

	self.isBoxItinerario = function(UID_box){
		return $("#itinerario").find("li[id='"+UID_box+"']").length>0;
	}


	self.setDetalleMarker = function(UID_box){
		if(!biciMapaOBJ.isPOIMarker(UID_box)){
			var txt = self.getInputBox(UID_box).val()
			var notes = self.getNotesBox(UID_box).val();

			var mode = self.getRoutingMode();
			var btns = {
				clean : (mode!='show'),
				favorite: (UID_box!='newPOI' && !biciMapaOBJ.isOwnFavorite(UID_box) && capasPOI.favoritos && (mode!='draw'))
			};
			biciMapaOBJ.setDetalleMarker(UID_box,txt,notes,btns);
		}
	}

	self.setMenuParamRuta = function(UID_box){
		var mode = self.getRoutingMode();
		var onoff = biciMapaOBJ.isSetMarker(UID_box);
		var ibi = self.isBoxItinerario(UID_box);
		$('#opt_'+UID_box+'_home_search').css('display',mode=='find'||(mode=='draw' && !ibi)||UID_box=='newPOI'?'inline-block':'none');
		$('#opt_'+UID_box+'_search').css('display',mode=='find'||(mode=='draw' && !ibi)||UID_box=='newPOI'?'inline-block':'none');
		$('#opt_'+UID_box+'_clean').css('display',(onoff&&mode!='show')||(!onoff && self.isBoxItinerario(UID_box) && self.countBoxes()>2)?'inline-block':'none');
		
		if(onoff){
			$('#opt_'+UID_box+'_find').css('display','inline-block');
			if(UID_box!='newPOI' && !biciMapaOBJ.isOwnFavorite(UID_box) && capasPOI.favoritos && (mode!='draw')){
				$('#opt_'+UID_box+'_favorite').css('display','inline-block');
			}
			else $('#opt_'+UID_box+'_favorite').css('display','none');
			
			self.setDetalleMarker(UID_box);
		}
		else{
			$('#opt_'+UID_box+'_find').css('display','none');
			// $('#opt_'+UID_box+'_clean').css('display','none');
			$('#opt_'+UID_box+'_favorite').css('display','none');
		}

	}

	self.getInputBox = function(UID_box){
		return $('#addr_'+ UID_box);
	}
	self.getNotesBox = function(UID_box){
		return $('#notes_'+ UID_box);
	}

	self.getIDDetalleMarker = function(type_marker){
		if(type_marker=='start') return 'img_detalle_iniruta_';
		else if(type_marker=='end') return 'img_detalle_finruta_';
	}
	self.getRouteLbl = function(type_marker){
		if(type_marker=='start') return $('#lbl_iniruta');
		else if(type_marker=='end')  return $('#lbl_finruta');
	}


	self.getBoxMarkerTemplate = function(UID_box){
		var placeholder = 'Agregar destino...';
		var classes = 'default bkgbox';
		if(UID_box=='newPOI'){
			placeholder = 'Dirección...';
			classes = 'state';
		}

		var iconUrl = biciMapaOBJ.getIconUrl(true,'end');
		
		var box = '';
		box +=	'<li id="'+ UID_box +'" class="boxruta_param" style="position:relative;">';
		box +=		'<input id="addr_'+ UID_box +'" class="ruta_param" placeholder="'+ placeholder +'" type="text" data-provide="typeahead" autocomplete="off">';
		/*box +=		'<img id="icon_'+ UID_box +'" class="iconpoi '+ classes +'" style="background-image:url('+ iconUrl +')" data-dropdown="drop_'+UID_box+'" />';
		box +=		'<ul id="drop_'+UID_box+'" class="f-dropdown" data-dropdown-content>';*/
		box +=		'<ul class="simpledropdown"><li>';
		box +=			'<ul class="bkg_simpledropdown">';
		box +=			'</ul>';
		box +=			'<ul>';
		box +=				'<li id="opt_'+UID_box+'_home_search" onclick="biciMapaUI.locationTOcoord.call(\''+UID_box+'\');"><img data-tooltip="" data-options="disable_for_touch:true" class="tip-top" title="Mi ubicación actual" src="'+ BC_BM_URL +'img/home.png" ></li>';
		box +=				'<li id="opt_'+UID_box+'_home_search_cancel" onclick="biciMapaUI.locationTOcoord.stop();" style="display:none"><img data-tooltip="" data-options="disable_for_touch:true" class="tip-top" title="Cancelar búsqueda" src="'+ BC_BM_URL +'img/home_cancel.png" ></li>';
		box +=				'<li id="opt_'+UID_box+'_search" onclick="biciMapaUI.clickTOcoord.call(\''+UID_box+'\');"><img data-tooltip="" data-options="disable_for_touch:true" class="tip-top" title="Buscar en el mapa" src="'+ BC_BM_URL +'img/search-icon.png" ></li>';
		box +=				'<li id="opt_'+UID_box+'_search_cancel" onclick="biciMapaUI.clickTOcoord.stop();" style="display:none"><img data-tooltip="" data-options="disable_for_touch:true" class="tip-top" title="Cancelar búsqueda" src="'+ BC_BM_URL +'img/search-icon-cancel.png"></li>';
		box +=				'<li id="opt_'+UID_box+'_find" onclick="biciMapaOBJ.findMarker(\''+UID_box+'\');"><img data-tooltip="" data-options="disable_for_touch:true" class="tip-top" title="Encontrar" src="'+ BC_BM_URL +'img/find-icon.png" ></li>';		
		box +=				'<li id="opt_'+UID_box+'_clean" onclick="biciMapaUI.cleanParam(\''+UID_box+'\');"><img data-tooltip="" data-options="disable_for_touch:true" class="tip-top" title="Limpiar" src="'+ BC_BM_URL +'img/clean-marker.png" ></li>';
		if(UID_box!='newPOI')
			box +=			'<li id="opt_'+UID_box+'_favorite" onclick="biciMapaUI.initFavoritoPOI(\''+UID_box+'\');"><img id="img_iniruta_favorite" data-tooltip="" data-options="disable_for_touch:true" class="tip-top" title="Añadir dirección a favoritos" src="'+ BC_BM_URL +'img/heart.png" ></li>';
		box +=			'</ul>';
		box +=			'<img id="icon_'+ UID_box +'" class="iconpoi '+ classes +'" style="background-image:url('+ iconUrl +')" />';
		box +=		'</li></ul>';
		if(UID_box!='newPOI')
		box +=		'<textarea id="notes_'+ UID_box +'" class="ruta_param" style="display:none" placeholder="Notas..." ></textarea>';
		box +=	'</li>';
		return $(box);
	}

	self.genBoxMarker = function(UID_box){
		if(!UID_box) UID_box = 'RUTA_'+genUID();
		var container;
		if(UID_box=='newPOI') container = $('#newPOIcontainer');
		else container = $('#newParam');

		var box = self.getBoxMarkerTemplate(UID_box);
		container.append(box);
		self.setMenuParamRuta(UID_box);
		
		self.getInputBox(UID_box).change(function(){
			var txt = $(this).val();
			self.addrTOcoord.pre(txt,UID_box);
		});
		self.getNotesBox(UID_box).change(function(){
			self.setDetalleMarker(UID_box);
		});
		
		self.getInputBox(UID_box).keyup(function() {
			var time = self.getRoutingMode()=='find'? 1000 : 500;
			txt = $(this);
			delay(function(){txt.change();}, time );
		});
		self.getNotesBox(UID_box).keyup(function() {
			txt = $(this);delay(function(){txt.change();}, 500 );
		});

		return UID_box;
	}
	self.addBoxMarker = function(UID_box,type_marker){
		var box = $('#'+UID_box);
		var itinerario = $('#itinerario').sortable( "toArray" );
		if(type_marker=='start') box.prependTo('#itinerario');
		else if(_.isNumber(type_marker) && type_marker<itinerario.length) $('#itinerario>li:eq('+type_marker+')').before(box);
		else box.appendTo('#itinerario');

		$('#icon_'+UID_box).removeClass('bkgbox');
		box.css('display','block');
		self.setRoutingModeBox(UID_box);
		self.refreshIconMarkers();

		$('#icon_'+UID_box).on('mouseup',function(){$('#itinerario').sortable('disable');});
		$('#icon_'+UID_box).on('mousedown',function(){
			if(self.getRoutingMode()=='find') $('#itinerario').sortable('enable');
		});
	}

	self.removeBoxMarker = function(UID_box){
		var refrescar = self.isBoxItinerario(UID_box);
		$('#'+UID_box).remove();
		$('span.tooltip[data-selector*=tooltip]').remove(); //CUCHUFLETA
		if(refrescar) self.refreshIconMarkers();
	}

	self.countBoxes = function(){return $('#itinerario').sortable("toArray").length;}
	self.isAviableNewBox = function(){
		// newBoxUID disponible cuando todas las cajas tienen su marker definido
		var boxes = self.countBoxes();
		var markers = biciMapaOBJ.countMarkers();
		return (boxes==markers);
	}
	
	self.balanceBoxes = function(){
		var newUID_box;
		var mode = self.getRoutingMode();
		//si no hay, la crea
		if(!(newUID_box=self.getNewBoxUID())) newUID_box=self.genBoxMarker();
		// Visible cuando está disponible Y si es modo 'find' o 'draw'
		if(self.isAviableNewBox() && (mode=='find' || mode=='draw')) $('#'+newUID_box).css('display','block');
		else $('#'+newUID_box).css('display','none'); 
		// $("#pestanasWrap").getNiceScroll().resize();
	}

	self.aceptParam = function(UID_box){
		self.getInputBox(UID_box).removeClass('ruta_paramReject');
	}
	
	self.rejectParam = function(UID_box){
		self.getInputBox(UID_box).addClass('ruta_paramReject');
	}

	self.cleanParam = function(UID_box,noRemoveBox,noRemoveAddr,noResetRoute){
		/*var isStartOrEnd = self.getTypeMarker(UID_box) == 'start' || self.getTypeMarker(UID_box) == 'end';
		if(self.getRoutingMode()!='find' && isStartOrEnd){
			biciMapaUI.setMessage('Hay un problema','No puedes quitar este parámetro','error');
			return;
		}*/
		if(UID_box!='newPOI' && self.getRoutingMode()=='draw' && self.countBoxes()<=2 && !noRemoveBox){
			biciMapaUI.setMessage('Hay un problema','No puedes quitar este parámetro','error');
			return;
		}

		biciMapaOBJ.removeMarker(UID_box);
		self.setBntAttach();//Por si está en modo draw y cambió el startmarker
		
		if(!noRemoveAddr){
			self.setAddrBox(UID_box,'');
		}
		self.aceptParam(UID_box);

		if(self.countBoxes()>2 && !noRemoveBox && UID_box!='newPOI'){ 
			self.removeBoxMarker(UID_box);
		}
		else{
			self.setIconBoxMarker(UID_box);
			self.setMenuParamRuta(UID_box);
		}

		self.balanceBoxes();
		
		if(!noResetRoute && UID_box!='newPOI' && self.getRoutingMode()=='find') self.getRuta(!self.isOnAutoRouting());
		
		if(UID_box=='newPOI') self.setMulticapaColaboraForm();
	}

	self.errorZona = function(UID_box){
		self.cleanParam(UID_box);
		LOG && console.error('Error setColaboraIcon: no hay zona');
		var errorcod=' (r54)';
		self.setMessage('Hay un problema'+errorcod,'El lugar que indicas todavía no está soportado en nuestro mapa. Disculpa las molestias','error');
	}

	self.poiTOparam = function(type_marker,UID){
			self.preAddParamRuta();
			var parMarker = {UID:UID};
			var parBox = {type_marker:type_marker};
			self.addParamRuta(parMarker,parBox);
	}

	self.stopAllRequests = function(){
		self.locationTOcoord.stop();
		self.clickTOcoord.stop();
	}

	self.locationTOcoord = {
		msg:undefined,
		parBox:{UID_box:undefined,type_marker:undefined},
		call: function(UID_box_type_marker){
			self.stopAllRequests();
			var UID_box = self.matchBoxTypeMarker(self.locationTOcoord,UID_box_type_marker,true);

			self.locationTOcoord.setUI(UID_box,true);
			biciMapaOBJ.locationTOcoord.locate(self.locationTOcoord);
		},
		callback: function(coord){
			var UID_box = self.locationTOcoord.parBox.UID_box;
			self.coordTOaddr.call(coord,UID_box);
		},
		stop: function(){
			var UID_box = self.locationTOcoord.parBox.UID_box;
			biciMapaOBJ.locationTOcoord.stop();
			if(UID_box){
				self.locationTOcoord.setUI(UID_box,false);
			}
			self.locationTOcoord.parBox = {UID_box:undefined,type_marker:undefined};
		},
		setUI: function(UID_box,onoff){
			if(onoff){
				self.locationTOcoord.msg = self.stateMessage('','Buscando ubicación',self.locationTOcoord.stop);
				$('#opt_'+UID_box+'_home_search').css('display','none');
				// $('#opt_'+UID_box+'_home_search_cancel').css('display','list-item');
				$('#opt_'+UID_box+'_home_search_cancel').css('display','inline-block');
			}
			else{
				if(self.locationTOcoord.msg){ 
					biciMapaUI.unsetMessage(self.locationTOcoord.msg);
					self.locationTOcoord.msg = undefined;
				}
				// $('#opt_'+UID_box+'_home_search').css('display','list-item');
				$('#opt_'+UID_box+'_home_search').css('display','inline-block');
				$('#opt_'+UID_box+'_home_search_cancel').css('display','none');		
			}
		}
	};

	self.isClickTOCoodActive = function(){
		if(self.clickTOcoord.msg) return self.clickTOcoord.parBox.UID_box;
		else return false;
	}

	// http://www.cursor.cc/
	self.clickTOcoord = {
		// type_marker:undefined,//'start' o 'end' si isOnKeepClickCoord()
		msg: undefined,
		parBox:{UID_box:undefined,type_marker:undefined},
		call: function(UID_box_type_marker){
			if(self.isOnKeepClickCoord()){
				if(UID_box_type_marker=='start') self.clickTOcoord.type_marker='start';
				else self.clickTOcoord.type_marker='end';
			}

			self.stopAllRequests();
			var UID_box = self.matchBoxTypeMarker(self.clickTOcoord,UID_box_type_marker,true);
			
			self.clickTOcoord.setUI(UID_box,true);
			biciMapaOBJ.clickTOcoord.init(self.clickTOcoord.callback);
		},
		callback: function(coord){
			var UID_box = self.clickTOcoord.parBox.UID_box;
			self.coordTOaddr.call(coord,UID_box);
			if(!self.isOnKeepClickCoord()) self.clickTOcoord.stop();
			else self.clickTOcoord.call(self.clickTOcoord.type_marker);
		},
		stop: function(){
			var UID_box = self.clickTOcoord.parBox.UID_box;
			biciMapaOBJ.clickTOcoord.stop();
			if(UID_box){
				self.clickTOcoord.setUI(UID_box,false);
			}
			self.clickTOcoord.parBox = {UID_box:undefined,type_marker:undefined};
		},
		setUI: function(UID_box,onoff){
			self.clickTOcoord.setCursor(UID_box,onoff);
			if(onoff){
				// self.clickTOcoord.msg = biciMapaUI.setMessage('','Haz clic en el mapa para encontrar la dirección','success',true,true);
				self.clickTOcoord.msg = self.stateMessage('','Haz clic en el mapa para encontrar la dirección',self.clickTOcoord.stop);
				$('#opt_'+UID_box+'_search').css('display','none');
				// $('#opt_'+UID_box+'_search_cancel').css('display','list-item');
				$('#opt_'+UID_box+'_search_cancel').css('display','inline-block');
			}
			else{
				if(self.clickTOcoord.msg){ 
					biciMapaUI.unsetMessage(self.clickTOcoord.msg);
					self.clickTOcoord.msg = undefined;
				}
				// $('#opt_'+UID_box+'_search').css('display','list-item');
				$('#opt_'+UID_box+'_search').css('display','inline-block');
				$('#opt_'+UID_box+'_search_cancel').css('display','none');				
			}
		},
		setCursor: function(UID_box,onoff){
			if(onoff){
				var cursor_url;
				if(UID_box=='newPOI') cursor_url = biciMapaOBJ.getIconUrl('cursor',self.getTipoColabora(),'newPOI');
				else cursor_url = biciMapaOBJ.getIconUrl('cursor',self.getTypeMarker(UID_box));
				$('#map').css('cursor','url('+ cursor_url +'),auto');
			}
			else $('#map').css('cursor','');
		}
	};

	self.coordTOaddr = {
		// parBox:{UID_box:undefined,type_marker:undefined},
		parBox:{},
		// parMarker:{addr:undefined,coord:undefined},
		parMarker:{},
		call: function(coord,UID_box_type_marker_Position){
			if(self.isNormalCoordActive()) coord = biciMapaOBJ.normalizeCoords(coord);
			if(UID_box_type_marker_Position=='newPOI' && !biciMapaOBJ.checkZonaMarker(coord)){
				self.errorZona(UID_box_type_marker_Position);
				return;
			}
			var UID_box = self.matchBoxTypeMarker(self.coordTOaddr,UID_box_type_marker_Position);

			if(self.isRevGeoCodingActive()){
				self.coordTOaddr.parMarker[UID_box]={};
				self.coordTOaddr.parMarker[UID_box].coord = coord;
				biciMapaOBJ.coordTOaddr(coord,UID_box,self.coordTOaddr.callback);
			}
			else{
				var addr = '['+coord.lat+','+coord.lng+']';
				var parMarker={addr:addr,coord:coord};
				if(UID_box!='newPOI') self.addParamRuta(parMarker,self.coordTOaddr.parBox[UID_box]);
				else self.addParamNewPOI(parMarker);
			}
		},
		callback: function(UID_box,addr){
			self.coordTOaddr.parMarker[UID_box].addr = addr;
			if(UID_box!='newPOI') self.addParamRuta(self.coordTOaddr.parMarker[UID_box],self.coordTOaddr.parBox[UID_box]);
			else self.addParamNewPOI(self.coordTOaddr.parMarker[UID_box]);
			
			delete(self.coordTOaddr.parBox[UID_box]);
			delete(self.coordTOaddr.parMarker[UID_box]);
		}
	};

	self.addrTOcoord = {
		parBox:{},
		parMarker:{},
		pre: function(addr,UID_box_type_marker){
			var UID_box = self.matchBoxTypeMarker(self.addrTOcoord,UID_box_type_marker);

			if(self.isCommand(addr)){
				self.execCommand(addr,UID_box);
			}
			// Valida si no esta haciendo búsqueda innecesaria
			else if((addr!='' && addr!=self.lastAddrSearched[UID_box]) && (
				(UID_box!='newPOI' && self.getRoutingMode()=='find')
				|| (UID_box!='newPOI' && self.getRoutingMode()=='draw' && UID_box==self.getNewBoxUID())
				|| (UID_box=='newPOI' && !biciMapaOBJ.isSetMarker('newPOI'))
			)){
				self.addrTOcoord.call(UID_box,addr);
			}
			else if(addr=='' && (UID_box=='newPOI' || self.getRoutingMode()=='find')){ //Si borró el campo se quita el parametro
				self.cleanParam(UID_box);
			}
			else { // SI no limpia ni asigna, actualiza popup del marcador
				self.setDetalleMarker(UID_box);
			}
		},
		call: function(UID_box,addr){
			
			self.setlastAddrSearched(UID_box,addr);
			try{ // Acepta coordenadas en formato [lat,lng] o el nombre de una zona z|x|y
				var latlng;				
				if(addr.split('|').length==3) latlng = biciMapaOBJ.getBoundsZona(addr).getCenter();
				else{ 
					var coords = JSON.parse(addr);
					latlng = L.latLng({lat:coords[0],lng:coords[1]});
				}
				self.coordTOaddr.call(latlng,UID_box);
			}
			catch(e){
				self.cleanParam(UID_box,true,true,true);
				// Primero determina si la dirección es nombre de POI.
				var UID = biciMapaOBJ.addrTOpoi(addr);
				if(UID && UID_box!='newPOI'){
					var parMarker = {UID:UID};
					self.addParamRuta(parMarker,self.addrTOcoord.parBox[UID_box]);
				}
				else{
					self.addrTOcoord.parMarker[UID_box] = {};
					self.addrTOcoord.parMarker[UID_box].addr = addr;
					biciMapaOBJ.addrTOcoord(addr,UID_box,self.addrTOcoord);
				}
			}
		},
		callback: function(UID_box,coord){
			self.addrTOcoord.parMarker[UID_box].coord = coord;
			if(UID_box!='newPOI') self.addParamRuta(self.addrTOcoord.parMarker[UID_box],self.addrTOcoord.parBox[UID_box]);
			else self.addParamNewPOI(self.addrTOcoord.parMarker[UID_box]);
			
			delete(self.addrTOcoord.parBox[UID_box]);
			delete(self.addrTOcoord.parMarker[UID_box]);
		},
		error: function(UID_box){
			self.rejectParam(UID_box);
			self.cleanRoute(true);//SI hay caja flotando no se carga ruta
			if(UID_box!='newPOI') self.balanceBoxes();
			delete(self.addrTOcoord.parBox[UID_box]);
			delete(self.addrTOcoord.parMarker[UID_box]);
		}
	};
	
	/* self.verifyPOIRouteParam = function(type_marker,UID,coord){
		var POIcoords = biciMapaOBJ.getPOIlatlng(UID);
		if(POIcoords && POIcoords.equals(coord)) return biciMapaOBJ.getPOInombre(UID);
		else return undefined;
	}*/

	/*
	parMarker: UID,addr,coord
	parBox: type_marker,UID_box
	*/

	self.matchBoxTypeMarker = function(source,UID_box_type_marker_Position,single){
		var params = {UID_box:UID_box_type_marker_Position,type_marker:UID_box_type_marker_Position};

		if(UID_box_type_marker_Position=='newPOI')
			params.type_marker = 'newPOI';
		else if(!UID_box_type_marker_Position || UID_box_type_marker_Position=='start' || UID_box_type_marker_Position=='end' || _.isNumber(UID_box_type_marker_Position))
			params.UID_box = self.getNextBoxUID(UID_box_type_marker_Position);
		// Si no es vacío,start,end o posicion, es UID_box
		else params.type_marker = self.getTypeMarker(UID_box_type_marker_Position);
		
		if(single) source.parBox = params;
		else source.parBox[params.UID_box] = params;
		
		return params.UID_box;
	}

	//Se usa cuando es acción del usuario.
	self.preAddParamRuta = function(){
		var mode = self.getRoutingMode();
		if(!self.isSetPantalla('main')){ 
			self.setPantalla('main');//cambia routingMode
		}
		else if(mode=='show'){ // SI el USER trata de agregar en modo show, vuelve a modo find
			self.cleanRoute();
			self.setRoutingMode('find');
		}

		if(!self.isControlesDisplayed()) self.displayControles(true);
	}

	self.addParamRuta = function(parMarker,parBox){

		var mode = self.getRoutingMode();

		//normaliza coordenadas
		if(self.isNormalCoordActive() && parMarker.coord) parMarker.coord = biciMapaOBJ.normalizeCoords(parMarker.coord);

		//Primero determinar UID_box si no viene. Misma lógica que matchBoxTypeMarker
		if(!parBox) parBox = {};
		if(!parBox.UID_box) parBox.UID_box = self.getNextBoxUID(parBox.type_marker);
		if(_.isUndefined(parBox.type_marker)) parBox.type_marker = self.getTypeMarker(parBox.UID_box);

		self.cleanParam(parBox.UID_box,true,false,true);

		if(parMarker.UID){//Prioridad al POIMarker
			//Borrar parámetro que ya contiene este UID
			var UID_box_aux = biciMapaOBJ.isMarkerPOI(parMarker.UID);
			if(UID_box_aux && UID_box_aux!=parBox.UID_box) self.cleanParam(UID_box_aux,false,false,true);

			// SI no se encuentra POI en coordenadas, crea un Marker con su nombre
			if(parMarker.UID && parMarker.addr && parMarker.coord){
				if(!biciMapaOBJ.setPOIMarker(parMarker.UID,parBox.UID_box,parBox.type_marker,parMarker.coord)){
					delete parMarker.UID;
					self.addParamRuta(parMarker,parBox);
					return;
				}
			}
			else biciMapaOBJ.setPOIMarker(parMarker.UID,parBox.UID_box,parBox.type_marker);

			parMarker.addr = biciMapaOBJ.getPOInombre(parMarker.UID);
		}
		// else if(parMarker.addr && parMarker.coord){
		else{
			self.setMarker(parMarker.coord,parBox.UID_box);
		}

		// aca se actualizan todos los iconos
		if(!self.isBoxItinerario(parBox.UID_box)) self.addBoxMarker(parBox.UID_box,parBox.type_marker);
		else self.setIconBoxMarker(parBox.UID_box,_.isNumber(parBox.type_marker)?'inter':parBox.type_marker);

		self.addParamExtras(parBox.UID_box,parMarker.addr,parMarker.notes);

		self.balanceBoxes();
		//REVISAR si es necesario reconstruir siendo que está en el camino
		// if(mode=='find' && !_.isNumber(parBox.type_marker)) self.getRuta(!self.isOnAutoRouting());
		if(mode=='find') self.getRuta(!self.isOnAutoRouting());
		else if(mode=='draw') self.setBntAttach();
		
		if(!biciMapaOBJ.isCoordInMap(parMarker.coord)) biciMapaOBJ.findMarker(parBox.UID_box,true);
	}

	self.addParamNewPOI = function(parMarker){
		if(!self.isSetPantalla('colaboraPOI')) self.setPantalla('colaboraPOI');
		if(!self.isControlesDisplayed()) self.displayControles(true);

		self.cleanParam('newPOI');
		self.setMarker(parMarker.coord,'newPOI');
		self.addParamExtras('newPOI',parMarker.addr);
		self.setMulticapaColaboraForm();
		biciMapaOBJ.findMarker('newPOI',true);
	}
	
	self.addParamExtras = function(UID_box,addr,notes){
		self.setAddrBox(UID_box,addr);
		self.getNotesBox(UID_box).val(notes);
		self.aceptParam(UID_box);
		self.setMenuParamRuta(UID_box);
	}

	self.setMarker = function(coord,UID_box){
		var mode = self.getRoutingMode();
		// biciMapaOBJ.setMarker(parMarker.coord,parMarker.addr,parMarker.notes,UID_box,mode=='show'&&UID_box!='newPOI');
		biciMapaOBJ.setMarker(coord,UID_box,mode=='show'&&UID_box!='newPOI');
	}

	self.setAddrBox = function(UID_box,addr){
		self.getInputBox(UID_box).val(addr);
		self.setlastAddrSearched(UID_box,addr);
	}
	self.setlastAddrSearched = function(UID_box,addr){
		self.lastAddrSearched[UID_box] = addr;
	}

	self.cancelDrawRuta = function(){
		if(self.getUID_ruta()) self.setRoutingMode('show');
		else self.setRoutingMode('find');
	}

	self.getRoutingMode = function(){
		return self.routingMode;
	}
	self.setRoutingMode = function(mode){
		self.routingMode = mode;
		
		self.balanceBoxes();
		// $('#itinerario').sortable((mode=='draw'||mode=='show')?'disable':'enable');
		$('#itinerario').sortable('disable');
		self.setRoutingModeItinerario();

		$('.boxruta_find').css('display',mode=='find'?'block':'none');
		$('.boxruta_draw').css('display',mode=='draw'?'block':'none');
		
		if(mode=='find'){ 
			$('#rutaTab .menu_title').html('<h1>Obtener ruta</h1>');
			self.setUID_ruta('');
		}
		/*if(mode=='show'){
			$('#rutaTab .menu_title').html();
		}*/
		if(mode=='draw'){
			$('#rutaTab .menu_title').html('<h1>Editar ruta</h1>');
			biciMapaOBJ.setRouteStyle('engine');
			self.setBntAttach();
			$('#rutapublica').prop('checked',false);
			// $('#rutapublica').change();
 			// $('#txt_tagsRuta').val('');

			var UID_box = self.getUID_box('start');
			var UID = biciMapaOBJ.isPOIMarker(UID_box);
			var capa_nombre = biciMapaOBJ.getPOIcapa(UID);
 			if(UID && biciMapaOBJ.isCapaRutadjunt(capa_nombre)){
				$('#txt_nombreRuta').val(biciMapaOBJ.getPOInombre(UID));
 			}
 			else $('#txt_nombreRuta').val('');
		}

		self.setMenuRuta((mode=='find' && biciMapaOBJ.isSetRuta())?'found':mode); //find|found|draw|show
		self.editingRuta.set(false);
		self.setRemoveVertexRuta.set(false);
	}

	self.setRoutingModeItinerario = function(){
		var itinerario = $('#itinerario').sortable( "toArray" );
		_.each(itinerario,function(UID_box){
			self.setRoutingModeBox(UID_box);
		});

	}
	self.setRoutingModeBox = function(UID_box){
		var mode = self.getRoutingMode();
		var bgcolor = (mode=='draw'||mode=='find')? 'white':'OldLace';
		$('#'+UID_box).css('background',bgcolor);
		
		self.getInputBox(UID_box).prop('disabled',mode=='show'||(mode=='draw' && biciMapaOBJ.isPOIMarker(UID_box)));
		// var dispNotes = (mode=='draw'|| (mode=='show' && self.getTypeMarker(UID_box)=='start')) && !biciMapaOBJ.isPOIMarker(UID_box);
		var dispNotes = mode=='draw' && !biciMapaOBJ.isPOIMarker(UID_box);
		self.getNotesBox(UID_box).css('display',dispNotes?'block':'none');
		self.getNotesBox(UID_box).prop('disabled',mode=='show');
		if(mode=='find' && !biciMapaOBJ.isPOIMarker(UID_box)){ 
			self.getInputBox(UID_box).val(self.lastAddrSearched[UID_box]);
			self.getNotesBox(UID_box).val('');
		}
		
		self.setMenuParamRuta(UID_box);
		biciMapaOBJ.fixRutaMarker(UID_box,mode=='show');
		
	}

	self.setMenuRuta = function(mode){ //find|found|draw|show
		$('#centerRoute').css('display',mode=='found'||mode=='draw'||mode=='show'?'inline-block':'none');
		// $('#enrutar').css('display',(mode=='find'||mode=='found')&&!self.isOnAutoRouting()?'inline-block':'none');
		$('#enrutar').css('display',mode=='find'||mode=='found'?'inline-block':'none');
		//VERIICAR QUE NO ES FAVORITO ALREADY
		$('#favouriteRoute').css('display',mode=='found'||mode=='show'?'inline-block':'none');
		$('#btn_ruta_share').css('display',mode=='found'||mode=='show'?'inline-block':'none');
		$('#editarRuta').css('display',mode=='found'||mode=='show'?'inline-block':'none'); //Verificar permisos de edicion
		$('#limpiarMapa').css('display',mode=='found'||mode=='find'||mode=='show'?'inline-block':'none');
		$('#guardarRuta').css('display',mode=='draw'?'inline-block':'none');
		$('#cancelEditarRuta').css('display',mode=='draw'?'inline-block':'none');
		$('#reEnrutar').css('display',mode=='show'?'inline-block':'none');
	}

	self.setBntAttach = function(){
		var isDrawMode = self.getRoutingMode()=='draw';

		var startUID = biciMapaOBJ.isPOIMarker(self.getUID_box('start'));
		var startAdjunt = startUID? biciMapaOBJ.isCapaRutadjunt(biciMapaOBJ.getPOIcapa(startUID)) : false;
		var endUID = biciMapaOBJ.isPOIMarker(self.getUID_box('end'));
		var endAdjunt = endUID? biciMapaOBJ.isCapaRutadjunt(biciMapaOBJ.getPOIcapa(endUID)) : false;
		var conadjunt = biciMapaOBJ.getFirstCapaRutadjunt() && (!startUID || !endUID);
		conadjunt = conadjunt || (startUID && startAdjunt) || (endUID && endAdjunt);
		$('#adjuntarRuta').css('display',isDrawMode && conadjunt?'inline':'none');
	}

	self.editingRuta = {
		msg: undefined,
		set: function(onoff){
			$('#manualedit_cancel').css('display',(onoff&&self.getRoutingMode()=='draw')?'inline-block':'none');
			$('#manualedit').css('display',(onoff||self.getRoutingMode()!='draw')?'none':'inline-block');
			biciMapaOBJ.setEditRuta(onoff);
			if(onoff) self.updateDistanceRoute();
			else self.updateDistanceRoute(biciMapaOBJ.getTotalDistanceRuta());
			// $('#cleanAreaRoute').css('display',onoff?'inline-block':'none');
			// self.editingRuta.setMsg(onoff);
		},
		setMsg: function(onoff){
			if(onoff){ 
				var txt = 'Click para añadir o quitar vértice.<br/>';
				txt += 'Arrastrar para mover vértice.';
				self.editingRuta.msg = self.setMessage('Edición manual',txt,'info',true);
			}
			else if(self.editingRuta.msg){ 
				self.unsetMessage(self.editingRuta.msg);
				self.editingRuta.msg = undefined;
			}
		}
	}
	self.setRemoveVertexRuta = {
		msg: undefined,
		set: function(onoff){
			// self.setRemoveVertexRuta.setMsg(onoff);
			$('#cleanAreaRoute_cancel').css('display',(onoff&&self.getRoutingMode()=='draw')?'inline-block':'none');
			$('#cleanAreaRoute').css('display',(onoff||self.getRoutingMode()!='draw')?'none':'inline-block');
			biciMapaOBJ.setRemoveVertexRuta(onoff);
		},
		setMsg: function(onoff){
			if(onoff){ 
				var txt = '';
				txt += 'Dibuja el área para quitar vertices';
				self.setRemoveVertexRuta.msg = self.setMessage('Borrar área',txt,'info',true);
			}
			else if(self.setRemoveVertexRuta.msg){ 
				self.unsetMessage(self.setRemoveVertexRuta.msg);
				self.setRemoveVertexRuta.msg = undefined;
			}
			self.editingRuta.setMsg(!onoff);
		}
	}

	// self.autoComplete = function(typeahead, query){
	// 	var data = new Array();
	// 	var dir;
	// 	_.each(biciMapaOBJ.getCacheIds(),function(keyMap){
	// 		dir = (keyMap.split('|'))[1];
	// 		if(!(data.indexOf(dir)!=-1)){
	// 			data.push(dir);
	// 		}
			
	// 		dir = (keyMap.split('|'))[3];
	// 		if(!(data.indexOf(dir)!=-1)){
	// 			data.push(dir);
	// 		}
	// 	});
	// 	return data;
	// }

	self.setRutaAdjunta =  function(val){
		self.setHiddenAttrColaboraForm('newPOI_UID_ruta',val);
	}
	self.getRutaAdjunta =  function(){
		var input = $('#newPOI_UID_ruta');
		if(input.length>0) return input.val();
		else return false;
	}

	self.attachRoute = {
		parMarker: undefined,
		attach: function(){
			if(biciMapaOBJ.isSetRuta()){
				var UID_box = self.getUID_box('start');
				var capa_nombre = biciMapaOBJ.getFirstCapaRutadjunt();

				var params = {
					nombrePOI : $('#txt_nombreRuta').val(),
					es_representante : $('#rutaeditpublica').prop('checked'),
					// capa_nombre : capa_nombre, // NO se necesita acá
					// zonaPOI: marker.feature.properties.zona,
					// direccionPOI : marker.feature.properties.direccion,
					/*lat : marker.feature.geometry.coordinates[1],
					lng : marker.feature.geometry.coordinates[0],*/
					// fotoPOI : marker.feature.properties.imagen,
					// url_imagen : marker.feature.properties.url_imagen,
					// secundarias : marker.feature.properties.secundarias,
					atributos : {"notas":self.getNotesBox(UID_box).val(),'UID_ruta':UID_box}
				}

				self.initNuevoPOI(capa_nombre,UID_box,params);
				self.attachRoute.parMarker = {addr: self.getInputBox(UID_box).val(),coord: biciMapaOBJ.getCoordMarker(UID_box)};
				biciMapaOBJ.removeMarker(UID_box);
				// self.setRutaAdjunta(UID_box);
				self.setRoutingMode('draw');
				// self.setRutaAdjColaboraForm();
			}
		},
		unAttach: function(cleanRoute){
			if(self.attachRoute.parMarker){
				var UID_box = self.getUID_box('start');
				self.setMarker(self.attachRoute.parMarker.coord,UID_box);
				biciMapaOBJ.setIconMarker(UID_box,'start');
				self.attachRoute.parMarker = undefined;
				self.setRoutingMode('find');
				self.setRutaAdjunta('');
				if(cleanRoute) self.cleanRoute();
				self.setRutaAdjColaboraForm();
			}
		}
	}

	self.getTipoColabora = function(){ return $('#selecttipoPOI').val(); }
	self.setTipoColabora = function(capa_nombre){ $('#selecttipoPOI').val(capa_nombre); }

	self.cancelColaboraForm = function(){
		self.limpiarColaboraForm(true);
		self.setPantalla('main',true);
	}
	self.limpiarColaboraForm = function(showEditing){
		if(is_user_logged_in()){

			var UID = biciMapaOBJ.getEditingPOIUID();
			biciMapaOBJ.unsetEditPOI();
			if(UID && showEditing) biciMapaOBJ.findMarker(UID);

			self.cleanParam('newPOI');
			$('#poiTab .menu_title').html('Nuevo lugar de interés');
			$('#txt_nombrePOI').val('');
			self.setImageColaboraForm();
			self.attachRoute.unAttach();
			self.setColaboraForm();
		}
	}

	self.setColaboraForm = function(params){
		self.setIconBoxMarker('newPOI');
		if(biciMapaOBJ.getCoordMarker('newPOI') && !biciMapaOBJ.checkZonaMarker(biciMapaOBJ.getCoordMarker('newPOI'))){
			biciMapaUI.errorZona('newPOI');
			return;
		}
		if(self.isClickTOCoodActive()=='newPOI') self.clickTOcoord.setCursor('newPOI',onoff);
		self.setAttrColaboraForm(params);
		self.setMulticapaColaboraForm(params);
		self.setRutaAdjColaboraForm();
		self.setIconColaboraForm(params);
	}
		
	self.setRutaAdjColaboraForm = function(){
		if(self.getRutaAdjunta()) $('#rutadjunta').css('display','block');
		else $('#rutadjunta').css('display','none');
	}

	self.setIconColaboraForm = function(params){
		var capa_nombre = self.getTipoColabora();
		if(!params) params = biciMapaOBJ.getEditingPOIParams();

		if(user_data.user_rol=='superadmin' || user_data.user_rol=='admin'){
			$('#txt_iconPOI').css('display','block');
			if(params) $('#txt_iconPOI').val(params.icon);
		}
		else $('#txt_iconPOI').css('display','none');
	}

	self.setAttrColaboraForm = function(params){
		var capa_nombre = self.getTipoColabora();
		if(!params) params = biciMapaOBJ.getEditingPOIParams();

		$('#esRepresentante').prop('checked',false);

		if(params){
			$('#poiTab .menu_title').html('Editar '+htmlentities_decode(params.nombrePOI));
			// self.setAddrBox('newPOI',htmlentities_decode(params.direccionPOI));
			$('#txt_nombrePOI').val(htmlentities_decode(params.nombrePOI));
			$('#esRepresentante').prop('checked',params.es_representante);
			self.setImageColaboraForm(params.fotoPOI,params.url_imagen);
		}
		
		if(capasPOI[capa_nombre].tipo=='community' || capasPOI[capa_nombre].tipo=='private'){
			$('#lbl_esRepresentante').css('display','block');
		}else{
			$('#lbl_esRepresentante').css('display','none');
			// $('#esRepresentante').prop('checked',true); //DON'T CARE
		}

		var form;
		var html_attr;
		$('#atributosCapa').html('');

		var atributos = capasPOI[capa_nombre].atributos;
		_.each(atributos,function(atributo,clave){
			form = $('<div class="atributo-capa"></div>');
			if(atributo.tipo == 'text'){
				html_attr = $('<input type="text" placeholder="'+ atributo.nombre +'..." id="newPOI_'+ clave +'" >');
				if(params && params.atributos && params.atributos[clave]){
					var valor = params.atributos[clave];
					html_attr.val($("<div/>").html(valor).text());
				}
				form.append(html_attr);
			}
			else if(atributo.tipo == 'textarea'){
				html_attr = $('<textarea id="newPOI_'+ clave +'" rows="5" placeholder="'+ atributo.nombre +'..."></textarea>');
				if(params && params.atributos && params.atributos[clave]){
					var valor = params.atributos[clave];
					html_attr.val($("<div/>").html(valor).text());
				}
				form.append(html_attr);
			}
			else if(atributo.tipo == 'radio'){
				form.append($('<h4>'+atributo.nombre+'</h4>'));

				var opciones = atributo.opciones.split('|');
				_.each(opciones,function(opcion){
					var checked = '';
					if(params && params.atributos && params.atributos[clave] == opcion){
						checked ='checked="checked"';
					}
					html_attr = $('<label><input type="radio" name="newPOI_'+clave+'" value="'+opcion+'" '+checked+' ">'+opcion+'</label><br/>');
					form.append(html_attr);
				});
			}
			else if(atributo.tipo == 'hidden'){// Ruta adjunta: UID_ruta

				if(params && params.atributos && params.atributos[clave]){
					var valor = params.atributos[clave];
				}
				html_attr = $('<input type="hidden" id="newPOI_'+clave+'" value="'+(valor?valor:'')+'">');
				form.append(html_attr);

			}

			$('#atributosCapa').append(form);	
		});
	}

	self.setHiddenAttrColaboraForm = function(name,val){
		var input = $('#'+name);
		if(input.length>0) input.val(val);
	}

	self.setImageColaboraForm = function(fotoPOI,url_imagen){
		if(fotoPOI && fotoPOI!=""){
			self.POIfilename = fotoPOI;
			$('#thumbNewPOI').html('<a href="'+url_imagen+fotoPOI+'" target="_blank"></a>');
			$('#thumbNewPOI a').html('<img src="'+url_imagen+"thumb_"+fotoPOI+'" />');
			$("#thumbNewPOI a").fancybox();
		}
		else{
			self.POIfilename = '';
			$('#thumbNewPOI').html('');
		}
	}

	self.setMulticapaColaboraForm = function(params){
		var capa_nombre = self.getTipoColabora();
		if(!params) params = biciMapaOBJ.getEditingPOIParams();
		// Aquí verifica si está puesto el marker
		var capas = biciMapaOBJ.getMulticapasZona(capa_nombre); 
		var checked=false;
		if(capasPOI[capa_nombre].multicapa && _.size(capas)>0){
			$('#titulo_servicios').css('display','block');
			var item = '';
			var c1,c2;
			_.each(capas,function(capa_nombre2){
				c1 = (_.size($('#lbl_otro_serv_'+capa_nombre2))>0 && $('#otro_serv_'+capa_nombre2).is(':checked'));
				c2 = (params && _.indexOf(params.secundarias,capa_nombre2)>-1);
				
				if((c1 && !c2)||(!c1 && c2)) checked = true;
				else checked = false;
				item +=
					'<label id="lbl_otro_serv_'+ capa_nombre2 +'" >'+
						'<input id="otro_serv_'+ capa_nombre2 +'" type="checkbox" '+(checked?'checked="checked"':'')+' > '+ toTitleCase(capasPOI[capa_nombre2].singular) +
					'</label>';
			});
			$('#capas_secundarias').html($(item));
		}
		else{
			$('#titulo_servicios').css('display','none');
			$('#capas_secundarias').html('');
		}
	}

	self.checkPOIName = function(){

		var POI_name = $('#txt_nombrePOI').val();
	
		if(!biciMapaOBJ.checkPOIName($('#txt_nombrePOI').val())){
			var errorcod=' (r26)';
			self.setMessage('Hay un problema'+errorcod,'Este nombre ya esá en uso. Elige otro diferente','error');
			return;
		}

		// var cartel = self.setBuscando('','Comprobando datos...');
		var cartel = self.setCargando();
		$.ajax({
			type: 'POST',timeout: self.getTimeOut(),
			url: baseUrl + '/wp-admin/admin-ajax.php',
			data: {
				action: 'bcbm_check_poi_name',
				name: POI_name,
				UID: biciMapaOBJ.getEditingPOIUID()
			},
			success: function(data, textStatus, XMLHttpRequest){
				// self.unsetBuscando(cartel);
				self.unsetCargando();
				if(data=='OK'){
					self.enviarColaboraForm();
				}
				else{
					var errorcod=' (r27)';
					self.setMessage('Hay un problema'+errorcod,'Este nombre ya esá en uso. Elige otro diferente','error');
					LOG && console.log(data);
				}
			},
			error: function(MLHttpRequest, textStatus, errorThrown){
				// self.unsetBuscando(cartel);
				self.unsetCargando();
				LOG && console.error('Fail checkPOIName: ' + errorThrown);
				var errorcod=' (r28)';
				self.setMessage('Hay un problema'+errorcod,'No se pudo validar el formulario. Por favor intenta de nuevo','error');
			}
		});
	}

	self.validarColaboraForm = function(){
		
		if( $('#txt_nombrePOI').val()=='' ){
			var errorcod=' (r29)';
			self.setMessage('Hay un problema'+errorcod,'Debes indicar el nombre','error');
			// return false;
		} 
		else if(self.getInputBox('newPOI').val()==''){
			var errorcod=' (r30)';
			self.setMessage('Hay un problema'+errorcod,'Debes indicar la dirección','error');
			// return false;
		} 
		else if(!biciMapaOBJ.getCoordMarker('newPOI')){
			var errorcod=' (r31)';
			self.setMessage('Hay un problema'+errorcod,'No se encontró la dirección indicada.','error');
			// return false;
		}
		else if(!biciMapaOBJ.getZonaMarker('newPOI')){
			var errorcod=' (r32)';
			self.setMessage('Hay un problema'+errorcod,'El lugar que indicas todavía no está soportado en nuestro mapa. Disculpa las molestias.','error');
			// return false;
		}
		else{
			// if(biciMapaOBJ.getEditingPOIid()!=0){
			// 	var editingParams = biciMapaOBJ.getEditingPOIParams();
			// 	var POIParams = self.getParamsColaboraForm();
			// 	var sincambios = true;
			// 	sincambios = sincambios && POIParams.nombrePOI == editingParams.nombrePOI;
			// 	sincambios = sincambios && POIParams.capa_nombre == editingParams.capa_nombre;
			// 	sincambios = sincambios && POIParams.direccionPOI == editingParams.direccionPOI;
			// 	sincambios = sincambios && POIParams.lat == editingParams.lat;
			// 	sincambios = sincambios && POIParams.lng == editingParams.lng;
			// 	sincambios = sincambios && POIParams.fotoPOI == editingParams.fotoPOI;
			// 	sincambios = sincambios && POIParams.zonaPOI == editingParams.zonaPOI;

			// 	_.each(POIParams.atributos,function(attr_valor,attr_clave){
			// 		if(editingParams[attr_clave])
			// 			sincambios = sincambios && attr_valor == editingParams[attr_clave].valor;
			// 	});
			// 	_.each(POIParams.secundarias,function(secundaria){
			// 		_.each(editingParams.secundarias,function(secundaria2){
			// 			sincambios = sincambios && secundaria == secundaria2;
			// 		});
			// 	});
			// }	
			// if(sincambios){
				// var errorcod=' (r32)';
			// 	self.setMessage('Hay un problema'+errorcod,'No has hecho ningún cambio','error');
			// }
			// else 
				// self.checkPOIName();
				self.enviarColaboraForm();
		}
	}

	self.getParamsColaboraForm = function(){
		var capa_nombre = self.getTipoColabora();
		var coord = biciMapaOBJ.getCoordMarker('newPOI');
		var POIform = {
			id: 				biciMapaOBJ.getEditingPOIid(),
			UID : 				biciMapaOBJ.getEditingPOIUID(),
			nombrePOI : 		htmlentities($('#txt_nombrePOI').val()),
			es_representante : 	$('#esRepresentante').is(':checked'),
			capa_nombre : 		capa_nombre,
			zonaPOI : 			biciMapaOBJ.getZonaMarker('newPOI'),
			direccionPOI : 		htmlentities(self.getInputBox('newPOI').val()),
			lat : 				coord?coord.lat:undefined,
			lng : 				coord?coord.lng:undefined,
			fotoPOI : 			self.POIfilename,
			secundarias : 		Array(),
			atributos : 		{},
			icon : 				$('#txt_iconPOI').val()
		};
		var capas = biciMapaOBJ.getMulticapasZona(capa_nombre);
		_.each(capas,function(capa_nombre2){
			if(_.size($('#lbl_otro_serv_'+capa_nombre2))>0 
				// && $('#lbl_otro_serv_'+capa_nombre2).css('display')!='none'
				&& $('#otro_serv_'+capa_nombre2).is(':checked')){

				POIform.secundarias.push(capa_nombre2);
			}
		});

		_.each($('#atributosCapa input[type!=radio]'),function(input){//incluye text
			POIform.atributos[$(input).attr('id').replace('newPOI_','')] = htmlentities($(input).val());
		});
		_.each($('#atributosCapa textarea'),function(input){
			POIform.atributos[$(input).attr('id').replace('newPOI_','')] = htmlentities($(input).val());
		});
		_.each($('#atributosCapa input[type=radio]'),function(input){
			if($(input).prop('checked'))
				POIform.atributos[$(input).attr('name').replace('newPOI_','')] = htmlentities($(input).val());
		});

		return POIform;
	}

	self.enviarColaboraForm = function(){
		if(self.enviandoPOI) return;

		// var cartel = self.setBuscando('','Enviando formulario...');
		var cartel = self.setCargando();

		self.enviandoPOI = true;
		
		var POIform = self.getParamsColaboraForm();


		$.ajax({
			type: 'POST',timeout: self.getTimeOut(),
			url: baseUrl + '/wp-admin/admin-ajax.php',
			data: {
				action: 'bcbm_new_poi',
				POI: POIform
			},
			success: function(data, textStatus, XMLHttpRequest){
				// self.unsetBuscando(cartel);
				self.unsetCargando();
				try{
					var result = JSON.parse(data);
				}
				catch(e){
					LOG && console.error('Fail enviarColaboraForm: '+ e.message);
					LOG && console.log(data);
					var errorcod=' (r33)';
					self.setMessage('Hay un problema'+errorcod,'No se pudo enviar el formulario. Por favor intenta de nuevo','error');	
					self.enviandoPOI = false;
					return;
				}

				var estados = (result.estado == 'eliminado' || result.estado == 'actualizado' || result.estado == 'sin_permisos' || result.estado=='inapropiado' || result.estado=='sin_permiso_crear')

				if(result.exito || estados){
					biciMapaOBJ.unsetEditPOI(true);
					if(result.POI && biciMapaOBJ.isZonaLoaded(result.POI.properties.zona,result.POI.properties.capa)) 
						// si no se ha cargado la capa aun, se trae el POI en la próxima carga :)
						biciMapaOBJ.addPOI(result.POI,false,true);
					self.limpiarColaboraForm();
				}

				if(result.exito){
					self.setMessage('','Formulario enviado con éxito. Gracias por aportar con Bicimapa.','success');
					if(POIform.capa_nombre=='favoritos'){
						biciMapaOBJ.updatePOIFavorites(result.POI.properties.UID,true,1,true);
					}
				}
				else if(result.estado == 'actualizado' || result.estado == 'sin_permisos'){
					var errorcod=' (r34)';
					self.setMessage('Hay un problema'+errorcod,'El punto fue modificado por otro usuario. Se ha actualizado automáticamente en tu mapa.','warning',true);
				}
				else if(result.estado=='inapropiado'){
					var txt = ' Ya no está disponible.';
					if(result.POI) txt = ' Se ha actualizado automáticamente en tu mapa.';
					var errorcod=' (r35)';
					self.setMessage('Hay un problema'+errorcod,'El punto fue rechazado por el administrador.'+txt,'warning',true);
				}
				else if(result.estado == 'eliminado'){
					var errorcod=' (r36)';
					self.setMessage('Hay un problema'+errorcod,'El punto fue eliminado por otro usuario. Ya no está disponible.','warning',true);
				}
				else if(result.estado == 'sin_permiso_crear'){
					var errorcod=' (r66)';
					self.setMessage('Hay un problema'+errorcod,'No tienes permisos para realizar esta operación','warning',true);
				}
				else{
					var errorcod=' (r37)';
					self.setMessage('Hay un problema'+errorcod,'No se pudo enviar el formulario. Por favor intenta de nuevo','error');
					LOG && console.error('Fail enviarColaboraForm:');
					LOG && console.log(result);
				}
				self.enviandoPOI = false;
			},
			error: function(MLHttpRequest, textStatus, errorThrown){
				// self.unsetBuscando(cartel);
				self.unsetCargando();
				LOG && console.error('Fail enviarColaboraForm: ' + errorThrown);
				var errorcod=' (r38)';
				self.setMessage('Hay un problema'+errorcod,'No se pudo enviar el formulario. Por favor intenta de nuevo','error');

				self.enviandoPOI = false;
			}
		});
	}

	self.initUploadImage = function(){

		var sizeBox = document.getElementById('sizeBox');
		var progress = document.getElementById('progress');

		 uploader = new ss.SimpleUpload({
				button: 'subirImagen', // file upload button
				
				// url: BC_BM_URL+'bicimapa-upload-image.php', // server side handler
				url: baseUrl + '/wp-admin/admin-ajax.php',

				name: 'uploadFile', // upload parameter name		
				progressUrl: BC_BM_URL+'lib/Simple-Ajax-Uploader-master/extras/uploadProgress.php',
				responseType: 'json',
				multiple: false,
				allowedExtensions: ['jpg', 'jpeg', 'png', 'gif'],
				maxSize: 5000, // kilobytes
				hoverClass: 'ui-state-hover',
				focusClass: 'ui-state-focus',
				disabledClass: 'ui-state-disabled',
				onChange:function(filename, extension){
					// $('#nombreArchivo').html(filename);

				},
				onSubmit: function(filename, extension){
					
					this.setData({
						action : 'bcbm_uploadImgPOI',
						prevFilename : self.POIfilename
					});

					$('#thumbNewPOI').html('');

					this.setFileSizeBox(progress); // designate this element as file size container
					this.setProgressBar(progress); // designate as progress bar
				},		 
				onComplete: function(filename, response) {
					if (!response || !response.success) {
						LOG && console.log('Error subiendo la foto');
						LOG && console.log(response);
						var errorcod=' (r39)';
						self.setMessage('Hay un problema'+errorcod,'No se pudo cargar tu foto. Por favor intenta de nuevo.','error');
						return false;
					}
					$('#progress').css('width','0%');
					// self.POIfilename = response.filename;
					self.setImageColaboraForm(response.filename,response.url);

					if(response.gps && !biciMapaOBJ.isSetMarker('newPOI')){
						LOG && console.log(response.gps);
						self.coordTOaddr(response.gps,'newPOI');
					}

				},
				onExtError: function(filename, extension){
					var errorcod=' (r40)';
					self.setMessage('Hay un problema'+errorcod,'El archivo no es una imágen.','error');
					$('#progress').css('width','0%');
				},
				onSizeError:function(filename, fileSize){
					var errorcod=' (r41)';
					self.setMessage('Hay un problema'+errorcod,'Tu imagen es muy pesada. El peso máximo admitido es 5Mb','error');
					$('#progress').css('width','0%');
				},
				onError:function(filename, errorType, response){
					var errorcod=' (r42)';
					self.setMessage('Hay un problema'+errorcod,'No se pudo cargar tu foto. Por favor intenta de nuevo.','error');
					$('#progress').css('width','0%');
				}
		});
	}

	self.setDetalleZona = function(){
		var zZona = self.getZZonaDraw();
		$('#zonaSize').html('Diagonal: '+formatDistance(biciMapaOBJ.getDiagonalZona(zZona))+' | Lado: '+formatDistance(biciMapaOBJ.getLadoZona(zZona)));
	}

	self.getZZonaDraw = function(){
		return parseInt($('#zDrawZonas').val()) || 0;
	}
	self.isDrawMode = function(){
		return $('#drawMode').prop('checked');
	}
	self.isDrawModeDelete = function(){
		return $('#drawModeDelete').prop('checked');
	}
	self.isDrawModeLabel = function(){
		return $('#drawModeLabel').prop('checked');
	}
	self.isDrawModeTransp = function(){
		return $('#drawModeTransp').prop('checked');
	}
	self.updateZoomDisp = function(zoom){
		var txt = 'Zoom actual: '+zoom;
		$('#zoom_actual').html(txt);
	}
	self.updateTotalZonasDisp = function(){
		var txt = 'Total zonas: '+_.size(biciMapaOBJ.getDisplayZonasList());
		$('#total_zonas').html(txt);
	}
	self.getDisplayZonasList = function(){
		var listita = biciMapaOBJ.getDisplayZonasList();
		var html = '';
		html += '<p> Total: '+_.size(listita)+'</p>';
		html += '<p>';
		html += replaceAll(listita.toString(),',',', ');
		html += '</p>';
		self.setBigMessage('Zonas en pantalla',html);
	}
	self.limpiarDisplayZonas = function(){
		biciMapaOBJ.unDisplayZonas();
	}

	self.setDrawZonasMode = function(on_off){
		self.drawZonasMode = on_off;
		biciMapaOBJ.setDrawZonasMode(on_off);
	}
	self.isDrawZonasMode = function(){
		return self.drawZonasMode;
	}

	self.inputDisplayZonas = function(){
		self.confirmMessage('Ingresa el listado de zonas','',true,self.displayZonas,{});
	}

	self.displayZonas = function(params){
		try{
			var zonas = [],x,y,z;
			var zonas_pre = params.mensaje.split(',');
			_.each(zonas_pre,function(zona){
				z = biciMapaOBJ.getZonaZ(zona);
				x = biciMapaOBJ.getZonaX(zona);
				y = biciMapaOBJ.getZonaY(zona);
				zonas.push(biciMapaOBJ.getNombreZona(x,y,z));
			});
			biciMapaOBJ.displayZonas(zonas,true);
		}catch(e){
			var errorcod=' (r67)';
			self.setMessage('Hay un problema'+errorcod,'No has escrito bien el listado','error');
		}

	}
	self.displayZonasCapa = function(){
		var capa_nombre = $('#selectCapaDrawZonas').val();
		// biciMapaOBJ.displayZonasCapa(capa_nombre);
		biciMapaOBJ.displayZonasCapa(capa_nombre,true);
	}
	self.confirmSetZonasCapa = function(){
		var capa_nombre = $('#selectCapaDrawZonas').val();
		
		if(_.size(biciMapaOBJ.getDisplayZonasList())<=0){
			var errorcod=' (r64)';
			self.setMessage('Hay un problema'+errorcod,'No hay zonas en el mapa','error');
			return;
		}
		else self.confirmMessage("Reasignar zonas",'¿Reasignar las zonas para la capa "'+ capasPOI[capa_nombre].plural +'"?',false,self.setZonasCapa,{capa_nombre:capa_nombre});
	}

	self.setZonasCapa = function(args){
		$.ajax({
			type: 'POST',timeout: self.getTimeOut(),
			url: baseUrl + '/wp-admin/admin-ajax.php',
			data: {
				action: 'bcbm_set_zonas_capa',
				capa: args.capa_nombre,
				zonas: biciMapaOBJ.getDisplayZonasList()
			},
			success: function(data, textStatus, XMLHttpRequest){
				if(data=='OK') self.setMessage('','Operación realizada con éxito');
				else{
					LOG && console.error('Fail setZonasCapa: ' + data);
					var errorcod=' (r60)';
					self.setMessage('Hay un problema'+errorcod,'No se pudo finalizar la operación. Inténtalo de nuevo','error');
				}
			},
			error: function(MLHttpRequest, textStatus, errorThrown){
				LOG && console.error('Fail setZonasCapa: ' + errorThrown);
				var errorcod=' (r61)';
				self.setMessage('Hay un problema'+errorcod,'No se pudo finalizar la operación. Inténtalo de nuevo','error');
			}
		});
	}

	self.displayZonasAdmin = function(){
		biciMapaOBJ.displayZonasAdmin(true);
	}
	self.confirmSetZonasAdmin = function(){
		if(_.size(biciMapaOBJ.getDisplayZonasList())<=0){
			var errorcod=' (r65)';
			self.setMessage('Hay un problema'+errorcod,'No hay zonas en el mapa','error');	
		}
		else self.confirmMessage("Reasignar zonas",'¿Reasignar las zonas para la administración"?',false,self.setZonasAdmin);
	}
	self.setZonasAdmin = function(){
		var zonas = biciMapaOBJ.getDisplayZonasList();
		$.ajax({
			type: 'POST',timeout: self.getTimeOut(),
			url: baseUrl + '/wp-admin/admin-ajax.php',
			data: {
				action: 'bcbm_set_zonas_admin',
				zonas: zonas
			},
			success: function(data, textStatus, XMLHttpRequest){
				if(data=='OK'){ 
					zonasAdmin = zonas; //Actualiza las zonas de Administración
					self.setMessage('','Operación realizada con éxito');
				}
				else{
					LOG && console.error('Fail setZonasAdmin: ' + data);
					var errorcod=' (r62)';
					self.setMessage('Hay un problema'+errorcod,'No se pudo finalizar la operación. Inténtalo de nuevo','error');	
				}
			},
			error: function(MLHttpRequest, textStatus, errorThrown){
				LOG && console.error('Fail setZonasAdmin: ' + errorThrown);
				var errorcod=' (r63)';
				self.setMessage('Hay un problema'+errorcod,'No se pudo finalizar la operación. Inténtalo de nuevo','error');
			}
		});
	}


	self.getVcard = function(opt,size){
		if(!size) size = '32';
		var result = '';
		if(user_data.user_url) result += '<a href="'+ user_data.user_url +'" target="_blank">';
			result += opt=='name'? '': '<img src="'+ user_data.user_avatar +'" class="avatar avatar-wordpress-social-login avatar-96 photo" height="'+size+'" width="'+size+'" />';
			result += opt=='pic'? '': '<span class="nombre_vcard">'+user_data.user_name+'</span>';
		if(user_data.user_url) result += '</a>';

		return result;		
	}

	self.getHeadElement = function(nombre,imagen,url_imagen){
		var popupContent ='';
		var img = BC_BM_URL + 'img/poi_bkg.jpg';
		if(imagen){
		img = url_imagen+imagen;
		// var img_thumb = url_imagen +'thumb_' + imagen;
		popupContent += '<a class="fancybox" href="'+img+'" target="_blank" title="'+nombre+'">';
		}
		popupContent += 	'<div style="text-align:center;height:100px;position:relative;background-image:url('+img+');background-position:center center;background-size:100%;">';
		popupContent += 		'<div style="position:absolute;bottom:0px;width:100%;background-color:rgba(0,0,0,0.5)">';
		popupContent += 			'<h2 style="line-height:25px;margin:0;color:white">'+ nombre+'</h2>';
		popupContent += 		'</div>';
		popupContent += 	'</div>';
		if(imagen){
		popupContent += '</a>';
		}

		return popupContent;
	}

/*	self.setCursor = function(UID_box,onoff){
		if(onoff){
			var cursor_url;
			if(UID_box=='newPOI') cursor_url = biciMapaOBJ.getIconUrl('cursor',self.getTipoColabora(),'newPOI');
			else cursor_url = biciMapaOBJ.getIconUrl('cursor',self.getTypeMarker(UID_box));
			$('#map').css('cursor','url('+ cursor_url +'),auto');
		}
		else $('#map').css('cursor','auto');
	}*/

}

//UTIL
function trim(myString){
	return myString.replace(/^\s+/g,'').replace(/\s+$/g,'');
}

function replaceAll(text, busca, reemplaza ){
	var recall = false;
	var clave_aux= 'CLAVEUNICAMOMENTANEADELMOMENTOMOMENTUAL';
	//Evita loop infinito
	if(reemplaza.indexOf(busca) != -1){ 
		recall = true;
		reemplaza = reemplaza.replace(busca,clave_aux);
	}

	while (text.toString().indexOf(busca) != -1)
		text = text.toString().replace(busca,reemplaza);

	if(recall){
		return replaceAll(text,clave_aux,busca);
	}
	else return text;
}

function open_popup(mylink, windowname,width,height){
	newwindow=window.open(mylink,windowname,'width='+width+',height='+height+',scrollbars=no');
	if (window.focus) {newwindow.focus();}
	return false;
}

function get_random_color() {
	var letters = '0123456789ABCDEF'.split('');
	var color = '#';
	for (var i = 0; i < 6; i++ ) {
		color += letters[Math.round(Math.random() * 15)];
	}
	return color;
}

function validateEmail(email,many) {
	var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	if(!many){
		return re.test(email);
	}
	else{
		var result = true;
		_.each(email.split(','),function(uncorreo){
			result = result && (re.test(uncorreo) || uncorreo=='');
		});
		return result;
	}
}

function genUID(){
	var UID;
	while((UID=Math.random().toString(36).substr(2,16)).length<16){
		//itera
		;
	}
	return UID;
}

delay = (function(){
  var timer = 0;
  return function(callback, ms){
	clearTimeout (timer);
	timer = setTimeout(callback, ms);
  };
})();


function htmlentities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function htmlentities_decode(str) {
	return $('<div/>').html(str).text();
}

// function capitalizeWords(str) {
// 	var letters = "\\u0061-\\u007A\\u00AA\\u00B5\\u00BA\\u00DF-\\u00F6\\u00F8-\\u00FF\\u0101\\u0103\\u0105\\u0107\\u0109\\u010B\\u010D\\u010F\\u0111\\u0113\\u0115\\u0117\\u0119\\u011B\\u011D\\u011F\\u0121\\u0123\\u0125\\u0127\\u0129\\u012B\\u012D\\u012F\\u0131\\u0133\\u0135\\u0137\\u0138\\u013A\\u013C\\u013E\\u0140\\u0142\\u0144\\u0146\\u0148\\u0149\\u014B\\u014D\\u014F\\u0151\\u0153\\u0155\\u0157\\u0159\\u015B\\u015D\\u015F\\u0161\\u0163\\u0165\\u0167\\u0169\\u016B\\u016D\\u016F\\u0171\\u0173\\u0175\\u0177\\u017A\\u017C\\u017E-\\u0180\\u0183\\u0185\\u0188\\u018C\\u018D\\u0192\\u0195\\u0199-\\u019B\\u019E\\u01A1\\u01A3\\u01A5\\u01A8\\u01AA\\u01AB\\u01AD\\u01B0\\u01B4\\u01B6\\u01B9\\u01BA\\u01BD-\\u01BF\\u01C6\\u01C9\\u01CC\\u01CE\\u01D0\\u01D2\\u01D4\\u01D6\\u01D8\\u01DA\\u01DC\\u01DD\\u01DF\\u01E1\\u01E3\\u01E5\\u01E7\\u01E9\\u01EB\\u01ED\\u01EF\\u01F0\\u01F3\\u01F5\\u01F9\\u01FB\\u01FD\\u01FF\\u0201\\u0203\\u0205\\u0207\\u0209\\u020B\\u020D\\u020F\\u0211\\u0213\\u0215\\u0217\\u0219\\u021B\\u021D\\u021F\\u0221\\u0223\\u0225\\u0227\\u0229\\u022B\\u022D\\u022F\\u0231\\u0233-\\u0239\\u023C\\u023F\\u0240\\u0242\\u0247\\u0249\\u024B\\u024D\\u024F-\\u0293\\u0295-\\u02AF\\u0371\\u0373\\u0377\\u037B-\\u037D\\u0390\\u03AC-\\u03CE\\u03D0\\u03D1\\u03D5-\\u03D7\\u03D9\\u03DB\\u03DD\\u03DF\\u03E1\\u03E3\\u03E5\\u03E7\\u03E9\\u03EB\\u03ED\\u03EF-\\u03F3\\u03F5\\u03F8\\u03FB\\u03FC\\u0430-\\u045F\\u0461\\u0463\\u0465\\u0467\\u0469\\u046B\\u046D\\u046F\\u0471\\u0473\\u0475\\u0477\\u0479\\u047B\\u047D\\u047F\\u0481\\u048B\\u048D\\u048F\\u0491\\u0493\\u0495\\u0497\\u0499\\u049B\\u049D\\u049F\\u04A1\\u04A3\\u04A5\\u04A7\\u04A9\\u04AB\\u04AD\\u04AF\\u04B1\\u04B3\\u04B5\\u04B7\\u04B9\\u04BB\\u04BD\\u04BF\\u04C2\\u04C4\\u04C6\\u04C8\\u04CA\\u04CC\\u04CE\\u04CF\\u04D1\\u04D3\\u04D5\\u04D7\\u04D9\\u04DB\\u04DD\\u04DF\\u04E1\\u04E3\\u04E5\\u04E7\\u04E9\\u04EB\\u04ED\\u04EF\\u04F1\\u04F3\\u04F5\\u04F7\\u04F9\\u04FB\\u04FD\\u04FF\\u0501\\u0503\\u0505\\u0507\\u0509\\u050B\\u050D\\u050F\\u0511\\u0513\\u0515\\u0517\\u0519\\u051B\\u051D\\u051F\\u0521\\u0523\\u0525\\u0561-\\u0587\\u1D00-\\u1D2B\\u1D62-\\u1D77\\u1D79-\\u1D9A\\u1E01\\u1E03\\u1E05\\u1E07\\u1E09\\u1E0B\\u1E0D\\u1E0F\\u1E11\\u1E13\\u1E15\\u1E17\\u1E19\\u1E1B\\u1E1D\\u1E1F\\u1E21\\u1E23\\u1E25\\u1E27\\u1E29\\u1E2B\\u1E2D\\u1E2F\\u1E31\\u1E33\\u1E35\\u1E37\\u1E39\\u1E3B\\u1E3D\\u1E3F\\u1E41\\u1E43\\u1E45\\u1E47\\u1E49\\u1E4B\\u1E4D\\u1E4F\\u1E51\\u1E53\\u1E55\\u1E57\\u1E59\\u1E5B\\u1E5D\\u1E5F\\u1E61\\u1E63\\u1E65\\u1E67\\u1E69\\u1E6B\\u1E6D\\u1E6F\\u1E71\\u1E73\\u1E75\\u1E77\\u1E79\\u1E7B\\u1E7D\\u1E7F\\u1E81\\u1E83\\u1E85\\u1E87\\u1E89\\u1E8B\\u1E8D\\u1E8F\\u1E91\\u1E93\\u1E95-\\u1E9D\\u1E9F\\u1EA1\\u1EA3\\u1EA5\\u1EA7\\u1EA9\\u1EAB\\u1EAD\\u1EAF\\u1EB1\\u1EB3\\u1EB5\\u1EB7\\u1EB9\\u1EBB\\u1EBD\\u1EBF\\u1EC1\\u1EC3\\u1EC5\\u1EC7\\u1EC9\\u1ECB\\u1ECD\\u1ECF\\u1ED1\\u1ED3\\u1ED5\\u1ED7\\u1ED9\\u1EDB\\u1EDD\\u1EDF\\u1EE1\\u1EE3\\u1EE5\\u1EE7\\u1EE9\\u1EEB\\u1EED\\u1EEF\\u1EF1\\u1EF3\\u1EF5\\u1EF7\\u1EF9\\u1EFB\\u1EFD\\u1EFF-\\u1F07\\u1F10-\\u1F15\\u1F20-\\u1F27\\u1F30-\\u1F37\\u1F40-\\u1F45\\u1F50-\\u1F57\\u1F60-\\u1F67\\u1F70-\\u1F7D\\u1F80-\\u1F87\\u1F90-\\u1F97\\u1FA0-\\u1FA7\\u1FB0-\\u1FB4\\u1FB6\\u1FB7\\u1FBE\\u1FC2-\\u1FC4\\u1FC6\\u1FC7\\u1FD0-\\u1FD3\\u1FD6\\u1FD7\\u1FE0-\\u1FE7\\u1FF2-\\u1FF4\\u1FF6\\u1FF7\\u210A\\u210E\\u210F\\u2113\\u212F\\u2134\\u2139\\u213C\\u213D\\u2146-\\u2149\\u214E\\u2184\\u2C30-\\u2C5E\\u2C61\\u2C65\\u2C66\\u2C68\\u2C6A\\u2C6C\\u2C71\\u2C73\\u2C74\\u2C76-\\u2C7C\\u2C81\\u2C83\\u2C85\\u2C87\\u2C89\\u2C8B\\u2C8D\\u2C8F\\u2C91\\u2C93\\u2C95\\u2C97\\u2C99\\u2C9B\\u2C9D\\u2C9F\\u2CA1\\u2CA3\\u2CA5\\u2CA7\\u2CA9\\u2CAB\\u2CAD\\u2CAF\\u2CB1\\u2CB3\\u2CB5\\u2CB7\\u2CB9\\u2CBB\\u2CBD\\u2CBF\\u2CC1\\u2CC3\\u2CC5\\u2CC7\\u2CC9\\u2CCB\\u2CCD\\u2CCF\\u2CD1\\u2CD3\\u2CD5\\u2CD7\\u2CD9\\u2CDB\\u2CDD\\u2CDF\\u2CE1\\u2CE3\\u2CE4\\u2CEC\\u2CEE\\u2D00-\\u2D25\\uA641\\uA643\\uA645\\uA647\\uA649\\uA64B\\uA64D\\uA64F\\uA651\\uA653\\uA655\\uA657\\uA659\\uA65B\\uA65D\\uA65F\\uA663\\uA665\\uA667\\uA669\\uA66B\\uA66D\\uA681\\uA683\\uA685\\uA687\\uA689\\uA68B\\uA68D\\uA68F\\uA691\\uA693\\uA695\\uA697\\uA723\\uA725\\uA727\\uA729\\uA72B\\uA72D\\uA72F-\\uA731\\uA733\\uA735\\uA737\\uA739\\uA73B\\uA73D\\uA73F\\uA741\\uA743\\uA745\\uA747\\uA749\\uA74B\\uA74D\\uA74F\\uA751\\uA753\\uA755\\uA757\\uA759\\uA75B\\uA75D\\uA75F\\uA761\\uA763\\uA765\\uA767\\uA769\\uA76B\\uA76D\\uA76F\\uA771-\\uA778\\uA77A\\uA77C\\uA77F\\uA781\\uA783\\uA785\\uA787\\uA78C\\uFB00-\\uFB06\\uFB13-\\uFB17\\uFF41-\\uFF5A\\u0041-\\u005A\\u00C0-\\u00D6\\u00D8-\\u00DE\\u0100\\u0102\\u0104\\u0106\\u0108\\u010A\\u010C\\u010E\\u0110\\u0112\\u0114\\u0116\\u0118\\u011A\\u011C\\u011E\\u0120\\u0122\\u0124\\u0126\\u0128\\u012A\\u012C\\u012E\\u0130\\u0132\\u0134\\u0136\\u0139\\u013B\\u013D\\u013F\\u0141\\u0143\\u0145\\u0147\\u014A\\u014C\\u014E\\u0150\\u0152\\u0154\\u0156\\u0158\\u015A\\u015C\\u015E\\u0160\\u0162\\u0164\\u0166\\u0168\\u016A\\u016C\\u016E\\u0170\\u0172\\u0174\\u0176\\u0178\\u0179\\u017B\\u017D\\u0181\\u0182\\u0184\\u0186\\u0187\\u0189-\\u018B\\u018E-\\u0191\\u0193\\u0194\\u0196-\\u0198\\u019C\\u019D\\u019F\\u01A0\\u01A2\\u01A4\\u01A6\\u01A7\\u01A9\\u01AC\\u01AE\\u01AF\\u01B1-\\u01B3\\u01B5\\u01B7\\u01B8\\u01BC\\u01C4\\u01C7\\u01CA\\u01CD\\u01CF\\u01D1\\u01D3\\u01D5\\u01D7\\u01D9\\u01DB\\u01DE\\u01E0\\u01E2\\u01E4\\u01E6\\u01E8\\u01EA\\u01EC\\u01EE\\u01F1\\u01F4\\u01F6-\\u01F8\\u01FA\\u01FC\\u01FE\\u0200\\u0202\\u0204\\u0206\\u0208\\u020A\\u020C\\u020E\\u0210\\u0212\\u0214\\u0216\\u0218\\u021A\\u021C\\u021E\\u0220\\u0222\\u0224\\u0226\\u0228\\u022A\\u022C\\u022E\\u0230\\u0232\\u023A\\u023B\\u023D\\u023E\\u0241\\u0243-\\u0246\\u0248\\u024A\\u024C\\u024E\\u0370\\u0372\\u0376\\u0386\\u0388-\\u038A\\u038C\\u038E\\u038F\\u0391-\\u03A1\\u03A3-\\u03AB\\u03CF\\u03D2-\\u03D4\\u03D8\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2\\u03E4\\u03E6\\u03E8\\u03EA\\u03EC\\u03EE\\u03F4\\u03F7\\u03F9\\u03FA\\u03FD-\\u042F\\u0460\\u0462\\u0464\\u0466\\u0468\\u046A\\u046C\\u046E\\u0470\\u0472\\u0474\\u0476\\u0478\\u047A\\u047C\\u047E\\u0480\\u048A\\u048C\\u048E\\u0490\\u0492\\u0494\\u0496\\u0498\\u049A\\u049C\\u049E\\u04A0\\u04A2\\u04A4\\u04A6\\u04A8\\u04AA\\u04AC\\u04AE\\u04B0\\u04B2\\u04B4\\u04B6\\u04B8\\u04BA\\u04BC\\u04BE\\u04C0\\u04C1\\u04C3\\u04C5\\u04C7\\u04C9\\u04CB\\u04CD\\u04D0\\u04D2\\u04D4\\u04D6\\u04D8\\u04DA\\u04DC\\u04DE\\u04E0\\u04E2\\u04E4\\u04E6\\u04E8\\u04EA\\u04EC\\u04EE\\u04F0\\u04F2\\u04F4\\u04F6\\u04F8\\u04FA\\u04FC\\u04FE\\u0500\\u0502\\u0504\\u0506\\u0508\\u050A\\u050C\\u050E\\u0510\\u0512\\u0514\\u0516\\u0518\\u051A\\u051C\\u051E\\u0520\\u0522\\u0524\\u0531-\\u0556\\u10A0-\\u10C5\\u1E00\\u1E02\\u1E04\\u1E06\\u1E08\\u1E0A\\u1E0C\\u1E0E\\u1E10\\u1E12\\u1E14\\u1E16\\u1E18\\u1E1A\\u1E1C\\u1E1E\\u1E20\\u1E22\\u1E24\\u1E26\\u1E28\\u1E2A\\u1E2C\\u1E2E\\u1E30\\u1E32\\u1E34\\u1E36\\u1E38\\u1E3A\\u1E3C\\u1E3E\\u1E40\\u1E42\\u1E44\\u1E46\\u1E48\\u1E4A\\u1E4C\\u1E4E\\u1E50\\u1E52\\u1E54\\u1E56\\u1E58\\u1E5A\\u1E5C\\u1E5E\\u1E60\\u1E62\\u1E64\\u1E66\\u1E68\\u1E6A\\u1E6C\\u1E6E\\u1E70\\u1E72\\u1E74\\u1E76\\u1E78\\u1E7A\\u1E7C\\u1E7E\\u1E80\\u1E82\\u1E84\\u1E86\\u1E88\\u1E8A\\u1E8C\\u1E8E\\u1E90\\u1E92\\u1E94\\u1E9E\\u1EA0\\u1EA2\\u1EA4\\u1EA6\\u1EA8\\u1EAA\\u1EAC\\u1EAE\\u1EB0\\u1EB2\\u1EB4\\u1EB6\\u1EB8\\u1EBA\\u1EBC\\u1EBE\\u1EC0\\u1EC2\\u1EC4\\u1EC6\\u1EC8\\u1ECA\\u1ECC\\u1ECE\\u1ED0\\u1ED2\\u1ED4\\u1ED6\\u1ED8\\u1EDA\\u1EDC\\u1EDE\\u1EE0\\u1EE2\\u1EE4\\u1EE6\\u1EE8\\u1EEA\\u1EEC\\u1EEE\\u1EF0\\u1EF2\\u1EF4\\u1EF6\\u1EF8\\u1EFA\\u1EFC\\u1EFE\\u1F08-\\u1F0F\\u1F18-\\u1F1D\\u1F28-\\u1F2F\\u1F38-\\u1F3F\\u1F48-\\u1F4D\\u1F59\\u1F5B\\u1F5D\\u1F5F\\u1F68-\\u1F6F\\u1FB8-\\u1FBB\\u1FC8-\\u1FCB\\u1FD8-\\u1FDB\\u1FE8-\\u1FEC\\u1FF8-\\u1FFB\\u2102\\u2107\\u210B-\\u210D\\u2110-\\u2112\\u2115\\u2119-\\u211D\\u2124\\u2126\\u2128\\u212A-\\u212D\\u2130-\\u2133\\u213E\\u213F\\u2145\\u2183\\u2C00-\\u2C2E\\u2C60\\u2C62-\\u2C64\\u2C67\\u2C69\\u2C6B\\u2C6D-\\u2C70\\u2C72\\u2C75\\u2C7E-\\u2C80\\u2C82\\u2C84\\u2C86\\u2C88\\u2C8A\\u2C8C\\u2C8E\\u2C90\\u2C92\\u2C94\\u2C96\\u2C98\\u2C9A\\u2C9C\\u2C9E\\u2CA0\\u2CA2\\u2CA4\\u2CA6\\u2CA8\\u2CAA\\u2CAC\\u2CAE\\u2CB0\\u2CB2\\u2CB4\\u2CB6\\u2CB8\\u2CBA\\u2CBC\\u2CBE\\u2CC0\\u2CC2\\u2CC4\\u2CC6\\u2CC8\\u2CCA\\u2CCC\\u2CCE\\u2CD0\\u2CD2\\u2CD4\\u2CD6\\u2CD8\\u2CDA\\u2CDC\\u2CDE\\u2CE0\\u2CE2\\u2CEB\\u2CED\\uA640\\uA642\\uA644\\uA646\\uA648\\uA64A\\uA64C\\uA64E\\uA650\\uA652\\uA654\\uA656\\uA658\\uA65A\\uA65C\\uA65E\\uA662\\uA664\\uA666\\uA668\\uA66A\\uA66C\\uA680\\uA682\\uA684\\uA686\\uA688\\uA68A\\uA68C\\uA68E\\uA690\\uA692\\uA694\\uA696\\uA722\\uA724\\uA726\\uA728\\uA72A\\uA72C\\uA72E\\uA732\\uA734\\uA736\\uA738\\uA73A\\uA73C\\uA73E\\uA740\\uA742\\uA744\\uA746\\uA748\\uA74A\\uA74C\\uA74E\\uA750\\uA752\\uA754\\uA756\\uA758\\uA75A\\uA75C\\uA75E\\uA760\\uA762\\uA764\\uA766\\uA768\\uA76A\\uA76C\\uA76E\\uA779\\uA77B\\uA77D\\uA77E\\uA780\\uA782\\uA784\\uA786\\uA78B\\uFF21-\\uFF3A\\u01C5\\u01C8\\u01CB\\u01F2\\u1F88-\\u1F8F\\u1F98-\\u1F9F\\u1FA8-\\u1FAF\\u1FBC\\u1FCC\\u1FFC\\u02B0-\\u02C1\\u02C6-\\u02D1\\u02E0-\\u02E4\\u02EC\\u02EE\\u0374\\u037A\\u0559\\u0640\\u06E5\\u06E6\\u07F4\\u07F5\\u07FA\\u081A\\u0824\\u0828\\u0971\\u0E46\\u0EC6\\u10FC\\u17D7\\u1843\\u1AA7\\u1C78-\\u1C7D\\u1D2C-\\u1D61\\u1D78\\u1D9B-\\u1DBF\\u2071\\u207F\\u2090-\\u2094\\u2C7D\\u2D6F\\u2E2F\\u3005\\u3031-\\u3035\\u303B\\u309D\\u309E\\u30FC-\\u30FE\\uA015\\uA4F8-\\uA4FD\\uA60C\\uA67F\\uA717-\\uA71F\\uA770\\uA788\\uA9CF\\uAA70\\uAADD\\uFF70\\uFF9E\\uFF9F\\u01BB\\u01C0-\\u01C3\\u0294\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063F\\u0641-\\u064A\\u066E\\u066F\\u0671-\\u06D3\\u06D5\\u06EE\\u06EF\\u06FA-\\u06FC\\u06FF\\u0710\\u0712-\\u072F\\u074D-\\u07A5\\u07B1\\u07CA-\\u07EA\\u0800-\\u0815\\u0904-\\u0939\\u093D\\u0950\\u0958-\\u0961\\u0972\\u0979-\\u097F\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BD\\u09CE\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AD0\\u0AE0\\u0AE1\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B35-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B71\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB9\\u0BD0\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C3D\\u0C58\\u0C59\\u0C60\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBD\\u0CDE\\u0CE0\\u0CE1\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D3D\\u0D60\\u0D61\\u0D7A-\\u0D7F\\u0D85-\\u0D96\\u0D9A-\\u0DB1\\u0DB3-\\u0DBB\\u0DBD\\u0DC0-\\u0DC6\\u0E01-\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E45\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD-\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0EDC\\u0EDD\\u0F00\\u0F40-\\u0F47\\u0F49-\\u0F6C\\u0F88-\\u0F8B\\u1000-\\u102A\\u103F\\u1050-\\u1055\\u105A-\\u105D\\u1061\\u1065\\u1066\\u106E-\\u1070\\u1075-\\u1081\\u108E\\u10D0-\\u10FA\\u1100-\\u1248\\u124A-\\u124D\\u1250-\\u1256\\u1258\\u125A-\\u125D\\u1260-\\u1288\\u128A-\\u128D\\u1290-\\u12B0\\u12B2-\\u12B5\\u12B8-\\u12BE\\u12C0\\u12C2-\\u12C5\\u12C8-\\u12D6\\u12D8-\\u1310\\u1312-\\u1315\\u1318-\\u135A\\u1380-\\u138F\\u13A0-\\u13F4\\u1401-\\u166C\\u166F-\\u167F\\u1681-\\u169A\\u16A0-\\u16EA\\u1700-\\u170C\\u170E-\\u1711\\u1720-\\u1731\\u1740-\\u1751\\u1760-\\u176C\\u176E-\\u1770\\u1780-\\u17B3\\u17DC\\u1820-\\u1842\\u1844-\\u1877\\u1880-\\u18A8\\u18AA\\u18B0-\\u18F5\\u1900-\\u191C\\u1950-\\u196D\\u1970-\\u1974\\u1980-\\u19AB\\u19C1-\\u19C7\\u1A00-\\u1A16\\u1A20-\\u1A54\\u1B05-\\u1B33\\u1B45-\\u1B4B\\u1B83-\\u1BA0\\u1BAE\\u1BAF\\u1C00-\\u1C23\\u1C4D-\\u1C4F\\u1C5A-\\u1C77\\u1CE9-\\u1CEC\\u1CEE-\\u1CF1\\u2135-\\u2138\\u2D30-\\u2D65\\u2D80-\\u2D96\\u2DA0-\\u2DA6\\u2DA8-\\u2DAE\\u2DB0-\\u2DB6\\u2DB8-\\u2DBE\\u2DC0-\\u2DC6\\u2DC8-\\u2DCE\\u2DD0-\\u2DD6\\u2DD8-\\u2DDE\\u3006\\u303C\\u3041-\\u3096\\u309F\\u30A1-\\u30FA\\u30FF\\u3105-\\u312D\\u3131-\\u318E\\u31A0-\\u31B7\\u31F0-\\u31FF\\u3400-\\u4DB5\\u4E00-\\u9FCB\\uA000-\\uA014\\uA016-\\uA48C\\uA4D0-\\uA4F7\\uA500-\\uA60B\\uA610-\\uA61F\\uA62A\\uA62B\\uA66E\\uA6A0-\\uA6E5\\uA7FB-\\uA801\\uA803-\\uA805\\uA807-\\uA80A\\uA80C-\\uA822\\uA840-\\uA873\\uA882-\\uA8B3\\uA8F2-\\uA8F7\\uA8FB\\uA90A-\\uA925\\uA930-\\uA946\\uA960-\\uA97C\\uA984-\\uA9B2\\uAA00-\\uAA28\\uAA40-\\uAA42\\uAA44-\\uAA4B\\uAA60-\\uAA6F\\uAA71-\\uAA76\\uAA7A\\uAA80-\\uAAAF\\uAAB1\\uAAB5\\uAAB6\\uAAB9-\\uAABD\\uAAC0\\uAAC2\\uAADB\\uAADC\\uABC0-\\uABE2\\uAC00-\\uD7A3\\uD7B0-\\uD7C6\\uD7CB-\\uD7FB\\uF900-\\uFA2D\\uFA30-\\uFA6D\\uFA70-\\uFAD9\\uFB1D\\uFB1F-\\uFB28\\uFB2A-\\uFB36\\uFB38-\\uFB3C\\uFB3E\\uFB40\\uFB41\\uFB43\\uFB44\\uFB46-\\uFBB1\\uFBD3-\\uFD3D\\uFD50-\\uFD8F\\uFD92-\\uFDC7\\uFDF0-\\uFDFB\\uFE70-\\uFE74\\uFE76-\\uFEFC\\uFF66-\\uFF6F\\uFF71-\\uFF9D\\uFFA0-\\uFFBE\\uFFC2-\\uFFC7\\uFFCA-\\uFFCF\\uFFD2-\\uFFD7\\uFFDA-\\uFFDC";
// 	var regex = new RegExp("(^|[^" + letters + "])([" + letters + "])", "g");
//     return str.replace(regex, function(s, m1, m2){
//         return m1 + m2.toUpperCase();
//     });
// }
function toTitleCase(str){ return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});}

function is_user_logged_in(){
	return user_data.user_rol!='invitado';
}

function formatDistance(num){
	if (num >= 1000) return (num/1000).toFixed(1) + ' km';
	else return num.toFixed(1) + ' m';
}