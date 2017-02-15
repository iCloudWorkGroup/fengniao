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
			Backbone.on('event:contentCellsContainer:reloadCells', this.reloadCells, this);
			Backbone.on('event:restoreHideCellView', this.restoreHideCellView, this);
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
			var len, i, cellsList;
			cellsList = cells.where({
				isDestroy: false
			});
			len = cellsList.length;
			for (i = 0; i < len; i++) {
				if (!cellsList[i].get('hidden')) {
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
			//清空单元格记录区域
			cache.cellRegionPosi.vertical = [];
			top = cache.visibleRegion.top;
			bottom = cache.visibleRegion.bottom;
			this.getCells(top, bottom);
			loadRecorder.insertPosi(top, bottom, cache.cellRegionPosi.vertical);
			len = cells.length;
			i = 0;
			for (; i < len; i++) {
				this.addCell(cells.models[i]);
			}

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
					var cells = data.spreadSheet[0].sheet.cells;
					original.analysisCellData(cells);
				}
			});

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
			startRowIndex = headItemRows.getIndexByAlias(cache.UserView.rowAlias);
			endRowIndex = headItemRows.getIndexByAlias(cache.UserView.rowEndAlias);
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
								this.addCellView(tempCell);
							}
						}
					}
				}
			}
		},
		/**
		 * view创建一个单元格
		 * @method addCell
		 * @param  {object} cell
		 */
		addCell: function(cell) {
			if (cache.TempProp.isFrozen) {
				var displayPosition = this.currentRule.displayPosition,
					startRowIndex,
					startColIndex,
					endRowIndex,
					endColIndex,
					currentOccupy,
					len, i,
					headItemColList = headItemCols,
					headItemRowList = headItemRows,
					cellRowStartIndex,
					cellColStartIndex,
					cellRowEndIndex,
					cellColEndIndex;
				//ps:增加循环判断
				currentOccupy = cell.get('occupy');
				len = currentOccupy.x.length;

				startRowIndex = headItemRowList.getIndexByAlias(displayPosition.startRowAlias);
				startColIndex = headItemColList.getIndexByAlias(displayPosition.startColAlias);
				endRowIndex = headItemRowList.getIndexByAlias(displayPosition.endRowAlias);
				endColIndex = headItemColList.getIndexByAlias(displayPosition.endColAlias);

				cellColStartIndex = headItemColList.getIndexByAlias(currentOccupy.x[0]);
				cellColEndIndex = headItemColList.getIndexByAlias(currentOccupy.x[len - 1]);
				for (i = 0; i < currentOccupy.y.length; i++) {
					if (headItemRowList.getIndexByAlias(currentOccupy.y[i]) !== -1) {
						cellRowStartIndex = headItemRowList.getIndexByAlias(currentOccupy.y[i]);
						break;
					}
				}
				for (i = currentOccupy.y.length - 1; i > -1; i--) {
					if (headItemRowList.getIndexByAlias(currentOccupy.y[i]) !== -1) {
						cellRowEndIndex = headItemRowList.getIndexByAlias(currentOccupy.y[i]);
						break;
					}
				}
				if (isNumber(displayPosition.startRowIndex) &&
					cellRowEndIndex < startRowIndex ||
					isNumber(displayPosition.endRowIndex) &&
					cellRowStartIndex > endRowIndex - 1 ||
					isNumber(displayPosition.startColIndex) &&
					cellColEndIndex < startColIndex ||
					isNumber(displayPosition.endColIndex) &&
					cellColStartIndex > endColIndex - 1) {
					return;
				}
			}
			
			this.cellView = new CellContainer({
				model: cell,
				currentRule: this.currentRule
			});
			this.$el.append(this.cellView.render().el);

			function isNumber(source) {
				return typeof source === 'number';
			}

		},
		addCellView: function(cell) {
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
			Backbone.off('event:restoreHideCellView');
			this.remove();
		}
	});
	return ContentCellsContainer;
});