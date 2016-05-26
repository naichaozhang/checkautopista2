var options = {
	radius: 6,
	opacity: 0.8,
	lat: $.url().param('lat'),
	lon: $.url().param('lon'),
	z: $.url().param('z') || $.url().param('zoom'),
	id: ($.url().param('id') ? Number($.url().param('id')) : undefined),
	view: $.url().param('view') || 'tdenxuaALMX',
	tiles: ['tileCA2']
}

loadFromCookies();

colorToll = 'blue';
bgColorToll = '#8888FF';
colorExDest = 'green';
colorExExitTo = 'orange';
colorExName = '#1FFFFF';
colorExNone = '#B60000';
colorExUnmarked = 'black';
bgColorExUnmarked = 'grey';
colorExRef = '#00DB00';
colorExNoRefYes = 'yellow';
colorExNoRef = 'red';
colorAreas = '#F043B4';
bgColorAreas = '#D48FD1';
wColorAll = 'blue';
wColorNoLanes = 'orange';
wColorNoMaxspeed = 'yellow';
wColorNone = 'red';
wColorConstruction = 'black';
wColorProposed = 'grey';

$('document').ready(function () {
	$('table.stats tr#tolls td div#circle').css('border-color', colorToll);
	$('table.stats tr#tolls td div#circle').css('background', bgColorToll);
	$('table.stats tr#exDest td div#circle').css('border-color', colorExDest);
	$('table.stats tr#exExitTo td div#circle').css('border-color', colorExExitTo);
	$('table.stats tr#exName td div#circle').css('border-color', colorExName);
	$('table.stats tr#exNone td div#circle').css('border-color', colorExNone);
	$('table.stats tr#exUnmarked td div#circle').css('border-color', colorExUnmarked);
	$('table.stats tr#exUnmarked td div#circle').css('background', bgColorExUnmarked);
	$('table.stats tr#exRef td div#circle').css('background', colorExRef);
	$('table.stats tr#exRef td div#circle').css('border-color', 'white');
	$('table.stats tr#exNoRefYes td div#circle').css('background', colorExNoRefYes);
	$('table.stats tr#exNoRefYes td div#circle').css('border-color', 'white');
	$('table.stats tr#exNoRef td div#circle').css('background', colorExNoRef);
	$('table.stats tr#exNoRef td div#circle').css('border-color', 'white');
	$('table.stats tr#areas td div#circle').css('border-color', colorAreas);
	$('table.stats tr#areas td div#circle').css('background', bgColorAreas);

	$('table.stats tr#wAll td div#line').css('background', wColorAll);
	$('table.stats tr#wNoLanes td div#line').css('background', wColorNoLanes);
	$('table.stats tr#wNoMaxspeed td div#line').css('background', wColorNoMaxspeed);
	$('table.stats tr#wNone td div#line').css('background', wColorNone);

	$('#sliderOpacity').slider({
		min: 2,
		max: 10,
		value: options.opacity*10,
		change: function (event, ui) {
			options.opacity = $(this).slider('value')/10;
			mapDataLayer.eachLayer( function (layer) { if (layer.type=='marker') { layer.setStyle({opacity:options.opacity, fillOpacity:options.opacity}); }; });
			updateCookies();
		}
	});

	$('#sliderRadius').slider({
		min: 5,
		max: 20,
		value: options.radius,
		change: function (event, ui) {
			options.radius = $(this).slider('value');
			mapDataLayer.eachLayer( function (layer) { if (layer.type=='marker') { layer.setRadius(options.radius).setStyle({weight:options.radius/2}); }; });
			updateCookies();
		}
	});

	if (options.tiles.indexOf('tileOSM')!==-1) { $('#tileOSM .chk').prop('checked', true); } else { $('#tileOSM .chk').prop('checked', false); };
	if (options.tiles.indexOf('tileCA2')!==-1) { $('#tileCA2 .chk').prop('checked', true); } else { $('#tileCA2 .chk').prop('checked', false); };
	if (options.tiles.indexOf('tileMapillary')!==-1) { $('#tileMapillary .chk').prop('checked', true); } else { $('#tileMapillary .chk').prop('checked', false); };
	if (options.tiles.indexOf('tile30USCities')!==-1) { $('#tile30USCities .chk').prop('checked', true); } else { $('#tile30USCities .chk').prop('checked', false); };

	$('.stats .chk').change(function() {
		updateVisibility(this);
		updatePermalink();
	});

	$('.tile .chk').change(function() {
		updateTiles(this);
	});
})

function styleNode(node) {
	if (node.tags==undefined) { var color = {color: colorExUnmarked}; var fill = {fillColor: bgColorExUnmarked};
	} else if (node.tags.highway=='motorway_junction') {
		//Outer style
		if (node.hasDestination()) { var color = {color: colorExDest};
		} else if (node.exit_to!=undefined) { var color = {color: colorExExitTo};
		} else if (node.name!=undefined) { var color = {color: colorExName};
		} else { var color = {color: colorExNone}; };
		//Inner style
		if (node.ref!=undefined) { var fill = {fillColor: colorExRef};
		} else if (node.tags.noref=='yes') { var fill = {fillColor: colorExNoRefYes};
		} else { var fill = {fillColor: colorExNoRef}; };
	} else if (node.tags.highway=='services'||node.tags.highway=='rest_area') {
		var color = {color: colorAreas};
		var fill = {fillColor: bgColorAreas};
	} else if (node.tags.barrier=='toll_booth') {
		var color = {color: colorToll};
		var fill = {fillColor: bgColorToll};
	} else {
		var color = {color: colorExUnmarked};
		var fill = {fillColor: bgColorExUnmarked};
	}
	return $.extend(color, fill, {weight:options.radius/2, radius:options.radius, opacity:options.opacity, fillOpacity: options.opacity});
}

function styleWay(tags) {
	if (tags==undefined) { var style = {color: wColorNone};
	} else if (tags.highway=='construction') { var style = {color: wColorConstruction};
	} else if (tags.highway=='proposed') { var style = {color: wColorProposed};
	} else if (tags.highway=='services' || tags.highway=='rest_area') { var style = {color: colorAreas, fillColor: bgColorAreas};
	} else if (!tags.maxspeed && !tags.lanes) { var style = {color: wColorNone};
	} else if (!tags.maxspeed) { var style = {color: wColorNoMaxspeed};
	} else if (!tags.lanes) { var style = {color: wColorNoLanes};
	} else { var style = {color: wColorAll};
	};
	return $.extend(style,{smoothFactor:2, opacity:0.7, weight: 6});
}

function htmlInfo(element) {
	var html = '';
	if (element.subtype=='exit') {
		html += htmlJunctionPanel(element);
	};
	if (element.nodeID) {
		html += '<h3>Node : ' + element.nodeID + htmlButtons('node',element.nodeID) + '</h3>';
		html += htmlTagsTable(element);
	};
	if (element.wayID || element.correspondingWayID) {
		var wayID = element.wayID || element.correspondingWayID;
		html += '<h3>Way : ' + wayID + htmlButtons('way',wayID) + '</h3>';
		html += htmlTagsTable(way[wayID]);
	};
	html += '<p id="timestamp">' + fw[options.relID].timestamp + '</p>';
	return html;
}

function htmlJunctionPanel (element) {
	var ref = element.ref || '&nbsp;';
	var dest = element.getDestination() || element.exit_to || element.name || '&nbsp;';
	dest = dest.replace(/;/g, '</br>');
	var wayID = element.wayID || element.correspondingWayID;
	if (wayID!=undefined && way[wayID].tags['destination:ref']!=undefined) {
		var dest_ref = '';
		var destRefArray = way[wayID].tags['destination:ref'].split(/;/g);
		for (var i = 0; i < destRefArray.length; i++) {
			dest_ref += '<div class="panelText ref">'+
				destRefArray[i].replace(/ /g, '&nbsp;').replace(/-/g, '&#8209;')+'</div> ';
		};
	};
	if (wayID!=undefined && way[wayID].tags['destination:int_ref']!=undefined) {
		var dest_int_ref = '';
		var destIntRefArray = way[wayID].tags['destination:int_ref'].split(/;/g);
		for (var i = 0; i < destIntRefArray.length; i++) {
			dest_int_ref += '<div class="panelText ref">'+
			destIntRefArray[i].replace(/ /g, '&nbsp;').replace(/-/g, '&#8209;')+'</div> ';
		};
	};
	if (fw[options.relID].country == 'US') {
		var panel = 'panel USpanel';
		var exitSymbol = '<div class="exitSymbol USexitSymbol">EXIT</div>';
	} else {
		var panel = 'panel EUpanel';
		var exitSymbol = '<div class="exitSymbol EUexitSymbol"><img src="img/exit.svg" height="20px"/></div>';
	};
	var html = 	'<div class="'+panel+'">' +
					'<div class="subPanel ref">'+exitSymbol+ref.replace("<","&lt;")+'</div>' +
					'<div class="subPanel destination">'+
						'<table><tr>'+
							'<td class="destination">'+dest+'</td>'+
							'<td class="ref">'+(dest_int_ref!=undefined?dest_int_ref:'')+(dest_ref!=undefined?dest_ref:'')+'</td>'+
						'</tr></table>'+
					'</div>'+
				'</div>';
	return html;
}

function htmlMotorwayPanel (element) {
	if (fw[options.relID].country == 'US') {
		var panel = 'panel USpanel';
	} else {
		var panel = 'panel EUpanel';
	};
	var html = '<div class="'+panel+' road"><div class="subPanel road">';
	if (element.tags.symbol) {
		html += '<div class="symbol"><img src="'+element.tags.symbol+'"/></div>';
	} else {
		html += '<div class="ref'+(element.tags.network=='e-road'?' greenE':'')+'">' + (element.ref || '') +'</div>';
	}
	html += '<div class="name">'+element.name+'</div></div></div>';
	return html;
}

function htmlButtons (type, id) {
	html = '';
	if (type=='relation') {
		html += ' <button class="icon" onClick="fw['+id+'].zoom()" title="Zoom to motorway"><i class="fa fa-eye icon"></i></button>'+
			' <a href="https://www.openstreetmap.org/relation/'+id+'" target="_blank" title="OpenStreetMap">';
	};
	html += ' <a href="https://www.openstreetmap.org/'+type+'/'+id+'" target="_blank" title ="OpenStreetMap">'+
		'<button class="icon"><img class="icon" src="img/osm-logo.png"/></button></a>'+
		' <a href="http://127.0.0.1:8111/load_object?new_layer=false&objects='+type+id+'" target="_blank" title="JOSM editor">'+
		'<button class="icon"><img class="icon" src="img/josm-logo.png"/></button></a>'+
		' <a href="https://www.openstreetmap.org/edit?editor=id&'+type+'='+id+'" target="_blank" title="ID editor">'+
		'<button class="icon"><img class="icon" src="img/id-logo.png"/></button></a>'+
		' <a href="http://level0.osmz.ru/?url='+type+'/'+id+'" target="_blank" title="Level0 editor">'+
		'<button class="icon">L0</button></a>';
	if (type=='relation') {
		html += ' <a href="http://ra.osmsurround.org/analyzeRelation?relationId='+id+'" target="_blank" title="Relation Analyzer">'+
			'<button class="icon">An</button></a>'+
			' <a href="http://osmrm.openstreetmap.de/relation.jsp?id='+id+'" target="_blank" title="Relation Manager">'+
			'<button class="icon">Ma</button></a>';
	};
	return html;
}

function htmlTagsTable (element) {
	var html = '<table class="tags">';
	for (key in element.tags) {
		html += '<tr><td class="code key">'+key+'</td>'+
		'<td class="code">'+element.tags[key].replace('<','&lt;').replace(/;/g,';&#8203;') +'</td></tr>';
	};
	if (element.tags==undefined) { html += '<p>No tags</p>'};
	html += '</table>';
	return html;
}

function updateCookies () {
	// Saves options object to cookies

	Cookies.set('opacity',options.opacity);
	Cookies.set('radius',options.radius);
	Cookies.set('tiles',options.tiles.toString());
}

function loadFromCookies () {
	// Loads cookies info into options object

	if (Cookies.get('radius')!==undefined) {
		options.radius = Number(Cookies.get('radius')); 
	};
	if (Cookies.get('opacity')!==undefined) {
		options.opacity = Number(Cookies.get('opacity'));
	};
	if (Cookies.get('tiles')!==undefined) {
		options.tiles = Cookies.get('tiles').split(',');
	};
}