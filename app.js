'use strict';
requirejs.config({
	baseUrl: './js'
});
define(function(require) {
	var $ = require('lib/jquery'),
<<<<<<< HEAD
		SpreadSheet = require('spreadsheet/spreadsheet');
	window.SPREADSHEET_AUTHENTIC_KEY = $('#excelId').val();
	window.SPREADSHEET_BUILD_STATE = $('#build').val();
	var ss = new SpreadSheet('spreadSheet');
=======
		SpreadSheet = require('spreadsheet/spreadsheet'),
		re = require('entrance/sheet/redoundo');

	window.SPREADSHEET_AUTHENTIC_KEY = $('#excelId').val();
	window.SPREADSHEET_BUILD_STATE = $('#build').val();
	var ss = new SpreadSheet('spreadSheet');

	$('#t').on('click',function(){
		re.undo();
	});
	$('#tt').on('click',function(){
		re.redo();
	});
>>>>>>> feat(entrance/sheet/undoredu): complete undoredo feature
});