define(function(require) {
	'use strict';
	var $ = require('lib/jquery'),
		_ = require('lib/underscore'),
		Backbone = require('lib/backbone'),
		send = require('basic/tools/send'),
		cache = require('basic/tools/cache'),
		binary = require('basic/util/binary'),
		selectState = require('basic/tools/bindtoolbar'),
		mergeCell = require('entrance/tool/mergecell');

	/**
	 * 合并，拆分单元格视图类
	 * @author ray wu
	 * @since 0.1.0
	 * @class MergeCellContainer  
	 * @module views
	 * @extends Backbone.View
	 * @constructor
	 */
	var MergeCellContainer = Backbone.View.extend({
		/**
		 * 绑定视图
		 * @property el
		 * @type {String}
		 */
		el: '#mergeContainer',
		/**
		 * 绑定鼠标事件
		 * @property events
		 * @type {Object}
		 */
		events: {
			'click': 'transAction'
		},
		/**
		 * 监听合并操作
		 * @method transAction
		 */
		transAction: function(e) {
			mergeCell();
			selectState.update('merge');
		}
	});
	return MergeCellContainer;
});