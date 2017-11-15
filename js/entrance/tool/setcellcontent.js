'use strict';
define(function(require) {
	var aspect = require('basic/util/aspect'),
		send = require('basic/tools/send'),
		cache = require('basic/tools/cache'),
		history = require('basic/tools/history'),
		getOperRegion = require('basic/tools/getoperregion'),
		selectRegions = require('collections/selectRegion'),
		cells = require('collections/cells'),
		cols = require('collections/headItemCol'),
		rows = require('collections/headItemRow'),
		protect = require('entrance/tool/protect'),
		validate = require('entrance/tool/validate'),
		config = require('spreadsheet/config'),
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
		
		return true;

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


	setCellContent = aspect.before(setCellContent, function(sheetId, text, label) {
		var region,
			operRegion,
			colAlias,
			rowAlias,
			colIndex,
			rowIndex;


		if (typeof text === 'undefined') {
			label = text;
			text = sheetId;
		}
		region = getOperRegion(label);
		operRegion = region.operRegion;
		colIndex = operRegion.startColIndex;
		rowIndex = operRegion.startRowIndex;
		colAlias = colList[colIndex].get('alias');
		rowAlias = rowList[rowIndex].get('alias');
		if (!validate.validate(text, colAlias, rowAlias, colIndex, rowIndex)) {
			return false;
		} else {
			return true;
		}
	});
	return setCellContent;
});