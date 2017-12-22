'use strict';
define(function(require) {
	var _ = require('lib/underscore'),
		Backbone = require('lib/backbone'),
		send = require('basic/tools/send'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		selectRegions = require('collections/selectRegion'),
		getOperRegion = require('basic/tools/getoperregion'),
		history = require('basic/tools/history'),
		cells = require('collections/cells'),
		cols = require('collections/headItemCol'),
		rows = require('collections/headItemRow'),
		colList = cols.models,
		rowList = rows.models,
		splitCell;

	splitCell = function(sheetId, label) {
		var region,
			operRegion,
			sendRegion,
			strand = cache.CellsPosition.strandX,
			startColIndex,
			startRowIndex,
			endColIndex,
			endRowIndex,
			selectCells,
			occupyCol,
			occupyRow,
			originalCellIndexs = [],
			currentCellIndexs = [],
			clip,
			i, j, len,
			aliasCol,
			aliasRow,
			currentCell,
			attributes,
			action;
		//选中区域内开始坐标，结束坐标
		clip = selectRegions.getModelByType('clip');
		if (clip !== undefined) {
			cache.clipState = 'null';
			clip.destroy();
		}
		if (cache.protectState) {
			Backbone.trigger('event:showMsgBar:show', '保护状态，不能进行该操作');
			return;
		}
		region = getOperRegion(label);
		operRegion = region.operRegion;
		sendRegion = region.sendRegion;
		if (operRegion.endColIndex === 'MAX' || operRegion.endRowIndex === 'MAX') {
			return;
		}
		if (operRegion.startColIndex === -1 || operRegion.startRowIndex === -1) {
			sendData();
			return;
		}
		startColIndex = operRegion.startColIndex;
		startRowIndex = operRegion.startRowIndex;
		endColIndex = operRegion.endColIndex;
		endRowIndex = operRegion.endRowIndex;

		//选中区域内所有单元格对象
		selectCells = cells.getCellByVertical(startColIndex, startRowIndex, endColIndex, endRowIndex);

		for (i = startColIndex; i < endColIndex + 1; i++) {
			for (j = startRowIndex; j < endRowIndex + 1; j++) {
				aliasCol = colList[i].get('alias');
				aliasRow = rowList[j].get('alias');
				currentCell = cells.getCellByVertical(i, j)[0];
				if (currentCell) {
					attributes = _.clone(currentCell.attributes);
					occupyCol = attributes.occupy.x[0];
					occupyRow = attributes.occupy.y[0];
					if (occupyCol !== aliasCol || occupyRow !== aliasRow) {
						attributes.content.texts = '';
						attributes.content.displayTexts = '';
					} else {
						originalCellIndexs.push(strand[occupyCol][occupyRow]);
					}
					cache.cachePosition(aliasRow, aliasCol, cells.length);
					currentCellIndexs.push(cells.length);
					cells.createCellModel(i, j, attributes);
				}
			}
		}


		for (i = 0, len = selectCells.length; i < len; i++) {
			selectCells[i].set('isDestroy', true);
		}
		action = history.getCellCoverAction(currentCellIndexs, originalCellIndexs);
		history.addAction(action);
		sendData();

		function sendData() {
			send.PackAjax({
				url: config.url.cell.split,
				data: JSON.stringify({
					coordinate: sendRegion
				}),
			});
		}
	};
	return splitCell;
});