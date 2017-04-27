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

			Backbone.on('event:cellsContainer:destroy', this.destroy, this);

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
				this.offsetTop = 0;
				this.offsetLeft = 0;
			}

			//监听剪切板选中区域创建
			this.listenTo(selectRegions, 'add', this.addSelectRegionView);
			_.bindAll(this, 'dragSelect');

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
				rowIndex: rowIndex,
				relativeRowPosi: relativeRowPosi,
				relativeColPosi: relativeColPosi
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
				limitRight = headItemColList[region.endColIndex].get('left') +
					headItemColList[region.endColIndex].get('width');
			}
			if (typeof region.endRowIndex !== 'undefined') {
				limitTop = headItemRowList[region.endRowIndex].get('top') +
					headItemRowList[region.endRowIndex].get('height');
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
		 * 该功能迁移到maincontainer
		 * @param  {[type]} direction [description]
		 * @return {[type]}           [description]
		 */
		moveSelectRegion: function(direction) {
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
				bottomIndex,
				selectModel;

			selectModel = selectRegions.getModelByType('selected');

			endRowIndex = headItemRows.getIndexByAlias(selectModel.get('wholePosi').endY);
			startColIndex = headItemCols.getIndexByAlias(selectModel.get('wholePosi').startX);

			//向下移动超出已加载区域，不进行滚动操作
			if (endRowIndex === headItemRows.length - 1) {
				return;
			}
			selectModel.set('tempPosi', {
				initColIndex: startColIndex,
				initRowIndex: endRowIndex + 1,
				mouseColIndex: startColIndex,
				mouseRowIndex: endRowIndex + 1
			});
			Backbone.trigger('event:mainContainer:showSelectRegion', 'DOWN');
		},
		/**
		 * 添加选中区域
		 * @method addSelectRegionView
		 */
		addSelectRegionView: function(model) {
			var className,
				selectRegionView,
				type = model.get('selectType');

			className = type + '-container';
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
				selectModel = selectRegions.getModelByType('datasource');
				if (typeof selectModel === 'undefined') {
					selectModel = new SelectRegionModel();
					selectModel.set('selectType', 'datasource');
					selectRegions.add(selectModel);
				}
			} else {
				selectModel = selectRegions.getModelByType('selected');
			}
			selectModel.set('tempPosi', {
				initColIndex: startColIndex,
				initRowIndex: startRowIndex,
				mouseColIndex: endColIndex,
				mouseRowIndex: endRowIndex
			});

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

			selectModel = selectRegions.getModelByType(cache.mouseOperateState);

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
				if (selectModelList[i].get('selectType') !== 'selected') {
					selectModelList[i].destroy();
				}
			}
			this.remove();
		}
	});
	return CellsContainer;
});