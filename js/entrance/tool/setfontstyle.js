'use strict';
define(function(require) {
	var send = require('basic/tools/send'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		selectRegions = require('collections/selectRegion'),
		history = require('basic/tools/history'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		cells = require('collections/cells'),
		getOperRegion = require('basic/tools/getoperregion'),
		rowOperate = require('entrance/row/rowoperation'),
		colOperate = require('entrance/col/coloperation');


	var setFontStyle = function(sheetId, italic, label) {
		var clip,
			region,
			operRegion,
			sendRegion,
			tempCellList,
			headItemRowList = headItemRows.models,
			headItemColList = headItemCols.models,
			changeModelList = [];
		clip = selectRegions.getModelByType('clip');
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
			rowOperate.rowPropOper(operRegion.startRowIndex, operRegion.endRowIndex, 'content.italic', italic);
		} else if (operRegion.endRowIndex === 'MAX') {
			colOperate.colPropOper(operRegion.startColIndex, operRegion.endColIndex, 'content.italic', italic);
		} else {
			cells.oprCellsByRegion(operRegion, function(cell, colSort, rowSort) {
				if (cell.get('content').italic !== italic) {
					changeModelList.push({
						colSort: colSort,
						rowSort: rowSort,
						value: cell.get('content').italic
					});
					cell.set('content.italic', italic);
				}
			});
			history.addUpdateAction('content.italic', italic, {
				startColSort: headItemColList[operRegion.startColIndex].get('sort'),
				startRowSort: headItemRowList[operRegion.startRowIndex].get('sort'),
				endColSort: headItemColList[operRegion.endColIndex].get('sort'),
				endRowSort: headItemRowList[operRegion.endRowIndex].get('sort')
			}, changeModelList);
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