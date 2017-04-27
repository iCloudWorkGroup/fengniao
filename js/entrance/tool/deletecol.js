'use strict';
define(function(require) {
	var Backbone = require('lib/backbone'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		headItemRows = require('collections/headItemRow'),
		headItemCols = require('collections/headItemCol'),
		getOperRegion = require('basic/tools/getoperregion'),
		aliasBuild = require('basic/tools/buildalias'),
		cells = require('collections/cells'),
		selectRegions = require('collections/selectRegion'),
		siderLineCols = require('collections/siderLineCol'),
		send = require('basic/tools/send');

	return {
		/**
		 * 删除列操作
		 * @param {string} sheetId sheetId
		 * @param {string} label   行标识号,如果为undefined,则按照当前选中区域进行操作
		 */
		deleteCol: function(sheetId, label) {
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

			if (operRegion.endRowIndex === 'MAX') {
				return;
			}

			if (operRegion.startRowIndex === -1) {
				sendData();
				return;
			}
			index = operRegion.startColIndex;
			//未完成动态加载功能，先用方法，处理边界值问题
			this._addColItem();
			this._adaptCells(index);
			this._adaptSelectRegion(index);
			this._frozenHandle(index);
			this._adaptHeadColItem(index);

			
			if (cache.TempProp.isFrozen === true) {
				Backbone.trigger('event:bodyContainer:executiveFrozen');
			}
			sendData();
			function sendData(){
				send.PackAjax({
					url: config.url.col.reduce,
					data: JSON.stringify({
						col: sendRegion.startSortX,
					}),
				});
			}
		},
		/**
		 * 尾部补充列
		 */
		_addColItem: function() {
			var index = headItemCols.length,
				width = config.User.cellWidth,
				previousModel = headItemCols.models[index - 1];
				
			headItemCols.add({
				sort: previousModel.get('sort') + 1,
				alias: cache.aliasGenerator('col'),
				left: previousModel.get('left') + previousModel.get('width') + 1
			});
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
				i = index;
			currentColModel = headItemCols.models[index];
			width = currentColModel.get('width');
			headItemCols.remove(currentColModel);
			currentColModel.destroy();

			len = headItemCols.length;
			for (; i < len; i++) {
				currentColModel = headItemCols.models[i];
				left = currentColModel.get('left') - width - 1;
				sort = currentColModel.get('sort') - 1;
				currentColModel.set('left', left);
				currentColModel.set('displayName', aliasBuild.buildColAlias(i));
				currentColModel.set('sort', sort);
			}
		},
		/**
		 * 调整选中区域
		 * @param  {number} index 索引值
		 */
		_adaptSelectRegion: function(index) {
			var select,
				startColAlias,
				endColAlias,
				startColIndex,
				endColIndex,
				width,
				left;

			select = selectRegions.getModelByType('selected');
			startColAlias = select.get('wholePosi').startX;
			endColAlias = select.get('wholePosi').endX;
			startColIndex = headItemCols.getIndexByAlias(startColAlias);
			endColIndex = headItemCols.getIndexByAlias(endColAlias);
			left = select.get('physicsBox').left;
			width = select.get('physicsBox').width;

			if (endColIndex < index) {
				return;
			}
			if (startColIndex === index) {
				if (endColIndex === startColIndex) {
					width = headItemCols.models[index + 1].get('width');
					endColAlias = headItemCols.models[index + 1].get('alias');
					select.set('wholePosi.endX', endColAlias);
					select.set('wholePosi.startX', endColAlias);
					headItemCols.models[index + 1].set('activeState', true);
				} else {
					width = width - headItemCols.models[index].get('width') - 1;
				}
				startColAlias = headItemCols.models[index + 1].get('alias');
				select.set('wholePosi.startX', startColAlias);
				select.set('physicsBox.width', width);

			}
			if (endColIndex !== startColIndex && endColIndex === index) {
				width = select.get('physicsBox').width;
				width = width - headItemCols.models[index].get('width') - 1;
				endColAlias = headItemCols.models[index - 1].get('alias');
				select.set('wholePosi.endX', endColAlias);
			}
			if (startColIndex < index && endColIndex > index) {
				width = select.get('physicsBox').width;
				width = width - headItemCols.models[index].get('width') - 1;
				select.set('physicsBox.width', width);
			}

			if (startColIndex > index) {
				left = left - headItemCols.models[index].get('width') - 1;
				select.set('physicsBox.left', left);
			}
			siderLineCols.models[0].set('width', width);
		},
		/**
		 * 调整单元格
		 * @param  {number} index 索引 
		 */
		_adaptCells: function(index) {
			var width,
				left,
				deleteAlias,
				colAlias,
				aliasRowArray,
				aliasColArray,
				startIndex,
				cellsList,
				aliasLen,
				len, i = 0,
				j,
				tempCell;

			cellsList = cells.getCellsByColIndex(index,
				headItemCols.length - 1);

			deleteAlias = headItemCols.models[index].get('alias');

			len = cellsList.length;
			for (; i < len; i++) {
				tempCell = cellsList[i];
				aliasRowArray = tempCell.get('occupy').y;
				aliasColArray = tempCell.get('occupy').x;
				aliasLen = aliasRowArray.length;
				colAlias = aliasColArray[0];

				startIndex = headItemCols.getIndexByAlias(colAlias);

				if (startIndex === index && aliasColArray.length === 1) {
					tempCell.set('isDestroy', true);

				} else if (startIndex <= index) {

					width = tempCell.get('physicsBox').width;
					width -= headItemCols.models[index].get('width');
					tempCell.set('physicsBox.width', width - 1);
					aliasColArray.splice(index - startIndex, 1);
					tempCell.set('occupy.x', aliasColArray);

				} else if (startIndex > index) {
					left = tempCell.get('physicsBox').left;
					left = left - headItemCols.models[index].get('width') -1;
					tempCell.set('physicsBox.left', left);
				}
				for (j = 0; j < aliasLen; j++) {
					cache.deletePosi(aliasRowArray[j], deleteAlias);
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

				if (userViewIndex === index) {
					cache.UserView.colAlias = headItemCols.models[index + 1].get('alias');
				}
				if (frozenIndex === index) {
					if (index === 0) {
						cache.TempProp.colAlias = headItemCols.models[1].get('alias');
					} else {
						cache.TempProp.colAlias = headItemCols.models[index + 1].get('alias');
					}
				}
			}
		}
	};
});