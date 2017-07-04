'use strict';
define(function(require) {
	var Cell = require('models/cell'),
		cache = require('basic/tools/cache'),
		binary = require('basic/util/binary'),
		headItemRows = require('collections/headItemRow'),
		headItemCols = require('collections/headItemCol'),
		cells = require('collections/cells');
	return {
		/**
		 * 整列设置单元格属性
		 * @param  {number} index 行索引
		 * @param  {string} prop  需要修改属性,二级属性设置,例:'content.size'
		 * @param  {string} value 修改值
		 */
		colPropOper: function(index, prop, value, fn) {
			var headItemColList,
				headItemRowList,
				parentProp,
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
				props, len, i;

			if (index === -1) {
				return;
			}
			props = prop.split('.');
			if (props.length > 1) {
				childProp = props[1];
			}
			parentProp = props[0];

			//维护行对象operProp属性
			headColModel = headItemCols.models[index];
			headColProp = headColModel.toJSON().operProp;

			defaultProp = (new Cell()).toJSON();

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
			headItemColList = headItemCols.models;
			headItemRowList = headItemRows.models;

			operAlias = headItemRowList[index].get('alias');
			//获取显示区域
			startRowIndex = binary.indexModelBinary(cache.viewRegion.top, headItemRowList, 'top', 'height');
			endRowIndex = binary.indexModelBinary(cache.viewRegion.bottom, headItemRowList, 'top', 'height');

			currentStrandX = cache.CellsPosition.strandX;
			existCellList = cells.getCellByTransverse(0, index, headItemRows.length - 1, index);
			len = existCellList.length;
			for (i = 0; i < len; i++) {
				existCellList[i].set(prop, value);
				if (typeof fn === 'function') {
					fn(existCellList[i]);
				}
			}
			for (i = startRowIndex; i < endRowIndex + 1; i++) {
				rowAlias = headItemRowList[i].get('alias');
				if (currentStrandX[operAlias] === undefined ||
					currentStrandX[operAlias][rowAlias] === undefined) {
					cellModel = cells.createCellModel(index, i);
					cellModel.set(prop, value);
				}
			}
		},
	};
});