'use strict';
define(function(require) {
	var selectRegions = require('collections/selectRegion'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		getSelectRegion;

	/**
	 * 获取选中区域信息
	 * @param  {string} sheetId sheetId
	 * @return {object} 
	 */
	getSelectRegion = function(sheetId) {
		var result = {},
			cols = [],
			rows = [],
			selectRegion,
			startColAlias,
			startRowAlias,
			endColAlias,
			endRowAlias,
			startColIndex,
			startRowIndex,
			endColIndex,
			endRowIndex, i;

		selectRegion = selectRegions.findWhere({
			'selectType': 'selected'
		});
		startColAlias = selectRegion.get('wholePosi').startX;
		startRowAlias = selectRegion.get('wholePosi').startY;
		endColAlias = selectRegion.get('wholePosi').endX;
		endRowAlias = selectRegion.get('wholePosi').endY;

		startRowIndex = headItemRows.getIndexByAlias(startRowAlias);
		startColIndex = headItemCols.getIndexByAlias(startColAlias);

		endRowIndex = headItemRows.getIndexByAlias(endRowAlias);
		endColIndex = headItemCols.getIndexByAlias(endColAlias);
		

		for (i = startColIndex; i < endColIndex + 1; i++) {
			cols.push(headItemCols.models[i].get('displayName'));
		}
		for (i = startRowIndex; i < endRowIndex + 1; i++) {
			rows.push(headItemRows.models[i].get('displayName'));
		}
		result.col = cols;
		result.row = rows;
		return result;
	};
	return getSelectRegion;
});