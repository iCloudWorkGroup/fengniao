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
		SelectRegionModel = require('models/selectRegion'),
		headItemRows = require('collections/headItemRow'),
		headItemCols = require('collections/headItemCol'),
		cells = require('collections/cells'),
		selectRegions = require('collections/selectRegion'),
		siderLineRows = require('collections/siderLineRow'),
		siderLineCols = require('collections/siderLineCol'),
		HeadItemColContainer = require('views/headItemColContainer'),
		ColsSpaceLineContainer = require('views/colsSpaceLineContainer'),
		gridRowList = headItemRows.models,
		gridColList = headItemCols.models,
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
		 * 鼠标点击处理状态
		 * @type {fn}
		 */
		locatedState: null,
		/**
		 * 鼠标移动处理状态
		 * @type {fn}
		 */
		moveState: null,
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
					'mousedown .col-head-item': 'locatedHandle',
					/**
					 * 鼠标移动时，判断位置，确实是否需要作出效果调整
					 * @event mousemove
					 */
					'mousemove .col-head-item': 'moveHandle'
				});
			}
			Backbone.on('event:colsHeadContainer:relaseSpaceEffect', this.relaseSpaceEffect, this);
			Backbone.on('event:colWidthAdjust', this.colWidthAdjust, this);
			Backbone.on('event:restoreHideCols', this.restoreHideCols, this);
			Backbone.on('event:colsHeadContainer:setMouseState', this.setMouseState, this);
			/**
			 * 已经加载列数
			 * @property {int} colNumber
			 */
			this.colNumber = 0;
			this.listenTo(headItemCols, 'add', this.addColsHeadContainer);

			this.moveState = this.commonMoveState;
			this.locatedState = this.selectLocatedState;
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
			return this;
		},
		moveHandle: function(event) {
			this.moveState && this.moveState(event);
		},
		locatedHandle: function(event) {
			this.locatedState(event);
		},
		setMouseState: function(type, state) {
			if (state !== null) {
				this[type] = this[state];
			} else {
				this[type] = null;
			}
		},
		selectLocatedState: function(e) {
			//拖拽视图
			if (this._isAdjustable(e) && !e.shiftKey && !cache.protectState) {
				this.spaceEffect(e);
				return;
			}
			//选中视图
			var select = selectRegions.getModelByType('selected'),
				containerId = cache.containerId,
				mousePosi;

			mousePosi = this._getRelativePosi(event.clientX);
			this.adjustLocatedModel(mousePosi, select, e.shiftKey);
			Backbone.trigger('event:cellsContainer:setMouseState', 'moveState', 'selectMoveState');
			Backbone.trigger('event:colsHeadContainer:setMouseState', 'moveState', 'selectMoveState');
		},
		dataSourceLocatedState: function(event) {
			var select = selectRegions.getModelByType('datasource'),
				mousePosi;
			if (typeof select === 'undefined') {
				select = new SelectRegionModel();
				select.set('selectType', 'datasource');
				selectRegions.add(select);
			}
			mousePosi = this._getRelativePosi(event.clientX);
			this.adjustLocatedModel(mousePosi, select, event.shiftKey);
			Backbone.trigger('event:cellsContainer:setMouseState', 'moveState', 'dataSourceMoveState');
			Backbone.trigger('event:colsHeadContainer:setMouseState', 'moveState', 'dataSourceMoveState');
		},
		selectMoveState: function(e) {
			var select = selectRegions.getModelByType('selected'),
				mousePosi,
				tempPosi,
				colIndex;
			mousePosi = this._getRelativePosi(e.clientX);
			colIndex = binary.modelBinary(mousePosi, gridColList, 'left', 'width');
			tempPosi = select.set('tempPosi.mouseColIndex', colIndex);
		},
		dataSourceMoveState: function(event) {
			var select = selectRegions.getModelByType('datasource'),
				mousePosi,
				tempPosi,
				colIndex;
			mousePosi = this._getRelativePosi(event.clientX);
			colIndex = binary.modelBinary(mousePosi, gridColList, 'left', 'width');
			tempPosi = select.set('tempPosi.mouseColIndex', colIndex);
		},
		commonMoveState: function(e) {
			e.currentTarget.style.cursor = this._isAdjustable(e) === true && !cache.protectState ? 'col-resize' : '';
		},
		adjustLocatedModel: function(posi, select, continuous) {
			var modelCell,
				startColIndex,
				endColIndex,
				wholePosi,
				temp;
			//this model index of headline
			endColIndex = binary.modelBinary(posi, gridColList, 'left', 'width');
			wholePosi = select.get('wholePosi');
			if (continuous) {
				startColIndex = headItemCols.getIndexByAlias(wholePosi.startX);
			} else {
				startColIndex = endColIndex;
			}
			select.set('tempPosi', {
				initColIndex: startColIndex,
				initRowIndex: 'MAX',
				mouseColIndex: endColIndex,
				mouseRowIndex: 0
			});
		},
		/**
		 * 确认是否可以调整
		 * @method isAdjustable
		 * @param  {event}     e
		 * @return {Boolean}
		 */
		_isAdjustable: function(e) {
			var overEl = this.itemEl || e.currentTarget;
			return e.pageX - $(overEl).offset().left > overEl.clientWidth - config.System.effectDistanceCol ? true : false;
		},
		_getRelativePosi: function(posi) {
			var containerId = cache.containerId;
			return posi - $('#' + containerId).offset().left - config.System.outerLeft + cache.viewRegion.scrollLeft;
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
			Backbone.trigger('event:screenContainer:mouseMoveHeadContainer', {
					spaceMouse: this.itemEl.clientWidth - e.offsetX,
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
			Backbone.trigger('event:cellsContainer:adaptWidth');
			Backbone.trigger('event:colsAllHeadContainer:adaptWidth');
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
			Backbone.off('event:colsHeadContainer:setMouseState');
			this.undelegateEvents();
			this.headItemColContainer.destroy();
			this.remove();
		}
	});
	return ColsHeadContainer;
});