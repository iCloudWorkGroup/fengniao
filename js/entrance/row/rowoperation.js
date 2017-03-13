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
		rowPropOper: function(index, prop,value,fn) {
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
				len, i;

			props = prop.split('.');
			if (props.length > 1) {
				childProp = props[1];
			}
			parentProp = props[0];

			//维护行对象operProp属性
			headRowModel = headItemRows.models[index];
			headRowProp = headRowModel.get('operProp');
			defaultProp = (new Cell()).toJSON();

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
			cellList = cells.getCellByTransverse(index, 0, index, headItemCols.length - 1);
			len = cellList.length;
			i = 0;
			for (; i < len; i++) {
				if (cellList[i].get('occupy').y.length === 1) {
					cellList[i].set(prop, value);
					if (typeof fn === 'function') {
						fn(cellList[i]);
					}
				}
			}
			startColIndex = 0;
			endColIndex = headItemCols.length - 1;

			i = startColIndex;
			currentStrandX = cache.CellsPosition.strandX;
			for (; i < endColIndex + 1; i++) {
				rowAlias = headItemRows.models[index].get('alias');
				colAlias = headItemCols.models[i].get('alias');
				if (currentStrandX[colAlias] === undefined ||
					currentStrandX[colAlias][rowAlias] === undefined) {
					cellModel = cells.createCellModel(i, index);
					cellModel.set(prop, value);
				}
			}
		},
	};
});