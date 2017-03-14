define(function(require) {
	'use strict';
	var $ = require('lib/jquery'),
		_ = require('lib/underscore'),
		Backbone = require('lib/backbone'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		util = require('basic/util/clone'),
		send = require('basic/tools/send'),
		loadRecorder = require('basic/tools/loadrecorder'),
		original = require('basic/tools/original'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		cells = require('collections/cells'),
		CellContainer = require('views/cellContainer'),
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
			//考虑冻结情况
			Backbone.on('event:contentCellsContainer:reloadCells', this.reloadCells, this);
			//还原
			this.listenTo(cells, 'add', this.addCell);
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
			top = cache.visibleRegion.top;
			bottom = cache.visibleRegion.bottom;
			this.getCells(top, bottom);
			loadRecorder.insertPosi(top, bottom, cache.cellRegionPosi.vertical);
		},
		getCells: function(top, bottom) {
			send.PackAjax({
				url: 'excel.htm?m=openexcel',
				isPublic: false,
				async: false,
				data: JSON.stringify({
					excelId: window.SPREADSHEET_AUTHENTIC_KEY,
					sheetId: '1',
					rowBegin: top,
					rowEnd: bottom
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
					headItemColList = headItemCols.models,
					headItemRowList = headItemRows.models,
					cellBox = cell.get('physicsBox'),
					top, left, bottom, right;

				top = cellBox.top;
				bottom = top + cellBox.height;
				left = cellBox.left;
				right = left + cellBox.width;

				if (bottom < headItemRowList[startRowIndex].get('top') ||
					(typeof endRowIndex === 'number' && top > headItemRowList[endRowIndex].get('top')) ||
					right < headItemColList[startColIndex].get('left') ||
					(typeof endColIndex === 'number' && left > headItemColList[endColIndex].get('left'))) {
					return;
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
			Backbone.off('event:contentCellsContainer:reloadCells');
			this.remove();
		}
	});
	return ContentCellsContainer;
});