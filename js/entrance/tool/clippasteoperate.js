define(function(require) {
	'use strict';
	var cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		cells = require('collections/cells'),
		Cell = require('models/cell'),
		send = require('basic/tools/send'),
		history = require('basic/tools/history'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		selectRegions = require('collections/selectRegion'),
		setTextType = require('entrance/tool/settexttype'),
		headItemRowList = headItemRows.models,
		headItemColList = headItemCols.models,
		cellList = cells.models;

	function clipPasteOperate(pasteText) {
		var clipboardData = cache.clipboardData;

		//如果剪切板内容与选中区域的数据不相等，则使用剪切板内容
		if (cache.clipState !== null && clipboardData === pasteText) {
			excelDataPaste(cache.clipState);
		} else {
			clipBoardDataPaste(pasteText);
		}

	}

	function excelDataPaste(type) {
		var originalModelIndexs = [],
			currentModelIndexs = [],
			clipRegion,
			selectRegion,
			startColIndex,
			startRowIndex,
			endColIndex,
			endRowIndex,
			selectColIndex,
			selectRowIndex,
			URL = '';

		clipRegion = selectRegions.getModelByType('clip');
		selectRegion = selectRegions.getModelByType('selected');

		startColIndex = headItemCols.getIndexByAlias(clipRegion.get('wholePosi').startX);
		startRowIndex = headItemRows.getIndexByAlias(clipRegion.get('wholePosi').startY);
		endColIndex = headItemCols.getIndexByAlias(clipRegion.get('wholePosi').endX);
		endRowIndex = headItemRows.getIndexByAlias(clipRegion.get('wholePosi').endY);

		selectColIndex = headItemCols.getIndexByAlias(selectRegion.get('wholePosi').startX);
		selectRowIndex = headItemRows.getIndexByAlias(selectRegion.get('wholePosi').startY);

		if (type === 'cut') {
			URL = config.url.sheet.cut;
		} else {
			URL = config.url.sheet.copy;
		}

		send.PackAjax({
			url: URL,
			async: false,
			data: JSON.stringify({
				excelId: window.SPREADSHEET_AUTHENTIC_KEY,
				sheetId: '1',
				orignal: {
					startCol: headItemColList[startColIndex].get('sort'),
					endCol: headItemColList[endColIndex].get('sort'),
					startRow: headItemRowList[startRowIndex].get('sort'),
					endRow: headItemRowList[endRowIndex].get('sort'),
				},
				target: {
					oprCol: headItemColList[selectColIndex].get('sort'),
					oprRow: headItemRowList[selectRowIndex].get('sort')
				}
			}),
			success: function(data) {
				if (data && data.isLegal) {
					fillData();
				}
			}
		});

		function fillData() {
			var i, j,
				temp = {},
				colAlias,
				rowAlias,
				cloneList = [],
				cloneObj,
				rowLen = headItemRows.length,
				colLen = headItemCols.length,
				oprEndColIndex = selectColIndex + (endColIndex - startColIndex),
				oprEndRowIndex = selectRowIndex + (endRowIndex - startRowIndex),
				cellOccupy = cache.CellsPosition.strandX,
				cellIndex,
				cellModel;

			for (i = startRowIndex; i <= endRowIndex; i++) {
				for (j = startColIndex; j <= endColIndex; j++) {
					colAlias = headItemColList[j].get('alias');
					rowAlias = headItemRowList[i].get('alias');

					if (cellOccupy[colAlias] && (cellIndex = cellOccupy[colAlias][rowAlias]) !== undefined) {
						if (!temp[cellIndex]) {
							cellModel = cellList[cellIndex];
							cloneList.push({
								relativeCol: j - startColIndex,
								relativeRow: i - startRowIndex,
								model: cellModel.clone()
							});
							if (type === 'cut') {
								originalModelIndexs.push(cellIndex);
							}
							temp[cellIndex] = 1;
						}
						if (type === 'cut') {
							cellModel.set('isDestroy', true);
							deletePosi(colAlias, rowAlias);
						}
					}
				}
			}
			temp = {};
			for (i = selectRowIndex; i <= oprEndRowIndex; i++) {
				for (j = selectColIndex; j <= oprEndColIndex; j++) {
					if (i >= rowLen || j >= colLen) {
						continue;
					}
					colAlias = headItemColList[j].get('alias');
					rowAlias = headItemRowList[i].get('alias');
					if (cellOccupy[colAlias] && (cellIndex = cellOccupy[colAlias][rowAlias]) !== undefined &&
						!temp[cellIndex]) {
						temp[cellIndex] = 1;
						cellModel = cellList[cellIndex];
						cellModel.set('isDestroy', true);
						if (originalModelIndexs.indexOf(cellIndex) !== -1) {
							originalModelIndexs.push(cellIndex);
						}
						deletePosi(colAlias, rowAlias);
					}
				}
			}

			for (i = 0; i < cloneList.length; i++) {
				cloneObj = cloneList[i];
				cellModel = adaptCell(cloneObj.model, cloneObj.relativeCol, cloneObj.relativeRow);
				if (cellModel) {
					currentModelIndexs.push(cells.length);
					cells.push(cellModel);
				}
			}

			history.addCoverAction(currentModelIndexs, originalModelIndexs);

			selectRegion.set('tempPosi', {
				initColIndex: selectColIndex,
				initRowIndex: selectRowIndex,
				mouseColIndex: oprEndColIndex < colLen ? oprEndColIndex : colLen - 1,
				mouseRowIndex: oprEndRowIndex < rowLen ? oprEndRowIndex : rowLen - 1
			});

			//判断两个区域不相交
			if ((selectRowIndex > endRowIndex ||
					selectRowIndex < startRowIndex ||
					selectColIndex > endColIndex ||
					selectColIndex < startColIndex) &&
				(oprEndRowIndex > endRowIndex ||
					oprEndRowIndex < startRowIndex ||
					oprEndColIndex > endColIndex ||
					oprEndColIndex < startColIndex)) {
				return;
			}

			if (type !== 'cut') {
				return;
			}
			cache.clipState = 'null';
			clipRegion.destroy();
		}
	}

	function adaptCell(cell, relativeColIndex, relativeRowIndex) {
		var selectColIndex,
			selectRowIndex,
			selectRegion,
			arrayColAlias = [],
			arrayRowAlias = [],
			colIndex,
			rowIndex,
			left, top,
			width = 0,
			height = 0,
			rowLen, colLen, i;


		selectRegion = selectRegions.getModelByType('selected');
		selectColIndex = headItemCols.getIndexByAlias(selectRegion.get('wholePosi').startX);
		selectRowIndex = headItemRows.getIndexByAlias(selectRegion.get('wholePosi').startY);

		if (selectColIndex + relativeColIndex >= headItemCols.length ||
			selectRowIndex + relativeRowIndex >= headItemRows.length) {
			return false;
		}
		rowLen = cell.get('occupy').x.length || 1;
		colLen = cell.get('occupy').x.length || 1;
		//增加超过加载区域处理
		for (i = 0; i < rowLen; i++) {
			rowIndex = selectRowIndex + relativeRowIndex;
			arrayRowAlias.push(headItemRowList[rowIndex].get('alias'));
			height += headItemRowList[rowIndex].get('height') + 1;
			if (i === 0) {
				top = headItemRowList[rowIndex].get('top');
			}
		}
		for (i = 0; i < colLen; i++) {
			colIndex = selectColIndex + relativeColIndex;
			arrayColAlias.push(headItemColList[colIndex].get('alias'));
			width += headItemColList[colIndex].get('width') + 1;
			if (i === 0) {
				left = headItemColList[colIndex].get('left');
			}
		}
		cell.set('isDestroy', false);
		cell.set('occupy', {
			x: arrayColAlias,
			y: arrayRowAlias
		});
		cell.set('physicsBox', {
			top: top,
			left: left,
			width: width - 1,
			height: height - 1
		});
		cacheCellPosition();

		return cell;

		function cacheCellPosition() {
			var occupyCols = cell.get('occupy').x,
				occupyRows = cell.get('occupy').y,
				index = cells.length,
				rowLen,
				colLen,
				i = 0,
				j;
			rowLen = occupyRows.length;
			colLen = occupyCols.length;
			for (; i < rowLen; i++) {
				for (j = 0; j < colLen; j++) {
					cache.cachePosition(occupyRows[i], occupyCols[j], index);
				}
			}
		}
	}



	function deletePosi(aliasCol, aliasRow) {
		var cellPosition = cache.CellsPosition,
			strandX = cellPosition.strandX,
			strandY = cellPosition.strandY;
		if (strandX[aliasCol] && strandX[aliasCol][aliasRow] !== undefined) {
			delete strandX[aliasCol][aliasRow];
			if (!Object.getOwnPropertyNames(strandX[aliasCol]).length) {
				delete strandX[aliasCol];
			}
		}
		if (strandY[aliasRow] && strandY[aliasRow][aliasCol] !== undefined) {
			delete strandY[aliasRow][aliasCol];
			if (!Object.getOwnPropertyNames(strandY[aliasRow]).length) {
				delete strandY[aliasRow];
			}
		}
	}
	/**
	 * 剪切板数据粘贴
	 * @method shearPlateDataPaste
	 * @param  {String} pasteText 复制数据内容
	 */
	function clipBoardDataPaste(pasteText) {
		var encodeText,
			rowData = [],
			cellData = [],
			sendData = [],
			rowCellData = [],
			selectRowIndex,
			selectColIndex,
			selectRegion,
			clipRegion,
			colSort,
			rowSort,
			rowLen,
			colLen,
			i,
			j;

		//清除选中复制区域视图
		clipRegion = selectRegions.getModelByType('clip');
		if (clipRegion !== null && clipRegion !== undefined) {
			clipRegion.destroy();
		}
		cache.clipState = 'null';

		//bug
		encodeText = encodeURI(pasteText);
		rowData = encodeText.split('%0D%0A');

		rowLen = rowData.length - 1;
		if (rowData[rowLen] !== '') {
			rowLen++;
		}

		colLen = rowData[0].split('%09').length;

		selectRegion = selectRegions.getModelByType('selected');
		selectRowIndex = headItemRows.getIndexByAlias(selectRegion.get('wholePosi').startY);
		selectColIndex = headItemCols.getIndexByAlias(selectRegion.get('wholePosi').startX);

		rowSort = headItemRowList[selectRowIndex].get('sort');
		colSort = headItemColList[selectColIndex].get('sort');

		for (i = 0; i < rowLen; i++) {
			rowCellData = rowData[i].split('%09');
			for (j = 0; j < rowCellData.length; j++) {
				if (rowCellData[j] !== '') {
					sendData.push({
						'col': colSort + j,
						'row': rowSort + i,
						'content': decodeURI(analysisText(rowCellData[j]))
					});
					cellData.push({
						relativeColIndex: j,
						relativeRowIndex: i,
						text: decodeURI(analysisText(rowCellData[j]))
					});
				}
			}
		}

		send.PackAjax({
			url: config.url.sheet.paste,
			async: false,
			data: JSON.stringify({
				sheetId: '1',
				oprCol: headItemColList[selectColIndex].get('sort'),
				oprRow: headItemRowList[selectRowIndex].get('sort'),
				colLen: colLen,
				rowLen: rowLen,
				pasteData: sendData
			}),
			success: function(data) {
				if (data && data.isLegal) {
					fillData();
				}
			}
		});

		function fillData() {
			var cellOccupy = cache.CellsPosition.strandX,
				originalModelIndexs = [],
				currentModelIndexs = [],
				rowAlias,
				colAlias,
				cellModel;

			for (i = selectRowIndex; i < selectRowIndex + rowLen; i++) {
				for (j = selectColIndex; j < selectColIndex + colLen; j++) {
					if (i >= headItemRows.length || j >= headItemCols.length) {
						continue;
					}
					rowAlias = headItemRowList[i].get('alias');
					colAlias = headItemColList[j].get('alias');
					cellModel = cells.getCellByVertical(j, i)[0];
					if (cellModel && cellModel.get('isDestroy') === false) {
						originalModelIndexs.push(cellOccupy[colAlias][rowAlias]);
						cellModel.set('isDestroy', true);
					}
					cache.deletePosi(rowAlias, colAlias);
				}
			}
			for (i = 0; i < cellData.length; i++) {
				cellModel = new Cell();
				cellModel.set('content.texts', cellData[i].text);
				cellModel = adaptCell(cellModel, cellData[i].relativeColIndex, cellData[i].relativeRowIndex);
				if (cellModel) {
					setTextType.typeRecognize(cellModel);
					setTextType.generateDisplayText(cellModel);
					cells.add(cellModel);
					currentModelIndexs.push(cells.length - 1);
				}
			}
			history.addCoverAction(currentModelIndexs, originalModelIndexs);
		}

		function analysisText(text) {
			var head = '',
				tail = '';
			if (text.indexOf('%0A') === -1) {
				return text;
			}
			text = text.substring(3, text.length - 3);
			while (true) {
				if (text.indexOf('%22%22') === 0) {
					text = text.substring(6);
					head += '%22';
				} else {
					break;
				}
			}
			while (true) {
				if (text.lastIndexOf('%22%22') === text.length - 6 && text.length > 6) {
					text = text.substring(0, text.length - 6);
					tail += '%22';
				} else {
					break;
				}
			}
			text = head + text + tail;
			return text;
		}
	}
	return clipPasteOperate;
});