define(function(require) {
	'use strict';
	var $=require('lib/jquery'),
		_=require('lib/underscore'),
		Backbone = require('lib/backbone'),
		send = require('basic/tools/send'),
		cells = require('collections/cells'),
		selectRegions = require('collections/selectRegion'),
		setFontWeight=require('entrance/tool/setfontweight'),
		setFontStyle=require('entrance/tool/setfontstyle');

	/**
	 * 设置字体功能监听类
	 * @author ray wu
	 * @since 0.1.0
	 * @class ContentFontContainer  
	 * @module views
	 * @extends Backbone.View
	 * @constructor
	 */
	var ContentFontContainer = Backbone.View.extend({
		/**
		 * @property {element} el
		 */
		el: '#contentFontContainer',
		/**
		 * @property {object} events
		 */
		events: {
			/**
			 * 设置字体属性
			 * @event click
			 */
			'click span': 'setFontAction'
		},
		/**
		 * 通过动作确定设置属性
		 * @method setFontAction
		 * @param  {event} e
		 */
		setFontAction: function(e) {
			var tool = $(e.currentTarget).data('toolbar');

			switch (tool) {
				case 'bold':
					this.setCellModelBold();
					break;
				case 'italic':
					this.setCellModelItalic();
					break;
				default:
					return;
			}
		},
		/**
		 * 设置字体加粗
		 * @method setCellModelBold
		 */
		setCellModelBold: function() {
			var startColIndex,
				startRowIndex,
				tempCell,
				bold;
			//获取起始单元格
			setFontWeight('1');
		},
		/**
		 * 设置字体倾斜
		 * @method setCellModelItalic
		 */
		setCellModelItalic: function() {
			var startColIndex,
				startRowIndex,
				tempCell,
				italic;
			//获取起始单元格
			setFontStyle('1');
		}
	});
	return ContentFontContainer;
});