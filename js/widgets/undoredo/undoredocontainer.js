	define(function(require) {
		'use strict';
		var $ = require('lib/jquery'),
			cache = require('basic/tools/cache'),
			Backbone = require('lib/backbone'),
			done = require('entrance/sheet/redoundo');

		/**
		 * 剪切板视图类
		 * @author ray wu
		 * @since 0.1.0
		 * @class ShearPlateContainer  
		 * @module views
		 * @extends Backbone.View
		 * @constructor
		 */
		var undoredoContainer = Backbone.View.extend({
			/**
			 * 绑定视图
			 * @property el
			 * @type {String}
			 */
			el: "#undoredoContainer",
			events: {
				'click span[data-toolbar]': 'undoRedo'
			},
			undoRedo: function(e) {
				var action;
				action = $(e.currentTarget).data('toolbar');
				switch (action) {
					case 'redo':
						done.redo();
						break;
					case 'undo':
						done.undo();
						break;
					default:
						break;
				}
			}
		});
		return undoredoContainer;
	});