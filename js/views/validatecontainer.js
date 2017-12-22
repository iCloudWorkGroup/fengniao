define(function(require) {
	'use strict';
	var Backbone = require('lib/backbone'),
		original = require('basic/tools/original'),
		history = require('basic/tools/history'),
		getTemplate = require('basic/tools/template'),
		selects = require('collections/selectRegion'),
		strandMap = require('basic/tools/strandmap'),
		selectValidate = require('basic/tools/selectvalidate'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		cols = require('collections/headItemCol'),
		rows = require('collections/headItemRow'),
		send = require('basic/tools/send'),
		text2sort = require('basic/tools/text2sort'),
		colList = cols.models,
		rowList = rows.models,
		ValidateContainer;

	ValidateContainer = Backbone.View.extend({
		events: {
			'change select': 'changeType',
			'click .confirm': 'confirm',
			'click .select-out': 'toggleSelectState',
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
			this.sourceData = this.$el.find('.source-data');
			this.sourceBtn = this.$el.find('.select-out');
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
				case 'sequenceType':
					this._toggleSequenceType();
					break;
				case 'textType':
					this._toggleTextType();
					break;
				default:
					this._toggleDefault();
					break;
			}
		},
		toggleSelectState: function() {

			this.selectSourceState = !this.selectSourceState;

			if (this.selectSourceState) {
				this.sourceBtn.addClass('on');
				this.startSelectSource();
			} else {
				this.sourceBtn.removeClass('on');
				this.endSelectSource();
			}
		},
		startSelectSource: function() {
			var select;
			selects.each(function(select) {
				if (select.get('selectType') !== 'selected') {
					select.destroy();
				}
			});

			select = selects.add({
				'selectType': 'rulesource',
				'physicsBox': {
					'width': 0,
					'height': 0,
					'top': -100,
					'left': -100,
				}
			});
			this.listenTo(select, 'change:wholePosi', this.bindSourceSelect);
			cache.mouseOperateState = config.mouseOperateState.ruleSource;
			Backbone.trigger('event:cellsContainer:setMouseState', 'locatedState', 'ruleSourceLocatedState');
			Backbone.trigger('event:colsHeadContainer:setMouseState', 'locatedState', 'ruleSourceLocatedState');
			Backbone.trigger('event:rowsHeadContainer:setMouseState', 'locatedState', 'ruleSourceLocatedState');
		},
		endSelectSource: function() {
			var select = selects.getModelByType('rulesource');

			if (select) {
				this.stopListening(select);
				select.destroy();
			}
			cache.mouseOperateState = config.mouseOperateState.select;

			Backbone.trigger('event:cellsContainer:setMouseState', 'locatedState', 'selectLocatedState');
			Backbone.trigger('event:colsHeadContainer:setMouseState', 'locatedState', 'selectLocatedState');
			Backbone.trigger('event:rowsHeadContainer:setMouseState', 'locatedState', 'selectLocatedState');
		},
		bindSourceSelect: function(model) {
			var wholePosi = model.get('wholePosi'),
				startCol,
				endCol,
				startRow,
				endRow;

			startCol = cols.getIndexByAlias(wholePosi.startX);
			startRow = rows.getIndexByAlias(wholePosi.startY);
			endCol = cols.getIndexByAlias(wholePosi.endX);
			endRow = rows.getIndexByAlias(wholePosi.endY);

			this.sourceData.val(this.parseText(
				colList[startCol].get('displayName'),
				rowList[startRow].get('displayName'),
				endCol === 'MAX' ? 'MAX' : colList[endCol].get('displayName'),
				endRow === 'MAX' ? 'MAX' : rowList[endRow].get('displayName')
			));
		},
		parseText: function(startColName, startRowName, endColName, endRowName) {
			var text = '=';
			if (endColName === 'MAX') {
				text += '$' + startRowName + ':' + '$' + endRowName;
			} else if (endRowName === 'MAX') { //整列操作
				text += '$' + startColName + ':' + '$' + endColName;
			} else {
				if ((startRowName === endRowName) && (startColName === endColName)) {
					text += '$' + startColName + '$' + startRowName;
				} else {
					text += '$' + startColName + '$' + startRowName + ':' + '$' + endColName + '$' + endRowName;
				}
			}
			return text;
		},
		inputValidator: function(type, formula1, formula2) {
			var validators,
				msg, len, i;

			validators = {
				intType: [intTypeValidator, intLenValidator, orderValidator],
				decimalType: [decimalTypeValidator, intLenValidator, decimalLenValidator, orderValidator],
				textType: [intTypeValidator, orderValidator],
				sequenceType: [sequenceValidator]
			}

			if ((validators = validators[type]) !== undefined) {
				for (i = 0, len = validators.length; i < len; i++) {
					if ((msg = validators[i](formula1, formula2)) !== undefined) {
						Backbone.trigger('event:showMsgBar:show', msg);
						return false;
					}
				}
			}
			return true;

			function intTypeValidator(formula1, formula2) {
				var reg = /^([-]){0,1}[0-9]*$/;
				if (!reg.test(formula1) || !reg.test(formula2)) {
					return '输入内容格式错误';
				}
			}

			function decimalTypeValidator(formula1, formula2) {
				var reg = /^([-]){0,1}[0-9]+(.[0-9]*)?$/;
				if (!reg.test(formula1) || !reg.test(formula2)) {
					return '输入内容格式错误';
				}
			}

			function intLenValidator(formula1, formula2) {
				formula1 = formula1.split('.')[0];
				formula2 = formula2.split('.')[0];
				if (formula1.length > 9 || formula2.length > 9) {
					return '整数位数不能超过9位';
				}
			}

			function decimalLenValidator(formula1, formula2) {
				formula1 = formula1.split('.')[1];
				formula2 = formula2.split('.')[1];
				if ((formula1 !== undefined && formula1.length > 6) ||
					(formula2 !== undefined && formula2.length > 6)) {
					return '小数位数不能超过6位';
				}
			}

			function sequenceValidator(formula1) {
				var region;
				if (formula1.indexOf('=') !== 0) {
					return;
				}
				region = text2sort(formula1);
				if (!region) {
					return '输入来源格式错误';
				}
				if (region.startRowSort > 9999 || (region.endRowSort !== 'MAX' && region.endRowSort > 9999) ||
					region.startColSort > 25 || (region.endColSort !== 'MAX' && region.endColSort > 25)) {
					return '来源范围超出最大支持';
				}
				if (region.startRowSort !== region.endRowSort && region.startColSort !== region.endColSort) {
					return '来源只能选择单行单列';
				}
			}

			function orderValidator(formula1, formula2) {
				if (parseFloat(formula1) > parseFloat(formula2)) {
					return '最大值不能小于最小值';
				}

			}
		},
		confirm: function() {
			var type = this.select.val(),
				max = this.max.val(),
				min = this.min.val(),
				ruleSource = this.sourceData.val(),
				validationType,
				formula1,
				formula2,
				rule = {};

			switch (type) {
				case 'default':
					validationType = config.validationType.defaultType;
					break;
				case 'intType':
					validationType = config.validationType.intType;
					formula1 = min;
					formula2 = max;
					break;
				case 'decimalType':
					validationType = config.validationType.decimalType;
					formula1 = min;
					formula2 = max;
					break;
				case 'sequenceType':
					validationType = config.validationType.sequenceType;
					formula1 = ruleSource;
					break;
				case 'textType':
					validationType = config.validationType.textType;
					formula1 = min;
					formula2 = max;
					break;
				default:
					validationType = config.validationType.defaultType;
					break;
			}
			if (!this.inputValidator(type, formula1, formula2)) {
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
			this.close();
		},
		insertRule: function(rule) {
			var select = selects.getModelByType('selected'),
				wholePosi = select.get('wholePosi'),
				startColIndex = cols.getIndexByAlias(wholePosi.startX),
				startRowIndex = rows.getIndexByAlias(wholePosi.startY),
				endColIndex = cols.getIndexByAlias(wholePosi.endX),
				endRowIndex = rows.getIndexByAlias(wholePosi.endY),
				rules = cache.validate,
				originalIndex,
				originalIndexRecord = [],
				ruleIndex,
				originalFormula1,
				formula1,
				colAlias,
				rowAlias,
				record,
				i, j, key;

			if (rule.validationType === config.validationType.sequenceType) {
				originalFormula1 = rule.formula1;
				rule.formula1 = this.getRegionAlias(originalFormula1);
			}
			for (key in rules) {
				if (isEqual(rules[key], rule)) {
					ruleIndex = parseInt(key);
					break;
				}
			}
			if (typeof ruleIndex === 'undefined') {
				ruleIndex = cache.validateCounter;
				cache.validateCounter++;
				cache.validate[ruleIndex] = rule;
			}
			selectValidate.set(ruleIndex);


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
						colAlias = colList[i].get('alias');
						rowAlias = rowList[j].get('alias');
						originalIndex = strandMap.getPointRecord(colAlias, rowAlias, 'validate');
						if (ruleIndex !== originalIndex) {
							originalIndexRecord.push({
								colSort: colList[i].get('sort'),
								rowSort: rowList[j].get('sort'),
								originalIndex: originalIndex
							});
							strandMap.addPointRecord(colAlias, rowAlias, 'validate', ruleIndex);
						}
					}
				}
				record = history.getValidateUpdateAction({
					startColSort: colList[startColIndex].get('sort'),
					startRowSort: rowList[startRowIndex].get('sort'),
					endColSort: colList[endColIndex].get('sort'),
					endRowSort: rowList[endRowIndex].get('sort')
				}, ruleIndex, originalIndexRecord);
				history.addAction(record);
			}


			if (rule.validationType === config.validationType.sequenceType &&
				typeof rule.formula1 === 'object' &&
				rule.formula1.endRowAlias !== 'MAX' &&
				rule.formula1.endColAlias !== 'MAX') {
				formula1 = rule.formula1;
				strandMap.addPointRecord(formula1.startColAlias, formula1.startRowAlias, 'sourceToRuleIndex', ruleIndex);
				strandMap.addPointRecord(formula1.endColAlias, formula1.endRowAlias, 'sourceToRuleIndex', ruleIndex);
			}
			this._sendData(rule, startColIndex, startRowIndex, endColIndex, endRowIndex, originalFormula1);

			function isEqual(obj1, obj2) {
				var key, value1, value2;
				if (typeof obj1 !== 'object' || obj1 === null) {
					return obj1 === obj2;
				} else {
					for (key in obj1) {
						value1 = obj1[key];
						if (!obj2) {
							return false;
						}
						value2 = obj2[key];
						if (typeof value1 !== 'object') {
							if (value1 !== value2) {
								return false;
							}
						} else {
							if (!isEqual(value1, value2)) {
								return false;
							}
						}
					}
				}
				return true;
			}
		},
		getRegionAlias: function(formula1) {

			if (formula1.indexOf('=') !== 0) {
				return formula1;
			}

			var region = text2sort(formula1),
				endColIndex = cols.getIndexBySort(region.endColSort),
				endRowIndex = rows.getIndexBySort(region.endRowSort);
			return {
				startColAlias: colList[cols.getIndexBySort(region.startColSort)].get('alias'),
				startRowAlias: rowList[rows.getIndexBySort(region.startRowSort)].get('alias'),
				endColAlias: endColIndex === 'MAX' ? 'MAX' : colList[endColIndex].get('alias'),
				endRowAlias: endRowIndex === 'MAX' ? 'MAX' : rowList[endRowIndex].get('alias')
			};
		},
		_sendData: function(rule, startColIndex, startRowIndex, endColIndex, endRowIndex, originalFormula1) {
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
						formula1: originalFormula1 === undefined ? rule.formula1 : originalFormula1,
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
				currentRule,
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
						currentRule = cache.validate[currentRuleIndex];
						if (!currentRule) {
							currentRule = this.getSequenceRule(-1, rowList[startRow].get('sort'));
						}
						rules.push(currentRule);
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
						currentRule = cache.validate[currentRuleIndex];
						if (!currentRule) {
							currentRule = this.getSequenceRule(colList[startCol].get('sort'), -1);
						}
						rules.push(currentRule);
						cacheRuleIndex = currentRuleIndex;
					}
				}
			} else {
				outerLoop: for (i = startCol; i < endCol + 1; i++) {
					for (j = startRow; j < endRow + 1; j++) {
						colAlias = colList[i].get('alias');
						rowAlias = rowList[j].get('alias');
						currentRuleIndex = strandMap.calcPointRecord(colAlias, rowAlias, 'validate');
						if (currentRuleIndex === undefined || ((currentRule = cache.validate[currentRuleIndex]) && currentRule.validationType === 0)) {
							existUnset = true;
						} else if (cacheRuleIndex !== currentRuleIndex) {
							currentRule = cache.validate[currentRuleIndex];
							if (!currentRule) {
								currentRule = this.getSequenceRule(colList[startCol].get('sort'), rowList[startRow].get('sort'));
							}
							rules.push(currentRule);
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
					case config.validationType.defaultType:
						this._toggleDefault();
						break;
					case config.validationType.intType:
						this._toggleIntType(rules[0].formula1, rules[0].formula2);
						break;
					case config.validationType.decimalType:
						this._toggleDecimalType(rules[0].formula1, rules[0].formula2);
						break;
					case config.validationType.sequenceType:
						this._toggleSequenceType(this.getShowText(rules[0].formula1));
						break;
					case config.validationType.textType:
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
		getShowText: function(region) {
			var startRowIndex,
				startColIndex,
				endRowIndex,
				endColIndex;

			if (typeof region === 'string') {
				return region
			}

			startColIndex = cols.getIndexByAlias(region.startColAlias);
			endColIndex = cols.getIndexByAlias(region.endColAlias);
			startRowIndex = rows.getIndexByAlias(region.startRowAlias);
			endRowIndex = rows.getIndexByAlias(region.endRowAlias);

			return this.parseText(
				colList[startColIndex].get('displayName'),
				rowList[startRowIndex].get('displayName'),
				endColIndex === 'MAX' ? 'MAX' : colList[endColIndex].get('displayName'),
				endRowIndex === 'MAX' ? 'MAX' : rowList[endRowIndex].get('displayName')
			)
		},
		getSequenceRule: function(colSort, rowSort) {
			var result;
			send.PackAjax({
				url: config.url.sheet.validateFull,
				isPublic: false,
				data: JSON.stringify({
					oprCol: colSort,
					oprRow: rowSort
				}),
				success: function(data) {
					var rule = data.rule;
					rule.index = data.index;
					rule.validationType = config.validationType.sequenceType;
					original.analysisValidateRule({
						rule: rule
					});
					result = rule;
				}
			});
			return result;
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
		_toggleSequenceType: function(source) {
			this.select.val('sequenceType');
			this.source.addClass('active');
			this.range.removeClass('active');
			this.sourceData.val(source === undefined ? '' : source);
		},
		_toggleTextType: function(min, max) {
			this.select.val('textType');
			this.range.addClass('active');
			this.source.removeClass('active');
			this.min.val(min === undefined ? '' : min);
			this.max.val(max === undefined ? '' : max);
		},
		close: function() {
			this.endSelectSource();
			this.destroy();
		},
		destroy: function() {
			this.remove();
			Backbone.trigger('event:sidebarContainer:remove');
		}
	});
	return ValidateContainer;
});