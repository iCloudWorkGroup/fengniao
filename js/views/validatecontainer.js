define(function(require) {
	'use strict';
	var Backbone = require('lib/backbone'),
		getTemplate = require('basic/tools/template'),
		selects = require('collections/selectRegion'),
		strandMap = require('basic/tools/strandmap'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		cols = require('collections/headItemCol'),
		rows = require('collections/headItemRow'),
		send = require('basic/tools/send'),
		colList = cols.models,
		rowList = rows.models,
		ValidateContainer;

	ValidateContainer = Backbone.View.extend({
		events: {
			'change select': 'changeType',
			'click .confirm': 'confirm',
			'click .cancel': 'close'
		},
		initialize: function() {
			var select = selects.getModelByType('selected');
			this.listenTo(select, 'change:wholePosi', this.listenToSelect);
		},
		render: function() {
			var template = getTemplate('VALIDATETEMPLATE');
			this.$el.html(template());

			this.select = this.$el.find('select');
			this.range = this.$el.find('.range');
			this.source = this.$el.find('.source');
			this.min = this.$el.find('.min');
			this.max = this.$el.find('.max');
			this.error = this.$el.find('.error');
			this.listenToSelect(selects.getModelByType('selected'));
			return this;
		},
		changeType: function(e) {
			var type = e.target.value;
			switch (type) {
				case 'default':
					this._toggleDefault();
					break;
				case 'intType':
					this._toggleIntType();
					break;
				case 'decimalType':
					this._toggleDecimalType();
					break;
					// case 'sequenceType':
					// 	break;
				case 'textType':
					this._toggleTextType();
					break;
				default:
					this._toggleDefault();
					break;
			}
		},
		rangeTest: function(type, min, max) {
			var rules,
				temp,
				len, i;

			rules = {
				intType: [{
					reg: /^([-]){0,1}[0-9]*$/,
					msg: '输入内容格式错误'
				}, {
					reg: /^([-]){0,1}[\s\S]{1,9}$/,
					msg: '输入内容长度不能超过9位'
				}],
				decimalType: [{
					reg: /^([-]){0,1}[0-9]+(.[0-9]*)?$/,
					msg: '输入内容格式错误'
				}, {
					reg: /^([-]){0,1}[0-9]{1,9}(.[0-9]*)?$/,
					msg: '整数位数不能超过9位'
				}, {
					reg: /^([-]){0,1}[0-9]+(.[0-9]{1,6})?$/,
					msg: '小数位数不能超过6位'
				}],
				textType: [{
					reg: /^[0-9]*$/,
					msg: '输入内容格式错误'
				}]
			}
			if (!rules[type]) {
				return true;
			}
			if (!min.length || !max.length) {
				Backbone.trigger('event:showMsgBar:show', '输入不能为空');
				return false;
			}
			if (temp = rules[type]) {
				for (i = 0, len = temp.length; i < len; i++) {
					if (!temp[i].reg.test(min) || !temp[i].reg.test(max)) {
						Backbone.trigger('event:showMsgBar:show', temp[i].msg);
						return false;
					}
				}
			}
			if (parseFloat(min) > parseFloat(max)) {
				Backbone.trigger('event:showMsgBar:show', '最大值不能小于最小值');
				return false;
			}
			return true;
		},
		sequenceTest: function() {

		},
		confirm: function() {
			var type = this.$el.find('select').val(),
				max = this.$el.find('.max').val(),
				min = this.$el.find('.min').val(),
				// source = this.$el.find('.region').val(),
				validationType,
				formula1,
				formula2,
				rule = {};

			switch (type) {
				case 'default':
					validationType = 0;
					break;
				case 'intType':
					validationType = 1;
					formula1 = min;
					formula2 = max;
					break;
				case 'decimalType':
					validationType = 2;
					formula1 = min;
					formula2 = max;
					break;
				case 'textType':
					validationType = 6;
					formula1 = min;
					formula2 = max;
					break;
				default:
					validationType = 0;
					break;
			}
			if (!this.rangeTest(type, min, max)) {
				return;
			}
			rule.validationType = validationType;
			if (formula1 !== undefined) {
				rule.formula1 = formula1;
			}
			if (formula2 !== undefined) {
				rule.formula2 = formula2;
			}
			this.insertRule(rule);
			this.destory();
		},
		insertRule: function(rule) {
			var select = selects.getModelByType('selected'),
				wholePosi = select.get('wholePosi'),
				startColIndex = cols.getIndexByAlias(wholePosi.startX),
				startRowIndex = rows.getIndexByAlias(wholePosi.startY),
				endColIndex = cols.getIndexByAlias(wholePosi.endX),
				endRowIndex = rows.getIndexByAlias(wholePosi.endY),
				rules = cache.validate,
				currentRule,
				ruleIndex,
				i, j, len, key;

			outerLoop:
				for (i = 0, len = rules.length; i < len; i++) {
					currentRule = rules[i];
					for (key in currentRule) {
						if (currentRule[key] !== rule[key]) {
							continue outerLoop;
						}
					}
					ruleIndex = i;
					break;
				}

			if (typeof ruleIndex === 'undefined') {
				ruleIndex = cache.validate.length;
				cache.validate.push(rule);
			}
			if (endColIndex === 'MAX') {
				for (i = startRowIndex; i < endRowIndex + 1; i++) {
					strandMap.addRowRecord(rowList[i].get('alias'), 'validate', ruleIndex);
				}
			} else if (endRowIndex === 'MAX') {
				for (i = startColIndex; i < endColIndex + 1; i++) {
					strandMap.addColRecord(colList[i].get('alias'), 'validate', ruleIndex);
				}
			} else {
				for (i = startColIndex; i < endColIndex + 1; i++) {
					for (j = startRowIndex; j < endRowIndex + 1; j++) {
						strandMap.addPointRecord(colList[i].get('alias'), rowList[j].get('alias'), 'validate', ruleIndex);
					}
				}
			}
			this._sendData(rule, startColIndex, startRowIndex, endColIndex, endRowIndex);
		},
		_sendData: function(rule, startColIndex, startRowIndex, endColIndex, endRowIndex) {
			var startCol = colList[startColIndex].get('sort'),
				startRow = rowList[startRowIndex].get('sort'),
				endCol = endColIndex === 'MAX' ? -1 : colList[endColIndex].get('sort'),
				endRow = endRowIndex === 'MAX' ? -1 : rowList[endRowIndex].get('sort');

			send.PackAjax({
				url: config.url.sheet.validate,
				data: JSON.stringify({
					coordinate: [{
						startCol: startCol,
						startRow: startRow,
						endRow: endRow,
						endcol: endCol
					}],
					rule: {
						formula1: rule.formula1,
						formula2: rule.formula2,
						validationType: rule.validationType
					}
				})
			});
		},
		listenToSelect: function(model) {
			var wholePosi = model.get('wholePosi'),
				existUnset = false,
				startCol,
				endCol,
				startRow,
				endRow,
				cacheRuleIndex,
				currentRuleIndex,
				rules = [],
				colAlias,
				rowAlias,
				i, j;

			startCol = cols.getIndexByAlias(wholePosi.startX);
			startRow = rows.getIndexByAlias(wholePosi.startY);
			endCol = cols.getIndexByAlias(wholePosi.endX);
			endRow = rows.getIndexByAlias(wholePosi.endY);

			if (endCol === 'MAX') {
				for (i = startRow; i < endRow + 1 && rules.length < 3; i++) {
					rowAlias = rowList[i].get('alias');
					currentRuleIndex = strandMap.getRowRecord(rowAlias, 'validate');
					if (currentRuleIndex === undefined || cache.validate[currentRuleIndex].validationType === 0) {
						existUnset = true;
					} else if (cacheRuleIndex !== currentRuleIndex) {
						rules.push(cache.validate[currentRuleIndex]);
						cacheRuleIndex = currentRuleIndex;
					}
				}
			} else if (endRow === 'MAX') {
				for (i = startCol; i < endCol + 1 && rules.length < 3; i++) {
					colAlias = colList[i].get('alias');
					currentRuleIndex = strandMap.getColRecord(colAlias, 'validate');
					if (currentRuleIndex === undefined || cache.validate[currentRuleIndex].validationType === 0) {
						existUnset = true;
					} else if (cacheRuleIndex !== currentRuleIndex) {
						rules.push(cache.validate[currentRuleIndex]);
						cacheRuleIndex = currentRuleIndex;
					}
				}
			} else {
				outerLoop: for (i = startCol; i < endCol + 1; i++) {
					for (j = startRow; j < endRow + 1; j++) {
						colAlias = colList[i].get('alias');
						rowAlias = rowList[j].get('alias');
						currentRuleIndex = strandMap.calcPointRecord(colAlias, rowAlias, 'validate');
						if (currentRuleIndex === undefined || cache.validate[currentRuleIndex].validationType === 0) {
							existUnset = true;
						} else if (cacheRuleIndex !== currentRuleIndex) {
							rules.push(cache.validate[currentRuleIndex]);
							cacheRuleIndex = currentRuleIndex;
						}
						if (rules.length > 1) {
							break outerLoop;
						}
					}
				}
			}
			this.onRule(rules, existUnset);
		},
		onRule: function(rules, existUnset) {
			if (rules.length > 1) {
				this._toggleDefault();
				this._showError(true, '选中区域内包含多种校验规则');
			} else if (rules.length === 1) {
				switch (rules[0].validationType) {
					case 0:
						this._toggleDefault();
						break;
					case 1:
						this._toggleIntType(rules[0].formula1, rules[0].formula2);
						break;
					case 2:
						this._toggleDecimalType(rules[0].formula1, rules[0].formula2);
						break;
					case 6:
						this._toggleTextType(rules[0].formula1, rules[0].formula2);
						break;
					default:
						this._toggleDefault();
						break;
				}
				if (existUnset) {
					this._showError(true, '选中区域内包含未设置校验规则单元格');
				} else {
					this._showError(false);
				}
			} else {
				this._toggleDefault();
				this._showError(false);
			}
		},
		_showError: function(flag, msg) {
			if (flag) {
				this.error.text(msg).addClass('active');
			} else {
				this.error.text(msg).removeClass('active');
			}
		},
		_toggleDefault: function() {
			this.select.val('default');
			this.range.removeClass('active');
			this.source.removeClass('active');
		},
		_toggleIntType: function(min, max) {
			this.select.val('intType');
			this.range.addClass('active');
			this.source.removeClass('active');
			this.min.val(min === undefined ? '' : min);
			this.max.val(max === undefined ? '' : max);
		},
		_toggleDecimalType: function(min, max) {
			this.select.val('decimalType');
			this.range.addClass('active');
			this.source.removeClass('active');
			this.min.val(min === undefined ? '' : min);
			this.max.val(max === undefined ? '' : max);
		},
		_toggleTextType: function(min, max) {
			this.select.val('textType');
			this.range.addClass('active');
			this.source.removeClass('active');
			this.min.val(min === undefined ? '' : min);
			this.max.val(max === undefined ? '' : max);
		},
		close: function() {
			this.destory();
		},
		destory: function() {
			this.remove();
			Backbone.trigger('event:sidebarContainer:remove');
		}
	});
	return ValidateContainer;
});