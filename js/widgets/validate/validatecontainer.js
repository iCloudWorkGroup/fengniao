define(function(require) {
	'use strict';
	var Backbone = require('lib/backbone'),
		validate = require('entrance/tool/validate'),
		ValidateContainer;

	ValidateContainer = Backbone.View.extend({
		el: '#validateContainer',
		events: {
			'click .fui-section': 'action'
		},
		action: function() {
			validate.showValidateContainer();
		}
	});
	return ValidateContainer;
});