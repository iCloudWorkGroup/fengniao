'use strict';
define(function(require) {
	var Cell = require('models/cell'),
		cache = require('basic/tools/cache'),
		binary = require('basic/util/binary'),
		headItemRows = require('collections/headItemRow'),
		headItemCols = require('collections/headItemCol'),
		cells = require('collections/cells'),
		headItemColList = headItemCols.models,
		headItemRowList = headItemRows.models;

	return {
		/**
		 * 整列设置单元格属性
		 * @param  {number} index 行索引
		 * @param  {string} prop  需要修改属性,二级属性设置,例:'content.size'
		 * @param  {string} value 修改值
		 */
		colPropOper: function(start, end, prop, value, fn) {
			var parentProp,
				childProp,
				operAlias,
				rowAlias,
				headColModel,
				headColProp,
				defaultProp,
				startRowIndex,
				endRowIndex,
				cellModel,
				existCellList,
				currentStrandX,
				props, len, i, j, rowLen;

			props = prop.split('.');
			if (props.length > 1) {
				childProp = props[1];
			}
			parentProp = props[0];
			defaultProp = (new Cell()).toJSON();
			rowLen = headItemRows.length;

			for (i = start; i < end + 1; i++) {
				headColModel = headItemCols.models[i];
				headColProp = headColModel.toJSON().operProp;

				if (headColProp[parentProp] !== undefined &&
					headColProp[parentProp][childProp] !== undefined) {
					if (defaultProp[parentProp][childProp] === value) {
						delete headColProp[parentProp][childProp];
						if (!Object.getOwnPropertyNames(headColProp[parentProp]).length) {
							delete headColProp[parentProp];
						}
					} else {
						headColProp[parentProp][childProp] = value;
					}
				} else {
					if (defaultProp[parentProp][childProp] !== value) {
						if (!headColProp[parentProp]) {
							headColProp[parentProp] = {};
						}
						headColProp[parentProp][childProp] = value;
					}
				}
				headColModel.set('operProp', headColProp);

				operAlias = headItemColList[i].get('alias');
				//获取显示区域
				startRowIndex = binary.indexModelBinary(cache.viewRegion.top, headItemRowList, 'top', 'height');
				endRowIndex = binary.indexModelBinary(cache.viewRegion.bottom, headItemRowList, 'top', 'height');

				currentStrandX = cache.CellsPosition.strandX;
				existCellList = cells.getCellByTransverse(0, i, rowLen - 1, i);
				len = existCellList.length;
				for (j = 0; j < len; j++) {
					existCellList[j].set(prop, value);
					if (typeof fn === 'function') {
						fn(existCellList[j]);
					}
				}
				for (j = startRowIndex; j < endRowIndex + 1; j++) {
					rowAlias = headItemRowList[j].get('alias');
					if (currentStrandX[operAlias] === undefined ||
						currentStrandX[operAlias][rowAlias] === undefined) {
						cellModel = cells.createCellModel(i, j);
						cellModel.set(prop, value);
					}
				}
			}
		},
	};
});