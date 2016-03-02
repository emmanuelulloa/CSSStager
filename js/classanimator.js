
window.classanimator = window.classanimator || {};

$(document).ready(function(){
	//http://www.html5rocks.com/en/tutorials/file/dndfiles/
	//http://blog.teamtreehouse.com/reading-files-using-the-html5-filereader-api
	//http://keithclark.co.uk/articles/calculating-element-vertex-data-from-css-transforms/
	var data = {
		container : {width:550,height:400,bgColor:'#FFF',borderColor:'#666'},
		background : {file:null},
		layers : [],
		layersByName : {},
		images: {},
		svg: {},
		imageInfo : {},
		layerTransforms : {},
		$currentLayer : null,
		resetInfo : {}
	}
	classanimator.data = data;
	var $stage = $('#stage'),
		$vcam_ui = $('#vcam_ui'),
		$uiPos = $('.ui-pos'),
		$size_sl = $('#size_sl'),
		$width_txt = $('#width_txt'),
		$height_txt = $('#height_txt'),
		$guide_fl = $('#guide_fl');
	//FUNCTIONS
	function getElement(i){
		return document.getElementById(i);
	}
	var depth = 0;
	function getNextHighestDepth(){
		return ++depth;
	}
	var counter = 0, filesMax = 0;
	var constants = {
		I_LAYER: '_iLayer',
		O_LAYER: '_oLayer'
	}
	classanimator.constants = constants;
	$('#new_svg_txt').click(function(evt){
		$('#new_svg_txt').select();
	});
	$('#new_svg_btn').click(function(evt){
		//var args = ($('#new_svg_txt').val()).split(',');
		//var box = createLayer(null,parseInt(args[0]),parseInt(args[1]),parseInt(args[2]),parseInt(args[3]),args[4]);
		var container = createLayer(null,0,0,'auto','auto');
		var inner = document.getElementById(container.id + constants.I_LAYER);
		inner.innerHTML = $('#new_svg_txt').val();
		$(container).addClass('svg');
		data.svg[container.id] = true;
		selectLayer(getLayer(container.id));
		openTools();
		populateSelectMenu();
		//$('#new_svg_txt').select();
	});
	$('#delete_btn').click(function(evt){
		destroyLayer(data.$currentLayer.attr('id'));
	});
	function destroyLayer(name){
		deselect();
		var layerToDestroy = document.getElementById(name);
		$(layerToDestroy).remove();
		for(var i=0; i < data.layers.length; i++){
			if(data.layers[i] == layerToDestroy){
				data.layers.splice(i,1);
			}
		}
		delete data.layerTransforms[name];
		delete data.layersByName[name];
		delete data.resetInfo[name];
		delete data.svg[name];
		populateSelectMenu();
	}
	function createLayer(name, x, y, width, height, bgColor, img){
		if(!name){
			name = "div_" + Math.round(Math.random() * 1000);
		}
		data.layersByName[name] = name;
		var draggableLayer = document.createElement('div');
		var opacityLayer = document.createElement('div');
		var imageLayer = document.createElement('div');
		data.resetInfo[name] = {
			backgroundSize : '100% 100%',
			width : width,
			height : height
		}
		//for events this is the layer you want to target, it also holds the className = layer and the selected border. This layer is the one to use to obtain left and top values
		draggableLayer.id = name;
		draggableLayer.className = 'layer';
		draggableLayer.style.left = x + 'px';
		draggableLayer.style.top = y + 'px';
		//this layer holds opacity, transform-origin and transformations
		opacityLayer.id = name + constants.O_LAYER;
		//this layer holds image-background, image-position, width, height
		imageLayer.id = name + constants.I_LAYER;
		if(width == 'auto' && height == 'auto'){
			imageLayer.style.width = width;
			imageLayer.style.height = height;
		}else{
			imageLayer.style.width = width + 'px';
			imageLayer.style.height = height + 'px';	
		}
		if(img){
			imageLayer.style.backgroundImage = img.src;
			imageLayer.style.backgroundRepeat = 'no-repeat';
			if(img.backgroundPositionX != null){
				imageLayer.style.backgroundPosition = img.backgroundPositionX + 'px ' + img.backgroundPositionY + 'px';
			}else{
				imageLayer.style.backgroundPosition = '0px 0px';
			}
			if(img.backgroundSize){
				imageLayer.style.backgroundSize = img.backgroundSize;
			}else{
				imageLayer.style.backgroundSize = img.width + 'px ' + img.height + 'px';
			}
			data.resetInfo[name].backgroundSize = imageLayer.style.backgroundSize;
			data.resetInfo[name].width = imageLayer.style.width;
			data.resetInfo[name].height = imageLayer.style.height;
			data.imageInfo[name] = {
				backgroundPosition: imageLayer.style.backgroundPosition,
				backgroundSize: imageLayer.style.backgroundSize,
				filename: img.filename,
				width: img.width,
				height: img.height,
				scale: 1
			};
			if(img.name){
				data.layersByName[name] = img.name;
			}
		}
		if(bgColor){
			imageLayer.style.backgroundColor = bgColor;
		}
		//Let's assemble
		opacityLayer.appendChild(imageLayer);
		draggableLayer.appendChild(opacityLayer);
		$stage.append(draggableLayer);
		var $draggableLayer = $(draggableLayer);
		$draggableLayer.draggable({
			start:onDragStart
		},{
			stop:onDragStop
		});
		$draggableLayer.click(function(evt){
			var layer = getLayer(evt.target.id);
			if(layer === this){
				if($(layer).is('.ui-draggable-dragging')){
					return;
				}
					selectLayer(layer);
				}
				return;
		});
		data.layerTransforms[name] = {};
		data.layers.push(draggableLayer);
		selectLayer(draggableLayer);
		return draggableLayer;
	}
	function buildImageLayer(files){
		filesMax = files.length;
		for(var i=0; i < files.length; i++){
			var file = files[i];
			if (file.type.match(/image.*/)){
				var reader = new FileReader();
				reader.onload = (function(file){
					return function(evt){
						++counter;
						var img = new Image();
						img.src = evt.target.result;
						var name = file.name.split('.')[0];
						data.images[name] = file.name;
						createLayer(name,0,0,img.width,img.height,null,{filename:file.name , src:'url(' + img.src + ')', width: img.width, height: img.height});
						delete img;
						if(counter == filesMax){
							selectLayer(getLayer(name));
							openTools();
						}
						populateSelectMenu();
					}
				})(file);
				reader.readAsDataURL(file);
			}	
		}
	}
	function getLayer(id){
		if(id.indexOf(constants.I_LAYER) !== -1){
			return getElement(id.replace(constants.I_LAYER, ''));
		}else if(id.indexOf(constants.O_LAYER) !== -1){
			return getElement(id.replace(constants.O_LAYER, ''));
		}
		return getElement(id);
	}
	function fixDecimal(val){
		return Math.round(val*1000)/1000;
	}
	/* VCAM start*/
	$('#use_vcam_ck').click(function(evt){
		var $this = $(evt.target);
		var $vcam_controls = $('#vcam');
		changeVCAMSize();
		if($this.prop('checked')){
			$vcam_controls.slideDown();
			$vcam_ui.css('display', 'block');
		}else{
			$vcam_controls.slideUp();
			$vcam_ui.css('display', 'none');
		}
	});
	var vcamOb = {pan:0, tilt:0, zoom:1, roll:0};
	$('#pan_txt, #tilt_txt, #zoom_txt, #roll_txt').change(function(evt){
		var $this = $(evt.target);
		var id = $this.prop('id');
		var wkm = new WebKitCSSMatrix(window.getComputedStyle(document.getElementById('vcam_ui'))['-webkit-transform']);
		var val = parseFloat($this.val());
		if(id == 'pan_txt'){
			vcamOb.pan = val;
			wkm = wkm.translate(val, 0, 0);
		}
		if(id == 'tilt_txt'){
			vcamOb.tilt = val;
			wkm = wkm.translate(0, val, 0);
		}
		if(id == 'zoom_txt'){
			vcamOb.zoom = val;
			wkm.a += val;
			wkm.d += val;
		}
		if(id == 'roll_txt'){
			vcamOb.roll = val;
			wkm = wkm.rotate(0, 0, val);
		}
		$vcam_ui.css('-webkit-transform', wkm.toString());
	});
	$('#pan_lt, #pan_gt, #tilt_lt, #tilt_gt, #zoom_lt, #zoom_gt, #roll_lt, #roll_gt').click(function(evt){
		evt.preventDefault();
		evt.stopPropagation();
		var $this = $(evt.target);
		var id = $this.prop('id');
		var factor = (evt.shiftKey)?10:1;
		var wkm = new WebKitCSSMatrix(window.getComputedStyle(document.getElementById('vcam_ui'))['-webkit-transform']);

		if(id == 'pan_lt'){
			vcamOb.pan += fixDecimal(-1 * factor);
			wkm = wkm.translate(fixDecimal(-1 * factor), 0, 0);
		}
		if(id == 'pan_gt'){
			vcamOb.pan += fixDecimal(1 * factor);
			wkm = wkm.translate(fixDecimal(1 * factor), 0, 0);
		}
		if(id == 'tilt_lt'){
			vcamOb.tilt += fixDecimal(-1 * factor);
			wkm = wkm.translate(0, fixDecimal(-1 * factor), 0);
		}
		if(id == 'tilt_gt'){
			vcamOb.tilt += fixDecimal(1 * factor);
			wkm = wkm.translate(0, fixDecimal(1 * factor), 0);
		}
		if(id == 'zoom_lt'){
			vcamOb.zoom += 0.1;
			wkm.a += 0.1;
			wkm.d += 0.1;
		}
		if(id == 'zoom_gt'){
			vcamOb.zoom += -0.1;
			wkm.a += -0.1;
			wkm.d += -0.1;
		}
		if(id == 'roll_lt'){
			vcamOb.roll += fixDecimal(-1 * factor);
			wkm = wkm.rotate(0, 0, fixDecimal(-1 * factor));
		}
		if(id == 'roll_gt'){
			vcamOb.roll += fixDecimal(1 * factor);
			wkm = wkm.rotate(0, 0, fixDecimal(1 * factor));
		}
		$vcam_ui.css('-webkit-transform', wkm.toString());
		$('#pan_txt').val(vcamOb.pan);
		$('#tilt_txt').val(vcamOb.tilt);
		$('#zoom_txt').val(vcamOb.zoom);
		$('#roll_txt').val(vcamOb.roll);
		//console.log(wkm.toString());
	});
	$('#vcam_reset_btn').click(function(evt){
		vcamOb = {pan:0, tilt:0, zoom:1, roll:0};
		$('#pan_txt, #tilt_txt, #roll_txt').val('0');
		$('#zoom_txt').val('1');
		$vcam_ui.css('-webkit-transform', 'none');
	});
	$('#vcam_create_btn').click(function(evt){
		evt.preventDefault();
		evt.stopPropagation();
		vcamCode();
		$('#vcam_capture').css('display', '');
	});
	$('#vcam_capture').click(function(evt){
		var $vcam_txt  = $('#vcam_txt');
		var scene = $('#vcam_scene').val();
		$('#vcam_scene').val(parseInt(scene) + 1);
		var s = $vcam_txt.val() + vcamCapture();
		$vcam_txt.val(s);
		$vcam_txt.select();
	});
	$('#vcam_matrix').keypress(function (e) {
	  if (e.which == 13) {
	    var wkmatrix = new WebKitCSSMatrix($('#vcam_matrix').val());
	    $vcam_ui.css('-webkit-transform', wkmatrix.toString());
	    return false;
	  }
	});
	function changeVCAMSize(){
		$vcam_ui.css('width', data.container.width + 'px').css('height', data.container.height + 'px');
	}
	function vcamCapture(){
		var name = $('#vcam_name').val();
		var scene = $('#vcam_scene').val();
		var duration = $('#vcam_duration_in_txt').val();
		var delay = $('#vcam_delay_in_txt').val();
		var ease = $('#vcam_ease_in_sl').val();
		var wkmatrix = new WebKitCSSMatrix(window.getComputedStyle(document.getElementById('vcam_ui'))['-webkit-transform']);
		var ormatrix = wkmatrix.toString();
		wkmatrix = wkmatrix.inverse();
		var s = '',
			_n = '\n',
			_t = '\t';
		s += '/* ' + name + ' ' + ormatrix + ' */' + _n;
		s += '.scene' + scene + ' .' + name +  '{' + _n;
		s += _t + 'transform: ' + wkmatrix.toString() + ';' + _n;
		s += _t + '-webkit-transform: ' + wkmatrix.toString() + ';' + _n;
		s += _t + '-ms-transform: ' + wkmatrix.toString() + ';' + _n;
		s += _t + 'transition: transform ' + duration + 's ' + ease + ((delay == '0')?'':' ' + delay + 's') + ';' + _n;
		s += _t + '-webkit-transition: -webkit-transform ' + duration + 's ' + ease + ((delay == '0')?'':' ' + delay + 's') + ';' + _n;
		s += '}' + _n;
		return s;
	}
	function vcamCode(){
		var s = '',
			_n = '\n',
			_t = '\t';
		var name = $('#vcam_name').val();
		s += '.' + name + '{' + _n;
		s += _t + 'display: block;' + _n;
		s += _t + 'width: ' + data.container.width + 'px;' + _n;
		s += _t + 'height: ' + data.container.height + 'px;' + _n;
		s += '}' + _n;
		s += vcamCapture();
		var $vcam_txt  = $('#vcam_txt');
		$vcam_txt.val(s);
		$vcam_txt.select();
	}
	/* VCAM end*/
	function openTools(){
		$('#elementsProperties').slideDown();
	}
	function closeTools(){
		$('#elementsProperties').slideUp();
	}
	function changeSize(w,h){
		data.container.width = w;
		data.container.height = h;
		$width_txt.val(data.container.width);
		$height_txt.val(data.container.height);
		$stage.css('width', data.container.width + 'px').css('height', data.container.height + 'px');
		changeVCAMSize();
	}
	function changeColors(bg,col){
		data.container.bgColor = bg;
		data.container.borderColor = col;
		$('.ss_container').css('background-image', 'none');
		$('.ss_container').css('background-color', bg);
		$stage.css('background-color', bg).css('border-color',col);
		$('.to_md').css('background-color', bg);
	}
	function setLayerBorder($layer, op){
		$layer.css('border', '1px dashed rgba(255, 0, 255, ' + (1 - op) + ')');
	}
	function deselect(){
		$('#scale_txt').val(100);
		$('.layer').each(function(i,element){
			$(element).removeClass('selected');
		});
	}
	function selectLayer(el){
		deselect();
		data.$currentLayer = $(el);
		data.$currentLayer.focus();
		data.$currentLayer.addClass('selected');
		data.$currentLayer.css('z-index',getNextHighestDepth());
		updateHUD(data.$currentLayer);
	}
	function updateHUD($layer){
		var name = $layer.attr('id');
		var $iLayer = $('#' + name + constants.I_LAYER);
		var $oLayer = $('#' + name + constants.O_LAYER);
		var layerTransform = data.layerTransforms[name];
		$('#element_lbl').text('Element: ' + $layer.attr('id'));
		$('#left_txt').val($layer.css('left').replace('px',''));
		$('#top_txt').val($layer.css('top').replace('px',''));
		var op = parseFloat($iLayer.css('opacity'));
		$('#opacity_rng').val(Math.round(op * 100) + '');
		setLayerBorder($oLayer,op);
		$('#w_txt').val($iLayer.css('width').replace('px',''));
		$('#h_txt').val($iLayer.css('height').replace('px',''));
		if($iLayer.css('background-image') != 'none'){
		var backgroundSize = $iLayer.css('background-size').split(' ');
		$('#bgw_txt').val(backgroundSize[0].replace('px',''));
		$('#bgh_txt').val(backgroundSize[1].replace('px',''));
		var bgpos = $iLayer.css('background-position').split(' ');
		$('#bgx_txt').val(bgpos[0].replace('px',''));
		$('#bgy_txt').val(bgpos[1].replace('px',''));
		//Transform Origin thumbnail
		var w = parseFloat($iLayer.css('width')), 
			h = parseFloat($iLayer.css('height')), 
			b = Math.max(w,h), 
			ratio = 1, 
			backgroundSize = {width:100,height:100};
		if(b == w){
			ratio = (100/w);
			backgroundSize.height = ratio * h;
		}else{
			ratio = (100/h);
			backgroundSize.width = ratio * w;
		}
		$('.to_md').css('background-image', $iLayer.css('background-image'));
		$('.to_md').css('background-repeat', 'no-repeat');
		$('.to_md').css('background-size', backgroundSize.width + 'px ' + backgroundSize.height + 'px');
		var to = getLayerProperty($layer, 'transform-origin').split(' ');//$iLayer.css('transform-origin').split(' ');
		$('#tox_txt').val(to[0]);
		$('#toy_txt').val(to[1]);
		var tox = parseFloat(to[0]);
		var toy = parseFloat(to[1]);
		var rx = tox/w, ry = toy/h;
		$('.to_marker').css('left', Math.round(rx * backgroundSize.width) + 'px');
		$('.to_marker').css('top', Math.round(ry * backgroundSize.height) + 'px');			
		}

		//TRANSFORMS
		if(layerTransform){
			if(layerTransform.translate){
				$('#x_txt').val(layerTransform.translate.x);
				$('#y_txt').val(layerTransform.translate.y);
			}
			if(layerTransform.scale){
				if(layerTransform.scale.x == layerTransform.scale.y){
					$('#sc_rng').val((layerTransform.scale.x * 100));
				}
				$('#scx_txt').val(parseFloat(layerTransform.scale.x));
				$('#scy_txt').val(parseFloat(layerTransform.scale.y));
			}
			if(layerTransform.rotate){
				$('#rot_rng').val(layerTransform.rotate);
				$('#rot_txt').val(layerTransform.rotate);
			}
			if(layerTransform.skew){
				$('#sk_rng').val(layerTransform.skew);
			}			
		}else{
			resetTransformControls();
		}

		$('#htmlOutput_txt').val(createHTML());
	}
	function resetTransformControls(){
			$('#x_txt').val('0');
			$('#y_txt').val('0');
			$('#scx_txt').val('1');
			$('#scy_txt').val('1');
			$('#rot_txt').val('0');
			$('#rot_rng').val('0');
			$('#sk_rng').val('0');
			$('#sc_rng').val('100');
	}
	function setWidth(val){
		$('#' + data.$currentLayer.attr('id') + constants.I_LAYER).css('width', val + 'px');
	}
	function setHeight(val){
		$('#' + data.$currentLayer.attr('id') + constants.I_LAYER).css('height', val + 'px');
	}
	function onHUDEvents(){
		//Set up all the easing menus
		var $easing_template = $('#easing_template').html();
		$('#ease_in_sl').html($easing_template).val('ease-out');
		$('#ease_out_sl').html($easing_template).val('ease-in');
		$('#ss_ease_in').html($easing_template).val('ease-out');
		$('#ss_ease_out').html($easing_template).val('ease-in');
		$('#vcam_ease_in_sl').html($easing_template).val('linear');
		$('#intro_animation_sl').html($easing_template).val('linear');
		$stage.on('mousemove', function(evt){
			var posX = Math.round(evt.pageX - $stage.offset().left);
			var posY = Math.round(evt.pageY - $stage.offset().top);
			$uiPos.text('x: ' + posX + ' - y: ' + posY);
		});
		$('.to_md').click(function(evt){
			if(evt.target === this){
				evt = evt || window.event;
			    var target = evt.target || evt.srcElement,
			        rect = target.getBoundingClientRect(),
			        offsetX = evt.clientX - rect.left,
			        offsetY = evt.clientY - rect.top;
			    	rx = offsetX - 3,
			    	ry = offsetY - 3;
			    var w = parseFloat(data.$currentLayer.css('width')),
			    	h = parseFloat(data.$currentLayer.css('height')),
			    	$iLayer = $('#' + data.$currentLayer.attr('id') + constants.I_LAYER); 
			    $iLayer.css('transform-origin', Math.round(rx/100 * w) + 'px ' + Math.round(ry/100 * h) + 'px');
			    updateHUD(data.$currentLayer);
			}
		});
		$('#left_txt').change(function(evt){
			var $this = $(evt.target);
			$('#' + data.$currentLayer.attr('id')).css('left', $this.val() + 'px');
		});
		$('#top_txt').change(function(evt){
			var $this = $(evt.target);
			$('#' + data.$currentLayer.attr('id')).css('top', $this.val() + 'px');
		});
		$('#w_txt').change(function(evt){
			setWidth($(evt.target).val());
			updateHUD(data.$currentLayer);
		});
		$('#h_txt').change(function(evt){
			setHeight($(evt.target).val());
			updateHUD(data.$currentLayer);
		});
		$('#bgw_txt').change(function(evt){
			var $this = $(evt.target),
				$iLayer = $('#' + data.$currentLayer.attr('id') + constants.I_LAYER);
			var sz = $iLayer.css('background-size').split(' ');
			$iLayer.css('background-size', $this.val() + 'px ' + sz[1]);
			updateHUD(data.$currentLayer);
		});
		$('#bgh_txt').change(function(evt){
			var $this = $(evt.target),
				$iLayer = $('#' + data.$currentLayer.attr('id') + constants.I_LAYER);
			var sz = $iLayer.css('background-size').split(' ');
			$iLayer.css('background-size', sz[0] + ' ' + $this.val() + 'px');
			updateHUD(data.$currentLayer);
		});
		$('#bgx_txt').change(function(evt){
			var $this = $(evt.target),
				$iLayer = $('#' + data.$currentLayer.attr('id') + constants.I_LAYER);
			var ps = $iLayer.css('background-position').split(' ');
			$iLayer.css('background-position', $this.val() + 'px ' + ps[1]);
			updateHUD(data.$currentLayer);
		});
		$('#bgy_txt').change(function(evt){
			var $this = $(evt.target),
				$iLayer = $('#' + data.$currentLayer.attr('id') + constants.I_LAYER);
			var ps = $iLayer.css('background-position').split(' ');
			$iLayer.css('background-position', ps[0] + ' ' + $this.val() + 'px');
			updateHUD(data.$currentLayer);
		});
		$('#tox_txt').change(function(evt){
			var $this = $(evt.target),
				$iLayer = $('#' + data.$currentLayer.attr('id') + constants.I_LAYER);
			var to = $iLayer.css('transform-origin').split(' ');
			$iLayer.css('transform-origin', $this.val() + 'px ' + to[1]);
			updateHUD(data.$currentLayer);
		});
		$('#toy_txt').change(function(evt){
			var $this = $(evt.target),
				$iLayer = $('#' + data.$currentLayer.attr('id') + constants.I_LAYER);
			var to = $iLayer.css('transform-origin').split(' ');
			$iLayer.css('transform-origin', to[0] + ' ' + $this.val() + 'px');
			updateHUD(data.$currentLayer);
		});
		$('#opacity_rng').change(function(evt){
			var $this = $(evt.target);
			var op = (parseFloat($this.val()) / 100);
			data.$currentLayer.find('#' + data.$currentLayer.attr('id') + constants.I_LAYER).css('opacity',op);
			updateHUD(data.$currentLayer);
		})
		//TRANSFORM
		$('#rot_rng').change(function(evt){
			var $this = $(evt.target);
			var $iLayer = $('#' + data.$currentLayer.attr('id') + constants.I_LAYER);
			var layerTransform = data.layerTransforms[data.$currentLayer.attr('id')];
			if(!layerTransform.rotate){
				layerTransform.rotate = 0;
			}
			layerTransform.rotate = parseFloat($this.val());
			$iLayer.css('transform', createTransform(layerTransform));
			$iLayer.css('-webkit-transform', createTransform(layerTransform));
			updateHUD(data.$currentLayer);
		});
		$('#rot_txt').change(function(evt){
			var $this = $(evt.target);
			var $iLayer = $('#' + data.$currentLayer.attr('id') + constants.I_LAYER);
			var layerTransform = data.layerTransforms[data.$currentLayer.attr('id')];
			if(!layerTransform.rotate){
				layerTransform.rotate = 0;
			}
			layerTransform.rotate = parseFloat($this.val());
			$iLayer.css('transform', createTransform(layerTransform));
			$iLayer.css('-webkit-transform', createTransform(layerTransform));
			updateHUD(data.$currentLayer);
		});
		$('#sc_rng').change(function(evt){
			var $this = $(evt.target);
			var $iLayer = $('#' + data.$currentLayer.attr('id') + constants.I_LAYER);
			var layerTransform = data.layerTransforms[data.$currentLayer.attr('id')];
			if(!layerTransform.scale){
				layerTransform.scale = {x:1,y:1};
			}
			layerTransform.scale.x = parseFloat($this.val()) / 100;
			layerTransform.scale.y = parseFloat($this.val()) / 100;
			$iLayer.css('transform', createTransform(layerTransform));
			$iLayer.css('-webkit-transform', createTransform(layerTransform));
			updateHUD(data.$currentLayer);
		});
		$('#sk_rng').change(function(evt){
			var $this = $(evt.target);
			var $iLayer = $('#' + data.$currentLayer.attr('id') + constants.I_LAYER);
			var layerTransform = data.layerTransforms[data.$currentLayer.attr('id')];
			if(!layerTransform.skew){
				layerTransform.skew = 0;
			}
			layerTransform.skew = parseFloat($this.val());
			$iLayer.css('transform', createTransform(layerTransform));
			$iLayer.css('-webkit-transform', createTransform(layerTransform));
			updateHUD(data.$currentLayer);
		});
		$('#x_txt').change(function(evt){
			var $this = $(evt.target);
			var $iLayer = $('#' + data.$currentLayer.attr('id') + constants.I_LAYER);
			var layerTransform = data.layerTransforms[data.$currentLayer.attr('id')];
			if(!layerTransform.translate){
				layerTransform.translate = {x:0,y:0};
			}
			layerTransform.translate.x = parseFloat($this.val());
			$iLayer.css('transform', createTransform(layerTransform));
			$iLayer.css('-webkit-transform', createTransform(layerTransform));
			updateHUD(data.$currentLayer);
		});
		$('#y_txt').change(function(evt){
			var $this = $(evt.target);
			var $iLayer = $('#' + data.$currentLayer.attr('id') + constants.I_LAYER);
			var layerTransform = data.layerTransforms[data.$currentLayer.attr('id')];
			if(!layerTransform.translate){
				layerTransform.translate = {x:0,y:0};
			}
			layerTransform.translate.y = parseFloat($this.val());
			$iLayer.css('transform', createTransform(layerTransform));
			$iLayer.$currentLayer.css('-webkit-transform', createTransform(layerTransform));
			updateHUD(data.$currentLayer);
		});
		$('#scx_txt').change(function(evt){
			var $this = $(evt.target);
			var $iLayer = $('#' + data.$currentLayer.attr('id') + constants.I_LAYER);
			var layerTransform = data.layerTransforms[data.$currentLayer.attr('id')];
			if(!layerTransform.scale){
				layerTransform.scale = {x:1,y:1};
			}
			layerTransform.scale.x = parseFloat($this.val());
			$iLayer.css('transform', createTransform(layerTransform));
			$iLayer.css('-webkit-transform', createTransform(layerTransform));
			updateHUD(data.$currentLayer);
		});
		$('#scy_txt').change(function(evt){
			var $this = $(evt.target);
			var $iLayer = $('#' + data.$currentLayer.attr('id') + constants.I_LAYER);
			var layerTransform = data.layerTransforms[data.$currentLayer.attr('id')];
			if(!layerTransform.scale){
				layerTransform.scale = {x:1,y:1};
			}
			layerTransform.scale.y = parseFloat($this.val());
			$iLayer.css('transform', createTransform(layerTransform));
			$iLayer.css('-webkit-transform', createTransform(layerTransform));
			updateHUD(data.$currentLayer);
		});
		$('#scale_txt').change(function(evt){
			var $this = $(evt.target);
			var ratio = parseFloat($this.val())/100;
			var name = data.$currentLayer.attr('id');
			data.imageInfo[name].scale = ratio;
			var w = Math.round(fixDecimal(data.imageInfo[name].width * data.imageInfo[name].scale)) + 'px';
			var h = Math.round(fixDecimal(data.imageInfo[name].height * data.imageInfo[name].scale)) + 'px';
			var $iLayer = $('#' + data.$currentLayer.attr('id') + constants.I_LAYER);
			$iLayer.css('width', w);
			$iLayer.css('height', h);
			$iLayer.css('background-size', w + ' ' + h);
			updateHUD(data.$currentLayer);
		});
		$('#toPos_sl').change(function(evt){
			var $this = $(evt.target);
			var img = getLayerProperty(data.$currentLayer, 'image-layer');
			img.css('transform-origin', $this.val());
			updateHUD(data.$currentLayer);
		});
		$('#align_sl').change(function(evt){
			var val = $(evt.target).val();
			var name = data.$currentLayer.attr('id');
			var w = getLayerProperty(data.$currentLayer, 'width');
			var h = getLayerProperty(data.$currentLayer, 'height');
			var sw = data.container.width;
			var sh = data.container.height;
			if(val === 'top'){
				data.$currentLayer.css('top','0px');
			}
			if(val === 'bottom'){
				data.$currentLayer.css('top', (sh - h) + 'px');
			}
			if(val === 'left'){
				data.$currentLayer.css('left','0px');
			}
			if(val === 'right'){
				data.$currentLayer.css('left', (sw - w) + 'px');
			}
			if(val === 'center'){
				data.$currentLayer.css('left', Math.round((sw - w)/2) + 'px');
			}
			if(val === 'middle'){
				data.$currentLayer.css('top', Math.round((sh - h)/2) + 'px');
			}
			updateHUD(data.$currentLayer);
		});
		$('#switchLT2T').click(function(evt){
			var $x = $('#left_txt'), $y = $('#top_txt'), $tx = $('#x_txt'), $ty = $('#y_txt');
			$tx.val($x.val());
			$ty.val($y.val());
			$x.val('0');
			$y.val('0');
			data.$currentLayer.css('top', '0px');
			data.$currentLayer.css('left', '0px');
			setTranslate({x:parseFloat($tx.val()),y:parseFloat($ty.val())});
			evt.preventDefault();
		});
		$('#create_btn').click(function(evt){
			$('#htmlOutput_txt').val(createHTML());
			$('#htmlOutput_txt').select();
			evt.preventDefault();
		});
		$(document).keyup(function(evt){
			evt.stopPropagation();
			evt.stopImmediatePropagation();
    		evt.preventDefault();
			if(evt.which > 36 && evt.which < 41){
				data.$currentLayer.focus();
				var top = parseFloat(data.$currentLayer.css('top'));
				var left = parseFloat(data.$currentLayer.css('left'));
				top = isNaN(top)?0:top;
				left = isNaN(left)?0:left;
				var step = (evt.shiftKey) ? 10 : 1;
				var name = data.$currentLayer.attr('id');
				var layerTransform = data.layerTransforms[name];
				var $iLayer = $('#' + name + constants.I_LAYER);
				if(evt.altKey){
					switch(evt.which){
						case 38:
							if(!layerTransform.scale){
								layerTransform.scale = {x:1,y:1}
							}
							step = (evt.shiftKey) ? 0.5 : 0.1;
							layerTransform.scale.x += step;
							layerTransform.scale.y += step;
						break;
						case 40:
							if(!layerTransform.scale){
								layerTransform.scale = {x:1,y:1}
							}
							step = (evt.shiftKey) ? 0.5 : 0.1;
							layerTransform.scale.x -= step;
							layerTransform.scale.y -= step;
						break;
						case 37:
							if(!layerTransform.rotate){
								layerTransform.rotate = 0
							}
							layerTransform.rotate -= step;
							layerTransform.rotate -= step;
						break;
						case 39:
							if(!layerTransform.rotate){
								layerTransform.rotate = 0
							}
							layerTransform.rotate += step;
							layerTransform.rotate += step;
						break;
					}
					$iLayer.css('transform', createTransform(layerTransform));
					$iLayer.css('-webkit-transform', createTransform(layerTransform));
				}else{
					switch(evt.which){
						case 38:
							data.$currentLayer.css('top', (top + (step * -1)) + 'px' );
						break;
						case 40:
							data.$currentLayer.css('top', (top + step) + 'px' );
						break;
						case 37:
							data.$currentLayer.css('left', (left + (step * -1)) + 'px' );
						break;
						case 39:
							data.$currentLayer.css('left', (left + step) + 'px' );
						break;
					}					
				}
				updateHUD(data.$currentLayer);
			}
			return false;
		});/**/
		$('#resetbutton').click(function(evt){
			var name = data.$currentLayer.attr('id');
			var layerTransform = data.layerTransforms[name];
			var $iLayer = $('#' + name + constants.I_LAYER);
			layerTransform = {};
			$iLayer.css('transform','none');
			$iLayer.css('-webkit-transform','none');
			//$iLayer.css('opacity','1');
			$iLayer.css('background-position', '0px 0px');
			$iLayer.css('background-size', data.resetInfo[name].backgroundSize);
			setWidth(parseInt(data.resetInfo[name].width));
			setHeight(parseInt(data.resetInfo[name].height));
			updateHUD(data.$currentLayer);
			resetTransformControls();
			evt.preventDefault();
			evt.stopPropagation();
		});
		$('#htmlOutput').click(function(evt){
			$(this).select();
		})
	}
	function setTranslate(val){
		var $iLayer = $('#' + data.$currentLayer.attr('id') + constants.I_LAYER);
		var layerTransform = data.layerTransforms[data.$currentLayer.attr('id')];
		if(!layerTransform.translate){
			layerTransform.translate = {x:0,y:0};
		}
		layerTransform.translate.x = val.x;
		layerTransform.translate.y = val.y;
		var ct = createTransform(layerTransform);
		$iLayer.css('transform', ct);
		$iLayer.css('-webkit-transform', ct);
		updateHUD(data.$currentLayer);
	}
  	function createTransform(o){
		var s = '';
			if('translate' in o || 'translateX' in o || 'translateY' in o || 'translateZ' in o || 'rotate' in o || 'skew' in o || 'scale' in o || 'scaleX' in o || 'scaleY' in o || 'perspective' in o || 'scale3d' in o || 'translate3d' in o || 'rotate3d' in o || 'rotateX' in o || 'rotateY' in o || 'rotateZ' in o){
				if('perspective' in o){
					s += o['perspective'];
				}
				if('translate3d' in o){
					s += o['translate3d'];
				}
				if('scale3d' in o){
					s += o['scale3d'];
				}
				if('rotate3d' in o){
					s += o['rotate3d'];
				}
				if('rotateX' in o){
					s += 'rotateX(' + o['rotateX'] + ') ';
				}
				if('rotateY' in o){
					s += 'rotateY(' + o['rotateY']+ ') ';
				}
				if('rotateZ' in o){
					s += 'rotateZ(' + o['rotateZ']+ ') ';
				}
				if('translateZ' in o){
					s += o['translateZ'];
				}
				if('translateX' in o && 'translateY' in o){
					s += 'translate('+ o['translateX'] + 'px, ' + o['translateY'] + 'px) ' ;
				}else{
					if('translateX' in o){
						s += 'translateX(' + o['translateX'] + ') ' ;
					}
					if('translateY' in o){
						s += 'translateY(' + o['translateY'] + ') ';
					}				
				}
				if('translate' in o){
					s += 'translate(' + o['translate']['x'] + 'px,' + o['translate']['y'] + 'px) ';
				}
				if('scaleX' in o){
					s += o['scaleX'];
				}
				if('scaleY' in o){
					s += o['scaleY'];
				}
				if('scale' in o){
					s += 'scale('+o['scale']['x']+','+o['scale']['y']+') ';
				}
				if('rotate' in o){
					s += 'rotate('+ o['rotate'] +'deg) ';
				}
				if('skew' in o){
					s += 'skew('+ o['skew'] +'deg) ';
				}
			}
		return s;
	}
	function createHTML(){
		var onlycss = $('#onlycss_ck').prop('checked');
		var s = '',
			_n = '\n',
			_t = '\t';
		var zcript = 'script';
		var cta = '';
		var initFoo = '';
		var bnrjs = $('.bnr').val();
		var name = $('#banner_txt').val() + data.container.width + 'x' + data.container.height;
		var rm = $('#rm_sl').val();
		var scenes = parseInt($('#scenes_txt').val());
		if(!onlycss){
			s += '<!DOCTYPE html>' + _n;
			s += '<html lang="en">' + _n;
			s += '<head>' + _n;
			s += '<title>'+ name +'</title>' + _n;
			s += '<meta charset="UTF-8">' + _n;
			s += '<meta name="ad.size" content="width='+data.container.width+',height='+data.container.height+'">' + _n;
			s += '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />' + _n;
			if(rm == 'dcm'){
				s += '<'+zcript+' type="text/javascript">'+_n+'var clickTag = "http://www.google.com";'+_n+ '//Validate with https://h5validator.appspot.com/dcm'+_n+'</'+zcript+'>'+ _n;
			}
			if(rm == 'dc'){
				s += '<'+zcript+' src="http://s0.2mdn.net/ads/studio/Enabler.js" type="text/javascript"></'+zcript+'>' + _n;
			}
			s += '<style type="text/css" media="screen">' + _n;	
		}

		s += createCSS();

		if(!onlycss){
			s += '</style>' + _n;
			if(rm == 'sizmek'){
				s += '<'+zcript+' src="scripts/EBLoader.js"></'+zcript+'>' + _n;
				s += '<!-- //Contents of scripts/EBLoader.js:' + _n + 'function loadServingSysScript(relativeUrl) {' + _n + _t + 'document.write("<script src=\'" + (document.location.protocol === "https:" ? "https://secure-" : "http://") + "ds.serving-sys.com/BurstingScript/" + relativeUrl + "\'><\/script>")' + _n + '}' + _n + '//Load secure or insecure version of EBLoader' + _n + 'loadServingSysScript("EBLoader.js");'+_n+' -->'+_n;
			}
			s += '</head>' + _n;
			s += '<body>' + _n;
			if(rm == 'atlas'){
				s += '<a href="{{PUB_CLICKTHROUGH}}" target="_blank">' + _n;
			}
			s += '<div class="banner">' + _n;
			s += '<div class="' + $('#vcam_name').val() + '">' + _n;
			for(var i = 0; i < data.layers.length; i++){
				var divName = $(data.layers[i]).attr('id');
				s += _t + '<div class="' + divName + '">';
				if(data.svg[divName]){
					s +=  _n + getLayerProperty(divName, 'svg') + _n; 
				}
				s += _t + '</div>' + _n;
				
			}
			s += '</div>' + _n;
			s += '</div>' + _n;
			if(rm == 'atlas'){
				s += '</a>' + _n;
			}
			var scenesCode = '';
			for(var i = 1; i <= scenes; i++ ){
				var dur = (i == 1)?'0':'';
				scenesCode += _t + "["+dur+",function(){bnr.appendClass($banner,'scene" + i + "');}]";
				if(i < scenes){
					scenesCode += ',';
				}
				scenesCode += _n;
			}
			bnrjs = bnrjs.replace('@SCENES@', scenesCode);
			if(rm == 'dc'){
				initFoo += 'function adVisibilityHandler(evt){' + _n + _t +'bnr.timeline(tl,frameDuration);' + _n + '}' + _n;
				initFoo += 'function pageLoadedHandler(evt){' + _n + _t +'if (Enabler.isVisible()) {' + _n + _t +_t +'adVisibilityHandler();' + _n + _t +'}else {' + _n + _t +_t +'Enabler.addEventListener(studio.events.StudioEvent.VISIBLE, adVisibilityHandler);' + _n + _t +'}' + _n + '}' + _n;
				initFoo += 'function enablerInitHandler(evt){' + _n + _t +'if (Enabler.isPageLoaded()) {' + _n + _t +_t +'pageLoadedHandler();' + _n + _t +'}else {' + _n + _t +_t +'Enabler.addEventListener(studio.events.StudioEvent.PAGE_LOADED, pageLoadedHandler);' + _n + _t +'}' + _n + '}' + _n;
				initFoo += 'if (Enabler.isInitialized()) {' + _n + _t +'enablerInitHandler();' + _n + '}else{' + _n + _t +'Enabler.addEventListener(studio.events.StudioEvent.INIT, enablerInitHandler);' + _n +'}' + _n;
				bnrjs = bnrjs.replace('@INIT@', initFoo);
			}else if(rm == 'flashtalking'){
				initFoo += 'var myFT = new FT();' + _n;
				initFoo += "myFT.addEventListener('ready', function(){bnr.timeline(tl,frameDuration);});" + _n;
				cta += 'myFT.applyClickTag($banner, 1);'+ _n;
				bnrjs = bnrjs.replace('@INIT@', initFoo);
				bnrjs = bnrjs.replace('@CTA@', cta);
			}else if(rm == 'sizmek'){
				initFoo += 'function init(){'+ _n + _t + "bnr.on($banner,'click',function(evt){EB.clickthrough()});" + _n + _t + 'bnr.timeline(tl,frameDuration);' + _n + '}' + _n; 
				initFoo += 'function initEB(){' + _n + _t + 'if(!EB.isInitialized()){' + _n + _t + _t + 'EB.addEventListener(EBG.EventName.EB_INITIALIZED, init});' + _n + _t + '}else{' + _n + _t + _t + 'init();' + _n + _t + '}' + _n + '}' + _n + "window.addEventListener('load', initEB);" + _n;
				bnrjs = bnrjs.replace('@INIT@', initFoo);
			}else{
				bnrjs = bnrjs.replace('@INIT@', 'bnr.timeline(tl,frameDuration);');
			}
			if(rm == 'dcm'){
				cta += "bnr.on($banner,'click', function(){ window.open(window.clickTag); });" + _n;
				bnrjs = bnrjs.replace('@CTA@', cta);
			}else if(rm == 'dc'){
				cta += "bnr.on($banner,'click', function(){ Enabler.exit('clickTag'); });" + _n;
				bnrjs = bnrjs.replace('@CTA@', cta);
			}else{
				bnrjs = bnrjs.replace('@CTA@', '');
			}
			/*
	<!--[if lte IE 9]>
	<div class="ie9">Show backup image</div>
	<![endif]-->
			*/
			if(rm == 'flashtalking'){
				s += '<!--' + _n;
				s += '/* save as manifest.js */' + _n;
				s += 'FT.manifest({"filename":"'+name+'.html","width":"'+data.container.width+'","height":"'+data.container.height+'","clickTagCount":1});' + _n;
				s += '-->' + _n;
				s += '<'+zcript+' src="http://cdn.flashtalking.com/frameworks/js/api/2/8/html5API.js"></'+zcript+'>' + _n;
			}
			s += '<'+zcript+'  type="text/javascript">' + _n + bnrjs + _n + '</'+zcript+'>' + _n;
			s += '</body>' + _n;
			s += '</html>' + _n;			
		}
		return s;
	}
	function getScale(transform){
		var matrixArr = transform.replace('matrix(', '').replace(')', '').split(',');
		return {x: parseFloat(matrixArr[0]), y: parseFloat(matrixArr[3])};
	}
	function getLayerProperty(id, prop){
		var $layer = (typeof id === 'string')?$(getElement(id)):id;
		var name = $layer.attr('id');
		var $iLayer = $('#' + name + constants.I_LAYER);
		var $oLayer = $('#' + name + constants.O_LAYER);
		if(prop == 'svg'){
			return document.getElementById(id + constants.I_LAYER).innerHTML;
		}
		if(prop == 'image-data'){
			return $iLayer.css('background-image');
		}
		if(prop == 'image-layer'){
			return $iLayer;
		}
		if(prop == 'background-position'){
			return $iLayer.css('background-position');
		}
		if(prop == 'background-size'){
			return $iLayer.css('background-size');
		}
		if(prop == 'width'){
			return parseInt($layer.css('width')) - 2;
		}
		if(prop == 'height'){
			return parseInt($layer.css('height')) - 2;
		}
		if(prop == 'left'){
			return parseInt($layer.css('left'));
		}
		if(prop == 'top'){
			return parseInt($layer.css('top'));
		}
		if(prop == 'imageWidth'){
			return data.imageInfo[name].width;
		}
		if(prop == 'imageHeight'){
			return data.imageInfo[name].height;
		}
		if(prop == 'filename'){
			return data.images[name] || data.imageInfo[name].filename;
		}
		if(prop == 'transform'){
			return $iLayer.css('transform') || $iLayer.css('-webkit-transform');
		}
		if(prop == 'transform-origin' || prop == 'transformOrigin'){
			return $iLayer.css('transform-origin') || $iLayer.css('-webkit-transform-origin');
		}
		if(prop == 'transform-origin%' || prop == 'transformOrigin%'){
			var raw = $iLayer.css('transform-origin') || $iLayer.css('-webkit-transform-origin');
			var to = raw.split(' ');
			var x = Math.round((parseInt(to[0]) / (parseInt($layer.css('width'))  - 2)) * 100);
			var y = Math.round((parseInt(to[1]) / (parseInt($layer.css('height')) - 2)) * 100);
			return x + '% ' + y + '%';
		}
		if(prop == 'opacity'){
			return fixDecimal($iLayer.css('opacity'));
		}
		return null;
	}
	function getLayerClass($layer, tCSS){
		//tCSS is for use in trancissioner
		var s = '',
			_n = '\n',
			_t = '\t';
			var name = $layer.attr('id');
			var $oLayer = $('#' + name + constants.O_LAYER);
			var $iLayer = $('#' + name + constants.I_LAYER);
			var transform = getLayerProperty($layer, 'transform');
			var to = getLayerProperty($layer, 'transform-origin');
			if($('#toPos_ck').prop('checked')){
				to = getLayerProperty($layer, 'transform-origin%');
			}
			var op = getLayerProperty($layer, 'opacity');
			var left = getLayerProperty($layer, 'left') + 'px';
			var top = getLayerProperty($layer, 'top') + 'px';
			var w = getLayerProperty($layer, 'width') + 'px';
			var h = getLayerProperty($layer, 'height') + 'px';
			var filename = getLayerProperty($layer, 'filename');//data.layersByName[name]
			s += '.' + name + '{' + _n;
			s += _t + 'opacity: ' + ( tCSS ? '@OPACITY@': op ) + ';' + _n;
			s += _t + 'display: block;' + _n;
			s += _t + 'position: absolute;' + _n;
			s += _t + 'left: ' + (tCSS?'@LEFT@': left ) + ';' + _n;
			s += _t + 'top: ' + (tCSS?'@TOP@': top ) + ';' + _n;
			if(!data.svg[name]){
				s += _t + 'width: ' + w + ';' + _n;
				s += _t + 'height: ' + h + ';' + _n;
			}
			if(tCSS){
				s += '@TO@';
			}else{
				s += _t + 'transform-origin: ' + to + ';' + _n;
				s += _t + '-webkit-transform-origin: ' + to + ';' + _n;
				s += _t + '-ms-transform-origin: ' + to + ';' + _n;				
			}
			s += _t + '/* BACKGROUND */' + _n;
			if(data.images[name]){
				s += _t + 'background-image: url("'+ filename + '");' + _n;
				s += _t + 'background-repeat: no-repeat;' + _n;
				s += _t + 'background-position: ' + getLayerProperty($layer, 'background-position') + ';' + _n;
				s += _t + 'background-size: ' + getLayerProperty($layer, 'background-size')+ ';' + _n;
			}else if(data.imageInfo[name]){
				s += _t + 'background-image: url("'+ data.imageInfo[name].filename + '");' + _n;
				s += _t + 'background-repeat: no-repeat;' + _n;
				s += _t + 'background-position: ' + data.imageInfo[name].backgroundPosition + ';' + _n;
				s += _t + 'background-size: ' +  data.imageInfo[name].backgroundSize + ';' + _n;
			}
			s += _t + '/* TRANSFORM */' + _n;
			if(tCSS){
				s += '@MATRIX@';
			}else{
				if(transform != 'none'){
					s += _t + 'transform: ' + transform + ';' + _n;
					s += _t + '-webkit-transform: ' + transform + ';' + _n;
					s += _t + '-ms-transform: ' + transform + ';' + _n;	
				}else{
					s += _t + 'transform: none;' + _n;
					s += _t + '-webkit-transform: none;' + _n;
					s += _t + '-ms-transform: none;' + _n;	
				}
			}
			s += (tCSS)?'@FILTER@':'';
			s += (tCSS)?_t + 'will-change: @WILL_CHANGE@;' + _n:'';
			s += '}' + _n;		
		return s;
	}
	function createCSS(){
		var s = '',
			_n = '\n',
			_t = '\t';
		for(var i = 0; i < data.layers.length; i++){
			s += getLayerClass($(data.layers[i]));
		}
		s += 'html, body {' + _n;
		s += _t + 'margin: 0;' + _n;
		s += _t + 'padding: 0;' + _n;
		s += '}' + _n;
		s += 'a {' + _n;
		s += _t + 'text-decoration: none;' + _n;
		s += _t + 'color: #000;' + _n;
		s += _t + 'border: none;' + _n;
		s += '}' + _n;
		s += '.banner {' + _n;
		s += _t + 'display: block;' + _n;
		s += _t + 'position: absolute;' + _n;
		s += _t + 'overflow: hidden;' + _n;
		s += _t + 'width: ' + (data.container.width - 2) + 'px;' + _n;
		s += _t + 'height: ' + (data.container.height -2) + 'px;' + _n;
		s += _t + 'background-color: ' + data.container.bgColor + ';' + _n;
		if(data.background.file){
			s += _t + 'background-image: url(' + data.background.file.name + ');' + _n;
			s += _t + 'background-repeat: no-repeat;' + _n;
		}
		s += _t + 'border: 1px solid ' + data.container.borderColor + ';' + _n;
		s += _t + 'cursor: pointer;' + _n;
		s += _t + 'outline: none;' + _n;
		s += _t + '-webkit-tap-highlight-color: transparent;' + _n;
		s += _t + 'user-select: none;' + _n;
		s += _t + 'transform-style: preserve-3d;' + _n;
		s += _t + '-webkit-transform-style: preserve-3d;' + _n;
		s += _t + '-ms-transform-style: preserve-3d;' + _n;
		s += _t + 'transform: translate3d(0,0,0) rotateZ(0.001deg);' + _n;
		s += _t + '-webkit-transform: translate3d(0,0,0) rotateZ(0.001deg);' + _n;
		s += _t + '-ms-transform: translate3d(0,0,0) rotateZ(0.001deg);' + _n;
		s += _t + 'box-shadow: 0 0 1px rgba(0, 0, 0, 0);' + _n;
		s += _t + 'backface-visibility: hidden;' + _n;
		s += _t + '-webkit-backface-visibility: hidden;' + _n;
		s += _t + '-moz-osx-font-smoothing: grayscale;' + _n;
		s += '}' + _n;	
		return s;	
	}
	//EVENTS
	$guide_fl.change(function(evt){
		data.background.file = evt.target.files[0];
		if (data.background.file.type.match(/image.*/)){
			var reader = new FileReader();
			reader.onload = function(evt){
				var img = new Image();
				img.src = reader.result;
				changeSize(img.width,img.height);
				delete img;
				$stage.css('background-image', 'url(' + reader.result + ')');
			}
			reader.readAsDataURL(data.background.file);
		}
	});
	function populateSelectMenu(){
		var options = [];
		for(var name in data.layersByName){
			options.push('<option value="' + name + '">' + name + '</option>');
		}
		options.reverse();
		$('#elem_sl').html(options.join(''));
	}
	$('#elem_sl').change(function(evt){
		var $this = $(evt.target);
		var elem = $('#' + $this.val());
		selectLayer(elem);
	});
	$size_sl.change(function(evt){
		evt.stopPropagation();
		evt.preventDefault();
		var raw = $(evt.target).val().split('x');
		changeSize(raw[0],raw[1]);
	});
	$width_txt.change(function(evt){
		evt.stopPropagation();
		evt.preventDefault();
		changeSize($width_txt.val(),$height_txt.val());
		return false;
	});
	$height_txt.change(function(evt){
		evt.stopPropagation();
		evt.preventDefault();
		changeSize($width_txt.val(),$height_txt.val());
		return false;
	});
	$('#bgColor_txt, #borderColor_txt').change(function(evt){
		evt.stopPropagation();
		evt.preventDefault();
		changeColors($('#bgColor_txt').val(), $('#borderColor_txt').val());
		return false;
	});
	$('#overflow_ck').change(function(evt){
		$stage.toggleClass('hideOverflow');
	});
	function onDragStart(evt){
		var layer = getLayer(evt.target.id);
		if(layer === this){
			selectLayer(layer);
		}
	}
	function onDragStop(evt){
		var layer = getLayer(evt.target.id);
		updateHUD($(layer));
	}
	function handleFileSelect(evt) {
    	evt.stopPropagation();
    	evt.preventDefault();
    	buildImageLayer(evt.dataTransfer.files)
	}
	function handleDragOver(evt){
		evt.stopPropagation();
    	evt.preventDefault();
    	evt.dataTransfer.dropEffect = 'copy';
	}
	getElement('stage').addEventListener('dragover', handleDragOver, false);
  	getElement('stage').addEventListener('drop', handleFileSelect, false);
  	getElement('stage-container').addEventListener('dragover', handleDragOver, false);
  	getElement('stage-container').addEventListener('drop', handleFileSelect, false);

/*
  _                    ____ _ ____ ____  _                       
 | |_ _ __ __ _ _ __  / ___(_) ___/ ___|(_) ___  _ __   ___ _ __ 
 | __| '__/ _` | '_ \| |   | \___ \___ \| |/ _ \| '_ \ / _ \ '__|
 | |_| | | (_| | | | | |___| |___) |__) | | (_) | | | |  __/ |   
  \__|_|  \__,_|_| |_|\____|_|____/____/|_|\___/|_| |_|\___|_|   

*/
  	var currentTranCiSSioner = {target:null,name:'',x:0,y:0,css:'',matrix:''};
  	$('#trancissionerbutton').click(function(evt){
  		currentTranCiSSioner = {
  			target:data.$currentLayer,
  			name:data.$currentLayer.attr('id'),
  			width:parseFloat(data.$currentLayer.css('width')),
  			height:parseFloat(data.$currentLayer.css('height')),
  			x:parseFloat(data.$currentLayer.css('left')),
  			y:parseFloat(data.$currentLayer.css('top')),
  			css:getLayerClass(data.$currentLayer, true),
  			matrix:getLayerProperty(data.$currentLayer, 'transform'),
  			to:getLayerProperty(data.$currentLayer, 'transform-origin')
  		};
  		$('#scene_element_txt').val(currentTranCiSSioner.name);
  		$('#left_scene_txt').val(currentTranCiSSioner.x);
  		$('#top_scene_txt').val(currentTranCiSSioner.y);
  		$('#width_scene_txt').val(currentTranCiSSioner.width);
  		$('#height_scene_txt').val(currentTranCiSSioner.height);
  		$('.trancissioner_tools').show();
  		$('.overlay').show();
  	});
  	$('#width_scene_lbl, #height_scene_lbl').click(function(evt){
  		var $target = $(evt.currentTarget).attr('id');
  		if($target == $('#width_scene_lbl').attr('id')){
  			$('#offset_in_txt').val($('#width_scene_txt').val());
  			$('#offset_out_txt').val($('#width_scene_txt').val());
  		}else{
  			$('#offset_in_txt').val($('#height_scene_txt').val());
  			$('#offset_out_txt').val($('#height_scene_txt').val());
  		}
  	});
  	$('#trancissioner_close').click(function(evt){
  		$('.overlay').hide();
  		$('.trancissioner_tools').hide();
  	});
  	function sideMap(side, offset){
  		var map = {
			'tl' : {x:-offset, y:-offset},
			'top': {x:0, y:-offset},
			'tr' : {x:offset, y:-offset},
			'left': {x:-offset, y:0},
			'none': {x:0, y:0},
			'right': {x:offset, y:0},
			'bl': {x:-offset, y:offset},
			'bottom': {x:0, y:offset},
			'br': {x:offset, y:offset}		
  		};
  		return map[side];
  	}
  	function parseVii(obj, useWebkit){
  		var s = '',
			_n = '\n',
			_t = '\t';
		function usePX(val){
			if(val.indexOf('%') == -1){
				return 'px';
			}
			return '';
		}
		if(obj.o != null){
  			s += _t + 'opacity: ' + obj.o + ';' + _n;
  		}
  		if(obj.w != null){
  			s += _t + 'width: ' + obj.w + usePX(obj.w) + ';' + _n;
  		}
  		if(obj.h != null){
  			s += _t + 'height: ' + obj.h + usePX(obj.h) + ';' + _n;
  		}
  		var w = '';
  		if(useWebkit){
  			w = '-webkit-';
  		}
  		if(obj.x != null || obj.y != null || obj.r != null || obj.t != null || obj.s != null || obj.sx != null || obj.sy != null){
  			var t =  w + 'transform: ';
  			if(obj.x && obj.y ){
  				t += 'translate3d(' + obj.x + usePX(obj.x) +', ' + obj.y + usePX(obj.y) + ', 0) ';
  			}else if(obj.x){
  				t += 'translate3d(' + obj.x + usePX(obj.x) +', 0, 0) ';
  			}else if(obj.y){
  				t += 'translate3d(0, ' + obj.y + usePX(obj.y) + ', 0) ';
  			}else{
  				t += 'translate3d(0, 0, 0) '
  			}
  			if(obj.r){
  				t += 'rotate(' + obj.r + 'deg) ';
  			}else if(obj.rt){
  				t += 'rotate(' + obj.t + 'turn) ';
  			}
  			if(obj.s){
  				t += 'scale(' + obj.s + ') ';
  			}else if(obj.sx){
  				t += 'scale(' + obj.sx + ', 0) ';
  			}else if(obj.sy){
  				t += 'scale(0, ' + obj.sy + ') ';
  			}
  			t += ';' + _n;
  			s += _t + t;
  		}
  		return s;
  	}
  	function getVii(val){
  		var raw = val.toLowerCase().split(' ');
  		var retObj = {};
  		for(var i=0; i < raw.length; i++){
  			var keyValue = raw[i].split(':');
  			retObj[keyValue[0]] = keyValue[1];
  		}
  		return retObj;
  	}
  	function compareVii(obj1, obj2){
  		var ret = true;
  		for (var k in obj1){
  			if(obj2[k] == undefined || null){
  				ret = false;
  			}
  		}
  		return ret;
  	}
  	function trancissionerMagic(){
  		/* trancissioner MAGIC */
  		var s = '',
			_n = '\n',
			_t = '\t';
		/* RESTING POSITION */
		var offsetIn = parseFloat($('#offset_in_txt').val());
		var sideIn = $("input:radio[name=scene_in_rb]:checked").val();
		var sideOut = $("input:radio[name=scene_out_rb]:checked").val();
		var useMatrix = parseInt($('#trancissioner_useMatrix_sl').val());
		var blurIn  = $('#tcss_blur_in_ck').prop('checked') ?$('#tcss_blur_in_ck').val() :'';
		var blurOut = $('#tcss_blur_out_ck').prop('checked')?$('#tcss_blur_out_ck').val():'';
		var fadeIn = $('#tcss_fade_in_sl').val();
		var fadeOut= $('#tcss_fade_out_sl').val();
		var filterIn  = blurIn + ' ' + fadeIn;
		var filterOut = blurOut + ' ' + fadeOut;
		var willChange = {'opacity':true, 'left': false, 'top': false, 'transform': false};
		var useAnimation = $('#use_animation_ck').prop('checked');
		//INTRO ANIMATION
		var useTween = $('#intro_animation_use_tween').prop('checked');
		var aniEase = $('#intro_animation_tween_ease').val();
		var framesQty = +$('#intro_animation_tween_frames').val();
		//STAGGERED DELAY
		var isStaggered = +$('#anim_trans_staggered').val() > 1;
		var staggers = +$('#anim_trans_staggered').val();
		var staggerDuration = +$('#intro_animation_delay').val() || 0.5;
		var staggerWithNthChild = $('#anim_trans_stagger_nthchild_ck').prop('checked');
		var staggerIn = '';
		var staggerOut = '';
		var sm = sideMap(sideIn, offsetIn);
		var sceneIn = $('#scene_in_txt').val();
		var x1 = 0, y1 = 0, o1 = 0;
		x1 = (currentTranCiSSioner.x + sm.x) + 'px';
		y1 = (currentTranCiSSioner.y + sm.y) + 'px';
		o1 = (useAnimation)? 1 : parseFloat($('#opacity_in_txt').val()) + '';
		s += '/* LAYER: ' + currentTranCiSSioner.name + ' PROPERTIES */' + _n;
		var tempIn = currentTranCiSSioner.css;
		tempIn = tempIn.replace('@OPACITY@', o1);
		var $toIN = $('#to_in_sl').val();
		var $toOUT = $('#to_out_sl').val();
		var toIN = _t + 'transform-origin: ' + $toIN + ';' + _n;
		toIN += _t + '-webkit-transform-origin: ' + $toIN + ';' + _n;
		toIN += _t + '-ms-transform-origin: ' + $toIN + ';' + _n;
		tempIn = tempIn.replace('@TO@', toIN);
		if(useAnimation){
			tempIn = tempIn.replace('@LEFT@', currentTranCiSSioner.x + 'px');
			tempIn = tempIn.replace('@TOP@', currentTranCiSSioner.y + 'px');
			tempIn = tempIn.replace('@MATRIX@', '');
			tempIn = tempIn.replace('@FILTER@', '');
			tempIn = tempIn.replace('@WILL_CHANGE@', 'transform, opacity');
			s += tempIn;
			s += '/* animation for ' + currentTranCiSSioner.name + ' in scene # '+ sceneIn +' */' + _n;
			var kfName = currentTranCiSSioner.name + '-frames-scene' + sceneIn;
			var frame1 = $('#intro_animation_frame1').val();
			var frame2 = $('#intro_animation_frame2').val();
			var keyframes = '@keyframes ' + kfName + '{' + _n;
			if(useTween){
				var step = 100/framesQty;
				var currKF = 0;
				var iniObj = getVii($('#intro_animation_ini').val());
				var endObj = getVii($('#intro_animation_end').val());
				if(!compareVii(iniObj, endObj)){
					$('#intro_animation_end').css('border','1px solid red');
				}else{
					$('#intro_animation_end').css('border','');
				}
				var easeFoo = easings.getEase(aniEase);
				var updateFoo = function(t,c,b,e){
					return e(t) * c + b;
				}
				var viiStrings_arr = [];
				var kfPercents_arr = [];
				for(var i = 0; i <= framesQty; i++){
					keyframes += _t + currKF + '%{' + _n;
					var t = (i == 0)? 0 : i/framesQty;
					var b = 0;
					var c = 0;
					var vii = '';
					for(var k in iniObj){
						b = parseInt(iniObj[k]);
						c = parseInt(endObj[k]) - b;
						vii += k + ':' + fixDecimal(updateFoo(t, c, b, easeFoo)) + ' ';
					}
					kfPercents_arr.push(currKF);
					viiStrings_arr.push(vii);
					keyframes += _t + parseVii(getVii(vii), false);
					keyframes += _t + '}' + _n;
					currKF += step;
				}
				keyframes += '}' + _n;
				keyframes += '@-webkit-keyframes ' + kfName + '{' + _n;
				for(var i = 0; i < viiStrings_arr.length; i++){
					keyframes += _t + kfPercents_arr[i] + '%{' + _n;
					keyframes += _t + parseVii(getVii(viiStrings_arr[i]), true);
					keyframes += _t + '}' + _n;
				}
				keyframes += '}' + _n;
			}else{
				keyframes += _t + frame1 +'{' + _n;
				keyframes += parseVii(getVii($('#intro_animation_ini').val()), false);
				keyframes += _t + '}' + _n;
				keyframes += _t + frame2 +'{' + _n;
				keyframes += parseVii(getVii($('#intro_animation_end').val()), false);
				keyframes += _t + '}' + _n;
				keyframes += '}' + _n;
				keyframes += '@-webkit-keyframes ' + kfName + '{' + _n;
				keyframes += _t + frame1 +'{' + _n;
				keyframes += parseVii(getVii($('#intro_animation_ini').val()), true);
				keyframes += _t + '}' + _n;
				keyframes += _t + frame2 +'{' + _n;
				keyframes += parseVii(getVii($('#intro_animation_end').val()), true);
				keyframes += _t + '}' + _n;	
				keyframes += '}' + _n;		
			}
			s += keyframes;
			var dur = +$('#intro_animation_duration').val();
			var timeDur = (dur > 49)?'ms':'s';
			var loops = +$('#intro_animation_loops').val();
			if(loops < 1){
				loops = 'infinite';
			}
			var delay = +$('#intro_animation_delay').val();
			var timeDelay = (delay > 49)?'ms ':'s ';
			var fixedDelay = (delay === 0)? '' : delay + timeDelay; 
			if(isStaggered){
				fixedDelay = '';
			}
			var anim = 'animation: ' + kfName + ' ' + dur + timeDur + ' ' + $('#intro_animation_sl').val() + ' ' + fixedDelay + loops + ' ' + $('#intro_animation_direction').val() + ' ' + $('#intro_animation_fillmode').val() + ';' + _n;
			s += '/* scene '+ sceneIn + ' ' + currentTranCiSSioner.name + ' IN */' + _n;
			s += '.scene' + sceneIn  + ' .'+ currentTranCiSSioner.name + '{' + _n;
			s += _t + anim;
			s += _t + '-webkit-' + anim;
			s += '}' + _n;
			//stagger magic 
			if(isStaggered){
				for(i = 0; i < staggers; i++){
					var staggerName = (staggerWithNthChild) ? currentTranCiSSioner.name + ':nth-child(' + (i + 1) + ')' : currentTranCiSSioner.name + (i + 1) ;
					s += '/* scene ' + sceneIn + ' ' + staggerName + ' IN */' + _n;
					s += '.scene' + sceneIn + ' .' + staggerName + '{' + _n;
					s += _t + 'animation-delay: ' + (staggerDuration * (i+1)) + (staggerDuration >= 100?'ms':'s') + ';' + _n;
					s += _t + '-webkit-animation-delay: ' + (staggerDuration * (i+1)) + (staggerDuration >= 100?'ms':'s') + ';' + _n;
					s += '}' + _n;
				}				
			}
			return s;
		}
		if(useMatrix < 1){
			if(useMatrix == 0){
				tempIn = tempIn.replace('@LEFT@', x1);
				tempIn = tempIn.replace('@TOP@', y1);
				tempIn = tempIn.replace('@MATRIX@', '');	
			}else if (useMatrix == -1){
				tempIn = tempIn.replace('@LEFT@', currentTranCiSSioner.x + 'px');
				tempIn = tempIn.replace('@TOP@', currentTranCiSSioner.y + 'px');
				tempIn = tempIn.replace('@MATRIX@', '');
			}
		}else{
			tempIn = tempIn.replace('@LEFT@', currentTranCiSSioner.x + 'px');
			tempIn = tempIn.replace('@TOP@', currentTranCiSSioner.y + 'px');
			willChange.transform = true;
			var temp_mtrx = '';
			if(useMatrix == 1){
				var transformIn = new WebKitCSSMatrix(currentTranCiSSioner.matrix);
				transformIn = transformIn.rotate(parseInt($('#rotate_in_txt').val()));
				transformIn = transformIn.scale(parseFloat($('#scale_in_txt').val()));
				transformIn = transformIn.translate(sm.x, sm.y);
				temp_mtrx += _t + 'transform: ' + transformIn.toString() + ';' + _n;
				temp_mtrx += _t + '-webkit-transform: ' + transformIn.toString()  + ';' + _n;
				temp_mtrx += _t + '-ms-transform: ' + transformIn.toString()  + ';' + _n;			
			}else{
				var transformInS = 'scale('+$('#scale_in_txt').val()+') rotate('+$('#rotate_in_txt').val()+'deg) translate('+sm.x+$('#pfx_in_sl').val()+', '+sm.y+$('#pfx_in_sl').val()+')';
				temp_mtrx += _t + 'transform: ' + transformInS + ';' + _n;
				temp_mtrx += _t + '-webkit-transform: ' + transformInS  + ';' + _n;
				temp_mtrx += _t + '-ms-transform: ' + transformInS  + ';' + _n;
			}
			tempIn = tempIn.replace('@MATRIX@', temp_mtrx);			
		}
		//will-change
		var willChangeArr = ['opacity'];
		if(useMatrix < 1){
			if(useMatrix == 0){
				if(sideIn == 'tl' || sideIn == 'tr' || sideIn == 'bl' || sideIn == 'br' || sideOut == 'tl' || sideOut == 'tr' || sideOut == 'bl' || sideOut == 'br'){
					willChangeArr.push('left','top');
				}
				if(sideIn == 'top' || sideIn == 'bottom' || sideOut == 'top' || sideOut == 'bottom'){
					willChangeArr.push('top');
				}
				if(sideIn == 'left' || sideIn == 'right' || sideOut == 'left' || sideOut == 'right'){
					willChangeArr.push('left');
				}				
			}
		}else{
			willChangeArr.push('transform');
		}
		if(filterIn != ' ' || filterOut != ' '){
			willChangeArr.push('-webkit-filter');
			if(filterIn != ' '){
				tempIn = tempIn.replace('@FILTER@', _t + '-webkit-filter: ' + filterIn + ';' + _n);
			}
		}else{
			tempIn = tempIn.replace('@FILTER@', '');
		}
		tempIn = tempIn.replace('@WILL_CHANGE@', willChangeArr.join(', '));
		s += tempIn;
		/* SCENE IN */
		s += '/* scene '+ sceneIn + ' ' + currentTranCiSSioner.name + ' IN */' + _n;
		willChange = {'opacity':true, 'left': false, 'top': false};
		if(sideIn == 'tl' || sideIn == 'tr' || sideIn == 'bl' || sideIn == 'br'){
			willChange.left = willChange.top = !useMatrix;
		}else if(sideIn == 'top' || sideIn == 'bottom'){
			willChange.top = !useMatrix;
		}else if(sideIn == 'left' || sideIn == 'right'){
			willChange.left = !useMatrix;
		}
		s += '.scene' + sceneIn  + ' .'+ currentTranCiSSioner.name + '{' + _n;
		var transIn = [];
		var delayInFixed = $('#delay_in_txt').val() == '0'?'':$('#delay_in_txt').val() + 's';
		if(isStaggered){
			delayInFixed = '';
		}
		if(willChange.opacity){
			s += _t + 'opacity: 1;' + _n;
			transIn.push('opacity ' + $('#duration_in_txt').val() + 's' + ' ' + $('#ease_in_sl').val() + ' ' +  delayInFixed);
		}
		if(useMatrix < 0){
			if(useMatrix == 0){
				if(willChange.left){
					s += _t + 'left: ' + $('#left_scene_txt').val() + 'px;' + _n;
					transIn.push('left ' + $('#duration_in_txt').val() + 's' + ' ' + $('#ease_in_sl').val() + ' ' + delayInFixed);
				}
				if(willChange.top){
					s += _t + 'top: ' + $('#top_scene_txt').val() + 'px;' + _n;
					transIn.push('top ' + $('#duration_in_txt').val() + 's' + ' ' + $('#ease_in_sl').val() + ' ' + delayInFixed);
				}				
			}
		}else{
			willChange.transform = true;
			s += _t + 'transform: ' + currentTranCiSSioner.matrix + ';' + _n;
			s += _t + '-webkit-transform: ' + currentTranCiSSioner.matrix  + ';' + _n;
			s += _t + '-ms-transform: ' + currentTranCiSSioner.matrix  + ';' + _n;
			transIn.push('@TRANSFORM@ ' + $('#duration_in_txt').val() + 's' + ' ' + $('#ease_in_sl').val() + ' ' + delayInFixed);
		}
		if(filterIn != ' '){
			s += _t + '-webkit-filter: none;' + _n;
			transIn.push('-webkit-filter ' + $('#duration_in_txt').val() + 's' + ' ' + $('#ease_in_sl').val() + ' ' + delayInFixed);
		}
		s += _t + '/* duration: ' + $('#duration_in_txt').val() + ', ease: ' + $('#ease_in_sl option:selected').text() + ', delay: '+ $('#delay_in_txt').val() + ' */' + _n;
		s += _t + 'transition: ' + transIn.join(', ').replace('@TRANSFORM@', 'transform') + ';' + _n;
		s += _t + '-webkit-transition: ' + transIn.join(', ').replace('@TRANSFORM@', '-webkit-transform') + ';' + _n;
		s += '}' + _n; 
		//Stagger
		var staggerDuration = +$('#delay_in_txt').val() || 0.5;
		if(isStaggered){
			for(i = 0; i < staggers; i++){
				var staggerName = (staggerWithNthChild) ? currentTranCiSSioner.name + ':nth-child(' + (i + 1) + ')' : currentTranCiSSioner.name + (i + 1) ;
				staggerIn += '/* scene ' + sceneIn + ' ' + staggerName + ' IN */' + _n;
				staggerIn  += '.scene' + sceneIn + ' .' + staggerName + '{' + _n;
				staggerIn  += _t + 'transition-delay: ' + fixDecimal(staggerDuration * (i+1)) + (staggerDuration >= 100?'ms':'s') + ';' + _n;
				staggerIn  += _t + '-webkit-transition-delay: ' + fixDecimal(staggerDuration * (i+1)) + (staggerDuration >= 100?'ms':'s') + ';' + _n;
				staggerIn  += '}' + _n;
			}			
		}
		/* SCENE OUT */
		var sceneOut = $('#scene_out_txt').val();
		if(sceneOut > '0'){
			var offsetOut = parseFloat($('#offset_out_txt').val());
			sm = sideMap(sideOut, offsetOut);
			var x2 = 0, y2 = 0, o2 = 0;
			x2 = (currentTranCiSSioner.x + sm.x) + 'px';
			y2 = (currentTranCiSSioner.y + sm.y) + 'px';
			o2 = parseFloat($('#opacity_out_txt').val()) + '';
			s += '/* scene '+ sceneOut + ' ' + currentTranCiSSioner.name + ' OUT */' + _n;
			s += '.scene' + sceneOut + ' .'+ currentTranCiSSioner.name +'{' + _n;
			willChange = {'opacity':true, 'left': false, 'top': false};
			if(sideOut == 'tl' || sideOut == 'tr' || sideOut == 'bl' || sideOut == 'br'){
				willChange.left = willChange.top = !useMatrix;
			}else if(sideOut == 'top' || sideOut == 'bottom'){
				willChange.top = !useMatrix;
			}else if(sideOut == 'left' || sideOut == 'right'){
				willChange.left = !useMatrix;
			}
			var transOut = [];
			var delayOutFixed = $('#delay_out_txt').val() == '0'?'':' ' + $('#delay_out_txt').val() + 's';
			if(isStaggered){
				delayOutFixed = ' ';
			}
			if(willChange.opacity){
				s += _t + 'opacity: '+ o2 + ';' + _n;
				transOut.push('opacity ' + $('#duration_out_txt').val() + 's' + ' ' + $('#ease_out_sl').val() + delayOutFixed);
			}
			if(useMatrix < 1){
				if(useMatrix == 0){
					if(willChange.left){
						s += _t + 'left: ' + x2 + ';'  + _n;
						transOut.push('left ' + $('#duration_out_txt').val() + 's' + ' ' + $('#ease_out_sl').val() + delayOutFixed);
					}
					if(willChange.top){
						s += _t + 'top: ' + y2 + ';' + _n;
						transOut.push('top ' + $('#duration_out_txt').val() + 's' + ' ' + $('#ease_in_sl').val() + delayOutFixed);
					}						
				}
			}else{
				willChange.transform = true;
				if(useMatrix == 1){
					var transformOut = new WebKitCSSMatrix();
					transformOut = transformOut.rotate(parseInt($('#rotate_out_txt').val()));
					transformOut = transformOut.scale(parseFloat($('#scale_out_txt').val()));
					transformOut = transformOut.translate(sm.x, sm.y);	
					s += _t + 'transform: ' + transformOut.toString() + ';' + _n;
					s += _t + '-webkit-transform: ' + transformOut.toString()  + ';' + _n;
					s += _t + '-ms-transform: ' + transformOut.toString()  + ';' + _n;
					
				}else{
					var transformOutS = 'scale('+$('#scale_out_txt').val()+') rotate('+$('#rotate_out_txt').val()+'deg) translate('+sm.x+$('#pfx_out_sl').val()+', '+sm.y+$('#pfx_out_sl').val()+')';
					s += _t + 'transform: ' + transformOutS + ';' + _n;
					s += _t + '-webkit-transform: ' + transformOutS  + ';' + _n;
					s += _t + '-ms-transform: ' + transformOutS  + ';' + _n;
				}
				transOut.push('@TRANSFORM@ ' + $('#duration_out_txt').val() + 's' + ' ' + $('#ease_out_sl').val() + delayOutFixed);					
			}
			if($toIN !== $toOUT){
				var toOUT = _t + 'transform-origin: ' + $toOUT + ';' + _n;
				toOUT += _t + '-webkit-transform-origin: ' + $toOUT + ';' + _n;
				toOUT += _t + '-ms-transform-origin: ' + $toOUT + ';' + _n;
				s += toOUT;				
			}
			if(filterOut != ' '){
				s += _t + '-webkit-filter: ' + filterOut + ';' + _n;
				transOut.push('-webkit-filter ' + $('#duration_out_txt').val() + 's' + ' ' + $('#ease_in_sl').val() + delayOutFixed);
			}
			s += _t + '/* duration: ' + $('#duration_out_txt').val() + ', ease ' + $('#ease_out_sl option:selected').text() + ', delay: '+ $('#delay_out_txt').val() + ' */' + _n;
			s += _t + 'transition: ' + transOut.join(', ').replace('@TRANSFORM@', 'transform') + ';' + _n;
			s += _t + '-webkit-transition: ' + transOut.join(', ').replace('@TRANSFORM@', '-webkit-transform') + ';' + _n;
			s += '}' + _n;	
			//Stagger
			var staggerDuration = +$('#delay_out_txt').val() || 0.3;
			if(isStaggered){
				for(i = 0; i < staggers; i++){
					var staggerName = (staggerWithNthChild) ? currentTranCiSSioner.name + ':nth-child(' + (i + 1) + ')' : currentTranCiSSioner.name + (i + 1) ;
					staggerOut += '/* scene ' + sceneOut + ' ' + staggerName + ' OUT */' + _n;
					staggerOut += '.scene' + sceneOut + ' .' + staggerName + '{' + _n;
					staggerOut += _t + 'transition-delay: ' + fixDecimal(staggerDuration * (i+1)) + (staggerDuration >= 100?'ms':'s') + ';' + _n;
					staggerOut += _t + '-webkit-transition-delay: ' + fixDecimal(staggerDuration * (i+1)) + (staggerDuration >= 100?'ms':'s') + ';' + _n;
					staggerOut += '}' + _n;
				}				
			}
		}
		s += staggerIn;
		s += staggerOut;
		return s;
  	}
  	$('#scene_element_txt').change(function(evt){
  		var nn = $(evt.target).val();
  		currentTranCiSSioner.css = currentTranCiSSioner.css.replace('.' + currentTranCiSSioner.name, '.' + nn);
  		currentTranCiSSioner.name = nn;
  	});
  	$('#ss_next_scene').click(function(evt){
  		var $sceneIn = $('#scene_in_txt'), $sceneOut = $('#scene_out_txt'), next = parseInt($sceneIn.val());
  		$sceneIn.val(next + 1);
  		if($sceneOut.val() != '0'){
  			$sceneOut.val(next + 2);
  		}
  		evt.preventDefault();
  	});
  	$('#trancissioner_app_button').click(function(evt){
		$('#transition_css_txt').val(trancissionerMagic());
		$('#transition_css_txt').select();
		//return s;
  	});
  	function getTCSSOffset(){
  		return Math.max(currentTranCiSSioner.width, currentTranCiSSioner.height);
  	}
  	$('#tcss_preset_in').change(function(evt){
  		var $this = $(evt.target);
	  	var ob = JSON.parse($this.val());
	  	$('#opacity_in_txt').val(ob.op);
	  	$('#offset_in_txt').val(getTCSSOffset());
	  	$('#rotate_in_txt').val(ob.rot);
	  	$('#scale_in_txt').val(ob.sc);
	  	$('#duration_in_txt').val(ob.dur);
	  	$('#delay_in_txt').val(ob.dy);
	  	$('#ease_in_sl option[value="'+ob.e+'"]').attr('selected', 'selected');
	  	$('input:radio[name="scene_in_rb"][value="'+ob.pos+'"]').prop('checked', 'checked');
  	});
  	$('#tcss_preset_out').change(function(evt){
  		var $this = $(evt.target);
	  	var ob = JSON.parse($this.val());
	  	$('#opacity_out_txt').val(ob.op);
	  	$('#offset_out_txt').val(getTCSSOffset());
	  	$('#rotate_out_txt').val(ob.rot);
	  	$('#scale_out_txt').val(ob.sc);
	  	$('#duration_out_txt').val(ob.dur);
	  	$('#delay_out_txt').val(ob.dy);
	  	$('#ease_out_sl option[value="'+ob.e+'"]').attr('selected', 'selected');
	  	$('input:radio[name="scene_out_rb"][value="'+ob.pos+'"]').prop('checked', 'checked');
  	});
//trancissioner animator
$('#use_animation_ck').click(function(evt){
	if($('#use_animation_ck').prop('checked')){
		$('#intro_anim').show();
	}else{
		$('#intro_anim').hide();
	}
});
/*
  ____             _ _         ____  _ _               
 / ___| _ __  _ __(_) |_ ___  / ___|| (_) ___ ___ _ __ 
 \___ \| '_ \| '__| | __/ _ \ \___ \| | |/ __/ _ \ '__|
  ___) | |_) | |  | | ||  __/  ___) | | | (_|  __/ |   
 |____/| .__/|_|  |_|\__\___| |____/|_|_|\___\___|_|   
       |_|                                             
*/
var $guideX = $('.ss_guide_vert'), $guideY = $('.ss_guide'), $guide2 = $('.ss_guide2'), $ss_container = $('.ss_container'), $ss_image = $('.ss_image'), $cuts = $('#ss_cuts_txt');
var currentSpriteSlice = {target:null,name:'', x:0, y:0, width:0, height:0, css:''};
var lastSSCut = 0;
$('#spriteslicerbutton').click(function(evt){
	//$cuts.val('');
	lastSSCut = 0;
	var $iLayer = $('#' + data.$currentLayer.attr('id') + constants.I_LAYER);
	currentSpriteSlice = {
		target:data.$currentLayer,
  		name:data.$currentLayer.attr('id'),
  		x:parseFloat(data.$currentLayer.css('left')),
  		y:parseFloat(data.$currentLayer.css('top')),
  		width:parseFloat($iLayer.css('width')),
  		height:parseFloat($iLayer.css('height')),
  		image: $iLayer.css('background-image'),
  		backgroundSize: $iLayer.css('background-size'),
  		bgPosition: $iLayer.css('background-position')
	};
	$ss_container.css('width', currentSpriteSlice.width + 'px');
	$ss_container.css('height', currentSpriteSlice.height + 'px');
	$ss_image.css('background-image', currentSpriteSlice.image);
	$ss_image.css('width', currentSpriteSlice.width + 'px');
	$ss_image.css('height', currentSpriteSlice.height + 'px');
	$ss_image.css('background-repeat', 'no-repeat');
	$ss_image.css('background-size', currentSpriteSlice.backgroundSize);
	$ss_image.css('background-position', currentSpriteSlice.bgPosition);
	$('.spriteSlicer_tools').show();
  	$('.overlay').show();
});
$('#spriteSlicer_close').click(function(evt){
  	$('.overlay').hide();
  	$('.spriteSlicer_tools').hide();
});
//follow mouse
$ss_container.on('mousemove', function(evt){
	var posY = Math.round(evt.pageY - $ss_container.offset().top);
	var posX = Math.round(evt.pageX - $ss_container.offset().left);
	var dir = $('#ss_direction_sl').val();
	var dist = (dir == 'horizontal')?Math.abs(posY - lastSSCut):Math.abs(posX - lastSSCut);
	if(dir == 'box'){
		var raw = (lastSSCut + '').split(':');
		var dx = Math.abs(posX - parseInt(raw[0]));
		var dy = Math.abs(posY - parseInt(raw[1]));
		dist = 'x: ' + dx + ' - y: ' + dy;
		dir = '';
	}
	$guideY.text('x: ' + posX +' - y: ' + posY + 'px ');
	$guideX.css('left', posX + 'px');
	$guideX.css('height', parseInt(currentSpriteSlice.height * 2) + 'px');
	$guideY.css('top', posY + 'px');
	$guide2.html($guideY.text() + dir + ' distance: ' + dist);
});
$ss_container.on('click', function(evt){
	var posX = Math.round(evt.pageX - $ss_container.offset().left);
	var posY = Math.round(evt.pageY - $ss_container.offset().top);
	var direction = $('#ss_direction_sl').val();
	var cuts;
	if(direction == 'horizontal'){
		cuts = $cuts.val() + posY + ',';
	}else if (direction == 'vertical'){
		cuts = $cuts.val() + posX + ',';
	}else{
		//box
		cuts = $cuts.val() + posX + ':' + posY  + ',';
	}
	$cuts.val(cuts);
});
$('#ss_transition_ck').on('change', function(evt){
	var $this = $(evt.target);
	if($this.prop('checked')){
		$('.trans-table').show();
	}else{
		$('.trans-table').hide();
	}
});
var currentSlices;
function createSlices(){
	var layered = $('#ss_layered_ck').prop('checked');
	var direction = $('#ss_direction_sl').val();
	var transition = $('#ss_transition_ck').prop('checked');
	var easeIn = $('#ss_ease_in').val();
	var easeOut = $('#ss_ease_out').val();
	var staggered = $('#ss_staggered_ck').prop('checked');
	var sliceIsScene = $('#ss_scene_per_slice_ck').prop('checked');
	var sceneIn = $('#ss_scene_in_txt').val();
	var sceneOut = $('#ss_scene_out_txt').val();
	var staggerIn = parseFloat($('#ss_delay_in').val());
	var staggerOut = parseFloat($('#ss_delay_out').val());
	var cutsCollection = $cuts.val().split(',');
	cutsCollection[cutsCollection.length - 1] = currentSpriteSlice.height + '';
	var s = '',
		_n = '\n',
		_t = '\t';
	var pos = {
		x:0, 
		y:0
	};
	var size = {
		width:0, 
		height:0
	};
	var offset = {
		x:0,
		y:0
	}
	var last = cutsCollection.length;
	currentSlices = [];
	s += '/* SPRITES: ' + direction + ' ' + $cuts.val() + ' */' + _n;
	var max = (direction == 'box')? cutsCollection.length - 1:cutsCollection.length;
	var boxCount = 1;
	for(var i=0; i < max; i++){
		var allowSlice = direction == 'horizontal' || direction == 'vertical' || direction == 'box'  && (i + 1)%2 != 0;
		if(allowSlice){
		var slice = {
			top: 0,
			left: 0,
			height: 0,
			width: 0,
			src: null,
			backgroundPositionY: 0,
			backgroundPositionX: 0,
			backgroundSize: null
		};
		var name = currentSpriteSlice.name + ((direction != 'box')?( i + 1 ):boxCount);
		++boxCount;
		var val = {x:0, y:0};
		s += '/* LAYER: ' + name + ' PROPERTIES */' + _n;
		s += '.' + name + ' {' + _n;
		if(transition){
			s += _t + 'opacity: 0;' + _n;
		}else{
			s += _t + 'opacity: 1;' + _n;
		}
		s += _t + 'display: block;' + _n;
		s += _t + 'position: absolute;' + _n;
		if(direction == 'horizontal'){
			val.y = parseInt(cutsCollection[i]);
			slice.top = currentSpriteSlice.y + pos.y;
			slice.left = currentSpriteSlice.x;
			slice.height = Math.abs(val.y - pos.y);
			slice.width = currentSpriteSlice.width;
			s += _t + 'left: ' + slice.left + 'px;' + _n;
			s += _t + 'top: ' + slice.top + 'px;' + _n;
			s += _t + 'width: ' + slice.width + 'px;' + _n;
			s += _t + 'height: ' + slice.height + 'px;' + _n;
			pos.y += (layered)?0:slice.height;
			slice.backgroundPositionY = offset.y * -1;
		}else if (direction == 'vertical'){
			val.x = parseInt(cutsCollection[i]);
			slice.top = currentSpriteSlice.y;
			slice.left = currentSpriteSlice.x + pos.x;
			slice.height = currentSpriteSlice.height;
			slice.width = Math.abs(val.x - pos.x);
			s += _t + 'left: ' + slice.left + 'px;' + _n;
			s += _t + 'top: ' + slice.top + 'px;' + _n;
			s += _t + 'width: ' + slice.width + 'px;' + _n;
			s += _t + 'height: ' + slice.height + 'px;' + _n;
			pos.x += (layered)?0:slice.width;
			slice.backgroundPositionX = offset.x * -1;
		}else{
			var xy = cutsCollection[i].split(':');
			var x = parseInt(xy[0]);
			var y = parseInt(xy[1]);
			var wh = cutsCollection[i+1].split(':');
			var w = Math.abs(parseInt(wh[0] - x));
			var h = Math.abs(parseInt(wh[1] - y));
			slice.top = y;
			slice.left = x;
			slice.height = h;
			slice.width = w;
			s += _t + 'top: ' + (y + currentSpriteSlice.y) + 'px;' + _n;
			s += _t + 'left: ' + (x + currentSpriteSlice.x) + 'px;' + _n;
			s += _t + 'width: ' + w + 'px;' + _n;
			s += _t + 'height: ' + h + 'px;' + _n;
			slice.backgroundPositionX = x * -1;
			slice.backgroundPositionY = y * -1;
		}
		var sliceImage = currentSpriteSlice;
		s += _t + 'background-image: url("'+ data.images[currentSpriteSlice.name] + '");' + _n;
		s += _t + 'background-repeat: no-repeat;' + _n;
		s += _t + 'background-position: ' + slice.backgroundPositionX + 'px ' + slice.backgroundPositionY + 'px;' + _n;
		s += _t + 'background-size: ' + currentSpriteSlice.backgroundSize + ';' + _n;
		slice.backgroundSize = currentSpriteSlice.backgroundSize;
		offset.x = val.x;
		offset.y = val.y;
		var transIn = $('#ss_trans_in').val();
		var transOut = $('#ss_trans_out').val();
		var onlyOpacity = transIn == 'none' && transOut == 'none';
		if(transition){
			if(onlyOpacity){
				s += _t + 'will-change: opacity;' + _n;
			}else{
				s += _t + 'will-change: opacity, transform;' + _n;
				s += _t + 'transform: ' + transIn + ';' + _n;
				s += _t + '-webkit-transform: ' + transIn + ';' + _n;
			}
		}
		s += '}' + _n;
		if(transition){
			var sIn = (sliceIsScene)?parseInt(sceneIn) + i:sceneIn;
			s += '/* scene ' + sIn + ' ' + name + ' APPEARS */' + _n;
			s += '.scene' + sIn + ' .' + name + '{' + _n;
			var staggeredDelay = (staggered)?(Math.round(((i + 1) * staggerIn) * 100)/100):staggerIn;
			var trans;
			s += _t + 'opacity: 1;' + _n;
			if(onlyOpacity){
				trans = 'transition: opacity ' + staggerIn + 's ' + easeIn + ' ' + staggeredDelay + 's;' + _n;
				s += _t + '/* duration: ' + staggerIn + ', ease: ' + $('#ss_ease_in option:selected').text() + ', transform: '+ transIn + ' */' + _n;
				s += _t + trans;
				s += _t + '-webkit-' + trans;
			}else{
				s += _t + 'transform: none;' + _n;
				s += _t + '-webkit-transform: none;' + _n;
				s += _t + '/* duration: ' + staggerIn + ', ease: ' + $('#ss_ease_in option:selected').text() + ', transform: '+ transIn + ' */' + _n;
				s += _t + 'transition: opacity ' + staggerIn + 's ' + easeIn + ' ' + staggeredDelay + 's, transform ' + staggerIn + 's ' + easeIn + ' ' + staggeredDelay + 's; '+ _n;
				s += _t + '-webkit-transition: opacity ' + staggerIn + 's ' + easeIn + ' ' + staggeredDelay + 's, -webkit-transform ' + staggerIn + 's ' + easeIn + ' ' + staggeredDelay + 's; '+ _n;
			}
			s += '}' + _n;
			var sOut = (sliceIsScene)?parseInt(sceneOut) + i:sceneOut;
			s += '/* scene ' + sOut + ' ' + name + ' DISAPPEARS */' + _n;
			s += '.scene' + sOut + ' .' + currentSpriteSlice.name + ( i + 1 ) + '{' + _n;
			s += _t + 'opacity: 0;' + _n;
			staggeredDelay = (staggered)?(Math.round(((i + 1) * staggerOut) * 100)/100):staggerOut;
			if(onlyOpacity){
				trans = 'transition: opacity ' + staggerOut + 's ' + easeOut + ' ' + staggeredDelay + 's;' + _n;
				s += _t + '/* duration: ' + staggerOut + ', ease: ' + $('#ss_ease_out option:selected').text() + ', transform: '+ transOut + ' */' + _n;
				s += _t + trans;
				s += _t + '-webkit-' + trans;
			}else{
				s += _t + 'transform: ' + transOut + ';' + _n;
				s += _t + '-webkit-transform: ' + transOut + ';' + _n;
				s += _t + '/* duration: ' + staggerOut + ', ease: ' + $('#ss_ease_out option:selected').text() + ', transform: '+ transOut + ' */' + _n;
				s += _t + 'transition: opacity ' + staggerOut + 's ' + easeOut + ' ' + staggeredDelay + 's, transform ' + staggerOut + 's ' + easeOut + ' ' + staggeredDelay + 's; '+ _n;
				s += _t + '-webkit-transition: opacity ' + staggerOut + 's ' + easeOut + ' ' + staggeredDelay + 's, -webkit-transform ' + staggerOut + 's ' + easeOut + ' ' + staggeredDelay + 's; '+ _n;
			}
			s += '}' + _n;
		}
		currentSlices.push(slice);
		}
	}
	$('#ss_code_txt').val(s).select();
}
$('#spriteSplicer_app_button').click(function(evt){
	createSlices();
});
$('#ss_apply').click(function(evt){
	var id = data.$currentLayer.attr('id'),
		$originalLayer = $(getElement(id)),
		filename = getLayerProperty(id, 'filename'),
		src = getLayerProperty(id,'image-data'),
		backgroundSize = getLayerProperty(id, 'background-size');
	for(var i=0; i < currentSlices.length; i++){
		//createLayer(name, x, y, width, height, bgColor, img)
		var slice = currentSlices[i],
			name = id + (i + 1),
			x = slice.left,
			y = slice.top,
			width = slice.width,
			height = slice.height,
			img = {
				width: width,
				height: height,
				src: src,
				backgroundPositionX: slice.backgroundPositionX,
				backgroundPositionY: slice.backgroundPositionY,
				backgroundSize: backgroundSize,
				filename: filename
			};
		createLayer(name, x, y, width, height, null, img);
	}
	destroyLayer(id);
	$('.overlay').hide();
  	$('.spriteSlicer_tools').hide();
});
$('#ss_direction_sl').on('change', function(evt){$cuts.val('');});
$('#ss_reset').click(function(evt){
	$cuts.val('');
});	
	//init
	onHUDEvents();
});