define(function(require) {
	'use strict';
	var Backbone = require('lib/backbone'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		util = require('basic/util/clone'),
		send = require('basic/tools/send'),
		observerPattern = require('basic/util/observer.pattern'),
		loadRecorder = require('basic/tools/loadrecorder'),
		original = require('basic/tools/original'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		cells = require('collections/cells'),
		CellContainer = require('views/cellContainer'),
		headItemRowList = headItemRows.models,
		headItemColList = headItemCols.models,
		ContentCellsContainer;


	/**
	 * ContentContainer
	 * @author ray wu
	 * @since 0.1.0
	 * @class ContentContainer  
	 * @module views
	 * @extends Backbone.View
	 * @constructor
	 */
	ContentCellsContainer = Backbone.View.extend({
		/**
		 * @property {element} el
		 */
		className: 'content-list',
		/**
		 * 初始化监听事件
		 * @method initialize
		 */
		initialize: function() {
			this.currentRule = util.clone(cache.CurrentRule);
			// 取消列隐藏时使用
			Backbone.on('event:restoreHideCellView', this.restoreHideCellView, this);
			// 重新拉取所有单元格数据
			Backbone.on('event:contentCellsContainer:reloadCells', this.reloadCells, this);
			// 撤销操作重新还原单元格视图
			Backbone.on('event:contentCellsContainer:restoreCell', this.addCell, this);
			Backbone.on('event:contentCellsContainer:destroy');
			this.listenTo(cells, 'add', this.addCell);

			if (this.currentRule.displayPosition.endIndex === undefined) {
				//订阅滚动行视图还原
				observerPattern.buildSubscriber(this);
				this.subscribe('mainContainer', 'restoreCellView', 'restoreCellView');
			}
		},
		/**
		 * 视图渲染方法
		 * @method render
		 */
		render: function() {
			this.fillCells();
			return this;
		},
		/**
		 * 填充单元格集合
		 * @method fillCells
		 */
		fillCells: function() {
			var len, i, cellsList = cells.models;
			len = cellsList.length;
			for (i = 0; i < len; i++) {
				if (!cellsList[i].get('isDestroy')) {
					this.addCell(cellsList[i]);
				}
			}
		},
		/**
		 * 重新加载后台保存cell对象
		 */
		reloadCells: function() {
			var i = 0,
				len = cells.length,
				cellModel,
				top,
				bottom;

			for (; i < len; i++) {
				cellModel = cells.models[0].destroy();
			}
			cache.CellsPosition.strandX = {};
			cache.CellsPosition.strandY = {};
			cache.cellRegionPosi.vertical = [];
			top = cache.viewRegion.top;
			bottom = cache.viewRegion.bottom;
			this.getCells(top, bottom);
			loadRecorder.insertPosi(top, bottom, cache.cellRegionPosi.vertical);
		},
		restoreHideCellView: function() {
			var headItemColList = headItemCols.models,
				headItemRowList = headItemRows.models,
				len = headItemColList.length,
				headItemModel,
				startRowIndex,
				endRowIndex,
				colAlias,
				rowAlias,
				strandX,
				tempCell,
				rowLen,
				i = 0,
				j;

			startRowIndex = headItemRows.getIndexByPosi(cache.viewRegion.top);
			endRowIndex = headItemRows.getIndexByPosi(cache.viewRegion.bottom);
			strandX = cache.CellsPosition.strandX;
			if (endRowIndex > startRowIndex) {
				rowLen = endRowIndex + 1;
			} else {
				rowLen = headItemRows.length;
			}
			for (; i < len; i++) {
				headItemModel = headItemColList[i];
				if (headItemModel.get('hidden') === true) {
					colAlias = headItemModel.get('alias');
					for (j = startRowIndex; j < rowLen; j++) {
						rowAlias = headItemRowList[j].get('alias');
						if (strandX[colAlias] !== undefined && strandX[colAlias][rowAlias] !== undefined) {
							tempCell = cells.models[strandX[colAlias][rowAlias]];
							if (tempCell.get('hidden') === true) {
								this.addCell(tempCell);
							}
						}
					}
				}
			}
		},
		getCells: function(top, bottom) {
			send.PackAjax({
				url: config.url.sheet.load,
				isPublic: false,
				async: false,
				data: JSON.stringify({
					sheetId: '1',
					top: top,
					bottom: bottom
				}),
				success: function(data) {
					if (data === '') {
						return;
					}
					data = data.returndata;
					var cellJSON = data.spreadSheet[0].sheet.cells;
					original.analysisCellData(cellJSON);
				}
			});
		},
		restoreCellView: function(model) {
			this.addCell(model);
		},
		/**
		 * view创建一个单元格
		 * @method addCell
		 * @param  {object} cell
		 */
		addCell: function(cell) {
			if (cache.TempProp.isFrozen) {
				var displayPosition = this.currentRule.displayPosition,
					startRowIndex = displayPosition.startRowIndex,
					startColIndex = displayPosition.startColIndex,
					endRowIndex = displayPosition.endRowIndex,
					endColIndex = displayPosition.endColIndex,
					cellBox = cell.get('physicsBox'),
					top, left, bottom, right;

				top = cellBox.top;
				bottom = top + cellBox.height;
				left = cellBox.left;
				right = left + cellBox.width;

				//判断单元格是否不再当前区域内
				if (bottom < headItemRowList[startRowIndex].get('top') ||
					right < headItemColList[startColIndex].get('left')) {
					return;
				}

				if (typeof endRowIndex === 'number') {
					endRowIndex = endRowIndex - 1;
					if (endRowIndex < 0 || top > headItemRowList[endRowIndex].get('top')) {
						return;
					}
				}
				if (typeof endColIndex === 'number') {
					endColIndex = endColIndex - 1;
					if (endColIndex < 0 || left > headItemColList[endColIndex].get('left')) {
						return;
					}
				}
			}

			this.cellView = new CellContainer({
				model: cell,
				currentRule: this.currentRule
			});
			this.$el.append(this.cellView.render().el);
		},
		/**
		 * 视图销毁
		 * @method destroy
		 */
		destroy: function() {
			Backbone.tigger('event:cellConainer:destroy');
			Backbone.off('event:contentCellsContainer:reloadCells');
			Backbone.off('event:contentCellsContainer:restoreCell');
			Backbone.off('event:restoreHideCellView');
			Backbone.off('event:contentCellsContainer:destroy');
			this.remove();
		}
	});
	return ContentCellsContainer;
});