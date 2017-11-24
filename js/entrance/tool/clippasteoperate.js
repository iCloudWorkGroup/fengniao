define(function(require) {
	'use strict';
	var _ = require('lib/underscore'),
		Backbone = require('lib/backbone'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		cells = require('collections/cells'),
		Cell = require('models/cell'),
		send = require('basic/tools/send'),
		history = require('basic/tools/history'),
		cols = require('collections/headItemCol'),
		rows = require('collections/headItemRow'),
		selectRegions = require('collections/selectRegion'),
		setTextType = require('entrance/tool/settexttype'),
		strandMap = require('basic/tools/strandmap'),
		rowList = rows.models,
		colList = cols.models,
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
	/**
	 * 表格内部复制或剪切操作
	 * @param  {string} type 字符串 cut/copy
	 */
	function excelDataPaste(type) {
		var currentModelIndexs = [],
			wholePosi,
			clipRegion,
			selectRegion,
			startColIndex,
			startRowIndex,
			endColIndex,
			endRowIndex,
			selectColIndex,
			selectRowIndex,
			URL;

		clipRegion = selectRegions.getModelByType('clip');
		selectRegion = selectRegions.getModelByType('selected');

		wholePosi = clipRegion.get('wholePosi');
		startColIndex = cols.getIndexByAlias(wholePosi.startX);
		startRowIndex = rows.getIndexByAlias(wholePosi.startY);
		endColIndex = cols.getIndexByAlias(wholePosi.endX);
		endRowIndex = rows.getIndexByAlias(wholePosi.endY);

		wholePosi = selectRegion.get('wholePosi');
		selectColIndex = cols.getIndexByAlias(wholePosi.startX);
		selectRowIndex = rows.getIndexByAlias(wholePosi.startY);

		if (type === 'cut') {
			URL = config.url.sheet.cut;
		} else {
			URL = config.url.sheet.copy;
		}

		// send.PackAjax({
		// 	url: URL,
		// 	async: false,
		// 	data: JSON.stringify({
		// 		excelId: window.SPREADSHEET_AUTHENTIC_KEY,
		// 		sheetId: '1',
		// 		orignal: {
		// 			startCol: colList[startColIndex].get('sort'),
		// 			endCol: colList[endColIndex].get('sort'),
		// 			startRow: rowList[startRowIndex].get('sort'),
		// 			endRow: rowList[endRowIndex].get('sort'),
		// 		},
		// 		target: {
		// 			oprCol: colList[selectColIndex].get('sort'),
		// 			oprRow: rowList[selectRowIndex].get('sort')
		// 		}
		// 	}),
		// 	success: function(data) {
		// 		if (data && data.isLegal) {
		fillData();
		// 		} else {
		// 			Backbone.trigger('event:showMsgBar:show', '该区域不能进行此操作');
		// 		}
		// 	}
		// });

		function fillData() {
			var i, j,
				temp = {},
				tempRuleIndex,
				colAlias,
				rowAlias,
				cloneCellList = [],
				cloneRuleList = [],
				originalRuleData = [],
				originalModelIndexs = [],
				currentRuleData = [],
				cloneObj,
				cloneRule,
				rowLen = rows.length,
				colLen = cols.length,
				oprEndColIndex = selectColIndex + (endColIndex - startColIndex),
				oprEndRowIndex = selectRowIndex + (endRowIndex - startRowIndex),
				cellStrand = cache.CellsPosition.strandX,
				cellIndex,
				cellModel,
				actions = [];

			oprEndColIndex = oprEndColIndex > cols.length - 1 ? cols.length - 1 : oprEndColIndex;
			oprEndRowIndex = oprEndRowIndex > rows.length - 1 ? rows.length - 1 : oprEndRowIndex;
			/**
			 * 对选中的复制区域创建副本，避免复制区域和操作区域重叠时，造成复制内容错误
			 * 如果是剪切操作，删除原始数据，并将原始数据放入历史
			 */
			for (i = startRowIndex; i <= endRowIndex; i++) {
				for (j = startColIndex; j <= endColIndex; j++) {
					colAlias = colList[j].get('alias');
					rowAlias = rowList[i].get('alias');

					if (cellStrand[colAlias] && (cellIndex = cellStrand[colAlias][rowAlias]) !== undefined) {
						if (!temp[cellIndex]) {
							cellModel = cellList[cellIndex];
							cloneCellList.push({
								relativeCol: j - startColIndex,
								relativeRow: i - startRowIndex,
								model: cellModel.clone()
							});
							if (type === 'cut') {
								cellModel.set('isDestroy', true);
								originalModelIndexs.push(cellIndex);
							}
							temp[cellIndex] = 1;
						}
						if (type === 'cut') {
							deletePosi(colAlias, rowAlias);
						}
					}
					if ((tempRuleIndex = strandMap.getPointRecord(colAlias, rowAlias, 'validate')) !== undefined) {
						cloneRuleList.push({
							relativeCol: j - startColIndex,
							relativeRow: i - startRowIndex,
							ruleIndex: tempRuleIndex
						});
						if (type === 'cut') {
							originalRuleData.push({
								colAlias: colList[j].get('alias'),
								rowAlias: rowList[i].get('alias'),
								index: tempRuleIndex
							});
							strandMap.deletePointRecord(colAlias, rowAlias, 'validate');
						}
					}
				}
			}
			temp = {};
			/**
			 * 删除选中区的数据
			 */
			for (i = selectRowIndex; i <= oprEndRowIndex; i++) {
				for (j = selectColIndex; j <= oprEndColIndex; j++) {
					if (i >= rowLen || j >= colLen) {
						continue;
					}
					colAlias = colList[j].get('alias');
					rowAlias = rowList[i].get('alias');
					if (cellStrand[colAlias] && (cellIndex = cellStrand[colAlias][rowAlias]) !== undefined &&
						!temp[cellIndex]) {
						temp[cellIndex] = 1;
						cellModel = cellList[cellIndex];
						cellModel.set('isDestroy', true);
						if (originalModelIndexs.indexOf(cellIndex) !== -1) {
							originalModelIndexs.push(cellIndex);
						}
						deletePosi(colAlias, rowAlias);
					}
					if ((tempRuleIndex = strandMap.getPointRecord(colAlias, rowAlias, 'validate')) !== undefined) {
						originalRuleData.push({
							colAlias: colAlias,
							rowAlias: rowAlias,
							index: tempRuleIndex
						});
						strandMap.deletePointRecord(colAlias, rowAlias, 'validate');
					}
				}
			}
			/**
			 * 添加复制数据
			 */
			for (i = 0; i < cloneCellList.length; i++) {
				cloneObj = cloneCellList[i];
				cellModel = adaptCell(cloneObj.model, cloneObj.relativeCol, cloneObj.relativeRow);
				if (cellModel) {
					currentModelIndexs.push(cells.length);
					cells.push(cellModel);
				}
			}

			for (i = 0; i < cloneRuleList.length; i++) {
				cloneRule = cloneRuleList[i];
				colAlias = colList[selectColIndex + cloneRule.relativeCol].get('alias');
				rowAlias = rowList[selectRowIndex + cloneRule.relativeRow].get('alias');
				currentRuleData.push({
					colAlias: colAlias,
					rowAlias: rowAlias,
					index: cloneRule.ruleIndex
				});
				strandMap.addPointRecord(colAlias, rowAlias,'validate' , cloneRule.ruleIndex);
			}
			actions.push(history.getCellCoverAction(currentModelIndexs, originalModelIndexs));
			actions.push(history.getValidateCoverAction(currentRuleData, originalRuleData));

			history.addAction(actions);
			/**
			 * 调整选中区
			 */
			selectRegion.set('tempPosi', {
				initColIndex: selectColIndex,
				initRowIndex: selectRowIndex,
				mouseColIndex: oprEndColIndex < colLen ? oprEndColIndex : colLen - 1,
				mouseRowIndex: oprEndRowIndex < rowLen ? oprEndRowIndex : rowLen - 1
			});

			//判断两个区域不相交
			if ((selectRowIndex > endRowIndex ||
					selectColIndex > endColIndex ||
					oprEndRowIndex < startRowIndex ||
					oprEndColIndex < startColIndex) && type === 'copy') {
				return;
			}

			cache.clipState = 'null';
			cache.clipboardData = null;
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
		selectColIndex = cols.getIndexByAlias(selectRegion.get('wholePosi').startX);
		selectRowIndex = rows.getIndexByAlias(selectRegion.get('wholePosi').startY);

		if (selectColIndex + relativeColIndex >= cols.length ||
			selectRowIndex + relativeRowIndex >= rows.length) {
			return false;
		}
		rowLen = cell.get('occupy').x.length || 1;
		colLen = cell.get('occupy').x.length || 1;
		//增加超过加载区域处理
		for (i = 0; i < rowLen; i++) {
			rowIndex = selectRowIndex + relativeRowIndex + i;
			arrayRowAlias.push(rowList[rowIndex].get('alias'));
			height += rowList[rowIndex].get('height') + 1;
			if (i === 0) {
				top = rowList[rowIndex].get('top');
			}
		}
		for (i = 0; i < colLen; i++) {
			colIndex = selectColIndex + relativeColIndex + i;
			arrayColAlias.push(colList[colIndex].get('alias'));
			width += colList[colIndex].get('width') + 1;
			if (i === 0) {
				left = colList[colIndex].get('left');
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
			var index = cells.length,
				rowLen,
				colLen,
				i, j;
			for (i = 0, rowLen = arrayRowAlias.length; i < rowLen; i++) {
				for (j = 0, colLen = arrayColAlias.length; j < colLen; j++) {
					cache.cachePosition(arrayRowAlias[i], arrayColAlias[j], index);
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

		encodeText = encodeURI(pasteText);
		rowData = encodeText.split('%0D%0A');

		rowLen = rowData.length - 1;
		if (rowData[rowLen] !== '') {
			rowLen++;
		}

		colLen = rowData[0].split('%09').length;

		selectRegion = selectRegions.getModelByType('selected');
		selectRowIndex = rows.getIndexByAlias(selectRegion.get('wholePosi').startY);
		selectColIndex = cols.getIndexByAlias(selectRegion.get('wholePosi').startX);

		rowSort = rowList[selectRowIndex].get('sort');
		colSort = colList[selectColIndex].get('sort');

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

		// send.PackAjax({
		// 	url: config.url.sheet.paste,
		// 	async: false,
		// 	data: JSON.stringify({
		// 		sheetId: '1',
		// 		oprCol: colList[selectColIndex].get('sort'),
		// 		oprRow: rowList[selectRowIndex].get('sort'),
		// 		colLen: colLen,
		// 		rowLen: rowLen,
		// 		pasteData: sendData
		// 	}),
		// 	success: function(data) {
		// 		if (data && data.isLegal) {
		fillData();
		// 		} else {
		// 			Backbone.trigger('event:showMsgBar:show', '该区域不能进行此操作');
		// 		}
		// 	}
		// });

		function fillData() {
			var cellStrand = cache.CellsPosition.strandX,
				originalModelIndexs = [],
				currentModelIndexs = [],
				originalRuleData = [],
				currentRuleData = [],
				rowAlias,
				colAlias,
				cellModel,
				actions = [];

			for (i = selectRowIndex; i < selectRowIndex + rowLen; i++) {
				for (j = selectColIndex; j < selectColIndex + colLen; j++) {
					if (i >= rows.length || j >= cols.length) {
						continue;
					}
					rowAlias = rowList[i].get('alias');
					colAlias = colList[j].get('alias');
					cellModel = cells.getCellByVertical(j, i)[0];
					if (cellModel && cellModel.get('isDestroy') === false) {
						originalModelIndexs.push(cellStrand[colAlias][rowAlias]);
						cellModel.set('isDestroy', true);
					}
					cache.deletePosi(rowAlias, colAlias);
					if ((tempRuleIndex = strandMap.getPointRecord(colAlias, rowAlias, 'validate')) !== undefined) {
						originalRuleData.push({
							colAlias: colAlias,
							rowAlias: rowAlias,
							index: tempRuleIndex
						});
						strandMap.deletePointRecord(colAlias, rowAlias, 'validate');
					}
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
			actions.push(history.getCellCoverAction(currentModelIndexs, originalModelIndexs));
			actions.push(history.getValidateCoverAction([], originalRuleData));
			history.addAction(actions);
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