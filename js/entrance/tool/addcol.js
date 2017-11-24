define(function(require) {
	'use strict';
	var _ = require('lib/underscore'),
		Backbone = require('lib/backbone'),
		config = require('spreadsheet/config'),
		cache = require('basic/tools/cache'),
		cols = require('collections/headItemCol'),
		rows = require('collections/headItemRow'),
		getDisplayName = require('basic/tools/getdisplayname'),
		getOperRegion = require('basic/tools/getoperregion'),
		cells = require('collections/cells'),
		selectRegions = require('collections/selectRegion'),
		siderLineCols = require('collections/siderLineCol'),
		send = require('basic/tools/send'),
		strandMap = require('basic/tools/strandmap'),
		colList = cols.models,
		rowList = rows.models;

	return {
		/**
		 * 插入行操作
		 * @param {string} sheetId sheetId
		 * @param {string} label   行标识号,如果为undefined,则按照当前选中区域进行操作
		 */
		add: function(sheetId, label) {
			var clip,
				region,
				operRegion,
				sendRegion;

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
			if (!this._isAbleAdd()) {
				return;
			}
			region = getOperRegion(label);
			operRegion = region.operRegion;
			sendRegion = region.sendRegion;

			if (operRegion.endColIndex === 'MAX') {
				return;
			}

			this._adaptHeadColItem(operRegion.startColIndex);
			this._adaptSelectRegion(operRegion.startColIndex);
			this._adaptCells(operRegion.startColIndex);
			this._removeLastColItem();
			// this._frozenHandle(operRegion.startColIndex);
			send.PackAjax({
				url: config.url.col.plus,
				data: JSON.stringify({
					sheetId: '1',
					col: sendRegion.startCol,
				}),
			});
		},
		/**
		 * 判断是否能够添加列，不能进行插入列操作
		 * @return {Boolean} 是否能够进行插入列操作
		 */
		_isAbleAdd: function() {
			var index = cols.length - 1,
				cellList;

			cellList = cells.getCellsByColIndex(index);
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
				index = cols.length - 1;
			itemModel = cols.models[index];
			cols.remove(itemModel);
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
			currentColModel = cols.models[index];
			width = config.User.cellWidth;
			cols.add({
				sort: currentColModel.get('sort'),
				alias: cache.aliasGenerator('col'),
				left: currentColModel.get('left'),
				width: width - 1,
				displayName: currentColModel.get('displayName'),
			}, {
				at: index
			});

			len = cols.length;
			for (; i < len; i++) {
				currentColModel = cols.models[i];
				left = currentColModel.get('left') + width;
				sort = currentColModel.get('sort') + 1;
				currentColModel.set('left', left);
				currentColModel.set('displayName', getDisplayName.getColDisplayName(sort));
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

			select = selectRegions.getModelByType('selected');

			startColAlias = select.get('wholePosi').startX;
			endColAlias = select.get('wholePosi').endX;
			startColIndex = cols.getIndexByAlias(startColAlias);
			endColIndex = cols.getIndexByAlias(endColAlias);

			insertModel = cols.models[index];
			lastIndex = cols.length - 1;

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
					select.set('physicsBox.left', left);
					select.set('physicsBox.width', width);
					select.set('wholePosi.startX', startColAlias);
					select.set('wholePosi.endX', startColAlias);
					siderLineCols.models[0].set('left', left);
					siderLineCols.models[0].set('width', width);
					cols.models[lastIndex - 1].set('activeState', true);
				} else {
					left = select.get('physicsBox').left;
					left += config.User.cellWidth;
					width = select.get('physicsBox').width;
					width -= cols.models[lastIndex].get('width');
					endColAlias = insertModel.get('alias');
					select.set('physicsBox.left', left);
					select.set('physicsBox.width', width);
					endColAlias = cols.models[endColIndex - 1].get('alias');
					select.set('wholePosi.endX', endColAlias);

					siderLineCols.models[0].set('left', left);
					siderLineCols.models[0].set('width', width);
				}
				return;
			}
			left = select.get('physicsBox').left;
			left += config.User.cellWidth;
			select.set('physicsBox.left', left);
			siderLineCols.models[0].set('left', left);
		},
		/**
		 * 调整单元格
		 * @param  {number} index 索引 
		 */
		_adaptCells: function(index) {
			var cellStrand = cache.CellsPosition.strandX,
				left,
				width,
				occupyCol,
				occupyRow,
				nextAlias,
				preAlias,
				insertAlias,
				insertCellIndex, //插入列，经过单元格的相对索引
				colAlias,
				rowAlias,
				changeCellList,
				currentCell,
				cellIndex,
				attributes,
				rule,
				len, len2, i, j;


			insertAlias = cols.models[index].get('alias');
			nextAlias = cols.models[index + 1].get('alias');
			preAlias = index > 0 ? cols.models[index - 1].get('alias') : null;

			changeCellList = cells.getCellsByColIndex(index + 1,
				cols.length - 1);

			for (i = 0, len = changeCellList.length; i < len; i++) {
				currentCell = changeCellList[i];
				occupyCol = currentCell.get('occupy').x;
				insertCellIndex = occupyCol.indexOf(nextAlias);

				if (insertCellIndex === -1 || insertCellIndex === 0) { //未经过单元格
					left = currentCell.get('physicsBox').left;
					left += config.User.cellWidth;
					currentCell.set('physicsBox.left', left);
				} else {
					occupyCol.splice(insertCellIndex, 0, insertAlias);
					width = currentCell.get('physicsBox').width;
					width += config.User.cellWidth;

					occupyRow = currentCell.get('occupy').y;
					cellIndex = cellStrand[nextAlias][occupyRow[0]];

					for (j = 0, len2 = occupyRow.length; j < len2; j++) {
						cache.cachePosition(occupyRow[j], insertAlias, cellIndex);
					}
					currentCell.set('physicsBox.width', width);
					currentCell.set('occupy.x', occupyCol);
				}
			}


			if (!preAlias) {
				return;
			}
			//克隆过程
			colAlias = colList[index - 1].get('alias');
			for (i = 0, len = rowList.length; i < len; i++) {
				rowAlias = rowList[i].get('alias');
				rule = strandMap.getPointRecord(colAlias, rowAlias);
				if (rule) {
					strandMap.addPointRecord(insertAlias, rowAlias, rule);
				}
				currentCell = cells.getCellByVertical(index - 1, i)[0];
				if (currentCell &&
					(occupyCol = currentCell.get('occupy').x).indexOf(preAlias) === occupyCol.length - 1) {
					attributes = _.clone(currentCell.attributes);
					attributes.content.texts = '';
					attributes.content.displayTexts = '';
					cells.createCellModel(index, i, attributes);
				}
			}
		}
	};
});