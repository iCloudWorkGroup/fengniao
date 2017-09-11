'use strict';
define(function(require) {
	var headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		selectRegions = require('collections/selectRegion'),
		protect = require('entrance/tool/protect'),
		cells = require('collections/cells'),
		cache = require('basic/tools/cache');

	function clipSelectOperate(type, e) {
		var tempCellModel,
			selectRegion,
			startColIndex,
			startRowIndex,
			endColIndex,
			endRowIndex,
			clipModel,
			colAlias,
			rowAlias,
			text = '',
			i,
			j;

		clipModel = selectRegions.getModelByType('clip');
		if (clipModel !== undefined) {
			clipModel.destroy();
		}

		selectRegion = selectRegions.getModelByType('selected');
		//整行整列，禁止复制
		if (selectRegion.get('wholePosi').endX === 'MAX' ||
			selectRegion.get('wholePosi').endY === 'MAX') {
			return;
		}

		clipModel = selectRegion.clone();
		clipModel.set('selectType', 'clip');
		selectRegions.add(clipModel);

		startColIndex = headItemCols.getIndexByAlias(clipModel.get('wholePosi').startX);
		startRowIndex = headItemRows.getIndexByAlias(clipModel.get('wholePosi').startY);
		endColIndex = headItemCols.getIndexByAlias(clipModel.get('wholePosi').endX);
		endRowIndex = headItemRows.getIndexByAlias(clipModel.get('wholePosi').endY);

		//剪切操作包含保护区域，禁止操作
		if (type === 'cut' && protect.interceptor({
				startColIndex: startColIndex,
				startRowIndex: startRowIndex,
				endColIndex: endColIndex,
				endRowIndex: endRowIndex
			})) {
			Backbone.trigger('event:showMsgBar:show','保护状态，不能进行该操作');
			clipModel.destroy();
			return;
		}

		if (type === 'copy') {
			cache.clipState = 'copy';
		} else if (type === 'cut') {
			cache.clipState = 'cut';
		} else {
			return;
		}

		for (i = startRowIndex; i < endRowIndex + 1; i++) {
			for (j = startColIndex; j < endColIndex + 1; j++) {
				colAlias = headItemCols.models[j].get('alias');
				rowAlias = headItemRows.models[i].get('alias');
				tempCellModel = cells.getCellByAlias(colAlias, rowAlias);
				if (tempCellModel !== null) {
					text += cellToText(tempCellModel);
				}
				if (j !== endColIndex) {
					text += '\t';
				} else {
					text += '\r\n';
				}
			}
		}
		if (e !== undefined) {
			e.preventDefault();
			if (window.clipboardData) {
				window.clipboardData.setData('Text', text);
			} else {
				e.originalEvent.clipboardData.setData('Text', text);
			}
			cache.clipboardData = text;
		}

		function cellToText(cell) {
			var text,
				head = '"',
				tail = '"';
			text = cell.get('content').texts;

			if (text.indexOf('\n') === -1) {
				return text;
			}
			while (true) {
				if (text.indexOf('"') === 0) {
					text = text.substring(1);
					head += '""';
				} else {
					break;
				}
			}

			while (true) {
				if (text.lastIndexOf('"') === text.length - 1 && text.length > 1) {
					text = text.substring(0, text.length - 1);
					tail += '""';
				} else {
					break;
				}
			}
			text = head + text + tail;
			return text;
		}
	}
	return clipSelectOperate;
});