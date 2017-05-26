'use strict';
define(function(require) {
	var Handlebars = require('lib/handlebars'),
		templatesHTML = {},
		template = {};

	templatesHTML.BODYTEMPLATE = '<div class="main-layout">';
	templatesHTML.BODYTEMPLATE += '<table class="cui-grid" cellspacing="0" cellpadding="0" id="tableContainer">';
	templatesHTML.BODYTEMPLATE += '<tbody><tr><td><div class="left-corner"></div></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></tbody>';
	templatesHTML.BODYTEMPLATE += '</table><div class="input"></div></div>';
	templatesHTML.BODYTEMPLATE += '<div class="sheet-layout"><div class="sheet-body">';
	templatesHTML.BODYTEMPLATE += '<div class="sheet-cf-box glyphicons glyphicon-plus"></div>';
	templatesHTML.BODYTEMPLATE += '<div class="sheet-cf-box active glyphicons glyphicon-th-list"></div>';
	templatesHTML.BODYTEMPLATE += '<div class="sheet-cf-list"></div>';
	templatesHTML.BODYTEMPLATE += '</div>';

	templatesHTML.SHEETTEMPLATE = '<span>{{name}}</span>';

	templatesHTML.ROWHEADTEMPLATE = '<div class="item">{{displayName}}</div>';
	templatesHTML.COLHEADTEMPLATE = '<div class="item">{{displayName}}</div>';

	templatesHTML.INPUTTEMPLATE = '<div class="textarea"><textarea class="input-container"></textarea><div>';

	templatesHTML.SELECTTEMPLATE = '<div class="box"><div class="expand"></div><div class="bg"></div></div>';

	templatesHTML.CELLTEMPLATE = '<div class="bg" style="display:table-cell;">{{content.displayTexts}}</div>';

	templatesHTML.COLGRIDTEMPLATE = '<div class="col" style="left:{{left}}px;"></div>';
	templatesHTML.ROWGRIDTEMPLATE = '<div class="row" style="top:{{top}}px;"></div>';

	templatesHTML.COMMENTTEMPLAET = '<div></div>';


	function getTemplate(type) {
		var tmpType;
		if (tmpType = template[type]) {
			return tmpType;
		}
		tmpType = template[type] = Handlebars.compile(templatesHTML[type]);
		return tmpType;
	}
	return getTemplate;
});