define(function() {
	'use strict';

	function text2sort(text) {
		var startColName,
			startRowName,
			endColName,
			endRowName,
			regPoint = /^\$([A-Z]+)\$([0-9]+)$/,
			regRow = /^\$([0-9]+)$/,
			regCol = /^\$([A-Z]+)$/,
			match1,
			match2,
			part1,
			part2;

		if (text.indexOf('=') === 0) {
			text = text.substring(1);
		}
		text = text.split(':');
		part1 = text[0];
		part2 = text[1];

		if (typeof part2 === 'undefined') {
			match1 = regPoint.exec(part1);
			if (!match1) {
				return;
			}
			startColName = match1[1];
			startRowName = match1[2];
			endColName = match1[1];
			endRowName = match1[2];
		} else {
			if ((match1 = regPoint.exec(part1)) && (match2 = regPoint.exec(part2))) {
				startColName = match1[1];
				startRowName = match1[2];
				endColName = match2[1];
				endRowName = match2[2];
			} else if ((match1 = regRow.exec(part1)) && (match2 = regRow.exec(part2))) {
				startColName = 'A';
				startRowName = match1[1];
				endColName = 'MAX';
				endRowName = match2[1];
			} else if ((match1 = regCol.exec(part1)) && (match2 = regCol.exec(part2))) {
				startColName = match1[1];
				startRowName = '1';
				endColName = match2[1];
				endRowName = 'MAX';
			}
		}
		if (startColName) {
			return {
				startColSort: colSignToSort(startColName),
				endColSort: colSignToSort(endColName),
				startRowSort: rowSignToSort(startRowName),
				endRowSort: rowSignToSort(endRowName)
			}
		} else {
			return;
		}

		function colSignToSort(sign) {
			if (sign === 'MAX') {
				return sign;
			}
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
			if (sign === 'MAX') {
				return sign;
			}
			return parseInt(sign) - 1;
		}
	}
	return text2sort;
});