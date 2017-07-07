'use strict';
define(function(require) {
	var send = require('basic/tools/send'),
		selectRegions = require('collections/selectRegion'),
		cells = require('collections/cells'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		history = require('basic/tools/history'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		getOperRegion = require('basic/tools/getoperregion'),
		colOperate = require('entrance/col/coloperation'),
		rowOperate = require('entrance/row/rowoperation');

	var setWordWrap = function(sheetId, wordWrap, label) {
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

		if (wordWrap === undefined) {
			if (operRegion.endColIndex === 'MAX' || operRegion.endRowIndex === 'MAX') {
				wordWrap = true;
			} else {
				tempCellList = cells.getCellByVertical(operRegion.startColIndex,
					operRegion.startRowIndex,
					operRegion.endColIndex,
					operRegion.endRowIndex);
				if (tempCellList === null || tempCellList === undefined || tempCellList.length === 0) {
					wordWrap = true;
				} else {
					wordWrap = !tempCellList[0].get('wordWrap');
				}
			}
		}

		if (operRegion.endColIndex === 'MAX') {
			rowOperate.rowPropOper(region.startRowIndex, 'wordWrap', wordWrap);
		} else if (operRegion.endColIndex === 'MAX') {
			colOperate.colPropOper(region.startColIndex, 'wordWrap', wordWrap);
		} else {
			cells.oprCellsByRegion(operRegion, function(cell, colSort, rowSort) {
				if (cell.get('wordWrap') !== wordWrap) {
					changeModelList.push({
						colSort: colSort,
						rowSort: rowSort,
						value: cell.get('wordWrap')
					});
					cell.set('wordWrap', wordWrap);
				}
			});
			history.addUpdateAction('wordWrap', wordWrap, {
				startColSort: headItemColList[operRegion.startColIndex].get('sort'),
				startRowSort: headItemRowList[operRegion.startRowIndex].get('sort'),
				endColSort: headItemColList[operRegion.endColIndex].get('sort'),
				endRowSort: headItemRowList[operRegion.endRowIndex].get('sort')
			}, changeModelList);
		}
		sendData();

		function sendData() {
			send.PackAjax({
				url: config.url.cell.wordwrap,
				data: JSON.stringify({
					coordinate: sendRegion,
					wordWrap: wordWrap
				})
			});
		}
	};
	return setWordWrap;
});