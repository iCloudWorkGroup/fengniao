'use strict';
define(function(require) {
	var $ = require('lib/jquery'),
		loadHtml;

	loadHtml = function(id) {
		var mainDomString = '',
			tailDomString = '';

		mainDomString += '<div class="main-layout">';
		mainDomString += '<table class="cui-grid" cellspacing="0" cellpadding="0" id="tableContainer">';
		mainDomString += '<tbody><tr><td><div class="left-corner"></div></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></tbody>';
		mainDomString += '</table><div class="input"></div></div>';
		mainDomString += '<div class="sheet-layout"><div class="sheet-body">';
		mainDomString += '<div class="sheet-cf-box glyphicons glyphicon-plus"></div>';
		mainDomString += '<div class="sheet-cf-box active glyphicons glyphicon-th-list"></div>';
		mainDomString += '<div class="sheet-cf-list">';
		mainDomString += '</div></div>';

		tailDomString += '<script type="text/x-handlebars-template" id="colsPanelContainer"></script>';
		tailDomString += '<script type="text/x-handlebars-template" id="rowsPanelContainer"></script>';
		tailDomString += '<script type="text/x-handlebars-template" id="mainContainer"></script>';
		tailDomString += '<script type="text/x-handlebars-template" id="contentList"></script>';
		tailDomString += '<script type="text/x-handlebars-template" id="tempSheetContainer"><span>{{name}}</span></script>';
		tailDomString += '<script type="text/x-handlebars-template" id="tempRowHeadItem"><div class="item">{{displayName}}</div></script>';
		tailDomString += '<script type="text/x-handlebars-template" id="tempColHeadItem"><div class="item">{{displayName}}</div></script>';
		tailDomString += '<script type="text/x-handlebars-template" id="multiselect"><div class="dragItem" style="top:{{top}}px;left:{{left}}px;width:{{width}}px;height:{{height}}px;"></div></script>';
		tailDomString += '<script type="text/x-handlebars-template" id="data">{{content.text}}</script>';
		tailDomString += '<script type="text/x-handlebars-template" id="textarea"><div class="textarea"><textarea class="input-container"></textarea><div></script>';
		tailDomString += '<script type="text/x-handlebars-template" id="tempSelectContainer"><div class="box"><div class="expand"></div><div class="bg"></div></div></script>';
		tailDomString += '<script type="text/x-handlebars-template" id="tempItemCell"><div class="bg" style="display:table-cell">{{cotent.texts}}</div></script>';
		tailDomString += '<script type="text/x-handlebars-template" id="comment"><div></div></script>';
		tailDomString += '<script type="text/x-handlebars-template" id="coltemp"><div class="col" style="left:{{left}}px;"></div></script>';
		tailDomString += '<script type="text/x-handlebars-template" id="rowtemp"><div class="row" style="top:{{top}}px;"></div></script>';

		$('#' + id)[0].innerHTML = mainDomString;
		$('#' + id).after(tailDomString);
	};
	return loadHtml;
});