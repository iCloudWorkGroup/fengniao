'use strict';
define(function(require) {
	var Backbone = require('lib/backbone'),
		cache = require('basic/tools/cache'),
		binary = require('basic/util/binary'),
		CellModel = require('models/cell'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		selectRegions = require('collections/selectRegion');
	/**
	 *cell集合类，管理cell对象
	 *@class Cells 
	 *@extends Backbone.Collection
	 *@constructor
	 *@author ray wu
	 *@module collections
	 *@since 0.1.0
	 */
	var Cells = Backbone.Collection.extend({
		/**
		 * 集合成员类型
		 * @property model 
		 * @type Cell
		 */
		model: CellModel,
		url: '/cell.htm',
		/**
		 * 创建单元格
		 * @param  {int} startColIndex 起始列索引
		 * @param  {int} startRowIndex 起始行索引
		 * @param  {int} endColIndex   结束列索引
		 * @param  {int} endRowIndex   结束行索引
		 * @param  {object} prop   	单元格初始化属性
		 * @return {object} cellModel 创建对象
		 */
		createCellModel: function(startColIndex, startRowIndex,
			endColIndex, endRowIndex, prop) {
			var headItemColList,
				headItemRowList,
				rowLen,
				colLen,
				i = 0,
				j = 0,
				occupyCol = [],
				occupyRow = [],
				cell,
				width = 0,
				height = 0,
				top,
				left;
			if (endColIndex === undefined) {
				endColIndex = startColIndex;
			} else if (typeof endColIndex === 'object') {
				prop = endColIndex;
				endColIndex = startColIndex;
			}
			if (endRowIndex === undefined) {
				endRowIndex = startRowIndex;
			}
			headItemColList = headItemCols.models;
			headItemRowList = headItemRows.models;

			left = headItemColList[startColIndex].get('left');
			top = headItemRowList[startRowIndex].get('top');

			rowLen = endRowIndex - startRowIndex + 1;
			colLen = endColIndex - startColIndex + 1;

			//获取occupy信息
			for (i = 0; i < colLen; i++) {
				occupyCol.push(headItemColList[startColIndex + i].get('alias'));
				width += headItemColList[startColIndex + i].get('width') + 1;
			}
			for (i = 0; i < rowLen; i++) {
				occupyRow.push(headItemRowList[startRowIndex + i].get('alias'));
				height += headItemRowList[startRowIndex + i].get('height') + 1;
			}
			for (i = 0; i < rowLen; i++) {
				for (j = 0; j < colLen; j++) {
					cache.cachePosition(headItemRowList[startRowIndex + i].get('alias'),
						headItemColList[startColIndex + j].get('alias'),
						this.length);
				}
			}
			cell = new CellModel();
			cell.set('occupy', {
				x: occupyCol,
				y: occupyRow
			});
			cell.set('physicsBox', {
				top: top,
				left: left,
				width: width - 1,
				height: height - 1
			});

			if (prop !== undefined) {
				setProp(cell, prop);
			}

			this.add(cell);

			function setProp(cell, prop) {
				var parentKey,
					childKey;
				for (parentKey in prop) {
					if (typeof prop[parentKey] === 'object') {
						for (childKey in prop[parentKey]) {
							cell.set(parentKey + '.' + childKey, prop[parentKey][childKey]);
						}
					}
				}
			}
			//新建单元格
			return cell;
		},
		/**
		 * 通过cache.CellsPosition.strandX变量，获取区域内，包含所有cell对象
		 * @method getCellByVertical 
		 * @param  startIndexCol {number} 区域左上顶点X轴索引
		 * @param  startIndexRow {number} 区域左上顶点Y轴索引
		 * @param  endIndexCol {number} 区域右下顶点X轴索引
		 * @param  endIndexRow {number} 区域右下顶点Y轴索引
		 * @return {Array} Cell数组
		 */
		getCellByVertical: function(startIndexCol, startIndexRow, endIndexCol, endIndexRow) {
			var result = [],
				strandX,
				index,
				tempObj = {},
				i, j,
				len1, len2,
				rowAlias,
				colAlias;

			if (endIndexRow === undefined) {
				endIndexRow = startIndexRow;
			}
			if (endIndexCol === undefined) {
				endIndexCol = startIndexCol;
			}
			if (endIndexRow === 'MAX') {
				endIndexRow = headItemRows.length - 1;
			}
			if (endIndexCol === 'MAX') {
				endIndexCol = headItemCols.length - 1;
			}
			strandX = cache.CellsPosition.strandX;
			for (i = startIndexCol, len1 = endIndexCol + 1; i < len1; i++) {
				colAlias = headItemCols.models[i].get('alias');
				if (typeof strandX[colAlias] !== 'undefined') {
					for (j = startIndexRow,len2=endIndexRow +1; j < len2; j++) {
						rowAlias = headItemRows.models[j].get('alias');
						if(typeof strandX[colAlias][rowAlias] !== 'undefined') {
							index = strandX[colAlias][rowAlias];
							if (!tempObj[index]) {
								result.push(this.at(index));
								tempObj[index]=1;
							}
						}
					}
				}
			}
			return result;
		},
		/**
		 * 查询区域内包含所有cell对象
		 * @method getCellByTransverse 
		 * @param  startIndexRow {number} 区域左上顶点X轴索引
		 * @param  startIndexCol {number} 区域左上顶点Y轴索引
		 * @param  endIndexRow {number} 区域右下顶点X轴索引
		 * @param  endIndexCol {number} 区域右下顶点Y轴索引
		 * @return {array} Cell数组
		 */
		getCellByTransverse: function(startIndexRow, startIndexCol, endIndexRow, endIndexCol) {
			var result = [],
				strandY,
				index,
				tempObj = {},
				i, j,
				len1, len2,
				rowAlias,
				colAlias;

			if (endIndexRow === undefined) {
				endIndexRow = startIndexRow;
			}
			if (endIndexCol === undefined) {
				endIndexCol = startIndexCol;
			}
			if (endIndexRow === 'MAX') {
				endIndexRow = headItemRows.length - 1;
			}
			if (endIndexCol === 'MAX') {
				endIndexCol = headItemCols.length - 1;
			}
			strandY = cache.CellsPosition.strandY;
			for (i = startIndexRow, len1 = endIndexRow + 1; i < len1; i++) {
				rowAlias = headItemRows.models[i].get('alias');
				if (typeof strandY[rowAlias] !== 'undefined') {
					for (j = startIndexCol,len2=endIndexCol+1; j < len2; j++) {
						colAlias = headItemCols.models[j].get('alias');
						if(typeof strandY[rowAlias][colAlias] !== 'undefined') {
							index = strandY[rowAlias][colAlias];
							if (!tempObj[index]) {
								result.push(this.at(index));
								tempObj[index]=1;
							}
						}
					}
				}
			}
			return result;
		},
		/**
		 * 按照行索引，获取两行之间的所有包含所有cell对象
		 * @method getCellByRow 
		 * @param  startIndex {number} 行开始索引
		 * @param  endIndex {number} 行结束索引
		 * @return {Array} Cell数组
		 */
		getCellByRow: function(startIndex, endIndex) {
			return this.getCellByTransverse(startIndex, 0, endIndex, 'MAX');
		},
		/**
		 * 待修改
		 */
		/**
		 * 获取区域内包含所有cell对象
		 * @method getSelectRegionCells 
		 * @param  startIndexCol {int} 区域左上顶点X轴索引
		 * @param  startIndexRow {int} 区域左上顶点Y轴索引
		 * @param  endIndexCol {[int]} 区域右下顶点X轴索引
		 * @param  endIndexRow {[int]} 区域右下顶点Y轴索引
		 * @return  {array} Cell数组
		 */
		getRegionCells: function(startIndexCol, startIndexRow, endIndexCol, endIndexRow) {
			if (endIndexCol === undefined) {
				endIndexCol = startIndexCol;
			}
			if (endIndexRow === undefined) {
				endIndexRow = startIndexRow;
			}
			var cellList = [],
				i = 0,
				j = 0,
				aliasCol,
				aliasRow,
				betweenRow = endIndexRow - startIndexRow + 1,
				betweenCol = endIndexCol - startIndexCol + 1,
				gridModelListRow = headItemRows.models,
				gridModelListCol = headItemCols.models,
				cellsPositionX = cache.CellsPosition.strandX;

			for (; i < betweenRow; i++) {
				for (j = 0; j < betweenCol; j++) {
					aliasRow = gridModelListRow[startIndexRow + i].get('alias');
					aliasCol = gridModelListCol[startIndexCol + j].get('alias');
					if (cellsPositionX[aliasCol] !== undefined && cellsPositionX[aliasCol][aliasRow] !== undefined) {
						cellList.push(this.models[cellsPositionX[aliasCol][aliasRow]]);
					} else {
						cellList.push(null);
					}
				}

			}
			return cellList;
		},
		/**
		 * 获取选中区域内包含所有cell对象
		 * @method getCellsByWholeSelectRegion 
		 * @return  {array} Cell数组
		 */
		getCellsByWholeSelectRegion: function() {
			var cellList = [],
				i,
				j,
				rowLen,
				colLen,
				select = selectRegions.models[0].get('wholePosi'),
				headRowList = headItemRows.models,
				headColList = headItemCols.models,
				startColIndex,
				startRowIndex,
				endColIndex,
				endRowIndex,
				cellsPositionX = cache.CellsPosition.strandX,
				aliasRow,
				aliasCol;

			startColIndex = headItemCols.getIndexByAlias(select.startX);
			startRowIndex = headItemRows.getIndexByAlias(select.startY);
			endColIndex = headItemCols.getIndexByAlias(select.endX);
			endRowIndex = headItemRows.getIndexByAlias(select.endY);

			rowLen = endColIndex - startColIndex + 1;
			colLen = endRowIndex - startRowIndex + 1;
			for (i = 0; i < rowLen; i++) {
				for (j = 0; j < colLen; j++) {
					aliasRow = headRowList[startRowIndex + i].get('alias');
					aliasCol = headColList[startColIndex + j].get('alias');
					if (cellsPositionX[aliasCol] !== undefined && cellsPositionX[aliasCol][aliasRow] !== undefined) {
						cellList.push(this.models[cellsPositionX[aliasCol][aliasRow]]);
					} else {
						cellList.push(null);
					}
				}
			}
			return cellList;
		},
		/**
		 * 根据选择域的边线位置查找cell对象集合
		 * @method  getCellsBySiderSelectRegion 
		 * @return {object} cell模型列表
		 */
		getCellsBySiderSelectRegion: function() {
			var verticalModelList,
				transverModelList,
				cellModelList = {};
			verticalModelList = this.getCellsByVerticalSiderSelectRegion();
			transverModelList = this.getCellsByTransverSiderSelectRegion();

			cellModelList.vertical = verticalModelList;
			cellModelList.transver = transverModelList;
			return cellModelList;
		},
		/**
		 * 根据列选中位置查找cell对象集合
		 * @method  getCellsByVerticalSiderSelectRegion
		 * @return {object} cell模型列表
		 */
		getCellsByVerticalSiderSelectRegion: function() {
			var modelList = {
					left: [],
					right: []
				},
				aliasCol,
				aliasRow,
				headLineColModelList,
				headLineRowModelList,
				colLen,
				rowLen,
				i, j,
				cellsPositionX;
			cellsPositionX = cache.CellsPosition.strandX;
			headLineColModelList = headItemCols.getModelListByWholeSelectRegion();
			headLineRowModelList = headItemRows.getModelListByWholeSelectRegion();
			colLen = headLineColModelList.length;
			rowLen = headLineRowModelList.length;
			for (i = 0; i < rowLen; i++) {
				for (j = 0; j < colLen; j++) {
					if (j === 0) {
						aliasRow = headLineRowModelList[i].get('alias');
						aliasCol = headLineColModelList[j].get('alias');
						if (cellsPositionX[aliasCol] !== undefined && cellsPositionX[aliasCol][aliasRow] !== undefined) {
							modelList.left.push(this.models[cellsPositionX[aliasCol][aliasRow]]);
						} else {
							modelList.left.push(null);
						}
					}
					if (j === colLen - 1) {
						aliasRow = headLineRowModelList[i].get('alias');
						aliasCol = headLineColModelList[j].get('alias');
						if (cellsPositionX[aliasCol] !== undefined && cellsPositionX[aliasCol][aliasRow] !== undefined) {
							modelList.right.push(this.models[cellsPositionX[aliasCol][aliasRow]]);
						} else {
							modelList.right.push(null);
						}
					}
				}
			}
			return modelList;
		},
		/**
		 * 根据行选中位置查找cell对象集合
		 * @method  getCellsByTransverSiderSelectRegion
		 * @return {object} cell模型列表
		 */
		getCellsByTransverSiderSelectRegion: function() {
			var modelList = {
					top: [],
					bottom: []
				},
				aliasCol,
				aliasRow,
				headLineColModelList,
				headLineRowModelList,
				colLen,
				rowLen,
				i, j,
				cellsPositionX;

			cellsPositionX = cache.CellsPosition.strandX;
			headLineColModelList = headItemCols.getModelListByWholeSelectRegion();
			headLineRowModelList = headItemRows.getModelListByWholeSelectRegion();
			colLen = headLineColModelList.length;
			rowLen = headLineRowModelList.length;
			for (i = 0; i < colLen; i++) {
				for (j = 0; j < rowLen; j++) {
					if (j === 0) {
						aliasRow = headLineRowModelList[j].get('alias');
						aliasCol = headLineColModelList[i].get('alias');
						if (cellsPositionX[aliasCol] !== undefined && cellsPositionX[aliasCol][aliasRow] !== undefined) {
							modelList.top.push(this.models[cellsPositionX[aliasCol][aliasRow]]);
						} else {
							modelList.top.push(null);
						}
					}
					if (j === rowLen - 1) {
						aliasRow = headLineRowModelList[j].get('alias');
						aliasCol = headLineColModelList[i].get('alias');
						if (cellsPositionX[aliasCol] !== undefined && cellsPositionX[aliasCol][aliasRow] !== undefined) {
							modelList.bottom.push(this.models[cellsPositionX[aliasCol][aliasRow]]);
						} else {
							modelList.bottom.push(null);
						}
					}
				}
			}
			return modelList;
		},
		/**
		 * 获取选中区域内，所有单元格坐标
		 * @method  getHeadModelByWholeSelectRegion
		 * @return {array} 单元格坐标数组
		 */
		getHeadModelByWholeSelectRegion: function() {
			var partModelList = [],
				partModel,
				headLineColModelList,
				headLineRowModelList,
				colLen,
				rowLen,
				i, j;

			headLineColModelList = headItemCols.getModelListByWholeSelectRegion();
			headLineRowModelList = headItemRows.getModelListByWholeSelectRegion();
			colLen = headLineColModelList.length;
			rowLen = headLineRowModelList.length;
			for (i = 0; i < rowLen; i++) {
				for (j = 0; j < colLen; j++) {
					partModel = {
						wholePosi: {
							startX: selectRegions.models[0].get('wholePosi').startX + j,
							startY: selectRegions.models[0].get('wholePosi').startY + i
						},
						occupy: {
							x: headLineColModelList[j].get('alias'),
							y: headLineRowModelList[i].get('alias')
						},
						physicsBox: {
							top: headLineRowModelList[i].get('top'),
							left: headLineColModelList[j].get('left'),
							width: headLineColModelList[j].get('width'),
							height: headLineRowModelList[i].get('height'),
						}
					};
					partModelList.push(partModel);
				}
			}
			return partModelList;
		},
		/** 获取选中区域内边框单元格
		 * @method getHeadModelBySiderSelectRegion
		 * @return {array} cell模型结合
		 */
		getHeadModelBySiderSelectRegion: function() {
			var verticalModelList,
				transverModelList,
				siderModelList = {};
			verticalModelList = this.getHeadModelByVerticalSiderSelectRegion();
			transverModelList = this.getHeadModelByTransverSiderSelectRegion();
			siderModelList.vertical = verticalModelList;
			siderModelList.transverse = transverModelList;
			return siderModelList;
		},
		/**
		 * 选中区域内，获取垂直方向，最左方与最右方单元格
		 * @method getHeadModelByVerticalSiderSelectRegion
		 * @return {array} cell模型结合
		 */
		getHeadModelByVerticalSiderSelectRegion: function() {
			var partModelList = {
					left: [],
					right: []
				},
				partModel,
				headLineColModelList,
				headLineRowModelList,
				colLen,
				rowLen,
				i, j;

			headLineColModelList = headItemCols.getModelListByWholeSelectRegion();
			headLineRowModelList = headItemRows.getModelListByWholeSelectRegion();
			colLen = headLineColModelList.length;
			rowLen = headLineRowModelList.length;
			for (i = 0; i < rowLen; i++) {
				for (j = 0; j < colLen; j++) {
					if (j === 0) {
						partModel = {
							wholePosi: {
								startX: selectRegions.models[0].get('wholePosi').startX + j,
								startY: selectRegions.models[0].get('wholePosi').startY + i
							},
							occupy: {
								x: headLineColModelList[j].get('alias'),
								y: headLineRowModelList[i].get('alias')
							},
							physicsBox: {
								top: headLineRowModelList[i].get('top'),
								left: headLineColModelList[j].get('left'),
								width: headLineColModelList[j].get('width'),
								height: headLineRowModelList[i].get('height'),
							}
						};
						partModelList.left.push(partModel);
					}
					if (j === colLen - 1) {
						partModel = {
							wholePosi: {
								startX: selectRegions.models[0].get('wholePosi').startX + j,
								startY: selectRegions.models[0].get('wholePosi').startY + i
							},
							occupy: {
								x: headLineColModelList[j].get('alias'),
								y: headLineRowModelList[i].get('alias')
							},
							physicsBox: {
								top: headLineRowModelList[i].get('top'),
								left: headLineColModelList[j].get('left'),
								width: headLineColModelList[j].get('width'),
								height: headLineRowModelList[i].get('height'),
							}
						};
						partModelList.right.push(partModel);
					}
				}
			}
			return partModelList;
		},
		/**
		 * 选中区域内，获取水平方向，最上方与最下方单元格
		 * @method getHeadModelByTransverSiderSelectRegion
		 * @return {array} cell模型结合
		 */
		getHeadModelByTransverSiderSelectRegion: function() {
			var partModelList = {
					top: [],
					bottom: []
				},
				partModel,
				headLineColModelList,
				headLineRowModelList,
				colLen,
				rowLen,
				i, j;

			headLineColModelList = headItemCols.getModelListByWholeSelectRegion();
			headLineRowModelList = headItemRows.getModelListByWholeSelectRegion();
			colLen = headLineColModelList.length;
			rowLen = headLineRowModelList.length;
			for (i = 0; i < colLen; i++) {
				for (j = 0; j < rowLen; j++) {
					if (j === 0) {
						partModel = {
							wholePosi: {
								startX: selectRegions.models[0].get('wholePosi').startX + i,
								startY: selectRegions.models[0].get('wholePosi').startY + j
							},
							occupy: {
								x: headLineColModelList[i].get('alias'),
								y: headLineRowModelList[j].get('alias')
							},
							physicsBox: {
								top: headLineRowModelList[j].get('top'),
								left: headLineColModelList[i].get('left'),
								width: headLineColModelList[i].get('width'),
								height: headLineRowModelList[j].get('height'),
							}
						};
						partModelList.top.push(partModel);
					}
					if (j === rowLen - 1) {
						partModel = {
							wholePosi: {
								startX: selectRegions.models[0].get('wholePosi').startX + i,
								startY: selectRegions.models[0].get('wholePosi').startY + j
							},
							occupy: {
								x: headLineColModelList[i].get('alias'),
								y: headLineRowModelList[j].get('alias')
							},
							physicsBox: {
								top: headLineRowModelList[j].get('top'),
								left: headLineColModelList[i].get('left'),
								width: headLineColModelList[i].get('width'),
								height: headLineRowModelList[j].get('height'),
							}
						};
						partModelList.bottom.push(partModel);
					}
				}
			}
			return partModelList;
		},
		/**
		 * 区域内，最左端单元格数组
		 * @method getLeftHeadModelByIndex
		 */
		operLeftHeadModel: function(startColIndex, startRowIndex, endColIndex, endRowIndex, fn) {
			var headItemRowList = headItemRows.models,
				headItemColList = headItemCols.models,
				cellsPosition,
				tempObj = {},
				tempCell,
				aliasCol,
				aliasRow,
				i;

			if (endColIndex === undefined) {
				endColIndex = startColIndex;
			}
			if (endRowIndex === undefined) {
				endRowIndex = startRowIndex;
			}
			aliasCol = headItemColList[startColIndex].get('alias');
			cellsPosition = cache.CellsPosition.strandX[aliasCol];
			for (i = startRowIndex; i < endRowIndex + 1; i++) {
				aliasRow = headItemRowList[i].get('alias');
				if (cellsPosition !== undefined && cellsPosition[aliasRow] !== undefined) {
					if (!tempObj[cellsPosition[aliasRow]]) {
						tempCell = this.models[cellsPosition[aliasRow]];
					} else {
						tempObj[cellsPosition[aliasCol]] = 1;
						continue;
					}
				} else {
					tempCell = this.createCellModel(startColIndex, i);
				}
				fn(tempCell, headItemColList[startColIndex].get('sort'), headItemRowList[i].get('sort'));
			}
		},
		/**
		 * 区域内，最右端单元格数组
		 * @method getLeftHeadModelByIndex
		 */
		operRightHeadModel: function(startColIndex, startRowIndex, endColIndex, endRowIndex, fn) {
			var headItemRowList = headItemRows.models,
				headItemColList = headItemCols.models,
				cellsPosition,
				tempObj = {},
				tempCell,
				aliasCol,
				aliasRow,
				i;
			if (endColIndex === undefined) {
				endColIndex = startColIndex;
			}
			if (endRowIndex === undefined) {
				endRowIndex = startRowIndex;
			}
			aliasCol = headItemColList[endColIndex].get('alias');
			cellsPosition = cache.CellsPosition.strandX[aliasCol];

			for (i = startRowIndex; i < endRowIndex + 1; i++) {
				aliasRow = headItemRowList[i].get('alias');
				if (cellsPosition !== undefined && cellsPosition[aliasRow] !== undefined) {
					if (!tempObj[cellsPosition[aliasRow]]) {
						tempCell = this.models[cellsPosition[aliasRow]];
					} else {
						tempObj[cellsPosition[aliasCol]] = 1;
						continue;
					}
				} else {
					tempCell = this.createCellModel(endColIndex, i);
				}
				fn(tempCell, headItemColList[endColIndex].get('sort'), headItemRowList[i].get('sort'));
			}
		},
		/**
		 * 区域内，最上端单元格数组
		 * @method getTopHeadModelByIndex
		 */
		operTopHeadModel: function(startColIndex, startRowIndex, endColIndex, endRowIndex, fn) {
			var headItemRowList = headItemRows.models,
				headItemColList = headItemCols.models,
				cellsPosition,
				tempObj = {},
				tempCell,
				aliasCol,
				aliasRow,
				i;
			if (endColIndex === undefined) {
				endColIndex = startColIndex;
			}
			if (endRowIndex === undefined) {
				endRowIndex = startRowIndex;
			}

			aliasRow = headItemRowList[startRowIndex].get('alias');
			cellsPosition = cache.CellsPosition.strandY[aliasRow];

			for (i = startColIndex; i < endColIndex + 1; i++) {
				aliasCol = headItemColList[i].get('alias');
				if (cellsPosition !== undefined && cellsPosition[aliasCol] !== undefined) {
					if (!tempObj[cellsPosition[aliasCol]]) {
						tempCell = this.models[cellsPosition[aliasCol]];
					} else {
						tempObj[cellsPosition[aliasCol]] = 1;
						continue;
					}
				} else {
					tempCell = this.createCellModel(i, startRowIndex);
				}
				fn(tempCell, headItemColList[i].get('sort'), headItemRowList[startRowIndex].get('sort'));
			}
		},
		/**
		 * 区域内，最下端单元格数组
		 * @method getLeftHeadModelByIndex
		 */
		operBottomHeadModel: function(startColIndex, startRowIndex, endColIndex, endRowIndex, fn) {
			var headItemRowList = headItemRows.models,
				headItemColList = headItemCols.models,
				cellsPosition,
				tempObj = {},
				tempCell,
				aliasCol,
				aliasRow,
				i;
			if (endColIndex === undefined) {
				endColIndex = startColIndex;
			}
			if (endRowIndex === undefined) {
				endRowIndex = startRowIndex;
			}
			aliasRow = headItemRowList[endRowIndex].get('alias');
			cellsPosition = cache.CellsPosition.strandY[aliasRow];

			for (i = startColIndex; i < endColIndex + 1; i++) {
				aliasCol = headItemColList[i].get('alias');
				if (cellsPosition !== undefined && cellsPosition[aliasCol] !== undefined) {
					if (!tempObj[cellsPosition[aliasCol]]) {
						tempCell = this.models[cellsPosition[aliasCol]];
					} else {
						tempObj[cellsPosition[aliasCol]] = 1;
						continue;
					}
				} else {
					tempCell = this.createCellModel(i, endRowIndex);
				}
				fn(tempCell, headItemColList[i].get('sort'), headItemRowList[endRowIndex].get('sort'));
			}
		},
		operOuterHeadModel:function(startColIndex, startRowIndex, endColIndex, endRowIndex, fn){
			this.operBottomHeadModel(startColIndex, startRowIndex, endColIndex, endRowIndex, fn);
			this.operTopHeadModel(startColIndex, startRowIndex, endColIndex, endRowIndex, fn);
			this.operLeftHeadModel(startColIndex, startRowIndex, endColIndex, endRowIndex, fn);
			this.operRightHeadModel(startColIndex, startRowIndex, endColIndex, endRowIndex, fn);
		},
		/**
		 * 获取单元格相邻单元格
		 * @method  getAdjacent
		 * @param {object} currentModel cell对象
		 * @param {string} direction 相邻方向
		 * @return {array} cell模型列表
		 */
		getAdjacent: function(currentModel, direction) {
			var gridLineRowModelList,
				gridLineColModelList,
				modelIndexRow,
				modelIndexCol,
				modelCelllList,
				modelJSON = currentModel.toJSON();

			gridLineColModelList = headItemCols.models;
			gridLineRowModelList = headItemRows.models;

			//currentModel, direction models or null object

			modelIndexRow = binary.modelBinary(modelJSON.physicsBox.top, gridLineRowModelList, 'top', 'height', 0, gridLineRowModelList.length - 1);
			modelIndexCol = binary.modelBinary(modelJSON.physicsBox.left, gridLineColModelList, 'left', 'width', 0, gridLineColModelList.length - 1);
			switch (direction) {
				case 'LEFT':
					modelCelllList = this.getSelectRegionCells(modelIndexCol - 1, modelIndexRow);
					break;
				case 'RIGHT':
					modelCelllList = this.getSelectRegionCells(modelIndexCol + 1, modelIndexRow);
					break;
				case 'UP':
					modelCelllList = this.getSelectRegionCells(modelIndexCol, modelIndexRow - 1);
					break;
				case 'DOWN':
					modelCelllList = this.getSelectRegionCells(modelIndexCol, modelIndexRow + 1);
					break;
			}
			return modelCelllList[0];
		},
		/**
		 * 获取区域内所有单元格对象，如果区域内存在不含有单元格位置，则新建单元格填充为
		 * @param  {[type]} startRowIndex [description]
		 * @param  {[type]} startColIndex [description]
		 * @param  {[type]} endRowIndex   [description]
		 * @param  {[type]} endColIndex   [description]
		 * @return {[type]}               [description]
		 */
		getFillCellsByRegion: function(startIndexRow, startIndexCol, endIndexRow, endIndexCol) {
			if (endIndexCol === undefined) {
				endIndexCol = startIndexCol;
			}
			if (endIndexRow === undefined) {
				endIndexRow = startIndexRow;
			}
			var cellList = [],
				i = 0,
				j = 0,
				aliasCol,
				aliasRow,
				betweenRow = endIndexRow - startIndexRow + 1,
				betweenCol = endIndexCol - startIndexCol + 1,
				gridModelListRow = headItemRows.models,
				gridModelListCol = headItemCols.models,
				cellsPositionX = cache.CellsPosition.strandX;

			for (; i < betweenRow; i++) {
				for (j = 0; j < betweenCol; j++) {
					aliasRow = gridModelListRow[startIndexRow + i].get('alias');
					aliasCol = gridModelListCol[startIndexCol + j].get('alias');
					if (cellsPositionX[aliasCol] !== undefined && cellsPositionX[aliasCol][aliasRow] !== undefined) {
						cellList.push(this.models[cellsPositionX[aliasCol][aliasRow]]);
					} else {
						cellList.push(this.createCellModel(startIndexCol + j, startIndexRow + i));
					}
				}

			}
			return cellList;
		},
		/**
		 * 获取选中区域初始化单元格对象 
		 * @method getInitCellBySelectRegion 
		 * @return  {Cell} 单元格对象
		 */
		getInitCellBySelectRegion: function() {
			var headLineColModelList,
				headLineRowModelList,
				modelSelectRegion,
				modelJSON,
				aliasRow,
				aliasCol,
				initCellIndex,
				cellsPositionX;

			modelSelectRegion = selectRegions.models[0];
			modelJSON = modelSelectRegion.toJSON();

			headLineColModelList = headItemCols.models;
			headLineRowModelList = headItemRows.models;

			aliasRow = headLineRowModelList[modelJSON.initPosi.startY].get('alias');
			aliasCol = headLineColModelList[modelJSON.initPosi.startX].get('alias');

			cellsPositionX = cache.CellsPosition.strandX;
			if (cellsPositionX[aliasCol] === undefined || cellsPositionX[aliasCol][aliasRow] === undefined) {
				initCellIndex = -1;
			} else {
				initCellIndex = cellsPositionX[aliasCol][aliasRow];
			}
			if (initCellIndex !== -1) {
				return this.models[initCellIndex];
			}
			return null;
		},
		/**
		 * 通过列索引查询，区域内包含单元格
		 * @method  getCellsByColIndex
		 * @return {array} cell模型列表
		 */
		getCellsByColIndex: function(startIndex, endIndex) {
			var tempObj,
				tempAttr,
				cacheCellArray,
				cachePosition,
				cellModelList,
				alias,
				i;

			cacheCellArray = [];
			cellModelList = this.models;
			cachePosition = cache.CellsPosition.strandX;
			//遍历cache.CellsPosition中符合索引，生成cells[]集合
			for (i = startIndex; i < endIndex + 1; i++) {
				if (headItemCols.models[i] !== undefined) {
					alias = headItemCols.models[i].get('alias');
					if (cachePosition[alias] !== undefined) {
						tempObj = cachePosition[alias];
						for (tempAttr in tempObj) {
							if (cacheCellArray.indexOf(cellModelList[tempObj[tempAttr]]) === -1) {
								cacheCellArray.push(cellModelList[tempObj[tempAttr]]);
							}
						}
					}
				}
			}
			return cacheCellArray;
		},
		/**
		 * 根据alias获取单元格对象
		 * @method getCellByAlias 
		 * @param  aliasCol {string} 行别名
		 * @param  aliasRow {string} 行列别名
		 * @return {Cell} 单元格对象
		 */
		getCellByAlias: function(aliasCol, aliasRow) {
			var tempCellIndex;
			if (cache.CellsPosition.strandY[aliasRow] === undefined ||
				cache.CellsPosition.strandY[aliasRow][aliasCol] === undefined) {
				return null;
			}
			tempCellIndex = cache.CellsPosition.strandY[aliasRow][aliasCol];
			return this.models[tempCellIndex];
		},
		/**
		 * 按照行列索引，获取两列之间开始区域不超过开始行的cell对象
		 * @method getCellsInStartRowRegion 
		 * @param  startRowIndex {int} 行开始索引
		 * @param  endRowIndex {int} 行结束索引
		 * @return {array} Cell数组
		 */
		getCellsInStartRowRegion: function(startRowIndex, endRowIndex) {
			var tempRowObj,
				tempAttr,
				cacheCellArray,
				cachePosition,
				cellModelList,
				aliasRow,
				tempCell,
				cellStartRowIndex,
				i = 0;

			cacheCellArray = [];
			cellModelList = this.models;
			cachePosition = cache.CellsPosition.strandY;

			//遍历cache.CellsPosition中符合索引，生成cells[]集合
			for (i = startRowIndex; i < endRowIndex + 1; i++) {

				if (headItemRows.models[i] !== undefined) {
					aliasRow = headItemRows.models[i].get('alias');
					if (cachePosition[aliasRow] !== undefined) {
						tempRowObj = cachePosition[aliasRow];
						for (tempAttr in tempRowObj) {
							//判断cell是否超出区域
							tempCell = cellModelList[tempRowObj[tempAttr]];
							cellStartRowIndex = headItemRows.getIndexByAlias(tempCell.get('occupy').y[0]);
							if (cellStartRowIndex >= startRowIndex && cacheCellArray.indexOf(tempCell) === -1) {
								cacheCellArray.push(tempCell);
							}

						}
					}
				}
			}
			return cacheCellArray;
		},
		/**
		 * 按照行列索引，获取两列之间开始区域不超过开始列的cell对象
		 * @method getCellsInStartColRegion 
		 * @param  startColIndex {int} 列开始索引
		 * @param  endColIndex {int} 列结束索引
		 * @return {array} Cell数组
		 */
		getCellsInStartColRegion: function(startColIndex, endColIndex) {
			var tempColObj,
				tempAttr,
				cacheCellArray,
				cachePosition,
				cellModelList,
				aliasCol,
				tempCell,
				cellStartColIndex,
				i = 0;

			cacheCellArray = [];
			cellModelList = this.models;
			cachePosition = cache.CellsPosition.strandX;

			//遍历cache.CellsPosition中符合索引，生成cells[]集合
			for (; i < endColIndex - startColIndex + 1; i++) {

				if (headItemCols.models[startColIndex + i] !== undefined) {

					aliasCol = headItemCols.models[startColIndex + i].get('alias');
					if (cachePosition[aliasCol] !== undefined) {
						tempColObj = cachePosition[aliasCol];
						for (tempAttr in tempColObj) {
							//判断cell是否超出区域
							tempCell = cellModelList[tempColObj[tempAttr]];
							cellStartColIndex = headItemCols.getIndexByAlias(tempCell.get('occupy').x[0]);
							if (cellStartColIndex >= startColIndex && cacheCellArray.indexOf(tempCell) === -1) {
								cacheCellArray.push(tempCell);
							}

						}
					}
				}
			}
			return cacheCellArray;
		},
		/**
		 * 批量操作区域内单元格，操作区域内含有未创建单元格区域，则创建单元格，然后进行操作
		 * @param  {number}   startColIndex 列开始索引
		 * @param  {number}   startRowIndex 行开始索引
		 * @param  {number}   endColIndex   列结束索引
		 * @param  {number}   endRowIndex   行结束索引
		 * @param  {Function} fn 单元格操作函数
		 */
		operateCellsByRegion: function(region, fn) {
			var tempCell,
				headItemRowList = headItemRows.models,
				headItemColList = headItemCols.models,
				cellsPositionX = cache.CellsPosition.strandX,
				startColIndex = region.startColIndex,
				startRowIndex = region.startRowIndex,
				endColIndex = region.endColIndex,
				endRowIndex = region.endRowIndex,
				rowLen,
				colLen,
				aliasRow,
				aliasCol,
				i = 0,
				j;
			if (endColIndex === undefined || endColIndex === null) {
				endColIndex = startColIndex;
			}
			if (endRowIndex === undefined || endRowIndex === null) {
				endRowIndex = startRowIndex;
			}
			colLen = endColIndex - startColIndex;
			rowLen = endRowIndex - startRowIndex;
			for (; i < rowLen + 1; i++) {
				for (j = 0; j < colLen + 1; j++) {
					aliasRow = headItemRowList[startRowIndex + i].get('alias');
					aliasCol = headItemColList[startColIndex + j].get('alias');
					if (cellsPositionX[aliasCol] !== undefined && cellsPositionX[aliasCol][aliasRow] !== undefined) {
						tempCell = this.models[cellsPositionX[aliasCol][aliasRow]];
					} else {
						tempCell = this.createCellModel(startColIndex + j, startRowIndex + i);
					}
					fn(tempCell, headItemColList[startColIndex + j].get('sort'), headItemRowList[startRowIndex + i].get('sort'));
				}
			}
		},
		/**
		 * 获取完整的操作区域：操作区域内，若存在合并单元格超出操作区域，操作区域应按照单元格扩大，
		 * 直到没有单元格超出区域
		 * @param  {[type]} startColIndex 列起始索引
		 * @param  {[type]} startRowIndex 行起始索引
		 * @param  {[type]} endColIndex   列结束索引
		 * @param  {[type]} endRowIndex   行结束索引
		 * @return {object}               索引信息
		 */
		getFullOperationRegion: function(region) {
			var headItemRowList = headItemRows.models,
				headItemColList = headItemCols.models,
				startColIndex = region.startColIndex,
				startRowIndex = region.startRowIndex,
				endColIndex = region.endColIndex,
				endRowIndex = region.endRowIndex,
				tempCellList,
				cellStartColIndex,
				cellStartRowIndex,
				cellEndColIndex,
				cellEndRowIndex,
				cache,
				flag = true,
				i = 0;

			if (startColIndex > endColIndex) {
				cache = startColIndex;
				startColIndex = endColIndex;
				endColIndex = cache;
			}
			if (startRowIndex > endRowIndex) {
				cache = startRowIndex;
				startRowIndex = endRowIndex;
				endRowIndex = cache;
			}
			while (flag) {
				flag = false;
				tempCellList = this.getCellByVertical(startColIndex, startRowIndex, endColIndex, endRowIndex);
				for (; i < tempCellList.length; i++) {
					cellStartRowIndex = binary.modelBinary(tempCellList[i].get('physicsBox').top, headItemRowList, 'top', 'height', 0, headItemRowList.length - 1);
					cellStartColIndex = binary.modelBinary(tempCellList[i].get('physicsBox').left, headItemColList, 'left', 'width', 0, headItemColList.length - 1);
					cellEndRowIndex = binary.modelBinary(tempCellList[i].get('physicsBox').top + tempCellList[i].get('physicsBox').height, headItemRowList, 'top', 'height', 0, headItemRowList.length - 1);
					cellEndColIndex = binary.modelBinary(tempCellList[i].get('physicsBox').left + tempCellList[i].get('physicsBox').width, headItemColList, 'left', 'width', 0, headItemColList.length - 1);
					if (cellStartColIndex < startColIndex) {
						startColIndex = cellStartColIndex;
						flag = true;
						break;
					}
					if (cellStartRowIndex < startRowIndex) {
						startRowIndex = cellStartRowIndex;
						flag = true;
						break;
					}
					if (cellEndRowIndex > endRowIndex) {
						endRowIndex = cellEndRowIndex;
						flag = true;
						break;
					}
					if (cellEndColIndex > endColIndex) {
						endColIndex = cellEndColIndex;
						flag = true;
						break;
					}
				}
			}
			region.startRowIndex = startRowIndex;
			region.startColIndex = startColIndex;
			region.endRowIndex = endRowIndex;
			region.endColIndex = endColIndex;
			return region;
		},
	});
	return new Cells();
});