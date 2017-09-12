'use strict';
define(function(require) {
	var $ = require('lib/jquery'),
		cache = require('basic/tools/cache'),
		selects = require('collections/selectRegion'),
		gridRows = require('collections/headItemRow'),
		gridCols = require('collections/headItemCol'),
		cells = require('collections/cells'),
		textHandle = require('entrance/cell/setcelltext'),
		gridRowList = gridRows.models,
		gridColList = gridCols.models,
		handler;

	handler = {
		altEnter: function(elem) {
			this._insertAtCursor('\n', elem);
		},
		backspace: function() {
			textHandle.clear('');
		},
		arrow: function(direction) {
			var selectRecord = cache.shortcut.select,
				select,
				cellModel,
				initSelectColIndex,
				initSelectRowIndex,
				selectColAlias,
				selectRowAlias,
				colIndex,
				rowIndex,
				occupyCol,
				occupyRow,
				maxColIndex = gridCols.length - 1,
				maxRowIndex = gridRows.length - 1;

			select = selects.getModelByType('selected');
			//对于方向键，应该以选择初始点为基准做操作，因暂时不支持初始点，所以暂以左上角为基准
			selectColAlias = select.get('wholePosi').startX;
			selectRowAlias = select.get('wholePosi').startY;
			initSelectRowIndex = gridRows.getIndexByAlias(selectRowAlias);
			initSelectColIndex = gridCols.getIndexByAlias(selectColAlias);

			cellModel = cells.getCellByVertical(initSelectColIndex, initSelectRowIndex)[0];

			switch (direction) {
				case 'LEFT':
					colIndex = initSelectColIndex < 1 ? 0 : initSelectColIndex - 1;
					rowIndex = gridRows.getIndexByAlias(selectRecord.rowAlias);
					if (rowIndex === -1) {
						rowIndex = initSelectRowIndex;
					}
					selectRecord.colAlias = gridColList[colIndex].get('alias');
					break;
				case 'RIGHT':
					if (!cellModel) {
						colIndex = initSelectColIndex < maxColIndex ? initSelectColIndex + 1 : maxColIndex;
					} else {
						occupyCol = cellModel.get('occupy').x;
						colIndex = initSelectColIndex + occupyCol.length - occupyCol.indexOf(selectColAlias);
						colIndex = colIndex < maxColIndex ? colIndex : maxColIndex;
					}
					rowIndex = gridRows.getIndexByAlias(selectRecord.rowAlias);
					if (rowIndex === -1) {
						rowIndex = initSelectRowIndex;
					}
					selectRecord.colAlias = gridColList[colIndex].get('alias');
					break;
				case 'UP':
					rowIndex = initSelectRowIndex < 1 ? 0 : initSelectRowIndex - 1;
					colIndex = gridCols.getIndexByAlias(selectRecord.colAlias);
					if (colIndex === -1) {
						colIndex = initSelectColIndex;
					}
					selectRecord.rowAlias = gridRowList[rowIndex].get('alias');
					break;
				case 'DOWN':
					if (!cellModel) {
						rowIndex = initSelectRowIndex < maxRowIndex ? initSelectRowIndex + 1 : maxRowIndex;
					} else {
						occupyRow = cellModel.get('occupy').y;
						rowIndex = initSelectRowIndex + occupyRow.length - occupyRow.indexOf(selectRowAlias);
						rowIndex = rowIndex < maxRowIndex ? rowIndex : maxRowIndex;
					}
					colIndex = gridCols.getIndexByAlias(selectRecord.colAlias);
					if (colIndex === -1) {
						colIndex = initSelectColIndex;
					}
					selectRecord.rowAlias = gridRowList[rowIndex].get('alias');
					break;
				default:
					return;
			}
			select.set('tempPosi', {
				initColIndex: colIndex,
				initRowIndex: rowIndex,
				mouseColIndex: colIndex,
				mouseRowIndex: rowIndex
			});
		},
		_insertAtCursor: function(insertChar, elem) {
			var cursor,
				$elem = $(elem);
			if (document.selection) {
				$elem.focus();
				cursor = document.selection.createRange();
				cursor.text = insertChar;
				$elem.focus();
			} else if (typeof elem.selectionStart === 'number' && typeof elem.selectionEnd === 'number') {
				var startPos = elem.selectionStart;
				var endPos = elem.selectionEnd;
				var scrollTop = elem.scrollTop;
				elem.value = elem.value.substring(0, startPos) + insertChar + elem.value.substring(endPos, elem.value.length);
				$elem.focus();
				elem.selectionStart = startPos + insertChar.length;
				elem.selectionEnd = startPos + insertChar.length;
				elem.scrollTop = scrollTop;
			} else {
				elem.value += insertChar;
				$elem.focus();
			}
		},
	};
	return handler;
});