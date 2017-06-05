'use strict';
define(function(require) {
	var Backbone = require('lib/backbone'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		selectRegions = require('collections/selectRegion'),
		config = require('spreadsheet/config'),
		cells = require('collections/cells'),
		cache = require('basic/tools/cache'),
		commentHandler = require('entrance/tool/comment'),
		commentContainer;

	commentContainer = Backbone.View.extend({

		tagName: 'textarea',

		className: 'comment',

		isTransverseScroll: false,

		isVerticalScroll: false,

		events: {
			'blur': 'close'
		},

		initialize: function(options) {
			this.parentNode = options.parentNode;
		},

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
				cellList;

			// 添加/编辑备注情况
			if (typeof colIndex === 'undefined') {
				selectModel = selectRegions.getModelByType('selected');
				colIndex = headItemCols.getIndexByAlias(selectModel.get('wholePosi').endX);
				rowIndex = headItemRows.getIndexByAlias(selectModel.get('wholePosi').startY);
				cellList = cells.getCellByVertical(colIndex, rowIndex);
				if (cellList.length === 1) {
					comment = cellList[0].get('customProp').comment;
				}
			}
			this.colIndex = colIndex;
			this.rowIndex = rowIndex;

			frozenColIndex = cache.TempProp.colFrozen && headItemCols.getIndexByAlias(cache.TempProp.colAlias);
			frozenRowIndex = cache.TempProp.rowFrozen && headItemRows.getIndexByAlias(cache.TempProp.rowAlias);

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

			this.setBoxModel();

			this.adjustZIndex(colIndex, rowIndex);
			this.$el.attr('disabled', 'disabled');
			this.$el.css('display', 'block');
			this.$el.val(comment);
		},
		setBoxModel: function() {
			var limitHeight,
				limitWidth,
				height,
				width,
				left,
				top;

			//获取相对位置
			left = this.getAbsoluteLeft();
			top = this.getAbsoluteTop();
			height = 150; //默认高度
			width = 150; //默认宽度
			limitHeight = this.parentNode.el.clientHeight - config.System.outerBottom - 
			cache.scrollbarWidth -(this.$el.outerHeight() - this.$el.height());

			limitWidth = this.parentNode.el.clientWidth - cache.scrollbarWidth;
			
			/**
			 * 处理输入焦点导致的容器内部出现相对位移问题
			 */

			//批注框超出显示区域，直接放入不可见区域
			if ( top >= limitHeight || left >= limitWidth ) {
				this.$el.css({
					left: -200,
					top: -200,
				});
				return;
			}
 
			if (top + height > limitHeight) {
				height = limitHeight - top;
			}

			if (left + width > limitWidth) {
				//横向特殊处理，避免显示的备注条过细
				if (limitWidth - left > 60) {
					width = limitWidth - left;
				} else {
					left = limitWidth - 150 - 5;
				}
			}
			this.$el.css({
				left: left + 5,
				top: top,
				height: height,
				width: width
			});
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
		transverseScroll: function() {
			if (!this.isTransverseScroll) {
				return;
			}
			this.setBoxModel();
		},
		/**
		 * 纵向移动输入框
		 */
		verticalScroll: function() {
			if (!this.isVerticalScroll) {
				return;
			}
			this.setBoxModel();
		},
		/**
		 * 获取输入框left坐标
		 */
		getAbsoluteLeft: function() {
			var colIndex = this.colIndex,
				left = config.System.outerLeft,
				colModel;

			//整行操作
			if (colIndex === 'MAX') {
				return left;
			}

			colModel = headItemCols.models[colIndex];
			left += colModel.get('left') + colModel.get('width');

			if (cache.TempProp.colFrozen) {
				left -= headItemCols.getModelByAlias(cache.UserView.colAlias).get('left');
			}

			if (this.isTransverseScroll) {
				left -= cache.viewRegion.scrollLeft;
			}
			return left;
		},
		getAbsoluteTop: function() {
			var rowIndex = this.rowIndex,
				top = config.System.outerTop,
				rowModel;

			//整行操作
			if (rowIndex === 'MAX') {
				return top;
			}
			rowModel = headItemRows.models[rowIndex];
			top += rowModel.get('top');

			if (cache.TempProp.rowFrozen) {
				top -= headItemRows.getModelByAlias(cache.UserView.rowAlias).get('top');
			}

			if (this.isVerticalScroll) {
				top -= cache.viewRegion.scrollTop;
			}
			return top;
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