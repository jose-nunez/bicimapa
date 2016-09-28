<?php

class BicimapaQueryDB{

	function now(){
		global $wpdb;
		$sql_query = 'select NOW() now';
		$now = $wpdb->get_results($sql_query,ARRAY_A);
		return $now[0]['now'];
	}

	function indexResultSet($result,$index){
		$newSet = array();
		foreach ($result as $key => $element) {
			$newSet[$element[$index]] = $element;
		}
		return $newSet;
	}

	function getCapas($fecha_cache='1900-01-01'){
		global $wpdb;

		$sql_query = 'select clave as nombre,nombre_plural as plural,
							nombre_singular as singular,multicapa,
							default_disp as mostrar,tipo,editado
						from bcbm_capa_poi
						where activa=1 and editado>"'. $fecha_cache .'"
						order by prioridad asc';

		$capas = $wpdb->get_results($sql_query,ARRAY_A);
		$capas = $this->indexResultSet($capas,'nombre');

		$sql_query='select
						capa.clave nombre_capa,
						tipo.clave,
						tipo.nombre,
						tipo.tipo,
						tipo.opciones
					from 
						bcbm_definicion_atributos def
						inner join bcbm_tipo_atributo_poi tipo
						right join bcbm_capa_poi capa
					on 
						def.capa_poi_id = capa.capa_poi_id
						and def.tipo_atributo_poi_id = tipo.tipo_atributo_poi_id
					order by def.prioridad asc
					';
		$capas_attr = $wpdb->get_results($sql_query,ARRAY_A);

		foreach ($capas_attr as $key => $attr) {
			$attr_capa = $attr['nombre_capa'];
			$attr_clave = $attr['clave'];
			unset($attr['nombre_capa']);
			unset($attr['clave']);
			if(!$attr['opciones']) unset($attr['opciones']);

			if($capas[$attr_capa]){
				if(!$capas[$attr_capa]['atributos']){
					$capas[$attr_capa]['atributos'] = array();
				}
				// array_push($capas[$attr_capa]['atributos'],$attr);
				$capas[$attr_capa]['atributos'][$attr_clave] = $attr;
			}
		}

		$sql_query='select
						capa.clave nombre_capa,
						zona.nombre nombre_zona
					from 
						bcbm_capas_zona cz
						inner join bcbm_capa_poi capa
						inner join bcbm_zona_poi zona
					on 
						cz.capa_poi_id = capa.capa_poi_id
						and cz.zona_poi_id = zona.zona_poi_id
					';
		$zonas = $wpdb->get_results($sql_query,ARRAY_A);

		foreach ($zonas as $key => $zona) {
			$zona_capa = $zona['nombre_capa'];
			if($capas[$zona_capa]){
				if(!$capas[$zona_capa]['zonas']){
					$capas[$zona_capa]['zonas'] = array();
				}
				array_push($capas[$zona_capa]['zonas'],$zona['nombre_zona']);
			}
		}

		foreach ($capas as $key => $capa) {
			// Convierte el booleanos  de string a enteros
			$capas[$key]['multicapa'] = intval($capas[$key]['multicapa']);
			$capas[$key]['mostrar'] = intval($capas[$key]['mostrar']);
		}

		// echo '<pre>';print_r($capas_attr);echo '</pre>';
		// echo '<pre>';print_r($capas);echo '</pre>';
		// exit;

		return $capas;
	}

	function getCapasZonas($zonas){
		global $wpdb;

		$filtro = '';
		$filtro .= ' where activa=1 and capa_poi_id in 
					(select distinct(capa_poi_id)
						from bcbm_capas_zona cz
						inner join bcbm_zona_poi zona on 
						cz.zona_poi_id = zona.zona_poi_id
						where (false ';
		foreach ($zonas as $zona_nombre => $fecha_cache) {
			$filtro .= ' or (MBRIntersects(getBoundsZona(zona.nombre),getBoundsZona("'+ $zona_nombre +'")) ) ';
		}
		$filtro .= ' ) ';

		$sql_query = 'select clave as nombre,nombre_plural as plural,
							nombre_singular as singular,multicapa,
							default_disp as mostrar,tipo,editado
						from bcbm_capa_poi
						'. $filtro .'
						order by prioridad asc';
		$capas = $wpdb->get_results($sql_query,ARRAY_A);
		$capas = $this->indexResultSet($capas,'nombre');

		$sql_query='select
						capa.clave nombre_capa,
						tipo.clave,
						tipo.nombre,
						tipo.tipo,
						tipo.opciones
					from 
						bcbm_definicion_atributos def
						inner join bcbm_tipo_atributo_poi tipo
						right join bcbm_capa_poi capa
					on 
						def.capa_poi_id = capa.capa_poi_id
						and def.tipo_atributo_poi_id = tipo.tipo_atributo_poi_id
					order by def.prioridad asc
					';
		$capas_attr = $wpdb->get_results($sql_query,ARRAY_A);

		foreach ($capas_attr as $key => $attr) {
			$attr_capa = $attr['nombre_capa'];
			unset($attr['nombre_capa']);
			
			if($capas[$attr_capa]){
				if(!$capas[$attr_capa]['atributos']){
					$capas[$attr_capa]['atributos'] = array();
				}
				array_push($capas[$attr_capa]['atributos'],$attr);
			}
		}

		$sql_query='select
						capa.clave nombre_capa,
						zona.nombre nombre_zona
					from 
						bcbm_capas_zona cz
						inner join bcbm_capa_poi capa
						inner join bcbm_zona_poi zona
					on 
						cz.capa_poi_id = capa.capa_poi_id
						and cz.zona_poi_id = zona.zona_poi_id
					';
		$zonas = $wpdb->get_results($sql_query,ARRAY_A);

		foreach ($zonas as $key => $zona) {
			$zona_capa = $zona['nombre_capa'];
			if($capas[$zona_capa]){
				if(!$capas[$zona_capa]['zonas']){
					$capas[$zona_capa]['zonas'] = array();
				}
				array_push($capas[$zona_capa]['zonas'],$zona['nombre_zona']);
			}
		}

		foreach ($capas as $key => $capa) {
			// Convierte el booleanos  de string a enteros
			$capas[$key]['multicapa'] = intval($capas[$key]['multicapa']);
			$capas[$key]['mostrar'] = intval($capas[$key]['mostrar']);
		}

		// echo '<pre>';print_r($capas_attr);echo '</pre>';
		// echo '<pre>';print_r($capas);echo '</pre>';
		// exit;

		return $capas; 
	}


	function getTinyAttr($pref=false){
		if($pref) $pref .= '.';
		return ' '.
				$pref.'poi_id'.
				','.$pref.'UID'.
				','.$pref.'capa'.
				','.$pref.'zona'.
				','.$pref.'nombre'.
				','.$pref.'lat'.
				','.$pref.'lng'.
				','.$pref.'estado'. // Para administración
				','.$pref.'icon'.
				' ';
	}

	function getBaseQuery($user_id,$tiny=false,$poi_id=false){
		$sql_query = 
			'select '.($tiny?$this->getTinyAttr('vpoi'):'vpoi.*').',fav.es_favorito from
				(select * from bcbm_vista_poi '. ($poi_id?' where poi_id='.$poi_id:'') .' ) vpoi 
			left join 
				(select u.UID,true es_favorito from bcbm_poi_favorito f inner join bcbm_poi_uid u 
					on f.poi_uid_id=u.poi_uid_id where f.user_id='. intval($user_id) .') fav 
			on vpoi.UID = fav.UID ';
			
			/*'select base.*,listas.fecha fecha_lista from
				(select '.($tiny?$this->getTinyAttr('vpoi'):'vpoi.*').',fav.es_favorito from
					(select * from bcbm_vista_poi '. ($poi_id?' where poi_id='.$poi_id:'') .' ) vpoi 
				left join 
					(select UID,true es_favorito from bcbm_vista_lista_poi where clave="favoritos" and integra=true and user_id='. intval($user_id) .') fav 
				on vpoi.UID = fav.UID ) base 
			left join 
				(select UID,GREATEST(lista.fecha,grupo.fecha) fecha from 
					(select UID,max(fecha) from bcbm_vista_lista_poi where integra=true and user_id='. intval($user_id) .' group by UID) lista
				join
					(select UID,max(fecha) from bcbm_vista_lista_poi_grupo where integra=true and user_id='. intval($user_id) .' group by UID) grupo
				on lista.UID=grupo.UID) listas 
			on
				base.UID=listas.UID
			';*/
		return $sql_query;
	}

	function getPOIFilterCapa($user_id=false){
		// Los favoritos se actualizan en cache en el cliente al crearlos, pues por fecha de cache no se actualizan.
		// -> esto debe cambiar mi compadrazo.
		return 
			' and capa_activa=1 '.
			' and (
				capa_tipo in ("user","community","admin") '.
				' or (capa_tipo="private" and es_favorito=1) '.
				($user_id? // Si es capa favorito, usuario editor, pero no es favorito, no debe cargarlo.
				' or (capa_tipo="private" and capa!="favoritos" and editor='. intval($user_id) .')':'').
				// ' or (capa_tipo="private" and fecha_lista is not null) '.
			')';
	}
	
	function getPOIFilterVersion($user_id,$es_admin,$blog_id,$no_exclude=false){
		$filtro = ' ';
		
		if(!$no_exclude) $filtro .= ' and estado!="eliminado" and estado !="inapropiado" ';
		else $filtro .= ' and (estado!="eliminado" or (estado="eliminado" and sgte_version is null)) and (estado!="inapropiado" or (estado="inapropiado" and ant_version is null)) ';
		
		$filtro_user_1 = ' ';
		$filtro_user_2 = ' ';
		$filtro_user_3 = ' ';
		
		if($user_id){
			$filtro_user_1 = ' or (estado ="moderar" and editor='. $user_id .') ';
			$filtro_user_2 = ' and editor != '. $user_id .' ';
		}
		if($es_admin) $filtro_admin = ' or (estado="moderar" and poi_id in (select poi_id from bcbm_poi_blog_admin where blog_id='.$blog_id.')) ';

		$filtro .= ' and (estado !="moderar" '.$filtro_user_1.' '.$filtro_admin.') '.
					' and (estado !="actualizado" 
						  or (estado = "actualizado" 
									and sgte_version in 
										(select poi_id from bcbm_vista_poi where estado = "moderar" '. $filtro_user_2 .')
							  )
						) ';

		return $filtro;
	}
	
	// Cada vez que busca un ID desde un nombre o UID trae el ID del POI que debiera ver según permisos
	function getPoiID($UID,$user_id,$es_admin,$blog_id){
		global $wpdb;
		$sql_query = 'select poi_id FROM bcbm_vista_poi WHERE UID="'.$UID.'" ' . $this->getPOIFilterVersion($user_id,$es_admin,$blog_id);
		// return $sql_query;

		$result = $wpdb->get_results($sql_query,ARRAY_A);
		if(count($result)>0){
			return $result[0]['poi_id'];
		}
		else return null;
	}

	function getPoiTiny($POI_id){
		global $wpdb;
		$sql_query = 'select '. $this->getTinyAttr() .' FROM bcbm_vista_poi WHERE poi_id='.$POI_id;

		$result = $wpdb->get_results($sql_query,ARRAY_A);
		if(count($result)>0) return $result[0];
		else return null;
	}

	function getPoi($POI_id,$user_id=false){
		global $wpdb;
		$sql_query = $this->getBaseQuery($user_id,false,$POI_id);

		$poi = $wpdb->get_results($sql_query,ARRAY_A);

		if(count($poi)>0){
			$poi = $poi[0];
			$attrs = $this->setAtributosPOI($poi['poi_id']);
			if($attrs['atributos']) $poi['atributos'] = $attrs['atributos'];
			if($attrs['secundarias']) $poi['secundarias'] = $attrs['secundarias'];
			return $poi;
		}
		else return null;
	}

	function setAtributosPOI($poi_id){
		global $wpdb;
		// ATRIBUTOS
		/*$sql_query = 'select tipo.clave,tipo.nombre,attr.valor
					from 
						bcbm_atributo_poi attr inner join bcbm_tipo_atributo_poi tipo
					on 
						attr.tipo_atributo_poi_id = tipo.tipo_atributo_poi_id 
					where attr.poi_id='.$poi_id;*/
		$sql_query = 'select tipo.clave,attr.valor
					from 
						bcbm_atributo_poi attr inner join bcbm_tipo_atributo_poi tipo
					on 
						attr.tipo_atributo_poi_id = tipo.tipo_atributo_poi_id 
					where attr.poi_id='.$poi_id;
		
	
		$attrs = $wpdb->get_results($sql_query,ARRAY_A);

		$atributos = array();
		foreach ($attrs as $key => $attr) {
			// $atributos[$attr['clave']]=array('clave'=>$attr['clave'],'nombre'=>$attr['nombre'],'valor'=>$attr['valor']);
			$atributos[$attr['clave']] = $attr['valor'];
		}

		// CAPAS SECUNDARIAS
		$sql_query = 'select capa.clave
						from 
							bcbm_capas_secundarias capas inner join bcbm_capa_poi capa
						on 
							capas.capa_poi_id = capa.capa_poi_id 
						where capas.poi_id='.$poi_id;
		
		$secs = $wpdb->get_results($sql_query,ARRAY_A);
		
		$secundarias = array();
		foreach ($secs as $key => $capa) {
			array_push($secundarias,$capa['clave']);
		}

		return array('atributos'=>count($atributos)>0?$atributos:null,'secundarias'=>count($secundarias)>0?$secundarias:null);
	}

	function getPoiZonas($zonas,$user_id=false,$es_admin=false,$blog_id){
		global $wpdb;

		$sql_query = $this->getBaseQuery($user_id);

		$filtro = '';
		$filtro .= ' where (false ';
		foreach ($zonas as $zona_nombre => $capas) {
			foreach ($capas as $capa_nombre => $fecha_cache) {
				$filtro .= ' or (zona = "'.$zona_nombre.'" and capa="'.$capa_nombre.'" and estado_fecha>"'.$fecha_cache.'") ';
				// $filtro .= ' or (zona = "'.$zona_nombre.'" and capa="'.$capa_nombre.'" and estado_fecha>"'.$fecha_cache.' or fecha_lista>"'.$fecha_cache.'") ';
			}
		}
		$filtro .= ' ) ';

		$filtro .= $this->getPOIFilterVersion($user_id,$es_admin,$blog_id,true);
		$filtro .= $this->getPOIFilterCapa($user_id);
		
		$sql_query .= $filtro;
		
		// die($sql_query);

		$pois = $wpdb->get_results($sql_query,ARRAY_A);

		foreach ($pois as $key => $poi) {
			$attrs = $this->setAtributosPOI($poi['poi_id']);
			if($attrs['atributos']) $pois[$key]['atributos'] = $attrs['atributos'];
			if($attrs['secundarias']) $pois[$key]['secundarias'] = $attrs['secundarias'];
		}
		return $pois;
	}

	function getIdEstado($estado){
		if($estado=='moderar') return 1;
		if($estado=='validar') return 2;
		if($estado=='validado') return 3;
		if($estado=='valido') return 4;
		if($estado=='invalido') return 5;
		if($estado=='eliminado') return 6;
		if($estado=='inapropiado') return 7;
		if($estado=='actualizado') return 8;
		// if($estado=='eliminar') return 9;
		// if($estado=='noeliminado') return 10;
		if($estado=='posmoderar') return 11;
		else return -1;
	}
	function getEstadoId($estado_id){
		if($estado_id==1) return 'moderar';
		if($estado_id==2) return 'validar';
		if($estado_id==3) return 'validado';//Estado intermedio
		if($estado_id==4) return 'valido';
		if($estado_id==5) return 'invalido';
		if($estado_id==6) return 'eliminado';
		if($estado_id==7) return 'inapropiado';
		if($estado_id==8) return 'actualizado';
		// if($estado_id==9) return 'eliminar';
		// if($estado_id==10) return 'noeliminado';
		if($estado_id==11) return 'posmoderar';
		else return '';
	}

	function setEstado($estado,$poi_id,$user_id,$comentarios){
		global $wpdb;

		$id_estado = $this->getIdEstado($estado);

		$data = array('tipo_estado_poi_id' => $id_estado,'poi_id' => intval($poi_id),'user_id' => intval($user_id),'comentarios'=>$comentarios);
		$result =  $wpdb->insert('bcbm_estado_poi',$data);
		
		if($result){ 
			// if($estado=='validado'){
			// 	sleep(1); // Es necesario dormir para que las fechas de estados NO coincidan
			// 	if($this->countValidados($poi_id)==1 && !$es_admin){ 
			// 		$id_estado = 2;
			// 		$estado = 'validar';
			// 	}
			// 	else if($this->countValidados($poi_id)<3 && !$es_admin){ 
			// 		$id_estado = -1;
			// 		$estado = 'validar';
			// 	}
			// 	else if($this->countValidados($poi_id)>=3 || $es_admin){
			// 		$id_estado = 4;
			// 		$estado = 'valido';
			// 	}
				
			// 	if($id_estado!=-1){
			// 		$data = array('tipo_estado_poi_id' => $id_estado,'poi_id' => $poi_id,'user_id' =>null,'comentarios'=>null);
			// 		$result =  $wpdb->insert('bcbm_estado_poi',$data);
			// 		if($result)	return $estado;
			// 		else return false;
			// 	}	
			// }
			if($estado=='inapropiado'){
				$sql_query = 'select ant_version from bcbm_vista_poi where poi_id='.$poi_id;
				$ant_version = $wpdb->get_results($sql_query,ARRAY_A);
				$ant_version = $ant_version[0]['ant_version'];
				if($result){
					$sql_query = 'delete from bcbm_estado_poi where 
									poi_id='.$ant_version.' 
									and tipo_estado_poi_id=8 
									and fecha in 
										(select max_fecha from bcbm_vista_estado_poi where poi_id='.$ant_version.')';
					$wpdb->query($sql_query);

					$sql_query = 'update bcbm_estado_poi SET fecha=NOW() WHERE 
									poi_id='.$ant_version.' 
									and fecha in 
										(select max_fecha from bcbm_vista_estado_poi where poi_id='.$ant_version.' )';
					$wpdb->query($sql_query);
				}
			}

			return true;
		}
		else{ 
			return false;
		}
	}

	function countValidados($poi_id,$user_id=false){
		//_____________________________!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!__________________________________
		// Si tiene estado INVALIDO, cuenta desde el último estado inválido en adelante, si no, los cuenta todos.
		//_____________________________!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!__________________________________

		global $wpdb;

		if($user_id) $filtro_user = ' and user_id='.$user_id .' ';
		else $filtro_user = ' ';

		$filtro_estado = ' ';

		$sql_query = 'select count(1) invalidos from bcbm_estado_poi where `tipo_estado_poi_id`=5 and poi_id='.$poi_id;
		$result = $wpdb->get_results($sql_query,ARRAY_A);
		$invalidos = intval($result[0]['invalidos']);

		if($invalidos>0){
			$filtro_estado = ' and fecha >=(select max(fecha)
										from bcbm_estado_poi 
										where 
											tipo_estado_poi_id=5
											and poi_id='.$poi_id.' 
										group by poi_id
										) ';
		}

		$sql_query = 'select count(1) validados
						from bcbm_estado_poi 
						where 
							poi_id='.$poi_id 
							. $filtro_user .
							' and tipo_estado_poi_id=3 '
							. $filtro_estado
					;

		$result = $wpdb->get_results($sql_query,ARRAY_A);
		return intval($result[0]['validados']);
	}



	function getZonasAdmin($blog_id){
		global $wpdb;
		$sql_query='select
						zona.nombre nombre_zona
					from 
						bcbm_zonas_admin ca
						inner join bcbm_zona_poi zona
					on 
						ca.zona_poi_id  = zona.zona_poi_id
					where
						ca.blog_id = '. $blog_id .' 
					';
		$zonas_pre = $wpdb->get_results($sql_query,ARRAY_A);

		$zonas = array();
		foreach ($zonas_pre as $key => $zona_pre) {
			array_push($zonas,$zona_pre['nombre_zona']);
		}
		return $zonas;
	}

	function setZonasAdmin($blog_id,$zonas){
		global $wpdb;
		$wpdb->delete('bcbm_zonas_admin',array('blog_id'=>$blog_id));
		$wpdb->delete('bcbm_poi_blog_admin',array('blog_id'=>$blog_id));

		$exito = true;
		foreach ($zonas as $key => $zona_nombre) {
			$data = array(
				'blog_id'=>$blog_id,
				'zona_poi_id'=>$this->getZonaID($zona_nombre)
			);
			$result = $wpdb->insert('bcbm_zonas_admin',$data);
			$exito = $exito && $result;
		}
		if($exito){
			//Actualizando referencias POIAdmin
			$wpdb->query(
				'insert into bcbm_poi_blog_admin (poi_id,blog_id)
					(select poi_id,blog_id
					from bcbm_poi
					inner join (select ca.blog_id,zona.nombre nombre_zona from bcbm_zonas_admin ca inner join bcbm_zona_poi zona on ca.zona_poi_id  = zona.zona_poi_id where ca.blog_id='.$blog_id.') zona
					on zonaContieneLatLng(zona.nombre_zona,lat,lng))');
		}
		return exito;
	}

	function setZonasCapa($capa_nombre,$zonas){
		global $wpdb;
		$capa_poi_id = $this->getCapaID($capa_nombre);
		$wpdb->delete('bcbm_capas_zona',array('capa_poi_id'=>$capa_poi_id));
		$exito = true;
		foreach ($zonas as $key => $zona_nombre) {
			$data = array(
				'capa_poi_id'=>$capa_poi_id,
				'zona_poi_id'=>$this->getZonaID($zona_nombre)
			);
			$result = $wpdb->insert('bcbm_capas_zona',$data);
			$exito = $exito && $result;
		}
		return exito;
	}

	function getTipoAtributoID($clave){
		global $wpdb;
		$sql_query = 'select tipo_atributo_poi_id from bcbm_tipo_atributo_poi where clave="'.$clave.'"';

		$result = $wpdb->get_results($sql_query,ARRAY_A);
		return $result[0]['tipo_atributo_poi_id'];
	}

	function getCapaID($capa_nombre){
		global $wpdb;
		$sql_query = 'select capa_poi_id from bcbm_capa_poi where clave="'.$capa_nombre.'"';

		$result = $wpdb->get_results($sql_query,ARRAY_A);
		return $result[0]['capa_poi_id'];
	}

	function getZonaID($zona){
		global $wpdb;
		$sql_query = 'select zona_poi_id from bcbm_zona_poi where nombre="'.$zona.'"';
		$result = $wpdb->get_results($sql_query,ARRAY_A);
		if(count($result)>0) return $result[0]['zona_poi_id'];
		else{
			$result = $wpdb->insert('bcbm_zona_poi',array('nombre'=>$zona));	
			if($result) return $wpdb->insert_id;
			else return -1;
		}

	}
	function getUidID($UID){
		global $wpdb;
		$sql_query = 'select poi_uid_id from bcbm_poi_uid where UID="'.$UID.'"';

		$result = $wpdb->get_results($sql_query,ARRAY_A);
		
		return $result[0]['poi_uid_id'];

	}

	function newPOIUID($UID){
		global $wpdb;
		$wpdb->insert('bcbm_poi_uid',array('UID'=>$UID));
	}

	function newPOI($POI,$user_id,$estado,$actualizado_moderar=false){
		global $bicimapa;
		global $wpdb;

		$data = array(
			'capa_poi_id'=> $this->getCapaID($POI['capa_nombre']),
			'zona_poi_id'=> $this->getZonaID($POI['zonaPOI']),
			'poi_uid_id'=> $this->getUidID($POI['UID']),
			'editor'=> $user_id,
			'nombre'=> $POI['nombrePOI'],
			'direccion'=> $POI['direccionPOI'],
			'lng'=> $POI['lng'],
			'lat'=> $POI['lat'],
			'puntuacion'=> 0,
			'imagen'=> $POI['fotoPOI'],
			'url_imagen'=> $POI['url_imagen'],
			'icon'=> $POI['icon']
		);

		// die(json_encode($POI['UID']));

		if($POI['ant_version']) $data['ant_version'] = $POI['ant_version'];
		
		if($POI['es_representante']) $data['representante'] = $user_id; 

		$result = $wpdb->insert('bcbm_poi',$data);

		if($result){
			$poi_id = $wpdb->insert_id;
			//Define estado inicial.
			$this->setEstado($estado,$poi_id,$user_id,'',$true);

			// AÑADE CAPAS SECUNDARAS
			foreach ($POI['secundarias'] as $key => $capa_nombre){
				$wpdb->insert('bcbm_capas_secundarias',array('poi_id'=>$poi_id,'capa_poi_id'=>$this->getCapaID($capa_nombre)));
			}
			// AÑADE ATRIBUTOS
			foreach ($POI['atributos'] as $clave => $valor){
				$wpdb->insert('bcbm_atributo_poi',array('poi_id'=>$poi_id,'tipo_atributo_poi_id'=>$this->getTipoAtributoID($clave),'valor'=>$valor));
			}
			// ACTUALIZA VERSIÓN ANTERIOR
			if($data['ant_version']){ // Actualiza versión anterior
				$wpdb->update('bcbm_poi',array('sgte_version'=>$poi_id),array('poi_id' =>$data['ant_version']));
				if($actualizado_moderar) $wpdb->delete('bcbm_poi',array( 'poi_id' => $POI['id']));
			}
			// ACTUALIZA FAVORITO
			if($POI['capa_nombre']=='favoritos'){
				$this->setFavorite($user_id,$POI['UID'],true);
			}
			// ACTUALIZA BLOG ADMIN
			$wpdb->query(
				// select from bcbm_poi_blog_admin where poi_id=20712
				'insert into bcbm_poi_blog_admin (poi_id,blog_id)
					(select '.$poi_id.' poi_id,ca.blog_id 
						from bcbm_zonas_admin ca inner join bcbm_zona_poi zona 
						on ca.zona_poi_id=zona.zona_poi_id
						where zonaContieneLatLng(zona.nombre,'.$POI['lat'].','.$POI['lng'].'))'
				);

			return $poi_id;
		}
		else return false;
	}

	function setFavorite($user_id,$UID,$is_favorite){
		global $wpdb;
		$exito = false;
		if($is_favorite){
			if($wpdb->insert('bcbm_poi_favorito',array('poi_uid_id'=>$this->getUidID($UID),'user_id'=>$user_id)))
				$exito=true;
		}
		else{ 
			$sql_query = 'delete from bcbm_poi_favorito where poi_uid_id='.$this->getUidID($UID).' and user_id='.$user_id;
			if($wpdb->query($sql_query)) 
				$exito=true;
		}
		
		if($exito) return $this->countFavorites($UID);
		else return false;
	}

	function countFavorites($UID){
		global $wpdb;
		$sql_query = 'select count(1) as num from bcbm_poi_favorito where poi_uid_id='.$this->getUidID($UID);
		$result = $wpdb->get_results($sql_query,ARRAY_A);
		return intval($result[0]['num']);
	}

	function chekPOIname($name,$UID){
		global $wpdb;
		$sql_query = 'select count(1) as num FROM bcbm_vista_poi 
						WHERE nombre="'.$name.'" and estado!="eliminado" and estado!="inapropiado" and estado !="actualizado" ';
		if($UID){
			$sql_query .= ' and UID!='.$UID;
		}

		// die($sql_query);

		$result = $wpdb->get_results($sql_query,ARRAY_A);
		if(intval($result[0]['num'])==0) return true;
		else return false;
	}

	function newRoute($ruta){
		global $wpdb;


		$data = array('UID'=>$ruta['UID'],
					'editor'=>$ruta['editor'],
					'tipo_ruta'=>$ruta['params']['tipo_ruta'],
					's_address'=>$ruta['params']['s_address'],
					'e_address'=>$ruta['params']['e_address'],
					's_coord_lat'=>$ruta['params']['s_coord_lat'],
					's_coord_lng'=>$ruta['params']['s_coord_lng'],
					'e_coord_lat'=>$ruta['params']['e_coord_lat'],
					'e_coord_lng'=>$ruta['params']['e_coord_lng'],
					'features_json'=>$ruta['features_json'],
					'extras_json'=>$ruta['extras_json']
				);
		
		$data['extra_param_1'] = $ruta['params']['extra_param_1'];
		if($ruta['params']['s_ispoi']!="false") $data['s_ispoi'] = $ruta['params']['s_ispoi'];
		if($ruta['params']['e_ispoi']!="false") $data['e_ispoi'] = $ruta['params']['e_ispoi'];
		
		// die(json_encode(array('estado'=>'ERROR','ruta'=>$data)));

		$result =  $wpdb->insert('bcbm_ruta',$data);

		if($result) return $wpdb->insert_id;
		else false;
	}

	function getRouteBounds($UID_params,$es_uid){
		global $wpdb;
		
		if($es_uid){
			$sql_query = 'select s_coord_lat,s_coord_lng,e_coord_lat,e_coord_lng
							from bcbm_ruta where
							UID="'.$UID_params.'"';

			$result = $wpdb->get_results($sql_query,ARRAY_A);
			if(count($result)>0) return $result[0];
			else return null;
		}
		else{
		}

	}


	function getHistoryRoutes($user_id){
		global $wpdb;
		
		$sql_query = 'select r.s_address,r.e_address,r.s_ispoi,r.e_ispoi,
						r.extra_param_1,r.tipo_ruta,r.UID,h.ultima_consulta
						FROM bcbm_historial_ruta h inner join bcbm_ruta r
						on h.ruta_id=r.ruta_id
						WHERE h.user='.$user_id.' order by h.ultima_consulta desc';

		$result = $wpdb->get_results($sql_query,ARRAY_A);
		if(count($result)>0) return $this->indexResultSet($result,'UID');
		else return null;
	}

	function getRoute($UID_params,$es_uid=false){
		global $wpdb;
		
		if($es_uid){
			$sql_query = 'select ruta_id,tipo_ruta,s_address,e_address,s_coord_lat,
							s_coord_lng,e_coord_lat,e_coord_lng,extra_param_1,
							s_ispoi,e_ispoi,features_json,extras_json 
							from bcbm_ruta where
							UID="'.$UID_params.'"';
		}
		else{
			$sql_query = 'select ruta_id,UID,features_json,extras_json from bcbm_ruta where
				tipo_ruta = "'.$UID_params['tipo_ruta'] .'" and 
				s_address = "'.$UID_params['s_address'] .'" and 
				e_address = "'.$UID_params['e_address'] .'" and 
				abs(abs(s_coord_lat) - abs('.$UID_params['s_coord_lat'] .'))<1e-5 and 
				abs(abs(s_coord_lng) - abs('.$UID_params['s_coord_lng'] .'))<1e-5 and 
				abs(abs(e_coord_lat) - abs('.$UID_params['e_coord_lat'] .'))<1e-5 and 
				abs(abs(e_coord_lng) - abs('.$UID_params['e_coord_lng'] .'))<1e-5 and
				extra_param_1 = "'.$UID_params['extra_param_1'].'"';
		}

		$result = $wpdb->get_results($sql_query,ARRAY_A);
		// die(json_encode($result));
		if(count($result)>0) return $result[0];
		else return null;
	}

	function addHistoryRuta($ruta_id,$user_id){
		global $wpdb;

		$sql_query = 'SELECT count(1) as num FROM bcbm_historial_ruta WHERE ruta_id='.$ruta_id.' and user='.$user_id;
		$result = $wpdb->get_results($sql_query,ARRAY_A);

		if(intval($result[0]['num'])!=0){
			$sql_query = 'update bcbm_historial_ruta set contador=contador+1 WHERE ruta_id='.$ruta_id.' and user='.$user_id;
			$result = $wpdb->query($sql_query);
		}
		else{
			$data = array('ruta_id'=>$ruta_id,'user'=>$user_id,'contador'=>1);	
			$result =  $wpdb->insert('bcbm_historial_ruta',$data);
		}

		if($result) return true;
		else false;
	}

	function getFavorites($user_id,$es_admin,$blog_id){
		global $wpdb;
		$sql_query = 'SELECT u.UID FROM bcbm_poi_favorito f inner join bcbm_poi_uid u on f.poi_uid_id=u.poi_uid_id and f.user_id='.$user_id;
		
		$favoritosUID = $wpdb->get_results($sql_query,ARRAY_A);
		if(count($favoritosUID)==0) return null;
		else{
			$favoritos = array();
			$favoritosUID = $this->indexResultSet($favoritosUID,'UID');
			foreach ($favoritosUID as $key => $favorito){
				$poi_id = $this->getPoiID($key,$user_id,$es_admin,$blog_id);
				if($poi_id) $favoritos[$key] = $this->getPoiTiny($poi_id);
			}
			return $favoritos;
		}
	}

	function getPOIAdmin($user_id,$estados,$blog_id){
		global $wpdb;
		$sql_query = $this->getBaseQuery($user_id,true);
		$filtro = '';
		$filtro .= ' where estado in ("'. implode('","',$estados).'") ';
		$filtro .= ' and poi_id in (select poi_id from bcbm_poi_blog_admin where blog_id='.$blog_id.') ';
		$filtro .= $this->getPOIFilterCapa($user_id);
		// $filtro .= $this->getPOIFilterVersion($user_id,$es_admin,true); NO SE NECESITA
		$sql_query .= $filtro;
		// die($sql_query);
		$adminPOIUID = $wpdb->get_results($sql_query,ARRAY_A);
		
		if(count($adminPOIUID)==0) return null;
		else{
			return $this->indexResultSet($adminPOIUID,'UID');
		}
	}
}
?>