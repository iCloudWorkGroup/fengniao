'use strict';
requirejs.config({
	baseUrl: './js'
});
define(function(require) {
	var $ = require('lib/jquery'),
		SpreadSheet = require('spreadsheet/spreadsheet'),
		re = require('entrance/sheet/redoundo');

	window.SPREADSHEET_AUTHENTIC_KEY = $('#excelId').val();
	window.SPREADSHEET_BUILD_STATE = $('#build').val();
	var ss = new SpreadSheet('spreadSheet');

	$('#t').on('click',function(){
		ss.startHighlight();
	});
	$('#tt').on('click',function(){
		ss.stopHighlight();
	});
});