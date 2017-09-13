'use strict';
define(function(require) {
	var send = require('basic/tools/send'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		selectRegions = require('collections/selectRegion'),
		history = require('basic/tools/history'),
		cells = require('collections/cells'),
		cols = require('collections/headItemCol'),
		rows = require('collections/headItemRow'),
		getOperRegion = require('basic/tools/getoperregion'),
		protect = require('entrance/tool/protect'),
		colList = cols.models,
		rowList = rows.models;

	var setCellContent = function(sheetId, text, label) {
		var clip,
			region,
			operRegion,
			sendRegion,
			changeModelList = [],
			tempText;

		clip = selectRegions.getModelByType('clip');
		if (clip !== undefined) {
			cache.clipState = 'null';
			clip.destroy();
		}
		if (typeof text === 'undefined') {
			text = sheetId;
		}
		region = getOperRegion(label);
		operRegion = region.operRegion;
		sendRegion = region.sendRegion;


		if (protect.interceptor({
				startColIndex: operRegion.startColIndex,
				startRowIndex: operRegion.startRowIndex
			})) {
			return;
		}

		operRegion.endColIndex = operRegion.startColIndex;
		operRegion.endRowIndex = operRegion.startRowIndex;
		sendRegion.endCol = sendRegion.startCol;
		sendRegion.endRow = sendRegion.startRow;


		cells.oprCellsByRegion(operRegion, function(cell, colSort, rowSort) {
			if ((tempText = cell.get('content').texts) !== text) {
				changeModelList.push({
					colSort: colSort,
					rowSort: rowSort,
					value: tempText
				});
				cell.set('content.texts', text);
			}
		});
		history.addUpdateAction('content.texts', text, {
			startColSort: colList[operRegion.startColIndex].get('sort'),
			startRowSort: rowList[operRegion.startRowIndex].get('sort'),
			endColSort: colList[operRegion.endColIndex].get('sort'),
			endRowSort: rowList[operRegion.endRowIndex].get('sort')
		}, changeModelList);
		sendData();

		function sendData() {
			send.PackAjax({
				url: config.url.cell.content,
				data: JSON.stringify({
					coordinate: sendRegion,
					content: text
				})
			});
		}
	};
	return setCellContent;
});