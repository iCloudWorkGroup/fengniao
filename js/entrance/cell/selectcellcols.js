'use strict';
define(function(require) {
	var cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		selectRegions = require('collections/selectRegion'),
		SelectRegionModel = require('models/selectRegion'),
		headItemRows = require('collections/headItemRow'),
		headItemCols = require('collections/headItemCol');

	/**
	 * 整行选中
	 * @param  {string} sheetId     sheetId
	 * @param  {string} displayName 行标识名称
	 * @param  {[type]} index       行索引值
	 */
	var selectCellCols = function(sheetId, displayName, index) {
		var modelIndex,
			selectModel;

		if (displayName !== null) {
			modelIndex = headItemRows.getIndexByDisplayname(displayName);
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
		cache.shortcut.select.colAlias= headItemCols.models[0].get('alias');
		cache.shortcut.select.rowAlias= headItemRows.models[modelIndex].get('alias');
		selectModel.set('tempPosi', {
			initColIndex: 0,
			initRowIndex: modelIndex,
			mouseColIndex: 'MAX',
			mouseRowIndex: modelIndex
		});
	};
	return selectCellCols;
});