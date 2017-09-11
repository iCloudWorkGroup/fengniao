'use strict';
define(function(require) {
	var Backbone = require('lib/backbone'),
		selectRegions = require('collections/selectRegion'),
		operation;

	operation = {
		setDataSourceState: function() {
			Backbone.trigger('event:cellsContainer:setMouseState', 'locatedState' , 'dataSourceLocatedState');
		},
		setSelectState: function() {
			Backbone.trigger('event:cellsContainer:setMouseState', 'locatedState' , 'selectLocatedState');
		},
		destroyDataSoure: function() {
			if (selectRegions.getModelByType('datasource') !== undefined) {
				selectRegions.getModelByType('datasource').destroy();
			}
		}
	};
	return operation;
});