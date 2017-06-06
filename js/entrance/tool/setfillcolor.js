'use strict';
define(function(require) {
	var send = require('basic/tools/send'),
		config = require('spreadsheet/config'),
		cache = require('basic/tools/cache'),
		cells = require('collections/cells'),
		history = require('basic/tools/history'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		selectRegions = require('collections/selectRegion'),
		getOperRegion = require('basic/tools/getoperregion'),
		rowOperate = require('entrance/row/rowoperation'),
		colOperate = require('entrance/col/coloperation');

	/**
	 * 设置单元格填充颜色
	 * @param {string} sheetId sheetId
	 * @param {string} color   颜色值
	 * @param {string} label   行标，列标
	 */
	var setFillColor = function(sheetId, color, label) {
		var clip,
			region,
			operRegion,
			sendRegion,
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


		if (operRegion.endColIndex === 'MAX') { //整行操作
			rowOperate.rowPropOper(operRegion.startRowIndex, 'customProp.background', color);
		} else if (operRegion.endRowIndex === 'MAX') {
			colOperate.colPropOper(operRegion.startColIndex, 'customProp.background', color);
		} else {
			cells.operateCellsByRegion(operRegion, function(cell, colSort, rowSort) {
				if (cell.get('customProp').background !== color) {
					changeModelList.push({
						colSort: colSort,
						rowSort: rowSort,
						value: cell.get('customProp').background
					});
					cell.set('customProp.background', color);
				}
			});
			history.addUpdateAction('customProp.background', color, {
				startColSort: headItemColList[operRegion.startColIndex].get('sort'),
				startRowSort: headItemRowList[operRegion.startRowIndex].get('sort'),
				endColSort: headItemColList[operRegion.endColIndex].get('sort'),
				endRowSort: headItemRowList[operRegion.endRowIndex].get('sort')
			}, changeModelList);
		}
		send.PackAjax({
			url: config.url.cell.bg,
			data: JSON.stringify({
				sheetId: '1',
				coordinate: sendRegion,
				color: color
			})
		});
	};
	return setFillColor;
});