define(function(require) {
	'use strict';
	var $ = require('lib/jquery'),
		Backbone = require('lib/backbone'),
		getTemplate = require('basic/tools/template');
	/**
	 * RowsGridContainer
	 * @author ray wu
	 * @since 0.1.0
	 * @class RowsGridContainer  
	 * @module views
	 * @extends Backbone.View
	 * @constructor
	 */
	var sheetContainer = Backbone.View.extend({
		tagName: 'li',

		initialize: function(option) {
			var modelJSON = this.model.toJSON();
			this.listenTo(this.model, 'destroy', this.destroy);
			this.template = getTemplate('SHEETTEMPLATE');
			this.$el.html(this.template(modelJSON));
			if(option.active ===true){
				this.$el.addClass('active');
			}
		},
		
		render: function() {
			return this;
		},
		destroy: function() {
			this.remove();
		}
	});
	return sheetContainer;
});