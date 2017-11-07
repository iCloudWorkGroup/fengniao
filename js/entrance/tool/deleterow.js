define(function(require) {
	'use strict';
	var Backbone = require('lib/backbone'),
		observerPattern = require('basic/util/observer.pattern'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		headItemRows = require('collections/headItemRow'),
		cells = require('collections/cells'),
		getOperRegion = require('basic/tools/getoperregion'),
		selectRegions = require('collections/selectRegion'),
		siderLineRows = require('collections/siderLineRow'),
		send = require('basic/tools/send'),
		deleteRow;

	deleteRow = {
		/**
		 * 删除行操作
		 * @param {string} sheetId sheetId
		 * @param {string} label   行标识号,如果为undefined,则按照当前选中区域进行操作
		 */
		deleteRow: function(sheetId, arrOpr) {
			var clip,
				region,
				operRegion,
				sendRegion,
				index,
				posi,
				height;

			clip = selectRegions.getModelByType('clip');
			if (clip !== undefined) {
				cache.clipState = 'null';
				clip.destroy();
			}
			if (cache.protectState) {
				Backbone.trigger('event:showMsgBar:show', '保护状态，不能进行该操作');
				return;
			}
			if (cache.TempProp.isFrozen === true) {
				return;
			}
			region = getOperRegion(arrOpr);
			operRegion = region.operRegion;
			sendRegion = region.sendRegion;

			if (operRegion.endRowIndex === 'MAX' && arrOpr === undefined) {
				return;
			}

			if (operRegion.startRowIndex === -1) {
				sendData();
				return;
			}
			index = operRegion.startRowIndex;
			this.publish('validate', 'deleteRowPublish', headItemRows.models[index].get('alias'), index);

			posi = headItemRows.models[index].get('top');
			height = headItemRows.models[index].get('height');
			this._adaptCells(index);
			this._adaptSelectRegion(index);
			this._adaptHeadRowItem(index);

			Backbone.trigger('event:cellsContainer:adaptHeight');
			Backbone.trigger('event:rowsAllHeadContainer:adaptHeight');
			Backbone.trigger('event:mainContainer:adaptRowHeightChange', posi, -height - 1);
			sendData();

			function sendData() {
				send.PackAjax({
					url: config.url.row.reduce,
					data: JSON.stringify({
						row: sendRegion.startRow,
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

			cellsList = cells.getCellByRow(index,
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
		}
	};
	observerPattern.buildPublisher(deleteRow);
	return deleteRow;
});