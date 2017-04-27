'use strict';
define(function() {
	var historyList = [{}],
		historyIndex = 0,
		history;

	history = {
		next: function() {
			if (historyIndex === historyList.length - 1) {
				return false;
			}
			return historyList[++historyIndex];
		},
		previous: function() {
			if (historyIndex === 0) {
				return false;
			}
			return historyList[historyIndex--];
		},
		/**
		 * 添加设置属性操作
		 * @param {string} propName     属性名
		 * @param {string} propValue    属性值
		 * @param {object} region       操作区域
		 * @param {string} newData      新数据
		 * @param {object} originalData 原始数据
		 */
		addUpdateAction: function(propName, propValue, region, originalData) {
			historyList = historyList.slice(0, historyIndex + 1);
			historyList.push({
				type: 'update',
				propName: propName,
				propValue: propValue,
				region:region,
				originalData: originalData,
			});
			historyIndex++;
		},
		/**
		 * 添加设置model覆盖操作
		 * @param {array} currentModelIndexs      新单元格索引数组
		 * @param {array} originalModelIndexs 原始单元格索引数组
		 */
		addCoverAction: function(currentModelIndexs, originalModelIndexs) {
			historyList = historyList.slice(0, historyIndex + 1);
			historyList.push({
				type: 'cover',
				currentModelIndexs: currentModelIndexs,
				originalModelIndexs: originalModelIndexs,
			});
			historyIndex++;
		},
		/**
		 * 清除历史
		 */
		clear:function(){
			historyIndex = 0;
			historyList=[];
		}
	};
	return history;
});