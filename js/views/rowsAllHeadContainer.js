define(function(require) {
	'use strict';
	var $ = require('lib/jquery'),
		_ = require('lib/underscore'),
		clone = require('basic/util/clone'),
		cache = require('basic/tools/cache'),
		Backbone = require('lib/backbone'),
		headItemRows = require('collections/headItemRow'),
		siderLineRows = require('collections/siderLineRow'),
		RowsHeadContainer = require('views/rowsHeadContainer'),
		SiderLineRowContainer = require('views/siderLineRowContainer'),
		headItemRowList = headItemRows.models;

	/**
	 * 行标题，标线容器视图类
	 * @author ray wu
	 * @since 0.1.0
	 * @class RowsAllHeadContainer  
	 * @module views
	 * @extends Backbone.View
	 * @constructor
	 */

	var RowsAllHeadContainer = Backbone.View.extend({
		/**
		 * 设置class属性
		 * @property className
		 * @type {String}
		 */
		className: 'row-head-bg row-head-width',
		/**
		 * 视图初始化函数
		 * @method initialize
		 * @param  {Object} allAttributes 容器高度属性
		 */
		initialize: function(options) {
			Backbone.on('call:rowsAllHeadContainer', this.callRowsAllHeadContainer, this);
			Backbone.on('event:rowsAllHeadContainer:adaptHeight', this.adaptHeight, this);
			this.currentRule = clone.clone(cache.CurrentRule);

			//记录冻结情况下导致视图移动大小
			if (cache.TempProp.isFrozen === true) {
				this.userViewTop = headItemRows.getModelByAlias(cache.UserView.rowAlias).get('top');
				this.offsetTop = this.currentRule.displayPosition.offsetTop;
			} else {
				this.userViewTop = 0;
				this.offsetTop = 0;
			}
			this.listenTo(siderLineRows, 'add', this.addSiderLineRow);
			this.boxAttributes = options.boxAttributes;
		},
		/**
		 * 页面渲染方法
		 * @method render
		 */
		render: function() {
			var modelSiderLineRowList = siderLineRows.models,
				len = modelSiderLineRowList.length,
				rowsHeadContainer, i;

			rowsHeadContainer = new RowsHeadContainer();

			this.attributesRender(this.boxAttributes);
			this.$el.append(rowsHeadContainer.render().el);
			if (len === 0) {
				this.createSiderLineRow();
			} else {
				for (i = len - 1; i >= 0; i--) {
					this.addSiderLineRow(modelSiderLineRowList[i]);
				}

			}
			return this;
		},
		adaptHeight: function() {
			var bottom = 0,
				top = 0,
				len, i,
				start;

			len = this.currentRule.displayPosition.endRowIndex || headItemRowList.length - 1;
			start = this.currentRule.displayPosition.startRowIndex || 0;
			for (i = len; i >= start; i--) {
				if (!headItemRowList[i].get('hidden')) {
					top = headItemRowList[i].get('top') + headItemRowList[i].get('height');
					bottom = headItemRowList[start].get('top');
					this.$el.css({
						'height': top - bottom - this.userViewTop
					}); 
					break;
				}
			}

		},
		/**
		 * 用于其他视图，绑定该视图或调用该视图方法
		 * @method callRowsAllHeadContainer
		 * @param {function} receiveFunc 回调函数
		 */
		callRowsAllHeadContainer: function(receiveFunc) {
			receiveFunc(this);
		},
		/**
		 * 渲染视图高度
		 * @method attributesRender
		 * @param  {object} newAttributes 存储高度对象
		 */
		attributesRender: function(newAttributes) {
			if (newAttributes.height !== -1) {
				this.$el.css({
					'height': newAttributes.height
				});
			}
		},
		/**
		 * 增加行标线视图
		 * @method addSiderLineRow
		 * @param {app.Models.SiderLineRow} modelSiderLineRow 增加
		 */
		addSiderLineRow: function(modelSiderLineRow) {
			this.siderLineRowContainer = new SiderLineRowContainer({
				model: modelSiderLineRow
			});
			this.$el.append(this.siderLineRowContainer.render().el);
		},
		/**
		 * 增加行标线
		 * @method createSiderLineRow
		 */
		createSiderLineRow: function() {
			siderLineRows.add({
				top: 0,
				height: config.User.cellHeight - 1
			});
		},
		/**
		 * 视图销毁
		 * @method destroy
		 */
		destroy: function() {
			Backbone.trigger('event:rowsHeadContainer:destroy');
			Backbone.off('call:rowsAllHeadContainer');
			this.siderLineRowContainer.destroy();
			this.remove();
		}
	});
	return RowsAllHeadContainer;
});