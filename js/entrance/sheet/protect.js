define(function(require) {
	'use strict';

	var Backbone = require('lib/backbone'),
		ProtectItemContainer = require('views/protectitemcontainer'),
		protect;

	protect = {
		addLock: function() {
			Backbone.trigger('event:siderbarContainer:show', 'prevent');
		},
		removeLock: function() {

		},
		execute: function() {

		},
		cancel: function() {

		}
	}
});