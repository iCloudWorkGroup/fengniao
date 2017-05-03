'use strict';
define(function(require) {
	var $ = require('lib/jquery'),
		Backbone = require('lib/backbone'),
		Handlebars = require('lib/handlebars'),
		headItemCols = require('collections/headItemCol'),
		cache = require('basic/tools/cache'),
		util = require('basic/util/clone'),
		HeadItemColContainer;

	/**
	 * HeadItemColContainer
	 * @author ray wu
	 * @since 0.1.0
	 * @class HeadItemColContainer  
	 * @module views
	 * @extends Backbone.View
	 * @constructor
	 */
	HeadItemColContainer = Backbone.View.extend({
		/**
		 * @property {element} className
		 */
		className: 'col-head-item',
		/**
		 * 初始化监听
		 * @method initialize
		 */
		initialize: function() {
			// this.frozenOffsetLeft = option.frozenLeft;
			this.listenTo(this.model, 'change:activeState', this.toggleActive);
			this.listenTo(this.model, 'change:isView', this.destroy);
			this.listenTo(this.model, 'change:hidden', this.destroy);
			this.listenTo(this.model, 'change:left', this.changeLeft);
			this.listenTo(this.model, 'change:width', this.changeWidth);
			this.listenTo(this.model, 'change:displayName', this.changeDisplayName);
			this.listenTo(this.model, 'change:isLeftAjacentHide', this.changeLeftAjacentHide);
			this.listenTo(this.model, 'change:isRightAjacentHide', this.changeRightAjacentHide);
			this.listenTo(this.model, 'destroy', this.remove);
			this.currentRule = util.clone(cache.CurrentRule);
			this.offsetLeft = cache.TempProp.isFrozen ? (this.currentRule.displayPosition.offsetLeft || 0) : 0;
		},
		/**
		 * 渲染本身对象
		 * @method render
		 */
		render: function() {

			/**
			 * @property {string} template
			 */
			this.template = Handlebars.compile($('#tempColHeadItem').html());
			this.changeLeft();
			// this.changeWidth();
			this.changeRightAjacentHide();
			this.$el.html(this.template(this.model.toJSON())).data('alias', this.model.get('alias'));
			this.toggleActive();
			return this;
		},
		/**
		 * 切换DOM对象的状态
		 * @method toggleActive
		 */
		toggleActive: function() {
			this.$el.toggleClass('active', this.model.toJSON().activeState);
		},
		/**
		 * 修改DOM对象的`left`值
		 * @method changeLeft
		 */
		changeLeft: function() {
			var modelJSON = this.model.toJSON(),
				left = modelJSON.left,
				userViewLeft = 0,
				userViewModel;
			if (this.currentRule.reduceUserView) {
				userViewModel = headItemCols.getModelByAlias(cache.UserView.colAlias);
				userViewLeft = userViewModel.toJSON().left;
			}
			if (modelJSON.isLeftAjacentHide) {
				left++;
			}
			this.$el.css({
				left: left - this.offsetLeft - userViewLeft
			});
		},
		/**
		 * 修改DOM对象的`width`值
		 * @method changeWidth		 
		 */
		changeWidth: function() {
			var modelJSON = this.model.toJSON(),
				width = modelJSON.width;

			if (modelJSON.isLeftAjacentHide) {
				width--;
			}

			if (modelJSON.isRightAjacentHide) {
				width--;
			}

			this.$el.css({
				width: width
			});
		},
		changeRightAjacentHide: function() {
			var modelJSON = this.model.toJSON();
			if (modelJSON.isRightAjacentHide) {
				this.changeWidth();
				this.$el.css({
					'border-right': '3px double #d4d4d4'
				});
			} else {
				this.changeWidth();
				this.$el.removeAttr('border-right');
			}
		},
		changeLeftAjacentHide: function() {
			this.changeWidth();
			this.changeLeft();
		},
		changeDisplayName: function() {
			this.$el.children('.item').html(this.model.get('displayName'));
		},
		changeView: function() {
			if (this.model.toJSON().isView === false) {
				this.destroy();
			}
		},
		/**
		 * 视图销毁
		 * @method destroy
		 */
		destroy: function() {
			if (!this.model.get('isView') || this.model.get('hidden')) {
				this.remove();
			}
		}
	});
	return HeadItemColContainer;
});