'use strict';
define(function(require) {
	var $ = require('lib/jquery'),
		Backbone = require('lib/backbone'),
		config = require('spreadsheet/config'),
		setTextType = require('entrance/tool/settexttype');
	/**
	 * 文本类型视图类
	 * @author ray wu
	 * @since 0.1.0
	 * @class TextFormatContainer  
	 * @module views
	 * @extends Backbone.View
	 * @constructor
	 */
	var TextFormatContainer = Backbone.View.extend({
		/**
		 * 绑定视图
		 * @property {string} el
		 */
		el: '#contentFormat',
		/**
		 * 绑定鼠标事件
		 * @method events
		 */
		events: {
			'mousedown li': 'setContentFormat'
		},
		/**
		 * 设置选中区域文本格式
		 * @method setContentFormat
		 * @param e {event}  鼠标点击事件
		 */
		setContentFormat: function(e) {
			this.$el.removeClass('active');
			var formatPosition = $(e.currentTarget).data('format');
			// setTextType('1',formatPosition);
			switch (formatPosition) {
				case 'normal':
					setTextType.setNormal('1');
					break;
				case 'text':
					setTextType.setText('1');
					break;
				case 'number-0':
					setTextType.setNum('1', false, 0);
					break;
				case 'number-1':
					setTextType.setNum('1', false, 1);
					break;
				case 'number-2':
					setTextType.setNum('1', false, 2);
					break;
				case 'number-3':
					setTextType.setNum('1', false, 3);
					break;
				case 'number-4':
					setTextType.setNum('1', false, 4);
					break;
				case 'date-1':
					setTextType.setDate('1', config.dateFormatType.frist);
					break;
				case 'date-2':
					setTextType.setDate('1', config.dateFormatType.fourth);
					break;
				case 'date-3':
					setTextType.setDate('1', config.dateFormatType.fifth);
					break;
				case 'percent':
					setTextType.setPercent('1', 2);
					break;
				case 'coin-1':
					setTextType.setCurrency('1', 2, '$');
					break;
				case 'coin-2':
					setTextType.setCurrency('1', 2, '¥');
					break;
				default:
					setTextType.setText('1');
					break;
			}
		}
	});
	return TextFormatContainer;
});