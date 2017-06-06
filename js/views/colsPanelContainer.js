define(function(require) {
	'use strict';
	var $ = require('lib/jquery'),
		_ = require('lib/underscore'),
		Backbone = require('lib/backbone'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		util = require('basic/util/clone'),
		headItemCols = require('collections/headItemCol'),
		ColsAllHeadContainer = require('views/colsAllHeadContainer'),
		ColsPanelContainer;

	/**
	 * ColsPanelContainer
	 * @author ray wu
	 * @since 0.1.0
	 * @class ColsPanelContainer  
	 * @module views
	 * @extends Backbone.View
	 * @constructor
	 */
	ColsPanelContainer = Backbone.View.extend({
		/**
		 * @property {element} el
		 */
		className: 'col-head-container',
		/**
		 * 初始化事件监听
		 * @method initialize
		 * @param  {[type]}   allAttributes
		 * @return {[type]}
		 */
		initialize: function(options) {
			var modelsHeadLineColList,
				modelsHeadLineColRegionList,
				modelHeadLinelastCol,
				len;
			Backbone.on('call:colsPanelContainer', this.colsPanelContainer, this);
			Backbone.on('event:colsPanelContainer:destroy', this.destroy, this);
			Backbone.trigger('event:colsPanelContainer:adjustWidth', this.adjustWidth, this);
			/**
			 * 盒模型属性
			 * @property {object} boxAttribute
			 */
			this.boxModel = {};
			this.cacheDiffDistance = 0;
			this.currentRule = cache.CurrentRule;
			this.boxAttributes = this.currentRule.boxAttributes;
			modelsHeadLineColRegionList = modelsHeadLineColList = headItemCols.models;
			if (cache.TempProp.isFrozen) {
				if (this.currentRule.displayPosition.endIndex) {
					modelsHeadLineColRegionList = modelsHeadLineColList.slice(this.currentRule.displayPosition.startIndex, this.currentRule.displayPosition.endIndex);
				} else {
					modelsHeadLineColRegionList = modelsHeadLineColList.slice(this.currentRule.displayPosition.startIndex);
				}
			}
			len = modelsHeadLineColRegionList.length;
			//it isn't frozen handle
			//the page is just build execel, len is 0
			if (len === 0) {
				this.boxModel.width = config.User.initColNum * config.User.cellWidth - 1;
				return;
			}
			//the page is reload excel, len will be appoint num ,will be not necessarily start A,1 
			modelHeadLinelastCol = modelsHeadLineColRegionList[len - 1];
			this.boxModel.width = this.currentRule.autoScroll ? modelHeadLinelastCol.get('left') + modelHeadLinelastCol.get('width') - modelsHeadLineColRegionList[0].get('left') : -1;
		},
		/**
		 * 渲染本身对象
		 * @method render
		 * @return {object} 返回自身对象`this`
		 */
		render: function() {
			this.colsAllHeadContainer = new ColsAllHeadContainer({
				boxAttributes: {
					width: this.boxModel.width
				}
			});
			this.attributesRender(this.boxAttributes);
			this.$el.html(this.colsAllHeadContainer.render().el);
			return this;
		},
		/**
		 * 对外开放本对象
		 * @method colsPanelContainer
		 * @param  {function} receiveFunc 传入接受对象的方法
		 */
		colsPanelContainer: function(receiveFunc) {
			receiveFunc(this);
		},
		/**
		 * 自身属性渲染
		 * @method attributesRender
		 * @param  {object} newAttributes 盒模型属性
		 */
		attributesRender: function(newAttributes) {
			if (newAttributes.width === -1) {
				this.$el.css({
					'width': 0
				});
			} else {
				this.$el.css({
					'width': newAttributes.width
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
			this.$el.scrollLeft(position);
		},
		/**
		 * 视图销毁
		 * @method destroy
		 */
		destroy: function() {
			Backbone.off('call:colsPanelContainer');
			Backbone.off('event:colsPanelContainer:destroy');
			this.colsAllHeadContainer.destroy();
			this.remove();
		}
	});
	return ColsPanelContainer;
});