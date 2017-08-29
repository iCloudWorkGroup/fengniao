define(function(require) {
	'use strict';
	var Backbone = require('lib/backbone'),
		getTemplate = require('basic/tools/template'),
		listener = require('basic/util/listener'),
		preventContainer;

	preventContainer = Backbone.View.extend({
		events: {
			'click button': 'confirm',
			'click .close': 'close'
		},
		initialize: function() {
			listener.addEventListener('selectRegionChange', this.changeSelect);
		},
		render: function() {
			var template = getTemplate('PREVENTCONTAINER');
			this.$el.html(template());
			return this;
		},

		changeSelect: function(model) {
			var content;

			// console.log(model.point);
			// content
			// this.$el.find('input').val();
		},
		parseText: function(point) {
			var col = point.col,
				row = point.row,
				text = '';
			//整行操作
			if (col.length = 2 && ) {

			}
			//整列操作
		}
		confirm: function() {

		},
		close: function() {
			this.destory();
		},
		destory: function() {
			listener.removeEventListener('selectRegionChange', this.changeSelect);
		}
	});

	return preventContainer;
});