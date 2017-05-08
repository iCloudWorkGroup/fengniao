'use strict';
define(function(require) {
	var Backbone = require('lib/backbone'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		selectRegions = require('collections/selectRegion'),
		getOperRegion = require('basic/tools/getoperregion'),
		config = require('spreadsheet/config'),
		cells = require('collections/cells'),
		cache = require('basic/tools/cache'),
		commentHandler = require('entrance/tool/comment'),
		rowOperate = require('entrance/row/rowoperation'),
		colOperate = require('entrance/col/coloperation'),
		commentContainer;

	commentContainer = Backbone.View.extend({

		tagName: 'textarea',

		className: 'comment',

		isTransverseScroll: false,

		isVerticalScroll: false,

		events: {
			'blur': 'close'
		},

		initialize: function() {},

		render: function() {
			this.$el.css({
				left: -1000,
				top: -1000,
				width: config.User.commentWidth + 'px',
				height: config.User.commentHeight + 'px'
			});
			return this;
		},
		add: function(options) {
			this.edit(options);
			this.$el.val('');
		},
		edit: function(options) {
			this.show(options);
			this.$el.removeAttr('disabled');
			this.$el.focus();
		},

		show: function(options) {
			var colIndex = options.colIndex,
				rowIndex = options.rowIndex,
				comment = options.comment,
				frozenColIndex,
				frozenRowIndex,
				selectModel,
				cellList,
				frozen;

			if (typeof colIndex === 'undefined') {
				selectModel = selectRegions.getModelByType('selected');
				colIndex = headItemCols.getIndexByAlias(selectModel.get('wholePosi').endX);
				rowIndex = headItemRows.getIndexByAlias(selectModel.get('wholePosi').startY);
				cellList = cells.getCellByVertical(colIndex, rowIndex);
				if (cellList.length === 1) {
					comment = cellList[0].get('customProp').comment;
				}
			}
			frozenColIndex = cache.TempProp.colFrozen || headItemCols.getIndexByAlias(cache.TempProp.colAlias);
			frozenRowIndex = cache.TempProp.rowFrozen || headItemRows.getIndexByAlias(cache.TempProp.rowAlias);

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

			this.left = this.getAbsoluteLeft(colIndex);
			this.top = this.getAbsoluteTop(rowIndex);
			this.adjustZIndex(colIndex, rowIndex);
			this.$el.css({
				left: this.left + 5,
				top: this.top,
				display: true
			});
			this.$el.attr('disabled', 'disabled');
			this.$el.css('display', 'block');
			this.$el.val(comment);
		},

		hide: function() {
			this.$el.css('display', 'none');
			this.$el.attr('disabled', 'disabled');
			this.isTransverseScroll = false;
			this.isVerticalScroll = false;
		},
		/**
		 * 横向移动输入框
		 */
		transverseScroll: function(value) {
			if (!this.isTransverseScroll) {
				return;
			}
			this.$el.css({
				'left': this.left + value
			});
		},
		/**
		 * 纵向移动输入框
		 */
		verticalScroll: function(value) {
			if (!this.isVerticalScroll) {
				return;
			}
			this.$el.css({
				'top': this.top + value
			});
		},
		/**
		 * 获取输入框left坐标
		 */
		getAbsoluteLeft: function(colIndex) {
			var left,
				colModel;
			left = config.System.outerLeft;

			if (colIndex === 'MAX') {
				return left;
			}
			if (cache.TempProp.colFrozen) {
				left += headItemCols.getModelByAlias(cache.UserView.colAlias).get('left');
			}

			colModel = headItemCols.models[colIndex];
			left += colModel.get('left') + colModel.get('width');
			return left;
		},
		getAbsoluteTop: function(rowIndex) {
			var top,
				rowModel;
			top = config.System.outerTop;

			if (rowIndex === 'MAX') {
				return top;
			}
			if (cache.TempProp.rowIndex) {
				left += headItemRows.getModelByAlias(cache.UserView.rowAlias).get('left');
			}

			rowModel = headItemRows.models[rowIndex];
			top += rowModel.get('top');
			return top;
		},
		adjustZIndex: function(colIndex, rowIndex) {
			var colIndex,
				rowIndex,
				frozenColIndex,
				frozenRowIndex;

			if (cache.TempProp.colFrozen && cache.TempProp.rowFrozen) { //冻结情况
				frozenColIndex = headItemCols.getIndexByAlias(cache.TempProp.colAlias);
				frozenRowIndex = headItemRows.getIndexByAlias(cache.TempProp.rowAlias);
				if (frozenColIndex > colIndex && frozenRowIndex > rowIndex) {
					this.$el.css({
						'z-index': '15'
					});
				} else if (frozenColIndex > colIndex || frozenRowIndex > rowIndex) {
					this.$el.css({
						'z-index': '12'
					});
				} else {
					this.$el.css({
						'z-index': '9'
					});
				}
			} else if (cache.TempProp.colFrozen) {
				frozenColIndex = headItemCols.getIndexByAlias(cache.TempProp.colAlias);
				if (frozenColIndex > colIndex) {
					this.$el.css({
						'z-index': '12'
					});
				} else {
					this.$el.css({
						'z-index': '9'
					});
				}
			} else if (cache.TempProp.rowFrozen) {
				frozenRowIndex = headItemRows.getIndexByAlias(cache.TempProp.rowAlias);
				if (frozenRowIndex > rowIndex) {
					this.$el.css({
						'z-index': '12'
					});
				} else {
					this.$el.css({
						'z-index': '9'
					});
				}
			} else { //非冻结情况
				this.$el.css({
					'z-index': '9'
				});
			}
		},
		close: function() {
			var comment;
			comment = this.$el.val();
			comment = comment || '';
			commentHandler.modifyComment('1', comment);
			this.hide();
		}
	});
	return commentContainer;
});