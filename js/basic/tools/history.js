'use strict';
define(function() {
	var historyList = [],
		historyIndex = -1,
		history;

	history = {
		next: function() {
			if (historyIndex === historyList.length - 1) {
				return false;
			}
			return historyList[++historyIndex];
		},
		previous: function() {
			var result;
			if (historyList.length === 0) {
				return false;
			}
			result = historyList[historyIndex--];
			return result;
		},
		addAction: function(obj) {
			historyList = historyList.slice(0, historyIndex + 1);
			historyList.push(obj);
			historyIndex = historyList.length - 1;
		},
		/**
		 * 添加设置属性操作
		 * @param {string} propName     属性名
		 * @param {string} propValue    属性值
		 * @param {object} region       操作区域
		 * @param {string} newData      新数据
		 * @param {object} originalData 原始数据
		 */
		getCellPropUpdateAction: function(propName, propValue, region, originalData) {
			return {
				region: region,
				type: 'updateCellProp',
				propName: propName,
				propValue: propValue,
				originalData: originalData
			};
		},
		/**
		 * 添加设置model覆盖操作
		 * @param {array} currentModelIndexs      新单元格索引数组
		 * @param {array} originalModelIndexs 原始单元格索引数组
		 */
		getCellCoverAction: function(currentModelIndexs, originalModelIndexs) {
			return {
				type: 'coverCellModel',
				currentModelIndexs: currentModelIndexs,
				originalModelIndexs: originalModelIndexs,
			};
		},
		getValidateUpdateAction: function(region, currentRuleIndex, originalData) {
			return {
				type: 'updateValidateRule',
				region: region,
				currentRuleIndex: currentRuleIndex,
				originalData: originalData
			};
		},
		getValidateCoverAction: function(currentData, originalData) {
			return {
				type: 'coverValidateRule',
				currentData: currentData,
				originalData: originalData
			};
		},
		/**
		 * 清除历史
		 */
		clear: function() {
			historyIndex = 0;
			historyList = [];
		}
	};
	return history;
});