'use strict';
define(function(require) {
	var send = require('basic/tools/send'),
		binary = require('basic/util/binary'),
		cache = require('basic/tools/cache'),
		cells = require('collections/cells'),
		Point = require('basic/tools/point'),
		history = require('basic/tools/history'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		selectRegions = require('collections/selectRegion'),
		getOperRegion = require('basic/tools/getoperregion'),
		rowOperate = require('entrance/row/rowoperation'),
		colOperate = require('entrance/col/coloperation');

	/**
	 * 设置单元格填充颜色
	 * @param {string} sheetId sheetId
	 * @param {string} color   颜色值
	 * @param {string} label   行标，列标
	 */
	var setFillColor = function(sheetId, color, arrOpr) {
		var clip,
			operRegion,
			sendRegion,
			headItemRowList = headItemRows.models,
			headItemColList = headItemCols.models,
			len, i;

		clip = selectRegions.getModelByType('clip');
		if (clip !== undefined) {
			cache.clipState = 'null';
			clip.destroy();
		}
		if (arrOpr !== undefined) {
			if (arrOpr.constructor === Array) {
				len = arrOpr.length;
				for (i = 0; i < len; i++) {
					if (!(arrOpr[i] instanceof Point)) {
						throw new Error('Parameter format error');
					}
				}
			} else {
				throw new Error('Parameter format error');
			}
			outerOper();
		} else {
			operRegion = getOperRegion().operRegion;
			sendRegion = getOperRegion().sendRegion;
			innerOper(operRegion, sendRegion);
		}

		function innerOper(operRegion, sendRegion) {
			var changeModelList = [];
			if (operRegion.endColIndex === 'MAX') { //整行操作
				rowOperate.rowPropOper(operRegion.startRowIndex, 'customProp.background', color);
			} else if (operRegion.endRowIndex === 'MAX') {
				colOperate.colPropOper(operRegion.startColIndex, 'customProp.background', color);
			} else {
				cells.operateCellsByRegion(operRegion, function(cell, colSort, rowSort) {
					if (cell.get('customProp').background !== color) {
						changeModelList.push({
							colSort: colSort,
							rowSort: rowSort,
							value: cell.get('customProp').background
						});
						cell.set('customProp.background', color);
					}
				});
				history.addUpdateAction('customProp.background', color, {
					startColSort: headItemColList[operRegion.startColIndex].get('sort'),
					startRowSort: headItemRowList[operRegion.startRowIndex].get('sort'),
					endColSort: headItemColList[operRegion.endColIndex].get('sort'),
					endRowSort: headItemRowList[operRegion.endRowIndex].get('sort')
				}, changeModelList);
			}
			send.PackAjax({
				url: 'text.htm?m=fill_bgcolor',
				// url: 'text.htm/fill_bgcolor',
				data: JSON.stringify({
					coordinate: sendRegion,
					bgcolor: color
				})
			});
		}

		function outerOper() {
			var i = 0,
				temp,
				len = arrOpr.length,
				startColSort,
				startRowSort,
				endColSort,
				endRowSort,
				coordianteData = [];
			for (; i < len; i++) {
				if (!arrOpr[i].startCol) {
					startRowSort = rowSignToSort(arrOpr[i].startRow);
					coordianteData.push({
						startSortX: 0,
						startSortY: startRowSort,
						endSortX: -1,
						endSortY: startRowSort
					});
				} else if (!arrOpr[i].startRow) {
					startColSort = rowSignToSort(arrOpr[i].startCol);
					coordianteData.push({
						startSortX: startColSort,
						startSortY: 0,
						endSortX: startColSort,
						endSortY: -1
					});
				} else {
					startColSort = colSignToSort(arrOpr[i].startCol);
					startRowSort = rowSignToSort(arrOpr[i].startRow);
					endColSort = colSignToSort(arrOpr[i].endCol);
					endRowSort = rowSignToSort(arrOpr[i].endRow);
					if (endColSort < startColSort) {
						temp = startColSort;
						startColSort = endColSort;
						endColSort = temp;
					}
					if (endRowSort < startRowSort) {
						temp = startRowSort;
						startRowSort = endRowSort;
						endRowSort = temp;
					}
					coordianteData.push({
						startSortX: startColSort,
						startSortY: startRowSort,
						endSortX: endColSort,
						endSortY: endRowSort
					});
				}
			}
			send.PackAjax({
				url: 'text.htm?m=batchcolorset',
				data: JSON.stringify({
					coordinates: coordianteData,
					bgcolor: color
				}),
				success: function(data) {
					data = data.returndata;
					fillColorOper(data, coordianteData);
				}
			});
		}

		function fillColorOper(data, coordianteData) {
			var i = 0,
				temp = {},
				len,
				startColIndex,
				startRowIndex,
				endColIndex,
				endRowIndex,
				headItemColList,
				headItemRowList;

			headItemColList = headItemCols.models;
			headItemRowList = headItemRows.models;
			len = data.length;
			for (; i < len; i++) {
				temp[data[i].index] = data[i].errorMessage;
			}
			len = arrOpr.length;
			for (i = 0; i < len; i++) {
				if (temp[i] && arrOpr[i].error) {
					arrOpr[i].error();
				} else {
					if (coordianteData[i].endColSort === -1) { //整行操作
						startRowIndex = binary.indexAttrBinary(coordianteData[i].startSortY, headItemRowList, 'sort');
						rowOperate.rowPropOper(startRowIndex, 'customProp.background', color);
					} else if (coordianteData[i].endRowIndex === -1) {
						startColIndex = binary.indexAttrBinary(coordianteData[i].startSortX, headItemColList, 'sort');
						colOperate.colPropOper(startColIndex, 'customProp.background', color);
					} else {
						startRowIndex = binary.indexAttrBinary(coordianteData[i].startSortY, headItemRowList, 'sort');
						startColIndex = binary.indexAttrBinary(coordianteData[i].startSortX, headItemColList, 'sort');
						endRowIndex = binary.indexAttrBinary(coordianteData[i].endSortY, headItemRowList, 'sort');
						endColIndex = binary.indexAttrBinary(coordianteData[i].endSortX, headItemColList, 'sort');

						if (startRowIndex === -1 || startColIndex === -1) {
							if (arrOpr[i].success) {
								arrOpr[i].success();
							}
							continue;
						}
						if (endRowIndex === -1) {
							endRowIndex = headItemRows.length - 1;
						}
						if (endColIndex === -1) {
							endColIndex = headItemCols.length - 1;
						}
						cells.operateCellsByRegion({
							startRowIndex: startRowIndex,
							endRowIndex: endRowIndex,
							startColIndex: startColIndex,
							endColIndex: endColIndex
						}, cellOper);
						if (arrOpr[i].success) {
							arrOpr[i].success();
						}
					}

				}
			}

			function cellOper(cell) {
				cell.set('customProp.background', color);
			}
		}

		function colSignToSort(sign) {
			var i = 0,
				sort = 0,
				len = sign.length,
				letter = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
				index;
			for (; i < len; i++) {
				index = letter.indexOf(sign[i]) + 1;
				sort += index * (Math.pow(26, (len - i - 1)));
			}
			return sort - 1;
		}

		function rowSignToSort(sign) {
			return parseInt(sign) - 1;
		}
	};
	return setFillColor;
});