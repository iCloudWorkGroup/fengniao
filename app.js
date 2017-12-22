requirejs.config({
	baseUrl: './js'
});
define(function(require) {
	'use strict';
	var $ = require('lib/jquery'),
		SpreadSheet = require('spreadsheet/spreadsheet');
	window.SPREADSHEET_AUTHENTIC_KEY = $('#excelId').val();
	window.SPREADSHEET_BUILD_STATE = $('#build').val();
	var ss = new SpreadSheet('spreadSheet');
	ss.batchFillBg('rgb(100,150,0)',{startCol:'T',endCol:'AF',startRow: '89',endRow: '110'});
});