'use strict';
define(function(require) {
	var send = require('basic/tools/send'),
		config = require('spreadsheet/config'),
		selectRegions = require('collections/selectRegion'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		siderLineCols = require('collections/siderLineCol'),
		Backbone = require('lib/backbone'),
		cells = require('collections/cells'),
		cache = require('basic/tools/cache'),
		getOperRegion = require('basic/tools/getoperregion');

	return {
		hide: function(sheetId, label) {
			var clip,
				region,
				colindex,
				colSort,
				adjustWidth,
				headItemColList,
				len;

			clip = selectRegions.getModelByType('clip');
			if (clip !== undefined) {
				cache.clipState = 'null';
				clip.destroy();
			}
			if (cache.TempProp.isFrozen) {
				return;
			}
			region = getOperRegion(label);
			if (region.operRegion.endRowIndex !== 'MAX') {
				return;
			}

			headItemColList = headItemCols.models;
			len = headItemColList.length;

			colindex = region.operRegion.startColIndex;
			colSort = region.sendRegion.startColSort;
			adjustWidth = headItemColList[colindex].get('width');

			//不能进行全部隐藏
			if (headItemColList[len - 1].get('left') === 0 ||
				(headItemColList[len - 1].get('left') === adjustWidth + 1 &&
					headItemColList[len - 1].get('hidden'))
			) {
				return;
			}


			this._adjustHideHeadItemCols(colindex, adjustWidth);
			this._adjustHideCells(colindex, adjustWidth);
			this._adjustHideSelectRegion(colindex, adjustWidth);
			Backbone.trigger('event:cellsContainer:adaptWidth');

			send.PackAjax({
				url: config.url.col.hide,
				data: JSON.stringify({
					sheetId: '1',
					col: headItemColList[colindex].get('sort')
				})
			});

		},
		_adjustHideCells: function(index) {
			var cellList,
				tempCell,
				colAliasList,
				currentWidth,
				width,
				alias,
				left,
				i, len;
			cellList = cells.getCellByVertical(index, 0, 'MAX', 'MAX');
			alias = headItemCols.models[index].get('alias');
			width = headItemCols.models[index].get('originalWidth');
			len = cellList.length;
			for (i = 0; i < len; i++) {
				tempCell = cellList[i];
				colAliasList = tempCell.get('occupy').x;
				if (colAliasList.length === 1) {
					if (colAliasList[0] === alias) {
						tempCell.set('physicsBox.width', 0);
						tempCell.set('hidden', true);
					} else {
						left = tempCell.get('physicsBox').left;
						tempCell.set('physicsBox.left', left - width - 1);
					}
				} else {
					if (colAliasList.indexOf(alias) !== -1) {
						currentWidth = tempCell.get('physicsBox').width;
						if (currentWidth === width) {
							tempCell.set('physicsBox.width', 0);
							tempCell.set('hidden', true);
						} else {
							tempCell.set('physicsBox.width', currentWidth - width - 1);
						}
					} else {
						left = tempCell.get('physicsBox').left;
						tempCell.set('physicsBox.left', left - width - 1);
					}

				}
			}
		},
		_adjustHideSelectRegion: function(index) {
			var headItemColList = headItemCols.models,
				headItemRowList = headItemRows.models,
				colLen = headItemColList.length,
				rowLen = headItemRowList.length,
				headItemModel,
				lastHeadItemLeft,
				select,
				colAlias,
				rowStartAlias,
				width,
				height,
				left, i;

			select = selectRegions.getModelByType('selected');
			lastHeadItemLeft = headItemColList[colLen - 1].get('left');
			left = headItemColList[index].get('left');
			//处理只剩一列情况
			if (left < lastHeadItemLeft) { //最后一列隐藏
				i = index + 1;
				while (headItemColList[i].get('hidden')) {
					i++;
				}
			} else {
				i = index - 1;
				while (i > -1 && headItemColList[i].get('hidden')) {
					i--;
				}
			}
			if (i === -1) {
				i = index + 1;
				while (headItemColList[i].get('hidden')) {
					i++;
				}
			}
			headItemModel = headItemColList[i];
			headItemModel.set('activeState', true);
			colAlias = headItemModel.get('alias');
			rowStartAlias = headItemRowList[0].get('alias');
			height = headItemRowList[rowLen - 1].get('top') + headItemRowList[rowLen - 1].get('height');
			width = headItemModel.get('width');
			left = headItemModel.get('left');

			select.set('tempPosi', {
				initColIndex: i,
				initRowIndex: 0,
				mouseColIndex: i,
				mouseRowIndex: 'MAX'
			});
		},
		_adjustHideHeadItemCols: function(index) {
			var headItemColList = headItemCols.models,
				len = headItemColList.length,
				lastHeadItemLeft,
				width,
				left,
				i;
			if (index > 0) {
				headItemColList[index - 1].set('isRightAjacentHide', true);
			}
			width = headItemColList[index].get('width');
			headItemColList[index].set('hidden', true);
			headItemColList[index].set('width', 0);
			headItemColList[index].set('activeState', false);
			left = headItemColList[index].get('left');
			lastHeadItemLeft = headItemColList[len - 1].get('left');

			if (index < len - 1) {
				left = headItemColList[index + 1].get('left');
				headItemColList[index + 1].set('left', left - width - 1);
				headItemColList[index + 1].set('isLeftAjacentHide', true);
			}
			for (i = index + 2; i < len; i++) {
				left = headItemColList[i].get('left');
				headItemColList[i].set('left', left - width - 1);
			}
		},
		cancelHide: function(sheetId) {
			var headItemColList = headItemCols.models,
				len = headItemColList.length,
				hidden,
				cellList,
				cellLen,
				cellWidth,
				cellLeft,
				headItemLeft,
				headItemAlias,
				moveWidth = 0, //取消隐藏时，单元格，列对象，向右移动宽度
				width,
				i = 0,
				j;

			if (cache.TempProp.isFrozen) {
				return;
			}
			clip = selectRegions.getModelByType('clip');
			if (clip !== undefined) {
				cache.clipState = 'null';
				clip.destroy();
			}
			Backbone.trigger('event:restoreHideCellView');
			Backbone.trigger('event:restoreHideCols');

			for (; i < len; i++) {
				headItemAlias = headItemColList[i].get('alias');
				if (headItemColList[i].get('hidden')) {
					if (i > 0) {
						headItemColList[i - 1].set('isRightAjacentHide', false);
					}
					if (i < len - 1) {
						headItemColList[i + 1].set('isLeftAjacentHide', false);
					}
					width = headItemColList[i].get('originalWidth');
					//当前列单元格调整宽度
					cellList = cells.getCellByVertical(i, 0, i, 'MAX');
					cellLen = cellList.length;
					headItemColList[i].set('width', width);
					headItemLeft = headItemColList[i].get('left');
					headItemColList[i].set('left', headItemLeft + moveWidth);
					headItemColList[i].set('hidden', false);
					for (j = 0; j < cellLen; j++) {
						cellWidth = cellList[j].get('physicsBox').width;
						hidden = cellList[j].get('hidden');
						if (!hidden) {
							cellList[j].set('physicsBox.width', cellWidth + width + 1);
						} else {
							cellList[j].set('physicsBox.width', cellWidth + width);
							cellList[j].set('hidden', false);
						}
						if (headItemAlias === cellList[j].get('occupy').x[0]) {
							cellLeft = cellList[j].get('physicsBox').left;
							cellList[j].set('physicsBox.left', cellLeft + moveWidth);
						}
					}
					moveWidth += (width + 1);
				} else if (moveWidth !== 0) {
					//调整单元格left值
					cellList = cells.getCellByVertical(i, 0, i, 'MAX');
					cellLen = cellList.length;
					for (j = 0; j < cellLen; j++) {
						if (headItemAlias === cellList[j].get('occupy').x[0]) {
							cellLeft = cellList[j].get('physicsBox').left;
							cellList[j].set('physicsBox.left', cellLeft + moveWidth);
						}
					}
					//调整列的left值
					headItemLeft = headItemColList[i].get('left');
					headItemColList[i].set('left', headItemLeft + moveWidth);
				}
			}
			this._adjustCancelHideSelectRegion();
			Backbone.trigger('event:cellsContainer:adaptWidth');
			Backbone.trigger('event:colsAllHeadContainer:adaptWidth');
			send.PackAjax({
				sheetId: '1',
				url: config.url.col.show
			});

		},
		_adjustCancelHideSelectRegion: function() {
			var headItemColList = headItemCols.models,
				startColIndex,
				endColIndex,
				select,
				left,
				width = 0;
			select = selectRegions.getModelByType('selected');
			startColIndex = headItemCols.getIndexByAlias(select.get('wholePosi').startX);
			endColIndex = headItemCols.getIndexByAlias(select.get('wholePosi').endX);
			left = headItemColList[startColIndex].get('left');
			for (var i = startColIndex; i < endColIndex + 1; i++) {
				width += (headItemColList[i].get('width') + 1);
			}
			select.set('physicsBox.width', width - 1);
			select.set('physicsBox.left', left);
			siderLineCols.models[0].set('left', left);
			siderLineCols.models[0].set('width', width - 1);
		}
	};
});