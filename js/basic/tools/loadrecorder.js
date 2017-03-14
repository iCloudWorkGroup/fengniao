'use strict';
define(function(require) {
	var binary = require('basic/util/binary');

	return {
		insertPosi: function(startPosi, endPosi, region) {
			var temp,
				startIndex,
				endIndex,
				startExist,
				endExist,
				startNextExist,
				endNextExist,
				newStartPosi,
				newEndPosi,
				len;

			if (startPosi > endPosi) {
				temp = startPosi;
				startPosi = endPosi;
				endPosi = temp;
			}
			startIndex = binary.indexArrayBinary(startPosi, region, 'start', 'end');
			endIndex = binary.indexArrayBinary(endPosi, region, 'start', 'end');
			startExist = binary.existArrayBinary(startPosi, region, 'start', 'end');
			endExist = binary.existArrayBinary(endPosi, region, 'start', 'end');

			newStartPosi = startExist === false ? startPosi : region[startIndex].start;
			newEndPosi = endExist === false ? endPosi : region[endIndex].end;
			//处理相邻点
			startNextExist = binary.existArrayBinary(newStartPosi - 1, region, 'start', 'end');
			endNextExist = binary.existArrayBinary(newEndPosi + 1, region, 'start', 'end');
			if (startNextExist === true) {
				startIndex = binary.indexArrayBinary(newStartPosi - 1, region, 'start', 'end');
				newStartPosi = region[startIndex].start;
				startExist = true;
			}
			if (endNextExist === true) {
				endIndex = binary.indexArrayBinary(newEndPosi + 1, region, 'start', 'end');
				newEndPosi = region[endIndex].end;
				endExist = true;
			}

			if (startIndex === endIndex) {
				if (startExist === true && endExist === true) {
					return;
				}
				len = (startExist === true || endExist === true) ? 1 : 0;
			} else {
				len = endIndex - startIndex;
				if (endExist === true) {
					len++;
				}
			}
			region.splice(startIndex, len, {
				start: newStartPosi,
				end: newEndPosi
			});
		},
		adaptPosi: function(startPosi, value, region) {
			var startIndex,
				startExist,
				i;
			startIndex = binary.indexArrayBinary(startPosi, region, 'start', 'end');
			startExist = binary.existArrayBinary(startPosi, region, 'start', 'end');

			if (startExist === true) {
				region[startIndex].end = region[startIndex].end + value;
				for (i = startIndex + 1; i < region.length; i++) {
					region[i].start += value;
					region[i].end += value;
				}
			} else {
				for (i = startIndex; i < region.length; i++) {
					region[i].start += value;
					region[i].end += value;
				}
			}
		},
		isUnloadPosi: function(startPosi, endPosi, region) {
			var startIndex,
				startExist,
				endIndex,
				endExist;

			startIndex = binary.indexArrayBinary(startPosi, region, 'start', 'end');
			startExist = binary.existArrayBinary(startPosi, region, 'start', 'end');
			endIndex = binary.indexArrayBinary(endPosi, region, 'start', 'end');
			endExist = binary.existArrayBinary(endPosi, region, 'start', 'end');

			if(startExist===false || endExist===false){
				return true;
			}
			if(startIndex!==endIndex){
				return true;
			}
			return false;
		}
	};
});