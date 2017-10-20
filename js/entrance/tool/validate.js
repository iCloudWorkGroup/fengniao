define(function(require) {
	'use strict';
	var Backbone = require('lib/backbone'),
		cache = require('basic/tools/cache'),
		strandMap = require('basic/tools/strandmap'),
		validate;

	validate = {
		validate: function(col, row, value) {
			var ruleIndex = strandMap.calcPointRecord(col, row, 'validate'),
				rule;

			if (value === '') {
				return true;
			}
			rule = cache.validate[ruleIndex];

			if (typeof rule !== 'undefined') {
				if (!this._typeValidate(value, rule.validationType)) {
					return false;
				}
				switch (rule.validationType) {
					case 1:
					case 2:
						if (!this._betweenness(value, rule.formula1, rule.formula2)) {
							return false;
						}
						break;
					case 6:
						if (!this._limitLen(value, rule.formula1, rule.formula2)) {
							return false;
						}
						break;
				}
			}
			return true;
		},
		_typeValidate: function(value, validationType) {
			var regulars = [],
				temp;

			regulars[1] = /^([-]){0,1}[0-9]*$/;
			regulars[2] = /^([-]){0,1}[0-9]+(.[0-9]*)?$/;

			if (typeof(temp = regulars[validationType]) !== 'undefined' &&
				!temp.test(value)) {
				return false;
			}
			return true;
		},
		_betweenness: function(value, min, max) {
			value = parseFloat(value);
			if (value > parseFloat(max) || value < parseFloat(min)) {
				return false;
			}
			return true;
		},
		_limitLen: function(value, min, max) {
			if (value.length > parseFloat(max) || value.length < parseFloat(min)) {
				return false;
			}
			return true;
		},
		showValidateContainer: function() {
			Backbone.trigger('event:sidebarContainer:show', 'validate');
		}
	};

	return validate;
});