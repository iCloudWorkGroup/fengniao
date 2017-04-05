'use strict';
define(function(require) {
	var send = require('basic/tools/send'),
		cells = require('collections/cells'),
		cache = require('basic/tools/cache'),
		history = require('basic/tools/history'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		selectRegions = require('collections/selectRegion'),
		getOperRegion = require('basic/tools/getoperregion'),
		rowOperate = require('entrance/row/rowoperation'),
		colOperate = require('entrance/col/coloperation');

	var setCellBorder = function(sheetId, border, label) {
		var clip,
			region,
			operRegion,
			sendRegion,
			headItemRowList = headItemRows.models,
			headItemColList = headItemCols.models;

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

		switch (border) {
			case 'bottom':
				setBottom(true);
				break;
			case 'top':
				setTop(true);
				break;
			case 'left':
				setLeft(true);
				break;
			case 'right':
				setRight(true);
				break;
			case 'none':
				setNone();
				break;
			case 'all':
				setAll();
				break;
			case 'outer':
				setOuter();
				break;
		}
		sendData();

		function sendData() {
			send.PackAjax({
				url: 'cells.htm?m=frame',
				data: JSON.stringify({
					coordinate: sendRegion,
					frameStyle: border
				})
			});
		}

		/**
		 * 清除全边框
		 * @method setNone
		 */
		function setNone() {
			var changeModelList = [],
				border = {
					left: false,
					right: false,
					bottom: false,
					top: false
				};
			if (operRegion.endColIndex === 'MAX') {
				rowOperate.rowPropOper(operRegion.startRowIndex, 'border', border);
			} else if (operRegion.endRowIndex === 'MAX') {
				colOperate.colPropOper(operRegion.startColIndex, 'border', border);
			} else {
				cells.operateCellsByRegion(operRegion, function(cell, colSort, rowSort) {
					changeModelList.push({
						colSort: colSort,
						rowSort: rowSort,
						value: cell.get('border')
					});
					cell.set('border', border);
				});

				history.addUpdateAction('border', border, {
						startColSort: headItemColList[operRegion.startColIndex].get('sort'),
						startRowSort: headItemRowList[operRegion.startRowIndex].get('sort'),
						endColSort: headItemColList[operRegion.endColIndex].get('sort'),
						endRowSort: headItemRowList[operRegion.endRowIndex].get('sort')
					},
					changeModelList
				);
			}
		}
		/**
		 * 设置全边框
		 * @method setAll
		 */
		function setAll() {
			var changeModelList = [],
				border = {
					left: true,
					right: true,
					bottom: true,
					top: true
				};
			if (operRegion.endColIndex === 'MAX') {
				rowOperate.rowPropOper(operRegion.startRowIndex, 'border', border);
			} else if (operRegion.endRowIndex === 'MAX') {
				colOperate.colPropOper(operRegion.startColIndex, 'border', border);
			} else {
				cells.operateCellsByRegion(operRegion, function(cell, colSort, rowSort) {
					changeModelList.push({
						colSort: colSort,
						rowSort: rowSort,
						value: cell.get('border')
					});
					cell.set('border', border);
				});
				history.addUpdateAction('border', border, {
						startColSort: headItemColList[operRegion.startColIndex].get('sort'),
						startRowSort: headItemRowList[operRegion.startRowIndex].get('sort'),
						endColSort: headItemColList[operRegion.endColIndex].get('sort'),
						endRowSort: headItemRowList[operRegion.endRowIndex].get('sort')
					},
					changeModelList
				);
			}
		}
		/**
		 * 设置上边框
		 * @method setTop
		 * @param  {boolean} reverse
		 */
		function setTop() {
			var cellList, i, changeModelList = [];
			if (operRegion.endColIndex === 'MAX') {
				rowOperate.rowPropOper(operRegion.startRowIndex, 'border.top', true);
			} else if (operRegion.endRowIndex === 'MAX') {
				colOperate.colPropOper(operRegion.startColIndex, 'border.top', true);
			} else {
				cells.operTopHeadModel(operRegion.startColIndex,
					operRegion.startRowIndex,
					operRegion.endColIndex,
					operRegion.endRowIndex,
					function(cell, colSort, rowSort) {
						changeModelList.push({
							colSort: colSort,
							rowSort: rowSort,
							value: cell.get('border').top
						});
						cell.set('border.top', true);
					});
				history.addUpdateAction('border.top', true, {
						startColSort: headItemColList[operRegion.startColIndex].get('sort'),
						startRowSort: headItemRowList[operRegion.startRowIndex].get('sort'),
						endColSort: headItemColList[operRegion.endColIndex].get('sort'),
						endRowSort: headItemRowList[operRegion.endRowIndex].get('sort')
					},
					changeModelList
				);
			}
		}
		/**
		 * 设置左边框
		 * @method setLeft
		 * @param  {boolean} reverse
		 * @param  {object} [appointList]
		 */
		function setLeft() {
			var cellList, i, changeModelList = [];
			if (operRegion.endColIndex === 'MAX') {
				rowOperate.rowPropOper(operRegion.startRowIndex, 'border.left', true);
			} else if (operRegion.endRowIndex === 'MAX') {
				colOperate.colPropOper(operRegion.startColIndex, 'border.left', true);
			} else {
				cells.operLeftHeadModel(operRegion.startColIndex,
					operRegion.startRowIndex,
					operRegion.endColIndex,
					operRegion.endRowIndex,
					function(cell, colSort, rowSort) {
						changeModelList.push({
							colSort: colSort,
							rowSort: rowSort,
							value: cell.get('border').left
						});
						cell.set('border.left', true);
					});
				history.addUpdateAction('border.left', true, {
						startColSort: headItemColList[operRegion.startColIndex].get('sort'),
						startRowSort: headItemRowList[operRegion.startRowIndex].get('sort'),
						endColSort: headItemColList[operRegion.endColIndex].get('sort'),
						endRowSort: headItemRowList[operRegion.endRowIndex].get('sort')
					},
					changeModelList
				);
			}
		}
		/**
		 * 设置下边框
		 * @method setBottom
		 * @param  {boolean} reverse
		 * @param  {object} [appointList]
		 */
		function setBottom() {
			var cellList, i, changeModelList = [];
			if (operRegion.endColIndex === 'MAX') {
				rowOperate.rowPropOper(operRegion.startRowIndex, 'border.bottom', true);
			} else if (operRegion.endRowIndex === 'MAX') {
				colOperate.colPropOper(operRegion.startColIndex, 'border.bottom', true);
			} else {
				cells.operBottomHeadModel(operRegion.startColIndex,
					operRegion.startRowIndex,
					operRegion.endColIndex,
					operRegion.endRowIndex,
					function(cell, colSort, rowSort) {
						changeModelList.push({
							colSort: colSort,
							rowSort: rowSort,
							value: cell.get('border').bottom
						});
						cell.set('border.bottom', true);
					});
				history.addUpdateAction('border.bottom', true, {
						startColSort: headItemColList[operRegion.startColIndex].get('sort'),
						startRowSort: headItemRowList[operRegion.startRowIndex].get('sort'),
						endColSort: headItemColList[operRegion.endColIndex].get('sort'),
						endRowSort: headItemRowList[operRegion.endRowIndex].get('sort')
					},
					changeModelList
				);
			}
		}
		/**
		 * 设置右边框
		 * @method setRight
		 * @param  {boolean} reverse
		 * @param  {object} [appointList]
		 */
		function setRight() {
			var cellList, i, changeModelList = [];
			if (operRegion.endColIndex === 'MAX') {
				rowOperate.rowPropOper(operRegion.startRowIndex, 'border.right', true);
			} else if (operRegion.endRowIndex === 'MAX') {
				colOperate.colPropOper(operRegion.startColIndex, 'border.right', true);
			} else {
				cells.operRightHeadModel(operRegion.startColIndex,
					operRegion.startRowIndex,
					operRegion.endColIndex,
					operRegion.endRowIndex,
					function(cell, colSort, rowSort) {
						changeModelList.push({
							colSort: colSort,
							rowSort: rowSort,
							value: cell.get('border').right
						});
						cell.set('border.right', true);
					});
				history.addUpdateAction('border.right', true, {
						startColSort: headItemColList[operRegion.startColIndex].get('sort'),
						startRowSort: headItemRowList[operRegion.startRowIndex].get('sort'),
						endColSort: headItemColList[operRegion.endColIndex].get('sort'),
						endRowSort: headItemRowList[operRegion.endRowIndex].get('sort')
					},
					changeModelList
				);
			}
		}
		/**
		 * 设置外边框
		 * @method setOuter
		 */
		function setOuter() {
			var cellList, i, changeModelList = [],cachePosi={};
			if (operRegion.endColIndex === 'MAX') {
				rowOperate.rowPropOper(operRegion.startRowIndex, 'border.top', true);
				rowOperate.rowPropOper(operRegion.startRowIndex, 'border.bottom', true);
			} else if (operRegion.endRowIndex === 'MAX') {
				colOperate.colPropOper(operRegion.startColIndex, 'border.right', true);
				colOperate.colPropOper(operRegion.startColIndex, 'border.left', true);
			} else {
				cells.operOuterHeadModel(operRegion.startColIndex,
					operRegion.startRowIndex,
					operRegion.endColIndex,
					operRegion.endRowIndex,
					function(cell, colSort, rowSort) {
						changeModelList.push({
							colSort: colSort,
							rowSort: rowSort,
							value: cell.get('border')
						});
					});
				cells.operRightHeadModel(operRegion.startColIndex,
					operRegion.startRowIndex,
					operRegion.endColIndex,
					operRegion.endRowIndex,
					function(cell, colSort, rowSort) {
						cell.set('border.right', true);
					});
				cells.operLeftHeadModel(operRegion.startColIndex,
					operRegion.startRowIndex,
					operRegion.endColIndex,
					operRegion.endRowIndex,
					function(cell, colSort, rowSort) {
						cell.set('border.left', true);
					});
				cells.operTopHeadModel(operRegion.startColIndex,
					operRegion.startRowIndex,
					operRegion.endColIndex,
					operRegion.endRowIndex,
					function(cell, colSort, rowSort) {
						cell.set('border.top', true);
					});
				cells.operBottomHeadModel(operRegion.startColIndex,
					operRegion.startRowIndex,
					operRegion.endColIndex,
					operRegion.endRowIndex,
					function(cell, colSort, rowSort) {
						cell.set('border.bottom', true);
					});
				history.addUpdateAction('border', true, {
						startColSort: headItemColList[operRegion.startColIndex].get('sort'),
						startRowSort: headItemRowList[operRegion.startRowIndex].get('sort'),
						endColSort: headItemColList[operRegion.endColIndex].get('sort'),
						endRowSort: headItemRowList[operRegion.endRowIndex].get('sort')
					},
					changeModelList
				);
			}
		}

	};
	return setCellBorder;
});