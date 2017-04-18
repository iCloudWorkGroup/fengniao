'use strict';
define(function(require) {
	var send = require('basic/tools/send'),
		cells = require('collections/cells'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		selectRegions = require('collections/selectRegion'),
		getOperRegion = require('basic/tools/getoperregion'),
		rowOperate = require('entrance/row/rowoperation'),
		colOperate = require('entrance/col/coloperation');


	var setFontSize = function(sheetId, fontSize, label) {
		var clip,
			region,
			operRegion,
			sendRegion;

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

		if (operRegion.endRowIndex === 'MAX') {
			colOperate.colPropOper(operRegion.startColIndex, 'content.size', fontSize);
		} else if (operRegion.endColIndex === 'MAX') { //整行操作
			rowOperate.rowPropOper(operRegion.startRowIndex, 'content.size', fontSize);
		} else {
			cells.operateCellsByRegion(operRegion, function(cell) {
				cell.set('content.size', fontSize);
			});
		}
		sendData();
		function sendData() {
			send.PackAjax({
				url: config.url.cell.font_size,
				data: JSON.stringify({
					sheetId: "1",
					coordinate: sendRegion,
					size: fontSize
				})
			});
		}

	};
	return setFontSize;
});