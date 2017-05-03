define(function(require) {
	'use strict';
	var $ = require('lib/jquery'),
		_ = require('lib/underscore'),
		Backbone = require('lib/backbone'),
		Handlebars = require('lib/handlebars'),
		headItemRows = require('collections/headItemRow'),
		cache = require('basic/tools/cache'),
		util = require('basic/util/clone'),
		config = require('spreadsheet/config');
	/**
	 * HeadItemRowContainer
	 * @author ray wu
	 * @since 0.1.0
	 * @class HeadItemRowContainer  
	 * @module views
	 * @extends Backbone.View
	 * @constructor
	 */
	var HeadItemRowContainer = Backbone.View.extend({
		/**
		 * @property {element} className
		 */
		className: 'row-head-item',
		/**
		 * 初始化监听
		 * @method initialize
		 */
		initialize: function(option) {
			this.listenTo(this.model, 'change:activeState', this.toggleActive);
			this.listenTo(this.model, 'change:top', this.changeTop);
			this.listenTo(this.model, 'change:height', this.changeHeight);
			this.listenTo(this.model, 'change:displayName', this.changeDisplayName);
			this.listenTo(this.model, 'destroy', this.remove);
			this.offsetTop = cache.TempProp.isFrozen ? (option.frozenTop || 0) : 0;
			this.reduceUserView = option.reduceUserView;
			this.endIndex = option.endIndex;
			//ps:修改
			if (cache.TempProp.isFrozen !== true || this.endIndex === undefined) {
				this.listenTo(this.model, 'change:isView', this.destroy);
			}
		},
		/**
		 * 渲染本身对象
		 * @method render
		 * @return {object} 返回自身对象`this`
		 */
		render: function() {
			this.template = Handlebars.compile($('#tempRowHeadItem').html());
			this.changeTop();
			this.changeHeight();
			this.$el.html(this.template(this.model.toJSON())).data('alias', this.model.get('alias'));
			this.toggleActive();
			return this;
		},
		/**
		 * 切换DOM对象的状态
		 * @method toggleActive
		 */
		toggleActive: function() {
			this.$el.toggleClass("active", this.model.toJSON().activeState);
		},
		/**
		 * 修改DOM对象的`top`值
		 * @method changeTop
		 */
		changeTop: function() {
			var userViewTop = 0,
				userViewModel;
			if (cache.TempProp.isFrozen) {
				userViewModel = headItemRows.getModelByAlias(cache.UserView.rowAlias);
				userViewTop = userViewModel.toJSON().top;
			}
			this.$el.css({
				top: this.model.toJSON().top - this.offsetTop - userViewTop
			});
		},
		/**
		 * 修改DOM对象的`height`值
		 * @method changeHeight
		 * @return {[type]}
		 */
		changeHeight: function() {
			this.$el.css({
				height: this.model.toJSON().height
			});
		},
		changeDisplayName: function() {
			this.$el.children('.item').html(this.model.get('displayName'));
		},
		/**
		 * 视图销毁
		 * @method destroy
		 */
		destroy: function() {
			this.remove();
		}
	});
	return HeadItemRowContainer;
});