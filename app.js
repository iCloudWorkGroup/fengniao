'use strict';
requirejs.config({
	baseUrl: './js'
});
define(function(require) {
	var $ = require('lib/jquery'),
		SpreadSheet = require('spreadsheet/spreadsheet');
	window.SPREADSHEET_AUTHENTIC_KEY = $('#excelId').val();
	window.SPREADSHEET_BUILD_STATE = $('#build').val();
	var ss = new SpreadSheet('spreadSheet');

	$('#t').click(function() {
		ss.batchSetBg('rgb(100,100,100)', ['A']);
	});
});