<!DOCTYPE html>
<html>
	<head>
		<meta property="fb:admins" content="pepone.bike.rock"/>
		<meta property="fb:app_id" content="479992078748280" />
		<meta property="og:site_name" content="Bicimapa"/>
		<meta property="og:url" content="<?= site_url(); ?>/#"/>
		<meta property="og:type" content="website" />
		<meta property="og:title" content="Bicimapa.cl - Mapa para ciclistas urbanos" />
		<meta property="og:description" content="Rutas, ciclovías, talleres, estacionamienos y más."  />
		<meta property="og:image" content="<?= BC_BM_URL; ?>img/minifacebook2.png" />

		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<!-- <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
		<meta name="apple-mobile-web-app-capable" content="yes"> -->

		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<meta name="description" content="Somos Bicimapa y te mostrarmos donde encontrar ciclovías, biciestacionamientos y talleres de bici en Santiago." />

		<title>Bicimapa 2.0</title>
		<link href="<?= BC_BM_URL; ?>img/favicon.ico" type="image/x-icon" rel="shortcut icon" />

		<!-- loco loco -->
		<?php 
		// wp_head(); 
		?>
		<!-- loco loco -->

		
		<?php /* <!--
		<link rel="stylesheet" type="text/css" href="<?= BC_BM_URL; ?>lib/all.css">
		-->	*/ ?>
		
		<link href='//api.tiles.mapbox.com/mapbox.js/v1.6.0/mapbox.css' rel='stylesheet' />		
		<!-- 
		<link rel="stylesheet" type="text/css" href="<?= BC_BM_URL; ?>lib/leaflet/leaflet.css" />  
		-->
		<link rel="stylesheet" type="text/css" href="<?= BC_BM_URL; ?>lib/foundation/css/normalize.min.css">
		<link rel="stylesheet" type="text/css" href="<?= BC_BM_URL; ?>lib/foundation/css/foundation.min.css">
		<link rel="stylesheet" type="text/css" href="<?= BC_BM_URL; ?>lib/mapbox.css">
		<link rel="stylesheet" type="text/css" href="<?= BC_BM_URL; ?>lib/jquery-toastmessage/css/jquery.toastmessage.css">
		<link rel="stylesheet" type="text/css" href="<?= BC_BM_URL; ?>lib/jscrollpane/jquery.jscrollpane.css" >
		<link rel="stylesheet" type="text/css" href="<?= BC_BM_URL; ?>lib/fancybox/jquery.fancybox.css">		
		<link rel="stylesheet" type="text/css" href="<?= BC_BM_URL; ?>/lib/markercluster/MarkerCluster.css">
		<link rel="stylesheet" type="text/css" href="<?= BC_BM_URL; ?>/lib/markercluster/MarkerCluster.Default.css">
		<!--[if lte IE 8]><link rel="stylesheet" href="<?= BC_BM_URL; ?>/lib/markercluster/MarkerCluster.Default.ie.css" /><![endif]-->		
		<link rel="stylesheet" type="text/css" href="<?= BC_BM_URL; ?>css/style.css">

		<!-- ANALITYCS__________________________________________________________ -->
		<script type="text/javascript">

		  var _gaq = _gaq || [];
		  _gaq.push(['_setAccount', 'UA-42391432-1']);
		  _gaq.push(['_trackPageview']);

		  (function() {
			var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
			ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
			var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
		  })();

		</script>

	</head>
	<body>

		<!-- FACEBOOK JS SDK_________________________________________________________________________________________________-->
		<div id="fb-root"></div>
		<script>
			(function(d, s, id) {var js,fjs = d.getElementsByTagName(s)[0];if (d.getElementById(id)) return;js = d.createElement(s); js.id = id;
			js.src = "//connect.facebook.net/es_LA/all.js#xfbml=1&appId=479992078748280";fjs.parentNode.insertBefore(js, fjs);
			}(document, 'script', 'facebook-jssdk'));
		</script>

		<div id="menuprincipal" class="x_row">
			<nav class="top-bar" data-topbar>
				<ul class="title-area">
					<li class="name">
					</li>
					 <!-- Remove the class "menu-icon" to get rid of menu icon. Take out "Menu" to just have icon alone -->
					<li class="toggle-topbar menu-icon"><a href="#"><span>Menu</span></a></li>
				</ul>

				<section class="top-bar-section">
					<!-- Left Nav Section -->
					<ul class="left">
						<li>
							<!-- <img style="height:45px;" src="<?= BC_BM_URL; ?>img/logo.png"/> -->
							<img class="menulogo" src="<?= BC_BM_URL; ?>img/logo-bicimapa_2.png"/>
						</li>
					 	<li class="has-dropdown">
							<a class="menubutton" onclick="biciMapaUI.expandAll()"><img src="<?= BC_BM_URL; ?>img/expand.png"/></a>
							<ul class="dropdown">
					 			<li class="menubutton" ><a onclick="biciMapaUI.colapseAll()"><img src="<?= BC_BM_URL; ?>img/contract.png"/></a></li>
							</ul>
						</li>

						<li class="has-dropdown">
							<a>Rutas</a>
							<ul class="dropdown">
							 	<li><a onclick="biciMapaUI.setPantalla('main')" >Obtener</a></li>
								<li><a onclick="" >Favoritas</a></li>
								<li><a onclick="" >Mis rutas</a></li>
								<li id="dd_link_detalleRutaTab"><a onclick="biciMapaUI.setPantalla('instrucciones')">Instrucciones</a></li>
								<!-- <li class="has-dropdown">
									<a>Mis Rutas</a>
									<ul class="dropdown">
								 		<li><a>Favoritos</a></li>
										<li><a>Mis rutas</a></li>
										<li><a>Tus rutas</a></li>
									</ul>
								</li> -->
							</ul>
						</li>

						<li class="has-dropdown">
							<a>Lugares</a>
							<ul id="lugaresdropdown" class="dropdown">
								<li><a onclick="biciMapaUI.setPantalla('filtroCapasPOI')">Capas</a></li>
								<li><a onclick="biciMapaUI.setPantalla('colaboraPOI')">Añadir lugar de interés</a></li>
								<?php if(current_user_can('admin_poi') || current_user_can('colaborar_poi')){ ?><li><a onclick="biciMapaUI.setPantalla('administrarpoi')">Administrar</a></li><?php } ?>
								<li><a onclick="biciMapaUI.initDisplayPOI()">Buscar</a></li>
								<?php /*QUITADA DE THEDOORS*/ if(current_user_can('admin_poi')){ ?><li><a onclick="biciMapaUI.setPantalla('dibujarzonas')">Dibujar Zonas</a></li><?php  } ?>
							</ul>
						</li>
						<li><a data-reveal-id="modalConsejos" data-reveal>Biciactivismo</a></li>
						<li><a onClick="biciMapaUI.initComments()"><img src="<?= BC_BM_URL; ?>img/icon-menu-consejos-on.png"/></a></li>
						<li><a href="http://www.facebook.com/centrobicicultura" target="_blank" ><img src="<?= BC_BM_URL; ?>img/facebook.png"/></a></li>
						<li><a href="http://www.twitter.com/bicicultura" target="_blank" ><img src="<?= BC_BM_URL; ?>img/twitter.png"/></a></li>
					</ul>
					<!-- Right Nav Section -->
					<ul class="right">
						<li <?= is_user_logged_in()?'class="has-dropdown"':''?> >
							<?php if(is_user_logged_in()){ ?>
									<?=get_avatar(get_current_user_id(),45); ?>
								<ul class="dropdown">
									<li>
										<label><?=$bicimapa->user_name(get_current_user_id());?></label>
									</li>
									<li>
										<li><a href="<?= wp_logout_url(apply_filters('the_permalink',get_permalink())) ?>">Cerrar sesión</a></li>
									</li>
								</ul>
							<?php } else{ ?>
								<a href="<?= $bicimapa->login_link; ?>">Inicia sesión</a>
							<?php }	?>
						</li>

						<li class="has-dropdown">
							<a>Santiago</a>
							<ul class="dropdown">
								<li><a onclick="">Antofagasta</a></li>
								<li><a onclick="">Valparaiso</a></li>
								<li><a onclick="">Rancagua</a></li>
								<li><a onclick="">Talca</a></li>
								<li><a onclick="">Concepción</a></li>
								<li><a onclick="">Temuco</a></li>
								<li><a onclick="">Más ciudades...</a></li>
							</ul>
						</li>

					</ul>
				</section>
			</nav>
		</div>

		<div id="principal" class="x_row">
			<!-- PANEL DE CONTROLES__________________________________________________________________________________________-->
			<div id="controles" class="x_col" style="display:none">
				<?php /*
				<div id="mainlogo" class="text-center x_row">
					<img src="<?= BC_BM_URL; ?>img/logo-bicimapa.png"/>
					<a data-reveal-id="modalAlerta" data-reveal>BETA</a>
				</div>
				*/ ?>
				<!-- MENU PRINCIPAL __________________________________________________________________________________________-->
				<div id="pestanasWrap" class="off-canvas-wrap x_row">
					<div class="inner-wrap">
						<dl data-tab style="display:none">
							<dd><a id="link_rutaTab" href="#rutaTab">Obtener ruta</a></dd>
							<dd><a id="link_historalRutaTab" href="#historalRutaTab">Historial de rutas</a></dd>
							<dd><a id="link_detalleRutaTab" href="#detalleRutaTab"><li>Detalle de ruta</li></a></dd>
							<dd><a id="link_capasPOITab" href="#capasPOITab"><li>Filtrar mapa</li></a></dd>
							<dd><a id="link_favoritosTab" href="#favoritosTab"><li>Favoritos</li></a></dd>
							<dd><a id="link_poiTab" href="#poiTab"><li>Añadir punto de interés</li></a></dd>
							<dd><a id="link_adminPOITab" href="#adminPOITab"><li>Administrar POI</li></a></dd>
							<!-- QUITADA DE THEDOORS --><dd><a id="link_drawZonasTab" href="#drawZonasTab"><li>Dibujar Zonas</li></a></dd> 
						</dl>
						<div id="tabs_wrapper" class="tabs-content scroll-y x_row">
							<!-- FORMULARIO RUTA __________________________________________________________________________________________-->
							<div class="content active" id="rutaTab">
								<div class="menu_title">Obtener ruta</div>
								<!-- <h1 class="menu_title">Obtener ruta</h1> -->
								<!-- <div class="clearfix">
									<a class="menu_detalle_ruta historial left" href="#" onclick="biciMapaUI.setPantalla('historial')" >Historial</a>
									<a class="menu_detalle_ruta detalle right" style="display:none;" href="#" onclick="biciMapaUI.setPantalla('instrucciones')" >Detalle de ruta</a>
								</div> -->
								<div class="menu_ruta">
									<img id="centerRoute" title="Centrar" onclick="biciMapaUI.centerRoute()" src="<?= BC_BM_URL; ?>img/find-icon.png" data-tooltip data-options="disable_for_touch:true" class="tip-bottom"/>
									
									<img id="enrutar" title="Buscar ruta" onClick="biciMapaUI.getRuta()" src="<?= BC_BM_URL; ?>img/center_route.png" data-tooltip data-options="disable_for_touch:true" class="tip-bottom"/>
									<img id="reEnrutar" title="Buscar ruta" onClick="biciMapaUI.reGetRuta()" src="<?= BC_BM_URL; ?>img/center_route.png" data-tooltip data-options="disable_for_touch:true" class="tip-bottom"/>
									
									<img id="favouriteRoute" title="Añadir ruta a favoritos" src="<?= BC_BM_URL; ?>img/heart.png" data-tooltip data-options="disable_for_touch:true" class="tip-bottom"/>
									<img id="btn_ruta_share" title="Compartir" src="<?= BC_BM_URL; ?>img/share-icon.gif" data-tooltip data-options="disable_for_touch:true" class="tip-bottom"/>
									<img id="editarRuta" title="Editar" onClick="biciMapaUI.setRoutingMode('draw')" src="<?= BC_BM_URL; ?>img/edit.png" style="display:none" data-tooltip data-options="disable_for_touch:true" class="tip-bottom"/>
									<img id="limpiarMapa" title="Limpiar" onclick="biciMapaUI.cleanRoute()" src="<?= BC_BM_URL; ?>img/clean-marker.png" data-tooltip data-options="disable_for_touch:true" class="tip-bottom" />
									
									<img id="manualedit" title="Edición manual" onclick="biciMapaUI.editingRuta.set(true)" src="<?= BC_BM_URL; ?>img/edit.png" data-tooltip data-options="disable_for_touch:true" class="tip-bottom"/>
									<img id="manualedit_cancel" title="Terminar" onclick="biciMapaUI.editingRuta.set(false)" src="<?= BC_BM_URL; ?>img/edit.png" style="display:none" data-tooltip data-options="disable_for_touch:true" class="tip-bottom"/>
									<img id="cleanAreaRoute" title="Borrar area" onclick="biciMapaUI.setRemoveVertexRuta.set(true)" src="<?= BC_BM_URL; ?>img/square.png" data-tooltip data-options="disable_for_touch:true" class="tip-bottom"/>
									<img id="cleanAreaRoute_cancel" title="Terminar" onclick="biciMapaUI.setRemoveVertexRuta.set(false)" src="<?= BC_BM_URL; ?>img/square.png" style="display:none" data-tooltip data-options="disable_for_touch:true" class="tip-bottom"/>

								</div>
								<div class="boxruta_param boxruta_find">
									<label><input id="autoRouting" type="checkbox" checked="checked" > Ruta automática</label>
									<label><input id="multiDefault" type="checkbox" checked="checked" > Multidestino rápido</label>
									<label><input id="interDefault" type="checkbox" checked="checked" > Click para agregar destino</label>
								</div>
								<div class="boxruta_draw">
									<input id="UID_ruta" type="hidden" value="" />  
									<input id="txt_nombreRuta" placeholder="Nombre..." type="text" />
									<label><input id="rutapublica" type="checkbox" >Ruta pública</label>
									<!-- <input id="txt_tagsRuta" placeholder="Etiquetas (separadas por coma)" type="text" /> -->
									<!-- <textarea id="txt_notesRuta" placeholder="Notas..." ></textarea> -->
									<!-- <label><input id="rutaeditpublica" type="checkbox" > Sólo yo puedo modificar esta ruta</label> -->
								</div>
								<div id="distaciaruta" style="text-align:center"></div>
								<ul id="itinerario" class="listaBoxMarker">
  								</ul>
								<ul id="newParam" class="listaBoxMarker">
								</ul>
								<div id="extraparamsRuta" class="boxruta_param boxruta_find">
									<label class="radio"><input type="radio" name="extra_param_1" value="segura" checked >Ruta segura</label>
									<label class="radio"><input type="radio" name="extra_param_1" value="directa">Ruta directa</label>
								</div>

								<div id="labelruta" style="text-align:center"></div>
								<div id="creditruta" style="text-align:center"></div>

								<!-- <div class="center boxruta_find">
									<button id="enrutar" style="display:none" class="button tiny" onClick="biciMapaUI.getRuta()">
										Buscar ruta
									</button>
									<button id="editarRuta" class="button tiny" style="display:none" onClick="biciMapaUI.setRoutingMode('draw')">
										Personalizar
									</button>
									<button id="limpiarMapa" class="button tiny" onClick="biciMapaUI.cleanRoute()">
										Borrar
									</button>
								</div> -->
								<!-- <div class="center boxruta_draw">
									<button id="guardarRuta" class="button tiny" onClick="">
										Guardar
									</button>
									<button id="cancelEditarRuta" class="button tiny" onClick="biciMapaUI.setRoutingMode('find')">
										Cancelar
									</button>
								</div> -->
								<div class="menu_ruta boxruta_draw">
									<img id="guardarRuta" title="Guardar" onclick="biciMapaUI.saveRuta()" src="<?= BC_BM_URL; ?>img/save.png" data-tooltip data-options="disable_for_touch:true" class="tip-bottom"/>
									<img id="adjuntarRuta" title="Guardar y adjuntar" onclick="biciMapaUI.saveRuta(true)" src="<?= BC_BM_URL; ?>img/save.png" data-tooltip data-options="disable_for_touch:true" class="tip-bottom"/>
									<img id="cancelEditarRuta" title="Cancelar" onclick="biciMapaUI.cancelDrawRuta()" src="<?= BC_BM_URL; ?>img/cancel.png" data-tooltip data-options="disable_for_touch:true" class="tip-bottom"/>
								</div>
							</div>
							<!-- DETALLE RUTA __________________________________________________________________________________________-->
							<div class="content" id="detalleRutaTab">
								<h1 class="menu_title">Ruta</h1>
								
								<div class="clearfix">
									<a class="menu_detalle_ruta nueva left" href="#" onclick="biciMapaUI.setPantalla('main')" >Obtener ruta</a>
									<a class="menu_detalle_ruta historial right" href="#" onclick="biciMapaUI.setPantalla('historial')" >Historial</a>
								</div>
								
								<div class="boxruta_param detalle">
									<a id="findStart" href="#" class="lbl_ruta" onClick="biciMapaUI.findStart()">
										<img id="img_detalle_iniruta_" class="iconpoi default" />
										<span id="lbl_iniruta"></span>
									</a>
									<a id="findEnd" href="#" class="lbl_ruta" onClick="biciMapaUI.findEnd()">
										<img id="img_detalle_finruta_" class="iconpoi default" />
										<span id="lbl_finruta"></span>
									</a>
									<p id="lbl_extra_param_1"></p>
									<div class="menu_ruta">
										<img data-tooltip data-options="disable_for_touch:true" class="tip-top" title="Restablecer y centrar" onclick="biciMapaUI.centerRoute()" src="<?= BC_BM_URL; ?>img/center_route.png" />
										<!-- <img data-tooltip data-options="disable_for_touch:true" class="tip-top" title="Añadir a favoritos" src="<?= BC_BM_URL; ?>img/heart.png"/> -->
										<img id="btn_ruta_share" data-tooltip data-options="disable_for_touch:true" class="tip-top" title="Compartir" src="<?= BC_BM_URL; ?>img/share-icon.gif"/>
										<!-- <img data-tooltip data-options="disable_for_touch:true" class="tip-top" title="Editar ruta" src="<?= BC_BM_URL; ?>img/edit.png"/> -->
										<img data-tooltip data-options="disable_for_touch:true" class="tip-top" title="Limpiar" onclick="biciMapaUI.cleanRoute(true)" src="<?= BC_BM_URL; ?>img/clean-marker.png" />
									</div>
								</div>
								<div id="resumenRuta" class="rutaExtras">
								</div>
							</div>
							<!-- HISTORIAL RUTA __________________________________________________________________________________________-->
							<div class="content" id="historalRutaTab">
								<h1 class="menu_title">Historial</h1>

								<div class="clearfix">
									<a class="menu_detalle_ruta nueva left" href="#" onclick="biciMapaUI.setPantalla('main')" >Obtener ruta</a>
									<a class="menu_detalle_ruta detalle right" style="display:none;" href="#" onclick="biciMapaUI.setPantalla('instrucciones')" >Detalle de ruta</a>
								</div>
								<?php if(!is_user_logged_in()){ ?>
									<div class="must-log-in">
										<a href="<?= $bicimapa->login_link; ?>">Inicia sesión</a> para ver tu historial.
									</div>
								<?php } ?>
								<div class="content" id="historalWrapp">
								</div>
							</div>
							<!-- CAPAS POI __________________________________________________________________________________________-->
							<div class="content" id="capasPOITab">
								<h1 class="menu_title">Filtrar mapa</h1>
								<div class="content" id="capasPOIWrapp">
								</div>
							</div>
							<!-- FAVORITOS POI __________________________________________________________________________________________-->
							<div class="content" id="favoritosTab">
								<h1 class="menu_title">Favoritos</h1>
								<?php if(!is_user_logged_in()){ ?>
									<div class="must-log-in">
										<a href="<?= $bicimapa->login_link; ?>">Inicia sesión</a> para ver tus favoritos.
									</div>
								<?php } else{ ?>
								<div class="clearfix">
									<a class="menu_detalle_ruta left" href="#" onclick="biciMapaUI.initNuevoPOI('favoritos'); " >Nuevo favorito</a>
								</div>
								<div class="content" id="favoritosWrapp">
								</div>
								<?php }?>
							</div>
							<!-- ADMINISTRAR POI __________________________________________________________________________________________-->
							<?php if(current_user_can('admin_poi') || current_user_can('colaborar_poi')){ ?>
							<div class="content" id="adminPOITab">
								<h1 class="menu_title">Administrar</h1>
								<div class="content" id="administrarpoiWrapp">
								</div>
							<?php /* 
								
								<?php if(current_user_can('admin_poi')){ ?>
									<div class="text-center">
										<h4>Moderar</h4>
										<p id="counter_moderar"></p>
										<a onclick="biciMapaOBJ.findAdminPOI('moderar','actual')">
											<img id="img_admin_moderar_" class="iconpoi state" />
											<span id="name_admin_moderar"></span>
										</a>
										<span id="msj_admin_moderar"></span>
										<br/>
										<a id="prev_moderar" onclick="biciMapaOBJ.findAdminPOI('moderar',true)">&lt;&lt; Anterior </a> 
										<a id="next_moderar" onclick="biciMapaOBJ.findAdminPOI('moderar')">Siguiente &gt;&gt;</a>
									</div>
								<?php } ?>
								<div class="text-center">
									<h4>Inválidos</h4>
									<p id="counter_invalido"></p>
									<a onclick="biciMapaOBJ.findAdminPOI('invalido','actual')">
										<img id="img_admin_invalido_" class="iconpoi state" />
										<span id="name_admin_invalido"></span>
									</a>
									<span id="msj_admin_invalido"></span>
									<br/>
									<a id="prev_invalido" onclick="biciMapaOBJ.findAdminPOI('invalido',true)">&lt;&lt; Anterior </a> 
									<a id="next_invalido" onclick="biciMapaOBJ.findAdminPOI('invalido')">Siguiente &gt;&gt;</a>
								</div>
								<div class="text-center">
									<h4>Validar</h4>
									<p id="counter_validar"></p>
									<a onclick="biciMapaOBJ.findAdminPOI('validar','actual')">
										<img id="img_admin_validar_" class="iconpoi state" />
										<span id="name_admin_validar"></span>
									</a>
									<span id="msj_admin_validar"></span>
									<br/>
									<a id="prev_validar" onclick="biciMapaOBJ.findAdminPOI('validar',true)">&lt;&lt; Anterior </a> 
									<a id="next_validar" onclick="biciMapaOBJ.findAdminPOI('validar')">Siguiente &gt;&gt;</a>
								</div>
							*/ ?>
							</div>
							<?php } ?>
							<!-- POI FORM __________________________________________________________________________________________-->
							<div class="content" id="poiTab">
								<h1 class="menu_title"></h1>
								<!-- <h4 id="titulo_colaborar">Nuevo punto de interés</h4> -->
								<?php if(is_user_logged_in()){ ?>
										<div class="text-center">
											<select id="selecttipoPOI">
											</select>
										</div>

										<div class="text-center">
											<span id="rutadjunta" style="display:none" >Ruta adjunta 
												(<a onclick="biciMapaUI.attachRoute.unAttach(true)">Quitar</a>)
											</span>
										</div>


										<ul id="newPOIcontainer" class="listaBoxMarker">
										</ul>

										<input id="txt_nombrePOI" placeholder="Nombre..." type="text" />

										<h4>Foto del lugar</h4>
											<input type="button" id="subirImagen" value="Subir" class="button small"></input>
											<div id="progress" style="height:20px;background:orange;width:0%"></div>
											<div id='thumbNewPOI' style="width:220px;text-align:center;"></div>
										
										<h4 id="titulo_servicios">Otros servicios:</h4>
										<div id="capas_secundarias">
										</div>

										<div id="atributosCapa"></div>

										<label id="lbl_esRepresentante"><input id="esRepresentante" type="checkbox" > Sólo yo puedo modificar esta información</label>

										<input id="txt_iconPOI" placeholder="Ícono (habilitado)..." type="text" />

										<div class="menu_ruta">
											<img id="enviarPOI" title="Guardar lugar" onclick="biciMapaUI.validarColaboraForm()" src="<?= BC_BM_URL; ?>img/save.png" data-tooltip data-options="disable_for_touch:true" class="tip-bottom"/>
											<!-- <img id="limpiarPOI" title="Limpiar" onclick="biciMapaUI.limpiarColaboraForm(true)" src="<?= BC_BM_URL; ?>img/cancel.png" data-tooltip data-options="disable_for_touch:true" class="tip-bottom"/> -->
											<img id="limpiarPOI" title="Limpiar" onclick="biciMapaUI.cancelColaboraForm()" src="<?= BC_BM_URL; ?>img/cancel.png" data-tooltip data-options="disable_for_touch:true" class="tip-bottom"/>
										</div>
								<?php
								} 
								else{ ?>
									<div class="must-log-in">
										<a href="<?= $bicimapa->login_link; ?>">Inicia sesión</a> para colaborar.
									</div>	
								<?php 
								}
								?>
							</div>
							<!-- COMENTARIOS __________________________________________________________________________________________-->
							<div class="content" id="comentariosTab">
								<h1 class="menu_title">Comentarios</h1>
								<!-- <div class="fb-comments" data-href="http://www.bicimapa.cl" data-mobile="true" data-width="235" data-numposts="5" data-colorscheme="light"></div> -->
								<?php /*
								<?php $bicimapa->comment_form(); ?>
								<div id="comentarios_list">
									<?= $bicimapa->get_comentarios(); ?>
								</div> 
								*/ ?>
							</div>
							<!-- DIBUJAR ZONAS __________________________________________________________________________________________-->
							<?php  if(current_user_can('admin_poi') || is_super_admin()){ ?>
							<div class="content" id="drawZonasTab">
								<h1 class="menu_title">Dibujar Zonas</h1>
								<p id="total_zonas" style="font-weight: bold">Total zonas: 0</p>
								<label id=""><input id="drawModeLabel" type="checkbox" checked="true">Mostrar etiquetas</label>
								<label id=""><input id="drawModeTransp" type="checkbox" checked="true">Permitir transparencia</label>
								<label id=""><input id="drawMode" type="checkbox" checked="true">Click para dibujar</label>
								<label id=""><input id="drawModeDelete" type="checkbox" checked="true">Click para borrar</label>
								<input id="zDrawZonas" placeholder="Z" type="number" value="8">
								<button id="drawZonasGet" class="button small" onClick="biciMapaUI.getDisplayZonasList()">
									Listado
								</button>
								<button class="button small" onClick="biciMapaUI.inputDisplayZonas()">
									Ingresar
								</button>
								<button id="drawZonasLimpiar" class="button small" onClick="biciMapaUI.limpiarDisplayZonas()" >
									Borrar todo
								</button>
								<button class="button small" onClick="biciMapaOBJ.displayZonasBounds()" >
									Pantalla
								</button>
								<button class="button small" onClick="biciMapaOBJ.displayZonasRuta()" >
									Ruta
								</button>
								<button class="button small" onClick="biciMapaOBJ.displayZonasBounds(false,true)" >
									Marcadores
								</button>
								<div class="text-center">
									<select id="selectCapaDrawZonas"></select>
									<button id="drawZonasCapas" class="button small" onClick="biciMapaUI.displayZonasCapa()" >
										Pintar capa
									</button>
									<?php  if(is_super_admin()){ ?>
									<button id="setZonasCapas" class="button small" onClick="biciMapaUI.confirmSetZonasCapa()" >
										Asignar
									</button>
									<?php }  ?>
								</div>
								<div class="text-center">
									<button id="drawZonasAdmin" class="button small" onClick="biciMapaUI.displayZonasAdmin()" >
										Pintar admin
									</button>
									<?php  if(is_super_admin()){ ?>
									<button id="setZonasAdmin" class="button small" onClick="biciMapaUI.confirmSetZonasAdmin()" >
										Asignar
									</button>
									<?php }  ?>
								</div>
							</div>
							<?php }  ?>
						</div>
					</div>
				</div>
			</div>
			<!-- MAPA_____________________________________________________________________________________________________-->
			<div id="rightside" class="x_col" style="left:0px">
				<div id="map-content" class="x_row">
					<div id="map-area" class="x_col">
						<div id="map-logo" style="display:none" class="flotante"><img src="<?= BC_BM_URL; ?>img/logo.png"/></div>
						
						<div id="ocultar-controles" class="flotante mostrar-left" onClick="biciMapaUI.switchControles()"></div>
						<div id="ocultar-banner" class="flotante ocultar-right" onClick="biciMapaUI.switchBanner()"></div>

						<div id="loading-box" class="flotante flotante-izquierda">
							<a data-tooltip data-options="disable_for_touch:true" class="tip-right" title="Actualizar información" id="reload" onClick="biciMapaOBJ.reLoadCapas()">
								<img class="loadbtn" src="<?= BC_BM_URL; ?>img/reload.png" />
							</a>
							<a data-tooltip data-options="disable_for_touch:true" class="tip-right" title="Cargando información" id="load_green" style="display:none;">
								<img class="loadbtn" src="<?= BC_BM_URL; ?>img/loading_green.gif" />
							</a>
							<a data-tooltip data-options="disable_for_touch:true" class="tip-right" title="Cargando MUCHA información" id="load_red" style="display:none;">
								<img class="loadbtn" src="<?= BC_BM_URL; ?>img/loading_red.gif" />
							</a>
							<a data-tooltip data-options="disable_for_touch:true" class="tip-right" title="Acerca el mapa para cargar información" id="blocked" style="display:none;">
								<img class="loadbtn" src="<?= BC_BM_URL; ?>img/block.png" />
							</a>
						</div>

						<div id="control-zoom" class="flotante flotante-izquierda">
							<a data-tooltip data-options="disable_for_touch:true" class="zoombtn tip-right" title="Acercar mapa" id="zoom-in" href="#" onClick="biciMapaOBJ.biciMapa.zoomIn()" >+</a>
							<a data-tooltip data-options="disable_for_touch:true" class="zoombtn tip-right" title="Alejar mapa" id="zoom-out" href="#" onClick="biciMapaOBJ.biciMapa.zoomOut()" >-</a>
						</div>

						<div id="displaycapas" class="flotante flotante-izquierda">
							<img data-tooltip data-options="disable_for_touch:true" class="showhide-capas tip-top" title="Mostrar todo" id="show_all" onClick="biciMapaUI.displayCapas(true)" src="<?= BC_BM_URL; ?>img/show_all.png" />
							<img data-tooltip data-options="disable_for_touch:true" class="showhide-capas tip-top" title="Ocultar todo" id="hide_all" onClick="biciMapaUI.displayCapas(false)" src="<?= BC_BM_URL; ?>img/hide_all.gif" />
							<div id="displaycapasDiv">
							</div>
						</div>
						
						<div id="map"></div>
					</div>
					<!-- BANNER_________________________________________________________________________________________________-->
					<div id="banner" class="x_col">
						<?=$bicimapa->getBanner();?>
					</div>
				</div>
			</div>
		</div>

		<!-- FOOTER _____________________________________________________________________________________________________-->
		<div id="inferior" class="x_row" >
			<!-- <a class="left" href="http://www.bicicultura.cl" target="_blank"><img class="logo_bicicultura" src="<?= BC_BM_URL; ?>img/logo-bicicultura.png" /></a> -->
			<a class="left" href="http://www.bicicultura.cl" target="_blank"><img class="logo_bicicultura" src="<?= BC_BM_URL; ?>img/bicicultura.png" /></a>
			
			<div class="left carrusel">
				<ul data-orbit data-options="
					slide_number:false;bullets: false;
					timer:true;pause_on_hover: true;resume_on_mouseout: true;
					timer_speed: 10000;animation_speed:500;
				">
					<?php $bicimapa->getNoticiasHead(); ?>
				</ul>
			</div>

			<!-- <a class="right" href="http://www.ridethecity.com/" target="_blank"><img class="ride" src="<?= BC_BM_URL; ?>img/logo-ridethecity.png" /></a> -->
		</div>

		<!-- MODAL COMENTARIOS _____________________________________________________________________ -->
		<div id="modalComentarios" class="reveal-modal xlarge" data-reveal>
			<div>
				<div class="row">
					<div class="small-12 medium-3 columns nopadding">
						<img class="modallogo" src="<?= BC_BM_URL;?>img/logo-bicimapa.png"/>
					</div>
					<div class="small-12 medium-6 columns nopadding">
						<h1 class="text-center">Comentarios</h1>
					</div>
					<div class="small-12 medium-3 columns nopadding"></div>
				</div>
				
				<div class="row">
					<div class="small-12 large-3 columns show-for-large-only">
						<div class="fb-like-box" data-href="https://www.facebook.com/centrobicicultura" data-colorscheme="light" data-height="500" data-show-faces="true" data-header="false" data-stream="false" data-show-border="false"></div>
					</div>
					<!-- <div class="small-12 large-7 columns"> -->
					<div class="small-12 large-9 columns">
						<!-- <div class="fb-comments" data-href="http://www.bicimapa.cl" data-numposts="20" data-colorscheme="light" data-width="500" width="100%" style="width: 100%;"></div> -->

						<?php $bicimapa->comment_form(); ?>
						<div id="comentarios_list">
							<?= $bicimapa->get_comentarios(); ?>
						</div>
					</div>
					<!-- <div class="small-12 large-2 columns show-for-large-only" >
						<script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
						<ins class="adsbygoogle"
							 style="display:inline-block;width:120px;height:600px"
							 data-ad-client="ca-pub-4685691091335851"
							 data-ad-slot="2425046826"></ins>
						<script>
						(adsbygoogle = window.adsbygoogle || []).push({});
						</script>
					</div> -->
				</div>
				<div class="row hide-for-large-only">
					<div class="fb-like-box" data-href="https://www.facebook.com/centrobicicultura" data-colorscheme="light" data-height="500" data-show-faces="true" data-header="false" data-stream="false" data-show-border="false"></div>
				</div>
			</div>
			<a class="close-reveal-modal">&#215;</a>
		</div>

		<!-- MODAL CONSEJOS _____________________________________________________________________ -->
		<div id="modalConsejos" class="reveal-modal xlarge" data-reveal>
			<div class="row">
				<div class="small-12 medium-3 columns nopadding">
					<img class="modallogo" src="<?= BC_BM_URL;?>img/logo-bicimapa.png"/>
				</div>
				<div class="small-12 medium-6 columns nopadding">
					<h1 class="text-center">Portada Bicicultura</h1>
				</div>
				<div class="small-12 medium-3 columns nopadding" ></div>
			</div>
			
			<div class="row text-center" style="background:red;heigth:90px;">

			</div>
			<div class="row">
				<div class="small-12 large-3 columns show-for-large-up">
					<div class="fb-like-box" data-href="https://www.facebook.com/centrobicicultura" data-colorscheme="light" data-height="500" data-show-faces="true" data-header="false" data-stream="false" data-show-border="false"></div>
				</div>
				<div class="small-12 large-9 columns">
					<h2 class="text-center">Biciactivismo</h2>
					<?php $bicimapa->getNoticias('noticiaportada',4); ?>

					<h2 class="text-center">Agenda</h2>
					<?php $bicimapa->getNoticias('noticiaagenda',4); ?>

					<h2 class="text-center">Videos</h2>
					<?php $bicimapa->getNoticias('videosportada',4); ?>
				</div>
				<div class="small-12 columns nopadding hide-for-large-up" >
					<div class="fb-like-box" data-href="https://www.facebook.com/centrobicicultura" data-colorscheme="light" data-height="500" data-show-faces="true" data-header="false" data-stream="false" data-show-border="false"></div>
				</div>
			</div>
			<a class="close-reveal-modal">&#215;</a>
		</div>

		 <!-- MODAL COMPARTIR _____________________________________________________________________ -->
		 <a id="modalCompartir_opener" style="display:none;" href="#" data-reveal-id="modalCompartir" data-reveal>abrir compartir</a> <!-- CUCHUFLETA -->
		<div id="modalCompartir" class="reveal-modal tiny" data-reveal>
			<div class="bloque_detallePOI">
				<label class="lindo-text" data-tooltip data-options="disable_for_touch:true" class="tip-top" title="Vínculo directo">
					<img src="<?= BC_BM_URL; ?>img/link.png" class="iconlink"/>
					<input id="btn_enlacePOI" class="enlace_text" type="text" onClick="$(this).select();" />
				</label>
				<!-- <label class="lindo-text" data-tooltip data-options="disable_for_touch:true" class="tip-top" title="Incrustar en tu web o blog">
					<img src="<?= BC_BM_URL; ?>img/iframe.png" class="iconlink"/>
					<input id="btn_iframePOI" class="enlace_text" type="text" value="&lt;iframe src=&quot;http://www.bicimapa.cl&quot;&gt;&lt;/iframe&gt;"/>
				</label> -->
				<a id="btn_shareMail"  data-tooltip data-options="disable_for_touch:true" class="btn_poi tip-top" title="Enviar por correo" data-reveal-id="modalCompartirMail" >
					<img class="opt_detallePOI" alt="" src="<?= BC_BM_URL; ?>img/share_email.png"/>
				</a>
				<a id="btn_shareFacebook"  data-tooltip data-options="disable_for_touch:true" class="btn_poi tip-top" title="Compartir en Facebook" >
					<img class="opt_detallePOI" alt="" src="<?= BC_BM_URL; ?>img/share_facebook.png"/>
				</a>
				<a id="btn_shareTwitter"  data-tooltip data-options="disable_for_touch:true" class="btn_poi tip-top" title="Compartir en Twitter" >
					<img class="opt_detallePOI" alt="" src="<?= BC_BM_URL; ?>img/share_twitter.png"/>
				</a>
			</div>
			<a class="close-reveal-modal">&#215;</a>
		</div>

		<!-- MODAL COMPARTIR MAIL _____________________________________________________________________ -->
		<div id="modalCompartirMail" class="reveal-modal tiny" data-reveal>
			<input id="txt_tipo_share" type="hidden" /> 
			<input id="txt_link_share" type="hidden" /> 

			<div id="share_email_div">

				<label id="lbltxt_name" for="txt_name">Tu nombre</label>
				<input id="txt_name" type="text" 
					<?php if(is_user_logged_in()) echo 'value="'.$bicimapa->user_name(get_current_user_id()) .'"'; ?>
				>
				<br/>
				<label id="lbltxt_from" for="txt_from">Tu correo</label>
				<input id="txt_from" type="text"
					<?php if(is_user_logged_in()) echo 'value="'.$bicimapa->user_email(get_current_user_id()) .'"'; ?>
				>
				<br/>
				<label id="lbltxt_to" for="txt_to">Los correos de tus amigos separados por coma (,)</label>
				<input id="txt_to" type="text">
				<br/>
				<label id="lbltxt_message" for="txt_message">Tu mensaje</label>
				<br/>
				<textarea id="txt_message" cols="45" rows="5"></textarea>
				<br/>
				<button id="enviarCorreo" type="button" class="small primary" onClick="biciMapaUI.shareMail()">Enviar</button>
				
				<button id="cancelarCorreo" type="button" class="small" onClick="$('#modalCompartirMail').foundation('reveal', 'close');">Cancelar</button>
			</div>
			<a class="close-reveal-modal">&#215;</a>
		</div>

		<!-- MODAL ALERTA INICIO _____________________________________________________________________ -->
		<div id="modalAlerta" class="reveal-modal large" data-reveal>
			<div class="row">
				<div class="small-12 medium-3 columns nopadding">
					<img class="modallogo" src="<?= BC_BM_URL;?>img/logo-bicimapa.png"/>
				</div>
				<div class="small-12 medium-6 columns nopadding">
					<h1 class="text-center">Bienvenido a la nueva versión de Bicimapa.cl</h1>
				</div>
				<div class="small-12 medium-3 columns nopadding" ></div>
			</div>
			<div class="parrafo-modal">
				<div>
					<p>
						Después de tanta espera, el equipo de Bicicultura está orgulloso de presentar esta nueva herramienta a la comunidad ciclista en Santiago. 
					</p>
					<p>
						Tal como el Bicimapa que tienes en tus manos (si no lo tienes, preguntanos dónde obtenerlo <strong>gratis</strong>), este mapa es de acceso libre y de construcción colaborativa, es decir, la propia comunidad puede actualizar la información aquí dispuesta.
					</p>
					<p>
						Esta nueva versión se encuentra en estado <strong style="color:red;">BETA</strong>, lo que significa que aún la estamos contruyendo mientras tu juegas en ella. No te asustes si ves un cambio repentino, estamos buscando la mejor forma de hacer el Bicimapa para ti.
					</p>
					<p>
						Te invitamos a que pruebes el mapa buscando rutas, viendo lugares, colaborando, comentando, etc. Si tienes alguna sugerencia o quieres reportar un problema (esperamos que no haya ninguno), comunícate con el equipo de Bicimapa.cl al correo <strong style="font-size: 15px;">bicimapa@bicicultura.cl</strong>
					</p>
					<p class="text-right">
						Un afectuoso saludo de parte de
					</p>
					<p class="text-right">
						<a href="http://www.bicicultura.cl" target="_blank">
							<img src="<?= BC_BM_URL; ?>img/logo-bicicultura.png" />
						</a>
					</p>
				</div>
				<div class="confirm-alerta text-center">
					<label><input id="showalert_check" type="checkbox">No mostrar esta información de nuevo</label>
					<button id="aceptarAlerta" type="button" class="tiny" onclick="biciMapaUI.confirmAlert()">Aceptar</button>
				</div>
			</div>
			<a class="close-reveal-modal">&#215;</a>
		</div>
		<!-- MODAL POI _____________________________________________________________________ -->
		<!-- <div id="modalPOI" class="reveal-modal tiny" data-reveal> -->
		<div id="modalPOI" class="reveal-modal small" data-reveal>
			<div>
			</div>
			<a class="close-reveal-modal">&#215;</a>
		</div>
		<!-- MODAL BIG MESSAGE _____________________________________________________________________ -->
		<div id="modalBigMessage" class="reveal-modal large" data-reveal>
			<div class="row">
				<div class="small-12 medium-3 columns nopadding">
					<img class="modallogo" src="<?= BC_BM_URL;?>img/logo-bicimapa.png"/>
				</div>
				<div class="small-12 medium-6 columns nopadding">
					<h1 class="text-center"></h1>
				</div>
				<div class="small-12 medium-3 columns nopadding" ></div>
			</div>
			<div class="parrafo-modal">
			</div>
			<a class="close-reveal-modal">&#215;</a>
		</div>

		
		<img id="iconCUCHUFLETA" data-dropdown="dropCUCHUFLETA" style="display:none"/>
		<ul id="dropCUCHUFLETA" class="f-dropdown" data-dropdown-content style="display:none">
		<li>Opcion Cuchufleta</li>
		</ul>

		 <!-- LIBRERIAS_____________________________________________________________________ -->
		<!-- 
		<script type="text/javascript" src="<?= BC_BM_URL; ?>lib/leaflet/leaflet.js"></script>	
		<script src='//api.tiles.mapbox.com/mapbox.js/v1.6.0/mapbox.js'></script>
		-->


		<?php /* <!--
		<script type="text/javascript" src="<?= BC_BM_URL; ?>lib/all.js"></script>
		 --> */ ?>
		
		<script type="text/javascript" src="<?= BC_BM_URL; ?>lib/foundation/js/vendor/modernizr.js"></script> 
		<script type="text/javascript" src="<?= BC_BM_URL; ?>lib/jquery-1.10.2.min.js"></script>
		<script type="text/javascript" src="<?= BC_BM_URL; ?>lib/amplify.min.js"></script>
		<script type="text/javascript" src="<?= BC_BM_URL; ?>lib/underscore-min.js"></script>
		<script type="text/javascript" src="<?= BC_BM_URL; ?>lib/foundation/js/foundation.min.js"></script>
		<script type="text/javascript" src="<?= BC_BM_URL; ?>lib/Simple-Ajax-Uploader-master/SimpleAjaxUploader.min.js"></script>
		
		
		<script type="text/javascript" src="<?= BC_BM_URL; ?>lib/mapbox.js"></script>
		
		<script type="text/javascript" src="<?= BC_BM_URL; ?>lib/biciMapaClass.js"></script>
		<script type="text/javascript" src="<?= BC_BM_URL; ?>lib/biciMapaUIClass.js"></script>
		<script type="text/javascript" src="<?= BC_BM_URL; ?>lib/jquery-toastmessage/jquery.toastmessage.js"></script>
		
		 <!-- 
		<script type="text/javascript" src="<?= BC_BM_URL; ?>lib/jquery.nicescroll.min.js"></script>
		<script type="text/javascript" src="<?= BC_BM_URL; ?>lib/jscrollpane/jquery.jscrollpane.min.js"></script>
		<script type="text/javascript" src="<?= BC_BM_URL; ?>lib/jscrollpane/jquery.mousewheel.js"></script>
		 -->

		<script type="text/javascript" src="<?= BC_BM_URL; ?>/lib/markercluster/leaflet.markercluster.js"></script>
		
		<script type="text/javascript" src="<?= BC_BM_URL; ?>/lib/leaflet-draw-custom.js"></script>
		<script type="text/javascript" src="<?= BC_BM_URL; ?>/lib/jquery-ui/jquery-ui.min.js"></script> <!-- PAL SORTEABLE!! -->
		
		<script type="text/javascript" src="<?= BC_BM_URL; ?>/lib/Leaflet.Elevation/dist/Leaflet.Elevation-0.0.2.min.js"></script>
		<script src="http://d3js.org/d3.v3.min.js" charset="utf-8"></script>
		
		
		<!-- 
		<script type="text/javascript" src="<?= BC_BM_URL; ?>lib/html2canvas.js"></script>
		 -->

		 <!-- DEJAR FUERA DE LA COMPILACION -->
		<script type="text/javascript" src="<?= BC_BM_URL; ?>lib/fancybox/jquery.fancybox.pack.js"></script>

		 <!-- INICIO DE LA APP__________________________________________________________ -->
		<script type="text/javascript">
			
			$(document).ready(function(){
				
				$(document).foundation();
				
				<?php
					$route = (isset($_GET["route"]) ?  $_GET["route"] : '');
					$poi_UID = (isset($_GET["poi"]) ?  $_GET["poi"] : '');
					
					// Estableciendo ubicacion inicial
					if($route!='') $centro = $bicimapaMapServices->getCenterRoute($route,true);
					else if($poi_UID!=''){ 
						$poi = $bicimapaMapServices->loadPOITiny($poi_UID,true);
						if($poi && !is_string($poi)){
							$centro = array('lat'=>$poi['lat'],'lng'=>$poi['lng']);
						}
						// $centro = $bicimapaMapServices->getPOICoord($poi_UID,true);
					}

					if($centro)	$ubicacion_final = 'var lat='. $centro['lat'] .',lng='. $centro['lng'] .';';
					else{
						/*NO Se puede usar HTML5 para localizar pues el usuario debe aprobar y en lo que se demora
						la app no inicia y se ve fea. Por lo tanto solo se usa IP locate.*/
						// $centro = $bicimapaMapServices->getIPLocation();
						if($centro) $ubicacion_final = 'lat='. $centro['lat'] .';lng='. $centro['lng'] .';';
						else $ubicacion_final = 'var lat=-33.445,lng=-70.66;'; // Santiago
						// else $ubicacion_final = 'var lat=-34.57556026465245,lng=-58.500823974609375;'; // Buenos Aires
						// else $ubicacion_final = 'var lat=-33.05155111527225,lng=-71.5982437133789;'; // Valpo
						// else $ubicacion_final = 'var lat=-33.382146163182576,lng=-70.30546188354492;'; // PRUEBA CORDILLERA
						// else $ubicacion_final = 'var lat=-33.68549637289138,lng=-59.79309082031249;'; // PRUEBA 2 BUENOS AIRES

					}
				?>

				route = '<?= $route; ?>';
				// poi = '<?= $poi_UID ?>';
				poi = JSON.parse('<?=json_encode($poi) ?>');
				var zoom = 13;
				// var zoom = 5;
				<?= $ubicacion_final; ?>
				
				signals = JSON.parse('<?=(json_encode($bicimapa->getSignals())) ?>');
				zonasAdmin = JSON.parse('<?=(json_encode($bicimapaMapServices->getZonasAdmin())) ?>');
				historial = JSON.parse(htmlentities_decode('<?=htmlspecialchars(json_encode($bicimapaMapServices->getHistoryRoutes())) ?>'));
				src_screen = '<?= (isset($_GET["src_screen"]) ? $_GET["src_screen"] : ""); ?>'; //PARA DEFINIR PANTALLA
				
				user_data = JSON.parse('<?= json_encode($bicimapa->user_data(get_current_user_id())); ?>');

				login_link = '<?= $bicimapa->login_link; ?>';
				BC_BM_URL = '<?= BC_BM_URL; ?>';
				baseUrl = '<?= site_url(); ?>';
				var back_road = "<?= get_option('bcbm_road'); ?>";
				var back_satelite = "<?= get_option('bcbm_satelite'); ?>";

				biciMapaOBJ = new biciMapaClass();
				biciMapaUI = new biciMapaUIClass();
				biciMapaOBJ.initMap(lng,lat,zoom,back_road,back_satelite);
				biciMapaUI.initUI();

			});

		</script>
	</body>
</html>
