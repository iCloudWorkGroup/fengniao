'use strict';
define(function(require) {
	var send = require('basic/tools/send'),
		cache = require('basic/tools/cache'),
		selectRegions = require('collections/selectRegion'),
		getOperRegion = require('basic/tools/getoperregion'),
		history = require('basic/tools/history'),
		cells = require('collections/cells'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		splitCell;

	splitCell = function(sheetId, label) {
		var headLineColList = headItemCols.models,
			headLineRowList = headItemRows.models,
			region,
			operRegion,
			sendRegion,
			startColIndex,
			startRowIndex,
			endColIndex,
			endRowIndex,
			selectRegionCells,
			cacheCell,
			occupy,
			cellPosi,
			originalCellIndexs = [],
			currentCellIndexs = [],
			clip,
			i, j, len,
			aliasCol,
			aliasRow;
		//选中区域内开始坐标，结束坐标
		clip = selectRegions.getModelByType('clip');
		if (clip !== undefined) {
			cache.clipState = 'null';
			clip.destroy();
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
		selectRegionCells = cells.getCellByVertical(startColIndex, startRowIndex, endColIndex, endRowIndex);
		len = selectRegionCells.length;

		
		cellPosi = cache.CellsPosition.strandX;
		for (i = 0; i < len; i++) {
			occupy=selectRegionCells[i].get('occupy');
			originalCellIndexs.push(cellPosi[occupy.x[0]][occupy.y[0]]);
		}

		//删除position索引
		for (i = 0; i < endColIndex - startColIndex + 1; i++) {
			for (j = 0; j < endRowIndex - startRowIndex + 1; j++) {
				aliasCol = headLineColList[startColIndex + i].get('alias');
				aliasRow = headLineRowList[startRowIndex + j].get('alias');
				cache.deletePosi(aliasRow, aliasCol);
			}
		}

		
		for (i = 0; i < len; i++) {
			cacheCell = selectRegionCells[i].clone();
			selectRegionCells[i].set('isDestroy', true);
			modifyCell(cacheCell);
			currentCellIndexs.push(cells.length - 1);
		}
		history.addCoverAction(currentCellIndexs, originalCellIndexs);
		sendData();

		function sendData() {
			send.PackAjax({
				url: 'cells.htm?m=merge_delete',
				data: JSON.stringify({
					coordinate: sendRegion
				}),
			});
		}
	};

	function modifyCell(cacheCell) {
		var occupy = cacheCell.get('occupy'),
			aliasCol,
			aliasRow,
			colIndex,
			rowIndex,
			width,
			height;

		aliasCol = occupy.x[0];
		aliasRow = occupy.y[0];
		colIndex = headItemCols.getIndexByAlias(aliasCol);
		rowIndex = headItemRows.getIndexByAlias(aliasRow);

		height = headItemRows.models[rowIndex].get('height');
		width = headItemCols.models[colIndex].get('width');
		cacheCell.set('occupy', {
			x: aliasCol,
			y: aliasRow
		});
		cacheCell.set('physicsBox.width', width);
		cacheCell.set('physicsBox.height', height);
		cache.cachePosition(aliasRow, aliasCol, cells.length);
		cells.add(cacheCell);
	}
	return splitCell;
});