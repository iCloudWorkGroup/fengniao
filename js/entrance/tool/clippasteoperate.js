define(function(require) {
	'use strict';
	var Backbone = require('lib/backbone'),
		cache = require('basic/tools/cache'),
		cells = require('collections/cells'),
		Cell = require('models/cell'),
		send = require('basic/tools/send'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		selectRegions = require('collections/selectRegion'),
		setTextType = require('entrance/tool/settexttype');

	function clipPasteOperate(pasteText) {
		if (cache.clipState === 'copy') {
			excelDataPaste('copy');
		} else if (cache.clipState === 'cut') {
			excelDataPaste('cut');
		} else {
			clipBoardDataPaste(pasteText);
		}
	}

	function excelDataPaste(type) {
		var clipRegion,
			selectRegion,
			startColIndex,
			startRowIndex,
			endColIndex,
			endRowIndex,
			clipColAlias,
			clipRowAlias,
			selectColAlias,
			selectRowAlias,
			relativeColIndex,
			relativeRowIndex,
			tempCopyCellModel,
			selectCells,
			tempCellModel,
			CellModel,
			headItemColList,
			headItemRowList,
			sendData = [],
			text = "",
			URL='',
			i,
			j;

		clipRegion = selectRegions.getModelByType("clip")[0];
		selectRegion = selectRegions.getModelByType("operation")[0];

		headItemRowList = headItemRows.models;
		headItemColList = headItemCols.models;

		startColIndex = headItemCols.getIndexByAlias(clipRegion.get("wholePosi").startX);
		startRowIndex = headItemRows.getIndexByAlias(clipRegion.get("wholePosi").startY);
		endColIndex = headItemCols.getIndexByAlias(clipRegion.get("wholePosi").endX);
		endRowIndex = headItemRows.getIndexByAlias(clipRegion.get("wholePosi").endY);

		relativeColIndex = startColIndex - headItemCols.getIndexByAlias(selectRegion.get("wholePosi").startX);
		relativeRowIndex = startRowIndex - headItemRows.getIndexByAlias(selectRegion.get("wholePosi").startY);

		if(type === 'cut'){
			URL = config.url.sheet.cut;
		}else{
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
					orignalCol: headItemColList[startColIndex - relativeColIndex].get('sort'),
					orignalRow: headItemRowList[startRowIndex - relativeRowIndex].get('sort')
				}
			}),
			success: function(data) {
				var isable = data.returndata;
				if (isable) {
					for (i = startRowIndex; i < endRowIndex + 1; i++) {
						for (j = startColIndex; j < endColIndex + 1; j++) {
							if (j - relativeColIndex > headItemCols.models.length - 1) continue;
							if (i - relativeRowIndex > headItemRows.models.length - 1) continue;
							selectColAlias = headItemCols.models[j - relativeColIndex].get('alias');
							selectRowAlias = headItemRows.models[i - relativeRowIndex].get('alias');
							tempCellModel = cells.getCellByAlias(selectColAlias, selectRowAlias);
							if (tempCellModel !== null) {
								tempCellModel.set('isDestroy', true);
								deletePosi(selectColAlias, selectRowAlias);
							}
						}
					}

					//超出已加载区域处理
					for (i = startRowIndex; i < endRowIndex + 1; i++) {
						for (j = startColIndex; j < endColIndex + 1; j++) {
							clipColAlias = headItemCols.models[j].get('alias');
							clipRowAlias = headItemRows.models[i].get('alias');
							if (j - relativeColIndex > headItemCols.models.length - 1) continue;
							if (i - relativeRowIndex > headItemRows.models.length - 1) continue;
							CellModel = cells.getCellByAlias(clipColAlias, clipRowAlias);

							if (type === "cut") deletePosi(clipColAlias, clipRowAlias);
							if (CellModel !== null && CellModel.get('occupy').x[0] === clipColAlias && CellModel.get('occupy').y[0] === clipRowAlias) {
								tempCopyCellModel = CellModel.clone();
								if (type === "cut") {
									CellModel.set('isDestroy', true);
								}
								adaptCell(tempCopyCellModel, relativeColIndex, relativeRowIndex);
								cacheCellPosition(tempCopyCellModel);
								cells.add(tempCopyCellModel);
							}
						}
					}
					//修改:对模型直接进行修改
					Backbone.trigger('event:cellsContainer:adjustSelectRegion', {
						initColIndex: startColIndex - relativeColIndex,
						initRowIndex: startRowIndex - relativeRowIndex,
						mouseColIndex: endColIndex - relativeColIndex < headItemCols.models.length - 1 ? endColIndex - relativeColIndex : headItemCols.models.length - 1,
						mouseRowIndex: endRowIndex - relativeRowIndex < headItemRows.models.length - 1 ? endRowIndex - relativeRowIndex : headItemRows.models.length - 1
					})
					if (type === 'cut') {
						cache.clipState = "null";
						clipRegion.destroy();
					} //进行区域判断，判断复制区域与目标区域是否重叠 
					if (startColIndex - relativeColIndex > endColIndex ||
						endColIndex - relativeColIndex < startColIndex ||
						startRowIndex - relativeRowIndex > endRowIndex ||
						endRowIndex - relativeRowIndex < startRowIndex) {} else {
						cache.clipState = "null";
						clipRegion.destroy();
					}
				}
			}
		});
	}

	function cacheCellPosition(cell) {
		var occupyCols = cell.get('occupy').x,
			occupyRows = cell.get('occupy').y,
			aliasCol,
			aliasRow,
			rowLen,
			colLen,
			i = 0,
			j;
		rowLen = occupyRows.length;
		colLen = occupyCols.length;
		for (; i < rowLen; i++) {
			for (j = 0; j < colLen; j++) {
				cache.cachePosition(occupyRows[i], occupyCols[j], cells.length);
			}
		}

	}

	function adaptCell(cell, relativeColIndex, relativeRowIndex) {
		var arrayOriginalColAlias,
			arrayOriginalRowAlias,
			arrayColAlias = [],
			arrayRowAlias = [],
			colIndex,
			rowIndex,
			left, top,
			width = 0,
			height = 0,
			rowLen, colLen, i;

		arrayOriginalColAlias = cell.get("occupy").x;
		arrayOriginalRowAlias = cell.get("occupy").y;
		rowLen = arrayOriginalRowAlias.length;
		colLen = arrayOriginalColAlias.length;
		//增加超过加载区域处理
		for (i = 0; i < rowLen; i++) {
			rowIndex = headItemRows.getIndexByAlias(arrayOriginalRowAlias[i]) - relativeRowIndex;
			arrayRowAlias.push(headItemRows.models[rowIndex].get("alias"));
			height += headItemRows.models[rowIndex].get("height") + 1;
			if (i === 0) top = headItemRows.models[rowIndex].get("top");
		}
		for (i = 0; i < colLen; i++) {
			colIndex = headItemCols.getIndexByAlias(arrayOriginalColAlias[i]) - relativeColIndex;
			arrayColAlias.push(headItemCols.models[colIndex].get("alias"));
			width += headItemCols.models[colIndex].get("width") + 1;
			if (i === 0) left = headItemCols.models[colIndex].get("left");
		}

		cell.set("occupy", {
			x: arrayColAlias,
			y: arrayRowAlias
		});
		cell.set("physicsBox", {
			top: top,
			left: left,
			width: width - 1,
			height: height - 1
		});
	}



	function deletePosi(aliasCol, aliasRow) {
		var currentCellPosition = cache.CellsPosition,
			currentStrandX = currentCellPosition.strandX,
			currentStrandY = currentCellPosition.strandY;
		if (currentStrandX[aliasCol] !== undefined && currentStrandX[aliasCol][aliasRow] !== undefined) {
			delete currentStrandX[aliasCol][aliasRow];
			if (!Object.getOwnPropertyNames(currentStrandX[aliasCol]).length) {
				delete currentStrandX[aliasCol];
			}
		}
		if (currentStrandY[aliasRow] !== undefined && currentStrandY[aliasRow][aliasCol] !== undefined) {
			delete currentStrandY[aliasRow][aliasCol];
			if (!Object.getOwnPropertyNames(currentStrandY[aliasRow]).length) {
				delete currentStrandY[aliasRow];
			}
		}
	}
	/**
	 * 剪切板数据粘贴
	 * @method shearPlateDataPaste
	 * @param  {String} pasteText 复制数据内容
	 */
	function clipBoardDataPaste(pasteText) {
		var headItemColList,
			headItemRowList,
			encodeText,
			rowData = [],
			tempCellData = [],
			cellData = [],
			decodeText,
			sendData = [],
			startRowAlias,
			startColAlias,
			startRowIndex,
			startColIndex,
			startRowSort,
			startColSort,
			selectRegion,
			clipRegion,
			rowAlias,
			colAlias,
			colSort,
			rowSort,
			rowLen,
			colLen,
			tempCell;
		//清楚选中复制区域视图
		clipRegion = selectRegions.getModelByType('clip')[0];
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

		headItemColList = headItemCols.models;
		headItemRowList = headItemRows.models;

		colLen = rowData[0].split('%09').length;
		selectRegion = selectRegions.getModelByType('operation')[0];
		startRowAlias = selectRegion.get('wholePosi').startY;
		startColAlias = selectRegion.get('wholePosi').startX;
		startRowIndex = headItemRows.getIndexByAlias(startRowAlias);
		startColIndex = headItemCols.getIndexByAlias(startColAlias);
		startRowSort = headItemRowList[startRowIndex].get('sort');
		startColSort = headItemColList[startColIndex].get('sort');

		rowSort = startRowSort;
		colSort = startColSort;
		for (var i = 0; i < rowLen; i++) {
			tempCellData = rowData[i].split('%09');
			for (var j = 0; j < tempCellData.length; j++) {
				if (tempCellData[j] !== '') {
					sendData.push({
						'colSort': colSort,
						'rowSort': rowSort,
						'text': decodeURI(analysisText(tempCellData[j]))
					});
					cellData.push({
						colIndex: startColIndex + j,
						rowIndex: startRowIndex + i,
						text: decodeURI(analysisText(tempCellData[j]))
					});
					colSort++;
				}
			}
			colSort = startColSort;
			rowSort++;
		}

		send.PackAjax({
			url: config.url.sheet.paste,
			async: false,
			data: JSON.stringify({
				sheetId: '1',
				col: startColSort,
				row: startRowSort,
				colLen: colLen,
				rowLen: rowLen,
				pasteData: sendData
			}),
			success: function(data) {
				var isable = data.returndata;
				if (isable === true) {
					for (i = 0; i < rowLen; i++) {
						for (j = 0; j < colLen; j++) {
							rowAlias = headItemRowList[startRowIndex + i].get('alias');
							colAlias = headItemColList[startColIndex + j].get('alias');
							tempCell = cells.getCellByVertical(startColIndex + j, startRowIndex + i)[0];
							if (tempCell !== undefined && tempCell.get("isDestroy") === false) {
								tempCell.set("isDestroy", true);
							}
							cache.deletePosi(rowAlias, colAlias);
						}
					}
					for (i = 0; i < cellData.length; i++) {
						textToCell(cellData[i]);
					}
				}
			}
		});

		function analysisText(text) {
			var head = '',
				tail = '';
			if (text.indexOf("%0A") === -1) {
				return text;
			}
			text = text.substring(3, text.length - 3);
			while (true) {
				if (text.indexOf("%22%22") === 0) {
					text = text.substring(6);
					head += "%22";
				} else {
					break;
				}
			}
			while (true) {
				if (text.lastIndexOf("%22%22") === text.length - 6 && text.length > 6) {
					text = text.substring(0, text.length - 6);
					tail += "%22";
				} else {
					break;
				}
			}
			text = head + text + tail;
			return text;
		}
	}

	function textToCell(data) {
		var cacheCell,
			indexCol,
			indexRow,
			aliasCol,
			aliasRow,
			selectRowIndex,
			selectColIndex,
			gridLineColList,
			gridLineRowList,
			result;

		gridLineColList = headItemCols.models;
		gridLineRowList = headItemRows.models;

		indexCol = data.colIndex;
		indexRow = data.rowIndex;
		if ((indexCol > headItemCols.length - 1) || (indexRow > headItemRows.length - 1)) {
			return result;
		}
		var top, left, width, height;
		top = gridLineRowList[indexRow].get('top');
		left = gridLineColList[indexCol].get('left');
		width = gridLineColList[indexCol].get('width');
		height = gridLineRowList[indexRow].get('height');

		cacheCell = new Cell();
		aliasCol = gridLineColList[indexCol].get('alias');
		aliasRow = gridLineRowList[indexRow].get('alias');
		cacheCell.set('occupy', {
			x: [aliasCol],
			y: [aliasRow]
		});
		cacheCell.set('physicsBox', {
			top: top,
			left: left,
			width: width,
			height: height
		});
		cacheCell.set("content.texts", data.text);
		setTextType.typeRecognize(cacheCell);
		setTextType.generateDisplayText(cacheCell);
		cache.cachePosition(aliasRow, aliasCol, cells.length);
		cells.add(cacheCell);
	}

	return clipPasteOperate;
});