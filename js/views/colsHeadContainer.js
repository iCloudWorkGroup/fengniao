//attention bug, when call object , we can setting unified method
//attention bug, adjust gridline methods , can be combin ,because of highly similarity
//and for improve performace
define(function(require) {
	'use strict';
	var $ = require('lib/jquery'),
		_ = require('lib/underscore'),
		Backbone = require('lib/backbone'),
		config = require('spreadsheet/config'),
		binary = require('basic/util/binary'),
		cache = require('basic/tools/cache'),
		send = require('basic/tools/send'),
		getDisplayName = require('basic/tools/getdisplayname'),
		headItemRows = require('collections/headItemRow'),
		headItemCols = require('collections/headItemCol'),
		cells = require('collections/cells'),
		selectRegions = require('collections/selectRegion'),
		siderLineRows = require('collections/siderLineRow'),
		siderLineCols = require('collections/siderLineCol'),
		HeadItemColContainer = require('views/headItemColContainer'),
		ColsSpaceLineContainer = require('views/colsSpaceLineContainer'),
		ColsHeadContainer;
	/**
	 * ColsHeadContainer
	 * @author ray wu
	 * @since 0.1.0
	 * @class ColsHeadContainer  
	 * @module views
	 * @extends Backbone.View
	 * @constructor
	 */
	//ps:index修改为alias,列宽调整功能
	ColsHeadContainer = Backbone.View.extend({
		/**
		 * @property {element} className
		 */
		className: 'col-head-panel',
		/**
		 * 初始化事件监听
		 * @method initialize
		 */
		initialize: function() {
			if (!cache.TempProp.isFrozen) {
				this.delegateEvents({
					/**
					 * 选中每列时，判断是不是需要调整列或者选中整个列
					 * @event mousedown
					 */
					'mousedown .col-head-item': 'transAction',
					/**
					 * 鼠标移动时，判断位置，确实是否需要作出效果调整
					 * @event mousemove
					 */
					'mousemove .col-head-item': 'overEffect'
				});
			}
			Backbone.on('call:colsHeadContainer', this.callColsHeadContainer, this);
			Backbone.on('event:colsHeadContainer:relaseSpaceEffect', this.relaseSpaceEffect, this);
			Backbone.on('event:colWidthAdjust', this.colWidthAdjust, this);
			Backbone.on('event:restoreHideCols', this.restoreHideCols, this);
			/**
			 * 已经加载列数
			 * @property {int} colNumber
			 */
			this.colNumber = 0;
			this.listenTo(headItemCols, 'add', this.addColsHeadContainer);
		},
		/**
		 * 渲染本身对象
		 * @method render
		 * @return {object} 返回自身对象`this`
		 */
		render: function() {
			var i = 0,
				modelsHeadLineColList,
				modelsHeadLineColRegionList,
				len,
				activeModelList,
				modelList = headItemCols;
			modelsHeadLineColList = modelsHeadLineColRegionList = modelList.models;
			if (cache.TempProp.isFrozen) {
				this.currentRule = cache.CurrentRule;
				if (this.currentRule.displayPosition.endIndex !== undefined) {
					modelsHeadLineColRegionList = modelsHeadLineColList.slice(this.currentRule.displayPosition.startIndex, this.currentRule.displayPosition.endColIndex);
				} else {
					modelsHeadLineColRegionList = modelsHeadLineColList.slice(this.currentRule.displayPosition.startIndex);
				}
			}

			len = modelsHeadLineColRegionList.length;
			for (; i < len; i++) {
				if (!modelsHeadLineColRegionList[i].get('hidden')) {
					this.addColsHeadContainer(modelsHeadLineColRegionList[i]);
				}
				this.colNumber++;
			}
			//ensure y or n has exist active model,
			//if exist , the first model will be not active this.
			activeModelList = modelList.where({
				'activeState': true
			});
			if (activeModelList.length === 0) {
				modelsHeadLineColList[0].set('activeState', true);
			}
			this.triggerCallback();
			return this;
		},
		/**
		 * 获取他们view层的对象到当前页面
		 * @method triggerCallback
		 */
		triggerCallback: function() {
			_.bindAll(this, 'callView');
			Backbone.trigger('call:screenContainer', this.callView('viewScreenContainer'));
			Backbone.trigger('call:mainContainer', this.callView('viewMainContainer'));
			Backbone.trigger('call:cellsContainer', this.callView('viewCellsContainer'));
			Backbone.trigger('call:colsAllHeadContainer', this.callView('viewColsAllHeadContainer'));
		},
		/**
		 * 对外开放本对象
		 * @method callColsHeadContainer
		 * @param  {function} receiveFunc 传入接受对象的方法
		 */
		callColsHeadContainer: function(receiveFunc) {
			receiveFunc(this);
		},
		/**
		 * 当前对象鼠标样式更改
		 * @method overEffect
		 * @param  {event}   e
		 */
		overEffect: function(e) {
			e.currentTarget.style.cursor = this.isAdjustable(e) === true && !cache.protectState ? 'col-resize' : '';
		},
		/**
		 * 确认是否可以调整
		 * @method isAdjustable
		 * @param  {event}     e
		 * @return {Boolean}
		 */
		isAdjustable: function(e) {
			var overEl = this.itemEl || e.currentTarget;
			return e.pageX - $(overEl).offset().left > overEl.clientWidth - config.System.effectDistanceCol ? true : false;
		},
		//ps:index修改为alias,整行选中
		/**
		 * 传递动作
		 * @method transAction
		 * @param  {event} e
		 */
		transAction: function(e) {
			if (!this.isAdjustable(e)) {
				this.colLocate(e);
				return;
			}
			this.spaceEffect(e);
		},
		/**
		 * 列调整时效果，绑定移动事件
		 * @method spaceEffect
		 * @param  {event}    e
		 */
		spaceEffect: function(e) {
			/**
			 * 当前选中的对象
			 * @property {object} itemEL
			 */
			this.itemEl = e.currentTarget;
			/**
			 * 当前对象的封装对象，方便调用
			 * @property {object} $itemEl
			 */
			this.$itemEl = $(this.itemEl);
			/**
			 * 选中对象的`offsetWidth`
			 * @property {number} cacheItemElOffsetWidth
			 */
			this.cacheItemElOffsetWidth = this.itemEl.offsetWidth;
			/**
			 * 移动时，被锁定的DOM内容
			 * @property {element} $lockData
			 */
			this.$lockData = $('.col-head-item:gt(' + this.$itemEl.index() + ')', this.el);
			/**
			 * 增加临时容器，保存所以的DOM内容
			 * @property {element} $tempSpaceContainer
			 */
			this.$tempSpaceContainer = $('<div/>').addClass('temp-space-container').html(this.$lockData);
			this.$el.append(this.$tempSpaceContainer);
			this.viewScreenContainer.mouseMoveHeadContainer(e, {
					spaceMouse: this.itemEl.clientWidth - e.offsetX,
					// from currentTarget rightBorder caculation distance to document
					offsetleftByRight: this.itemEl.clientWidth + this.$itemEl.offset().left,
					self: this
				},
				this.moveEvent);
			this.colsSpaceLineContainer = new ColsSpaceLineContainer({
				boxAttributes: {
					left: this.itemEl.offsetLeft + this.itemEl.clientWidth
				}
			});
			$('.line-container').append(this.colsSpaceLineContainer.render().el);
		},
		/**
		 * 还原列
		 * @method relaseSpaceEffect
		 * @param  {event} e
		 */
		relaseSpaceEffect: function(e) {
			var i = 0,
				itemElIndex,
				width,
				diffDistance;
			if (!this.$lockData) {
				return;
			}
			itemElIndex = headItemCols.getIndexByAlias(this.$itemEl.data('alias'));
			diffDistance = this.itemEl.offsetWidth - this.cacheItemElOffsetWidth;
			width = diffDistance + headItemCols.models[itemElIndex].get('width');
			this.colWidthAdjust(itemElIndex, width);
			//first element
			this.$el.append(this.$lockData);
			this.$tempSpaceContainer.remove();
			this.itemEl = this.$itemEl = this.$lockData = null;
		},
		colWidthAdjust: function(itemElIndex, width) {
			var diffDistance = width - headItemCols.models[itemElIndex].get('width');
			this.adjustHeadLine(itemElIndex, diffDistance);
			this.adjustCells(itemElIndex, diffDistance);
			this.adjustSelectRegion(itemElIndex, diffDistance);
			this.requstAdjust(itemElIndex, width);
			this.triggerCallback();
			Backbone.trigger('event:cellsContainer:adaptWidth');
			this.viewColsAllHeadContainer.$el.css({
				width: headItemCols.getMaxDistanceWidth()
			});
		},
		restoreHideCols: function() {
			var headItemColList = headItemCols.models,
				len = headItemColList.length,
				i = 0;
			for (; i < len; i++) {
				if (headItemColList[i].get('hidden')) {
					this.addColsHeadContainer(headItemColList[i]);
				}
			}
		},
		/**
		 * 发送列调整的请求到后台
		 * @method requstAdjust
		 */
		requstAdjust: function(colIndex, offset) {
			var colSort = headItemCols.models[colIndex].get('sort');
			send.PackAjax({
				url: config.url.col.adjust,
				data: JSON.stringify({
					sheetId: '1',
					col: colSort,
					offset: offset
				})
			});
		},
		/**
		 * 列调整时，鼠标移动事件
		 * @method moveEvent
		 * @param  {[event}  e
		 */
		moveEvent: function(e) {
			var transData = e.data,
				mouseSpace = e.pageX + transData.spaceMouse,
				itemElWidth = parseInt(mouseSpace - transData.self.$itemEl.offset().left, 0);
			if (itemElWidth < config.System.effectDistanceCol) {
				return;
			}
			transData.self.$itemEl.css('width', itemElWidth);
			transData.self.$tempSpaceContainer.css('left', parseInt(mouseSpace - transData.offsetleftByRight, 0));
			transData.self.colsSpaceLineContainer.attributesRender({
				left: parseInt(mouseSpace - transData.self.$el.offset().left, 0)
			});
		},
		/**
		 * 渲染view，增加列在`head`区域内
		 * @method addColsHeadContainer
		 * @param  {object} modelHeadItemCol 列model对象
		 */
		addColsHeadContainer: function(modelHeadItemCol) {
			this.headItemColContainer = new HeadItemColContainer({
				model: modelHeadItemCol
			});
			this.$el.append(this.headItemColContainer.render().el);
		},
		/**
		 * collection增加新model对象
		 * @method createHeadItemCol
		 */
		createHeadItemCol: function() {
			headItemCols.add(this.newAttrCol());
		},
		/**
		 * 设置新对象属性
		 * @method newAttrCol
		 * @return {object} 新对象属性
		 * @deprecated 在行列调整后将会过时
		 */
		newAttrCol: function() {
			var currentObject;
			currentObject = {
				alias: (this.colNumber + 1).toString(),
				left: this.colNumber * config.User.cellWidth,
				width: config.User.cellWidth - 1,
				displayName: getDisplayName.getColDisplayName(this.colNumber)
			};
			return currentObject;
		},
		/**
		 * 回调view对象
		 * @method callView
		 * @param  {string} name 当前对象命
		 * @return {Function} 接受函数
		 */
		callView: function(name) {
			var self = this;
			return function(callback) {
				self[name] = callback;
			};
		},
		/**
		 * 定位列，选中
		 * @method colLocate
		 * @param  {event}  e
		 */
		colLocate: function(e) {
			var containerId = cache.containerId,
				rowMousePosiX,
				modelCell,
				headModelRow,
				headModelCol,
				modelIndexCol,
				headLineColModelList,
				headLineRowModelList;
			//this need to improve
			if (!this.viewMainContainer) {
				this.triggerCallback();
			}
			rowMousePosiX = e.clientX - $('#' + containerId).offset().left - config.System.outerLeft + this.viewMainContainer.el.scrollLeft;
			//headColModels,headRowModels list
			headLineRowModelList = headItemRows.models;
			headLineColModelList = headItemCols.models;

			//this model index of headline
			modelIndexCol = binary.modelBinary(rowMousePosiX, headLineColModelList, 'left', 'width', 0, headLineColModelList.length - 1);
			//head model information
			headModelCol = headLineColModelList[modelIndexCol];
			this.selectCellRows(modelIndexCol);
		},
		selectCellRows: function(index) {
			var select;
			if (cache.mouseOperateState === config.mouseOperateState.dataSource) {
				select = selectRegions.getModelByType('dataSource');
				if (select === undefined) {
					select = new SelectRegionModel();
					select.set('selectType', 'dataSource');
					selectRegions.add(select);
				}
			} else {
				select = selectRegions.getModelByType('selected');
			}
			cache.shortcut.select.rowAlias = headItemRows.models[0].get('alias');
			cache.shortcut.select.colAlias = headItemCols.models[index].get('alias');
			select.set('tempPosi', {
				initColIndex: index,
				initRowIndex: 0,
				mouseColIndex: index,
				mouseRowIndex: 'MAX'
			});
		},
		/**
		 * 调整列宽度和他们的left值
		 * @method adjustHeadLine
		 * @param  {int} index 当前对象索引
		 * @param  {移动的距离差} pixel
		 */
		adjustHeadLine: function(index, pixel) {
			var i,
				len,
				headLineList,
				gridLineList,
				tempWidth,
				tempLeft;
			headLineList = headItemCols.models;
			tempWidth = headLineList[index].get('width');
			headLineList[index].set('width', tempWidth + pixel);
			len = headLineList.length;
			for (i = index + 1; i < len; i++) {
				tempLeft = headLineList[i].get('left');
				headLineList[i].set('left', tempLeft + pixel);
			}
		},
		/**
		 * 调整影响到的单元格
		 * @method adjustCells
		 * @param  {int} index 当前对象索引
		 * @param  {移动的距离差} pixel
		 */
		adjustCells: function(index, pixel) {
			var passAdjustColCells, //经过调整列cells
				adjustCells, //其余需要调整cells
				loadColIndex,
				loadRegion,
				i,
				j,
				grilLineLen,
				len;
			passAdjustColCells = cells.getCellsByColIndex(index, index);
			len = passAdjustColCells.length;
			for (i = 0; i < len; i++) {
				passAdjustColCells[i].set('physicsBox.width', passAdjustColCells[i].get('physicsBox').width + pixel);
			}
			grilLineLen = headItemCols.length;
			adjustCells = cells.getCellsInStartColRegion(index + 1, grilLineLen - 1);
			len = adjustCells.length;
			for (j = 0; j < len; j++) {
				adjustCells[j].set('physicsBox.left', adjustCells[j].get('physicsBox').left + pixel);
			}
		},
		/**
		 * 调整选中区域
		 * @method adjustSelectRegion
		 * @param  {int} index 当前对象索引
		 * @param  {移动的距离差} pixel
		 */
		adjustSelectRegion: function(index, pixel) {
			var startColAlias,
				endColAlias,
				startColIndex,
				endColIndex,
				selectRegionModel,
				siderLineColModel,
				cacheWidth,
				cacheLeft;
			selectRegionModel = selectRegions.models[0];
			//ps:修改
			startColAlias = selectRegionModel.get('wholePosi').startX;
			endColAlias = selectRegionModel.get('wholePosi').endX;
			startColIndex = headItemCols.getIndexByAlias(startColAlias);
			endColIndex = headItemCols.getIndexByAlias(endColAlias);

			if (endColIndex < index) {
				return;
			}
			siderLineColModel = siderLineCols.models[0];
			if (startColIndex <= index) {
				cacheWidth = selectRegionModel.get("physicsBox").width;
				selectRegionModel.set("physicsBox.width", cacheWidth + pixel);
				siderLineColModel.set("width", cacheWidth + pixel);
			} else {
				cacheLeft = selectRegionModel.get("physicsBox").left;
				selectRegionModel.set("physicsBox.left", cacheLeft + pixel);
				siderLineColModel.set("left", cacheLeft + pixel);
			}
		},
		/**
		 * 视图销毁
		 * @method destroy
		 */
		destroy: function() {
			Backbone.off('call:colsHeadContainer');
			Backbone.off('event:colsHeadContainer:relaseSpaceEffect');
			Backbone.off('event:colWidthAdjust');
			Backbone.off('event:restoreHideCols');
			this.undelegateEvents();
			this.headItemColContainer.destroy();
			this.remove();
		}
	});
	return ColsHeadContainer;
});