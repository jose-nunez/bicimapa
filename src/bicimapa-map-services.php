<?php

require_once('bicimapa-query-db.php');
require_once('lib/spherical-geometry.class.php');

class BicimapaMapServices{

	private $zonasAdmin;
	private $capasPOI;

	function BicimapaMapServices(){
		$this->zonasAdmin = $this->getZonasAdmin();
		$this->capasPOI = $this->getCapas();
	}	

	function now(){
		 $queryDB = new BicimapaQueryDB();
		return $queryDB->now();
	}

	function getIPLocation(){
		$url = "http://freegeoip.net/json/".$_SERVER['REMOTE_ADDR'];
		$json = file_get_contents($url);
		$content = json_decode($json, true);
		if($content['latitude'] && $content['longitude'])
			return array('lat'=>$content['latitude'],'lng'=>$content['longitude']);
		else
			return null;
	}

	function getHistoryRoutes(){
		$queryDB = new BicimapaQueryDB();
		if(is_user_logged_in() && $rutas=$queryDB->getHistoryRoutes(get_current_user_id())){
			return $rutas;
		}
		else return new stdClass();
	}

	function getCenterRoute($UID_params,$es_uid){
		$queryDB = new BicimapaQueryDB();
		$ruta_sql = $queryDB->getRouteBounds($UID_params,$es_uid);
		if($ruta_sql)
			return array(
				'lat'=> ($ruta_sql['s_coord_lat'] + $ruta_sql['e_coord_lat'])/2,
				'lng'=> ($ruta_sql['s_coord_lng'] + $ruta_sql['e_coord_lng'])/2
			);
		else return null;
	}

	function getRoute(){
		if($_POST["UID"]){
			$rutilla = $this->loadRoute($_POST["UID"],true);
			$rutilla['fuente']='cache';
			die(json_encode($rutilla));
		}
		else{
			$ruta_params= array(
				'tipo_ruta' => 		$_POST["tipo_ruta"],
				's_address' => 		$_POST["s_address"],
				'e_address' => 		$_POST["e_address"],
				's_coord_lat' => 	$_POST["s_coord_lat"],
				's_coord_lng' => 	$_POST["s_coord_lng"],
				'e_coord_lat' => 	$_POST["e_coord_lat"],
				'e_coord_lng' => 	$_POST["e_coord_lng"],
				'extra_param_1' => 	$_POST["extra_param_1"],
				's_ispoi' =>		$_POST['s_ispoi'],
				'e_ispoi' => 		$_POST['e_ispoi']
			);

			$rutilla = $this->loadRoute($ruta_params);
			if($rutilla['estado']=='OK'){
				$rutilla['fuente']='cache';
				die(json_encode($rutilla));
			}
			else{ 
				if($ruta_params['tipo_ruta']=='RTC')
					$rutilla = $this->generateRoute_RTC($ruta_params);
				else
					$rutilla = $this->generateRoute_MQ($ruta_params);
				
				$rutilla['fuente']='service';
				die(json_encode($rutilla));
			}
		}

	}

	function loadRoute($UID_params,$es_uid=false){
	/* 
	Como el motor de enrutamiento NO es nuestro y no manejamos los cambios, siempre enviará para los mismos parámetros
	la misma ruta.
	*/

		$queryDB = new BicimapaQueryDB();

		
		$ruta_sql = $queryDB->getRoute($UID_params,$es_uid);

		if(!$ruta_sql) return array('estado'=>'ERROR','ruta'=>null);
		
		$ruta = array();

		if($es_uid){
			$ruta_params = array(
				'tipo_ruta' => $ruta_sql['tipo_ruta'],
				's_address'=>$ruta_sql['s_address'],
				'e_address'=>$ruta_sql['e_address'],
				's_coord'=>array('lat'=>$ruta_sql['s_coord_lat'],'lng'=>$ruta_sql['s_coord_lng']),
				'e_coord'=>array('lat'=>$ruta_sql['e_coord_lat'],'lng'=>$ruta_sql['e_coord_lng']),
				's_ispoi'=>$ruta_sql['s_ispoi'],
				'e_ispoi'=>$ruta_sql['e_ispoi'],
				'extra_param_1'=>$ruta_sql['extra_param_1'],
			);
			$ruta['params'] = $ruta_params;
		}
		else{
			$ruta['UID'] = $ruta_sql['UID'];	
		}
		
		$ruta['id']=$ruta_sql['ruta_id'];

		$ruta['vector'] = json_decode($ruta_sql['features_json']);
		$ruta['extras'] = json_decode($ruta_sql['extras_json']);

		// die(json_encode(array('estado'=>'ERROR','ruta'=>$ruta_sql)));
		$queryDB->addHistoryRuta($ruta['id'],get_current_user_id());

		return array('estado'=>'OK','ruta'=>$ruta);
	}

	// http://open.mapquestapi.com/directions/v2/route?key=Fmjtd%7Cluub2hu7nd%2C2l%3Do5-9uzglw&from=-36.888345699999995,174.7016382&to=-36.87934598129044,174.74475860595703&doReverseGeocode=false
	function generateRoute_MQ($route_params){
		$url= "";
		$url.= "http://open.mapquestapi.com/directions/v2/route?key=Fmjtd%7Cluub2hu7nd%2C2l%3Do5-9uzglw";
		$url.= "&doReverseGeocode=false";
		$url.= "&manMaps=false";
		$url.= "&unit=k";
		$url.= "&locale=es_ES";
		$url.= "&fullShape=true";
		$url.= "&generalize=0";

		$url.= "&stateBoundaryDisplay=false";
		$url.= "&countryBoundaryDisplay=false";
		$url.= "&destinationManeuverDisplay=false";

		$url.= "&avoids=Limited%20Access"; // Limited Access|Toll Road|Ferry|Unpaved|Seasonal Closure|Country Crossing
		$url.= "&roadGradeStrategy=AVOID_UP_HILL"; //AVOID_UP_HILL|AVOID_DOWN_HILL|AVOID_ALL_HILLS|FAVOR_UP_HILL|FAVOR_DOWN_HILL|FAVOR_ALL_HILLS
		$url.= "&cyclingRoadFactor=1.0"; // 0.1 <= x <= 100.0

		$url.= "&from=" . $route_params["s_coord_lat"] . "," . $route_params["s_coord_lng"]; 
		$url.= "&to=" . $route_params["e_coord_lat"] . "," . $route_params["e_coord_lng"];
		$url.= "&routeType=".$route_params["extra_param_1"]; //fastest|shortest|pedestrian|multimodal|bicycle

		$json = file_get_contents($url);
		$content = json_decode($json, true);

		if($content['info']['statuscode']!='0') return array('estado'=>'ERROR','ruta'=>null);
		// return array('estado'=>'ERROR','ruta'=>null,'resp'=>$content);
		
		$ruta = $this->decodeRoute_MQ($content,array('lat'=>$route_params["e_coord_lat"],'lng'=>$route_params["e_coord_lng"]));
		// return array('estado'=>'ERROR','ruta'=>null,'resp'=>$ruta);
		
		$UID_id = $this->saveRoute($route_params,$ruta['vector'],$ruta['extras']);
		$ruta['UID'] = $UID_id['UID'];
		$ruta['id'] = $UID_id['id'];
		
		return array('estado'=>'OK','ruta'=>$ruta);
	}
	
	function decodeRoute_MQ($content,$e_coord){
		$result = array();
		// $result['extras']['elevacion'] = $content['gain'];
		$result['extras']['distancia'] = $content['route']['distance']*1000;
		$result['extras']['tiempo'] = formatear_tiempo($content['route']['distance']/20,'horas'); // Considerando velocidad prom. de 20km/h
		$result['vector'] = $this->setRouteFeatures_MQ($content['route']['shape']['shapePoints']);
		$result['extras']['instrucciones'] = $this->setRouteInstructions_MQ($content['route']['legs']);

		return $result;
	}

	function setRouteFeatures_MQ($shapePoints){
		$vector = array();
		$vector['type'] = 'FeatureCollection';
		$vector['features'] = array();

		$feature = array();
		$feature['type'] = 'Feature';$feature['properties'] = array();$feature['geometry'] = array();
		$feature['geometry']['type'] = 'LineString';$feature['geometry']['coordinates'] = array();
		for($i=0;$i<count($shapePoints)-1;$i=$i+2){
			array_push($feature['geometry']['coordinates'],array($shapePoints[$i+1],$shapePoints[$i]));
		}
		array_push($vector['features'],$feature);
		return $vector;
	}

	function setRouteInstructions_MQ($legs,$e_coord){
		$instrucciones = array();
		foreach ($legs as $key => $leg) {
			foreach ($leg['maneuvers'] as $key_man => $maneuver) {
				array_push($instrucciones,array('narrative'=>$maneuver['narrative'],'point'=>$maneuver['startPoint'],'distance'=>$maneuver['distance']*1000));
			}
		}
		return $instrucciones;
	}


	// http://es.ridethecity.com/rtc.php?action=bestroute&region=chile&start=-70.60872520000001%20-33.424743&end=-70.6224364%20-33.4491881&v=2&user=&route=SAFER&format=json
	function generateRoute_RTC($route_params){

		$url= "";
		$url.= "http://es.ridethecity.com/rtc.php?";
		$url.= "action=bestroute";
		$url.= "&region=chile";
		$url.= "&start=" . $route_params["s_coord_lng"] . "%20" . $route_params["s_coord_lat"]; 
		$url.= "&end=" . $route_params["e_coord_lng"] . "%20" . $route_params["e_coord_lat"];
		$url.= "&v=2";
		$url.= "&user=";
		$url.= "&route=" . $route_params["extra_param_1"];
		$url.= "&format=json";

		$json = file_get_contents($url);
		$content = json_decode($json, true);

		if($content["status_message"]!="OK") return array('estado'=>'ERROR','ruta'=>null);
		
		$ruta = $this->decodeRoute_RTC($content);
		
		$UID_id = $this->saveRoute($route_params,$ruta['vector'],$ruta['extras']);
		$ruta['UID'] = $UID_id['UID'];
		$ruta['id'] = $UID_id['id'];

		return array('estado'=>'OK','ruta'=>$ruta);
	}

	function decodeRoute_RTC($content){
		$result = array();
		$result['vector'] = $this->setRouteFeatures_RTC($content['route_geometry']);
		$result['extras']['instrucciones'] = $content['route_instructions'];
		$result['extras']['elevacion'] = $content['gain'];
		$result['extras']['distancia'] = $content['total_distance'];
		$result['extras']['tiempo_min'] = $content['low_time'];
		$result['extras']['tiempo_max'] = $content['hi_time'];
		return $result;
	}

	function setRouteFeatures_RTC($route_geometry){

		$result = array();
		$result['type'] = 'FeatureCollection';
		$result['features'] = array();

		foreach($route_geometry as $key => $geom){
			$feature = array();
			$feature['type'] = 'Feature';
			$feature['properties'] = array();
			$feature['geometry'] = array();
			$feature['geometry']['type'] = 'LineString';
			$feature['geometry']['coordinates'] = array();

			$points = explode(",",$geom['geom'][0]);
			foreach($points as $key_point => $point_str){
				$point = explode(" ",$point_str);
				$_0 = floatval($point[0]);
				$_1 = floatval($point[1]);
				array_push($feature['geometry']['coordinates'],array($_0,$_1));
			}

			array_push($result['features'],$feature);
		}
		return $result;
	}


	function saveRoute($route_params,$features,$extras){
		$ruta = array();
		$ruta['UID'] = genUID();
		$ruta['editor'] = get_current_user_id();
		$ruta['params'] = $route_params;
		$ruta['features_json'] = json_encode($features);
		$ruta['extras_json'] = json_encode($extras);

		$queryDB = new BicimapaQueryDB();
		
		$ruta_id = $queryDB->newRoute($ruta);
		if($ruta_id){
			$queryDB->addHistoryRuta($ruta_id,get_current_user_id());
		 	return array('UID'=>$ruta['UID'],'id'=>$ruta_id);
		}
		else return -1;

	}

	function addHistoryRuta(){
		$queryDB = new BicimapaQueryDB();
		$ruta_id = $_POST['ruta_id'];
		if($queryDB->addHistoryRuta($ruta_id,get_current_user_id())) die('OK');
		else die('ERROR');
	}

// POI___________________________________________________________________________________________________________________________
	function getCapas($fecha_cache='1900-01-01'){
		$queryDB = new BicimapaQueryDB();
		$capasPOI = $queryDB->getCapas($fecha_cache);
		foreach ($capasPOI as $key => $capa) {
			$capasPOI[$key]['puede_crear'] = $this->puede_crearPOI($capa);
		}
		return $capasPOI;
	}

	function getCapasCache(){
		$fecha_cache = $_POST['fecha_cache'];
		$result = array(
			'fecha'=>$this->now(),
			'capas'=> $this->getCapas($fecha_cache)
		);
		
		die(json_encode($result));
	}

	function getPOI(){
		$UID = $_POST['UID'];
		$tiny = $_POST['tiny'];

		if($tiny) $result = $this->loadPOITiny($UID,true);
		else $result = $this->getFeature($this->loadPOI($UID,true));
		
		if($result)
			die(json_encode(array('exito'=>true,'POI'=>$result)));
		else
			die(json_encode(array('exito'=>false)));
	}

	function loadPOITiny($id_UID,$es_UID=false){
		$id = $id_UID;
		if($es_UID){
			$id = $this->getPOIid($id_UID);
			if(!$id) return;
		}

		$queryDB = new BicimapaQueryDB();
		$poi = $queryDB->getPoiTiny($id);
		return $poi;
	}
	function loadPOI($id_UID,$es_UID=false){
		$id = $id_UID;
		if($es_UID){
			$id = $this->getPOIid($id_UID);
			if(!$id) return null;
		}
		
		$queryDB = new BicimapaQueryDB();
		$poi = $queryDB->getPoi($id,is_user_logged_in()?get_current_user_id():false);
		return $poi;
	}
	function getPOIid($UID){
		$queryDB = new BicimapaQueryDB();
		$poi = $queryDB->getPoiID($UID,is_user_logged_in()? get_current_user_id() : false, current_user_can('admin_poi'),get_current_blog_id());
		return $poi;
	}
	function getPOICoord($UID_id,$es_UID=false){
		$id = $UID_id;
		if($es_UID){ 
			$id = $this->getPOIid($UID_id);
			if(!$id) return null;
		}

		$queryDB = new BicimapaQueryDB();
		$POI = $queryDB->getPoiTiny($id);
		return array('lat'=>$POI['lat'],'lng'=>$POI['lng']);
	}

	function getPoiZonas(){

		$zonas = $_POST['zonas'];// Las capas vienen dentro
		$UIDs = $_POST['UIDs'];

		$queryDB = new BicimapaQueryDB();

		$result = array('fecha'=>$this->now());

		if($zonas){
			$pois = $queryDB->getPoiZonas($zonas,get_current_user_id(),current_user_can('admin_poi'),get_current_blog_id());
			$result['zonas'] = $this->setPOIFeatures($pois);
		}
		
		if($UIDs){
			$result['UIDs']= array();
			foreach($UIDs as $key => $UID){
				$result['UIDs'][$UID] = $this->getFeature($this->loadPOI($UID,true));
			}
		}

		die(json_encode($result));
		
	}


	function setPOIFeatures($pois,$tiny=false){

		$result = array();
		
		foreach($pois as $key => $POI){
			
			if(!$tiny) $feature = $this->getFeature($POI);
			else $feature = $this->getFeatureTiny($POI);

			if(!$result[$POI['zona']]) $result[$POI['zona']] = array();
			if(!$result[$POI['zona']][$POI['capa']]) $result[$POI['zona']][$POI['capa']] = array();
			$result[$POI['zona']][$POI['capa']][$POI['UID']] = $feature;
			// $result[$POI['zona']][$POI['UID']] = $feature;
		}
		return $result;
	}

	function getFeatureTiny($POI){
		global $bicimapa;
		
		$feature = array();
			$feature['type'] = 'Feature';
			$feature['id'] = $POI['poi_id'];
			
			$feature['properties'] = array(
				'capa'=>			$POI['capa'],
				'zona'=>			$POI['zona'],
				'UID'=>				$POI['UID'],
				'nombre'=>			$POI['nombre'],
				'estado'=>			$POI['estado'],
				'icon'=>			$POI['icon']
			);

			$feature['geometry'] = array();
			$feature['geometry']['type'] = 'Point';
			$_0 = floatval($POI['lng']);
			$_1 = floatval($POI['lat']);
			$feature['geometry']['coordinates'] = array($_0,$_1);

			return $feature;
	}

	function getFeature($POI){
		global $bicimapa;
		
		$feature = $this->getFeatureTiny($POI);

		// Puede crear va en la capa! -> cache de capas es por user tambien, por cuestión de permisos
		$feature['properties']['puede_moderar']=	$this->puede_moderarPOI($POI);
		$feature['properties']['puede_validar']=	$this->puede_validarPOI($POI);
		$feature['properties']['puede_invalidar']=	$this->puede_invalidarPOI($POI);
		$feature['properties']['puede_editar']=		$this->puede_editarPOI($POI);
		$feature['properties']['puede_eliminar']=	$this->puede_eliminarPOI($POI);
		
		$feature['properties']['direccion']=		$POI['direccion'];
		$feature['properties']['representante']=	$POI['representante'];
		$feature['properties']['editor']=			$POI['editor'];
		$feature['properties']['fecha_estado']=		$POI['estado_fecha'];
		$feature['properties']['imagen']=			$POI['imagen'];
		$feature['properties']['url_imagen']=		$POI['url_imagen'];
		$feature['properties']['atributos']=		$POI['atributos'];
		$feature['properties']['secundarias']=		$POI['secundarias'];
		$feature['properties']['es_favorito']=		intval($POI['es_favorito'])?true:false;
		$feature['properties']['favoritos']=		intval($POI['favoritos']);

		if($POI['editor'] && $POI['editor']!="" && $POI['editor']!=0 && $POI['editor']!=1){
			$feature['properties']['editor_vcard'] = $bicimapa->getVcard($POI['editor']);
		}
		if($POI['mensaje_estado']){
			$feature['properties']['usuario_estado'] = $POI['usuario_estado'];
			$feature['properties']['usuario_estado_vcard'] = $bicimapa->getVcard($POI['usuario_estado']);
			$feature['properties']['mensaje_estado'] = $POI['mensaje_estado'];
		}

		if($this->puede_moderarPOI($POI) && $POI['ant_version']){
			$queryDB = new BicimapaQueryDB();
			$feature['properties']['ant_version'] = $this->getFeature($this->loadPOI($POI['ant_version']));
			$feature['properties']['ant_version']['properties']['sgte_version'] = $POI['nombre'];
		}

		return $feature;
	}

	function puede_crearPOI($capa_o_nombre,$lat=false,$lng=false){
		global $bicimapa;
		$zonasAdmin = $this->zonasAdmin;

		if(is_string($capa_o_nombre)){
			$tipo = $this->capasPOI[$capa_o_nombre]['tipo'];
			$zonasCapa = $this->capasPOI[$capa_o_nombre]['zonas'];
		}
		else{
			$tipo = $capa_o_nombre['tipo'];
			$zonasCapa = $capa_o_nombre['zonas'];	
		}

		return is_user_logged_in()
			&& (
				(current_user_can('admin_poi') || $tipo == 'private' || $tipo == 'user' || $tipo == 'community')
				&& ($lat&&$lng? $this->zonasContienen($zonasCapa,new LatLng($lat,$lng)):true)
				&& (($lat&&$lng? $this->zonasContienen($zonasAdmin,new LatLng($lat,$lng)):true) || $tipo != 'admin')
			)
		;
	}

	function next_crearPOI($capa,$lat=false,$lng=false){
		$tipo_moderar = 'moderar'; // Se calcula secgun config del blog

		$zonasAdmin = $this->zonasAdmin;
		// $zonasAdmin = $this->getZonasAdmin();
		$tipo = $this->capasPOI[$capa]['tipo'];
		$en_zonaAdmin = ($lat&&$lng? $this->zonasContienen($zonasAdmin,new LatLng($lat,$lng)):true);

		if(current_user_can('admin_poi') && $en_zonaAdmin) return 'valido';
		else if($tipo == 'private') return 'valido';
		else return $tipo_moderar;
	}
	

	function puede_moderarPOI($POI){
	//EXTENDER CON OPCIONES
		$zonasAdmin = $this->zonasAdmin;
		// $zonasAdmin = $this->getZonasAdmin();
	
		return is_user_logged_in()
			&& (
				current_user_can('admin_poi')
				&& ($POI['estado']=='moderar') 
				// Tiene que hacer el calculo acá, independiente del calculo en la BD.
				&& $this->zonasContienen($zonasAdmin,new LatLng($POI['lat'],$POI['lng']))
			)
		;
	}
	
	function next_aprobarPOI($POI){
	//EXTENDER CON OPCIONES
		return 'valido';
	}
	
	function next_desaprobarPOI($POI){return 'inapropiado';}

	function puede_validarPOI($POI){
		/* Puede validar si
		- Usuario
			+ es admin
			+ es representante
		- El POI es 
			+ validar
			+ invalido
		*/
		global $bicimapa;
		$queryDB = new BicimapaQueryDB();
		
		return is_user_logged_in() 
			&& ($POI['estado'] == 'validar' || $POI['estado'] == 'invalido')
			&& (current_user_can('admin_poi') || current_user_can('colaborar_poi')	|| get_current_user_id() == $POI['representante'])
		;
	}
	function next_validarPOI($POI){	return 'valido';}
	
	function puede_invalidarPOI($POI){
		/* Puede invalidar si:
		- La capa es user o community
		- Usuario
			+ es admin
			+ NO es representante ni editor
		- El POI es 
			+ valido
			+ validar
		*/
		global $bicimapa;
		$queryDB = new BicimapaQueryDB();
		$tipo = $this->capasPOI[$POI['capa']]['tipo'];
		return is_user_logged_in()
			&& ($tipo=='user' || $tipo=='community')
			&& ($POI['estado'] == 'valido' || ($POI['estado'] == 'validar'))
			&&(current_user_can('admin_poi') || !(get_current_user_id() == $POI['representante'] || get_current_user_id() == $POI['editor']))
		;
	}
	function next_invalidarPOI($POI){return 'invalido';}

	function puede_editarPOI($POI,$new_capa=false,$lat=false,$lng=false){
		global $bicimapa;
		$zonasAdmin = $this->zonasAdmin;

		$tipo = $this->capasPOI[$POI['capa']]['tipo'];
		if($new_capa) $zonasCapa = $this->capasPOI[$new_capa]['zonas'];

		return is_user_logged_in()
			&& (
				current_user_can('admin_poi')
				|| get_current_user_id() == $POI['representante']
				|| (!$POI['representante'] && $tipo=='community')
				|| (!$POI['representante'] && $POI['capa']=='favoritos' && intval($POI['es_favorito']))
				|| ($tipo=='private' && get_current_user_id() == $POI['editor'])
			)
			&& (
				$POI['estado']=='valido' 
				|| $POI['estado']=='validar'
				|| $POI['estado']=='invalido'
				|| ($POI['estado']=='moderar' && (current_user_can('admin_poi') || get_current_user_id() == $POI['editor']))
			)
			&& ($new_capa&&$lat&&$lng? $this->zonasContienen($zonasCapa,new LatLng($lat,$lng)):true)
			&& (($new_capa&&$lat&&$lng? $this->zonasContienen($zonasAdmin,new LatLng($lat,$lng)):true) || $tipo != 'admin')
		;
	}

	//Viene por trigger en BD. No se usa.
	function next_editarPOI($POI){return 'actualizado';}

	function puede_eliminarPOI($POI){
		/* Puede borrar si:
		- Es admin
		- Esta en estados validar, valido, invalido
		*/
		return is_user_logged_in()
			&& (
				current_user_can('admin_poi')
				&& ($POI['estado']=='validar' || $POI['estado']=='valido' || $POI['estado']=='invalido')
			)
		;
		
	}
	function next_eliminarPOI($POI){ return 'eliminado';}	

	function checkPOIZonaAdmin($POI){

	}		

	function check_capability($POI,$accion){ 
		if($accion=='crear') return $this->puede_crearPOI($POI['capa_nombre'],$POI['lat'],$POI['lng']);
		if($accion=='aprobar') return $this->puede_moderarPOI($POI);
		if($accion=='desaprobar') return $this->puede_moderarPOI($POI);
		if($accion=='validar') return $this->puede_validarPOI($POI);
		if($accion=='invalidar') return $this->puede_invalidarPOI($POI);
		if($accion=='editar') return $this->puede_editarPOI($POI);
		if($accion=='eliminar') return $this->puede_eliminarPOI($POI);
	}

	function getNextEstado($POI,$accion){
		if($accion=='crear') return $this->next_crearPOI($POI['capa_nombre'],$POI['lat'],$POI['lng']);
		if($accion=='aprobar') return $this->next_aprobarPOI($POI);
		if($accion=='desaprobar') return $this->next_desaprobarPOI($POI);
		if($accion=='validar') return $this->next_validarPOI($POI);
		if($accion=='invalidar') return $this->next_invalidarPOI($POI);
		if($accion=='editar') return $this->next_editarPOI($POI);
		if($accion=='eliminar') return $this->next_eliminarPOI($POI);
	}

	function doActionPOI(){
		$queryDB = new BicimapaQueryDB();
		
		$poi_id = $_POST['poi_id'];
		$accion = $_POST['accion'];
		$comentarios = esc_sql($_POST['comentarios']);

		$POI = $this->loadPOI($poi_id);

		if($this->check_capability($POI,$accion)){
			
			$estado = $this->getNextEstado($POI,$accion);

			// $exito = $queryDB->setEstado($estado,$poi_id,get_current_user_id(),$comentarios,current_user_can('admin_poi')||current_user_can('colaborar_poi'));
			$exito = $queryDB->setEstado($estado,$poi_id,get_current_user_id(),$comentarios);
			if($exito){

				if($estado!='inapropiado' || !$POI['ant_version']){
					$POI = $this->loadPOI($poi_id); // Se vuelve a cargar el POI
					
					$permisos = array(
						'puede_moderar'=> $this->puede_moderarPOI($POI),
						'puede_validar'=> $this->puede_validarPOI($POI),
						'puede_invalidar'=> $this->puede_invalidarPOI($POI),
						'puede_editar'=> $this->puede_editarPOI($POI),
						'puede_eliminar'=> $this->puede_eliminarPOI($POI)
					);

					die(json_encode(array('exito'=>true,'estado'=>$estado,'permisos'=>$permisos)));
				}
				else if($POI['ant_version']){ //Si la moderación rechaza el POI se envía la versión anterior.
					$result = $this->getFeature($this->loadPOI($POI['ant_version']));
					die(json_encode(array('exito'=>true,'POI'=>$result)));
				}
			}
			else
				die(json_encode(array('exito'=>false,'estado'=>'error_escritura')));
		}
		else if($POI['estado']=='actualizado' || ($POI['estado']=='eliminado' && $POI['sgte_version'])){
			$retornar = $this->loadPOI($POI['sgte_version']);
			if($retornar['estado']=='moderar' && !$this->puede_moderarPOI($retornar)) $retornar = $POI;
			die(json_encode(array('exito'=>false,'estado'=>'actualizado','POI'=>$this->getFeature($retornar))));
		}
		else if($POI['estado']=='eliminado'){
			die(json_encode(array('exito'=>false,'estado'=>$POI['estado'])));
		}
		else{
			die(json_encode(array('exito'=>false,'estado'=>'sin_permisos','POI'=>$this->getFeature($POI))));
		}
	}
	

	function newPOI(){
		global $bicimapa;
		$queryDB = new BicimapaQueryDB();
		$POI = $_POST['POI'];

		// die(json_encode(array('exito'=>false,'POI'=>$POI)));

		$POI['id'] = intval($POI['id']);
		$POI['es_representante'] = $POI['es_representante']=='true'? 1 : 0;

		$actualizar_moderar = false; // Si la versión anterior estaba en moderar, debe quedar en estado Eliminndo.
		if($POI['id']){
			$POI['ant_version'] = $POI['id'];
			
			$oldPOI = $this->loadPOI($POI['id']);
			if($oldPOI['estado']=='actualizado'){
				$retornar = $this->loadPOI($oldPOI['sgte_version']);
				if($retornar['estado']=='moderar' && !$this->puede_moderarPOI($retornar)) $retornar = $oldPOI;
				die(json_encode(array('exito'=>false,'estado'=>'actualizado','POI'=>$this->getFeature($retornar))));
			}
			else if($oldPOI['estado']=='inapropiado'){
				$result = array('exito'=>false,'estado'=>$oldPOI['estado']);
				if($oldPOI['ant_version']) $result['POI'] = $this->getFeature($this->loadPOI($oldPOI['ant_version']));
				die(json_encode($result));
			}
			else if($oldPOI['estado']=='eliminado'){
				die(json_encode(array('exito'=>false,'estado'=>$oldPOI['estado'])));
			}
			else if(!$this->puede_editarPOI($oldPOI,$POI['capa_nombre'],$POI['lat'],$POI['lng'])){
				die(json_encode(array('exito'=>false,'estado'=>'sin_permisos','POI'=>$this->getFeature($oldPOI))));
			}
			else if($oldPOI['estado']=='moderar'){
				$actualizar_moderar = true;
				$POI['ant_version'] = $oldPOI['ant_version'];
			}
		}
		else if(!$this->puede_crearPOI($POI['capa_nombre'],$POI['lat'],$POI['lng'])){
			die(json_encode(array('exito'=>false,'estado'=>'sin_permiso_crear')));

		}

		if(!$POI['UID']){
			//CORREGIR CONFLICTOS UID
			$POI['UID'] = genUID();
			$queryDB->newPOIUID($POI['UID']);
		}

		if($POI['fotoPOI']){
			$uploadDir_temp = bcbm_getUploadDir(true);
			$uploadDir = bcbm_getUploadDir();

			copy($uploadDir_temp.'/'.$POI['fotoPOI'], $uploadDir.'/'.$POI['fotoPOI']);
			copy($uploadDir_temp.'/thumb_'.$POI['fotoPOI'], $uploadDir.'/thumb_'.$POI['fotoPOI']);

			$POI['url_imagen'] = bcbm_getUploadUrl().'/';
		}
		
		$estado=$this->next_crearPOI($POI['capa_nombre'],$POI['lat'],$POI['lng']);
		
		$poi_id = $queryDB->newPOI($POI,get_current_user_id(),$estado,$actualizar_moderar);

		if($poi_id){
			$result = $this->getFeature($this->loadPOI($poi_id));
			die(json_encode(array('exito'=>true,'POI'=>$result)));
		}
		else{
			die(json_encode(array('exito'=>false,'estado'=>'error_escritura')));
		}
	}

	function chekPOIname(){
		$queryDB = new BicimapaQueryDB();
		
		$name = $_POST['name'];
		$UID = $_POST['UID'];
		if($queryDB->chekPOIname($name,$UID) && !$this->es_nombreReservado($name)) die('OK');
		else die('NOK');
	}

	function es_nombreReservado($name){
		return $name == 'start' || $name == 'end' || $name == 'POI';
	}

	function setFavorite(){
		$queryDB = new BicimapaQueryDB();
		$UID = $_POST['UID'];
		$is_favorite = $_POST['is_favorite']=='true'?true:false;

		if(($result=$queryDB->setFavorite(get_current_user_id(),$UID,$is_favorite))!==false){
			$POI = $this->loadPOI($UID,true);
			die(json_encode(array('exito'=>true,'favoritos'=>$result,'puede_editar'=>$this->puede_editarPOI($POI))));
		}
		else die(json_encode(array('exito'=>false)));
	}

	function getFavorites(){
		$queryDB = new BicimapaQueryDB();
		if(is_user_logged_in() && $favoritos_pre=$queryDB->getFavorites(get_current_user_id(),current_user_can('admin_poi'),get_current_blog_id())){
			die(json_encode($favoritos_pre));
		}
		else die(json_encode(new stdClass()));
	}

	function isEstadoAdmin($estado){
		return $estado == 'invalido' || $estado == 'moderar' || $estado == 'validar';
	}
	function getEstadosAdmin(){
		return array('invalido','moderar','validar');
	}

	function getPOIAdmin(){
		$queryDB = new BicimapaQueryDB();
		$pois = $queryDB->getPOIAdmin(get_current_user_id(),$this->getEstadosAdmin(),get_current_blog_id());

		if(is_user_logged_in() && $pois) die(json_encode($pois));
		else die(json_encode(new stdClass()));
	}

	function setZonasCapa(){
		$queryDB = new BicimapaQueryDB();
		$zonas = $_POST['zonas'];
		$capa_nombre = $_POST['capa'];
		if(current_user_can('admin_poi')){
			$queryDB = new BicimapaQueryDB();
			$result = $queryDB->setZonasCapa($capa_nombre,$zonas);
			if($result) die('OK');
			else die('NOK');
		}
		else die('Sin permisos');
		
	}
	function setZonasAdmin(){
		$queryDB = new BicimapaQueryDB();
		$zonas = $_POST['zonas'];
		if(is_super_admin()){
			$queryDB = new BicimapaQueryDB();
			$result = $queryDB->setZonasAdmin(get_current_blog_id(),$zonas);
			if($result) die('OK');
			else die('NOK');
		}
		else die('Sin permisos');
	}
	function getZonasAdmin(){
		$queryDB = new BicimapaQueryDB();
		return $queryDB->getZonasAdmin(get_current_blog_id());
	}

	
	function zonasIntersectan($zona_a,$zona_b){
		return $this->zonaContiene($zona_a,$zona_b) || $this->zonaContiene($zona_b,$zona_a);
	}

	function zonasContienen($zonas,$zona_latlng){
		foreach($zonas as $key => $zona){
			if($this->zonaContiene($zona,$zona_latlng)) return true;
		}
		return false;
	}

	function zonaContiene($zona,$zona_latlng){
		if($zona == '0|0|0') return true; // CUCHUFLETA
		$checkSize = true;
		$latlng = $zona_latlng;
		
		if(is_string($zona_latlng)){ 
			$checkSize = $this->esMayorZ($zona,$zona_latlng);
			$latlng = $this->getBoundsZona($zona_latlng)->getCenter();
		}
		
		return ($this->getBoundsZona($zona)->contains($latlng) && $checkSize) || ($zona == $zona_latlng);
	}

	function getBoundsZona($zona_nombre){
		$params  = explode('|', $zona_nombre);
		$z = intval($params[0]);
		$x = intval($params[1]);
		$y = intval($params[2]);
		$noreste = new LatLng($this->tile2lat($y,$z),$this->tile2lng($x+1,$z));
		$suroeste = new LatLng($this->tile2lat($y+1,$z),$this->tile2lng($x,$z));
		
		return new LatLngBounds($suroeste,$noreste);
	}
	function tile2lng($x,$z){return ($x/pow(2,$z)*360-180);}
	function tile2lat($y,$z){$n=pi()-2*pi()*$y/pow(2,$z);return (180/pi()*atan(0.5*(exp($n)-exp(-$n))));}

	function findNW($x,$y){ return array('lat'=>$x['lat']<$y['lat']? $x['lat'] : $y['lat'],'lng'=> $x['lng']>$y['lng']? $x['lng'] : $y['lng']); }
	function findNE($x,$y){ return array('lat'=>$x['lat']<$y['lat']? $x['lat'] : $y['lat'],'lng'=> $x['lng']<$y['lng']? $x['lng'] : $y['lng']); }
	function findSW($x,$y){ return array('lat'=>$x['lat']>$y['lat']? $x['lat'] : $y['lat'],'lng'=> $x['lng']>$y['lng']? $x['lng'] : $y['lng']); }
	function findSE($x,$y){ return array('lat'=>$x['lat']>$y['lat']? $x['lat'] : $y['lat'],'lng'=> $x['lng']<$y['lng']? $x['lng'] : $y['lng']); }

	function getZonaZ($zona){ $arr = explode('|',$zona); return intval($arr[0]);}
	function esMayorZ($zona_a,$zona_b){ return $this->getZonaZ($zona_a) < $this->getZonaZ($zona_b);}
	function esMayorIgualZ($zona_a,$zona_b){ return $this->getZonaZ($zona_a) <= $this->getZonaZ($zona_b);}
	function esIgualZ($zona_a,$zona_b){ return $this->getZonaZ($zona_a) == $this->getZonaZ($zona_b);}
}
?>