define(function(require) {
	'use strict';
	var Backbone = require('lib/backbone'),
		config = require('spreadsheet/config'),
		cache = require('basic/tools/cache'),
		send = require('basic/tools/send'),
		original = require('basic/tools/original'),
		observerPattern = require('basic/util/observer.pattern'),
		strandMap = require('basic/tools/strandmap'),
		cols = require('collections/headItemCol'),
		rows = require('collections/headItemRow'),
		cells = require('collections/cells'),
		colList = cols.models,
		rowList = rows.models,
		index2Type = [],
		validate;


	index2Type[config.validationType.intType] = 'intType';
	index2Type[config.validationType.decimalType] = 'decimalType';
	index2Type[config.validationType.sequenceType] = 'sequenceType';
	index2Type[config.validationType.textType] = 'textType';


	validate = {
		validate: function(value, colAlias, rowAlias, colIndex, rowIndex) {
			var ruleIndex = strandMap.calcPointRecord(colAlias, rowAlias, 'validate'),
				validators,
				rule, i, len;

			validators = {
				intType: [intTypeValidator, rangeValidator],
				decimalType: [decimalTypeValidator, rangeValidator],
				textType: [intTypeValidator, lenValidator],
				sequenceType: [sequenceValidator]
			};

			//未输入数据或不存在规则
			if (value === '' || typeof ruleIndex === 'undefined') {
				return true;
			}

			rule = cache.validate[ruleIndex];

			if (rule) {
				validators = validators[index2Type[rule.validationType]];
				for (i = 0, len = validators.length; i < len; i++) {
					if (!validators[i](value, rule.formula1, rule.formula2)) {
						return false;
					}
				}
			} else {
				return getSequence(value, {
					oprCol: colList[colIndex].get('sort'),
					oprRow: rowList[rowIndex].get('sort'),
				});
			}
			return true;

			function intTypeValidator(value) {
				var reg = /^([-]){0,1}[0-9]*$/;
				return reg.test(value);
			}

			function decimalTypeValidator(value) {
				var reg = /^([-]){0,1}[0-9]+(.[0-9]*)?$/;
				return reg.test(value);
			}

			function rangeValidator(value, formula1, formula2) {
				value = parseFloat(value);
				if (value < parseFloat(formula1) || value > parseFloat(formula2)) {
					return false;
				}
				return true;
			}

			function lenValidator(value, formula1, formula2) {
				if (value.length < parseFloat(formula1) || value.length > parseFloat(formula2)) {
					return false;
				}
				return true;
			}

			function sequenceValidator(value, formula1) {
				var arrValidate = [],
					cellList,
					len, i;

				if (typeof formula1 === 'object') {
					cellList = cells.getCellByVertical(cols.getIndexByAlias(formula1.startColAlias),
						rows.getIndexByAlias(formula1.startRowAlias),
						cols.getIndexByAlias(formula1.endColAlias),
						rows.getIndexByAlias(formula1.endRowAlias)
					);
					for (i = 0, len = cellList.length; i < len; i++) {
						arrValidate.push(cellList[i].get('content').texts);
					}
				} else {
					arrValidate = formula1.split(',');
				}

				for (i = 0, len = arrValidate.length; i < len; i++) {
					if (arrValidate[i] === value) {
						return true;
					}
				}
				return false;
			}
			function getSequence(value, region) {
				var result = false;
				send.PackAjax({
					url: config.url.sheet.validateFull,
					async: false,
					isPublic: false,
					data: JSON.stringify(region),
					success: function(data) {
						var rule = data.rule,
							list = data.expResult;

						rule.index = data.index;
						original.analysisValidateRule({
							rule: rule
						});
						for (i = 0, len = list.length; i < len; i++) {
							if (list[i] === value) {
								result = true;
								break;
							}
						}
					}
				});
				return result;
			}
		},
		showValidateContainer: function() {
			Backbone.trigger('event:sidebarContainer:show', 'validate');
		},
		deleteRowUpdateRule: function(alias, index) {
			var arr = strandMap.getTransverseRecord(alias, 'sourceToRuleIndex'),
				rule,
				formula1,
				len, i;

			for (i = 0, len = arr.length; i < len; i++) {
				rule = cache.validate[arr[i]];
				if (rule) {
					formula1 = rule.formula1;
					if (formula1.startRowAlias !== formula1.endRowAlias) {
						if (formula1.startRowAlias === alias) {
							formula1.startRowAlias = rowList[index + 1].get('alias');
						} else {
							formula1.endRowAlias = rowList[index - 1].get('alias');
						}
					}
				}
			}
		},

		deleteColUpdateRule: function(alias, index) {
			var arr = strandMap.getVerticalRecord(alias, 'sourceToRuleIndex'),
				rule,
				formula1,
				len, i;

			for (i = 0, len = arr.length; i < len; i++) {
				rule = cache.validate[arr[i]];
				if (rule) {
					formula1 = rule.formula1;
					if (formula1.startColAlias !== formula1.endColAlias) {
						if (formula1.startColAlias === alias) {
							formula1.startColAlias = colList[index + 1].get('alias');
						} else {
							formula1.endColAlias = colList[index - 1].get('alias');
						}
					}
				}
			}
		},
		init: function() {
			observerPattern.buildSubscriber(this);
			this.subscribe('validate', 'deleteColPublish', 'deleteColUpdateRule');
			this.subscribe('validate', 'deleteRowPublish', 'deleteRowUpdateRule');
		}
	};
	validate.init();
	return validate;
});