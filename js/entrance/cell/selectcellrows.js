'use strict';
define(function(require) {
	var cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		selectRegions = require('collections/selectRegion'),
		SelectRegionModel = require('models/selectRegion'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow');

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
			selectModel = selectRegions.getModelByType('selected');
		}
		cache.shortcut.select.rowAlias= headItemRows.models[0].get('alias');
		cache.shortcut.select.colAlias= headItemCols.models[modelIndex].get('alias');
		selectModel.set('tempPosi', {
			initColIndex: modelIndex,
			initRowIndex: 0,
			mouseColIndex: modelIndex,
			mouseRowIndex: 'MAX'
		});
	};
	return selectCellRows;
});