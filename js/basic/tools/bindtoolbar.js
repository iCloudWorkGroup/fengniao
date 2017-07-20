define(function(require) {
	'use strict';
	var cache = require('basic/tools/cache'),
		selects = require('collections/selectRegion'),
		colGrids = require('collections/headItemCol'),
		rowGrids = require('collections/headItemRow'),
		cells = require('collections/cells'),
		$ = require('lib/jquery'),
		Model = require('models/cell');

	var subscriber = {};

	var command = {
		on: function(node, value) {
			if (value) {
				$(node).addClass('on');
			} else {
				$(node).removeClass('on');
			}
		},
		select: function(node, value) {
			var childList = node.childNodes,
				node, sign,
				len, i;
			for (i = 0, len = childList.length; i < len; i++) {
				node = childList[i];
				if (node.nodeType === 1) {
					sign = node.getAttribute('select-on');
					if (sign) {
						if (sign === value) {
							$(node).addClass('on');
						} else {
							$(node).removeClass('on');
						}
					}
				}
			}
		},
		merge: function(node, value) {
			var modelJSON,
				startCol,
				startRow,
				endCol,
				endRow,
				cellList,
				flag = false,
				occupy, len, i;

			if (typeof value === 'undefined') {
				modelJSON = selects.getModelByType('selected').toJSON();
				startCol = colGrids.getIndexByAlias(modelJSON.wholePosi.startX);
				startRow = rowGrids.getIndexByAlias(modelJSON.wholePosi.startY);
				endCol = colGrids.getIndexByAlias(modelJSON.wholePosi.endX);
				endRow = rowGrids.getIndexByAlias(modelJSON.wholePosi.endY);
				cellList = cells.getCellByVertical(startCol, startRow, endCol, endRow);

				for (i = 0, len = cellList.length; i < len; i++) {
					occupy = cellList[i].get('occupy');
					if (occupy.x.length > 1 || occupy.y.length > 1) {
						flag = true;
						break;
					}
				}
			} else {
				flag = value;
			}

			if (flag) {
				$(node).addClass('on');
			} else {
				$(node).removeClass('on');
			}
		}
	};
	var bind = {
		init: function(id) {
			var container = $('#' + id).get(0),
				self = this;

			recursionNode(container);

			this.initSelect();

			function recursionNode(node) {
				var childList,
					len, i;
				if (node.nodeType !== 1) {
					return;
				}
				self._subscribe(node);
				childList = node.childNodes;
				for (i = 0, len = childList.length; i < len; i++) {
					recursionNode(childList[i]);
				}
			}
		},
		initSelect: function() {
			var modelJSON,
				startCol = 0,
				startRow = 0,
				model,
				value,
				self = this;

			// modelJSON = selects.getModelByType('selected').toJSON();
			// startCol = colGrids.getIndexByAlias(modelJSON.wholePosi.startX);
			// startRow = rowGrids.getIndexByAlias(modelJSON.wholePosi.startY);

			cache.selectRecord.newValue = {
				col: 0,
				row: 0
			};
			model = cells.getCellByVertical(startCol, startRow)[0];

			if (!model) {
				value = Model.prototype.defaults;
			} else {
				value = model.toJSON();
			}

			this._publish('merge');

			recursion(value);

			function recursion(value) {
				var prop;
				for (prop in value) {
					if (typeof value[prop] === 'object') {
						recursion(value[prop], value[prop]);
					} else {
						if (value[prop]) {
							self._publish(prop, value[prop]);
						}
					}
				}
			}
		},
		_subscribe: function(node) {
			var attrs = node.attributes,
				attr, type, value,
				i, len;
			for (i = 0, len = attrs.length; i < len; i++) {
				attr = attrs[i];
				if (attr.nodeName.indexOf('bind-') === 0) {
					type = attr.nodeName.substring(5);
					value = attr.nodeValue;
					if (command[type]) {
						subscriber[value] = subscriber[value] || [];
						subscriber[value].push({
							node: node,
							callback: command[type]
						});
					}
				}
			}
		},
		_publish: function(prop, value) {
			var len, i, arr;
			if (subscriber[prop]) {
				arr = subscriber[prop];
				for (i = 0, len = arr.length; i < len; i++) {
					arr[i].callback(arr[i].node, value);
				}
			}
		},
		digest: function() {
			var newPosi = cache.selectRecord.newPosi,
				oldPosi = cache.selectRecord.oldPosi,
				newModel,
				oldModel,
				newValue,
				oldValue,
				self = this;

			this._publish('merge');

			newModel = cells.getCellByVertical(colGrids.getIndexBySort(newPosi.col), rowGrids.getIndexBySort(newPosi.row))[0];
			oldModel = cells.getCellByVertical(colGrids.getIndexBySort(oldPosi.col), rowGrids.getIndexBySort(oldPosi.row))[0];
			if (newModel) {
				newValue = newModel.attributes;
			} else {
				newValue = Model.prototype.defaults;
			}
			if (oldModel) {
				oldValue = oldModel.attributes;
			} else {
				oldValue = Model.prototype.defaults;
			}
			if (newValue === oldValue) {
				return;
			}
			compare(newValue, oldValue);

			function compare(newValue, oldValue) {
				var prop;
				for (prop in newValue) {
					if (typeof newValue[prop] === 'object') {
						compare(newValue[prop], oldValue[prop]);
					} else {
						if (newValue[prop] !== oldValue[prop]) {
							self._publish(prop, newValue[prop]);
						}

					}
				}
			}
		},
		update: function(attr) {
			var model,
				attrs,
				self = this,
				posi = cache.selectRecord.newPosi;

			model = cells.getCellByVertical(colGrids.getIndexBySort(posi.col), rowGrids.getIndexBySort(posi.row))[0];
			if (model) {
				attrs = model.attributes;
			} else {
				attrs = Model.prototype.defaults;
			}

			if(attr === 'merge'){
				self._publish(attr);
				return;
			}
			recursion(attrs);

			function recursion(attrs) {
				var modelAttr;
				for (modelAttr in attrs) {
					if (typeof attrs[modelAttr] === 'object') {
						recursion(attrs[modelAttr]);
					} else {
						if (modelAttr === attr) {
							self._publish(modelAttr, attrs[modelAttr]);
						}
					}
				}
			}
		}
	}
	return bind;
});