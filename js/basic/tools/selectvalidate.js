define(function(require) {
	'use strict';
	var observerPattern = require('basic/util/observer.pattern'),
		selectValidate;

	selectValidate = {
		_ruleIndex: null,
		set: function(ruleIndex) {
			if (this._ruleIndex !== ruleIndex) {
				this._ruleIndex = ruleIndex;
				this.publish('validate', 'changeRulePublish');
			}
		},
		get: function() {
			return this._ruleIndex;
		},
		addSubscriber: function(obj) {
			observerPattern.buildSubscriber(obj);
			obj.subscribe('validate', 'changeRulePublish', 'changeRule');
		}
	}
	observerPattern.buildPublisher(selectValidate);
	return selectValidate;
});