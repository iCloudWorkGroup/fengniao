'use strict';
define(function(require) {
	var send = require('basic/tools/send'),
		cells = require('collections/cells'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		selectRegions = require('collections/selectRegion'),
		getOperRegion = require('basic/tools/getoperregion'),
		colOperate = require('entrance/col/coloperation'),
		rowOperate = require('entrance/row/rowoperation');

	var setFontFamily = function(sheetId, fontFamily, label) {
		var clip,
			region,
			operRegion,
			sendRegion,
			tempCellList;
		clip = selectRegions.getModelByType('clip')[0];
		if (clip !== undefined) {
			cache.clipState = 'null';
			clip.destroy();
		}
		region = getOperRegion(label);
		operRegion = region.operRegion;
		sendRegion = region.sendRegion;

		if (operRegion.startColIndex === -1 || operRegion.startRowIndex === -1) {
			sendData();
			return;
		}

		if (operRegion.endColIndex === 'MAX') { //整行操作
			rowOperate.rowPropOper(operRegion.startRowIndex, 'content.family', fontFamily);
		} else if (operRegion.endRowIndex === 'MAX') {
			colOperate.colPropOper(operRegion.startColIndex, 'content.family', fontFamily);
		} else {
			cells.operateCellsByRegion(operRegion, function(cell) {
				cell.set('content.family', fontFamily);
			});
		}
		sendData();

		function sendData() {
			send.PackAjax({
				url: config.url.cell.font_family,
				data: JSON.stringify({
					coordinate: sendRegion,
					family: fontFamily
				})
			});
		}
	};
	return setFontFamily;
});