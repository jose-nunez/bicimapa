<?php 
/*
Plugin Name: Bicimapa
Plugin URI: 
Description: Convierte el sitio en Bicimapa.
Version: 1.0
Author: Bicicultura (José Núñez, Vincent Blanque, Miguel San Martín)
Author URI: www.bicicultura.cl
*/

/* DEFINE CONSTANTES */
define('BC_BM_URL',plugin_dir_url( __FILE__ ));
define('BC_BM_ADMIN_URL',get_admin_url() . 'admin.php?page=bicicultura-bicimapa/bicicultura-bicimapa.php');


require_once('bicimapa-map-services.php');

class Bicimapa{

	public $login_link;

	/************************************************************
	CONSTRUCTOR
	************************************************************/
	function Bicimapa(){

		global $bicimapaMapServices;

		$this->login_link = wp_login_url( apply_filters( 'the_permalink', get_permalink(get_option('bcbm_homeId')) ) );

		// Agrega menu de administración_________________________
		add_action('admin_menu', array($this, 'menu_principal'));
		
		// Agrega pagina principal_________________________
		add_filter('page_template',array($this, 'print_wall'));

		// Logo bicimapa en Login Page
		add_action('login_head', array($this,'my_custom_login_logo'));


		// Establece variables y servicios de sesion_________________________

		if(!session_id()) {
			session_start();
		}
		// add_action('wp_logout', array($this,'endSession'));
		// add_action('wp_login', array($this,'endSession'));

		add_action( 'wp_ajax_nopriv_setMapParams', array($this,'setMapParams'));  
		add_action( 'wp_ajax_setMapParams', array($this,'setMapParams'));

		add_action( 'wp_ajax_nopriv_setScreen', array($this,'setScreen'));  
		add_action( 'wp_ajax_setScreen', array($this,'setScreen'));

		add_action( 'wp_ajax_nopriv_getScreen', array($this,'getScreen')); 
		add_action( 'wp_ajax_getScreen', array($this,'getScreen'));

		// Servicios de comentarios _________________________
		add_action( 'wp_ajax_bcbm_add_comentario', array($this,'add_comentario'));
		add_action( 'wp_ajax_bcbm_delete_comentario', array($this,'delete_comentario'));
		
		add_action( 'wp_ajax_nopriv_bcbm_get_comentarios', array($this,'get_comentarios_ajax'));
		add_action( 'wp_ajax_bcbm_get_comentarios', array($this,'get_comentarios_ajax'));
		
		// Servicios de URL y compartir _________________________
		add_action( 'wp_ajax_nopriv_bcbm_share_mail', array($this,'shareMail'));
		add_action( 'wp_ajax_bcbm_share_mail', array($this,'shareMail'));

		// Servicios alerta inicio _________________________
		add_action( 'wp_ajax_nopriv_bcbm_set_user_signal', array($this,'setSignal'));
		add_action( 'wp_ajax_bcbm_set_user_signal', array($this,'setSignal'));
		add_action( 'wp_ajax_bcbm_set_bulk_signal', array($this,'setSignalBulk'));

		add_action( 'set_user_role', array($this,'mustCleanUserCachePoi')); // actualizar cache poi cuando cambian permisos de usuario

		add_action( 'wp_ajax_nopriv_bcbm_del_user_option', array($this,'deleteOption'));
		add_action( 'wp_ajax_bcbm_del_user_option', array($this,'deleteOption'));

		// Servicios de COLABORAR  _________________________
		add_action( 'wp_ajax_bcbm_uploadImgPOI', array($this,'uploadImgPOI'));
		
		add_action( 'wp_ajax_bcbm_do_action_poi', array($bicimapaMapServices,'doActionPOI'));
		
		add_action( 'wp_ajax_bcbm_new_poi', array($bicimapaMapServices,'newPOI'));

		// Servicios de mapa _________________________

		add_action( 'wp_ajax_nopriv_bcbm_get_route', array($bicimapaMapServices,'getRoute'));
		add_action( 'wp_ajax_bcbm_get_route', array($bicimapaMapServices,'getRoute'));
		
		add_action( 'wp_ajax_nopriv_bcbm_add_history_ruta', array($bicimapaMapServices,'addHistoryRuta'));
		add_action( 'wp_ajax_bcbm_add_history_ruta', array($bicimapaMapServices,'addHistoryRuta'));

		// // add_action( 'wp_ajax_nopriv_bcbm_get_zonas', array($bicimapaMapServices,'getZonas'));
		// // add_action( 'wp_ajax_bcbm_get_zonas', array($bicimapaMapServices,'getZonas'));
		// add_action( 'wp_ajax_nopriv_bcbm_get_zonas', array($this,'getZonas'));
		// add_action( 'wp_ajax_bcbm_get_zonas', array($this,'getZonas'));

		add_action( 'wp_ajax_nopriv_bcbm_get_capas_cache', array($bicimapaMapServices,'getCapasCache'));
		add_action( 'wp_ajax_bcbm_get_capas_cache', array($bicimapaMapServices,'getCapasCache'));
		add_action( 'wp_ajax_nopriv_bcbm_get_poi_zonas', array($bicimapaMapServices,'getPoiZonas'));
		add_action( 'wp_ajax_bcbm_get_poi_zonas', array($bicimapaMapServices,'getPoiZonas'));

		add_action( 'wp_ajax_nopriv_bcbm_get_poi', array($bicimapaMapServices,'getPOI'));
		add_action( 'wp_ajax_bcbm_get_poi', array($bicimapaMapServices,'getPOI'));
		
		add_action( 'wp_ajax_bcbm_check_poi_name', array($bicimapaMapServices,'chekPOIname'));
		
		add_action( 'wp_ajax_bcbm_set_favorite', array($bicimapaMapServices,'setFavorite'));

		add_action( 'wp_ajax_bcbm_get_favoritos', array($bicimapaMapServices,'getFavorites'));
		add_action( 'wp_ajax_bcbm_get_administrarpoi', array($bicimapaMapServices,'getPOIAdmin'));


		// ZONAS _________________________
		add_action( 'wp_ajax_bcbm_set_zonas_admin', array($bicimapaMapServices,'setZonasAdmin'));
		add_action( 'wp_ajax_bcbm_set_zonas_capa', array($bicimapaMapServices,'setZonasCapa'));
		

		// Funciones de URL_________________________
		// add_filter('query_vars', array($this,'parameter_queryvars'));
		// add_filter('rewrite_rules_array', array($this,'add_rewrite_rules'));

	}


	//Actualizar en cliente también!!
	function getVcard($user_id,$opt='all',$size=32){
		$user = get_userdata($user_id);
		$result = '';
		if($user->user_url) $result .= '<a href="'. $user->user_url .'" target="_blank">';
			$result .= $opt=='name'? '': get_avatar($user_id,$size);
			$result .= $opt=='pic'? '': '<span class="nombre_vcard">'.$this->user_name($user_id).'</span>';
		if($user->user_url) $result .= '</a>';

		return str_replace('\'','"',$result);
	}


	/************************************************************	
	Funciones de URL
	************************************************************/
	// function add_rewrite_rules($aRules){

	// 	// http://www.test2.mediart.cl/2.0.beta_3/map/13/-7859485.377593/-3954623.2080633/plaza%20italia,%20santiago/plaza%20ega%C3%B1a,%20santiago/SAFER

	// 	// $input = '\?zoom[^/]+&lon[^/]+&lat[^/]+&s_address[^/]+&e_address[^/]+&rtc_routeType[^/]+';
	// 	$input = 'map/([^/]+)/([^/]+)/([^/]+)/([^/]+)/([^/]+)/([^/]+)/?$';
	// 	$output = 'index.php?zoom=matches[0]&lon=matches[1]&lat=matches[2]&s_address=matches[3]&e_address=matches[4]&rtc_routeType=matches[5]';
	// 	$aNewRules = array($input=>$output);
	// 	$aRules = $aNewRules + $aRules;	

	// 	echo '<pre>';print_r($aRules);echo '</pre>';exit;

	// 	return $aRules;
	// }
	// function parameter_queryvars( $qvars ){	
	// 	array_push($qvars,'zoom');
	// 	array_push($qvars,'lon');
	// 	array_push($qvars,'lat');
	// 	array_push($qvars,'s_address');
	// 	array_push($qvars,'e_address');
	// 	array_push($qvars,'rtc_routeType');

	// 	// echo '<pre>';print_r($qvars);echo '</pre>';exit;


	// 	return $qvars;
	// }

	/************************************************************
	Home Bicimapa
	************************************************************/
	function print_wall($single_template) {
		global $post;

		// echo '<pre>';print_r($post);echo '</pre>';exit;

		$page_id = get_option('bcbm_homeId');
		if ($post->ID == $page_id) {
			$single_template = dirname( __FILE__ ) . '/app.php';
		}

		// else if($post->ID == '5'){
		else if($post->post_name == 'teststyle'){
			$single_template = dirname( __FILE__ ) . '/css_test.php';
		}
		return $single_template;
	}

	function my_custom_login_logo() {
    echo '<style type="text/css">
        	h1 a { 
        			background-image:url('.BC_BM_URL.'/img/logo.png) !important; 
        			background-size: 221px 100px !important;
        			height: 104px !important;
        		}
    	</style>';
	}


	/************************************************************
	Destruye sesion
	************************************************************/
	function endSession() {
		session_destroy();
	}

	/************************************************************
	Redirigir mapa AJAX
	************************************************************/
	function setScreen(){
		$screen = $_POST['keyScreen'];
		$_SESSION['screen'] = $screen;
		die('true');
	}

	function getScreen(){
		if(isset($_SESSION['screen'])) {
			$value = $_SESSION['screen'];
		} else {
			$value = '';
		}
		die($value);
	}


	function setMapParams(){
		$keyMap = $_POST['keyMap'];
		$_SESSION['keyMap'] = $keyMap;
		die('true');
	}

	function getMapParams(){
		if(isset($_SESSION['keyMap'])) {
			$value = $_SESSION['keyMap'];
		} else {
			$value = '';
		}
		return $value;
	}


	/************************************************************
	COLABORAR POI
	************************************************************/

	// function getZonas(){
		// die(json_encode($this->zonasPOI));
		// die('{"arica":{"zona_poi_id":"1","pais":"chile","nombre":"arica","noroeste":{"lat":"-17.4293","lng":"-70.5157"},"sudeste":{"lat":"-18.9063","lng":"-68.8074"},"capas":[{"nombre":"tallermecanicos","activa":"1"},{"nombre":"aires","activa":"1"},{"nombre":"biciestacionamientos","activa":"1"},{"nombre":"masvida","activa":"0"},{"nombre":"eventos","activa":"1"},{"nombre":"favoritos","activa":"1"}]},"iquique":{"zona_poi_id":"2","pais":"chile","nombre":"iquique","noroeste":{"lat":"-18.9063","lng":"-70.5157"},"sudeste":{"lat":"-20.9063","lng":"-68.2"},"capas":[{"nombre":"tallermecanicos","activa":"1"},{"nombre":"aires","activa":"1"},{"nombre":"biciestacionamientos","activa":"1"},{"nombre":"masvida","activa":"0"},{"nombre":"eventos","activa":"1"},{"nombre":"favoritos","activa":"1"}]},"antofagasta":{"zona_poi_id":"3","pais":"chile","nombre":"antofagasta","noroeste":{"lat":"-20.9063","lng":"-70.8"},"sudeste":{"lat":"-25.0358","lng":"-66.8079"},"capas":[{"nombre":"tallermecanicos","activa":"1"},{"nombre":"aires","activa":"1"},{"nombre":"biciestacionamientos","activa":"1"},{"nombre":"masvida","activa":"0"},{"nombre":"eventos","activa":"1"},{"nombre":"favoritos","activa":"1"}]},"copiapo":{"zona_poi_id":"4","pais":"chile","nombre":"copiapo","noroeste":{"lat":"-25.0358","lng":"-72"},"sudeste":{"lat":"-29.2672","lng":"-67.8076"},"capas":[{"nombre":"tallermecanicos","activa":"1"},{"nombre":"aires","activa":"1"},{"nombre":"biciestacionamientos","activa":"1"},{"nombre":"masvida","activa":"0"},{"nombre":"eventos","activa":"1"},{"nombre":"favoritos","activa":"1"}]},"coquimbo":{"zona_poi_id":"5","pais":"chile","nombre":"coquimbo","noroeste":{"lat":"-29.2672","lng":"-72"},"sudeste":{"lat":"-31.5317","lng":"-69.5215"},"capas":[{"nombre":"tallermecanicos","activa":"1"},{"nombre":"aires","activa":"1"},{"nombre":"biciestacionamientos","activa":"1"},{"nombre":"masvida","activa":"0"},{"nombre":"eventos","activa":"1"},{"nombre":"favoritos","activa":"1"}]},"losvilos":{"zona_poi_id":"6","pais":"chile","nombre":"losvilos","noroeste":{"lat":"-31.5317","lng":"-72"},"sudeste":{"lat":"-32.5329","lng":"-70.0214"},"capas":[{"nombre":"tallermecanicos","activa":"1"},{"nombre":"aires","activa":"1"},{"nombre":"biciestacionamientos","activa":"1"},{"nombre":"masvida","activa":"0"},{"nombre":"eventos","activa":"1"},{"nombre":"favoritos","activa":"1"}]},"santiago":{"zona_poi_id":"7","pais":"chile","nombre":"santiago","noroeste":{"lat":"-33.1422","lng":"-72"},"sudeste":{"lat":"-33.9308","lng":"-69.7179"},"capas":[{"nombre":"tallermecanicos","activa":"1"},{"nombre":"aires","activa":"1"},{"nombre":"biciestacionamientos","activa":"1"},{"nombre":"masvida","activa":"0"},{"nombre":"eventos","activa":"1"},{"nombre":"favoritos","activa":"1"}]},"valparaiso":{"zona_poi_id":"8","pais":"chile","nombre":"valparaiso","noroeste":{"lat":"-32.5329","lng":"-72"},"sudeste":{"lat":"-33.1422","lng":"-69.8676"},"capas":null}}');
	// }


	function readGPSinfoEXIF($image_full_name){
	   $exif=exif_read_data($image_full_name, 0, true);
	     if(!$exif || $exif['GPS']['GPSLatitude'] == '') {
	       return false;
		} 
		else{
			$lat_ref = 1;
			if($exif['GPS']['GPSLatitudeRef']=='S'){
				$lat_ref = -1;
			}
			$lat = $exif['GPS']['GPSLatitude'];
			list($num, $dec) = explode('/', $lat[0]);
			$lat_s = $num / $dec;
			list($num, $dec) = explode('/', $lat[1]);
			$lat_m = $num / $dec;
			list($num, $dec) = explode('/', $lat[2]);
			$lat_v = $num / $dec;
		 
		 	$lon_ref = 1;
			if($exif['GPS']['GPSLongitudeRef']=='W'){
				$lon_ref = -1;
			}

			$lon = $exif['GPS']['GPSLongitude'];
			list($num, $dec) = explode('/', $lon[0]);
			$lon_s = $num / $dec;
			list($num, $dec) = explode('/', $lon[1]);
			$lon_m = $num / $dec;
			list($num, $dec) = explode('/', $lon[2]);
			$lon_v = $num / $dec;
		 
			$gps_int = array('lat'=> $lat_ref * ($lat_s + $lat_m / 60.0 + $lat_v / 3600.0),'lng'=> $lon_ref * ($lon_s + $lon_m / 60.0 + $lon_v / 3600.0));
			return $gps_int;
			// return $exif;
		}
	}

	function uploadImgPOI(){

		try {
			$uploadDir = bcbm_getUploadDir(true);

			$prevFilename = $_GET['prevFilename'];

			if($prevFilename!=''){
				unlink($uploadDir.'/'.$prevFilename);
				unlink($uploadDir.'/thumb_'.$prevFilename);
			}

			require('lib/Simple-Ajax-Uploader-master/extras/Uploader.php');


			$sizeLimit = 10000; //KB

			$uploader = new FileUpload('uploadFile',$sizeLimit);

			$uploader->newFileName = uniqid().'.'.$uploader->getExtension();
			$uploader->allowedExtensions = array('jpg', 'jpeg', 'png', 'gif');
			
			$result = $uploader->handleUpload($uploadDir);

			if (!$result) { 
				die(json_encode(array('success' => false,'msg' => $uploader->getErrorMsg())));
			}
			else {
				$thumbName = 'thumb_'.$uploader->getFileName();
			
			
				$this->createthumb($uploadDir.'/'.$uploader->getFileName(),$uploadDir.'/'.$thumbName,140,140);

			// die(json_encode(array('success' => false,'msg' => 'hasta aqui todo bien?')));
				$gps = $this->readGPSinfoEXIF(bcbm_getUploadUrl(true).'/'. $uploader->getFileName());

				die(json_encode(
						array('success' => true,
							'filename' => $uploader->getFileName(),
							'url' => bcbm_getUploadUrl(true).'/',
							'gps' => $gps
				))); 
				 
			}
		} catch (Exception $e) {
			die(json_encode(array('success' => false,'msg' => $e->getMessage())));
		}

	}


	// http://davidwalsh.name/create-image-thumbnail-php
	// http://codelibrary.googleplus.co.in/create-thumbnail-image-by-php/
	function createthumb($source_image,$destination_image_url, $get_width, $get_height){
		ini_set('memory_limit','512M');
		set_time_limit(0);


		$image_array         = explode('/',$source_image);
		$image_name = $image_array[count($image_array)-1];
		$max_width     = $get_width;
		$max_height =$get_height;
		$quality = 100;

		//Set image ratio
		list($width, $height) = getimagesize($source_image);
		$ratio = ($width > $height) ? $max_width/$width : $max_height/$height;
		$ratiow = $width/$max_width ;
		$ratioh = $height/$max_height;
		$ratio = ($ratiow > $ratioh) ? $max_width/$width : $max_height/$height;

		if($width > $max_width || $height > $max_height) {
			$new_width = $width * $ratio;
			$new_height = $height * $ratio;
		} else {
			$new_width = $width;
			$new_height = $height;
		}

		if (preg_match("/.jpg/i","$source_image") or preg_match("/.jpeg/i","$source_image")) {
			//JPEG type thumbnail
			$image_p = imagecreatetruecolor($new_width, $new_height);	
// die(json_encode(array('success' => false,'msg' => 'hasta aqui todo bien?')));
			$image = imagecreatefromjpeg($source_image);
			imagecopyresampled($image_p, $image, 0, 0, 0, 0, $new_width, $new_height, $width, $height);
			imagejpeg($image_p, $destination_image_url, $quality);
			imagedestroy($image_p);

		} elseif (preg_match("/.png/i", "$source_image")){
			//PNG type thumbnail
			$im = imagecreatefrompng($source_image);
			$image_p = imagecreatetruecolor ($new_width, $new_height);
			imagealphablending($image_p, false);
			imagecopyresampled($image_p, $im, 0, 0, 0, 0, $new_width, $new_height, $width, $height);
			imagesavealpha($image_p, true);
			imagepng($image_p, $destination_image_url);

		} elseif (preg_match("/.gif/i", "$source_image")){
			//GIF type thumbnail
			$image_p = imagecreatetruecolor($new_width, $new_height);
			$image = imagecreatefromgif($source_image);
			$bgc = imagecolorallocate ($image_p, 255, 255, 255);
			imagefilledrectangle ($image_p, 0, 0, $new_width, $new_height, $bgc);
			imagecopyresampled($image_p, $image, 0, 0, 0, 0, $new_width, $new_height, $width, $height);
			imagegif($image_p, $destination_image_url, $quality);
			imagedestroy($image_p);

		} else {
			echo 'unable to load image source';
			exit;
		}
	}



	/************************************************************
	URL y Compartir
	************************************************************/

	function urlshorter(){

	}

	function shareMail(){
		$name = $_POST['name'];
		$from = $_POST['from'];
		$to = $_POST['to'];
		$message = $_POST['message'];
		$url = $_POST['url'];
		$tipo = $_POST['tipo'];

		$attachments = null; // próximamente se envía el screenshot


		$subject = '@nombre ha compartido @una @ruta contigo en Bicimapa.cl';
		
		$content = 
			'Recibiste este mensaje porque @nombre compartió @una @ruta contigo en Bicimapa.cl. Para @verla sigue el enlace a continuación<br/>'.
			'<a href="'.$url.'">'.$url.'</a><br/>'.
			'Dejó este mensaje para ti:<br/>'.
			'<div style="background:#96a4b5;color:white;padding:5px">'. $message .'</div>'.
			'No respondas este correo. Si quieres comunicarte con @nombre, hazlo desde '.
			'<a href="mailto:'.$from.'">aquí</a>';

		$subject = str_replace('@nombre',$name,$subject);
		$content = str_replace('@nombre',$name,$content);

		if($tipo == 'ruta'){
			$subject = str_replace('@una','una',$subject);
			$subject = str_replace('@ruta','ruta',$subject);

			$content = str_replace('@una','una',$content);
			$content = str_replace('@ruta','ruta',$content);
			$content = str_replace('@verla','verla',$content);
		}
		else{
			$subject = str_replace('@una','un',$subject);
			$subject = str_replace('@ruta',$tipo,$subject);

			$content = str_replace('@una','un',$content);
			$content = str_replace('@ruta',$tipo,$content);
			$content = str_replace('@verla','verlo',$content);
		}

		$headers = 'From: Bicimapa.cl <noresponder@bicicultura.cl>';

		add_filter( 'wp_mail_content_type', array($this,'set_html_content_type') );
  		$enviado = wp_mail($to, $subject, $content , $headers, $attachments);
  		remove_filter( 'wp_mail_content_type',array($this,'set_html_content_type'));

  		if($enviado) die('true');
  		else die('false');

	}

	function baseMessage($url,$message){

	}

	function set_html_content_type() {
		return 'text/html';
	}


	/************************************************************
	FACEBOOK GROUP
	************************************************************/
	// function getLastPosts(){
	// 	// This will return all the basic info and those will be in Json format, after decoding that we'll get some data
	// 	$group_id = '2204685680';
	// 	$url1 = 'https://graph.facebook.com/'.$group_id;
	// 	$des = json_decode(file_get_contents($url1));

	// 	// Now we have to pull the posts. For this we need to add feed at the end of the previous url , and the code will be like 
	// 	$url2 = "https://graph.facebook.com/{$group_id}/feed";
	// 	$data = json_decode(file_get_contents($url2));
	// 	// This will return last 25 wall post , we can get more if we want by using &limit=NUMBER .
	// 	// For the design lets write some css.
	// }


	/************************************************************
	Comentarios AJAX
	************************************************************/
	function delete_comentario(){
		$comment_id = $_POST['comment_id'];

		$comentario = get_comment($comment_id);
		if($comentario->user_id == get_current_user_id() || is_admin()){
			wp_delete_comment($comment_id);
		}
	}

	function user_name($user_id){
		$user = get_userdata($user_id);
		return ($user->display_name!=''? $user->display_name : ($user->user_nicename!=''? $user->user_nicename  : $user->user_login));
	}
	function user_email($user_id){
		$user = get_userdata($user_id);
		return $user->user_email;
	}
	function user_url($user_id){
		$user = get_userdata($user_id);
		return $user->user_url;
	}

	function user_data($user_id){
		$user = get_userdata($user_id);

												$rol ='invitado';
		if(is_user_logged_in()) 				$rol ='suscriptor';
		if(current_user_can('colaborar_poi')) 	$rol ='colab';
		if(current_user_can('admin_poi')) 		$rol ='admin';
		if(is_super_admin()) 					$rol ='superadmin';

		return array(
			'user_id' => $user_id,
			'user_name' => $this->user_name($user_id),
			'user_rol' => $rol,
			'user_email'=>$user->user_email,
			'user_url'=>$user->user_url
			,'user_avatar'=>get_avatar_url($user_id)
			// ,'user_Vcard'=>htmlentities($this->getVcard($user_id))
		);
	}

	function add_comentario(){

		$user = get_userdata(get_current_user_id());
		$author = $this->user_name(get_current_user_id());

		$texto = $_POST['text'];
		$comment_post_ID = $_POST['page'];
		$comment_parent = $_POST['parent'];

		$data = array(
			'comment_post_ID' => $comment_post_ID,
			'user_id' => $user->ID,
			'comment_content' => $texto,
			'comment_parent' => $comment_parent,
			'comment_author' => $author,
			'comment_author_email' => $user->user_email,
			'comment_author_url' => $user->user_url,
			'comment_author_IP' => $_SERVER['REMOTE_ADDR'],
			'comment_agent' => $_SERVER['HTTP_USER_AGENT']
		);

		$id = wp_insert_comment($data);
		die("$id");

	}
	
	function get_comentarios_ajax(){
		$page = $_POST['page'];
		die($this->get_comentarios($page));
	}

	function get_comentarios($page=1){

		// $perpage = get_option('bcbm_comments_per_page');
		$page_comments = get_option('page_comments');
		$perpage = get_option('comments_per_page');
		// $reverse_top_level = get_option('bcbm_comments_parent_asc');
		// $reverse_children = get_option('bcbm_comments_children_asc');
		$reverse_top_level = get_option('default_comments_page')=='newest'?false:true;
		$reverse_children = get_option('comment_order')=='desc'?false:true;

		//Hilos de comentarios
		$thread_comments = get_option('thread_comments');
		$thread_comments_depth = get_option('thread_comments_depth');


		$comments = get_comments(array(
			'post_id' => get_option('bcbm_homeId'),
			'status' => 'approve' //Change this to the type of comments to be displayed
		));

		ob_start();

		wp_list_comments(array(
			'per_page' => $page_comments?$perpage:'',
			'page' => $page,
			'reverse_top_level' => $reverse_top_level,
			'reverse_children'=> $reverse_children,
			'style'=>'div',
			'callback' =>array($this,'plantilla_comentario')
		), $comments);

		$resp = ob_get_contents();
		ob_end_clean();

		// TOTAL PAGINAS
		if($thread_comments && $thread_comments_depth>=2){
			$num_threads = get_comments(array('post_id' => get_option('bcbm_homeId'),'status' => 'approve','count' => true,'parent' => '0'));
			$total_pages =  floor($num_threads/$perpage);
			if($num_threads % $perpage >0) $total_pages++;
		}
		else{
			$total_pages =  floor(count($comments)/$perpage);
			if(count($comments) % $perpage >0) $total_pages++;
		}

		//GENERA LINKS
		$page_links = '';
		if($total_pages>1) $page_links = $this->paginate_links($total_pages,$page,3);

		$resp = '<a id="comentario_top_anchor"></a>'.$page_links . $resp . $page_links;

		return $resp;
	}

	function comment_form(){

		global $post;

		?>
		<?php if(is_user_logged_in()){ ?>
			<?= $this->getVcard(get_current_user_id(),'all',50); ?>
			<textarea id="txt_comentario" name="comment" cols="45" rows="8" aria-required="true"></textarea>

			<div id="reply_to_block" style="display:none">
				Responder a <strong><span id="reply_to_messaje"></span></strong>
				<button id="btn_unSetResponseComment" class="button tiny" onclick="javascript:biciMapaUI.unSetResponseComment()">Cancelar</button>
			</div>
			<button id="enviar_comentario" onclick="javascript:biciMapaUI.sendComment()" class="button small" >Publicar comentario</button>
			<input type="hidden" id="comment_post_ID" value="<?php echo $post->ID; ?>">
			<input type="hidden" id="comment_parent" value="0">	
		<?php }
		else{ ?> 
			<div class="must-log-in">
				<a href="<?php echo $this->login_link; ?>?src_screen=comments">Inicia sesión</a> para escribir un comentario.
			</div>
		<?php } ?> 
	<?php
	}

	
	function plantilla_comentario($comment, $args, $depth) {

		$GLOBALS['comment'] = $comment;
		extract($args, EXTR_SKIP);

		// echo '<pre>';print_r($comment);echo '</pre>';
		echo '<div class="comentario-box '.($args['has_children']? 'parent':'').'" id="comment-'. get_comment_ID() .'" >'; 

		if ($args['avatar_size'] != 0) echo '<div class="comment-profile-pic">'.$this->getVcard($comment->user_id,'pic').'</div>';
		echo '<div id="div-comment-'. get_comment_ID() .'" class="comment-body">';
			echo $this->getVcard($comment->user_id,'name');
			echo htmlentities(get_comment_text());

			echo '<div class="comment-sub-opt">';
				echo '<span class="subdate">';
					printf( __('%1$s at %2$s'), get_comment_date(),  get_comment_time());
				echo '</span>';
		
				if(is_user_logged_in() && $depth < $args['max_depth'])
				// if(is_user_logged_in())
				echo '<a onclick="biciMapaUI.setResponseComment('.$comment->comment_ID.',\''.$this->user_name($comment->user_id).'\')">Responder</a>';
				
				if(($comment->user_id == get_current_user_id() && get_option('bcbm_user_can_delete')) || current_user_can('moderate_comments'))
				// echo '<a onclick="javascript:biciMapaUI.deleteComment('.$comment->comment_ID.')">Borrar</a>';
				echo '<a onclick="javascript:biciMapaUI.confirmDeleteComment('.$comment->comment_ID.')">Borrar</a>';
			echo '</div>';

		echo '</div>';
	}


	function paginate_links ($total_pages, $current_page, $paginate_limit){
		$pages = $this->paginate_links_aux($total_pages, $current_page, $paginate_limit);
		$links = '<ul class="pagination">';

		$links .= '<li class="arrow'. ($current_page==1?' unavailable':'').'" >';
		$links .= '<a '.($current_page==1?'':'onclick="javascript:biciMapaUI.getCommentsPage('.($current_page-1).')"').'>&laquo;</a>';
		$links .= '</li>';

		foreach ($pages as $page) {
			if (isset($page['url'])) { 
				$links .= '<li>';
				$links .= '<a onclick="javascript:biciMapaUI.getCommentsPage('. $page['url'].')">'.$page['text'].'</a>';
				$links .= '</li> ';
			}
			else{
				$links .= '<li class="'.($page['text']==$current_page?'current':'unavailable').'" >';
				$links .= '<a>'.$page['text'].'</a>';
				$links .= '</li> ';
			}
		}

		$links .= '<li class="arrow'. ($current_page==$total_pages?' unavailable':'').'" >';
		$links .= '<a '.($current_page==$total_pages?'':'onclick="javascript:biciMapaUI.getCommentsPage('.($current_page+1).')"').'>&raquo;</a>';
		$links .= '</li>';
		
		$links .= '</ul>';

		return $links;
	}
	
	function paginate_links_aux ($total_pages, $current_page, $paginate_limit){
		// Array to store page link list
		$page_array = array ();
		// Show dots flag - where to show dots?
		$dotshow = true;
		// walk through the list of pages
		for ( $i = 1; $i <= $total_pages; $i ++ ){
			// If first or last page or the page number falls 
			// within the pagination limit
			// generate the links for these pages
			if ($i == 1 || $i == $total_pages || 
					($i >= $current_page - $paginate_limit && 
					$i <= $current_page + $paginate_limit) ){
				// reset the show dots flag
				$dotshow = true;
				// If it's the current page, leave out the link
				// otherwise set a URL field also
				if ($i != $current_page)
					// $page_array[$i]['url'] = $base_url . "?" . $query_str .	"=" . $i;
					$page_array[$i]['url'] = strval ($i);
				$page_array[$i]['text'] = strval ($i);
			}
			// If ellipses dots are to be displayed
			// (page navigation skipped)
			else if ($dotshow == true){
				// set it to false, so that more than one 
				// set of ellipses is not displayed
				$dotshow = false;
				$page_array[$i]['text'] = "&hellip;";
			}
		}
		// return the navigation array
		return $page_array;
	}

	/************************************************************
	BANNER 
	************************************************************/
	function getBanner(){
		$banner_opt = get_option('bcbm_banner');
		$bcbm_banner_url = get_option('bcbm_banner_url');
		$bcbm_banner_bgcolor = get_option('bcbm_banner_bgcolor');

		$bcbm_banner_link = get_option('bcbm_banner_link');
		if (substr($bcbm_banner_link,0,7)!= 'http://' && substr($bcbm_banner_link,0,8)!= 'https://'){
			$bcbm_banner_link = 'http://' . $bcbm_banner_link;
		}
		
		if($banner_opt =='adsbygoogle') {
			return 
				'<script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
				 <ins class="adsbygoogle" 
					style="display:inline-block;width:120px;height:600px"
					data-ad-client="ca-pub-4685691091335851"
					data-ad-slot="2425046826"></ins>
				<script>
				(adsbygoogle = window.adsbygoogle || []).push({});
				</script>';				
			
		}
		else if($banner_opt =='otro'){
			return '<div style="height:100%;width:100%;background-color:'.$bcbm_banner_bgcolor.';">'.
					'<iframe width="100%" height="auto" type="text/html" src="'. $bcbm_banner_url .'"></iframe>'.
					'</div>';
		}
		else{
			$media = get_post($banner_opt);
			if($media->post_mime_type=='image/gif' || $media->post_mime_type=='image/jpeg' ||
				$media->post_mime_type=='image/pjpeg' || $media->post_mime_type=='image/png' ||
				$media->post_mime_type=='image/svg+xml'){

				return '<div style="height:100%;width:100%;background-color:'.$bcbm_banner_bgcolor.';">'.
						($bcbm_banner_link!='http://'?'<a href="'. $bcbm_banner_link .'" target="_blank">':'').
						'<img src="'.$media->guid.'" />'.
						($bcbm_banner_link!='http://'?'</a>':'').
						'</div>';

			}
			else if($media->post_mime_type=='application/x-shockwave-flash'){
				return '<div style="height:100%;width:100%;background-color:'.$bcbm_banner_bgcolor.';">'.
						'<iframe width="100%" height="auto" type="text/html" src="'. $media->guid .'"></iframe>'.
						'</div>';
			}
		}
	}


	/************************************************************
	SEÑALES DE USUARIO. 'true','false' o num.
	************************************************************/
	// showalert: Alerta inicio
	// mustcleanallcache: Borrar TODA la cache
	// mustcleancacheroutes: Borrar cache de rutas de usuario
	// mustcleancachepoi: Borrar cache de POI de usuario
	// mustcleancachecapas: Borrar cache de POI de usuario
	
	function getSignals(){
		return  array(
			'showalert' => $this->getSignal('showalert'),
			'mustcleancacheroutes' => $this->getSignal('mustcleancacheroutes'),
			'mustcleanallcache' => $this->getSignal('mustcleanallcache'),
			'mustcleancachepoi' => $this->getSignal('mustcleancachepoi'),
			'mustcleanusercachepoi' => $this->getSignal('mustcleanusercachepoi'),
			'mustcleancachecapas' => $this->getSignal('mustcleancachecapas'),
		);
	}

	//Indica si la señal apunta a un usuario, independiente del dispositivo donde se conecte
	function isUserSignal($signal){
		return ($signal=='showalert');
	}

	//Indica si la señal apunta a un dispositivo, independiente del usuario que lo use
	function isDeviceSignal($signal){
		return ($signal=='mustcleancacheroutes'|| $signal=='mustcleancachepoi' || $signal=='mustcleancachecapas');
	}

	function isUserDeviceSignal($signal){
		return ($signal=='mustcleanusercachepoi');
	}

	//Indica si la señal apunta a un dispositivo, independiente del usuario que lo use
	// function isNetworkSignal($signal){
	// 	return ($signal=='mustcleancacheroutes'|| $signal=='mustcleancachepoi' || $signal=='mustcleancachecapas');
	// }


	function setSignalBulk(){
		if(!current_user_can('admin_poi')) die('Sin permisos');

		$signal = $_POST['signal'];
		$value = $_POST['value'];
		$network = $_POST['network'];

		if($network && is_super_admin()){
			foreach (wp_get_sites() as $key => $blog) {
				switch_to_blog($blog['blog_id']);
				if(($user_id=$this->setSignalBulk_aux($signal,$value))!=-1) die('No se pudo actualizar usuario '. intval($user_id) .' en blog '. $blog['domain']);
				restore_current_blog();
			}
			die(true);
		}
		else{
			if(($user_id=$this->setSignalBulk_aux($signal,$value))!=-1) die('No se pudo actualizar usuario '. intval($user_id));
			else die(true);
		}
	}

	function setSignalBulk_aux($signal,$value){

		if($this->isUserSignal($signal) || $this->isUserDeviceSignal($signal)){
			$usuarios = get_users();
			foreach ($usuarios as $usuario){
				if(!$this->setSignal_aux($signal,$value,$usuario->ID)) return $usuario->ID;
			}
		}
		if(!$this->setSignal_aux($signal,$value)) return 0;
		else return -1;
	}

	function setSignal(){
		$signal = $_POST['signal'];
		$value = $_POST['value'];
		$user_id = $_POST['user_id'];

		if(!$user_id || (!current_user_can('admin_poi') && $user_id!=get_current_user_id())) $user_id = get_current_user_id();
		else if(current_user_can('admin_poi') && $user_id==-1) $user_id = 0;

		if(!$this->setSignal_aux($signal,$value,$user_id)) die('No se pudo actualizar usuario '.$user_id);
		else die(true);
	}
	
	function setSignal_aux($signal,$value,$user_id=0){
		$nuevo = $value;
		
		if($user_id && ($this->isUserSignal($signal) || $this->isUserDeviceSignal($signal))){
			if($this->isUserDeviceSignal($signal) && $value=='true') $nuevo = genUID(20);
			
			if(get_user_option('bcbm_'.$signal,$user_id)!=$nuevo)
				return update_user_option($user_id,'bcbm_'.$signal,$nuevo);
			else return true;
		}
		else{
			if($value=='true') $nuevo = genUID(20);

			if(get_option('bcbm_'.$signal)!=$nuevo)
				return update_option('bcbm_'.$signal,$nuevo);
			else return true;
		}
	}

	function getSignal($signal){
		if(is_user_logged_in() && ($this->isUserSignal($signal) || $this->isUserDeviceSignal($signal))) 
			$value = get_user_option('bcbm_'.$signal);
		else  $value = get_option('bcbm_'.$signal);

		/*if(!$value) return 'false';
		else if($value=='false' || $value=='true') return $value;
		else return "'".$value."'";*/
		if(!$value || $value=='false') return false;
		else if($value=='true') return true;
		else return $value;
	}

	function mustCleanUserCachePoi($user_id,$role){
		$this->setSignal_aux('mustcleanusercachepoi','true',$user_id);
	}


	/************************************************************
	NOTICIAS 
	************************************************************/
	function get_feedImage($content,$alt){
		$img_url="";
		if($alt!='videosportada'){
			preg_match('/< *img[^>]*src *= *["\']?([^"\']*)["\']/i', $content, $matches);			
			if(count($matches)>1){
				$img_url=$matches[1];
				if(strlen(file_get_contents($img_url))==0){
					$img_url = 'http://www.bicicultura.cl'.$img_url; 
					if(strlen(file_get_contents($img_url))==0){
						$img_url ='';
					}
				}
			}
		}
		else{
			$img_url=$this->get_youtubeImage($content,$alt);
		}	
		return $img_url;
	}

	function get_youtubeImage($content,$alt){
		$pos_url= strpos($content,'http://www.youtube.com/v/')+25;
		$pos_par= strpos($content,'&')-1;
		$img_url= split('&',substr($content,$pos_url));
		$img_url= $img_url[0];
		return 'http://img.youtube.com/vi/'. $img_url.'/0.jpg';
	}

	function get_feeds($url,$tag){
		error_reporting(0); /*CUCHUFLETA*/
		// $url = 'http://www.bicicultura.cl/rss/tag/bicimapa2consejos';

		$rss = new DOMDocument();
		$rss->load($url);
		$feed = array();
		foreach ($rss->getElementsByTagName('item') as $node) {
			$title = $node->getElementsByTagName('title')->item(0)->nodeValue;
			$title = str_replace(' & ', ' &amp; ', $title);		
			$desc = $node->getElementsByTagName('description')->item(0)->nodeValue;
			$image = $this->get_feedImage($desc,$tag);
			$desc = strip_tags($desc);
			$desc = acortar($desc,100);
			$link = $node->getElementsByTagName('link')->item(0)->nodeValue;
			$date = $node->getElementsByTagName('pubDate')->item(0)->nodeValue;
			$date = date('l F d, Y', strtotime($date));
			// $image = $this->get_feedImage($link,$tag);

			array_push($feed,array('title'=>$title,'desc'=>$desc,'link'=>$link ,'date'=>$date,'image'=>$image));
		}

		error_reporting(E_ALL);/*CUCHUFLETA*/

		return $feed;
	}

	function getNoticias($tag='noticiaportada',$limit=99999){
		$url = 'http://www.bicicultura.cl/rss/tag/'.$tag;
		// $url = 'http://caa.org.nz/feed/';
		$consejos = $this->get_feeds($url,$tag);
		$this->plantillaNoticias($consejos,$limit);
	}
	
	function plantillaNoticias($consejos,$limit){
		for($i=0;$i<count($consejos) && $i<$limit;$i++) {
		// foreach ($consejos as $key => $consejo) {
			$consejo = $consejos[$i];
			if($i%4==0){ ?> <div class="row consejo-row"> <?php } ?>
			<div class="small-12 medium-6 large-3 columns">
				<!-- $this->plantillaNoticia($consejo); -->
				<a href="<?= $consejo['link']; ?>" target="_blank" title="<?= htmlentities($consejo['title']); ?>">
					<?php if($consejo['image']!=""){ ?>
						<div style="background-image:url(<?= $consejo['image']; ?>);background-position:center center;background-size:100%;height:60px"></div>
					<?php } ?>
					<div><?= $consejo['title']; ?></div>
				</a>
				<div class="subdate"><?= $consejo['date']; ?></div>
			</div>
		<?php if($i%4==3){?> </div> <?php }
		}

		if($i%4==3 || $i%4==2 || $i%4==1){ ?> 
			<div class="small-12 medium-6 large-3 columns"></div>
			<?php if($i%4==2){ ?> 
			<div class="small-12 medium-6 large-3 columns"></div><?php 
			} ?>
			<?php if($i%4==3){ ?> 
			<div class="small-12 medium-6 large-3 columns"></div><?php 
			} ?>
			</div> <?php 
		}
	}
	
	function getNoticiasHead($tag='noticiaportada',$limit=99999){
		$url = 'http://www.bicicultura.cl/rss/tag/'.$tag;
		$consejos = $this->get_feeds($url,$tag);
		$this->plantillaNoticiasHead($consejos,$limit);
	}

	function plantillaNoticiasHead($consejos,$limit){
		foreach ($consejos as $key => $consejo) { ?>
			<li><a href="<?= $consejo['link']; ?>" target="_blank" title="<?= htmlentities($consejo['title']); ?>">
				<strong><?= htmlentities($consejo['title']); ?></strong>
			</a></li> <?php 
		}
	}

	/************************************************************
	MENU DE ADMINISTRACIÓN 
	************************************************************/
	function menu_principal() {	
		add_menu_page('Bicimapa Instrucciones',
						'Bicimapa', 
						'administrator', 
						__FILE__, 
						array($this,'get_options')
						// ,plugins_url('/images/icon_20.png', __FILE__)
			);
		add_action('admin_init', array($this,'register_settings'));
	}

	function register_settings(){
		// Inicio
		register_setting('bcbm_setting', 'bcbm_homeId');

		// Comentarios
		// register_setting('bcbm_setting', 'bcbm_comments_per_page');
		register_setting('bcbm_setting', 'bcbm_banner');
		register_setting('bcbm_setting', 'bcbm_banner_url');
		register_setting('bcbm_setting', 'bcbm_banner_link');
		register_setting('bcbm_setting', 'bcbm_banner_bgcolor');

		register_setting('bcbm_setting', 'bcbm_road');
		register_setting('bcbm_setting', 'bcbm_satelite');

		// register_setting('bcbm_setting', 'bcbm_comments_parent_asc');
		// register_setting('bcbm_setting', 'bcbm_comments_children_asc');
		register_setting('bcbm_setting', 'bcbm_user_can_delete');
	}

	function get_options() {
		if ( !current_user_can( 'manage_options' ) )  {
			wp_die( __( 'You do not have sufficient permissions to access this page.' ) );
		}

		require_once('bicimapa-settings.php');
		$bicimapaSettings = new BicimapaSettings();
		$bicimapaSettings->displaySettings();

	}
}

/************************************************************
 INSTALACIÓN
************************************************************/
register_activation_hook( __FILE__,'bcbm_install');
function bcbm_install(){

		// Establece qué página es el HOME de Bicimapa.
		if(!get_option('bcbm_homeId')){
			// Se crea la página de inicio
			$post = array(
				'comment_status' => 'open',
				'post_author' => 1,
				'post_category' => array(),
				'post_status' => 'publish',
				'post_type' => 'page',
				'post_title' => 'Bicimapa Home',
				'post_content' => 'Esta página incluye la aplicación Bicimapa y también el muro de comentarios. El plugin se encarga de incluir el mapa y los controles. Por favor, deja esta página como está.'
			);
			$post_id = wp_insert_post($post);

			update_option('page_on_front',$post_id);
			add_option('bcbm_homeId',$post_id);
		}
		else{
			update_option('page_on_front',get_option('bcbm_homeId'));
		}
		update_option('show_on_front','page');

		
		// BANNER
		add_option('bcbm_banner','adsbygoogle');
		add_option('bcbm_banner_url','');
		add_option('bcbm_banner_link','');
		add_option('bcbm_banner_bgcolor','#ffffff');

		// FONDO DE TESELAS
		add_option('bcbm_road','mbp2');
		add_option('bcbm_satelite','mbps2');

		// COMENTARIOS
		// add_option('bcbm_comments_parent_asc',0);
		// add_option('bcbm_comments_children_asc',1);
		add_option('bcbm_user_can_delete',1);
		
		//DIRECTORIO DE IMAGENES
		$pic_main_dir = bcbm_getUploadDir();
		$pic_temp_dir = bcbm_getUploadDir(true);

		if(!is_dir($pic_main_dir)){
			mkdir($pic_main_dir,0755,true);
			if(!is_dir(pic_temp_dir)){
				mkdir($pic_temp_dir,0755,true);
			}
		}


		//PERMISOS DE USUARIOS
		$role = get_role('administrator');
		$role->add_cap('admin_poi',true);
		// if($role = get_role('colaborador_poi'))	$role->add_cap('colaborar_poi',true);


		//CONFIGURACIONES GENERALES
		update_option('users_can_register',1); //Registro de usuarios: cualquiera
		update_option('timezone_string','America/Santiago');// Zona Horaria: Chile
		update_option('comment_registration',1);// Registrarse para comentar

		update_option('page_comments',1);
		update_option('comments_per_page',10);
		update_option('thread_comments_depth','2');// Hilos de comentarios
		update_option('comment_order','desc');// Orden de comentarios mas recientes primero
		update_option('comments_notify',0);// Notificar Comentarios
		update_option('comment_whitelist',0);// Lista blanca de comentadores
		update_option('permalink_structure','/%postname%/');// Permalinks "bonitos"


		//BASE DE DATOS POI
		// $poi_db = new POI_DB();
		// $poi_db->install_db();

		//ZONA ADMIN POR DEFECTO 0|0|0
		global $wpdb;
		$wpdb->insert('bcbm_blog',array('blog_id'));
		$data = array('blog_id'=>get_current_blog_id(),'zona_poi_id'=>1);
		$wpdb->insert('bcbm_zonas_admin',$data);

}
register_deactivation_hook( __FILE__,'bcbm_unistall');
function bcbm_unistall(){
	
	// delete_option('bcbm_homeId'); // El ID de la página no se borra por si se desea reinstalar el Bicimapa y recuperar comentarios.
	
	// delete_option('bcbm_banner');
	// delete_option('bcbm_banner_url');
	// delete_option('bcbm_banner_link');
	// delete_option('bcbm_banner_bgcolor');
	// delete_option('bcbm_road');
	// delete_option('bcbm_satelite');
	
	delete_option('bcbm_comments_parent_asc');
	delete_option('bcbm_comments_children_asc');
	// delete_option('bcbm_user_can_delete');
	
	// update_option('page_on_front',0);
}

/************************************************************
 INICIALIZACIÓN
************************************************************/
add_action("init", "bcbm_init");
function bcbm_init() {
	global $bicimapaMapServices;
	$bicimapaMapServices = new BicimapaMapServices();

	global $bicimapa;
	$bicimapa = new Bicimapa();
}


/************************************************************
 UTILS
************************************************************/
function bcbm_getUploadDir($temp_dir=false){

	$upload_dir_sufix = '/bicicultura-bicimapa';

	if($temp_dir) $upload_dir_sufix .= '/tmp';

	// $upload_dir = wp_upload_dir();
	// if($upload_dir['error']){
	// 	$upload_dir['basedir'] = __DIR__ ;
	// }
	// return $upload_dir['basedir'] . $upload_dir_sufix;
	
	return WP_CONTENT_DIR . '/uploads' . $upload_dir_sufix; // CUCHUFLETA multisitio!!
}


function bcbm_getUploadUrl($temp_dir=false){
	$upload_dir_sufix = '/bicicultura-bicimapa';

	if($temp_dir) $upload_dir_sufix .= '/tmp';

	// $upload_dir = wp_upload_dir();		
	// if($upload_dir['error']){
	// 	$upload_dir['baseurl'] = BC_BM_URL;
	// }
	// return $upload_dir['baseurl'] . $upload_dir_sufix;
	
	return WP_CONTENT_URL . '/uploads' . $upload_dir_sufix; // CUCHUFLETA multisitio!!
}


function acortar($cadena, $limite, $corte=" ", $pad="...") {
    if(strlen($cadena) <= $limite)
        return $cadena;
    if(false !== ($breakpoint = strpos($cadena, $corte, $limite))) {
        if($breakpoint < strlen($cadena) - 1) {
            $cadena = substr($cadena, 0, $breakpoint) . $pad;
        }
    }
    return $cadena;
}

function formatear_tiempo($tiempo,$tipo){
	if($tipo=='horas'){
		$horas_raw = $tiempo;
		$horas = floor($horas_raw);
	}
	else if($tipo=='minutos'){
		$horas_raw = $tiempo/60;
		$horas = floor($horas_raw);
	}
	
	$minutos_raw = ($horas_raw-$horas)*60;
	$minutos = floor($minutos_raw);
	$segundos = round(($minutos_raw-$minutos)*60);
	return 
		(($horas!=0)?str_pad($horas,2,'0',STR_PAD_LEFT).' hrs. ' : '').
		(($minutos!=0)?str_pad($minutos,2,'0',STR_PAD_LEFT).' min. ' : '').
		(($segundos!=0)?str_pad($segundos,2,'0',STR_PAD_LEFT).' seg.' : '');
}

function genUID($length = 16) {
	$characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	$randomString = '';
	for ($i = 0; $i < $length; $i++) {
		$randomString .= $characters[rand(0, strlen($characters) - 1)];
	}
	return $randomString;
}

function get_avatar_url($user_id){
	$avatar = get_avatar($user_id,50);
	$avatar = str_replace('\'','"',$avatar);
    preg_match('/src="(.*?)"/i',$avatar, $matches);
    if($matches[1]) return $matches[1];
}

?>