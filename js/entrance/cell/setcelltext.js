'use strict';
define(function(require) {
	var send = require('basic/tools/send'),
		cells = require('collections/cells'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		history = require('basic/tools/history'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		selectRegions = require('collections/selectRegion'),
		getOperRegion = require('basic/tools/getoperregion'),
		rowOperate = require('entrance/row/rowoperation'),
		colOperate = require('entrance/col/coloperation');


	return {
		set: function(text) {
			var clip,
				region,
				operRegion,
				sendRegion,
				headItemRowList = headItemRows.models,
				headItemColList = headItemCols.models,
				changeModelList = [],
				oldValue;

			clip = selectRegions.getModelByType('clip');
			if (clip !== undefined) {
				cache.clipState = 'null';
				clip.destroy();
			}
			region = getOperRegion();
			operRegion = region.operRegion;
			sendRegion = region.sendRegion;


			if (operRegion.endRowIndex === 'MAX' || operRegion.endColIndex === 'MAX') {
				return;
			}
			cells.oprCellsByRegion(operRegion, function(cell, colSort, rowSort) {
				if ((oldValue = cell.get('content').texts) !== text) {
					changeModelList.push({
						colSort: colSort,
						rowSort: rowSort,
						value: oldValue
					});
					cell.set('content.texts', text);
				}
			});
			history.addUpdateAction('content.texts', text, {
				startColSort: headItemColList[operRegion.startColIndex].get('sort'),
				startRowSort: headItemRowList[operRegion.startRowIndex].get('sort'),
				endColSort: headItemColList[operRegion.endColIndex].get('sort'),
				endRowSort: headItemRowList[operRegion.endRowIndex].get('sort')
			}, changeModelList);

			return sendRegion;
		},
		clear: function() {
			var sendRegion = this.set('');
			if (!sendRegion) {
				return;
			}
			send.PackAjax({
				url: config.url.cell.clear,
				data: JSON.stringify({
					coordinate: [sendRegion],
				})
			});
			
		}
	}
});