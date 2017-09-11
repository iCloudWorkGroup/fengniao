'use strict';
define(function(require) {
	var Backbone = require('lib/backbone'),
		selectRegions = require('collections/selectRegion'),
		operation;

	operation = {
		setDataSourceState: function() {
			Backbone.trigger('event:cellsContainer:setMouseState', 'locatedState' , 'dataSourceLocatedState');
			Backbone.trigger('event:colsHeadContainer:setMouseState', 'locatedState' , 'dataSourceLocatedState');
			Backbone.trigger('event:rowsHeadContainer:setMouseState', 'locatedState' , 'dataSourceLocatedState');
		},
		setSelectState: function() {
			Backbone.trigger('event:cellsContainer:setMouseState', 'locatedState' , 'selectLocatedState');
			Backbone.trigger('event:colsHeadContainer:setMouseState', 'locatedState' , 'selectLocatedState');
			Backbone.trigger('event:rowsHeadContainer:setMouseState', 'locatedState' , 'selectLocatedState');
		},
		destroyDataSoure: function() {
			if (selectRegions.getModelByType('datasource') !== undefined) {
				selectRegions.getModelByType('datasource').destroy();
			}
		}
	};
	return operation;
});