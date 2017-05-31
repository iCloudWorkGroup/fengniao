define(function(require) {
	'use strict';
	var $ = require('lib/jquery'),
		_ = require('lib/underscore'),
		Backbone = require('lib/backbone'),
		send = require('basic/tools/send'),
		cache = require('basic/tools/cache'),
		selectRegions = require('collections/selectRegion'),
		headItemRows = require('collections/headItemRow'),
		headItemCols = require('collections/headItemCol'),
		setFrozen = require('entrance/sheet/setfrozen');

	/**
	 * 冻结功能视图类
	 * @author ray wu
	 * @since 0.1.0
	 * @class frozenContainer  
	 * @module views
	 * @extends Backbone.View
	 * @constructor
	 */
	var frozenContainer = Backbone.View.extend({
		/**
		 * @property {string} el 绑定视图
		 */
		el: "#frozen",
		/**
		 * @property {object} events 监听事件
		 */
		events: {
			'mousedown li': 'transAction'
		},
		/**
		 * 初始化函数
		 * @method initialize
		 */
		initialize: function() {
			Backbone.on('event:frozenContainer:changeState', this.changeState, this);
			this.unfrozenBtn = $('li[data-frozen="unfrozen"]', this.$el);
			this.customBtn = $('li[data-frozen="custom"]', this.$el);
			this.changeState();
		},
		/**
		 * 渲染本身对象
		 * @method render
		 */
		render: function() {},
		/**
		 * 改变冻结状态
		 * @method changeState
		 */
		changeState: function() {
			if (cache.TempProp.isFrozen) {
				this.unfrozenBtn.show();
				this.customBtn.hide();
			} else {
				this.unfrozenBtn.hide();
				this.customBtn.show();
			}
		},
		/**
		 * 监听冻结操作
		 * @method transAction
		 */
		transAction: function(e) {
			var type = $(e.currentTarget).data('frozen');
			setFrozen('1',null ,type);
			this.changeState();
		}
	});
	return frozenContainer;
});