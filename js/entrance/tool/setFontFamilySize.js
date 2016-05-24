'use strict';
define(function(require) {
	var send = require('basic/tools/send'),
		cells = require('collections/cells'),
		headItemRows = require('collections/headItemRow'),
		headItemCols = require('collections/headItemCol'),
		selectRegions = require('collections/selectRegion'),
		setCellHeight = require('entrance/cell/setcellheight'),
		analysisLabel = require('basic/tools/analysisLabel'),
		sendRegion;


	var setFontFamilySize = function(sheetId, fontSize, label) {
		var region = {},
			select,
			headItemModel,
			headItemHeight,
			fontHeight,
			containerHeight,
			i;

		if (label !== undefined) {
			region = analysisLabel(label);
			region = cells.getFullOperationRegion(region);
		} else {
			select = selectRegions.getModelByType('operation')[0];
			region.startColIndex = headItemCols.getIndexByAlias(select.get('wholePosi').startX);
			region.startRowIndex = headItemRows.getIndexByAlias(select.get('wholePosi').startY);
			region.endColIndex = headItemCols.getIndexByAlias(select.get('wholePosi').endX);
			region.endRowIndex = headItemRows.getIndexByAlias(select.get('wholePosi').endY);
		}

		cells.operateCellsByRegion(region, function(cell) {
			cell.set('content.size', fontSize + 'pt');
		});

		for (i = region.startRowIndex; i < region.endRowIndex + 1; i++) {
			headItemModel = headItemRows.models[i];
			headItemHeight = headItemModel.get('height');
			fontHeight = Math.round(fontSize / 3 * 4);
			containerHeight = fontHeight + 4;
			if (containerHeight > headItemHeight) {
				setCellHeight('sheetId', headItemModel.get('displayName'), containerHeight);
				
			}
		}
		send.PackAjax({
			url: 'text.htm?m=font_size',
			data: JSON.stringify({
				excelId: window.SPREADSHEET_AUTHENTIC_KEY,
				sheetId: '1',
				coordinate: {
					startX: region.startColIndex,
					startY: region.startRowIndex,
					endX: region.endColIndex,
					endY: region.endRowIndex
				},
				size: fontSize
			})
		});
	};
	return setFontFamilySize;
});