'use strict';
define(function(require) {
	var Backbone = require('lib/backbone'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		selectRegions = require('collections/selectRegion'),
		getOperRegion = require('basic/tools/getoperregion'),
		config = require('spreadsheet/config'),
		cells = require('collections/cells'),
		send = require('basic/tools/send'),
		cache = require('basic/tools/cache'),
		rowOperate = require('entrance/row/rowoperation'),
		colOperate = require('entrance/col/coloperation'),
		commentContainer;

	commentContainer = Backbone.View.extend({
		tagName: 'textarea',

		className: 'comment',

		state: 'show', // show:显示状态   edit: 编辑状态  

		events: {
			'blur': 'close'
		},

		initialize: function(options) {
			var mainContainer,
				colAliasLen,
				colAlias,
				rowAlias,
				colIndex,
				rowIndex,
				endRowAlias,
				endColAlias,
				select,
				model;

			if (options.colIndex !== undefined) {
				this.colIndex = options.colIndex;
				this.rowIndex = options.rowIndex;
				this.comment = options.comment;
			} else {
				select = selectRegions.getModelByType('operation')[0];
				colAlias = select.get('wholePosi').endX;
				rowAlias = select.get('wholePosi').startY;

				this.colIndex = headItemCols.getIndexByAlias(colAlias);
				this.rowIndex = headItemRows.getIndexByAlias(rowAlias);
				if (options.state === 'edit') {
					if (select.get('wholePosi').endX === select.get('wholePosi').startX &&
						select.get('wholePosi').endY === select.get('wholePosi').startY) {
						model = cells.getCellByVertical(this.colIndex, this.rowIndex);
						if (model.length > 0) {
							this.comment = model[0].get('customProp').comment || '';
						}
					} else { //含有多个单元格
						this.comment = '';
					}
				} else {
					this.comment = '';
				}
			}
			this.parentNode = options.parentNode;
			this.state = options.state;
			if (this.state !== 'show') {
				cache.commentEditState = true;
			}
			Backbone.trigger('call:mainContainer', function(container) {
				mainContainer = container;
			});
			this.mainContainer = mainContainer;
		},
		render: function() {
			var left,
				top;
			left = this.getAbsoluteLeft();
			top = this.getAbsoluteTop();
			this.adjustZIndex();
			this.$el.css({
				left: left,
				top: top,
				width: config.User.commentWidth + 'px',
				height: config.User.commentHeight + 'px'
			});
			this.$el.val(this.comment);
			if (this.state === 'show') {
				this.$el.attr('disabled', true);
			}
			return this;
		},
		/**
		 * 横向移动输入框
		 */
		transverseScroll: function() {
			var left;
			left = this.getAbsoluteLeft();
			this.$el.css({
				'left': left
			});
		},
		/**
		 * 纵向移动输入框
		 */
		verticalScroll: function() {
			var top;
			top = this.getAbsoluteTop();
			this.$el.css({
				'top': top
			});
		},
		/**
		 * 获取输入框left坐标
		 * @param  {object} mainContainer mainContainer
		 * @param  {number} colIndex 选中区域列索引
		 */
		getAbsoluteLeft: function() {
			var outLeft,
				scrollLeft,
				userViewLeft,
				userViewIndex,
				frozenColIndex,
				headItemLeft,
				mainContainer,
				limitRight,
				right,
				tempLeft,
				colIndex,
				result;

			colIndex = this.colIndex;
			mainContainer = this.mainContainer;

			outLeft = config.System.outerLeft;
			scrollLeft = mainContainer.$el.scrollLeft();
			//判断边界值
			if (colIndex === 'MAX') {
				headItemLeft = 0;
			} else {
				headItemLeft = headItemCols.models[colIndex].get('left') + headItemCols.models[colIndex].get('width');
			}

			if (cache.TempProp.colFrozen) { //冻结情况
				frozenColIndex = headItemCols.getIndexByAlias(cache.TempProp.colAlias);
				if (frozenColIndex > colIndex) {
					scrollLeft = 0;
				}
				userViewIndex = headItemCols.getIndexByAlias(cache.UserView.colAlias);
				userViewLeft = headItemCols.models[userViewIndex].get('left');
				headItemLeft = headItemLeft - userViewLeft + outLeft - scrollLeft + 1;
			} else { //非冻结情况
				headItemLeft = headItemLeft + outLeft - scrollLeft + 1;
			}

			//判断备注是否超过了显示区域
			right = headItemLeft + config.User.commentWidth + 1;

			limitRight = this.parentNode.$el.width();

			if (right > limitRight) {
				tempLeft = headItemLeft - config.User.commentWidth - headItemCols.models[colIndex].get('width') - 10;
				if (tempLeft > 0) {
					headItemLeft = tempLeft;
				}
			}
			return headItemLeft;
		},
		getAbsoluteTop: function() {
			var outTop,
				scrollTop,
				userViewTop,
				userViewIndex,
				frozenRowIndex,
				mainContainer,
				rowIndex,
				headItemTop,
				result;

			rowIndex = this.rowIndex;
			mainContainer = this.mainContainer;

			outTop = config.System.outerTop;
			scrollTop = mainContainer.$el.scrollTop();

			headItemTop = headItemRows.models[rowIndex].get('top');

			if (cache.TempProp.rowFrozen) { //冻结情况
				frozenRowIndex = headItemRows.getIndexByAlias(cache.TempProp.rowAlias);
				if (frozenRowIndex > rowIndex) {
					scrollTop = 0;
				}
				userViewIndex = headItemRows.getIndexByAlias(cache.UserView.rowAlias);
				userViewTop = headItemRows.models[userViewIndex].get('top');
				result = headItemTop - userViewTop + outTop - scrollTop + 1;
				return result;
			} else { //非冻结情况
				result = headItemTop + outTop - scrollTop + 1;
				return result;
			}
		},
		adjustZIndex: function() {
			var colIndex,
				rowIndex,
				frozenColIndex,
				frozenRowIndex;

			colIndex = this.colIndex;
			rowIndex = this.rowIndex;

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
			var comment,
				select,
				cellsList,
				startColIndex,
				startRowIndex,
				endColIndex,
				endRowIndex,
				i;

			if (this.state !== 'show') {
				comment = this.$el.val();
				comment = comment || '';
				select = selectRegions.getModelByType('operation')[0];
				startColIndex = headItemCols.getIndexByAlias(select.get('wholePosi').startX);
				startRowIndex = headItemRows.getIndexByAlias(select.get('wholePosi').startY);
				if (select.get('wholePosi').endX === 'MAX') {
					endColIndex = 'MAX';
					endRowIndex = headItemRows.getIndexByAlias(select.get('wholePosi').endY);
					rowOperate.rowPropOper(startRowIndex, 'customProp.comment', comment);
				} else if (select.get('wholePosi').endY === 'MAX') {
					endRowIndex = 'MAX';
					endColIndex = headItemCols.getIndexByAlias(select.get('wholePosi').endX);
					colOperate.colPropOper(startColIndex, 'customProp.comment', comment);
				} else {
					endColIndex = headItemCols.getIndexByAlias(select.get('wholePosi').endX);
					endRowIndex = headItemRows.getIndexByAlias(select.get('wholePosi').endY);
					cellsList = cells.getFillCellsByRegion(
						startRowIndex,
						startColIndex,
						endRowIndex,
						endColIndex
					);
					for (i in cellsList) {
						cellsList[i].set('customProp.comment', comment);
					}
				}
				this.sendData(comment);
			}
			cache.commentEditState = false;
			this.remove();
		},
		sendData: function(comment) {
			var sendData;
			sendData = getOperRegion().sendRegion;
			send.PackAjax({
				url: 'text.htm?m=comment_set',
				data: JSON.stringify({
					coordinate: sendData,
					comment: comment
				})
			});
		}
	});
	return commentContainer;
});