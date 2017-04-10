'use strict';
define(function(require) {

	var Backbone = require('lib/backbone'),
		config = require('spreadsheet/config'),
		cache = require('basic/tools/cache'),
		headItemCols = require('collections/headItemCol'),
		aliasBuild = require('basic/tools/buildalias'),
		getOperRegion = require('basic/tools/getoperregion'),
		cells = require('collections/cells'),
		selectRegions = require('collections/selectRegion'),
		siderLineCols = require('collections/siderLineCol'),
		send = require('basic/tools/send');

	return {
		/**
		 * 插入行操作
		 * @param {string} sheetId sheetId
		 * @param {string} label   行标识号,如果为undefined,则按照当前选中区域进行操作
		 */
		addCol: function(sheetId, label) {

			var clip,
				region,
				operRegion,
				sendRegion;

			clip = selectRegions.getModelByType('clip')[0];
			if (clip !== undefined) {
				cache.clipState = 'null';
				clip.destroy();
			}
			if (!this._isAbleAdd()) {
				return;
			}
			region = getOperRegion(label);
			operRegion = region.operRegion;
			sendRegion = region.sendRegion;


			if (operRegion.startColIndex === -1 || operRegion.startRowIndex === -1) {
				return;
			}

			this._adaptHeadColItem(operRegion.startColIndex);
			this._adaptSelectRegion(operRegion.startColIndex);
			this._adaptCells(operRegion.startColIndex);
			this._removeLastColItem();
			this._frozenHandle(operRegion.startColIndex);
			send.PackAjax({
				url: config.url.col.plus,
				data: JSON.stringify({
					col: sendRegion.startSortX,
				}),
			});
		},
		/**
		 * 判断是否能够添加列，不能进行插入列操作
		 * @return {Boolean} 是否能够进行插入列操作
		 */
		_isAbleAdd: function() {
			var index = headItemCols.length - 1,
				cellList;

			cellList = cells.getCellsByColIndex(index, index);
			if (cellList.length > 0) {
				return false;
			} else {
				return true;
			}
		},
		/**
		 * 删除最后一列
		 * @return {[type]} [description]
		 */
		_removeLastColItem: function() {
			var itemModel,
				index = headItemCols.length - 1;
			itemModel = headItemCols.models[index];
			headItemCols.remove(itemModel);
			itemModel.destroy();
		},
		/**
		 * 调整行对象
		 * @param  {number} index 行索引值
		 */
		_adaptHeadColItem: function(index) {
			var currentColModel,
				width,
				sort,
				left,
				len,
				i = index + 1;
			currentColModel = headItemCols.models[index];
			width = config.User.cellWidth;
			headItemCols.add({
				sort: currentColModel.get('sort'),
				alias: cache.aliasGenerator('col'),
				left: currentColModel.get('left'),
				width: width - 1,
				displayName: currentColModel.get('displayName'),
			}, {
				at: index
			});

			len = headItemCols.length;
			for (; i < len; i++) {
				currentColModel = headItemCols.models[i];
				left = currentColModel.get('left') + width;
				sort = currentColModel.get('sort') + 1;
				currentColModel.set('left', left);
				currentColModel.set('displayName', aliasBuild.buildColAlias(sort));
				currentColModel.set('sort', sort);
			}
		},
		/**
		 * 调整选中区域
		 * @param  {number} index 索引值
		 */
		_adaptSelectRegion: function(index) {
			var select,
				insertModel,
				startColAlias,
				endColAlias,
				startColIndex,
				endColIndex,
				lastIndex,
				width,
				left;

			select = selectRegions.getModelByType('operation')[0];

			startColAlias = select.get('wholePosi').startX;
			endColAlias = select.get('wholePosi').endX;
			startColIndex = headItemCols.getIndexByAlias(startColAlias);
			endColIndex = headItemCols.getIndexByAlias(endColAlias);

			insertModel = headItemCols.models[index];
			lastIndex = headItemCols.length - 1;

			if (endColIndex < index) {
				return;
			}
			//位于最后一列
			//ps:存在bug，后期修改
			if (lastIndex === endColIndex) {
				if (startColIndex === endColIndex) {
					left = insertModel.get('left');
					width = insertModel.get('width');
					startColAlias = insertModel.get('alias');
					select.set('physicsPosi.left', left);
					select.set('physicsBox.width', width);
					select.set('wholePosi.startX', startColAlias);
					select.set('wholePosi.endX', startColAlias);
					siderLineCols.models[0].set('left', left);
					siderLineCols.models[0].set('width', width);
					headItemCols.models[lastIndex - 1].set('activeState', true);
				} else {
					left = select.get('physicsPosi').left;
					left += config.User.cellWidth;
					width = select.get('physicsBox').width;
					width -= headItemCols.models[lastIndex].get('width');
					endColAlias = insertModel.get('alias');
					select.set('physicsPosi.left', left);
					select.set('physicsBox.width', width);
					endColAlias = headItemCols.models[endColIndex - 1].get('alias');
					select.set('wholePosi.endX', endColAlias);

					siderLineCols.models[0].set('left', left);
					siderLineCols.models[0].set('width', width);
				}
				return;
			}
			left = select.get('physicsPosi').left;
			left += config.User.cellWidth;
			select.set('physicsPosi.left', left);
			siderLineCols.models[0].set('left', left);
		},
		/**
		 * 调整单元格
		 * @param  {number} index 索引 
		 */
		_adaptCells: function(index) {
			var left,
				width,
				aliasArray,
				insertAlias,
				colAlias,
				cellRowAliasArray,
				cellRowAlias,
				cellColAlias,
				startIndex,
				cellsList,
				cellIndex,
				aliasLen,
				len, i = 0,
				j,
				tempCell;

			cellsList = cells.getCellsByColIndex(index + 1,
				headItemCols.length - 1);

			len = cellsList.length;
			for (; i < len; i++) {
				tempCell = cellsList[i];

				aliasArray = tempCell.get('occupy').x;
				colAlias = aliasArray[0];

				startIndex = headItemCols.getIndexByAlias(colAlias);

				if (startIndex >= index) {
					left = tempCell.get('physicsBox').left;
					left += config.User.cellWidth;
					tempCell.set('physicsBox.left', left);
				} else {
					width = tempCell.get('physicsBox').width;
					width += config.User.cellWidth;
					tempCell.set('physicsBox.width', width);

					//更新 cache.CellsPosition
					cellRowAliasArray = tempCell.get('occupy').y;
					cellColAlias = tempCell.get('occupy').x[0];
					cellRowAlias = cellRowAliasArray[0];
					insertAlias = headItemCols.models[index].get('alias');

					aliasLen = cellRowAliasArray.length;
					cellIndex = cache.CellsPosition.strandX[cellColAlias][cellRowAlias];
					for (j = 0; j < aliasLen; j++) {
						cache.cachePosition(cellRowAliasArray[j],
							insertAlias,
							cellIndex);
					}
					//更新 cell.occupy
					aliasArray.splice(index - startIndex, 0, insertAlias);
					tempCell.set('occupy.x', aliasArray);
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

				userViewAlias = cache.UserView.colAlias;
				frozenAlias = cache.TempProp.colAlias;
				userViewIndex = headItemCols.getIndexByAlias(userViewAlias);
				frozenIndex = headItemCols.getIndexByAlias(frozenAlias);

				if (userViewIndex > index) {
					userViewAlias = headItemCols.models[index].get('alias');
					cache.UserView.colAlias = userViewAlias;
				}
				if (index + 1 === frozenIndex) {
					frozenAlias = headItemCols.models[index].get('alias');
					cache.TempProp.colAlias = frozenAlias;
				}
				Backbone.trigger('event:bodyContainer:executiveFrozen');
			}
		}
	};
});