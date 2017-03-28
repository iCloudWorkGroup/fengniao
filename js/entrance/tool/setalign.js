'use strict';
define(function(require) {
	var send = require('basic/tools/send'),
		config = require('spreadsheet/config'),
		history = require('basic/tools/history'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		selectRegions = require('collections/selectRegion'),
		cells = require('collections/cells'),
		cache = require('basic/tools/cache'),
		getOperRegion = require('basic/tools/getoperregion'),
		rowOperate = require('entrance/row/rowoperation'),
		colOperate = require('entrance/col/coloperation');


	var setAlign = function(sheetId, alignType, label) {
		var url,
			type,
			transverse,
			vertical,
			clip,
			region,
			operRegion,
			sendRegion,
			propName,
			propValue,
			changeModelList = [],
			headItemRowList = headItemRows.models,
			headItemColList = headItemCols.models;

		clip = selectRegions.getModelByType('clip')[0];
		if (clip !== undefined) {
			cache.clipState = 'null';
			clip.destroy();
		}
		region = getOperRegion(label);
		operRegion = region.operRegion;
		sendRegion = region.sendRegion;


		switch (alignType) {
			case 'left':
				url = config.url.cell.align_transverse;
				transverse = 'left';
				break;
			case 'center':
				url = config.url.cell.align_transverse;
				transverse = 'center';
				break;
			case 'right':
				url = config.url.cell.align_transverse;
				transverse = 'right';
				break;
			case 'top':
				url = config.url.cell.align_vertical;
				vertical = 'top';
				break;
			case 'middle':
				url = config.url.cell.align_vertical;
				vertical = 'middle';
				break;
			case 'bottom':
				url = config.url.cell.align_vertical;
				vertical = 'bottom';
				break;
			default:
				return;
		}
		if (operRegion.startColIndex === -1 || operRegion.startRowIndex === -1) {
			sendData();
			return;
		}

		if (operRegion.endColIndex === 'MAX') { //整行操作
			if (transverse !== undefined) {
				rowOperate.rowPropOper(operRegion.startRowIndex, 'content.alignRow', transverse);
			} else {
				rowOperate.rowPropOper(operRegion.startRowIndex, 'content.alignCol', vertical);
			}
		} else if (operRegion.endRowIndex === 'MAX') { //整行操作
			if (transverse !== undefined) {
				colOperate.colPropOper(operRegion.startColIndex, 'content.alignRow', transverse);
			} else {
				colOperate.colPropOper(operRegion.startColIndex, 'content.alignCol', vertical);
			}
		} else {
			cells.operateCellsByRegion(operRegion, function(cell, colSort, rowSort) {
				if (transverse !== undefined) {
					propName = 'content.alignRow';
					propValue = transverse;
					if (cell.get('content.alignRow') !== transverse) {
						changeModelList.push({
							colSort: colSort,
							rowSort: rowSort,
							value: cell.get('content').alignRow
						});
						cell.set('content.alignRow', transverse);
					}
				} else {
					propName = 'content.alignCol';
					propValue = vertical;
					if (cell.get('content.alignCol') !== vertical) {
						changeModelList.push({
							colSort: colSort,
							rowSort: rowSort,
							value: cell.get('content').alignCol
						});
						cell.set('content.alignCol', vertical);
					}
				}

			});
			history.addUpdateAction(propName, propValue, {
				startColSort: headItemColList[operRegion.startColIndex].get('sort'),
				startRowSort: headItemRowList[operRegion.startRowIndex].get('sort'),
				endColSort: headItemColList[operRegion.endColIndex].get('sort'),
				endRowSort: headItemRowList[operRegion.endRowIndex].get('sort')
			}, changeModelList);
		}
		type = transverse || vertical;
		sendData();

		function sendData() {
			send.PackAjax({
				url: url,
				data: JSON.stringify({
					coordinate: sendRegion,
					align: type
				})
			});
		}
	};
	return setAlign;
});