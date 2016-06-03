'use strict';
define(function(require) {
	var send = require('basic/tools/send'),
		selectRegions = require('collections/selectRegion'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		cells = require('collections/cells'),
		analysisLabel = require('basic/tools/analysislabel');


	var setAlign = function(sheetId, alignType, label) {
		var url,
			type,
			transverse,
			vertical,
			region = {},
			startColAlias,
			startRowAlias,
			endColAlias,
			endRowAlias,
			select;

		switch (alignType) {
			case 'left':
				url = 'cells.htm?m=align_level';
				transverse = 'left';
				break;
			case 'center':
				url = 'cells.htm?m=align_level';
				transverse = 'center';
				break;
			case 'right':
				url = 'cells.htm?m=align_level';
				transverse = 'right';
				break;
			case 'top':
				url = 'cells.htm?m=align_vertical';
				vertical = 'top';
				break;
			case 'middle':
				url = 'cells.htm?m=align_vertical';
				vertical = 'middle';
				break;
			case 'bottom':
				url = 'cells.htm?m=align_vertical';
				vertical = 'bottom';
				break;
			default:
				return;
		}
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
			if (transverse !== undefined) {
				cell.set('content.alignRow', transverse);
			} else {
				cell.set('content.alignCol', vertical);
			}
		});
		type = transverse || vertical;

		startColAlias = headItemCols.models[region.startColIndex].get('alias');
		startRowAlias= headItemRows.models[region.startRowIndex].get('alias');
		endColAlias= headItemCols.models[region.endColIndex].get('alias');
		endRowAlias= headItemRows.models[region.endRowIndex].get('alias');

		send.PackAjax({
			url: url,
			data: JSON.stringify({
				excelId: window.SPREADSHEET_AUTHENTIC_KEY,
				sheetId: '1',
				coordinate: {
					startX: startColAlias,
					startY: startRowAlias,
					endX: endColAlias,
					endY: endRowAlias
				},
				alignStyle: type
			})
		});

	};
	return setAlign;
});