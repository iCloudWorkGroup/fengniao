'use strict';
define(function(require) {
	var send = require('basic/tools/send'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		selectRegions = require('collections/selectRegion'),
		cells = require('collections/cells'),
		getOperRegion = require('basic/tools/getoperregion'),
		rowOperate = require('entrance/row/rowoperation'),
		colOperate = require('entrance/col/coloperation');


	var setFontStyle = function(sheetId, italic, label) {
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
		if (italic === 'italic') {
			italic = true;
		} else if (italic === 'normal') {
			italic = false;
		} else {
			tempCellList = cells.getCellByVertical(operRegion.startColIndex,
				operRegion.startRowIndex,
				operRegion.endColIndex,
				operRegion.endRowIndex);
			if (tempCellList === null || tempCellList === undefined || tempCellList.length === 0) {
				italic = true;
			} else {
				italic = !tempCellList[0].get('content').italic;
			}
		}
		if (operRegion.endColIndex === 'MAX') { //整行操作
			rowOperate.rowPropOper(operRegion.startRowIndex, 'content.italic', italic);
		} else if (operRegion.endRowIndex === 'MAX') {
			colOperate.colPropOper(operRegion.startColIndex, 'content.italic', italic);
		} else {
			cells.operateCellsByRegion(operRegion, function(cell) {
				cell.set('content.italic', italic);
			});
		}
		sendData();
		function sendData() {
			send.PackAjax({
				url: config.url.cell.font_italic,
				data: JSON.stringify({
					coordinate: sendRegion,
					italic: italic
				})
			});
		}
	};
	return setFontStyle;
});