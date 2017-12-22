define(function(require) {
	'use strict';
	var _ = require('lib/underscore'),
		Backbone = require('lib/backbone'),
		config = require('spreadsheet/config'),
		cache = require('basic/tools/cache'),
		rows = require('collections/headItemRow'),
		cols = require('collections/headItemCol'),
		getOperRegion = require('basic/tools/getoperregion'),
		cells = require('collections/cells'),
		selectRegions = require('collections/selectRegion'),
		siderLineRows = require('collections/siderLineRow'),
		strandMap = require('basic/tools/strandmap'),
		send = require('basic/tools/send'),
		rowList = rows.models,
		colList = cols.models;

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
				sendRegion,
				posi,
				index,
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
			region = getOperRegion(label);
			operRegion = region.operRegion;
			sendRegion = region.sendRegion;


			if (operRegion.endRowIndex === 'MAX') {
				return;
			}
			index = operRegion.startRowIndex;
			posi = rows.models[index].get('top');
			height = rows.models[index].get('height');
			this._adaptHeadRowItem(index);
			this._adaptSelectRegion(index);
			this._adaptCells(index);
			this._fillCells(index);
			send.PackAjax({
				url: config.url.row.plus,
				data: JSON.stringify({
					sheetId: '1',
					row: sendRegion.startRow
				})
			});
			Backbone.trigger('event:mainContainer:adaptRowHeightChange', posi, config.User.cellHeight + 1);
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
			currentRowModel = rows.models[index];

			rows.add({
				sort: currentRowModel.get('sort'),
				alias: cache.aliasGenerator(),
				top: currentRowModel.get('top'),
				displayName: currentRowModel.get('displayName'),
			}, {
				at: index
			});

			height = config.User.cellHeight;
			len = rows.length;
			for (; i < len; i++) {
				currentRowModel = rows.models[i];
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
			select = selectRegions.getModelByType('selected');
			startRowAlias = select.get('wholePosi').startY;
			endRowAlias = select.get('wholePosi').endY;
			startRowIndex = rows.getIndexByAlias(startRowAlias);
			endRowIndex = rows.getIndexByAlias(endRowAlias);

			if (endRowIndex < index) {
				return;
			}
			if (startRowIndex >= index) {
				top = select.get('physicsBox').top;
				top += config.User.cellHeight;
				select.set('physicsBox.top', top);
				siderLineRows.models[0].set('top', top);
				startRowIndex++;
			}
			if (startRowIndex < index && endRowIndex >= index) {
				height = select.get('physicsBox').height;
				height += config.User.cellHeight;
				select.set('physicsBox.height', height);
				siderLineRows.models[0].set('height', height);
				rows.models[index].set('activeState', true);
				//	endRowIndex++;
			}

		},
		/**
		 * 调整单元格
		 * @param  {number} index 索引 
		 */
		_adaptCells: function(index) {
			var cellStrand = cache.CellsPosition.strandY,
				top,
				height,
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


			insertAlias = rows.models[index].get('alias');
			nextAlias = rows.models[index + 1].get('alias');
			preAlias = index > 0 ? cols.models[index - 1].get('alias') : null;

			changeCellList = cells.getCellByRow(index + 1,
				rows.length - 1);

			for (i = 0, len = changeCellList.length; i < len; i++) {
				currentCell = changeCellList[i];
				occupyRow = currentCell.get('occupy').y;
				insertCellIndex = occupyRow.indexOf(nextAlias);

				if (insertCellIndex === -1 || insertCellIndex === 0) { //未经过单元格
					top = currentCell.get('physicsBox').top;
					top += config.User.cellHeight;
					currentCell.set('physicsBox.top', top);
				} else {
					occupyRow.splice(insertCellIndex, 0, insertAlias);
					height = currentCell.get('physicsBox').height;
					height += config.User.cellHeight;

					occupyCol = currentCell.get('occupy').x;
					cellIndex = cellStrand[nextAlias][occupyCol[0]];
					for (j = 0, len2 = occupyCol.length; j < len2; j++) {
						cache.cachePosition(insertAlias, occupyCol[j], cellIndex);
					}
					currentCell.set('physicsBox.height', height);
					currentCell.set('occupy.y', occupyRow);

				}
			}


			if (!preAlias) {
				return;
			}

			rowAlias = rowList[index - 1].get('alias');
			for (i = 0, len = colList.length; i < len; i++) {
				colAlias = colList[i].get('alias');
				rule = strandMap.getPointRecord(colAlias, rowAlias);
				if (rule) {
					strandMap.addPointRecord(colAlias, insertAlias, rule);
				}
				currentCell = cells.getCellByVertical(i, index - 1)[0];
				if (currentCell &&
					(occupyRow = currentCell.get('occupy').y).indexOf(preAlias) === occupyRow.length - 1) {
					attributes = _.clone(currentCell.attributes);
					attributes.content.texts = '';
					attributes.content.displayTexts = '';
					cells.createCellModel(i, index, attributes);
				}
			}
		},
		_fillCells: function(index) {
			var headItemColList,
				headColModel,
				currentStrandX,
				rowAlias,
				colAlias,
				colProp,
				len, i = 0;

			headItemColList = cols.models;
			len = cols.length;
			rowAlias = rows.models[index].get('alias');
			currentStrandX = cache.CellsPosition.strandX;
			for (; i < len; i++) {
				headColModel = headItemColList[i];
				colProp = headColModel.get('operProp');
				if (!isEmptyObj(colProp)) {
					colAlias = headColModel.get('alias');
					if (currentStrandX[colAlias] === undefined ||
						currentStrandX[colAlias][rowAlias] === undefined) {
						cells.createCellModel(i, index, colProp);
					}
				}
			}

			function isEmptyObj(obj) {
				var i;
				for (i in obj) {
					return false;
				}
				return true;
			}
		}
	};
});