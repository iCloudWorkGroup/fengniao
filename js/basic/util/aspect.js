define(function() {
	'use strict';
	var aspect = {
		before: function(target, methodName, filter) {
			return this._aspect('before', target, methodName, filter);
		},
		after: function(target, methodName, filter) {
			return this._aspect('after', target, methodName, filter);
		},
		_aspect: function(type, target, methodName, filter) {
			var fn,
				result,
				orignal,
				self = this;

			if (typeof target === 'function') {
				fn = target;
				target = null;
				filter = methodName;
			} else {
				fn = target[methodName];
			}
			orignal = fn.orignal || fn;

			orignal[type] = orignal[type] || [];

			orignal[type].push(filter);

			if (orignal === fn) {
				if (target) {
					result = target[methodName] = function() {
						return self._execute(arguments, target, orignal);
					};
				} else {
					result = function() {
						return self._execute(arguments, target, orignal);
					};
				}
			} else {
				result = fn;
			}
			result.orignal = orignal;
			return result;
		},
		_execute: function(args, target, orignal) {
			var i, len, befores, afters;
			befores = orignal.before || [];
			afters = orignal.after || [];
			for (i = 0, len = befores.length; i < len; i++) {
				if (!befores[i].apply(target, args)) {
					return false;
				}
			}
			orignal.apply(target, args);
			for (i = afters.length - 1; i > -1; i--) {
				if (!afters[i].apply(target, args)) {
					return false;
				}
			}
			return true;
		}
	};
	return aspect;
});