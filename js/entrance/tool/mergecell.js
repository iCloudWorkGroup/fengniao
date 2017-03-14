'use strict';
define(function(require) {
	var send = require('basic/tools/send'),
		cache = require('basic/tools/cache'),
		selectRegions = require('collections/selectRegion'),
		cells = require('collections/cells'),
		Cell = require('models/cell'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		getOperRegion = require('basic/tools/getoperregion'),
		mergeCell;

	mergeCell = function(sheetId, label) {

		var gridLineColList = headItemCols.models,
			gridLineRowList = headItemRows.models,
			startRowIndex,
			startColIndex,
			endRowIndex,
			endColIndex,
			region,
			operRegion,
			sendRegion,
			clip,
			cacheCell,
			cellList,
			occupyX = [],
			occupyY = [],
			aliasCol,
			aliasRow,
			width = 0,
			height = 0,
			len, i = 0,
			j = 0;

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
		if (operRegion.endColIndex === 'MAX' || operRegion.endRowIndex === 'MAX') {
			return;
		}

		startRowIndex = operRegion.startRowIndex;
		startColIndex = operRegion.startColIndex;
		endRowIndex = operRegion.endRowIndex;
		endColIndex = operRegion.endColIndex;
		/**
		 * 合并操作：
		 * 存在含有文本单元格，按照先行后列，按照查找到第一个单元格作为模板进行扩大
		 * 不存在含有文本单元格，直接以左上角为模板进行扩大
		 */
		cellList = cells.getCellByTransverse(startRowIndex, startColIndex, endRowIndex, endColIndex);
		len = cellList.length;
		for (i = 0; i < len; i++) {
			if (cellList[i].get('content').texts !== '') {
				cacheCell = cellList[i].clone();
				break;
			}
		}
		if (cacheCell === undefined) {
			cacheCell = cells.getCellByTransverse(startRowIndex, startColIndex)[0];
			if (cacheCell !== undefined) {
				cacheCell = cacheCell.clone();
			}
		}
		if (cacheCell === undefined) {
			cacheCell = new Cell();
		}

		if (len) {
			for (i = 0; i < len; i++) {
				cellList[i].set('isDestroy', true);
			}
		}
		//删除position索引
		for (i = startColIndex; i < endColIndex + 1; i++) {
			for (j = startRowIndex; j < endRowIndex + 1; j++) {
				aliasCol = gridLineColList[i].get('alias');
				aliasRow = gridLineRowList[j].get('alias');
				cache.deletePosi(aliasRow, aliasCol);
			}
		}
		//获取occupy信息
		for (i = 0; i < endColIndex - startColIndex + 1; i++) {
			occupyX.push(gridLineColList[startColIndex + i].get('alias'));
			width += gridLineColList[startColIndex + i].get('width') + 1;
		}
		for (i = 0; i < endRowIndex - startRowIndex + 1; i++) {
			occupyY.push(gridLineRowList[startRowIndex + i].get('alias'));
			height += gridLineRowList[startRowIndex + i].get('height') + 1;
		}
		cacheCell.set('physicsBox', {
			top: gridLineRowList[startRowIndex].get('top'),
			left: gridLineColList[startColIndex].get('left'),
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
				aliasCol = gridLineColList[startColIndex + i].get('alias');
				aliasRow = gridLineRowList[startRowIndex + j].get('alias');
				cache.cachePosition(aliasRow, aliasCol, cells.length - 1);
			}
		}
		sendData();
		function sendData() {
			send.PackAjax({
				url: 'cells.htm?m=merge',
				data: JSON.stringify({
					coordinate: sendRegion
				}),
			});
		}
	};


	return mergeCell;
});