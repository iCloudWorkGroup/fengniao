define(function(require) {
	'use strict';
	var Backbone = require('lib/backbone'),
		strandMap = require('basic/tools/strandmap'),
		getTemplate = require('basic/tools/template'),
		cache = require('basic/tools/cache'),
		send = require('basic/tools/send'),
		selectValidate = require('basic/tools/selectvalidate'),
		setCellContent = require('entrance/tool/setcellcontent'),
		text2sort = require('basic/tools/text2sort'),
		selects = require('collections/selectRegion'),
		original = require('basic/tools/original'),
		cols = require('collections/headItemCol'),
		rows = require('collections/headItemRow'),
		cells = require('collections/cells'),
		config = require('spreadsheet/config'),
		colList = cols.models,
		rowList = rows.models,
		SequenceContainer;

	SequenceContainer = Backbone.View.extend({

		className: 'sequence',

		events: {
			'click .sequence-btn': 'toggleSequenceList',
			'click .sequence-list': 'clickHandle',
		},
		initialize: function() {
			var select = this.select = selects.getModelByType('selected');
			this.cacheUserViewCol = {};
			this.cacheUserViewRow = {};
			this.listenTo(select, 'change:wholePosi', this.local);
		},
		render: function() {
			var template = getTemplate('SEQUENCETEMPLATE');
			this.childTemplate = getTemplate('SEQUENCEITEMTEMPLATE');
			this.$el.html(template());
			this.$list = this.$el.find('.sequence-list');
			this.$btn = this.$el.find('.sequence-btn');
			selectValidate.addSubscriber(this);
			this.local();
			return this;
		},
		local: function() {
			var select = this.select,
				colAlias = select.get('wholePosi').startX,
				rowAlias = select.get('wholePosi').startY,
				ruleIndex = strandMap.calcPointRecord(colAlias, rowAlias, 'validate'),
				rule;

			if (ruleIndex === undefined) {
				this.hide();
			} else if (!(rule = cache.validate[ruleIndex]) ||
				rule.validationType === config.validationType.sequenceType) {
				selectValidate.set(ruleIndex);
				this.show();
			} else {
				this.hide();
			}

		},
		changeRule: function() {
			var ruleIndex = selectValidate.get(),
				rule;

			if (ruleIndex !== null) {
				rule = cache.validate[ruleIndex];
				if (!rule || rule.validationType === config.validationType.sequenceType) {
					this.show();
				}
			} else {
				this.hide();
			}

		},
		show: function() {
			var select = selects.getModelByType('selected'),
				colAlias = select.get('wholePosi').startX,
				rowAlias = select.get('wholePosi').startY,
				colIndex = cols.getIndexByAlias(colAlias),
				rowIndex = rows.getIndexByAlias(rowAlias),
				frozenColIndex,
				frozenRowIndex,
				cellModel;

			cellModel = cells.getCellByVertical(colIndex, rowIndex)[0];

			if (cellModel) {
				this.colIndex = colIndex + cellModel.get('occupy').x.length - 1;
			} else {
				this.colIndex = colIndex;
			}
			this.rowIndex = rowIndex;

			frozenColIndex = cache.TempProp.colFrozen && cols.getIndexByAlias(cache.TempProp.colAlias);
			frozenRowIndex = cache.TempProp.rowFrozen && rows.getIndexByAlias(cache.TempProp.rowAlias);

			if (frozenColIndex && frozenColIndex > colIndex) {
				this.isTransverseScroll = false;
			} else {
				this.isTransverseScroll = true;
			}
			if (frozenRowIndex && frozenRowIndex > rowIndex) {
				this.isVerticalScroll = false;
			} else {
				this.isVerticalScroll = true;
			}

			this.adjustZIndex(colIndex, rowIndex);
			this.adjustWidth(rowIndex);
			this.adjustBtnPosi(colIndex);
			this.hideSequenceList();

			this.$el.css('display', 'block');
			this.$el.css('left', this.getAbsoluteLeft());
			this.$el.css('top', this.getAbsoluteTop());
		},
		hide: function() {
			this.isTransverseScroll = false;
			this.isVerticalScroll = false;
			this.hideSequenceList();
			this.$el.css('display', 'none');
		},
		clickHandle: function(event) {
			event.preventDefault();
			var value = event.target.innerText;
			setCellContent('sheetId', value);
			this.hide();
		},
		transverseScroll: function() {
			if (!this.isTransverseScroll) {
				return;
			}
			this.$el.css('left', this.getAbsoluteLeft());
		},
		verticalScroll: function() {
			if (!this.isVerticalScroll) {
				return;
			}
			this.$el.css('top', this.getAbsoluteTop());
		},
		toggleSequenceList: function() {
			if (this.listState) {
				this.hideSequenceList();
			} else {
				this.openSequenceList();
			}
		},
		openSequenceList: function() {
			var ruleIndex = selectValidate.get(),
				rule = cache.validate[ruleIndex],
				formula1,
				self = this,
				textList = [],
				cellList,
				len, i;

			if (rule) {
				formula1 = rule.formula1;
				if (typeof formula1 === 'object') {
					cellList = cells.getCellByVertical(cols.getIndexByAlias(formula1.startColAlias),
						rows.getIndexByAlias(formula1.startRowAlias),
						cols.getIndexByAlias(formula1.endColAlias),
						rows.getIndexByAlias(formula1.endRowAlias)
					);
					for (i = 0, len = cellList.length; i < len; i++) {
						textList.push(cellList[i].get('content').texts);
					}
				} else {
					textList = formula1.split(',');
				}
				generateList(textList);
			} else {
				getRule();
			}

			function getRule() {
				send.PackAjax({
					url: config.url.sheet.validateFull,
					isPublic: false,
					data: JSON.stringify({
						oprCol: colList[self.colIndex].get('sort'),
						oprRow: rowList[self.rowIndex].get('sort')
					}),
					success: function(data) {
						var rule = data.rule,
							list = data.expResult;

						rule.index = data.index;
						original.analysisValidateRule({
							rule: rule
						});
						generateList(list);
					}
				});
			}

			function generateList(textList) {
				var i, len,
					copyTextList = [];

				for (i = 0, len = textList.length; i < len; i++) {
					if (textList[i]) {
						copyTextList.push(textList[i]);
					}
				}
				if (copyTextList.length === 0) {
					return;
				}
				self.listState = !self.listState;
				self.$list.empty();
				self.$list.addClass('active');

				for (i = 0, len = copyTextList.length; i < len; i++) {
					self.$list.append(self.childTemplate({
						content: copyTextList[i]
					}));
				}

			}
		},
		hideSequenceList: function() {
			this.listState = false;
			this.$list.removeClass('active');
		},
		/**
		 * 获取输入框left坐标
		 */
		getAbsoluteLeft: function() {
			var colIndex = this.colIndex,
				left = config.System.outerLeft,
				userViewColAlias = cache.UserView.colAlias,
				userViewColIndex;

			left += colList[colIndex].get('left');

			if (cache.TempProp.colFrozen) {
				if (userViewColIndex = this.cacheUserViewCol[userViewColAlias] === undefined) {
					userViewColIndex = cols.getIndexByAlias(userViewColAlias);
					this.cacheUserViewCol[userViewColAlias] = userViewColIndex;
				}
				left -= colList[userViewColIndex].get('left');
			}
			if (this.isTransverseScroll) {
				left -= cache.viewRegion.scrollLeft;
			}
			return left;
		},
		getAbsoluteTop: function(rowIndex) {
			var rowIndex = this.rowIndex,
				top = config.System.outerTop,
				userViewRowAlias = cache.UserView.rowAlias,
				userViewRowIndex;

			top += rowList[rowIndex].get('top') + rowList[rowIndex].get('height');

			if (cache.TempProp.rowFrozen) {
				if (userViewRowIndex = this.cacheUserViewRow[userViewRowAlias] === undefined) {
					userViewRowIndex = rows.getIndexByAlias(userViewRowAlias);
					this.cacheUserViewCol[userViewColAlias] = userViewRowIndex;
				}
				top -= rowList[userViewRowIndex].get('top');
			}

			if (this.isVerticalScroll) {
				top -= cache.viewRegion.scrollTop;
			}
			return top;
		},
		adjustWidth: function() {
			var colIndex = this.colIndex,
				width = colList[colIndex].get('width');

			this.$el.width(width);
		},
		adjustBtnPosi: function(colIndex) {
			if (colIndex !== cols.length - 1) {
				this.$btn.addClass('sequence-btn-right');
				this.$btn.removeClass('sequence-btn-left');
			} else {
				this.$btn.addClass('sequence-btn-left');
				this.$btn.removeClass('sequence-btn-right');
			}
		},
		adjustZIndex: function() {
			var isTransverseScroll = this.isTransverseScroll,
				isVerticalScroll = this.isVerticalScroll;

			if (cache.TempProp.colFrozen && cache.TempProp.rowFrozen) { //冻结情况
				if (!isTransverseScroll && !isVerticalScroll) {
					this.$el.css({
						'z-index': '15'
					});
				} else if (!isTransverseScroll || !isVerticalScroll) {
					this.$el.css({
						'z-index': '12'
					});
				} else {
					this.$el.css({
						'z-index': '9'
					});
				}
			} else if (cache.TempProp.colFrozen) {
				if (!isTransverseScroll) {
					this.$el.css({
						'z-index': '12'
					});
				} else {
					this.$el.css({
						'z-index': '9'
					});
				}
			} else if (cache.TempProp.rowFrozen) {
				if (!isVerticalScroll) {
					this.$el.css({
						'z-index': '12'
					});
				} else {
					this.$el.css({
						'z-index': '9'
					});
				}
			} else {
				this.$el.css({
					'z-index': '9'
				});
			}
		},
		destory: function() {
			this.remove();
		}
	});
	return SequenceContainer;
});