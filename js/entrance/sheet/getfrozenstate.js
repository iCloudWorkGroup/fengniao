define(function(require) {
	'use strict';
	var cache = require('basic/tools/cache'),
		getFrozenState;

		getFrozenState = function() {
			return cache.TempProp.isFrozen;
		};
	return getFrozenState;
});