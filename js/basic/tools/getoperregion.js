'use strict';
define(function(require) {
	var binary = require('basic/util/binary'),
		analysisLabel = require('basic/tools/analysislabel'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		selects = require('collections/selectRegion'),
		getOperRegion;
	/**
	 * 获取操作区域,以及发送区域
	 * @param  {array/string} label 标签
	 * @return {object} 索引对象
	 */
	getOperRegion = function(label) {
		var select,
			region,
			startRowIndex,
			startColIndex,
			endRowIndex,
			endColIndex,
			startRowSort,
			startColSort,
			endRowSort,
			endColSort,
			headItemColList = headItemCols.models,
			headItemRowList = headItemRows.models;

		if (!label) {
			select = selects.getModelByType('selected');
			startColIndex = headItemCols.getIndexByAlias(select.get('wholePosi').startX);
			endColIndex = headItemCols.getIndexByAlias(select.get('wholePosi').endX);
			startRowIndex = headItemRows.getIndexByAlias(select.get('wholePosi').startY);
			endRowIndex = headItemRows.getIndexByAlias(select.get('wholePosi').endY);

			startColSort = headItemColList[startColIndex].get('sort');
			startRowSort = headItemRowList[startRowIndex].get('sort');
			if (endRowIndex === 'MAX') {
				endRowSort = -1;
			} else {
				endRowSort = headItemRowList[endRowIndex].get('sort');
			}
			if (endColIndex === 'MAX') {
				endColSort = -1;
			} else {
				endColSort = headItemColList[endColIndex].get('sort');
			}
		} else {
			region = analysisLabel(label);
			startColSort = region.startColSort;
			startRowSort = region.startRowSort;
			endRowSort = region.endRowSort;
			endColSort = region.endColSort;

			startColIndex = binary.indexAttrBinary(startColSort, headItemColList, 'sort');
			startRowIndex = binary.indexAttrBinary(startRowSort, headItemRowList, 'sort');
			if (endColSort !== -1) {
				endColIndex = binary.indexAttrBinary(endColSort, headItemColList, 'sort');
			} else {
				endColIndex = 'MAX';
			}
			if (endRowSort !== -1) {
				endRowIndex = binary.indexAttrBinary(endRowSort, headItemRowList, 'sort');
			} else {
				endRowIndex = 'MAX';
			}

			//备注：excel暂时只由顶端起始向下加载，所以只判断结尾坐标是否加载
			//开始坐标，由调用方法进行判断，开始坐标未加载，不进行内部操作，只向后台发送请求
			if (endRowIndex === -1) {
				endRowIndex = headItemRows.length - 1;
			}
			if (endColIndex === -1) {
				endColIndex = headItemCols.length - 1;
			}
		}

		return {
			sendRegion: {
				startCol: startColSort,
				endCol: endColSort,
				startRow: startRowSort,
				endRow: endRowSort
			},
			operRegion: {
				startColIndex: startColIndex,
				startRowIndex: startRowIndex,
				endRowIndex: endRowIndex,
				endColIndex: endColIndex
			}
		};



	};
	return getOperRegion;
});