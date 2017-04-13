define(function(require) {
	'use strict';
	var $ = require('lib/jquery'),
		_ = require('lib/underscore'),
		Backbone = require('lib/backbone'),
		binary = require('basic/util/binary'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		util = require('basic/util/clone'),
		Cell = require('models/cell'),
		listener = require('basic/util/listener'),
		SelectRegionModel = require('models/selectRegion'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		selectRegions = require('collections/selectRegion'),
		cells = require('collections/cells'),
		GridLineContainer = require('views/gridLineContainer'),
		ContentCellsContainer = require('views/contentCellsContainer'),
		SelectRegionView = require('views/selectRegion'),
		headItemColList = headItemCols.models,
		headItemRowList = headItemRows.models;


	/**
	 * cells容器实体类
	 * @author ray wu
	 * @since 0.1.0
	 * @class CellsContainer  
	 * @module views
	 * @extends Backbone.View
	 * @constructor
	 */
	var CellsContainer = Backbone.View.extend({
		/**
		 * 绑定视图
		 * @property el
		 * @type {String}
		 */
		className: 'cells-container',
		/**
		 * 绑定鼠标事件
		 * @property events
		 * @type {Object}
		 */
		events: {
			'mousedown': 'located',
		},
		/**
		 * 类初始化调用方法，绑定集合监听
		 * @method initialize
		 * @param  allAttributes 容器属性
		 */
		initialize: function(options) {

			Backbone.on('event:cellsContainer:adaptWidth', this.adaptWidth, this);
			Backbone.on('event:cellsContainer:adaptHeight', this.adaptHeight, this);

			//鼠标拖动事件绑定与解绑（解决冻结拆分情况下拖动绑定问题）
			Backbone.on('event:cellsContainer:unBindDrag', this.unBindDragSelect, this);
			Backbone.on('event:cellsContainer:bindDrag', this.bindDragSelect, this);

			//像素点转换为excel的坐标点
			Backbone.on('event:cellsContainer:getCoordinateDisplayName', this.getCoordinateDisplayName, this);
			//待验证：视图是否，都需要调用该方法，对象才能进行回收
			Backbone.on('event:cellsContainer:destroy', this.destroy, this);

			//使用extend+订阅模式分离
			Backbone.on('event:cellsContainer:startHighlight', this.startHighlight, this);
			Backbone.on('event:cellsContainer:stopHighlight', this.stopHighlight, this);
			this.currentRule = util.clone(cache.CurrentRule);
			//记录冻结情况下导致视图移动大小
			if (cache.TempProp.isFrozen === true) {
				this.userViewTop = headItemRows.getModelByAlias(cache.UserView.rowAlias).get('top');
				this.userViewLeft = headItemCols.getModelByAlias(cache.UserView.colAlias).get('left');
				this.offsetTop = this.currentRule.displayPosition.offsetTop;
				this.offsetLeft = this.currentRule.displayPosition.offsetLeft;
			} else {
				this.userViewTop = 0;
				this.userViewLeft = 0;
				this.offsetTop =0;
				this.offsetLeft = 0;
			}

			//监听剪切板选中区域创建
			this.listenTo(selectRegions, 'add', this.addSelectRegionView);
			_.bindAll(this, 'dragSelect', 'highlightRegionMove');

			this.boxAttributes = options.boxAttributes;
			//需要保留对父级视图的引用，需要父级视图的滚动像素，进行定位 
			this.parentView = options.parentView;
			//避免冻结情况下多个视图绑定该事件
			if (!cache.TempProp.isFrozen ||
				(this.currentRule.displayPosition.endRowIndex &&
					this.currentRule.displayPosition.endColIndex)) {
				Backbone.on('event:cellsContainer:moveSelectRegion', this.moveSelectRegion, this);
			}
		},
		/**
		 * 渲染方法
		 * @method render 
		 */
		render: function() {
			var modelList = selectRegions.models,
				contentCellsContainer,
				gridLineContainer,
				len,
				i;

			this.$el.css({
				'width': this.boxAttributes.width,
				'height': this.boxAttributes.height
			});
			//待修改：父类不保存子类的引用（修改还原行列方式为订阅方式后，再进行修改）
			this.gridLineContainer = new GridLineContainer();
			this.contentCellsContainer = new ContentCellsContainer();
			this.$el.append(this.gridLineContainer.render().el);
			this.$el.append(this.contentCellsContainer.render().el);
			len = modelList.length;
			for (i = 0; i < len; i++) {
				this.addSelectRegionView(modelList[i]);
			}
			return this;
		},
		/**
		 * 自适应宽度
		 */
		adaptWidth: function() {
			var width = 0,
				left = 0,
				len, i;

			len = this.currentRule.displayPosition.endColIndex || headItemColList.length - 1;
			for (i = len; i > -1; i--) {
				if (!headItemColList[i].get('hidden')) {
					left = headItemColList[i].get('left');
					width = headItemColList[i].get('width');
					break;
				}
			}
			this.$el.css('width', left + width);
		},
		/**
		 * 自适应高度
		 */
		adaptHeight: function() {
			var height = 0,
				top = 0,
				len, i;

			len = this.currentRule.displayPosition.endRowIndex || headItemRowList.length - 1;
			for (i = len; i > -1; i--) {
				if (!headItemRowList[i].get('hidden')) {
					top = headItemRowList[i].get('top');
					height = headItemRowList[i].get('height');
					break;
				}
			}
			this.$el.css('height', top + height);
		},
		/**
		 * 待修改:类似方法应该进行合并
		 * 通过像素位置,获取excel的行列坐标(callback应该放到末尾)
		 * @param  {number}   colPosi 列坐标
		 * @param  {number}   rowPosi 行坐标
		 * @return {object}               
		 */
		getCoordinate: function(colPosi, rowPosi) {
			var containerId = cache.containerId,
				clientColPosi,
				clientRowPosi,
				relativeColPosi,
				relativeRowPosi,
				endColIndex,
				endRowIndex,
				endColPosi,
				endRowPosi,
				colIndex,
				rowIndex,
				coordinate;

			//相对于父级容器的坐标
			clientColPosi = colPosi - config.System.outerLeft - $('#' + containerId).offset().left;
			clientRowPosi = rowPosi - config.System.outerTop - $('#' + containerId).offset().top;

			//过滤掉不在当前视图区域的坐标点
			if (cache.TempProp.isFrozen === true) {
				endColIndex = this.currentRule.displayPosition.endColIndex;
				endRowIndex = this.currentRule.displayPosition.endRowIndex;
				endColPosi = endColIndex && headItemColList[endColIndex].get('left') + headItemColList[endColIndex].get('width') - this.userViewLeft;
				endRowPosi = endRowIndex && headItemRowList[endRowIndex].get('top') + headItemRowList[endRowIndex].get('height') - this.userViewTop;
				
				if (clientColPosi < this.offsetLeft || (endColIndex && clientColPosi > endColPosi)) {
					return;
				}
				if (clientRowPosi < this.offsetTop || (endRowIndex && clientRowPosi > endRowPosi)) {
					return;
				}
			}
			relativeColPosi = clientColPosi + this.parentView.el.scrollLeft + this.userViewLeft;
			relativeRowPosi = clientRowPosi + this.parentView.el.scrollTop + this.userViewTop;

			colIndex = binary.modelBinary(relativeColPosi, headItemColList, 'left', 'width');
			rowIndex = binary.modelBinary(relativeRowPosi, headItemRowList, 'top', 'height');
			return {
				colIndex: colIndex,
				rowIndex: rowIndex
			}
		},
		/**
		 * 通过点击事件，获取位置信息
		 * @param  {object} 鼠标点击事件对象
		 */
		getCoordinateByMouseEvent: function(event) {
			var mouseColPosi = event.clientX,
				mouseRowPosi = event.clientY;
			return this.getCoordinate(mouseColPosi, mouseRowPosi);
		},
		/**
		 * 根据坐标像素点获取表格坐标信息（用于对外开放接口）
		 * @param  {number}   colPosi 列坐标
		 * @param  {number}   rowPosi 行坐标
		 * @param  {Function} fn      回调函数
		 */
		getCoordinateDisplayName: function(colPosi, rowPosi, fn) {
			var region = this.currentRule.displayPosition,
				coordinate,
				clientColPosi,
				clientRowPosi,
				limitLeft = 0,
				limitTop = 0,
				limitRight,
				limitBottom;

			limitLeft = headItemColList[region.startColIndex].get('left');
			limitTop = headItemRowList[region.startRowIndex].get('top');

			if (typeof region.endColIndex !== 'undefined') {
				limitRight = headItemColList[region.endColIndex].get('left') + headItemColList[region.endColIndex].get('width');
			}
			if (typeof region.endRowIndex !== 'undefined') {
				limitTop = headItemRowList[region.endRowIndex].get('top') + headItemRowList[region.endRowIndex].get('height');
			}

			clientColPosi = colPosi - config.System.outerLeft - $('#' + containerId).offset().left;
			clientRowPosi = rowPosi - config.System.outerTop - $('#' + containerId).offset().top;
			//判断坐标是否在当前的视图区域内
			if (clientColPosi > limitRight || clientColPosi < limitLeft ||
				clientRowPosi > limitBottom || clientRowPosi < limitTop) {
				return;
			}

			var coordinate = this.getCoordinate(colPosi, rowPosi);
			if (typeof fn === 'function' && typeof coordinate !== 'undefined') {
				fn({
					col: headItemColList[coordinate.colIndex].get('displayName'),
					row: headItemRowList[coordinate.rowIndex].get('displayName')
				});
			}
		},
		/**
		 * 开启单元格边框高亮功能
		 */
		startHighlight: function() {
			//鼠标移动阻止原有事件（mousedown,mousemove）
			this.undelegateEvents();
			this.$el.off('mousemove', this.dragSelect);
			//监听鼠标移动事件
			this.$el.on('mousemove', this.highlightRegionMove);
		},
		/**
		 * 待修改：高亮属于扩展功能，应该作为扩展模块
		 * 高亮
		 * @param  {object} event 鼠标移动事件
		 */
		highlightRegionMove: function(event) {
			var self = this,
				cellModel,
				selectBox,
				startColPosi,
				endColPosi,
				startRowPosi,
				endRowPosi,
				direction,
				hightlightModel,
				left, top, width, right, height, bottom;

			selectBox = this.getCoordinateByMouseEvent(event);
			cellModel = selectBox.model;
			if (cellModel !== undefined && cellModel.get("highlight") === true) {
				left = cellModel.get('physicsBox').left;
				top = cellModel.get('physicsBox').top;
				height = cellModel.get('physicsBox').height;
				width = cellModel.get('physicsBox').width;
				right = left + width;
				bottom = top + height;
			} else {
				cache.highlightDirection = 'null';
				if (this.hightlightView !== null && this.hightlightView !== undefined) {
					this.hightlightModel.destroy();
					this.hightlightView = null;
				}
				return;
			}
			direction = getLightDirection();
			if (this.hightlightView === null || this.hightlightView === undefined) {
				hightlightModel = new SelectRegionModel();
				this.hightlightModel = hightlightModel;
				hightlightModel.set("selectType", "extend");
				this.hightlightView = new SelectRegionView({
					model: hightlightModel,
					className: 'highlight-container',
					parentView: this
				});
				this.$el.append(this.hightlightView.render().el);
			}

			this.hightlightModel.set("physicsBox", {
				left: left,
				top: top,
				bottom: bottom,
				right: right
			});
			this.hightlightModel.set("physicsBox", {
				height: height,
				width: width
			});
			clearHighlight();
			this.hightlightView.$el.addClass('highlight-' + direction);
			cache.highlightDirection = direction;

			function getLightDirection() {
				var mouseColPosi = self.getMouseColRelativePosi(event),
					mouseRowPosi = self.getMouseRowRelativePosi(event),
					rightDistance = right - mouseColPosi,
					leftDistance = mouseColPosi - left,
					topDistance = mouseRowPosi - top,
					bottomDistance = bottom - mouseRowPosi,
					temp = rightDistance,
					direction = "right";

				if (temp > leftDistance) {
					temp = leftDistance;
					direction = "left";
				}
				if (temp > topDistance) {
					temp = topDistance;
					direction = "top";
				}
				if (temp > bottomDistance) {
					temp = bottomDistance;
					direction = "bottom";
				}
				return direction;
			}

			function clearHighlight() {
				self.hightlightView.$el.removeClass("highlight-right");
				self.hightlightView.$el.removeClass("highlight-left");
				self.hightlightView.$el.removeClass("highlight-top");
				self.hightlightView.$el.removeClass("highlight-bottom");
			}
		},
		/**
		 * 停止单元格边框高亮功能
		 * @return {[type]} [description]
		 */
		stopHighlight: function() {
			//移除鼠标事件监听
			this.$el.off('mousemove', this.highlightRegionMove);
			//绑定视图原有事件
			this.delegateEvents();
			if (this.hightlightView !== null && this.hightlightView !== undefined) {
				this.hightlightModel.destroy();
				this.hightlightView = null;
			}
		},
		/**
		 * 该功能迁移到maincontainer
		 * @param  {[type]} direction [description]
		 * @return {[type]}           [description]
		 */
		// moveSelectRegion: function(direction) {
		// 	switch (direction) {
		// 		case 'LEFT':
		// 			break;
		// 		case 'RIGHT':
		// 			break;
		// 		case 'UP':
		// 			break;
		// 		case 'DOWN':
		// 			this.downSelectRegion();
		// 			break;
		// 		default:
		// 			break;
		// 	}
		// },
		// downSelectRegion: function() {
		// 	var endRowIndex,
		// 		startColIndex,
		// 		modelCell,
		// 		startPosiX,
		// 		startPosiY,
		// 		endPosiX,
		// 		endPosiY,
		// 		cellsPositionX,
		// 		aliasGridRow,
		// 		aliasGridCol,
		// 		options,
		// 		left, top, height, width;

		// 	selectModel = selectRegions.getModelByType('operation');
		// 	//待修改：select保存sort值
		// 	endRowIndex = headItemRows.getIndexByAlias(selectModel.get('wholePosi').endY);
		// 	startColIndex = headItemCols.getIndexByAlias(selectModel.get('wholePosi').startX);
		// 	//向下移动超出已加载区域，需要进行自动滚动操作
		// 	if (endRowIndex === headItemRows.length - 1) {

		// 	}
		// 	aliasGridRow = headItemRows.models[endRowIndex + 1].get('alias');
		// 	aliasGridCol = selectRegions.models[0].get('wholePosi').startX;

		// 	cellsPositionX = cache.CellsPosition.strandX;

		// 	if (cellsPositionX[aliasGridCol] !== undefined &&
		// 		cellsPositionX[aliasGridCol][aliasGridRow] !== undefined) {
		// 		modelCell = cells.models[cellsPositionX[aliasGridCol][aliasGridRow]];
		// 	}

		// 	options = {
		// 		initColIndex: startPosiX,
		// 		initRowIndex: startPosiY,
		// 		mouseColIndex: endPosiX,
		// 		mouseRowIndex: endPosiY,
		// 	};
		// 	this.adjustRegion(selectModel, options);
		// },
		/**
		 * 添加选中区域
		 * @method addSelectRegionView
		 */
		addSelectRegionView: function(model) {
			var className,
				selectRegionView,
				type = model.get('selectType');

			if (type === 'operation') {
				className = 'selected-container';
			} else if (type === 'dataSource') {
				className = 'datasource-container';
			} else if (type === 'clip') {
				className = 'clip-container';
			}
			selectRegionView = new SelectRegionView({
				model: model,
				className: className,
				currentRule: this.currentRule,
				parentView: this
			});
			this.$el.append(selectRegionView.render().el);
		},
		/**
		 * 单击网格区域
		 * @param  {[type]} event 单击事件对象
		 */
		located: function(event) {
			var selectModel;
			// this is question , need deprecated
			// when input data time avoid trigger this effect.
			if (cache.commentEditState) {
				return;
			}
			if ($(event.target).attr('class') === 'edit-frame') {
				return;
			}
			this.changePosi(event.clientX, event.clientY, selectModel);
			Backbone.trigger('event:cellsContainer:bindDrag');
		},
		/**
		 * 单元格区域单击事件处理
		 * @method changePosi
		 * @param  e {event} 单击事件
		 */
		changePosi: function(colPosi, rowPosi, selectModel) {
			var strandCol = cache.CellsPosition.strandX,
				occupyCol,
				occupyRow,
				coordinate,
				modelCell,
				startColIndex,
				startRowIndex,
				endColIndex,
				endRowIndex,
				colDisplayNames = [],
				rowDisplayNames = [],
				aliasCol,
				aliasRow,
				text = '',
				i;

			//获取点击位置信息
			coordinate = this.getCoordinate(colPosi, rowPosi);
			endColIndex = startColIndex = coordinate.colIndex;
			endRowIndex = startRowIndex = coordinate.rowIndex;
			aliasCol = headItemColList[startColIndex].get('alias');
			aliasRow = headItemRowList[startRowIndex].get('alias');

			if (strandCol[aliasCol] && typeof strandCol[aliasCol][aliasRow] !== 'undefined') {
				modelCell = cells.models[strandCol[aliasCol][aliasRow]];
				occupyCol = modelCell.get('occupy').x;
				occupyRow = modelCell.get('occupy').y;
				startColIndex = startColIndex - occupyCol.indexOf(aliasCol);
				startRowIndex = startRowIndex - occupyRow.indexOf(aliasRow);
				endColIndex = endColIndex + occupyCol.length - occupyCol.indexOf(aliasCol) - 1;
				endRowIndex = endRowIndex + occupyRow.length - occupyRow.indexOf(aliasRow) - 1;
				//对单元格未完全加载做处理
				endRowIndex = endRowIndex < headItemRows.length ? endRowIndex : headItemRows.length - 1;
				text = modelCell.get('content.texts');
			}

			if (cache.mouseOperateState === config.mouseOperateState.dataSource) {
				selectModel = selectRegions.getModelByType("dataSource");
				if (typeof selectModel === 'undefined') {
					selectModel = new SelectRegionModel();
					selectModel.set('selectType', 'dataSource');
					selectRegions.add(selectModel);
				}
			} else {
				selectModel = selectRegions.getModelByType("operation");
			}
			selectModel.set('tempPosi', {
				initColIndex: startColIndex,
				initRowIndex: startRowIndex,
				mouseColIndex: endColIndex,
				mouseRowIndex: endRowIndex
			});

			//开放监听事件
			var result = {};
			for (i = startColIndex; i < endColIndex + 1; i++) {
				colDisplayNames.push(headItemColList[i].get('displayName'));
			}
			for (i = startRowIndex; i < endRowIndex + 1; i++) {
				rowDisplayNames.push(headItemRowList[i].get('displayName'));
			}
			result.point = {
				col: colDisplayNames,
				row: rowDisplayNames
			};
			result.text = text;
			result.property = fillCellProperty(modelCell);
			listener.excute('mousedown', result);

			function fillCellProperty(model) {
				var modelJSON;
				if (typeof model === 'undefined') {
					model = new Cell();
				}
				modelJSON = model.toJSON();
				return {
					size: modelJSON.content.size,
					family: modelJSON.content.family,
					bd: modelJSON.content.bd,
					italic: modelJSON.content.italic,
					color: modelJSON.content.color,
					alignRow: modelJSON.content.alignRow,
					alignCol: modelJSON.content.alignCol,
					background: modelJSON.customProp.background,
					format: modelJSON.customProp.format,
					wordWrap: modelJSON.wordWrap
				}
			}
		},
		/**
		 * 绑定鼠标拖拽事件
		 * @method bindDrag
		 */
		bindDragSelect: function() {
			this.$el.on('mousemove', this.dragSelect);
		},
		/**
		 * 移除鼠标拖拽事件
		 * @method unBindDrag 
		 */
		unBindDragSelect: function() {
			this.$el.off('mousemove', this.dragSelect);
		},
		dragSelect: function(event) {
			this.select(event.clientX, event.clientY);
		},
		/**
		 * 鼠标拖动选择区域
		 * @param  {number} colPosi 纵向坐标
		 * @param  {number} rowPosi 横向坐标
		 */
		select: function(colPosi, rowPosi) {
			var initColIndex,
				initRowIndex,
				lastColMouse,
				lastRowMouse,
				mouseColIndex,
				mouseRowIndex,
				selectModel,
				coordinate,
				colIndex,
				rowIndex;


			coordinate = this.getCoordinate(colPosi, rowPosi);
			mouseColIndex = coordinate.colIndex;
			mouseRowIndex = coordinate.rowIndex;

			if (cache.mouseOperateState === config.mouseOperateState.dataSource) {
				selectModel = selectRegions.getModelByType("dataSource");
			} else {
				selectModel = selectRegions.getModelByType("operation");
			}

			//鼠标开始移动索引
			initColIndex = selectModel.get('tempPosi').initColIndex;
			initRowIndex = selectModel.get('tempPosi').initRowIndex;
			//上次移动鼠标坐标
			lastColMouse = selectModel.get('tempPosi').mouseColIndex;
			lastRowMouse = selectModel.get('tempPosi').mouseRowIndex;

			//判断是否需要渲染
			if (lastColMouse === mouseColIndex && lastRowMouse === mouseRowIndex) {
				return;
			}
			selectModel.set('tempPosi', {
				initColIndex: initColIndex,
				initRowIndex: initRowIndex,
				mouseColIndex: mouseColIndex,
				mouseRowIndex: mouseRowIndex
			});
		},
		/**
		 * 视图销毁
		 * @method destroy
		 */
		destroy: function() {
			var i = 0,
				len,
				selectModelList;
			Backbone.off('event:cellsContainer:destroy');
			Backbone.off('event:cellsContainer:selectRegionChange');
			Backbone.off('event:cellsContainer:adaptSelectRegion');
			Backbone.off('event:cellsContainer:unBindDrag');
			Backbone.off('event:cellsContainer:bindDrag');
			Backbone.off('event:cellsContainer:getCoordinate');
			Backbone.off('event:cellsContainer:startHighlight');
			Backbone.off('event:cellsContainer:stopHighlight');
			Backbone.off('event:cellsContainer:adaptWidth');
			Backbone.off('event:cellsContainer:adaptHeight');
			//待修改：更改为触发事件
			// this.contentCellsContainer.destroy();
			// this.selectRegion.destroy();
			selectModelList = selectRegions.models;
			len = selectModelList.length;
			for (; i < len; i++) {
				if (selectModelList[i].get('selectType') !== 'operation') {
					selectModelList[i].destroy();
				}
			}
			this.remove();
		}
	});
	return CellsContainer;
});