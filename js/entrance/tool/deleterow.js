'use strict';
define(function(require) {
	var Backbone = require('lib/backbone'),
		cache = require('basic/tools/cache'),
		headItemRows = require('collections/headItemRow'),
		cells = require('collections/cells'),
		getOperRegion = require('basic/tools/getoperregion'),
		selectRegions = require('collections/selectRegion'),
		siderLineRows = require('collections/siderLineRow'),
		send = require('basic/tools/send');

	return {
		/**
		 * 删除行操作
		 * @param {string} sheetId sheetId
		 * @param {string} label   行标识号,如果为undefined,则按照当前选中区域进行操作
		 */
		deleteRow: function(sheetId, label) {
			var clip,
				region,
				operRegion,
				sendRegion,
				index;

			clip = selectRegions.getModelByType('clip');
			if (clip !== undefined) {
				cache.clipState = 'null';
				clip.destroy();
			}
			region = getOperRegion(label);
			operRegion = region.operRegion;
			sendRegion = region.sendRegion;

			if (operRegion.endColIndex === 'MAX') {
				return;
			}

			if (operRegion.startRowIndex === -1) {
				sendData();
				return;
			}
			index = operRegion.startRowIndex;
			this._adaptCells(index);
			this._adaptSelectRegion(index);
			this._frozenHandle(index);
			this._adaptHeadRowItem(index);

			if (cache.TempProp.isFrozen === true) {
				Backbone.trigger('event:bodyContainer:executiveFrozen');
			}
			sendData();
			Backbone.on('event:mainContainer:addBottom');

			function sendData() {
				send.PackAjax({
					url: 'cells.htm?m=rows_delete',
					data: JSON.stringify({
						rowSort: sendRegion.startSortY,
					}),
				});
			}
		},
		/**
		 * 调整行对象
		 * @param  {number} index 行索引值
		 */
		_adaptHeadRowItem: function(index) {
			var currentRowModel,
				height,
				sort,
				top,
				len,
				i = index;
			currentRowModel = headItemRows.models[index];
			height = currentRowModel.get('height');
			headItemRows.remove(currentRowModel);
			currentRowModel.destroy();

			len = headItemRows.length;
			for (; i < len; i++) {
				currentRowModel = headItemRows.models[i];
				top = currentRowModel.get('top') - height - 1;
				sort = currentRowModel.get('sort') - 1;
				currentRowModel.set('top', top);
				currentRowModel.set('displayName', (sort + 1).toString());
				currentRowModel.set('sort', sort);
			}
		},
		/**
		 * 调整选中区域
		 * @param  {number} index 索引值
		 */
		_adaptSelectRegion: function(index) {
			var select,
				startRowAlias,
				endRowAlias,
				startRowIndex,
				height,
				top,
				endRowIndex;
			select = selectRegions.getModelByType('selected');
			startRowAlias = select.get('wholePosi').startY;
			endRowAlias = select.get('wholePosi').endY;
			top = select.get('physicsBox').top;
			height = select.get('physicsBox').height;
			startRowIndex = headItemRows.getIndexByAlias(startRowAlias);
			endRowIndex = headItemRows.getIndexByAlias(endRowAlias);

			if (endRowIndex < index) {
				return;
			}
			if (startRowIndex === index) {
				if (endRowIndex === startRowIndex) {
					height = headItemRows.models[index + 1].get('height');
					endRowAlias = headItemRows.models[index + 1].get('alias');
					select.set('wholePosi.endY', endRowAlias);
					select.set('wholePosi.startY', endRowAlias);
					headItemRows.models[index + 1].set('activeState', true);
				} else {
					height = height - headItemRows.models[index].get('height') - 1;
				}
				startRowAlias = headItemRows.models[index + 1].get('alias');
				select.set('wholePosi.startY', startRowAlias);
				select.set('physicsBox.height', height);
			}
			if (endRowIndex !== startRowIndex && endRowIndex === index) {
				height = select.get('physicsBox').height;
				height = height - headItemRows.models[index].get('height') - 1;
				endRowAlias = headItemRows.models[index - 1].get('alias');
				select.set('wholePosi.endY', endRowAlias);
			}
			if (startRowIndex < index && endRowIndex > index) {
				height = select.get('physicsBox').height;
				height = height - headItemRows.models[index].get('height') - 1;
				select.set('physicsBox.height', height);
			}

			if (startRowIndex > index) {
				top = top - headItemRows.models[index].get('height') - 1;
				select.set('physicsBox.top', top);
			}
			siderLineRows.models[0].set('height', height);
		},
		/**
		 * 调整单元格
		 * @param  {number} index 索引 
		 */
		_adaptCells: function(index) {
			var height,
				deleteAlias,
				rowAlias,
				aliasRowArray,
				aliasColArray,
				startIndex,
				cellsList,
				aliasLen,
				len, i = 0,
				j,
				tempCell,
				top;

			cellsList = cells.getCellsByRowIndex(index,
				headItemRows.length - 1);

			deleteAlias = headItemRows.models[index].get('alias');
			len = cellsList.length;
			for (; i < len; i++) {
				tempCell = cellsList[i];
				aliasRowArray = tempCell.get('occupy').y;
				aliasColArray = tempCell.get('occupy').x;
				aliasLen = aliasColArray.length;
				rowAlias = aliasRowArray[0];
				startIndex = headItemRows.getIndexByAlias(rowAlias);

				if (startIndex === index && aliasRowArray.length === 1) {
					tempCell.set('isDestroy', true);
				} else if (startIndex <= index) {
					height = tempCell.get('physicsBox').height;
					height -= headItemRows.models[index].get('height');
					tempCell.set('physicsBox.height', height - 1);
					aliasRowArray.splice(index - startIndex, 1);
					tempCell.set('occupy.y', aliasRowArray);
				} else if (startIndex > index) {
					top = tempCell.get('physicsBox').top;
					top = top - headItemRows.models[index].get('height') - 1;
					tempCell.set('physicsBox.top', top);
				}
				for (j = 0; j < aliasLen; j++) {
					cache.deletePosi(deleteAlias, aliasColArray[j]);
				}
			}
		},
		/**
		 * 处理冻结状态下,插入行功能
		 * @param  {number} index 插入索引
		 */
		_frozenHandle: function(index) {
			var userViewAlias,
				userViewIndex,
				frozenAlias,
				frozenIndex;

			if (cache.TempProp.isFrozen === true) {
				userViewAlias = cache.UserView.rowAlias;
				frozenAlias = cache.TempProp.rowAlias;
				userViewIndex = headItemRows.getIndexByAlias(userViewAlias);
				frozenIndex = headItemRows.getIndexByAlias(frozenAlias);

				if (userViewIndex === index) {
					cache.UserView.rowAlias = headItemRows.models[index + 1].get('alias');
				}
				if (frozenIndex === index) {
					if (index === 0) {
						cache.TempProp.rowAlias = headItemRows.models[1].get('alias');
					} else {
						cache.TempProp.rowAlias = headItemRows.models[index + 1].get('alias');
					}
				}
			}
		}
	};
});