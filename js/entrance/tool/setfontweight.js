'use strict';
define(function(require) {
	var send = require('basic/tools/send'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		selectRegions = require('collections/selectRegion'),
		getOperRegion = require('basic/tools/getoperregion'),
		history = require('basic/tools/history'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		cells = require('collections/cells'),
		colOperate = require('entrance/col/coloperation'),
		rowOperate = require('entrance/row/rowoperation');

	var setFontWeight = function(sheetId, bold, label) {
		var clip,
			region,
			operRegion,
			sendRegion,
			tempCellList,
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

		clip = selectRegions.getModelByType('clip')[0];
		if (clip !== undefined) {
			cache.clipState = 'null';
			clip.destroy();
		}
		if (bold === 'bold') {
			bold = true;
		} else if (bold === 'normal') {
			bold = false;
		} else {
			tempCellList = cells.getCellByVertical(operRegion.startColIndex,
				operRegion.startRowIndex,
				operRegion.endColIndex,
				operRegion.endRowIndex);
			if (tempCellList.length === 0) {
				bold = true;
			} else {
				bold = !tempCellList[0].get('content').bd;
			}
		}
		if (operRegion.endRowIndex === 'MAX') { //整列操作
			colOperate.colPropOper(operRegion.startColIndex, 'content.bd', bold);
		} else if (operRegion.endColIndex === 'MAX') { //整行操作
			rowOperate.rowPropOper(operRegion.startRowIndex, 'content.bd', bold);
		} else {
			cells.operateCellsByRegion(operRegion, function(cell, colSort, rowSort) {
				if (cell.get('content').bd !== bold) {
					changeModelList.push({
						colSort: colSort,
						rowSort: rowSort,
						value: cell.get('content').bd
					});
					cell.set('content.bd', bold);
				}
			});
			history.addUpdateAction('content.bd', bold, {
				startColSort: headItemColList[operRegion.startColIndex].get('sort'),
				startRowSort: headItemRowList[operRegion.startRowIndex].get('sort'),
				endColSort: headItemColList[operRegion.endColIndex].get('sort'),
				endRowSort: headItemRowList[operRegion.endRowIndex].get('sort')
			}, changeModelList);
		}
		sendData();
		function sendData() {
			send.PackAjax({
				url: config.url.cell.font_weight,
				data: JSON.stringify({
					coordinate: sendRegion,
					weight: bold
				})
			});
		}
	};
	return setFontWeight;
});