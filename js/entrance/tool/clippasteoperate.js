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
			tempCellModel,
			CellModel,
			sendData = [],
			text = "",
			i,
			j;

		clipRegion = selectRegions.getModelByType("clip")[0];
		selectRegion = selectRegions.getModelByType("operation")[0];

		startColIndex = headItemCols.getIndexByAlias(clipRegion.get("wholePosi").startX);
		startRowIndex = headItemRows.getIndexByAlias(clipRegion.get("wholePosi").startY);
		endColIndex = headItemCols.getIndexByAlias(clipRegion.get("wholePosi").endX);
		endRowIndex = headItemRows.getIndexByAlias(clipRegion.get("wholePosi").endY);

		relativeColIndex = startColIndex - headItemCols.getIndexByAlias(selectRegion.get("wholePosi").startX);
		relativeRowIndex = startRowIndex - headItemRows.getIndexByAlias(selectRegion.get("wholePosi").startY);

		if (isAblePaste(endRowIndex - startRowIndex + 1, endColIndex - startColIndex + 1) === false) return;
		//超出已加载区域处理
		for (i = startRowIndex; i < endRowIndex + 1; i++) {
			for (j = startColIndex; j < endColIndex + 1; j++) {
				clipColAlias = headItemCols.models[j].get('alias');
				clipRowAlias = headItemRows.models[i].get('alias');
				if (j - relativeColIndex > headItemCols.models.length - 1) continue;
				if (i - relativeRowIndex > headItemRows.models.length - 1) continue;
				selectColAlias = headItemCols.models[j - relativeColIndex].get('alias');
				selectRowAlias = headItemRows.models[i - relativeRowIndex].get('alias');
				tempCellModel = cells.getCellByAlias(selectColAlias, selectRowAlias);

				CellModel = cells.getCellByAlias(clipColAlias, clipRowAlias);

				if (tempCellModel !== null) {
					tempCellModel.set('isDestroy', true);
					deletePosi(selectColAlias, selectRowAlias);
				}
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
		cache.clipState = "null";
		Backbone.trigger('event:cellsContainer:adjustSelectRegion', {
			initColIndex: startColIndex - relativeColIndex,
			initRowIndex: startRowIndex - relativeRowIndex,
			mouseColIndex: endColIndex - relativeColIndex < headItemCols.models.length - 1 ? endColIndex - relativeColIndex : headItemCols.models.length - 1,
			mouseRowIndex: endRowIndex - relativeRowIndex < headItemRows.models.length - 1 ? endRowIndex - relativeRowIndex : headItemRows.models.length - 1
		});

		clipRegion.destroy();
		send.PackAjax({
			url: 'plate.htm?m=' + type,
			data: JSON.stringify({
				excelId: window.SPREADSHEET_AUTHENTIC_KEY,
				sheetId: '1',
				orignal: {
					startColAlias: clipRegion.get("wholePosi").startX,
					endColAlias: clipRegion.get("wholePosi").endX,
					startRowAlias: clipRegion.get("wholePosi").startY,
					endRowAlias: clipRegion.get("wholePosi").endY
				},
				target: {
					colAlias: selectRegion.get("wholePosi").startX,
					rowAlias: selectRegion.get("wholePosi").startY,
				}
			})
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

	function isAblePaste(rowlen, collen) {
		var rowStartIndex,
			colStartIndex,
			rowEndIndex,
			colEndIndex,
			cellModelArray,
			startColAlias,
			startRowAlias,
			clipRegion,
			result = false;

		startColAlias = selectRegions.models[0].get('wholePosi').startX;
		startRowAlias = selectRegions.models[0].get('wholePosi').startY;
		send.PackAjax({
			url: "plate.htm?m=isAblePaste",
			async: false,
			data: JSON.stringify({
				excelId: window.SPREADSHEET_AUTHENTIC_KEY,
				sheetId: '1',
				startColAlias: startColAlias,
				startRowAlias: startRowAlias,
				colLen: collen,
				rowLen: rowlen
			}),
			success: function(data) {
				result = data.returndata;
			}
		});
		return result;
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
	 * 剪切板数据源数据解析
	 * @method shearPlateDataPaste
	 * @param  {String} pasteText 复制数据内容
	 */
	function clipBoardDataPaste(pasteText) {
		var encodeText,
			rowData = [],
			tempCellData = [],
			decodeText,
			sendData = [],
			startRowAlias,
			startColAlias,
			selectRegion,
			clipRegion;

		encodeText = encodeURI(pasteText);
		rowData = encodeText.split('%0D%0A');
		if (isAblePaste(rowData.length - 1, rowData[0].split('%09').length) === false) return;

		for (var i = 0; i < rowData.length; i++) {
			tempCellData = rowData[i].split('%09');
			for (var j = 0; j < tempCellData.length; j++) {
				if (tempCellData[j] !== '') {
					sendData.push(textToCell(i, j, decodeURI(analysisText(tempCellData[j]))));
				}
			}
		}

		clipRegion = selectRegions.getModelByType("clip")[0];
		selectRegion = selectRegions.getModelByType("operation")[0];
		startRowAlias = selectRegion.get('wholePosi').startY;
		startColAlias = selectRegion.get('wholePosi').startX;

		if (clipRegion !== null && clipRegion !== undefined) {
			clipRegion.destroy();
		}
		cache.clipState = "null";
		send.PackAjax({
			url: 'plate.htm?m=paste',
			data: JSON.stringify({
				excelId: window.SPREADSHEET_AUTHENTIC_KEY,
				sheetId: '1',
				startColAlias: startColAlias,
				startRowAlias: startRowAlias,
				pasteData: sendData
			})
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

	function textToCell(relativeRowIndex, relativeColIndex, text) {
		var cacheCell,
			tempCell,
			indexCol,
			indexRow,
			aliasCol,
			aliasRow,
			selectRowIndex,
			selectColIndex,
			gridLineColList,
			gridLineRowList,
			displaytext,
			result;

		if (text === '') return;
		gridLineColList = headItemCols.models;
		gridLineRowList = headItemRows.models;

		selectRowIndex = headItemRows.getIndexByAlias(selectRegions.models[0].get('wholePosi').startY);
		selectColIndex = headItemCols.getIndexByAlias(selectRegions.models[0].get('wholePosi').startX);
		indexCol = selectColIndex + relativeColIndex;
		indexRow = selectRowIndex + relativeRowIndex;

		result = {
			relativeColIndex: relativeColIndex,
			relativeRowIndex: relativeRowIndex,
			text: text
		};
		if ((indexCol > headItemCols.length - 1) || (indexRow > headItemRows.length - 1)) {
			return result;
		}

		tempCell = cells.getCellByX(indexCol, indexRow)[0];

		if (tempCell !== undefined && tempCell.get("isDestroy") === false) {
			tempCell.set("isDestroy", true);
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
		cacheCell.set("content.texts", text);
		displaytext = setTextType.textTypeRecognize(cacheCell);
		cacheCell.set("content.displayTexts", displaytext);
		cache.cachePosition(aliasRow, aliasCol, cells.length);
		cells.add(cacheCell);
		return result;
	}

	return clipPasteOperate;
});