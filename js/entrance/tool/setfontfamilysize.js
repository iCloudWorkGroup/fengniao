'use strict';
define(function(require) {
	var send = require('basic/tools/send'),
		cells = require('collections/cells'),
		headItemRows = require('collections/headItemRow'),
		headItemCols = require('collections/headItemCol'),
		selectRegions = require('collections/selectRegion'),
		setCellHeight = require('entrance/cell/setcellheight'),
		analysisLabel = require('basic/tools/analysislabel'),
		getTextHeight = require('basic/tools/gettextbox'),
		rowOperate = require('entrance/row/rowoperation');


	var setFontFamilySize = function(sheetId, fontSize, label) {
		var select,
			region = {},
			startColAlias,
			startRowAlias,
			endColAlias,
			endRowAlias;
		//增加行列操作判断
		if (label !== undefined) {
			region = analysisLabel(label);
		} else {
			select = selectRegions.getModelByType('operation')[0];
			region.startColIndex = headItemCols.getIndexByAlias(select.get('wholePosi').startX);
			region.startRowIndex = headItemRows.getIndexByAlias(select.get('wholePosi').startY);
			region.endColIndex = headItemCols.getIndexByAlias(select.get('wholePosi').endX);
			region.endRowIndex = headItemRows.getIndexByAlias(select.get('wholePosi').endY);
		}

		if (region.endColIndex === 'MAX') { //整行操作
			rowOperate.rowPropOper(region.startRowIndex, 'content.size', fontSize);
			endColAlias = 'MAX';
			endRowAlias = headItemRows.models[region.endRowIndex].get('alias');
		} else {
			region = cells.getFullOperationRegion(region);
			cells.operateCellsByRegion(region, function(cell) {
				cell.set('content.size', fontSize);
			});
			endColAlias = headItemCols.models[region.endColIndex].get('alias');
			endRowAlias = headItemRows.models[region.endRowIndex].get('alias');
		}

		startColAlias = headItemCols.models[region.startColIndex].get('alias');
		startRowAlias = headItemRows.models[region.startRowIndex].get('alias');


		// for (i = region.startRowIndex; i < region.endRowIndex + 1; i++) {
		// 	headItemModel = headItemRows.models[i];
		// 	headItemHeight = headItemModel.get('height');
		// 	containerHeight=getTextHeight.getTextHeight('', false, fontSize, width);
		// 	if (containerHeight > headItemHeight) {
		// 		setCellHeight('sheetId', headItemModel.get('displayName'), containerHeight);
		// 	}
		// }

		send.PackAjax({
			url: 'text.htm?m=font_size',
			data: JSON.stringify({
				excelId: window.SPREADSHEET_AUTHENTIC_KEY,
				sheetId: '1',
				coordinate: {
					startX: startColAlias,
					startY: startRowAlias,
					endX: endColAlias,
					endY: endRowAlias
				},
				size: fontSize
			})
		});
	};
	return setFontFamilySize;
});