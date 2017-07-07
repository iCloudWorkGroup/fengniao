define(function(require) {
	'use strict';
	var send = require('basic/tools/send'),
		config = require('spreadsheet/config'),
		cells = require('collections/cells'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		rowOperate = require('entrance/row/rowoperation'),
		colOperate = require('entrance/col/coloperation'),
		// changeModelList = [],
		weight;

	var setBg = {
		set: function(sheeId, color, arrOper) {
			var regColor = /^rgb\(((25[0-5]|2[0-4][0-9]|[0-1]?[0-9]?[0-9]),){2}(25[0-5]|2[0-4][0-9]|[0-1]?[0-9]?[0-9])\)$/,
				regions, i, len,
				oper, sendData;

			if (arguments.length < 3) {
				arrOper = color;
				color = sheeId;
			}
			color = color.replace(/\s/g, '');

			if (!regColor.test(color)) {
				throw new Error('非法参数');
			}
			regions = this._parse(arrOper);
			oper = regions.oper;
			sendData = regions.send;
			for (i = 0, len = oper.length; i < len; i++) {
				if (oper[i].endColIndex === -1) {
					rowOperate.rowPropOper(oper[i].endRowIndex, 'customProp.background', color);
				} else if (oper[i].endRowIndex === -1) {
					colOperate.colPropOper(oper[i].endColIndex, 'customProp.background', color);
				} else {
					cells.oprCellsByRegion(oper[i], callback, color);
				}
			}
			function callback(cell, colSort, rowSort, value) {
				var original;
				if ((original = cell.get('customProp').background) !== value) {
					cell.set('customProp.background', value);
				}
			}
			send.PackAjax({
				url: config.url.cell.bg_batch,
				data: JSON.stringify({
					coordinate: sendData,
					color: color
				})
			});

		},
		_getWeight: function() {
			var sign,
				result = {},
				arr, len, i, count = 1;

			sign = 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z ';
			sign += 'a b c d e f g h i j k l m n o p q r s t u v w x y z';
			arr = sign.split(' ');
			for (i = 0, len = arr.length; i < len; i++, count++) {
				result[arr[i]] = count;
				if (i === 25) {
					count = 0;
				}
			}
			return result;
		},
		_parse: function(arrOper) {
			var regCol = /^[a-zA-Z]+$/,
				regRow = /^[1-9]\d*$/,
				maxRowNum = config.User.maxRowNum,
				maxColNum = config.User.maxColNum,
				startCol, startRow, endCol, endRow,
				oper = [],
				send = [],
				point,
				temp,
				len, i;

			if (!weight) {
				weight = this._getWeight();
			}
			if (Object.prototype.toString.call(arrOper) !== '[object Array]') {
				arrOper = [arrOper];
			}
			for (i = 0, len = arrOper.length; i < len; i++) {
				point = arrOper[i];
				//整行或整列操作
				if (typeof point === 'string') {
					if (regCol.test(point) && (startCol = colToSort(point)) <= maxColNum) {
						send.push({
							startCol: startCol,
							endCol: startCol,
							startRow: 0,
							endRow: -1
						});
						startCol = headItemCols.getIndexBySort(startCol);
						oper.push({
							startColIndex: startCol,
							endColIndex: startCol,
							startRowIndex: 0,
							endRowIndex: -1
						});
						continue;
					}
					if (regRow.test(point) && (startRow = rowToSort(point)) <= maxRowNum) {
						send.push({
							startCol: 0,
							endCol: -1,
							startRow: startRow,
							endRow: startRow
						});
						startRow = headItemRows.getIndexBySort(startRow);
						oper.push({
							startColIndex: 0,
							endColIndex: -1,
							startRowIndex: startRow,
							endRowIndex: startRow
						});
						continue;
					}
					throw new Error('非法参数');
				}

				point.endRow = point.endRow === undefined ? point.startRow : point.endRow;
				point.endCol = point.endCol === undefined ? point.startCol : point.endCol;
				startCol = point.startCol;
				if (startCol === undefined || !regCol.test(startCol) || (startCol = colToSort(startCol)) >= maxColNum) {
					throw new Error('非法参数');
				}
				endCol = point.endCol;
				if ((endCol = colToSort(endCol)) > maxColNum) {
					throw new Error('非法参数');
				}
				if (startCol > endCol) {
					temp = startCol;
					startCol = endCol;
					endCol = temp;
				}
				startRow = point.startRow;
				if (startRow === undefined || !regRow.test(startRow) || (startRow = rowToSort(startRow)) >= maxRowNum) {
					throw new Error('非法参数');
				}
				endRow = point.endRow;
				if ((endRow = rowToSort(endRow)) > maxRowNum) {
					throw new Error('非法参数');
				}
				if (startRow > endRow) {
					temp = startRow;
					startRow = endRow;
					endRow = temp;
				}
				send.push({
					startCol: startCol,
					startRow: startRow,
					endCol: endCol,
					endRow: endRow
				});
				startCol = headItemCols.getIndexBySort(startCol);
				startRow = headItemRows.getIndexBySort(startRow);
				endCol = headItemCols.getIndexBySort(endCol);
				endRow = headItemRows.getIndexBySort(endRow);
				oper.push({
					startColIndex: startCol,
					startRowIndex: startRow,
					endColIndex: endCol,
					endRowIndex: endRow
				});
			}
			return {
				send: send,
				oper: oper
			};

			function colToSort(str) {
				var count = -1,
					i, len;
				for (i = 0, len = str.length; i < len; i++) {
					count += weight[str[i]] * (Math.pow(26, (len - i - 1)));
				}
				return count;
			}

			function rowToSort(str) {
				return Number(str) - 1;
			}
		},
	};
	return setBg;
});