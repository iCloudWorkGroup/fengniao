//attention bug, new model has large question

define(function(require) {
	'use strict';
	var $ = require('lib/jquery'),
		Backbone = require('lib/backbone'),
		setAlign = require('entrance/tool/setalign'),
		selectState = require('basic/tools/bindtoolbar');

	/**
	 * ContentAlignContainer
	 * @author ray wu
	 * @since 0.1.0
	 * @class ContentAlignContainer  
	 * @module views
	 * @extends Backbone.View
	 * @constructor
	 */
	var ContentAlignContainer = Backbone.View.extend({
		/**
		 * @property {element} el
		 */
		el: '#contentAlignContainer',
		/**
		 * @property {object} events
		 */
		events: {
			/**
			 * 设置对象方式
			 * @event click
			 */
			'click span[data-align]': 'setAlignAction'
		},
		/**
		 * [setAlignAction description]
		 * @method setAlignAction
		 * @param  {event} e 鼠标点击事件
		 */
		setAlignAction: function(e) {
			var alignType,
				sign = 'top middle bottom';
			alignType = $(e.currentTarget).data('align');
			setAlign('1', alignType);
			
			if (sign.indexOf(alignType) !== -1) {
				selectState.update('alignCol');
			} else {
				selectState.update('alignRow');
			}

		}
	});
	return ContentAlignContainer;
});