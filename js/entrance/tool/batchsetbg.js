define(function(require) {
	'use strict';
	var Backbone = require('lib/backbone'),
		send = require('basic/tools/send'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		cells = require('collections/cells'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		rowOperate = require('entrance/row/rowoperation'),
		colOperate = require('entrance/col/coloperation'),
		weight;

	var setBg = {
		set: function() {
			if (cache.protectState) {
				Backbone.trigger('event:showMsgBar:show', '保护状态，不能进行该操作');
				return;
			}

			this._parseRegion(arguments, function(color, arrOpr, arrSend) {
				var regColor = /^rgb\(((25[0-5]|2[0-4][0-9]|[0-1]?[0-9]?[0-9]),){2}(25[0-5]|2[0-4][0-9]|[0-1]?[0-9]?[0-9])\)$/,
					region, i, len;

				color = color.replace(/\s/g, '');

				if (!regColor.test(color)) {
					throw new Error('非法参数');
				}

				for (i = 0, len = arrOpr.length; i < len; i++) {
					region = arrOpr[i];
					if (region.endColIndex === -1) {
						rowOperate.rowPropOper(region.startRowIndex, region.endRowIndex, 'customProp.background', color);
					} else if (region.endRowIndex === -1) {
						colOperate.colPropOper(region.startColIndex, region.endColIndex, 'customProp.background', color);
					} else {
						cells.oprCellsByRegion(region, callback, color);
					}
				}

				function callback(cell, colSort, rowSort, value) {
					var original;
					if ((original = cell.get('customProp').background) !== value) {
						cell.set('customProp.background', value);
					}
				}
				send.PackAjax({
					url: config.url.cell.bgBatch,
					data: JSON.stringify({
						coordinate: arrSend,
						color: color
					})
				});
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
		_parseRegion: function(args, callback) {
			var sheetId = args[0],
				color = args[1],
				arrOpr = args[2],
				regCol = /^[a-zA-Z]+$/,
				regRow = /^[1-9]\d*$/,
				maxRowNum = config.User.maxRowNum,
				maxColNum = config.User.maxColNum,
				currentRowNum = headItemRows.length,
				currentColNum = headItemCols.length,
				startCol, startRow, endCol, endRow,
				opr = [],
				send = [],
				point,
				temp,
				len, i;

			if (args.length < 3) {
				arrOpr = color;
				color = sheetId;
			}

			if (!weight) {
				weight = this._getWeight();
			}

			if (!arrOpr) {
				arrOpr = [];
			} else if ({}.toString.call(arrOpr) !== '[object Array]') {
				arrOpr = [arrOpr];
			}

			for (i = 0, len = arrOpr.length; i < len; i++) {
				point = arrOpr[i];
				//整行或整列操作
				if (typeof point === 'string') {
					if (regCol.test(point) && (startCol = colToSort(point)) <= maxColNum) {
						send.push({
							startCol: startCol,
							endCol: startCol,
							startRow: 0,
							endRow: -1
						});
						if (startCol < currentColNum && (startCol = headItemCols.getIndexBySort(startCol)) !== -1) {
							opr.push({
								startColIndex: startCol,
								endColIndex: startCol,
								startRowIndex: 0,
								endRowIndex: -1
							});
						}
						continue;
					}
					if (regRow.test(point) && (startRow = rowToSort(point)) <= maxRowNum) {
						send.push({
							startCol: 0,
							endCol: -1,
							startRow: startRow,
							endRow: startRow
						});
						if (startRow < currentRowNum && (startRow = headItemRows.getIndexBySort(startRow)) !== -1) {
							opr.push({
								startColIndex: 0,
								endColIndex: -1,
								startRowIndex: startRow,
								endRowIndex: startRow
							});
						}
						continue;
					}
					throw new Error('非法参数');
				}

				point.endRow = point.endRow === undefined ? point.startRow : point.endRow;
				point.endCol = point.endCol === undefined ? point.startCol : point.endCol;

				startCol = regCol.test(point.startCol) && colToSort(point.startCol);
				endCol = regCol.test(point.endCol) && colToSort(point.endCol);
				startRow = regRow.test(point.startRow) && rowToSort(point.startRow);
				endRow = regRow.test(point.endRow) && rowToSort(point.endRow);

				if (startCol > endCol || endCol === false) {
					temp = startCol;
					startCol = endCol;
					endCol = temp;
				}

				if (startRow > endRow || endRow === false) {
					temp = startRow;
					startRow = endRow;
					endRow = temp;
				}
				if (endRow > maxRowNum || endCol > maxColNum || !isNumber(startCol) || !isNumber(startRow)) {
					throw new Error('传入参数错误');
				}

				send.push({
					startCol: startCol,
					startRow: startRow,
					endCol: endCol,
					endRow: endRow
				});

				if (startCol < currentColNum && startRow < currentRowNum) {
					startCol = headItemCols.getIndexBySort(startCol);
					startRow = headItemRows.getIndexBySort(startRow);
					endCol = headItemCols.getIndexBySort(endCol);
					endRow = headItemRows.getIndexBySort(endRow);

					endCol = endCol !== -1 ? endCol : currentColNum - 1;
					endRow = endRow !== -1 ? endRow : currentRowNum - 1;
					opr.push({
						startColIndex: startCol,
						startRowIndex: startRow,
						endColIndex: endCol,
						endRowIndex: endRow
					});
				}
			}
			callback.call(this, color, opr, send);

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

			function isNumber(val) {
				return typeof val === 'number';
			}
		},
	};
	return setBg;
});