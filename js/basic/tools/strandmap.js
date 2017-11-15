'use strict';
define(function() {
	var colPos = {},
		rowPos = {},
		operate,
		max = 'MAX';

	operate = {
		/**
		 * 点位置信息对应的属性进行缓存
		 * @param  {string} colAlias 列别名 
		 * @param  {string} rowAlias 行别名
		 * @param  {string} type     类型
		 * @param  {string/index} value  缓存值
		 */
		addPointRecord: function(colAlias, rowAlias, type, value) {
			this._addPointRecord(colAlias, rowAlias, colPos, type, value);
			this._addPointRecord(rowAlias, colAlias, rowPos, type, value);
		},
		getPointRecord: function(colAlias, rowAlias, type) {
			var temp;
			if (colPos[colAlias] && (temp = colPos[colAlias][rowAlias])) {
				if (typeof type !== 'undefined' && typeof temp[type] !== 'undefined') {
					return temp[type];
				} else {
					return temp;
				}
			}
			return;
		},
		deletePointRecord: function(colAlias, rowAlias, type) {
			var temp;
			if (type) {
				if (colPos[colAlias] && (temp = colPos[colAlias][rowAlias])) {
					delete temp[type];
					temp = rowPos[rowAlias][colAlias];
					delete temp[type];
				}
			} else {
				if (temp = colPos[colAlias]) {
					delete temp[rowAlias];
				}
				if (temp = rowPos[rowAlias]) {
					delete temp[colAlias];
				}
			}
		},

		/**
		 * 获取点位置信息对应的属性值
		 * @param  {string} colAlias 列别名
		 * @param  {string} rowAlias 行别名
		 * @param  {string} type     类型
		 * @return {string/index}          属性值
		 */
		calcPointRecord: function(colAlias, rowAlias, type) {
			var temp;
			if (colPos[colAlias] && (temp = colPos[colAlias][rowAlias])) {
				if (typeof temp[type] !== 'undefined') {
					return temp[type];
				}
			}
			if (colPos[colAlias] && (temp = colPos[colAlias][max])) {
				if (typeof temp[type] !== 'undefined') {
					return temp[type];
				}
			}
			if (rowPos[rowAlias] && (temp = rowPos[rowAlias][max])) {
				if (typeof temp[type] !== 'undefined') {
					return temp[type];
				}
			}
			return;
		},
		getVerticalRecord: function(colAlias) {
			var result = [],
				key,
				temp;

			if ((temp = colPos[colAlias])) {
				for (key in temp) {
					if (temp[key] !== undefined) {
						result.push(temp[key]);
					}
				}
			}
			return result;
		},
		getTransverseRecord: function(rowAlias) {
			var result = [],
				key,
				temp;

			if ((temp = rowPos[rowAlias])) {
				for (key in temp) {
					if (temp[key] !== undefined) {
						result.push(temp[key]);
					}
				}
			}
			return result;
		},
		addColRecord: function(colAlias, type, value) {
			this._addRecord(colAlias, colPos, rowPos, type, value);
		},
		addRowRecord: function(rowAlias, type, value) {
			this._addRecord(rowAlias, rowPos, colPos, type, value);
		},
		getColRecord: function(colAlias, type) {
			return this._getRecord(colAlias, colPos, type);
		},
		getRowRecord: function(rowAlias, type) {
			return this._getRecord(rowAlias, rowPos, type);
		},
		insertRowUpdateRecord: function(rowIndex) {
			this._insert(rowPos, rowIndex);
		},
		insertColUpdateRecord: function(colIndex) {
			this._insert(colPos, colIndex);
		},
		_addPointRecord: function(alias, reverseAlias, pos, type, value) {
			var temp;

			if (typeof value === 'undefined') {
				value = type;
				type = null;
			}
			if (!pos[alias]) {
				pos[alias] = {};
			}
			if (type) {
				if (!pos[alias][reverseAlias]) {
					temp = pos[alias][reverseAlias] = {};
				} else {
					temp = pos[alias][reverseAlias];
				}
				temp[type] = value;
			} else {
				pos[alias][reverseAlias] = value;
			}
		},
		_insert: function(pos, index) {
			var temp, key;
			for (key in pos) {
				if (temp = pos[key][max] && temp[index] >= index) {
					temp[index]++;
				}
			}
		},
		_getRecord: function(alias, pos, type) {
			var temp;
			if (!pos[alias] || !(temp = pos[alias][max]) ||
				typeof(temp = temp[type]) === undefined) {
				return;
			}
			return temp;
		},
		_getRecordList: function(pos, type) {
			var temp,
				result = {},
				key;
			for (key in pos) {
				if ((temp = pos[key][max]) && temp[type]) {
					result[key] = temp[type];
				}
			}
			return result;
		},
		_addRecord: function(alias, pos, reversePos, type, value) {
			var temp,
				recordList,
				reverseAlias;
			if (!pos[alias]) {
				pos[alias] = {};
			}
			if (!pos[alias][max]) {
				temp = pos[alias][max] = {};
			} else {
				temp = pos[alias][max];
			}

			recordList = this._getRecordList(reversePos, type);
			for (reverseAlias in recordList) {
				this._addPointRecord(alias, reverseAlias, pos, type, value);
				this._addPointRecord(reverseAlias, alias, reversePos, type, value);
			}

			for (reverseAlias in pos[alias]) {
				if (reverseAlias !== max) {
					this._addPointRecord(alias, reverseAlias, pos, type, value);
					this._addPointRecord(reverseAlias, alias, reversePos, type, value);
				}
			}
			temp[type] = value;
		}
	};
	return operate;
});