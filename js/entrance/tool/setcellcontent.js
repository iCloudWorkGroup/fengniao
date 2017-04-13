'use strict';
define(function(require) {
	var send = require('basic/tools/send'),
		cache = require('basic/tools/cache'),
		selectRegions = require('collections/selectRegion'),
		cells = require('collections/cells'),
		getOperRegion = require('basic/tools/getoperregion');

	var setCellContent = function(sheetId, text, label) {
		var clip,
			region,
			operRegion,
			sendRegion,
			startColSort,
			startRowSort;

		clip = selectRegions.getModelByType('clip');
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
		operRegion.endColIndex = operRegion.startColIndex;
		operRegion.endRowIndex = operRegion.startRowIndex;

		cells.operateCellsByRegion(operRegion, function(cell) {
			cell.set('content.texts', text);
		});
		sendData();

		function sendData() {
			send.PackAjax({
				url: 'text.htm?m=data',
				data: JSON.stringify({
					coordinate: {
						startSortX: sendRegion.startSortX,
						startSortY: sendRegion.startSortY,
					},
					content: text
				})
			});
		}
	};
	return setCellContent;
});