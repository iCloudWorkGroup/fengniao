define(function(require) {
	'use strict';
	var $ = require('lib/jquery'),
		_ = require('lib/underscore'),
		Backbone = require('lib/backbone'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		util = require('basic/util/clone'),
		headItemRows = require('collections/headItemRow'),
		RowsAllHeadContainer = require('views/rowsAllHeadContainer'),
		RowsPanelContainer;

	/**
	 * 行标题容器视图类
	 * @author ray wu
	 * @since 0.1.0
	 * @class RowsPanelContainer  
	 * @module views
	 * @extends Backbone.View
	 * @constructor
	 */
	RowsPanelContainer = Backbone.View.extend({
		/**
		 * 绑定视图
		 * @property el
		 * @type {String}
		 */
		className: 'row-head-container',
		/**
		 * 初始化事函数
		 * @method initialize
		 * @param {Object} allAttributes 视图高度信息
		 */
		initialize: function(options) {
			var modelsHeadLineRowList,
				modelsHeadLineRowRegionList,
				modellastHeadLineRow,
				len;

			//ps:监听selectRegion
			Backbone.on('call:rowsPanelContainer', this.rowsPanelContainer, this);
			Backbone.on('event:rowsPanelContainer:destroy', this.destroy, this);
			this.boxModel = {};
			this.currentRule = util.clone(cache.CurrentRule);
			this.boxAttributes = this.currentRule.boxAttributes;
			modelsHeadLineRowRegionList = modelsHeadLineRowList = headItemRows.models;

			if (cache.TempProp.isFrozen) {
				if (this.currentRule.displayPosition.endIndex) {
					modelsHeadLineRowRegionList = modelsHeadLineRowList.slice(this.currentRule.displayPosition.startIndex, this.currentRule.displayPosition.endIndex);
				} else {
					modelsHeadLineRowRegionList = modelsHeadLineRowList.slice(this.currentRule.displayPosition.startIndex);
				}
			}
			len = modelsHeadLineRowRegionList.length;
			if (len === 0) {
				this.boxModel.height =0;
				return;
			}
			modellastHeadLineRow = modelsHeadLineRowList[len - 1];
			this.boxModel.height = this.currentRule.autoScroll ? modellastHeadLineRow.get('top') + modellastHeadLineRow.get('height') - modelsHeadLineRowList[0].get('top') : -1;
		},
		/**
		 * 视图渲染函数
		 * @method render
		 * @return {Object} 该视图类对象
		 */
		render: function() {
			this.rowsAllHeadContainer = new RowsAllHeadContainer({
				boxAttributes: {
					height: this.boxModel.height
				},
				startY: this.startY,
				endY: this.endY
			});
			this.attributesRender(this.boxAttributes);
			this.$el.html(this.rowsAllHeadContainer.render().el);
			return this;
		},
		/**
		 * 用于其他视图绑定该视图
		 * @method rowsPanelContainer
		 * @param  {Function} receiveFunc 回调函数
		 */
		rowsPanelContainer: function(receiveFunc) {
			receiveFunc(this);
		},
		/**
		 * 渲染高度
		 * @method attributesRender
		 * @param  {Object} newAttributes 视图高度信息
		 */
		attributesRender: function(newAttributes) {
			if (newAttributes.height === -1) {
				this.$el.css({
					'height': 0
				});
			} else {
				this.$el.css({
					'height': newAttributes.height
				});
			}
			if (newAttributes.style) {
				this.$el.addClass(newAttributes.style);
			}
		},
		/**
		 * 滚动到指定位置
		 * @method scrollToPosition
		 * @param  {int} position 指定位置的值
		 */
		scrollToPosition: function(position) {
			this.$el.scrollTop(position);
		},
		/**
		 * 视图销毁
		 * @method destroy
		 */
		destroy: function() {
			if (this.unsubscribe) {
				this.unsubscribe('mainContainer','verticalPublish');
			}
			Backbone.off('call:rowsPanelContainer');
			Backbone.off('event:rowsPanelContainer:destroy');
			this.rowsAllHeadContainer.destroy();
			this.remove();
		},
		/**
		 * 调整容器高度
		 * @method adjustHeadItemContainer
		 * @property {number} height 高度
		 */
		adjustHeadItemContainer: function(height) {
			this.rowsAllHeadContainer.$el.css({
				'height': height
			});
		},
		/**
		 * 增加子视图
		 * @method addHeadItemView
		 * @property {object} HeadItemModel 增加对象
		 */
		addHeadItemView: function(HeadItemModel) {
			this.rowsAllHeadContainer.rowsHeadContainer.addRowsHeadContainer(HeadItemModel);
		}
	});
	return RowsPanelContainer;
});