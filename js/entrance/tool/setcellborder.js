'use strict';
define(function(require) {
	var send = require('basic/tools/send'),
		cells = require('collections/cells'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		selectRegions = require('collections/selectRegion'),
		getOperRegion = require('basic/tools/getoperregion'),
		rowOperate = require('entrance/row/rowoperation'),
		colOperate = require('entrance/col/coloperation');

	var setCellBorder = function(sheetId, border, label) {
		var clip,
			region,
			operRegion,
			sendRegion;

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
				url: config.url.border,
				data: JSON.stringify({
					coordinate: sendRegion,
					direction: border
				})
			});
		}

		/**
		 * 清除全边框
		 * @method setNone
		 */
		function setNone() {
			if (operRegion.endColIndex === 'MAX') {
				rowOperate.rowPropOper(operRegion.startRowIndex, 'border.left', false);
				rowOperate.rowPropOper(operRegion.startRowIndex, 'border.right', false);
				rowOperate.rowPropOper(operRegion.startRowIndex, 'border.top', false);
				rowOperate.rowPropOper(operRegion.startRowIndex, 'border.bottom', false);
			} else if (operRegion.endRowIndex === 'MAX') {
				colOperate.colPropOper(operRegion.startColIndex, 'border.left', false);
				colOperate.colPropOper(operRegion.startColIndex, 'border.right', false);
				colOperate.colPropOper(operRegion.startColIndex, 'border.top', false);
				colOperate.colPropOper(operRegion.startColIndex, 'border.bottom', false);
			} else {
				cells.operateCellsByRegion(operRegion, function(cell) {
					cell.set('border.left', false);
					cell.set('border.right', false);
					cell.set('border.top', false);
					cell.set('border.bottom', false);
				});
			}
		}
		/**
		 * 设置全边框
		 * @method setAll
		 */
		function setAll() {
			if (operRegion.endColIndex === 'MAX') {
				rowOperate.rowPropOper(operRegion.startRowIndex, 'border.left', true);
				rowOperate.rowPropOper(operRegion.startRowIndex, 'border.right', true);
				rowOperate.rowPropOper(operRegion.startRowIndex, 'border.top', true);
				rowOperate.rowPropOper(operRegion.startRowIndex, 'border.bottom', true);
			} else if (operRegion.endRowIndex === 'MAX') {
				colOperate.colPropOper(operRegion.startColIndex, 'border.left', true);
				colOperate.colPropOper(operRegion.startColIndex, 'border.right', true);
				colOperate.colPropOper(operRegion.startColIndex, 'border.top', true);
				colOperate.colPropOper(operRegion.startColIndex, 'border.bottom', true);
			} else {
				cells.operateCellsByRegion(operRegion, function(cell) {
					cell.set('border.left', true);
					cell.set('border.right', true);
					cell.set('border.top', true);
					cell.set('border.bottom', true);
				});
			}
		}
		/**
		 * 设置上边框
		 * @method setTop
		 * @param  {boolean} reverse
		 */
		function setTop() {
			var cellList, i;
			if (operRegion.endColIndex === 'MAX') {
				rowOperate.rowPropOper(operRegion.startRowIndex, 'border.top', true);
			} else if (operRegion.endRowIndex === 'MAX') {
				colOperate.colPropOper(operRegion.startColIndex, 'border.top', true);
			} else {
				cellList = cells.getTopHeadModelByIndex(operRegion.startColIndex,
					operRegion.startRowIndex,
					operRegion.endColIndex,
					operRegion.endRowIndex);
				for (i in cellList) {
					cellList[i].set('border.top', true);
				}
			}
		}
		/**
		 * 设置左边框
		 * @method setLeft
		 * @param  {boolean} reverse
		 * @param  {object} [appointList]
		 */
		function setLeft() {
			var cellList, i;
			if (operRegion.endColIndex === 'MAX') {
				rowOperate.rowPropOper(operRegion.startRowIndex, 'border.left', true);
			} else if (operRegion.endRowIndex === 'MAX') {
				colOperate.colPropOper(operRegion.startColIndex, 'border.left', true);
			} else {
				cellList = cells.getLeftHeadModelByIndex(operRegion.startColIndex,
					operRegion.startRowIndex,
					operRegion.endColIndex,
					operRegion.endRowIndex);
				for (i in cellList) {
					cellList[i].set('border.left', true);
				}
			}
		}
		/**
		 * 设置下边框
		 * @method setBottom
		 * @param  {boolean} reverse
		 * @param  {object} [appointList]
		 */
		function setBottom() {
			var cellList, i;
			if (operRegion.endColIndex === 'MAX') {
				rowOperate.rowPropOper(operRegion.startRowIndex, 'border.bottom', true);
			} else if (operRegion.endRowIndex === 'MAX') {
				colOperate.colPropOper(operRegion.startColIndex, 'border.bottom', true);
			} else {
				cellList = cells.getBottomHeadModelByIndex(operRegion.startColIndex,
					operRegion.startRowIndex,
					operRegion.endColIndex,
					operRegion.endRowIndex);
				for (i in cellList) {
					cellList[i].set('border.bottom', true);
				}
			}
		}
		/**
		 * 设置右边框
		 * @method setRight
		 * @param  {boolean} reverse
		 * @param  {object} [appointList]
		 */
		function setRight() {
			var cellList, i;
			if (operRegion.endColIndex === 'MAX') {
				rowOperate.rowPropOper(operRegion.startRowIndex, 'border.right', true);
			} else if (operRegion.endRowIndex === 'MAX') {
				colOperate.colPropOper(operRegion.startColIndex, 'border.right', true);
			} else {
				cellList = cells.getRightHeadModelByIndex(operRegion.startColIndex,
					operRegion.startRowIndex,
					operRegion.endColIndex,
					operRegion.endRowIndex);
				for (i in cellList) {
					cellList[i].set('border.right', true);
				}
			}
		}
		/**
		 * 设置外边框
		 * @method setOuter
		 */
		function setOuter() {
			if (region.endRowIndex !== 'MAX') {
				setTop(region);
				setBottom(region);
			}
			if (region.endColIndex !== 'MAX') {
				setLeft(region);
				setRight(region);
			}

		}

	};
	return setCellBorder;
});