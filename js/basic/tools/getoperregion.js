'use strict';
define(function(require) {
	var binary = require('basic/util/binary'),
		parseLabel = require('basic/tools/parselabel'),
		cols = require('collections/headItemCol'),
		rows = require('collections/headItemRow'),
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
			wholePosi,
			startRowIndex,
			startColIndex,
			endRowIndex,
			endColIndex,
			startRowSort,
			startColSort,
			endRowSort,
			endColSort,
			colList = cols.models,
			rowList = rows.models;

		if (!label) {
			select = selects.getModelByType('selected');
			wholePosi = select.get('wholePosi');
			startColIndex = cols.getIndexByAlias(wholePosi.startX);
			endColIndex = cols.getIndexByAlias(wholePosi.endX);
			startRowIndex = rows.getIndexByAlias(wholePosi.startY);
			endRowIndex = rows.getIndexByAlias(wholePosi.endY);

			startColSort = colList[startColIndex].get('sort');
			startRowSort = rowList[startRowIndex].get('sort');

			if (endRowIndex === 'MAX') {
				endRowSort = -1;
			} else {
				endRowSort = rowList[endRowIndex].get('sort');
			}
			if (endColIndex === 'MAX') {
				endColSort = -1;
			} else {
				endColSort = colList[endColIndex].get('sort');
			}
		} else {
			region = parseLabel(label);
			startColSort = region.startColSort;
			startRowSort = region.startRowSort;
			endRowSort = region.endRowSort;
			endColSort = region.endColSort;

			startColIndex = binary.indexAttrBinary(startColSort, colList, 'sort');
			startRowIndex = binary.indexAttrBinary(startRowSort, rowList, 'sort');

			if (endColSort !== -1) {
				endColIndex = binary.indexAttrBinary(endColSort, colList, 'sort');
			} else {
				endColIndex = 'MAX';
			}
			if (endRowSort !== -1) {
				endRowIndex = binary.indexAttrBinary(endRowSort, rowList, 'sort');
			} else {
				endRowIndex = 'MAX';
			}

			//备注：excel暂时只由顶端起始向下加载，所以只判断结尾坐标是否加载
			//开始坐标，由调用方法进行判断，开始坐标未加载，不进行内部操作，只向后台发送请求
			if (endRowIndex === -1) {
				endRowIndex = rows.length - 1;
			}
			if (endColIndex === -1) {
				endColIndex = cols.length - 1;
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