define(function(require) {
	'use strict';
	var $ = require('lib/jquery'),
		_ = require('lib/underscore'),
		Backbone = require('lib/backbone'),
		send = require('basic/tools/send'),
		cells = require('collections/cells'),
		selectRegions = require('collections/selectRegion'),
		setFontFamily = require('entrance/tool/setfontfamily'),
		selectState = require('basic/tools/bindtoolbar');

	/**
	 * 设置字体功能监听类
	 * @author ray wu
	 * @since 0.1.0
	 * @class FontFamilyContainer  
	 * @module views
	 * @extends Backbone.View
	 * @constructor
	 */
	var FontFamilyContainer = Backbone.View.extend({
		/**
		 * @property {element} el
		 */
		el: "#font",
		/**
		 * @property {object} events
		 */
		events: {
			/**
			 * 选择下拉菜单时修改字体字号
			 * @event mousedown
			 */
			'mousedown li': 'setFontFamily'
		},
		/**
		 * 设置字体风格
		 * @method setFontFamily
		 * @param  {event}    e 每个`li`的事件对象
		 */
		setFontFamily: function(e) {
			var displayText,
				fontFamily,
				$currentTarget;
			this.$el.removeClass('active');
			$currentTarget = $(e.currentTarget);
			fontFamily = $currentTarget.data('family');
			displayText = $currentTarget.text();
			$("#fontShow").text(displayText);
			setFontFamily('1', fontFamily);
			selectState.update('family');
		}
	});
	return FontFamilyContainer;
});