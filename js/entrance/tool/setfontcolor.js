'use strict';
define(function(require) {
	var send = require('basic/tools/send'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		selectRegions = require('collections/selectRegion'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		getOperRegion = require('basic/tools/getoperregion'),
		history = require('basic/tools/history'),
		cells = require('collections/cells'),
		rowOperate = require('entrance/row/rowoperation'),
		colOperate = require('entrance/col/coloperation');


	var setFontColor = function(sheetId, color, label) {
		var clip,
			region,
			operRegion,
			sendRegion,
			headItemRowList = headItemRows.models,
			headItemColList = headItemCols.models,
			changeModelList = [];
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
			cells.operateCellsByRegion(operRegion, function(cell, colSort, rowSort) {
				if (cell.get('content').color !== color) {
					changeModelList.push({
						colSort: colSort,
						rowSort: rowSort,
						value: cell.get('content').color
					});
					cell.set('content.color', color);
				}
			});
			history.addUpdateAction('content.color', color, {
				startColSort: headItemColList[operRegion.startColIndex].get('sort'),
				startRowSort: headItemRowList[operRegion.startRowIndex].get('sort'),
				endColSort: headItemColList[operRegion.endColIndex].get('sort'),
				endRowSort: headItemRowList[operRegion.endRowIndex].get('sort')
			}, changeModelList);
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