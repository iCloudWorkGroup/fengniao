'use strict';
define(function(require) {
	var send = require('basic/tools/send'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		selectRegions = require('collections/selectRegion'),
		getOperRegion = require('basic/tools/getoperregion'),
		cells = require('collections/cells'),
		rowOperate = require('entrance/row/rowoperation'),
		colOperate = require('entrance/col/coloperation');


	var setFontColor = function(sheetId, color, label) {
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
		if (operRegion.endColIndex === 'MAX') { //整行操作
			rowOperate.rowPropOper(operRegion.startRowIndex, 'content.color', color);
		} else if (operRegion.endRowIndex === 'MAX') {
			colOperate.colPropOper(operRegion.startColIndex, 'content.color', color);
		} else {
			cells.operateCellsByRegion(operRegion, function(cell) {
				cell.set('content.color', color);
			});
		}
		sendData();

		function sendData() {
			send.PackAjax({
				url: config.url.cell.font_color,
				data: JSON.stringify({
					sheetId: '1',
					coordinate: sendRegion,
					color: color
				})
			});
		}
	};
	return setFontColor;
});