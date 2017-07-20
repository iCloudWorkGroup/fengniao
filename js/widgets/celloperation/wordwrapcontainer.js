//attention bug, new model has large question

define(function(require) {
	'use strict';
	var $ = require('lib/jquery'),
		_ = require('lib/underscore'),
		Backbone = require('lib/backbone'),
		send = require('basic/tools/send'),
		selectRegions = require('collections/selectRegion'),
		setWordWrap = require('entrance/tool/setwordwrap'),
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
	var WordWrapContainer = Backbone.View.extend({
		/**
		 * @property {element} el
		 */
		el: "#wordWrapContainer",
		/**
		 * @property {object} events
		 */
		events: {
			/**
			 * 设置对象方式
			 * @event click
			 */
			'click': 'wordWrap'
		},
		/**
		 * [setAlignAction description]
		 * @method setAlignAction
		 * @param  {event} e 鼠标点击事件
		 */
		wordWrap: function(e) {
			var alignType,
				transverse,
				data,
				url,
				vertical;
			setWordWrap('1');
			selectState.update('wordWrap');
		}
	});
	return WordWrapContainer;
});