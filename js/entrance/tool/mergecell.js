'use strict';
define(function(require) {
	var send = require('basic/tools/send'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		selects = require('collections/selectRegion'),
		history = require('basic/tools/history'),
		cells = require('collections/cells'),
		Cell = require('models/cell'),
		config = require('spreadsheet/config'),
		gridCols = require('collections/headItemCol'),
		gridRows = require('collections/headItemRow'),
		getOperRegion = require('basic/tools/getoperregion'),
		gridColList = gridCols.models,
		gridRowList = gridRows.models,
		mergeCell;

	function oper(sheetId, sign) {
		var clip,
			region,
			operRegion,
			startRowIndex,
			startColIndex,
			endRowIndex,
			endColIndex,
			cellList,
			flag = true,
			occupy,
			len, i;

		clip = selects.getModelByType('clip');
		if (clip !== undefined) {
			cache.clipState = 'null';
			clip.destroy();
		}
		region = getOperRegion(sign);
		operRegion = region.operRegion;

		if (operRegion.endColIndex === 'MAX' || operRegion.endRowIndex === 'MAX') {
			return;
		}

		startRowIndex = operRegion.startRowIndex;
		startColIndex = operRegion.startColIndex;
		endRowIndex = operRegion.endRowIndex;
		endColIndex = operRegion.endColIndex;

		cellList = cells.getCellByTransverse(startRowIndex, startColIndex, endRowIndex, endColIndex);

		for (i = 0, len = cellList.length; i < len; i++) {
			occupy = cellList[i].get('occupy');
			if (occupy.x.length > 1 || occupy.y.length > 1) {
				flag = false;
				break;
			}
		}
		if (flag) {
			merge(region, cellList);
		} else {
			split(region, cellList);
		}

	}

	function merge(region, cellList) {
		var startRowIndex,
			startColIndex,
			endRowIndex,
			endColIndex,
			operRegion = region.operRegion,
			sendRegion = region.sendRegion,
			originalCellsIndex = [],
			currentCellsIndex = [],
			cacheCell,
			cellList,
			occupyX = [],
			occupyY = [],
			aliasCol,
			aliasRow,
			sortCol,
			sortRow,
			width = 0,
			height = 0,
			len, i = 0,
			j = 0;



		len = cellList.length;
		for (i = 0; i < len; i++) {
			if (cellList[i].get('content').texts !== '') {
				cacheCell = cellList[i].clone();
				break;
			}
		}

		if (cacheCell === undefined) {
			cacheCell = cellList[0];
			if (cacheCell !== undefined) {
				cacheCell = cacheCell.clone();
			} else {
				cacheCell = new Cell();
			}
		}

		for (i = 0; i < len; i++) {
			aliasCol = cellList[i].get('occupy').x[0];
			aliasRow = cellList[i].get('occupy').y[0];
			originalCellsIndex.push(cache.CellsPosition.strandX[aliasCol][aliasRow]);
			cellList[i].set('isDestroy', true);
		}

		startRowIndex = operRegion.startRowIndex;
		startColIndex = operRegion.startColIndex;
		endRowIndex = operRegion.endRowIndex;
		endColIndex = operRegion.endColIndex;

		//获取occupy信息
		for (i = 0; i < endColIndex - startColIndex + 1; i++) {
			occupyX.push(gridColList[startColIndex + i].get('alias'));
			width += gridColList[startColIndex + i].get('width') + 1;
		}
		for (i = 0; i < endRowIndex - startRowIndex + 1; i++) {
			occupyY.push(gridRowList[startRowIndex + i].get('alias'));
			height += gridRowList[startRowIndex + i].get('height') + 1;
		}

		cacheCell.set('physicsBox', {
			top: gridRowList[startRowIndex].get('top'),
			left: gridColList[startColIndex].get('left'),
			width: width - 1,
			height: height - 1
		});
		cacheCell.set('occupy', {
			x: occupyX,
			y: occupyY
		});
		cells.add(cacheCell);
		for (i = 0; i < endColIndex - startColIndex + 1; i++) {
			for (j = 0; j < endRowIndex - startRowIndex + 1; j++) {
				aliasCol = gridColList[startColIndex + i].get('alias');
				aliasRow = gridRowList[startRowIndex + j].get('alias');
				cache.cachePosition(aliasRow, aliasCol, cells.length - 1);
			}
		}
		history.addCoverAction([cells.length - 1], originalCellsIndex);
		sendData();

		function sendData() {
			send.PackAjax({
				url: config.url.cell.merge,
				data: JSON.stringify({
					coordinate: sendRegion
				}),
			});
		}
	};

	function split(region, cellList) {
		var region,
			operRegion,
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

		operRegion = region.operRegion;
		startColIndex = operRegion.startColIndex;
		startRowIndex = operRegion.startRowIndex;
		endColIndex = operRegion.endColIndex;
		endRowIndex = operRegion.endRowIndex;

		//选中区域内所有单元格对象
		selectRegionCells = cells.getCellByVertical(startColIndex, startRowIndex, endColIndex, endRowIndex);
		len = selectRegionCells.length;

		cellPosi = cache.CellsPosition.strandX;
		for (i = 0; i < len; i++) {
			occupy = selectRegionCells[i].get('occupy');
			originalCellIndexs.push(cellPosi[occupy.x[0]][occupy.y[0]]);
		}

		//删除position索引
		for (i = 0; i < endColIndex - startColIndex + 1; i++) {
			for (j = 0; j < endRowIndex - startRowIndex + 1; j++) {
				aliasCol = gridColList[startColIndex + i].get('alias');
				aliasRow = gridRowList[startRowIndex + j].get('alias');
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
				url: config.url.cell.split,
				data: JSON.stringify({
					coordinate: region.sendRegion
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
		colIndex = gridCols.getIndexByAlias(aliasCol);
		rowIndex = gridRows.getIndexByAlias(aliasRow);

		height = gridRows.models[rowIndex].get('height');
		width = gridCols.models[colIndex].get('width');
		cacheCell.set('occupy', {
			x: aliasCol,
			y: aliasRow
		});
		cacheCell.set('physicsBox.width', width);
		cacheCell.set('physicsBox.height', height);
		cache.cachePosition(aliasRow, aliasCol, cells.length);
		cells.add(cacheCell);
	}

	return oper;
});