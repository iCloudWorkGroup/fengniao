'use strict';
define(function() {
	/**
	 * 将第三方使用者传入label转为对应sort坐标值
	 * @param  {array/string} label 标签
	 * @return {object} 索引对象
	 */
	var analysisLabel = function(regionLabel) {
		var temp,
			reg = /^[A-Z]+[1-9]+[0-9]*$/,
			startColSort, //后台Excel对象存储的正确索引值
			endColSort,
			startRowSort,
			endRowSort,
			startColDisplayName,
			startRowDisplayName,
			endColDisplayName,
			endRowDisplayName;


		//解析
		if (regionLabel instanceof Array) {
			//判断数组长度
			if (regionLabel.length !== 2) {
				throw new Error('Parameter format error');
			}
			//匹配数据格式
			if (!reg.test(regionLabel[0]) && !reg.test(regionLabel[1])) {
				throw new Error('Parameter format error');
			}

			startColDisplayName = getDisplayName(regionLabel[0], 'col');
			startRowDisplayName = getDisplayName(regionLabel[0], 'row');
			endColDisplayName = getDisplayName(regionLabel[1], 'col');
			endRowDisplayName = getDisplayName(regionLabel[1], 'row');

			startColSort = colSignToSort(startColDisplayName);
			endColSort = colSignToSort(endColDisplayName);
			startRowSort = rowSignToSort(startRowDisplayName);
			endRowSort = rowSignToSort(endRowDisplayName);

		} else if (/^[A-Z]+$/.test(regionLabel)) { //整列操作
			startRowSort = 0;
			endRowSort = -1;
			startColSort = endColSort = colSignToSort(regionLabel);

		} else if (/^[1-9]+[0-9]*$/.test(regionLabel)) { //整行操作
			startColSort = 0;
			endColSort = -1;
			startRowSort = endRowSort = rowSignToSort(regionLabel);

		} else if (reg.test(regionLabel)) {
			startRowDisplayName = getDisplayName(regionLabel, 'row');
			startColDisplayName = getDisplayName(regionLabel, 'col');
			startColSort = endColSort = colSignToSort(startColDisplayName);
			startRowSort = endRowSort = rowSignToSort(startRowDisplayName);
		} else {
			throw new Error('Parameter format error');
		}
		//交换位置

		if (startRowSort > endRowSort && endRowSort !== -1) {
			temp = startRowSort;
			startRowSort = endRowSort;
			endRowSort = temp;
		}
		if (startColSort > endColSort && endColSort !== -1) {
			temp = startColSort;
			startColSort = endRowSort;
			endRowSort = temp;
		}
		return {
			startRowSort: startRowSort,
			endRowSort: endRowSort,
			startColSort: startColSort,
			endColSort: endColSort
		};

		function getDisplayName(regionLabel, lineType) {
			var result = '',
				len = 0;
			if (/[A-Z]/i.test(regionLabel)) {
				len = regionLabel.match(/[A-Z]/ig).length;
			}
			if (lineType === 'col') {
				result = regionLabel.substring(0, len);
			} else if (lineType === 'row') {
				result = regionLabel.substring(len);
			}
			return result;
		}

		function colSignToSort(sign) {
			var i = 0,
				sort = 0,
				len = sign.length,
				letter = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
				index;
			for (; i < len; i++) {
				index = letter.indexOf(sign[i]) + 1;
				sort += index * (Math.pow(26, (len - i - 1)));
			}
			return sort - 1;
		}

		function rowSignToSort(sign) {
			return parseInt(sign) - 1;
		}
	};
	return analysisLabel;
});