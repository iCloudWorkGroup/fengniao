define(function(require) {
	'use strict';
	var $ = require('lib/jquery'),
		_ = require('lib/underscore'),
		Backbone = require('lib/backbone'),
		config = require('spreadsheet/config'),
		cache = require('basic/tools/cache'),
		binary = require('basic/util/binary'),
		send = require('basic/tools/send'),
		headItemRows = require('collections/headItemRow'),
		headItemCols = require('collections/headItemCol'),
		cells = require('collections/cells'),
		selectRegions = require('collections/selectRegion'),
		siderLineRows = require('collections/siderLineRow'),
		siderLineCols = require('collections/siderLineCol'),
		RowsSpaceLineContainer = require('views/rowsSpaceLineContainer'),
		HeadItemRowContainer = require('views/headItemRowContainer'),
		loadRecorder = require('basic/tools/loadrecorder'),
		selectCellCols = require('entrance/cell/selectcellcols');


	/**
	 * 行标题容器视图类
	 * @author ray wu
	 * @since 0.1.0
	 * @class RowsHeadContainer  
	 * @module views
	 * @extends Backbone.View
	 * @constructor
	 */
	//ps:index修改为alias,列宽调整功能
	var RowsHeadContainer = Backbone.View.extend({
		/**
		 * 设置class属性
		 * @property className
		 * @type {String}
		 */
		className: 'row-head-panel',
		/**
		 * 视图初始化函数
		 * @method initialize
		 */
		initialize: function(options) {
			if (!cache.TempProp.isFrozen) {
				this.delegateEvents({
					'mousedown .row-head-item': 'transAction',
					'mousemove .row-head-item': 'overEffect'
				});
			}
			Backbone.on('call:rowsHeadContainer', this.callRowsHeadContainer, this);
			Backbone.on('event:rowsHeadContainer:relaseSpaceEffect', this.relaseSpaceEffect, this);
			Backbone.on('event:rowHeightAdjust', this.rowHeightAdjust, this);
			this.rowNumber = 0;
			this.currentRule = cache.CurrentRule;
			if (cache.TempProp.isFrozen !== true || this.currentRule.displayPosition.endIndex === undefined) {
				this.listenTo(headItemRows, 'add', this.addRowsHeadContainer);
			}

		},
		/**
		 * 页面渲染方法
		 * @method render
		 */
		render: function() {
			var i = 0,
				modelsHeadLineRowList,
				modelsHeadLineRowRegionList,
				len,
				activeModelList,
				modelList = headItemRows;
			modelsHeadLineRowList = modelsHeadLineRowRegionList = modelList.models;
			if (cache.TempProp.isFrozen) {
				if (this.currentRule.displayPosition.endIndex !== undefined) {
					modelsHeadLineRowRegionList = modelsHeadLineRowList.slice(this.currentRule.displayPosition.startIndex, this.currentRule.displayPosition.endIndex);
				} else {
					modelsHeadLineRowRegionList = modelsHeadLineRowList.slice(this.currentRule.displayPosition.startIndex);
				}
			}
			len = modelsHeadLineRowRegionList.length;
			for (; i < len; i++) {
				this.addRowsHeadContainer(modelsHeadLineRowRegionList[i], true);
				this.rowNumber++;
			}
			//ensure y or n has exist active model,
			//if exist , the first model will be not active this.
			activeModelList = modelList.where({
				'activeState': true
			});
			if (activeModelList.length === 0) {
				modelsHeadLineRowList[0].set('activeState', true);
			}
			this.triggerCallback();
			return this;
		},
		/**
		 * 绑定关联视图
		 * @method triggerCallback
		 */
		triggerCallback: function() {
			_.bindAll(this, 'callView');
			Backbone.trigger('call:screenContainer', this.callView('viewScreenContainer'));
			Backbone.trigger('call:mainContainer', this.callView('viewMainContainer'));
			Backbone.trigger('call:cellsContainer', this.callView('viewCellsContainer'));
			Backbone.trigger('call:rowsAllHeadContainer', this.callView('viewRowsAllHeadContainer'));
		},
		/**
		 * 用于其他视图，绑定该视图或调用该视图方法
		 * @method callRowsHeadContainer
		 * @param {function} receiveFunc 回调函数
		 */
		callRowsHeadContainer: function(receiveFunc) {
			receiveFunc(this);
		},
		/**
		 * 鼠标移动到列标题，渲染效果
		 * @method overEffect
		 * @param  {event} e 鼠标移动事件
		 */
		overEffect: function(e) {
			e.currentTarget.style.cursor = this.isAdjustable(e) === true ? 'row-resize' : '';
		},
		/**
		 * 判断是否可以更改列宽
		 * @method isAdjustable
		 * @param  {event}  e 鼠标事件
		 */
		isAdjustable: function(e) {
			var overEl = this.itemEl || e.currentTarget;
			return e.pageY - $(overEl).offset().top > overEl.clientHeight - config.System.effectDistanceRow ? true : false;
		},
		//ps:index修改为alias,整列选中
		/**
		 * 处理鼠标点击事件
		 * @method transAction
		 * @param  {event} e 鼠标事件
		 */
		transAction: function(e) {
			if (!this.isAdjustable(e)) {
				this.rowLocate(e);
				return;
			}
			this.spaceEffect(e);
		},
		callView: function(name) {
			var object = this;
			return function(callBack) {
				object[name] = callBack;
			};
		},
		/**
		 * 行调整时效果，绑定移动事件
		 * @method spaceEffect
		 * @param  {event} e 鼠标点击事件
		 */
		spaceEffect: function(e) {
			this.itemEl = e.currentTarget;
			this.cacheItemElOffsetHeight = this.itemEl.offsetHeight;
			this.$itemEl = $(this.itemEl);
			this.$lockData = $('.row-head-item:gt(' + this.$itemEl.index() + ')', this.el);
			this.$tempSpaceContainer = $('<div/>').addClass('temp-space-container').html(this.$lockData);
			this.$el.append(this.$tempSpaceContainer);
			this.viewScreenContainer.mouseMoveHeadContainer(e, {
				spaceMouse: this.itemEl.clientHeight - e.offsetY,
				// from currentTarget rightBorder caculation distance to document
				offsetTopByBottom: this.itemEl.clientHeight + this.$itemEl.offset().top,
				self: this
			}, this.moveEvent);
			this.rowsSpaceLineContainer = new RowsSpaceLineContainer({
				boxAttributes: {
					top: this.itemEl.offsetTop + this.itemEl.clientHeight
				}
			});
			$('.line-container').append(this.rowsSpaceLineContainer.render().el);
		},
		/**
		 * 行调整时，鼠标移动事件
		 * @method moveEvent
		 * @param  {event} e 鼠标移动事件
		 */
		moveEvent: function(e) {
			var transData = e.data,
				mouseSpace = e.pageY + transData.spaceMouse,
				itemElHeight = parseInt(mouseSpace - transData.self.$itemEl.offset().top, 0);
			if (itemElHeight < config.System.effectDistanceRow) {
				return;
			}
			transData.self.$itemEl.css('height', itemElHeight);
			transData.self.$tempSpaceContainer.css('top', parseInt(mouseSpace - transData.offsetTopByBottom, 0));
			transData.self.rowsSpaceLineContainer.attributesRender({
				top: parseInt(mouseSpace - transData.self.$el.offset().top, 0)
			});
		},
		/**
		 * 拖动结束，调整列宽
		 * @method relaseSpaceEffect
		 * @param  {event} e 鼠标释放事件
		 */
		relaseSpaceEffect: function(e) {
			var i = 0,
				len,
				height,
				modelList,
				itemElIndex,
				diffDistance,
				currentEl;
			if (!this.$lockData) {
				return;
			}
			// this.requstAdjust();
			modelList = headItemRows.models;
			len = modelList.length;
			itemElIndex = headItemRows.getIndexByAlias(this.$itemEl.data('alias'));
			diffDistance = this.itemEl.offsetHeight - this.cacheItemElOffsetHeight;
			height = diffDistance + headItemRows.models[itemElIndex].get('height');

			this.rowHeightAdjust(itemElIndex, height);

			this.$el.append(this.$lockData);
			this.$tempSpaceContainer.remove();
			this.itemEl = this.$itemEl = this.$lockData = null;
		},
		rowHeightAdjust: function(itemElIndex, height) {

			var diffDistance = height - headItemRows.models[itemElIndex].get('height');
			this.adjustHeadLine(itemElIndex, diffDistance);
			this.adjustCells(itemElIndex, diffDistance);
			this.adjustSelectRegion(itemElIndex, diffDistance);
			this.requstAdjust(itemElIndex, diffDistance);

			if (this.viewRowsAllHeadContainer === undefined) {
				this.triggerCallback();
			}
			this.viewRowsAllHeadContainer.$el.css({
				height: headItemRows.getMaxDistanceHeight()
			});
			Backbone.trigger('event:cellsContainer:adaptHeight');
			Backbone.trigger('event:mainContainer:adaptRowHeightChange');
		},
		/**
		 * 向后台发送请求，调整列宽
		 * @method requstAdjust
		 */
		requstAdjust: function(rowIndex, offset) {
			var rowSort = headItemRows.models[rowIndex].get('sort');
			send.PackAjax({
				url: 'cells.htm?m=rows_height',
				data: JSON.stringify({
					rowSort: rowSort,
					offset: offset
				})
			});
		},
		/**
		 * 整行选中
		 * @method rowLocate
		 * @param  {event} e 鼠标点击事件
		 */
		rowLocate: function(e) {
			var containerId = cache.containerId,
				mainMousePosiY,
				modelCell,
				headModelRow,
				headModelCol,
				modelIndexRow,
				headLineColModelList,
				headLineRowModelList;
			if (!this.viewMainContainer) {
				this.triggerCallback();
			}
			mainMousePosiY = e.clientY - config.System.outerTop - $('#' + containerId).offset().top + this.viewMainContainer.el.scrollTop;
			//headColModels,headRowModels list
			headLineRowModelList = headItemRows.models;
			//this model index of headline
			modelIndexRow = binary.modelBinary(mainMousePosiY, headLineRowModelList, 'top', 'height', 0, headLineRowModelList.length - 1);
			//ps：修改
			selectCellCols('1', null, modelIndexRow, e);
		},
		/**
		 * 添加列标视图
		 * @method addRowsHeadContainer
		 * @param {app.Models.LineRow} modelHeadItemRow 
		 */
		addRowsHeadContainer: function(modelHeadItemRow, initialize) {
			this.headItemRowContainer = new HeadItemRowContainer({
				model: modelHeadItemRow,
				frozenTop: this.currentRule.displayPosition.offsetTop,
				reduceUserView: this.currentRule.reduceUserView,
				endIndex: this.currentRule.displayPosition.endIndex
			});
			// if (initialize === true || modelHeadItemRow.get('top') > config.displayRowHeight) {
			if (initialize === true || modelHeadItemRow.get('top')) {	
				this.$el.append(this.headItemRowContainer.render().el);
			} else {
				this.$el.prepend(this.headItemRowContainer.render().el);
			}


		},
		/**
		 * 添加列标视图
		 * @method createHeadItemRow
		 */
		createHeadItemRow: function() {
			headItemRows.add(this.newAttrRow());
		},
		/**
		 * 初始化行属性
		 * @method newAttrRow
		 * @return {Object} 属性对象
		 */
		newAttrRow: function() {
			var currentObject;
			currentObject = {
				alias: (this.rowNumber + 1).toString(),
				top: this.rowNumber * 20,
				height: 19,
				displayName: buildAlias.buildRowAlias(this.rowNumber)
			};
			return currentObject;
		},
		/**
		 * 调整行标题行高
		 * @method adjustHeadLine
		 * @param  {num} index 调整行索引
		 * @param  {num} pixel 调整高度
		 */
		adjustHeadLine: function(index, pixel) {
			var i,
				len,
				headLineList,
				tempHeight,
				tempTop;
			headLineList = headItemRows.models;
			tempHeight = headLineList[index].get('height');
			headLineList[index].set('height', tempHeight + pixel);
			len = headLineList.length;
			for (i = index + 1; i < len; i++) {
				tempTop = headLineList[i].get('top');
				headLineList[i].set('top', tempTop + pixel);
			}
		},
		/**
		 * 调整单元格高度
		 * @method adjustCells
		 * @param  {num} index 调整行索引
		 * @param  {num} pixel 调整高度
		 */
		adjustCells: function(index, pixel) {
			var passAdjustRowCells, //经过调整列cells
				adjustCells, //其余需要调整cells
				loadRowIndex,
				loadRegion,
				i, j, gridLineLen,
				len,
				cellList = cells;
			passAdjustRowCells = cellList.getCellByRow(index, index);
			len = passAdjustRowCells.length;
			for (i = 0; i < len; i++) {
				passAdjustRowCells[i].set('physicsBox.height', passAdjustRowCells[i].get('physicsBox').height + pixel);
			}
			gridLineLen = headItemRows.length;
			adjustCells = cellList.getCellsInStartRowRegion(index + 1, gridLineLen - 1);
			len = adjustCells.length;
			for (j = 0; j < len; j++) {
				adjustCells[j].set('physicsBox.top', adjustCells[j].get('physicsBox').top + pixel);
			}

		},
		/**
		 * 调整选中区域高度
		 * @method adjustSelectRegion
		 * @param  {num} index 调整行索引
		 * @param  {num} pixel 调整高度
		 */
		adjustSelectRegion: function(index, pixel) {
			var startRowIndex,
				endRowIndex,
				startRowAlias,
				endRowAlias,
				selectRegionModel,
				siderLineRowModel,
				cacheHeight,
				cacheTop;
			selectRegionModel = selectRegions.models[0];
			startRowAlias = selectRegionModel.get('wholePosi').startY;
			endRowAlias = selectRegionModel.get('wholePosi').endY;
			startRowIndex = headItemRows.getIndexByAlias(startRowAlias);
			endRowIndex = headItemRows.getIndexByAlias(endRowAlias);
			if (endRowIndex < index) {
				return;
			}

			siderLineRowModel = siderLineRows.models[0];
			if (startRowIndex <= index) {
				cacheHeight = selectRegionModel.get("physicsBox").height;
				selectRegionModel.set("physicsBox.height", cacheHeight + pixel);
				siderLineRowModel.set("height", cacheHeight + pixel);
			} else {
				cacheTop = selectRegionModel.get("physicsBox").top;
				selectRegionModel.set("physicsBox.top", cacheTop + pixel);
				siderLineRowModel.set("top", cacheTop + pixel);
			}

		},
		/**
		 * 视图销毁
		 * @method destroy
		 */
		destroy: function() {
			Backbone.off('call:rowsHeadContainer');
			Backbone.off('event:rowsHeadContainer:relaseSpaceEffect');
			Backbone.off('event:rowHeightAdjust');
			this.undelegateEvents();
			this.remove();
		}
	});
	return RowsHeadContainer;
});