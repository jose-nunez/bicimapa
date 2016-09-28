
<?php 
class BicimapaSettings{

	function displaySettings(){	?>
		<div class="wrap">
			
			<img src="<?php echo BC_BM_URL.'img/logo-bicimapa.png'; ?>" />
			<p><form action="options.php" method="post">
				<?php


				$bcbm_homeId= get_option('bcbm_homeId');

				$bcbm_banner= get_option('bcbm_banner');
				$bcbm_banner_url= get_option('bcbm_banner_url');
				$bcbm_banner_link= get_option('bcbm_banner_link');
				$bcbm_banner_bgcolor= get_option('bcbm_banner_bgcolor');

				$bcbm_road= get_option('bcbm_road');
				$bcbm_satelite= get_option('bcbm_satelite');

				$bcbm_comments_parent_asc= get_option('bcbm_comments_parent_asc');
				$bcbm_comments_children_asc= get_option('bcbm_comments_children_asc');
				$bcbm_user_can_delete= get_option('bcbm_user_can_delete');

				settings_fields('bcbm_setting');
				do_settings_sections('bcbm_setting');
				?>
			
				<h3>Inicio</h3>
				<table class="table">
					<tr valign="middle">
					<th scope="row">ID de la página que mostrará el Bicimapa</th>
					<td><input type="text" name="bcbm_homeId" value="<?php echo $bcbm_homeId; ?>" /></td>
					</tr>
				</table>

				<h3>Fondo de Teselas</h3>
				<table class="table" style="text-align:left;">
					<tr valign="middle">
					<th scope="row">Mapa de calles</th>
					<td>
						<select name="bcbm_road">
							<option <?=($bcbm_road=='mq')?'selected="selected"':'';?> value="mq">Mapquest</option>
							<option <?=($bcbm_road=='rtc')?'selected="selected"':'';?> value="rtc">Ride the city</option>
							<option <?=($bcbm_road=='osm')?'selected="selected"':'';?> value="osm">Open Street Maps</option>
							<option <?=($bcbm_road=='ggl')?'selected="selected"':'';?> value="ggl">Google</option>
							<?php /*
							<option <?=($bcbm_road=='clm')?'selected="selected"':'';?> value="clm">Cloudmade</option>
							<option <?=($bcbm_road=='mbp')?'selected="selected"':'';?> value="mbp">Mapbox producción ($)</option> 
							*/ ?>
							<option <?=($bcbm_road=='mbp2')?'selected="selected"':'';?> value="mbp2">Mapbox producción 2</option>
							<option <?=($bcbm_road=='mbt')?'selected="selected"':'';?> value="mbt">Mapbox pruebas</option>
							<option <?=($bcbm_road=='mbd')?'selected="selected"':'';?> value="mbd">Mapbox desarrollo</option>
						</select>
					</td>
					</tr>

					<tr valign="middle">
					<th scope="row">Satelite</th>
					<td>
						<select name="bcbm_satelite">
							<option <?=($bcbm_satelite=='mqs')?'selected="selected"':'';?> value="mqs">Mapquest Satelite</option>
							<option <?=($bcbm_satelite=='mbps')?'selected="selected"':'';?> value="mbps">Mapbox Satelite producción ($)</option>
							<option <?=($bcbm_satelite=='mbps2')?'selected="selected"':'';?> value="mbps2">Mapbox Satelite producción ($-Gratis hasta 22 Junio)</option>
						</select>
					</td>
					</tr>
				</table>

				<h3>Banner</h3>
				<table class="table" style="text-align:left;">
					<tr valign="middle">
						<th scope="row">Fuente</th>
						<td>
							<select name="bcbm_banner">
								<?php
								$args = array('post_type'=>'attachment','post_mime_type'=>'image/gif,image/jpeg,image/pjpeg,image/png,image/svg+xml,image/example,application/x-shockwave-flash'); 
								$attachments = get_posts($args);
								if($attachments) {
									foreach ($attachments as $post) {
										echo '<option '. ($bcbm_banner==$post->ID?'selected="selected"':'') .' value="'.$post->ID.'">'.$post->post_title.'</option>';
									}
								}
								?>
								<option <?=($bcbm_banner=='adsbygoogle')?'selected="selected"':'';?> value="adsbygoogle">Google Ads.</option>
								<option <?=($bcbm_banner=='otro')?'selected="selected"':'';?> value="otro">Otro (URL)</option>
							</select>
						</td>
						<td></td>
					</tr>
					<tr valign="middle">
						<td></td>
						<td><input type="text" name="bcbm_banner_url" placeholder="URL" value="<?=$bcbm_banner_url; ?>" /></td>
						<td></td>
					</tr>
					<tr valign="middle">
						<th scope="row">Vínculo</th>
						<td><input type="text" name="bcbm_banner_link" placeholder="Vínculo externo" value="<?=$bcbm_banner_link; ?>" /></td>
						<td>Sólo disponible para imagenes de la librería multimedia</td>
					</tr>
					<tr valign="middle">
						<th scope="row">Color de relleno</th>
						<td><input type="color" name="bcbm_banner_bgcolor" placeholder="Color" value="<?=$bcbm_banner_bgcolor; ?>" /></td>
						<td></td>
					</tr>
				</table>
					 
				<h3>Comentarios</h3>
				<table class="table" style="text-align:left;">
					<?php /*
					<tr valign="middle">
						<th scope="row">Comentarios más antiguos primero</th>
						<td><input type="checkbox" name="bcbm_comments_parent_asc" <?php if($bcbm_comments_parent_asc) echo 'checked="checked"'; ?> /></td>
					</tr>
					<tr valign="middle">
						<th scope="row">Comentarios anidados  más antiguos primero</th>
						<td><input type="checkbox" name="bcbm_comments_children_asc" <?php if($bcbm_comments_children_asc) echo 'checked="checked"'; ?> /></td>
					</tr>
					*/ ?>
					<tr valign="middle">
						<th scope="row">Usuarios pueden borrar sus propios comentarios</th>
						<td><input type="checkbox" name="bcbm_user_can_delete" <?php if($bcbm_user_can_delete) echo 'checked="checked"'; ?> /></td>
					</tr>
				</table>
			
				<?php submit_button(); ?>
			</form></p>
		</div>
<?php 
	}
}
?>