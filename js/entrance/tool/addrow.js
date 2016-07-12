'use strict';
define(function(require) {

	var Backbone = require('lib/backbone'),
		config = require('spreadsheet/config'),
		cache = require('basic/tools/cache'),
		headItemRows = require('collections/headItemRow'),
		cells = require('collections/cells'),
		selectRegions = require('collections/selectRegion'),
		siderLineRows = require('collections/siderLineRow'),
		send = require('basic/tools/send');

	return {
		/**
		 * 插入行操作
		 * @param {string} sheetId sheetId
		 * @param {string} label   行标识号,如果为undefined,则按照当前选中区域进行操作
		 */
		addRow: function(sheetId, label) {
			var index = -1,
				alias,
				select,
				clip,
				box;
			if (label !== undefined) {
				index = headItemRows.getIndexByDisplayname(label);
			} else {
				select = selectRegions.getModelByType('operation')[0];
				box = select.get('wholePosi');
				if (box.endY !== 'max') {
					index = headItemRows.getIndexByAlias(box.startY);
				}
			}
			clip = selectRegions.getModelByType('clip')[0];
			if (clip !== undefined) {
				cache.clipState = 'null';
				clip.destroy();
			}
			if (index === -1) {
				return;
			}
			alias = headItemRows.models[index].get('alias');

			this._adaptHeadRowItem(index);
			this._adaptSelectRegion(index);
			this._adaptCells(index);
			this._frozenHandle(index);

			send.PackAjax({
				url: 'cells.htm?m=rows_insert',
				data: JSON.stringify({
					excelId: window.SPREADSHEET_AUTHENTIC_KEY,
					sheetId: '1',
					rowAlias: alias,
				}),
			});
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
				i = index + 1;
			currentRowModel = headItemRows.models[index];

			headItemRows.add({
				sort: currentRowModel.get('sort'),
				alias: cache.aliasGenerator(),
				top: currentRowModel.get('top'),
				displayName: currentRowModel.get('displayName'),
			}, {
				at: index
			});

			height = config.User.cellHeight;
			len = headItemRows.length;
			for (; i < len; i++) {
				currentRowModel = headItemRows.models[i];
				top = currentRowModel.get('top') + height;
				sort = currentRowModel.get('sort') + 1;
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
			select = selectRegions.getModelByType('operation')[0];
			startRowAlias = select.get('wholePosi').startY;
			endRowAlias = select.get('wholePosi').endY;
			startRowIndex = headItemRows.getIndexByAlias(startRowAlias);
			endRowIndex = headItemRows.getIndexByAlias(endRowAlias);

			if (endRowIndex < index) {
				return;
			}
			if (startRowIndex >= index) {
				top = select.get('physicsPosi').top;
				top += config.User.cellHeight;
				select.set('physicsPosi.top', top);
				siderLineRows.models[0].set('top', top);
				startRowIndex++;
			}
			if (startRowIndex < index && endRowIndex >= index) {
				height = select.get('physicsBox').height;
				height += config.User.cellHeight;
				select.set('physicsBox.height', height);
				siderLineRows.models[0].set('height', height);
				headItemRows.models[index].set('activeState', true);
			//	endRowIndex++;
			}

		},
		/**
		 * 调整单元格
		 * @param  {number} index 索引 
		 */
		_adaptCells: function(index) {
			var height,
				aliasArray,
				insertAlias,
				rowAlias,
				cellColAliasArray,
				cellRowAlias,
				cellColAlias,
				startIndex,
				cellsList,
				cellIndex,
				aliasLen,
				len, i = 0,
				j,
				tempCell,
				top;

			cellsList = cells.getCellsByRowIndex(index + 1,
				headItemRows.length - 1);
			len = cellsList.length;
			for (; i < len; i++) {
				tempCell = cellsList[i];
				aliasArray = tempCell.get('occupy').y;
				rowAlias = aliasArray[0];
				startIndex = headItemRows.getIndexByAlias(rowAlias);

				if (startIndex >= index) {
					top = tempCell.get('physicsBox').top;
					top += config.User.cellHeight;
					tempCell.set('physicsBox.top', top);
				} else {
					height = tempCell.get('physicsBox').height;
					height += config.User.cellHeight;
					tempCell.set('physicsBox.height', height);
					//更新 cache.CellsPosition
					cellColAlias = tempCell.get('occupy').x[0];
					cellColAliasArray = tempCell.get('occupy').x;
					cellRowAlias = cellColAliasArray[0];
					insertAlias = headItemRows.models[index].get('alias');
					aliasLen = cellColAliasArray.length;
					cellIndex = cache.CellsPosition.strandX[cellColAlias][cellRowAlias];
					for (j = 0; j < aliasLen; j++) {
						cache.cachePosition(insertAlias,
							cellColAliasArray[j],
							cellIndex);
					}
					//更新 cell.occupy
					aliasArray.splice(index - startIndex, 0, insertAlias);
					tempCell.set('occupy.y', aliasArray);
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

				if (userViewIndex > index) {
					userViewAlias = headItemRows.models[index].get('alias');
					cache.UserView.rowAlias = userViewAlias;
				}
				if (index + 1 === frozenIndex) {
					frozenAlias = headItemRows.models[index].get('alias');
					cache.TempProp.rowAlias = frozenAlias;
				}
				Backbone.trigger('event:bodyContainer:executiveFrozen');
			}
		}
	};
});