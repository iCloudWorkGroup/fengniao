'use strict';
define(function(require) {
	var cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		selectRegions = require('collections/selectRegion'),
		SelectRegionModel = require('models/selectRegion'),
		headItemCols = require('collections/headItemCol');

	var selectCellRows = function(sheetId, displayName, index) {
		var modelIndex,
			selectModel;
		if (displayName !== null) {
			modelIndex = headItemCols.getIndexByDisplayname(displayName);
		} else {
			modelIndex = index;
		}

		if (cache.mouseOperateState === config.mouseOperateState.dataSource) {
			selectModel = selectRegions.getModelByType('dataSource');
			if (selectModel === undefined) {
				selectModel = new SelectRegionModel();
				selectModel.set('selectType', 'dataSource');
				selectRegions.add(selectModel);
			}
		} else {
			selectModel = selectRegions.getModelByType('operation');
		}
		selectModel.set('tempPosi', {
			initColIndex: modelIndex,
			initRowIndex: 0,
			mouseColIndex: modelIndex,
			mouseRowIndex: 'MAX'
		});
	};
	return selectCellRows;
});