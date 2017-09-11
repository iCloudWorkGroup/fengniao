define(function(require) {
	'use strict';
	var $ = require('lib/jquery'),
		_ = require('lib/underscore'),
		Backbone = require('lib/backbone'),
		observerPattern = require('basic/util/observer.pattern'),
		config = require('spreadsheet/config'),
		cache = require('basic/tools/cache'),
		headItemRows = require('collections/headItemRow'),
		cells = require('collections/cells'),
		GridLineRowContainer = require('views/gridLineRowContainer');

	/**
	 * RowsGridContainer
	 * @author ray wu
	 * @since 0.1.0
	 * @class RowsGridContainer  
	 * @module views
	 * @extends Backbone.View
	 * @constructor
	 */
	var RowsGridContainer = Backbone.View.extend({
		/**
		 * @property {element} className
		 */
		className: 'row-container',
		/**
		 * 初始化事件监听
		 * @method initialize
		 */
		initialize: function(option) {
			// _.bindAll(this, 'callScreenContainer');
			/**
			 * 已经加载行数
			 * @property {int} rowNumber
			 */
			this.rowNumber = 0;
			this.currentRule = cache.CurrentRule;
			if (this.currentRule.displayPosition.endRowIndex === undefined) {
				this.listenTo(headItemRows, 'add', this.addGridLineRow);

				//订阅滚动行视图还原
				observerPattern.buildSubscriber(this);
				this.subscribe('mainContainer', 'restoreRowView', 'restoreRowView');
			}
			Backbone.on('call:rowsGridContainer', this.rowsGridContainer, this);
		},
		rowsGridContainer: function(receiveFunc) {
			receiveFunc(this);
		},
		/**
		 * 渲染本身对象
		 * @method render
		 * @return {object} 返回自身对象`this`
		 */
		render: function() {
			var i = 0,
				gridLineRowList,
				gridLineRowRegionList,
				len;
			gridLineRowList = gridLineRowRegionList = headItemRows.models;
			if (cache.TempProp.isFrozen) {
				if (this.currentRule.displayPosition.endRowIndex !== undefined) {
					gridLineRowRegionList = gridLineRowList.slice(this.currentRule.displayPosition.startRowIndex, this.currentRule.displayPosition.endRowIndex);
				} else {
					gridLineRowRegionList = gridLineRowList.slice(this.currentRule.displayPosition.startRowIndex);
				}
			}
			len = gridLineRowRegionList.length;
			for (; i < len; i++) {
				this.addGridLineRow(gridLineRowRegionList[i]);
				this.rowNumber++;
			}
			return this;
		},
		restoreRowView: function(model, direction) {
			this.addGridLineRow(model, direction);
		},
		/**
		 * 渲染view，增加行在`grid`区域内
		 * @method addGridLineRow
		 * @param  {object} modelGridLineRow 行model对象
		 */
		addGridLineRow: function(modelGridLineRow, direction) {
			//处理冻结状态
			var gridLineRow = new GridLineRowContainer({
				model: modelGridLineRow,
				frozenTop: this.currentRule.displayPosition.offsetTop,
				endIndex: this.currentRule.displayPosition.endRowIndex
			});
			if (direction !== 'down') {
				this.$el.append(gridLineRow.render().el);
			} else {
				this.$el.prepend(gridLineRow.render().el);
			}
		},

		/**
		 * 设置新对象属性
		 * @method newAttrRow
		 * @return {object} 新对象属性
		 * @deprecated 在行列调整后将会过时
		 */
		newAttrRow: function() {
			var currentObject = {
				alias: (this.rowNumber + 1).toString(),
				top: this.rowNumber * config.User.cellHeight,
				height: config.User.cellHeight - 1,
				displayName: app.basic.getRowDisplayName(this.rowNumber)
			};
			return currentObject;
		},
		/**
		 * 视图销毁
		 * @method destroy
		 */
		destroy: function() {
			this.remove();
		}
	});
	return RowsGridContainer;
});