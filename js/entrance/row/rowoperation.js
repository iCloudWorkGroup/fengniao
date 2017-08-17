'use strict';
define(function(require) {
	var Cell = require('models/cell'),
		cache = require('basic/tools/cache'),
		headItemRows = require('collections/headItemRow'),
		headItemCols = require('collections/headItemCol'),
		cells = require('collections/cells');

	return {
		/**
		 * 整行设置单元格属性
		 * @param  {number} index 行索引
		 * @param  {string} prop  需要修改属性,二级属性设置,例:'content.size'
		 * @param  {string} value 修改值
		 */
		rowPropOper: function(start, end, prop, value, fn) {
			var parentProp,
				childProp,
				headRowModel,
				headRowProp,
				defaultProp,
				startColIndex,
				endColIndex,
				rowAlias,
				colAlias,
				cellList,
				cellModel,
				currentStrandX,
				props,
				len, colLen, i, j;

			props = prop.split('.');
			if (props.length > 1) {
				childProp = props[1];
			}
			parentProp = props[0];
			defaultProp = (new Cell()).toJSON();
			colLen = headItemRows.length;
			currentStrandX = cache.CellsPosition.strandX;

			for (i = start; i < end + 1; i++) {
				//维护行对象operProp属性
				headRowModel = headItemRows.models[i];
				headRowProp = headRowModel.get('operProp');

				if (headRowProp[parentProp] !== undefined &&
					headRowProp[parentProp][childProp] !== undefined) {
					if (defaultProp[parentProp][childProp] === value) {
						delete headRowProp[parentProp][childProp];
						if (!Object.getOwnPropertyNames(headRowProp[parentProp]).length) {
							delete headRowProp[parentProp];
						}
					} else {
						headRowProp[parentProp][childProp] = value;
					}
				} else {
					if (defaultProp[parentProp][childProp] !== value) {
						if (!headRowProp[parentProp]) {
							headRowProp[parentProp] = {};
						}
						headRowProp[parentProp][childProp] = value;
					}
				}
				headRowModel.set('operProp', headRowProp);
				cellList = cells.getCellByTransverse(i, 0, i, headItemCols.length - 1);
				len = cellList.length;
				for (j = 0; j < len; j++) {
					if (cellList[j].get('occupy').y.length === 1) {
						cellList[j].set(prop, value);
						if (typeof fn === 'function') {
							fn(cellList[j]);
						}
					}
				}
				startColIndex = 0;
				endColIndex = headItemCols.length - 1;

				for (j = startColIndex; j < endColIndex + 1; j++) {
					rowAlias = headItemRows.models[i].get('alias');
					colAlias = headItemCols.models[j].get('alias');
					if (!currentStrandX[colAlias] ||
						currentStrandX[colAlias][rowAlias] === undefined) {
						cellModel = cells.createCellModel(j, i);
						cellModel.set(prop, value);
					}
				}
			}
		},
	};
});