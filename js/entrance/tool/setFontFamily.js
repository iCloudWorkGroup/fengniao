define(function(require) {
	'use strict';

	var $ = require('lib/jquery'),
		Backbone = require('lib/backbone'),
		send = require('basic/tools/send'),
		selectRegions = require('collections/selectRegion'),
		common = require('entrance/regionoperation'),
		sendRegion;

	var setFontFamily = function(sheetId, fontFamily, region) {
		sendRegion = common.regionOperation(sheetId, region, function(cell) {
			cell.set('content.family', fontFamily);
		});

		send.PackAjax({
			url: 'text.htm?m=font_family',
			data: JSON.stringify({
				excelId: window.SPREADSHEET_AUTHENTIC_KEY,
				sheetId: '1',
				coordinate: {
					startX: sendRegion.startColIndex,
					startY: sendRegion.startRowIndex,
					endX: sendRegion.endColIndex,
					endY: sendRegion.endRowIndex
				},
				family: fontFamily
			})
		});
	};
	return setFontFamily;
});