define(function(require) {
	'use strict';
	var $ = require('lib/jquery'),
		Backbone = require('lib/backbone'),
		getTemplate = require('basic/tools/template'),
		util = require('basic/util/clone'),
		binary = require('basic/util/binary'),
		cache = require('basic/tools/cache'),
		send = require('basic/tools/send'),
		Cell = require('models/cell'),
		listener = require('basic/util/listener'),
		headItemRows = require('collections/headItemRow'),
		headItemCols = require('collections/headItemCol'),
		siderLineRows = require('collections/siderLineRow'),
		siderLineCols = require('collections/siderLineCol'),
		cells = require('collections/cells'),
		protect = require('entrance/tool/protect'),
		rowModelList = headItemRows.models,
		colModelList = headItemCols.models,
		SelectRegion;

	/**
	 * 选中区域视图类
	 * @author ray wu
	 * @since 0.1.0
	 * @class SelectRegion  
	 * @module views
	 * @extends Backbone.View
	 * @constructor
	 */

	SelectRegion = Backbone.View.extend({
		/**
		 * 设置class属性
		 * @property className
		 * @type {String}
		 */
		className: 'selected-container',
		/**
		 * 绑定鼠标事件
		 * @property events 
		 * @type {Object}
		 */
		events: {
			'dblclick': 'editState',
		},
		/**
		 * 视图初始化函数
		 * @method initialize
		 */
		initialize: function(options) {
			this.viewCellsContainer = options.parentView;
			if (this.model.get('selectType') === 'selected') {
				Backbone.on('event:selectRegion:patchOprCell', this.patchOprCell, this);
			}
			Backbone.on('event:selectRegionContainer:adapt', this.adapt, this);
			//添加视图
			this.listenTo(this.model, 'change:tempPosi', this.changePosi);
			this.listenTo(this.model, 'change:physicsBox', this.changeBox);
			this.listenTo(this.model, 'destroy', this.destroy);
			if (options.currentRule !== undefined) {
				this.currentRule = options.currentRule;
			} else {
				this.currentRule = util.clone(cache.CurrentRule);
			}
			this.userViewTop = cache.TempProp.isFrozen ? headItemRows.getModelByAlias(cache.UserView.rowAlias).get('top') : 0;
			this.userViewLeft = cache.TempProp.isFrozen ? headItemCols.getModelByAlias(cache.UserView.colAlias).get('left') : 0;
			this.offsetLeft = cache.TempProp.isFrozen ? (this.currentRule.displayPosition.offsetLeft || 0) : 0;
			this.offsetTop = cache.TempProp.isFrozen ? (this.currentRule.displayPosition.offsetTop || 0) : 0;
		},
		/**
		 * 页面渲染方法
		 * @method render
		 */
		render: function() {
			this.template = getTemplate('SELECTTEMPLATE');
			this.$el.html(this.template());
			this.changeBox();
			return this;
		},
		/**
		 * 更新显示视图大小，坐标
		 * @method changeBox
		 */
		changeBox: function() {
			var modelJSON = this.model.toJSON(),
				height = modelJSON.physicsBox.height,
				width = modelJSON.physicsBox.width,
				left = modelJSON.physicsBox.left,
				top = modelJSON.physicsBox.top;
			if (left === 0) {
				left = left - 1;
				width = width - 1;
			} else {
				width = width - 2;
			}
			if (top === 0) {
				top = top - 1;
				height = height - 1;
			} else {
				height = height - 2;
			}
			this.$el.css({
				width: width,
				height: height,
				left: left - this.offsetLeft - this.userViewLeft,
				top: top - this.offsetTop - this.userViewTop
			});
		},
		callView: function(name) {
			var object = this;
			return function(callback) {
				object[name] = callback;
			};
		},
		/**
		 * 修改选中区域大小，位置
		 */
		changePosi: function() {
			var modelJSON = this.model.toJSON(),
				colDisplayNames = [],
				rowDisplayNames = [],
				startColIndex,
				startRowIndex,
				endColIndex,
				endRowIndex,
				region,
				width,
				height,
				e = {},
				i;


			region = cells.getFullOperationRegion(
				modelJSON.tempPosi.initColIndex,
				modelJSON.tempPosi.initRowIndex,
				modelJSON.tempPosi.mouseColIndex,
				modelJSON.tempPosi.mouseRowIndex
			);
			startColIndex = region.startColIndex;
			startRowIndex = region.startRowIndex;
			endColIndex = region.endColIndex;
			endRowIndex = region.endRowIndex;

			width = colModelList[endColIndex].get('width') + colModelList[endColIndex].get('left') - colModelList[startColIndex].get('left');
			height = rowModelList[endRowIndex].get('height') + rowModelList[endRowIndex].get('top') - rowModelList[startRowIndex].get('top');

			if (this.model.get('selectType') === 'selected') {
				this.changeHeadLineModel(startColIndex, startRowIndex, endColIndex, endRowIndex);
				siderLineRows.models[0].set({
					top: rowModelList[startRowIndex].get('top'),
					height: height
				});
				siderLineCols.models[0].set({
					left: colModelList[startColIndex].get('left'),
					width: width
				});
			}
			this.model.set('physicsBox', {
				top: rowModelList[startRowIndex].get('top'),
				left: colModelList[startColIndex].get('left'),
				width: width,
				height: height
			});
			this.model.set('wholePosi', {
				startX: colModelList[startColIndex].get('alias'),
				startY: rowModelList[startRowIndex].get('alias'),
				endX: colModelList[endColIndex].get('alias'),
				endY: rowModelList[endRowIndex].get('alias')
			});

			//判断是否为整行或整列操作
			if (modelJSON.tempPosi.mouseColIndex === 'MAX' || modelJSON.tempPosi.initColIndex === 'MAX') {
				this.model.set('wholePosi.endX', 'MAX');
				colDisplayNames.push('1');
				colDisplayNames.push('MAX');
				rowDisplayNames.push(rowModelList[startRowIndex].get('displayName'));
				rowDisplayNames.push(rowModelList[endRowIndex].get('displayName'));
			} else if (modelJSON.tempPosi.mouseRowIndex === 'MAX' || modelJSON.tempPosi.initRowIndex === 'MAX') {
				this.model.set('wholePosi.endY', 'MAX');
				rowDisplayNames.push('1');
				rowDisplayNames.push('MAX');
				colDisplayNames.push(colModelList[startColIndex].get('displayName'));
				colDisplayNames.push(colModelList[endColIndex].get('displayName'));
			} else {
				for (i = startColIndex; i < endColIndex + 1; i++) {
					colDisplayNames.push(colModelList[i].get('displayName'));
				}
				for (i = startRowIndex; i < endRowIndex + 1; i++) {
					rowDisplayNames.push(rowModelList[i].get('displayName'));
				}
			}
			e.point = {
				col: colDisplayNames,
				row: rowDisplayNames
			};
			listener.excute('regionChange', e);
			if (modelJSON.selectType === 'selected') {
				listener.excute('selectRegionChange', e);
			} else {
				listener.excute('dataSourceRegionChange', e);
			}
		},
		changeHeadLineModel: function(currentStartCol, currentStartRow, currentEndCol, currentEndRow) {
			var modelJSON = this.model.toJSON(),
				originalStartRow,
				originalStartCol,
				originalEndRow,
				originalEndCol, i;

			originalStartRow = headItemRows.getIndexByAlias(modelJSON.wholePosi.startY);
			originalStartCol = headItemCols.getIndexByAlias(modelJSON.wholePosi.startX);
			originalEndRow = headItemRows.getIndexByAlias(modelJSON.wholePosi.endY);
			originalEndCol = headItemCols.getIndexByAlias(modelJSON.wholePosi.endX);

			originalEndRow = originalEndRow !== 'MAX' ? originalEndRow : headItemRows.length - 1;
			originalEndCol = originalEndCol !== 'MAX' ? originalEndCol : headItemCols.length - 1;
			for (i = originalStartRow; i <= originalEndRow; i++) {
				rowModelList[i].set({
					activeState: false
				});
			}

			for (i = originalStartCol; i <= originalEndCol; i++) {
				colModelList[i].set({
					activeState: false
				});
			}
			for (i = currentStartRow; i <= currentEndRow; i++) {
				rowModelList[i].set({
					activeState: true
				});
			}
			for (i = currentStartCol; i <= currentEndCol; i++) {
				colModelList[i].set({
					activeState: true
				});
			}
		},
		/**
		 * 选中区域内，对每一个单元格区域调用cycleCallback函数操作，如果不存在单元格，则创建后，进行操作
		 * @method patchOprCell
		 * @param  {Function} cycleCallback 回调函数，对单元格对象进行操作
		 * @param  {Object} appointList   操作对象数组
		 */
		patchOprCell: function(cycleCallback, appointList) {
			var currentCell,
				currentCellList,
				partModelList,
				i = 0,
				len,
				partModel,
				modelCellList;
			appointList = appointList === undefined || appointList === null ? {
				cellModel: undefined,
				headModel: undefined
			} : appointList;
			getLastStatus();
			cycleCallback = cycleCallback === undefined || cycleCallback === null ? function() {} : cycleCallback;
			partModelList = appointList.headModel === undefined ? cells.getHeadModelByWholeSelectRegion() : appointList.headModel;

			len = currentCellList.length;
			var start = new Date();
			for (; i < len; i++) {
				currentCell = getLastStatus()[i];
				partModel = partModelList[i];
				if (currentCell === null) {
					cells.add({
						'occupy': {
							'x': [partModel.occupy.x],
							'y': [partModel.occupy.y]
						},
						'physicsBox': {
							'top': partModel.physicsBox.top,
							'left': partModel.physicsBox.left,
							'width': partModel.physicsBox.width,
							'height': partModel.physicsBox.height
						}
					});
					cache.cachePosition(partModel.occupy.y, partModel.occupy.x, cells.length - 1);
					modelCellList = cells.models;
					currentCell = modelCellList[modelCellList.length - 1];
				}
				cycleCallback(currentCell);
			}

			function getLastStatus() {
				currentCellList = appointList.cellModel === undefined ? cells.getCellsByWholeSelectRegion() : appointList.cellModel;
				return currentCellList;
			}
		},
		/**
		 * 转换为编辑状态，显示输入框，并获取输入焦点
		 * @method editState
		 */
		editState: function() {
			var modelJSON = this.model.toJSON(),
				startRowIndex,
				startColIndex,
				endRowIndex,
				endColIndex,
				isAble;

			startRowIndex = headItemRows.getIndexByAlias(modelJSON.wholePosi.startY);
			startColIndex = headItemCols.getIndexByAlias(modelJSON.wholePosi.startX);
			endRowIndex = headItemRows.getIndexByAlias(modelJSON.wholePosi.endY);
			endColIndex = headItemCols.getIndexByAlias(modelJSON.wholePosi.endX);
			isAble = protect.interceptor({
				startRowIndex: startRowIndex,
				startColIndex: startColIndex,
				endColIndex: endColIndex,
				endRowIndex: endRowIndex
			});
			if (isAble) {
				return;
			}
			Backbone.trigger('event:InputContainer:show', true);
		},
		/**
		 * 视图销毁
		 * @method destroy
		 */
		destroy: function() {
			if (this.model.get('selectType') === 'selected') {
				Backbone.off('event:selectRegion:patchOprCell');
			}
			Backbone.off('event:selectRegionContainer:adapt');
			this.remove();
		}
	});
	return SelectRegion;
});