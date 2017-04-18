define(function(require) {
	'use strict';
	var $ = require('lib/jquery'),
		_ = require('lib/underscore'),
		Backbone = require('lib/backbone'),
		send = require('basic/tools/send'),
		selectRegions = require('collections/selectRegion'),
		setFontSize = require('entrance/tool/setfontsize'),
		setCellHeight = require('entrance/cell/setcellheight');


	/**
	 * 设置字体大小
	 * @author ray wu
	 * @since 0.1.0
	 * @class FontSizeContainer  
	 * @module views
	 * @extends Backbone.View
	 * @constructor
	 */
	var FontSizeContainer = Backbone.View.extend({
		/**
		 * @property {element} el
		 */
		el: "#fontSize",
		/**
		 * @property {object} events
		 */
		events: {
			/**
			 * 选择下拉菜单时修改字体字号
			 * @event mousedown
			 */
			'mousedown li': 'setFontSize'
		},
		/**
		 * 设置字体字号
		 * @method setFontSize
		 * @param  {event}    e 每个`li`的事件对象
		 */
		setFontSize: function(e) {
			var fontSize,
				text,
				$currentTarget;
			$currentTarget = $(e.currentTarget);
			this.$el.removeClass('active');
			fontSize = $currentTarget.data('size');
			text = $currentTarget.text();
			$("#fontSizeShow").text(text);
			setFontSize('1', fontSize);
		}
	});
	return FontSizeContainer;

});