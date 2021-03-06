'use strict';
define(function(require) {
	var headItemRows = require('collections/headItemRow'),
		headItemCols = require('collections/headItemCol'),
		getDisplayName = require('basic/tools/getdisplayname');

	return {
		/**
		 * 在行集合中，添加10个合法Model
		 * 在行集合中，添加10个合法Model
		 */
		buildRow: function() {
			var i = 0,
				len = 10;
			for (; i < len; i++) {
				headItemRows.add({
					sort: i,
					alias: (i + 1).toString(),
					top: i * 20,
					displayName: (i + 1).toString()
				});
			}
		},
		/**
		 * 清空行集合
		 */
		destroyRow: function() {
			headItemRows.reset();
		},
		/**
		 * 在列集合中，添加10个合法Model
		 */
		buildCol: function() {
			var i = 0,
				len = 10;
			for (; i < len; i++) {
				headItemCols.add({
					sort: i,
					alias: (i + 1).toString(),
					top: i * 72,
					displayName: getDisplayName.getColDisplayName(i)
				});
			}
		},
		/**
		 * 清空列集合
		 */
		destroyCol: function() {
			headItemCols.reset();
		}
	};
});