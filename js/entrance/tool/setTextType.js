define(function(require) {
	'use strict';

	var $ = require('lib/jquery'),
		Backbone = require('lib/backbone'),
		send = require('basic/tools/send'),
		cells = require('collections/cells'),
		config = require('spreadsheet/config'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		textTypeHandler;

	textTypeHandler = {
		setText: function(label) {
			var self = this,
				text;
			cells.operateCellByDisplayName('1', label, function(cell) {
				text = cell.get("content").texts;
				cell.set("customProp.format", "text");
				cell.set("customProp.decimal", 'null');
				cell.set("customProp.thousands", 'null');
				cell.set("customProp.dateFormat", 'null');
			});
			this.sendData('text', null, null, null, label);
		},
		setNum: function(thousands, decimal, label) {
			var self = this,
				text;
			cells.operateCellByDisplayName('1', label, function(cell) {
				text = cell.get("content").texts;
				if (self.isNum(text)) {
					cell.set("customProp.format", "num");
					cell.set("customProp.decimal", decimal);
					cell.set("customProp.thousands", thousands);
					cell.set("customProp.dateFormat", 'null');
				}
			});
			this.sendData('num', decimal, thousands, null, label);
		},
		setDate: function(dateFormat, label) {
			var self = this,
				text;
			cells.operateCellByDisplayName('1', label, function(cell) {
				text = cell.get("content").texts;
				if (self.isDate(text)) {
					cell.set("customProp.format", "date");
					cell.set("customProp.decimal", 'null');
					cell.set("customProp.thousands", 'null');
					cell.set("customProp.dateFormat", dateFormat);
				}
			});
			this.sendData('date', null, null, dateFormat, label);
		},
		setPercent: function(decimal, label) {
			var self = this,
				text;
			cells.operateCellByDisplayName('1', label, function(cell) {
				text = cell.get("content").texts;
				if (self.isPercent(text)) {
					cell.set("customProp.format", "percent");
					cell.set("customProp.decimal", decimal);
					cell.set("customProp.thousands", false);
					cell.set("customProp.dateFormat", 'null');
				}
			});
			this.sendData('percent', decimal, false, null, label);
		},

		setCoin: function(decimal, label) {
			var self = this,
				text;
			cells.operateCellByDisplayName('1', label, function(cell) {
				text = cell.get("content").texts;
				if (self.isCoin(text)) {
					cell.set("customProp.format", "coin");
					cell.set("customProp.decimal", decimal);
					cell.set("customProp.thousands", true);
					cell.set("customProp.dateFormat", 'null');
				}
			});
			this.sendData('coin', decimal, true, null, label);
		},
		sendData: function(format, decimal, thousands, dateFormat, label) {
			var region = cells.analysisLabel(label);
			send.PackAjax({
				url: 'text.htm?m=date_format',
				data: JSON.stringify({
					excelId: window.SPREADSHEET_AUTHENTIC_KEY,
					sheetId: '1',
					startRowAlais: headItemRows.models[region.startRowIndex].get('alias'),
					endRowAlais: headItemRows.models[region.endRowIndex].get('alias'),
					startColAlais: headItemCols.models[region.startColIndex].get('alias'),
					endColAlais: headItemCols.models[region.endColIndex].get('alias'),
					format: format,
					decimalPoint: decimal || 0,
					thousandPoint: thousands || false,
					currencySymbol: '¥',
					dateFormat: dateFormat || ''
				})
			});
		},
		//ps:空格问题
		isNum: function(value) {
			var values,
				tail,
				head,
				reHead,
				reTail;

			values = value.split('.');
			if (values.length > 2) {
				return false;
			}
			if (values.length === 2) {
				if (values[1] === "" && values[0] === "") return false;
				tail = values[1];
				reTail = /^\d*$/g;
				if (!reTail.test(tail)) return false;
			}
			head = values[0];
			if (head.indexOf("+") === 0 || head.indexOf("-") === 0) {
				head = head.substring(1);
			}
			reHead = /^\d{1,3}(,\d{3})*$/g;
			if (!reHead.test(head) && isNaN(head)) {
				return false;
			}
			return true;
		},
		getFormatNumber: function(value, thousands, decimal) {
			var i = 0,
				len,
				head,
				heads,
				numList,
				remainder,
				tail = "",
				temp = "",
				sign = "", //正负号
				values;
			if (!this.isNum(value) || value === "") return value;
			values = value.split(".");
			head = values[0];
			//去除符号
			if ((head.indexOf("-") === 0 && (sign = "-")) || head.indexOf("+") === 0) {
				head = head.substring(1);
			}
			//输入数据已存在千分位，需要先去掉千分位
			if (head.indexOf(",") !== -1) {
				heads = head.split(",");
				head = "";
				for (temp in heads) {
					head += heads[temp];
				}
			}
			if (thousands === true) { //输出数据存在千分位
				len = Math.ceil(head.length / 3);
				remainder = head.length % 3 > 0 ? head.length % 3 : 3;
				temp = head;
				head = "";
				//ps:问题
				for (i = len - 1; i > -1; i--) {
					if (i === 0) {
						// remainder = remainder > 0 ? remainder : 3;
						head = temp.substring(0, remainder) + head;
					} else {
						head = "," + temp.substring(3 * (i - 1) + remainder, 3 * i + remainder) + head;
					}
				}
			}
			if (head === undefined || head === "") head = "0";
			if (decimal === undefined) decimal === 2;
			if (decimal > 0) {
				if (decimal > 30) decimal = 30;
				head += ".";
				if (values.length > 1) {
					tail = values[1];
				}
				if (tail.length >= decimal) {
					tail = tail.substring(0, decimal);
				} else {
					for (i = tail.length; i < decimal; i++) {
						tail += "0";
					}
				}
			}
			if (decimal < 0 && values.length > 1) {
				head += ".";
				tail = values[1];
			}
			return sign + head + tail;
		},
		isDate: function(value) {
			var regularLine = /^\d{4}(-\d{1,2}(-\d{1,2})?)?$/,
				regularWord = /^\d{4}\u5e74(\d{1,2}\u6708(\d{1,2}\u65e5)?)?$/,
				year,
				month,
				day,
				len,
				date;
			if (!regularLine.test(value) && !regularWord.test(value)) {
				return false;
			}
			year = value.match(/\d{4}/)[0];

			month = value.match(/(-|\u5e74)\d{1,2}(-|\u6708)/);
			if (month !== null) {
				month = month[0].substring(1, month[0].length - 1);
			}
			day = value.match(/\d{1,2}\u65e5/);
			if (day !== null) {
				day = day[0].substring(0, day[0].length - 1);
			}

			date = new Date(year + "/" + (month || "01") + "/" + (day || "01"));
			var t = date.getFullYear();
			if (parseInt(year) !== date.getFullYear()) {
				return false;
			}
			if (month !== null && parseInt(month) !== date.getMonth() + 1) {
				return false;
			}
			if (day !== null && parseInt(day) !== date.getDate()) {
				return false;
			}
			return true;
		},
		getFormatDate: function(value, formatType) {
			var year,
				month,
				day,
				result;
			if (!this.isDate(value) || value === "") return value;
			year = value.match(/\d{4}/)[0];
			month = value.match(/(-|\u5e74)\d{1,2}(-|\u6708)/);
			if (month !== null) {
				month = month[0].substring(1, month[0].length - 1);
			} else {
				month = "01";
			}
			day = value.match(/\d{1,2}\u65e5/);
			if (day !== null) {
				day = day[0].substring(0, day[0].length - 1);
			} else {
				day = "01";
			}
			switch (formatType) {
				case config.dateFormatType.frist:
					result = year + '-' + month + '-' + day;
					break;
				case config.dateFormatType.second:
					result = year + '-' + month;
					break;
				case config.dateFormatType.third:
					result = year;
					break;
				case config.dateFormatType.fourth:
					result = year + '年' + month + '月' + day + '日';
					break;
				case config.dateFormatType.fifth:
					result = year + '年' + month + '月';
					break;
				case config.dateFormatType.sixth:
					result = year + '年';
					break;
				default:
					result = value;
					break;
			}
			return result;
		},
		isCoin: function(value) {
			if (value.charAt(0) === "¥") {
				value = value.substring(1, value.length);
			}
			return this.isNum(value);
		},
		getFormatCoin: function(value, decimal) {
			var temp = value;
			if (value === "") return value;
			if (this.isCoin(value)) {
				if (value.charAt(0) === "¥") {
					value = value.substring(1, value.length);
				}
				return "¥" + this.getFormatNumber(value, true, decimal);
			}
			return temp;
		},
		isPercent: function(value) {
			if (value.charAt(value.length - 1) === "%") {
				value = value.substring(0, value.length - 1);
			}
			return this.isNum(value);
		},
		getFormatPercent: function(value, decimal) {
			var temp = value;
			if (value === "") return value;
			if (value.charAt(value.length - 1) === "%") {
				value = value.substring(0, value.length - 1);
				if (this.isNum(value)) {
					value = this.getFormatNumber(value, false, decimal);
					return value + '%';
				}
			} else {
				if (this.isNum(value)) {
					value = (parseInt(value) * 100).toString();
					value = this.getFormatNumber(value, false, decimal);
					return value + '%';
				}
			}

			return temp;
		}
	}

	return textTypeHandler;
});