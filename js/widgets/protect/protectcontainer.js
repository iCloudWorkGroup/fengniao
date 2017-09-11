'use strict';
define(function(require) {
	var $ = require('lib/jquery'),
		Backbone = require('lib/backbone'),
		protect = require('entrance/tool/protect'),
		ProtectContainer;

	ProtectContainer = Backbone.View.extend({
		el: '#protectContainer',
		events: {
			'click .fui-section': 'action'
		},
		action: function(e) {
			var operate = $(e.currentTarget).data('toolbar');
			if (operate === 'lock') {
				protect.showLockContainer();
			} else if(operate === 'protect'){
				protect.showProtectContainer();
			}
		}
	});
	return ProtectContainer;
});