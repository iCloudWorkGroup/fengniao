'use strict';
define(function(require) {
	var send = require('basic/tools/send'),
		selectRegions = require('collections/selectRegion'),
		getOperRegion = require('basic/tools/getoperregion'),
		cache = require('basic/tools/cache'),
		cells = require('collections/cells'),
		regionDel;

	/**
	 * 区域删除单元格
	 * @param {string} sheetId sheetId
	 * @param {string} label   行标，列标
	 */
	regionDel = function(sheetId, label) {
		var clip,
			region,
			operRegion,
			sendRegion;

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

		cells.operateCellsByRegion(operRegion, function(cell) {
			cell.set('content.texts', '');
			cell.set('content.displayTexts', '');
		});
		
		sendData();

		function sendData() {
			send.PackAjax({
				url: 'text.htm?m=data_del',
				data: JSON.stringify({
					coordinate: sendRegion
				})
			});
		}

	};
	return regionDel;
});