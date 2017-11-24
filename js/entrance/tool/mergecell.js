'use strict';
define(function(require) {
	var Backbone = require('lib/backbone'),
		send = require('basic/tools/send'),
		cache = require('basic/tools/cache'),
		strandMap = require('basic/tools/strandmap'),
		config = require('spreadsheet/config'),
		selectRegions = require('collections/selectRegion'),
		history = require('basic/tools/history'),
		cells = require('collections/cells'),
		Cell = require('models/cell'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		getOperRegion = require('basic/tools/getoperregion'),
		colList = headItemCols.models,
		rowList = headItemRows.models,
		cellList = cells.models,
		mergeCell;

	mergeCell = function(sheetId, label) {
		var cellStrand = cache.CellsPosition.strandX,
			startRowIndex,
			startColIndex,
			endRowIndex,
			endColIndex,
			region,
			operRegion,
			sendRegion,
			clip,
			originalCellsIndex = [],
			originalRuleIndex = [],
			firstCell,
			firstRuleIndex,
			tempCell,
			tempIndex,
			ruleIndex,
			occupyX = [],
			occupyY = [],
			aliasCol,
			aliasRow,
			width = 0,
			height = 0,
			modelAction,
			validateAction,
			i, j;

		clip = selectRegions.getModelByType('clip');
		if (clip !== undefined) {
			cache.clipState = 'null';
			clip.destroy();
		}

		region = getOperRegion(label);
		operRegion = region.operRegion;
		sendRegion = region.sendRegion;
		if (cache.protectState) {
			Backbone.trigger('event:showMsgBar:show', '保护状态，不能进行该操作');
			return;
		}

		if (operRegion.startColIndex === -1 || operRegion.startRowIndex === -1) {
			send.PackAjax({
				url: config.url.cell.merge,
				data: JSON.stringify({
					coordinate: sendRegion
				}),
			});
			return;
		}
		if (operRegion.endColIndex === 'MAX' || operRegion.endRowIndex === 'MAX') {
			return;
		}

		startRowIndex = operRegion.startRowIndex;
		startColIndex = operRegion.startColIndex;
		endRowIndex = operRegion.endRowIndex;
		endColIndex = operRegion.endColIndex;

		aliasCol = colList[startColIndex].get('alias');
		aliasRow = rowList[startRowIndex].get('alias');
		firstCell = cells.getCellByTransverse(startRowIndex, startColIndex)[0];
		firstCell = firstCell ? firstCell.clone() : new Cell();
		firstRuleIndex = strandMap.getPointRecord(aliasCol, aliasRow, 'validate');

		for (i = startRowIndex; i < endRowIndex + 1; i++) {
			for (j = startColIndex; j < endColIndex + 1; j++) {
				aliasCol = colList[j].get('alias');
				aliasRow = rowList[i].get('alias');
				if (!tempCell) {
					tempCell = cells.getCellByTransverse(i, j)[0];
					tempCell = tempCell && tempCell.get('content').texts !== '' ? tempCell.clone() : null;
					if (tempCell) {
						ruleIndex = strandMap.getPointRecord(aliasCol, aliasRow, 'validate');
					}
				}
				if (cellStrand[aliasCol] && (tempIndex = cellStrand[aliasCol][aliasRow]) !== undefined) {
					originalCellsIndex.push(tempIndex);
					cellList[tempIndex].set('isDestroy', true);
				}
				originalRuleIndex.push({
					colSort: colList[j].get('sort'),
					rowSort: rowList[i].get('sort'),
					originalIndex: strandMap.getPointRecord(aliasCol, aliasRow, 'validate')
				});
				
				cache.cachePosition(aliasRow, aliasCol, cells.length);
			}
		}

		if (!tempCell && firstCell) {
			tempCell = firstCell;
			ruleIndex = firstRuleIndex;
		} else if (!tempCell) {
			tempCell = new Cell();
		}

		//获取occupy信息
		for (i = 0; i < endColIndex - startColIndex + 1; i++) {
			occupyX.push(colList[startColIndex + i].get('alias'));
			width += colList[startColIndex + i].get('width') + 1;
		}
		for (i = 0; i < endRowIndex - startRowIndex + 1; i++) {
			occupyY.push(rowList[startRowIndex + i].get('alias'));
			height += rowList[startRowIndex + i].get('height') + 1;
		}
		tempCell.set('physicsBox', {
			top: rowList[startRowIndex].get('top'),
			left: colList[startColIndex].get('left'),
			width: width - 1,
			height: height - 1
		});
		tempCell.set('occupy', {
			x: occupyX,
			y: occupyY
		});
		cells.add(tempCell);



		for (i = startRowIndex; i < endRowIndex + 1; i++) {
			for (j = startColIndex; j < endColIndex + 1; j++) {
				aliasCol = colList[j].get('alias');
				aliasRow = rowList[i].get('alias');
				if (ruleIndex !== undefined) {
					strandMap.addPointRecord(aliasCol, aliasRow, 'validate', ruleIndex);
				} else {
					strandMap.deletePointRecord(aliasCol, aliasRow, 'validate');
				}
			}
		}


		modelAction = history.getCellCoverAction([cells.length - 1], originalCellsIndex);
		validateAction = history.getValidateUpdateAction({
			startRowSort: rowList[startRowIndex].get('sort'),
			endRowSort: rowList[endRowIndex].get('sort'),
			startColSort: colList[startColIndex].get('sort'),
			endColSort: colList[endColIndex].get('sort')
		}, ruleIndex, originalRuleIndex);
		
		history.addAction([modelAction, validateAction]);

		send.PackAjax({
			url: config.url.cell.merge,
			data: JSON.stringify({
				coordinate: sendRegion
			}),
		});

	};


	return mergeCell;
});