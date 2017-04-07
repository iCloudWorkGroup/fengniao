define(function(require) {
	'use strict';
	var $ = require('lib/jquery'),
		_ = require('lib/underscore'),
		Backbone = require('lib/backbone'),
		binary = require('basic/util/binary'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		util = require('basic/util/clone'),
		listener = require('basic/util/listener'),
		SelectRegionModel = require('models/selectRegion'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		selectRegions = require('collections/selectRegion'),
		siderLineRows = require('collections/siderLineRow'),
		siderLineCols = require('collections/siderLineCol'),
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

	//ps:index修改为alias,选中区域移动操作，需要修改
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

			Backbone.on('call:cellsContainer', this.callCellsContainer, this);

			Backbone.on('event:cellsContainer:adjustSelectRegion', this.adjustSelectRegion, this);
			Backbone.on('event:cellsContainer:adaptSelectRegion', this.adaptSelectRegion, this);

			Backbone.on('event:cellsContainer:adaptWidth', this.adaptWidth, this);
			Backbone.on('event:cellsContainer:adaptHeight', this.adaptHeight, this);

			//鼠标拖动事件绑定与解绑（解决冻结拆分情况下拖动绑定问题）
			Backbone.on('event:cellsContainer:unBindDrag', this.unBindDrag, this);
			Backbone.on('event:cellsContainer:bindDrag', this.bindDrag, this);

			//像素点转换为excel的坐标点
			Backbone.on('event:cellsContainer:getCoordinateDisplayName', this.getCoordinateDisplayName, this);
			//待验证：视图是否，都需要调用该方法，对象才能进行回收
			Backbone.on('event:cellsContainer:destroy', this.destroy, this);

			//使用extend+订阅模式分离
			Backbone.on('event:cellsContainer:startHighlight', this.startHighlight, this);
			Backbone.on('event:cellsContainer:stopHighlight', this.stopHighlight, this);

			//记录冻结情况下导致视图移动大小
			if (cache.TempProp.isFrozen === true) {
				this.reduceTop = this.currentRule.displayPosition.offsetTop + headItemRows.getModelByAlias(cache.UserView.rowAlias).get('top');
				this.reduceLeft = this.currentRule.displayPosition.offsetLeft + headItemCols.getModelByAlias(cache.UserView.colAlias).get('left');
			} else {
				this.reduceTop = 0;
				this.reduceLeft = 0;
			}

			//监听剪切板选中区域创建
			this.listenTo(selectRegions, 'add', this.addSelectRegionView);
			_.bindAll(this, 'callView', 'drag', 'highlightRegionMove');

			this.currentRule = util.clone(cache.CurrentRule);
			this.boxAttributes = options.boxAttributes;
			//需要保留对父级视图的引用，需要父级视图的滚动像素，进行定位 
			this.parentView = options.parentView;
			//快捷键支持移动选中区域(移动到select模块中)
			if (!cache.TempProp.isFrozen ||
				(this.currentRule.displayPosition.endRowIndex &&
					this.currentRule.displayPosition.endColIndex)) {
				Backbone.on('event:cellsContainer:selectRegionChange', this.selectRegionChange, this);
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

			gridLineContainer = new GridLineContainer();
			contentCellsContainer = new ContentCellsContainer();
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
		 * html5 拖拽效果
		 * @param  {object} event 事件对象
		 */
		// onDragOver: function(event) {
		// 	event.preventDefault();
		// 	var coordinate,
		// 		aliasGridRow,
		// 		aliasGridCol;
		// 	coordinate = this.getCoordinateByMouseEvent(event);
		// 	this.adjustDragRegion(coordinate);
		// },
		// onDrop: function(event) {
		// 	var dragRegions,
		// 		coordinate,
		// 		aliasGridCol,
		// 		aliasGridRow,
		// 		point,
		// 		data,
		// 		cellsPositionX,
		// 		modelCell,
		// 		i, e = {};
		// 	dragRegions = selectRegions.getModelByType('drag');
		// 	//拖拽区域只可能存在一个
		// 	for (i = 0; i < dragRegions.length; i++) {
		// 		dragRegions[i].destroy();
		// 	}

		// 	coordinate = this.getCoordinateByMouseEvent(event);
		// 	//待修改：考虑使用其他方式开放选中信息
		// 	point = {
		// 		Col: [headItemColList[coordinate.startColIndex].get('displayName')],
		// 		Row: [headItemRowList[coordinate.startRowIndex].get('displayName')],
		// 	};
		// 	e.point = point;
		// 	if (event.isDefaultPrevented() === false) {
		// 		data = event.originalEvent.dataTransfer.getData("text");
		// 		e.text = data;
		// 		event.originalEvent.dataTransfer.clearData();
		// 		if (data === "") {
		// 			return;
		// 		}
		// 		if (modelCell === undefined) {
		// 			modelCell = cells.createCellModel(coordinate.startColIndex, coordinate.startRowIndex);
		// 		}
		// 		modelCell.set("content.texts", data);
		// 	}
		// 	listener.excute('dataDrag', e);
		// },
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

			relativeColPosi = clientColPosi + this.parentView.el.scrollLeft - this.reduceLeft;
			relativeRowPosi = clientRowPosi + this.parentView.el.scrollTop - this.reduceTop;

			//过滤掉不在当前视图区域的坐标点
			if (cache.TempProp.isFrozen === true) {
				endColIndex = this.currentRule.displayPosition.endColIndex;
				endRowIndex = this.currentRule.displayPosition.endRowIndex;
				endColPosi = endColIndex && headItemColList[endColIndex].get('left') + headItemColList[endColIndex].get('width');
				endRowPosi = endRowIndex && headItemRowList[endRowIndex].get('top') + headItemRowList[endRowIndex].get('height');
				if (relativeColPosi < this.reduceLeft || (endColIndex && relativeColPosi > endColPosi)) {
					return;
				}
				if (relativeRowPosi < this.reduceTop || (endRowIndex && relativeRowPosi > endRowPosi)) {
					return;
				}
			}
			colIndex = binary.modelBinary(relativeColPosi, headItemColList, 'left', 'width');
			rowIndex = binary.modelBinary(relativeRowPosi, headItemRowList, 'top', 'height');
			return {
				colIndex: colIndex,
				rowIndex: rowIndex
			}
		},
		/**
		 * 待修改：冻结情况下，该实现方式错误
		 * @param  {number}   colPosi [description]
		 * @param  {number}   rowPosi [description]
		 * @param  {Function} fn      [description]
		 */
		getCoordinateDisplayName: function(colPosi, rowPosi, fn) {
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
		 * @return {[type]} [description]
		 */
		startHighlight: function() {
			//鼠标移动阻止原有事件（mousedown,mousemove）
			this.undelegateEvents();
			this.$el.off('mousemove', this.drag);
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

			this.hightlightModel.set("physicsPosi", {
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
		 * 待修改：直接调用getCoordinate方法，获取当前点的位置
		 * 通过点击事件，获取位置信息
		 * @param  {object} 鼠标点击事件对象
		 */
		getCoordinateByMouseEvent: function(event) {
			var mouseColPosi = event.clientX,
				mouseRowPosi = event.clientY;
			return this.getCoordinate(mouseColPosi, mouseRowPosi);
		},

		selectRegionChange: function(direction) {
			switch (direction) {
				case 'LEFT':
					break;
				case 'RIGHT':
					break;
				case 'UP':
					break;
				case 'DOWN':
					this.downSelectRegion();
					break;
				default:
					break;
			}
		},
		downSelectRegion: function() {
			var endRowIndex,
				startColIndex,
				modelCell,
				startPosiX,
				startPosiY,
				endPosiX,
				endPosiY,
				cellsPositionX,
				aliasGridRow,
				aliasGridCol,
				options,
				left, top, height, width;

			//待修改：直接使用selectRegions模型进行计算
			this.userViewTop = cache.TempProp.isFrozen ? headItemRows.getModelByAlias(cache.UserView.rowAlias).get('top') : 0;
			this.userViewLeft = cache.TempProp.isFrozen ? headItemCols.getModelByAlias(cache.UserView.colAlias).get('left') : 0;

			endRowIndex = headItemRows.getIndexByAlias(selectRegions.models[0].get('wholePosi').endY);
			startColIndex = headItemCols.getIndexByAlias(selectRegions.models[0].get('wholePosi').startX);

			aliasGridRow = headItemRows.models[endRowIndex + 1].get('alias');
			aliasGridCol = selectRegions.models[0].get('wholePosi').startX;

			cellsPositionX = cache.CellsPosition.strandX;

			if (cellsPositionX[aliasGridCol] !== undefined &&
				cellsPositionX[aliasGridCol][aliasGridRow] !== undefined) {
				modelCell = cells.models[cellsPositionX[aliasGridCol][aliasGridRow]];
			}

			if (modelCell) {
				left = modelCell.get('physicsBox').left;
				top = modelCell.get('physicsBox').top;
				width = modelCell.get('physicsBox').width;
				height = modelCell.get('physicsBox').height;
				startPosiX = binary.modelBinary(left, headItemCols.models, 'left', 'width', 0, headItemCols.models.length - 1);
				startPosiY = binary.modelBinary(top, headItemRows.models, 'top', 'height', 0, headItemRows.models.length - 1);
				endPosiX = binary.modelBinary(left + width, headItemCols.models, 'left', 'width', 0, headItemCols.models.length - 1);
				endPosiY = binary.modelBinary(top + height, headItemRows.models, 'top', 'height', 0, headItemRows.models.length - 1);
			} else {
				startPosiX = endPosiX = startColIndex;
				startPosiY = endPosiY = endRowIndex + 1;
			}
			options = {
				initColIndex: startPosiX,
				initRowIndex: startPosiY,
				mouseColIndex: endPosiX,
				mouseRowIndex: endPosiY,
			};
			this.adjustOperationRegion(options);
		},
		/**
		 * 移除鼠标移动监听事件
		 * @method destoryDelegate
		 */
		destoryDelegate: function() {
			this.$el.off('mousemove', self.drag);
		},
		/**
		 * 绑定View，供其他View类调用
		 * @method callCellsContainer
		 */
		callCellsContainer: function(receiveFunc) {
			receiveFunc(this);
		},
		/**
		 * 增加复制(剪切)选中框
		 */
		// addClipRegionView: function() {
		// 	var clipModel,
		// 		clipView,
		// 		selectModel;

		// 	clipModel = selectRegions.getModelByType('clip')[0];
		// 	clipView = new SelectRegionView({
		// 		model: clipModel,
		// 		className: 'clip-container',
		// 		currentRule: this.currentRule,
		// 		parentView: this
		// 	});
		// 	this.clipView = clipView;
		// 	this.$el.append(clipView.render().el);
		// },
		/**
		 * 添加选中区域
		 * @method addSelectRegionView
		 */
		addSelectRegionView: function(model) {
			var className;
			//需要加入判断
			if (model.get("selectType") === "operation") {
				className = "selected-container";
			} else {
				className = "datasource-container";
			}
			this.selectRegion = new SelectRegionView({
				model: model,
				className: className,
				currentRule: this.currentRule,
				parentView: this
			});
			this.$el.append(this.selectRegion.render().el);
		},
		/**
		 * 添加选中区域
		 * @method newSelectRegion
		 */
		// newSelectRegion: function() {
		// 	var headItemColModelList,
		// 		headItemRowModelList,
		// 		aliasGridRow,
		// 		aliasGridCol,
		// 		cellsPositionX,
		// 		initCell;

		// 	headItemColModelList = headItemCols.models;
		// 	headItemRowModelList = headItemRows.models;

		// 	aliasGridRow = headItemColModelList[0].get('alias');
		// 	aliasGridCol = headItemRowModelList[0].get('alias');

		// 	cellsPositionX = cache.CellsPosition.strandX;

		// 	if (cellsPositionX[aliasGridCol] !== undefined &&
		// 		cellsPositionX[aliasGridCol][aliasGridRow] !== undefined) {
		// 		initCell = cells.models[cellsPositionX[aliasGridCol][aliasGridRow]];
		// 	}
		// 	if (initCell === undefined) {
		// 		return {
		// 			physicsPosi: {
		// 				top: 0,
		// 				left: 0
		// 			},
		// 			physicsBox: {
		// 				width: headItemColModelList[0].get('width'),
		// 				height: headItemRowModelList[0].get('height')
		// 			}
		// 		};
		// 	} else {
		// 		this.changeSelectHeadLine(initCell);
		// 		return {
		// 			physicsPosi: {
		// 				top: 0,
		// 				left: 0
		// 			},
		// 			physicsBox: {
		// 				width: initCell.get("physicsBox").width,
		// 				height: initCell.get("physicsBox").height
		// 			}
		// 		};
		// 	}
		// },
		/**
		 * 待修改：不使用遍历，使用两次selectregion的差异，进行计算
		 * 更新选中列标集合
		 * @method changeSelectHeadLine
		 * @param initCell {Cell} 单元格
		 */
		changeSelectHeadLine: function(initCell) {
			var headLineRowModelList,
				headLineColModelList,
				startX,
				startY,
				endX,
				endY,
				width,
				height;

			headLineRowModelList = headItemRows.models;
			headLineColModelList = headItemCols.models;

			// startY = binary.modelBinary(initCell.get("physicsBox").top, headLineRowModelList, 'top', 'height', 0, headLineRowModelList.length - 1);
			// startX = binary.modelBinary(initCell.get("physicsBox").left, headLineColModelList, 'left', 'width', 0, headLineColModelList.length - 1);
			startX = 0;
			startY = 0;
			endX = binary.modelBinary(initCell.get("physicsBox").left + initCell.get("physicsBox").width, headLineColModelList, 'left', 'width', 0, headLineColModelList.length - 1);
			endY = binary.modelBinary(initCell.get("physicsBox").top + initCell.get("physicsBox").height, headLineRowModelList, 'top', 'height', 0, headLineRowModelList.length - 1);

			siderLineRows.models[0].set({
				top: initCell.get("physicsBox").top,
				height: initCell.get("physicsBox").height
			});

			siderLineCols.models[0].set({
				left: initCell.get("physicsBox").left,
				width: initCell.get("physicsBox").width
			});
			var len = headLineRowModelList.length,
				i;

			for (i = 0; i < len; i++) {
				headLineRowModelList[i].set({
					activeState: false
				});
			}
			len = headLineColModelList.length;
			for (i = 0; i < len; i++) {
				headLineColModelList[i].set({
					activeState: false
				});
			}
			for (i = 0; i < endX - startX + 1; i++) {
				headLineColModelList[startX + i].set({
					activeState: true
				});
			}
			for (i = 0; i < endY - startY + 1; i++) {
				headLineRowModelList[startY + i].set({
					activeState: true
				});
			}
		},
		/**
		 * 待修改：该方法需要删除
		 * 调用mainContainer视图
		 * @method callViewMainContainer
		 * @param  callback {function} 回调函数
		 */
		callView: function(name) {
			var object = this;
			return function(callback) {
				object[name] = callback;
			};
		},
		located: function(event) {
			// this is question , need deprecated
			// when input data time avoid trigger this effect.
			if (cache.commentEditState) {
				return;
			}
			if ($(event.target).attr('class') === 'edit-frame') {
				return;
			}
			this.changePosi(event.clientX, event.clientY);
			Backbone.trigger('event:cellsContainer:bindDrag');
		},
		/**
		 * 单元格区域单击事件处理
		 * @method changePosi
		 * @param  e {event} 单击事件
		 */
		changePosi: function(colPosi, rowPosi) {
			var strandCol = cache.CellsPosition.strandX,
				coordinate,
				modelCell,
				startColIndex,
				startRowIndex,
				endColIndex,
				endRowIndex,
				colDisplayNames = [],
				rowDisplayNames = [],
				text = '',
				left, top, width, height, i;

			//获取点击位置信息
			coordinate = this.getCoordinate(colPosi, rowPosi);
			endColIndex = startColIndex = coordinate.colIndex;
			endRowIndex = startRowIndex = coordinate.rowIndex;

			if () {

			}

			if (typeof modelCell !== 'undefined') {
				left = modelCell.get('physicsBox').left;
				top = modelCell.get('physicsBox').top;
				width = modelCell.get('physicsBox').width;
				height = modelCell.get('physicsBox').height;
				text = modelCell.get('content').texts;

			}

			this.adjustRegion('select', {
				initColIndex: startColIndex,
				initRowIndex: startRowIndex,
				mouseColIndex: endColIndex,
				mouseRowIndex: endRowIndex
			});


			var result = {};
			for (i = startColIndex; i < endColIndex + 1; i++) {
				colDisplayNames.push(headLineColModelList[i].get('displayName'));
			}
			for (i = startRowIndex; i < endRowIndex + 1; i++) {
				rowDisplayNames.push(headLineRowModelList[i].get('displayName'));
			}
			result.point = {
				col: colDisplayNames,
				row: rowDisplayNames
			};
			result.text = text;
			// result.property = {
			// 	size: modelCell ? modelCell.get('content').size : '11pt',
			// 	family: modelCell ? modelCell.get('content').family : "SimSun",
			// 	bd: modelCell ? modelCell.get('content').bd : false,
			// 	italic: modelCell ? modelCell.get('content').italic : false,
			// 	color: modelCell ? modelCell.get('content').color : "#000",
			// 	alignRow: modelCell ? modelCell.get('content').alignRow : 'left',
			// 	alignCol: modelCell ? modelCell.get('content').alignCol : 'middle',
			// 	background: modelCell ? modelCell.get('customProp').background : "#fff",
			// 	format: modelCell ? modelCell.get('customProp').format : 'text',
			// 	wordWrap: modelCell ? modelCell.get('wordWrap') : false,
			// 	borderTop: modelCell ? modelCell.get('border').top : false,
			// 	borderRight: modelCell ? modelCell.get('border').right : false,
			// 	borderBottom: modelCell ? modelCell.get('border').bottom : false,
			// 	borderLeft: modelCell ? modelCell.get('border').left : false
			// };
			listener.excute('mousedown', result);
		},
		/**
		 * 绑定鼠标拖拽事件
		 * @method bindDrag
		 */
		bindDrag: function() {
			this.$el.on('mousemove', this.drag);
		},
		/**
		 * 移除鼠标拖拽事件
		 * @method unBindDrag 
		 */
		unBindDrag: function() {
			this.$el.off('mousemove', this.drag);
		},
		/**
		 * 处理鼠标拖拽事件
		 * @method drag 
		 * @param  e {event} 鼠标移动事件
		 */
		drag: function(event) {
			var headItemRowList = headItemRows.models,
				headItemColList = headItemCols.models,
				mainMousePosiX,
				mainMousePosiY,
				modelIndexCol,
				modelIndexRow,
				initIndexCol,
				initIndexRow,
				lastMouseCol,
				lastMouseRow,
				regionModel,
				options;

			mainMousePosiX = this.getMouseColRelativePosi(event);
			mainMousePosiY = this.getMouseRowRelativePosi(event);

			//this model index of gridline
			modelIndexCol = binary.modelBinary(mainMousePosiX, headItemColList, 'left', 'width', 0, headItemColList.length - 1);
			modelIndexRow = binary.modelBinary(mainMousePosiY, headItemRowList, 'top', 'height', 0, headItemRowList.length - 1);


			if (cache.mouseOperateState === config.mouseOperateState.dataSource) {
				regionModel = selectRegions.getModelByType("dataSource")[0];
			} else {
				regionModel = selectRegions.getModelByType("operation")[0];
			}

			//鼠标开始移动索引
			initIndexCol = regionModel.get('initPosi').startX;
			initIndexRow = regionModel.get('initPosi').startY;
			//上次移动鼠标坐标
			lastMouseCol = regionModel.get('mousePosi').mouseX;
			lastMouseRow = regionModel.get('mousePosi').mouseY;

			//判断是否需要渲染
			if (lastMouseCol === modelIndexCol && lastMouseRow === modelIndexRow) {
				return;
			}
			options = {
				initColIndex: initIndexCol,
				initRowIndex: initIndexRow,
				mouseColIndex: modelIndexCol,
				mouseRowIndex: modelIndexRow,
			};
			this.adjustOperationRegion(options);
		},
		/**
		 * 自适应选中框大小
		 * 
		 */
		adaptSelectRegion: function() {
			var headLineRowModelList = headItemRows.models,
				headLineColModelList = headItemCols.models,
				selectRegionModel,
				startRowAlias,
				startColAlias,
				endRowAlias,
				endColAlias,
				startX,
				startY,
				endX,
				endY,
				len,
				region,
				options,
				flag = true,
				i;

			//修改：没有起到自动调整的作用
			selectRegionModel = selectRegions.getModelByType("operation")[0];

			startRowAlias = selectRegionModel.get("wholePosi").startY;
			startColAlias = selectRegionModel.get("wholePosi").startX;
			endRowAlias = selectRegionModel.get("wholePosi").endY;
			endColAlias = selectRegionModel.get("wholePosi").endX;

			startX = headItemCols.getIndexByAlias(startColAlias);
			startY = headItemRows.getIndexByAlias(startRowAlias);
			endX = headItemCols.getIndexByAlias(endColAlias);
			endY = headItemRows.getIndexByAlias(endRowAlias);


			region = {
				startColIndex: startX,
				startRowIndex: startY,
				endColIndex: endX,
				endRowIndex: endY,
			};
			options = {
				initColIndex: region.startColIndex,
				initRowIndex: region.startRowIndex,
				mouseColIndex: region.endColIndex,
				mouseRowIndex: region.endRowIndex
			};
			this.adjustOperationRegion(options);
		},
		adjustOperationRegion: function(options) {
			//待修改：两种方法应该合并
			if (cache.mouseOperateState === config.mouseOperateState.dataSource) {
				this.adjustDataSourceRegion(options);
			} else {
				this.adjustSelectRegion(options);
			}
		},
		adjustDragRegion: function(options) {
			var startColIndex = options.startColIndex,
				startRowIndex = options.startRowIndex,
				endColIndex = options.endColIndex,
				endRowIndex = options.endRowIndex,
				headItemColList = headItemCols.models,
				headItemRowList = headItemRows.models,
				dragRegions,
				dragRegion,
				width = 0,
				height = 0,
				left = 0,
				top = 0;
			dragRegions = selectRegions.getModelByType('drag');
			if (dragRegions.length === 0) {
				this.createDragRegion(options);
				dragRegions = selectRegions.getModelByType('drag');
			}
			dragRegion = dragRegions[0];

			if (this.dragView === undefined || this.dragView === null) {
				this.dragView = new SelectRegionView({
					model: dragRegion,
					className: 'datasource-container',
					currentRule: this.currentRule,
					parentView: this
				});
				this.$el.append(this.dragView.render().el);
			}

			left = headItemColList[startColIndex].get('left');
			top = headItemRowList[startRowIndex].get('top');
			width = headItemColList[endColIndex].get('width') + headItemColList[endColIndex].get('left') - headItemColList[startColIndex].get('left');
			height = headItemRowList[endRowIndex].get('height') + headItemRowList[endRowIndex].get('top') - headItemRowList[startRowIndex].get('top');

			dragRegion.set({
				physicsPosi: {
					top: headItemRowList[startRowIndex].get('top'),
					left: headItemColList[startColIndex].get('left')
				},
				physicsBox: {
					width: width - 1,
					height: height - 1
				},
			});
		},
		/**
		 * 改变选择框区域
		 * @param  {[type]} options [description]
		 * @param  {[type]} e       [description]
		 * @return {[type]}         [description]
		 */
		adjustSelectRegion: function(options) {
			var region,
				headItemColList = headItemCols.models,
				headItemRowList = headItemRows.models,
				colDisplayNames = [],
				rowDisplayNames = [],
				startColIndex,
				startRowIndex,
				endColIndex,
				endRowIndex,
				width = 0,
				height = 0,
				len, i;
			//获取完整的选中区域(处理合并单元格情况)
			region = cells.getFullOperationRegion({
				startColIndex: options.initColIndex,
				startRowIndex: options.initRowIndex,
				endColIndex: options.mouseColIndex,
				endRowIndex: options.mouseRowIndex
			});

			startColIndex = region.startColIndex;
			startRowIndex = region.startRowIndex;
			endColIndex = region.endColIndex;
			endRowIndex = region.endRowIndex;

			var e = {};

			for (i = startColIndex; i < endColIndex + 1; i++) {
				colDisplayNames.push(headItemColList[i].get('displayName'));
			}
			for (i = startRowIndex; i < endRowIndex + 1; i++) {
				rowDisplayNames.push(headItemRowList[i].get('displayName'));
			}
			e.point = {
				col: colDisplayNames,
				row: rowDisplayNames
			};
			listener.excute('regionChange', e);
			listener.excute('selectRegionChange', e);

			width = headItemColList[endColIndex].get('width') + headItemColList[endColIndex].get('left') - headItemColList[startColIndex].get('left');
			height = headItemRowList[endRowIndex].get('height') + headItemRowList[endRowIndex].get('top') - headItemRowList[startRowIndex].get('top');

			selectRegions.models[0].set({
				initPosi: {
					startX: options.initColIndex,
					startY: options.initRowIndex
				},
				mousePosi: {
					mouseX: options.mouseColIndex,
					mouseY: options.mouseRowIndex
				},
				physicsPosi: {
					top: headItemRowList[startRowIndex].get('top'),
					left: headItemColList[startColIndex].get('left')
				},
				physicsBox: {
					width: width,
					height: height
				},
				wholePosi: {
					startX: headItemColList[startColIndex].get('alias'),
					startY: headItemRowList[startRowIndex].get('alias'),
					endX: headItemColList[endColIndex].get('alias'),
					endY: headItemRowList[endRowIndex].get('alias')
				}
			});
			siderLineRows.models[0].set({
				top: headItemRowList[startRowIndex].get('top'),
				height: height - 1
			});
			siderLineCols.models[0].set({
				left: headItemColList[startColIndex].get('left'),
				width: width - 1

			});

			len = headItemRowList.length;

			for (i = 0; i < len; i++) {
				headItemRowList[i].set({
					activeState: false
				});
			}

			len = headItemColList.length;
			for (i = 0; i < len; i++) {
				headItemColList[i].set({
					activeState: false
				});
			}
			for (i = 0; i < endColIndex - startColIndex + 1; i++) {
				width += headItemColList[startColIndex + i].set({
					activeState: true
				});
			}
			for (i = 0; i < endRowIndex - startRowIndex + 1; i++) {
				height += headItemRowList[startRowIndex + i].set({
					activeState: true
				});
			}
		},
		/**
		 * 改变数据源选择区域
		 * @param  {[type]} options [description]
		 * @param  {[type]} e       [description]
		 * @return {[type]}         [description]
		 */
		adjustDataSourceRegion: function(options) {
			var region,
				startColIndex,
				startRowIndex,
				endColIndex,
				endRowIndex,
				headItemColList = headItemCols.models,
				headItemRowList = headItemRows.models,
				rowDisplayNames = [],
				colDisplayNames = [],
				dataSourceRegion,
				width, height, i;
			//获取完整的选中区域(处理合并单元格情况)
			region = cells.getFullOperationRegion({
				startColIndex: options.initColIndex,
				startRowIndex: options.initRowIndex,
				endColIndex: options.mouseColIndex,
				endRowIndex: options.mouseRowIndex
			});

			startColIndex = region.startColIndex;
			startRowIndex = region.startRowIndex;
			endColIndex = region.endColIndex;
			endRowIndex = region.endRowIndex;

			var e = {};
			for (i = startColIndex; i < endColIndex + 1; i++) {
				colDisplayNames.push(headItemColList[i].get('displayName'));
			}
			for (i = startRowIndex; i < endRowIndex + 1; i++) {
				rowDisplayNames.push(headItemRowList[i].get('displayName'));
			}
			e.point = {
				col: colDisplayNames,
				row: rowDisplayNames
			};
			listener.excute('regionChange', e);
			listener.excute('dataSourceRegionChange', e);

			dataSourceRegion = selectRegions.getModelByType("dataSource")[0];

			if (dataSourceRegion === undefined) {
				dataSourceRegion = new SelectRegionModel();
				dataSourceRegion.set('selectType', 'dataSource');
				selectRegions.add(dataSourceRegion);
			}
			width = headItemColList[endColIndex].get('width') + headItemColList[endColIndex].get('left') - headItemColList[startColIndex].get('left');
			height = headItemRowList[endRowIndex].get('height') + headItemRowList[endRowIndex].get('top') - headItemRowList[startRowIndex].get('top');
			dataSourceRegion.set({
				initPosi: {
					startX: options.initColIndex,
					startY: options.initRowIndex
				},
				mousePosi: {
					mouseX: options.mouseColIndex,
					mouseY: options.mouseRowIndex
				},
				physicsPosi: {
					top: headItemRowList[startRowIndex].get('top'),
					left: headItemColList[startColIndex].get('left')
				},
				physicsBox: {
					width: width,
					height: height
				},
				wholePosi: {
					startX: headItemColList[startColIndex].get('alias'),
					startY: headItemRowList[startRowIndex].get('alias'),
					endX: headItemColList[endColIndex].get('alias'),
					endY: headItemRowList[endRowIndex].get('alias')
				}
			});

		},
		createDragRegion: function(options) {
			var startColIndex = options.startColIndex || 0,
				startRowIndex = options.startRowIndex || 0,
				endColIndex = options.endColIndex || 0,
				endRowIndex = options.endRowIndex || 0,
				headItemColList = headItemCols.models,
				headItemRowList = headItemRows.models,
				width,
				height;

			width = headItemColList[endColIndex].get('width') + headItemColList[endColIndex].get('left') - headItemColList[startColIndex].get('left');
			height = headItemRowList[endRowIndex].get('height') + headItemRowList[endRowIndex].get('top') - headItemRowList[startRowIndex].get('top');
			selectRegions.add({
				physicsPosi: {
					top: headItemRowList[startRowIndex].get('top'),
					left: headItemColList[startColIndex].get('left')
				},
				physicsBox: {
					width: width - 1,
					height: height - 1
				},
				selectType: 'drag'
			});
		},
		addSelectRegion: function() {

		},
		//修改：监听集合
		// createDataSourceRegion: function(options) {
		// 	var startColIndex = options.startColIndex || 0,
		// 		startRowIndex = options.startRowIndex || 0,
		// 		endColIndex = options.endColIndex || 0,
		// 		endRowIndex = options.endRowIndex || 0,
		// 		headItemColList = headItemCols.models,
		// 		headItemRowList = headItemRows.models,
		// 		width, height;

		// 	width = headItemColList[endColIndex].get('width') + headItemColList[endColIndex].get('left') - headItemColList[startColIndex].get('left');
		// 	height = headItemRowList[endRowIndex].get('height') + headItemRowList[endRowIndex].get('top') - headItemRowList[startRowIndex].get('top');
		// 	selectRegions.add({
		// 		mousePosi: {
		// 			mouseX: startColIndex,
		// 			mouseY: startRowIndex
		// 		},
		// 		initPosi: {
		// 			startX: startColIndex,
		// 			startY: startRowIndex
		// 		},
		// 		physicsPosi: {
		// 			top: headItemRowList[startRowIndex].get('top'),
		// 			left: headItemColList[startColIndex].get('left')
		// 		},
		// 		physicsBox: {
		// 			width: width - 1,
		// 			height: height - 1
		// 		},
		// 		wholePosi: {
		// 			startX: startColIndex,
		// 			startY: startRowIndex,
		// 			endX: endColIndex,
		// 			endY: endRowIndex
		// 		},
		// 		selectType: 'dataSource'
		// 	});
		// 	if (this.dataSoureRegionView === undefined || this.dataSoureRegionView === null) {
		// 		this.dataSoureRegionView = new SelectRegionView({
		// 			model: selectRegions.getModelByType("dataSource")[0],
		// 			className: 'datasource-container',
		// 			currentRule: this.currentRule,
		// 			parentView: this
		// 		});
		// 		this.$el.append(this.dataSoureRegionView.render().el);
		// 	}
		// 	return selectRegions.getModelByType("dataSource")[0];
		// },
		/**
		 * 视图销毁
		 * @method destroy
		 */
		destroy: function() {
			var i = 0,
				len,
				selectModelList;
			Backbone.off('call:cellsContainer');
			Backbone.off('event:cellsContainer:destroy');
			Backbone.off('event:cellsContainer:selectRegionChange');
			Backbone.off('event:cellsContainer:adjustSelectRegion');
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