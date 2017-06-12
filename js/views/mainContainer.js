/**
 * MainContainer
 * @author ray wu
 * @module view
 * @since 1.0.0
 * @main view
 */
define(function(require) {
	'use strict';
	var $ = require('lib/jquery'),
		_ = require('lib/underscore'),
		Backbone = require('lib/backbone'),
		binary = require('basic/util/binary'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		original = require('basic/tools/original'),
		clone = require('basic/util/clone'),
		send = require('basic/tools/send'),
		buildAlias = require('basic/tools/buildalias'),
		loadRecorder = require('basic/tools/loadrecorder'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		siderLineRows = require('collections/siderLineRow'),
		cells = require('collections/cells'),
		selectRegions = require('collections/selectRegion'),
		GridLineRowContainer = require('views/gridLineRowContainer'),
		CellContainer = require('views/cellContainer'),
		CellsContainer = require('views/cellsContainer'),
		headItemRowList = headItemRows.models,
		headItemColList = headItemCols.models;

	/**
	 *单元格显示区域视图类
	 *@class MainContainer 
	 *@extends Backbone.View
	 *@constructor
	 */
	var MainContainer = Backbone.View.extend({

		/**
		 * 类初始化调用方法
		 * @method initialize
		 * @param  allAttributes 容器属性,设置容器，宽度，高度
		 */
		initialize: function(options) {
			var modelsHeadLineRowList,
				modelsHeadLineColList,
				modelsHeadLineRowRegionList,
				modelsHeadLineColRegionList,
				modelLastHeadLineRow,
				modelLastHeadLineCol,
				userViewBottomIndex,
				len;


			Backbone.on('event:mainContainer:destroy', this.destroy, this);
			Backbone.on('event:mainContainer:attributesRender', this.attributesRender, this);

			this.currentRule = clone.clone(cache.CurrentRule);

			if (cache.TempProp.isFrozen === true) {
				this.offsetTop = this.currentRule.displayPosition.offsetTop;
				this.userViewTop = headItemRows.getModelByAlias(cache.UserView.rowAlias).get('top');
			} else {
				this.offsetTop = 0;
				this.userViewTop = 0;
			}
			this.boxModel = {};

			this.boxAttributes = this.currentRule.boxAttributes;

			// for reduction position , prevent event scroll auto trigger.
			modelsHeadLineRowRegionList = modelsHeadLineRowList = headItemRows.models;
			modelsHeadLineColRegionList = modelsHeadLineColList = headItemCols.models;
			//计算容器高度
			if (cache.TempProp.isFrozen) {
				if (this.currentRule.displayPosition.endRowIndex) {
					modelsHeadLineRowRegionList = modelsHeadLineRowList.slice(this.currentRule.displayPosition.startRowIndex, this.currentRule.displayPosition.endRowIndex);
				} else {
					modelsHeadLineRowRegionList = modelsHeadLineRowList.slice(this.currentRule.displayPosition.startRowIndex);
				}
				if (this.currentRule.displayPosition.endColIndex) {
					modelsHeadLineColRegionList = modelsHeadLineColList.slice(this.currentRule.displayPosition.startColIndex, this.currentRule.displayPosition.endColIndex);
				} else {
					modelsHeadLineColRegionList = modelsHeadLineColList.slice(this.currentRule.displayPosition.startColIndex);
				}
			}
			len = modelsHeadLineRowRegionList.length;
			modelLastHeadLineRow = modelsHeadLineRowRegionList[len - 1];
			len = modelsHeadLineColRegionList.length;
			modelLastHeadLineCol = modelsHeadLineColRegionList[len - 1];

			this.boxModel.height = modelLastHeadLineRow.get('top') +
				modelLastHeadLineRow.get('height') - modelsHeadLineRowRegionList[0].get('top');
			this.boxModel.width = modelLastHeadLineCol.get('left') +
				modelLastHeadLineCol.get('width') - modelsHeadLineColRegionList[0].get('left');

			if (this.currentRule.eventScroll) {
				/**
				 * 绑定滚动事件
				 * @property events
				 * @type {Object}
				 */
				this.delegateEvents({
					'scroll': 'syncScroll'
				});
				Backbone.on('call:mainContainer', this.callMainContainer, this);
				Backbone.on('event:mainContainer:showSelectRegion', this.showSelectRegion, this);
				Backbone.on('event:mainContainer:adaptRowHeightChange', this.adaptRowHeightChange, this);
				cache.viewRegion.top = modelsHeadLineRowRegionList[0].get('top');
				cache.viewRegion.bottom = modelLastHeadLineRow.get('top') + modelLastHeadLineRow.get('height');
				cache.viewRegion.scrollTop = 0;
				cache.viewRegion.scrollLeft = 0;
				this.loadState = 'FULFILL';
			} else {
				Backbone.on('event:mainContainer:appointPosition', this.appointPosition, this);
			}
		},
		/**
		 * 生成白色背景，用于遮挡输入框
		 */
		addBackGround: function(cellsContainer) {
			if (this.currentRule.displayPosition.endColAlias !== undefined &&
				this.currentRule.displayPosition.endRowAlias !== undefined) {
				//修改为模板
				this.$el.append('<div style="position:absolute;width:inherit;height:inherit;background-color:white;top:0;left:0;z-index:13"></div>');
				cellsContainer.$el.css({
					'z-index': '14'
				});
			} else if (this.currentRule.displayPosition.endColAlias !== undefined ||
				this.currentRule.displayPosition.endRowAlias !== undefined) {
				this.$el.append('<div style="position:absolute;width:inherit;height:inherit;background-color:white;top:0;left:0;z-index:10"></div>');
				cellsContainer.$el.css({
					'z-index': '11'
				});
			}
		},
		/**
		 * 页面渲染方法
		 * @method render
		 */
		render: function() {
			this.attributesRender(this.boxAttributes);
			var cellsContainer = new CellsContainer({
				boxAttributes: {
					height: this.boxModel.height,
					width: this.boxModel.width
				},
				parentView: this
			});
			this.$el.append(cellsContainer.render().el);
			this.addBackGround(cellsContainer);
			return this;
		},

		//for new diff object, subscribe it self object.
		subscribeScroll: function(value, direction) {
			this.appointPosition(value, direction);
		},
		// appoint position , don't pass preventScroll action .
		appointPosition: function(value, direction) {
			this.isPreventScroll = false;
			if (direction === 'TRANSVERSE') {
				this.$el.scrollLeft(value);
			}
			if (direction === 'VERTICAL') {
				this.$el.scrollTop(value);
			}
		},
		/**
		 * 用于其他视图绑定
		 * @method callMainContainer
		 * @param  receiveFunc {Function} 回调函数
		 */
		callMainContainer: function(receiveFunc) {
			receiveFunc(this);
		},
		/**
		 * 渲染容器宽度，高度
		 * @method attributesRender
		 * @param  newAttributes {Object} 宽高
		 */
		attributesRender: function(newAttributes) {
			this.$el.css({
				'width': newAttributes.width,
				'height': newAttributes.height
			});
			if (newAttributes.style) {
				this.$el.addClass(newAttributes.style);
			}
		},
		showSelectRegion: function(direction) {
			switch (direction) {
				case 'LEFT':
					break;
				case 'RIGHT':
					break;
				case 'UP':
					break;
				case 'DOWN':
					this.downScroll();
					break;
				default:
					break;
			}
		},
		/**
		 * 输入回车，选中区域超出容器显示范围，进行向下滚动
		 */
		downScroll: function() {
			var limitBottomPosi,
				bottomRowModel,
				userViewBottom,
				userViewBottomPosi,
				recordScrollTop,
				selectModel,
				adjustPosi;

			selectModel = selectRegions.getModelByType('selected');
			bottomRowModel = headItemRows.getModelByAlias(selectModel.get('wholePosi').startY);
			limitBottomPosi = selectModel.get('physicsBox').top + bottomRowModel.get('height');

			adjustPosi = limitBottomPosi - this.offsetTop - this.userViewTop -
				this.el.scrollTop - this.el.offsetHeight;
			if (adjustPosi > 0) {
				this.el.scrollTop += adjustPosi + 17;
			}
			recordScrollTop = this.el.scrollTop;
			this.el.scrollTop = (top - this.el.offsetHeight);
			this.deleteTop(recordScrollTop);
			this.addBottom(this.recordBottomPosi);
		},
		/**
		 * 处理鼠标滚动事件
		 * @method syncScroll
		 * @param  {event} e 鼠标滚动事件
		 */
		syncScroll: function(e, direction) {
			var verticalDirection,
				userViewRowModel,
				userViewColModel,
				userViewEndRowModel,
				userViewEndColModel,
				recordScrollTop = cache.viewRegion.scrollTop,
				recordScrollLeft = cache.viewRegion.scrollLeft,
				currentViewTop = cache.viewRegion.top,
				currentViewBottom = cache.viewRegion.bottom;

			cache.viewRegion.scrollTop = this.el.scrollTop;
			cache.viewRegion.scrollLeft = this.el.scrollLeft;

			verticalDirection = recordScrollTop - this.el.scrollTop;

			//as scrollbar scroll up
			if (verticalDirection > 0 || direction === 'up') {
				this.addTop(currentViewTop);
				this.deleteBottom(currentViewBottom);
				this.publish('mainContainer', 'verticalPublish', this.el.scrollTop, 'VERTICAL');
			}
			//as scrollbar scroll down
			if (verticalDirection < 0 || direction === 'down') {
				//delete top row
				this.addBottom(currentViewBottom);
				this.deleteTop(currentViewTop);
				this.publish('mainContainer', 'verticalPublish', this.el.scrollTop, 'VERTICAL');
			}
			if (recordScrollLeft !== this.el.scrollLeft) {
				this.publish('mainContainer', 'transversePublish', this.el.scrollLeft, 'TRANSVERSE');
			}

			//save user view position , alias
			if (!cache.TempProp.isFrozen) {
				userViewRowModel = headItemRows.getModelByPosition(this.el.scrollTop);
				userViewEndRowModel = headItemRows.getModelByPosition(this.el.scrollTop + this.el.offsetHeight);
				cache.UserView.rowAlias = userViewRowModel.get('alias');
				cache.UserView.rowEndAlias = userViewEndRowModel.get('alias');

				userViewColModel = headItemCols.getModelByPosition(cache.viewRegion.scrollLeft);
				userViewEndColModel = headItemCols.getModelByPosition(cache.viewRegion.scrollLeft + this.el.offsetWidth);
				cache.UserView.colAlias = userViewColModel.get('alias');
				cache.UserView.colEndAlias = userViewEndColModel.get('alias');
			}
		},
		/**
		 * 显示行上方超出预加载区域，删除超出视图
		 * @method deleteTop
		 * @param {num} localRecordScrollTop 上下移动，缓存高度
		 */
		deleteTop: function(recordTop) {
			var headItemRowList = headItemRows.models,
				limitIndex, //预加载区域边界索引 
				limitTop, //预加载区域边界高度
				limitAlias, //预加载区域边界别名
				recordIndex,
				tempCells, //区域内单元格数组
				cellPositionArray,
				offsetTop,
				userViewTop,
				i, len;

			offsetTop = this.offsetTop;
			userViewTop = this.userViewTop;
			//当前状态预加载标线高度
			limitTop = this.el.scrollTop - config.System.prestrainHeight + offsetTop + userViewTop;
			if (recordTop < 0) {
				recordTop = 0;
			}
			if (limitTop < 0) {
				limitTop = 0;
			}

			limitIndex = binary.indexModelBinary(limitTop, headItemRowList, 'top', 'height');
			recordIndex = binary.indexModelBinary(recordTop, headItemRowList, 'top', 'height');

			if (recordIndex >= limitIndex) {
				return;
			}
			for (i = recordIndex; i < limitIndex; i++) {
				headItemRowList[i].destroyView();
			}

			tempCells = cells.getCellByRow(recordIndex, limitIndex - 1);
			limitAlias = headItemRowList[i].get('alias');
			for (i = 0, len = tempCells.length; i < len; i++) {
				//判断cell最下端是否超出了显示界限
				cellPositionArray = tempCells[i].get('occupy').y;
				if (cellPositionArray.indexOf(limitAlias) === -1) {
					tempCells[i].hide();
				}
			}
			cache.viewRegion.top = headItemRowList[limitIndex].get('top');
		},
		/**
		 * 显示行上方到达加载区域，添加视图视图
		 * @method addTop
		 * @param {num} recordViewTop 上下移动，缓存高度
		 */
		addTop: function(recordTop) {
			var headItemRowList = headItemRows.models,
				recordIndex,
				limitTopPosi,
				limitTopIndex,
				limitBottomPosi,
				headItemRowModel,
				tempCells,
				offsetTop,
				userViewTop,
				i, len;

			//冻结情况，计算视图的偏移量
			offsetTop = this.offsetTop;
			userViewTop = this.userViewTop;

			//计算新的边界高度
			limitTopPosi = this.el.scrollTop - config.System.prestrainHeight + offsetTop + userViewTop;
			limitTopPosi = limitTopPosi < 0 ? 0 : limitTopPosi;
			limitBottomPosi = this.el.scrollTop + this.el.offsetHeight + config.System.prestrainHeight + offsetTop + userViewTop;
			recordTop = recordTop < limitBottomPosi ? recordTop : limitBottomPosi;

			//向后台请求数据
			// this.loadRegion(limitTopPosi, recordTop);
			limitTopIndex = binary.indexModelBinary(limitTopPosi, headItemRowList, 'top', 'height');
			recordIndex = binary.indexModelBinary(recordTop, headItemRowList, 'top', 'height');

			for (i = recordIndex - 1; i >= limitTopIndex; i--) {
				headItemRowModel = headItemRowList[i];
				if (headItemRowModel.get('isView') === false) {
					headItemRowModel.set('isView', true);
					this.publish('mainContainer', 'restoreRowView', headItemRowModel);
				}
			}
			// when mouse fast moving , we has prevent infinite scroll , the double value will be equal.
			if (limitTopIndex < recordIndex) {
				tempCells = cells.getCellByRow(limitTopIndex, recordIndex);
				for (i = 0, len = tempCells.length; i < len; i++) {
					if (tempCells[i].get('showState') === false) {
						tempCells[i].set('showState', true);
						this.publish('mainContainer', 'restoreCellView', tempCells[i]);
					}
				}
			}
			this.adjustColPropCell(limitTopIndex, recordIndex);
			cache.viewRegion.top = headItemRowList[limitTopIndex].get('top');
		},
		/**
		 * 显示行下方超出预加载区域，删除超出视图
		 * @method deleteBottom
		 */
		deleteBottom: function(recordPosi) {
			var headItemRowList = headItemRows.models,
				cellRowAliasArray,
				recordIndex,
				limitPosi,
				limitIndex,
				limitAlias,
				tempCells,
				offsetTop,
				userViewTop,
				i, len;

			if (this.loadState === 'PENDING') {
				return;
			}
			
			offsetTop = this.offsetTop;
			userViewTop = this.userViewTop;

			recordIndex = binary.indexModelBinary(recordPosi, headItemRowList, 'top', 'height');

			limitPosi = this.el.scrollTop + this.el.offsetHeight + config.System.prestrainHeight + offsetTop + userViewTop;
			limitIndex = binary.indexModelBinary(limitPosi, headItemRowList, 'top', 'height');
			for (i = limitIndex + 1; i <= recordIndex; i++) {
				headItemRowList[i].destroyView();
			}
			//删除超过加载区域cell视图对象
			tempCells = cells.getCellByRow(limitIndex + 1, recordIndex);
			for (i = 0, len = tempCells.length; i < len; i++) {
				cellRowAliasArray = tempCells[i].get('occupy').y;
				if (cellRowAliasArray.indexOf(limitAlias) === -1) {
					tempCells[i].hide();
				}
			}
			cache.viewRegion.bottom = headItemRowList[limitIndex].get('top') + headItemRowList[limitIndex].get('height');
		},

		/**
		 * 显示行下方到达加载区域，添加视图视图
		 * @method addBottom
		 */
		addBottom: function(recordPosi) {
			var limitTopPosi,
				limitBottomPosi,
				offsetTop,
				userViewTop;

			if (this.loadState === 'PENDING') {
				return;
			}

			offsetTop = this.offsetTop;
			userViewTop = this.userViewTop;

			limitTopPosi = this.el.scrollTop - config.System.prestrainHeight + offsetTop + userViewTop;
			limitBottomPosi = limitTopPosi + this.el.offsetHeight + config.System.prestrainHeight * 2;

			//自动增长行或者是后台请求数据，已将加载高度可能会超过新的预加载区
			if (recordPosi >= limitBottomPosi) {
				return;
			}

			limitTopPosi = recordPosi + 1 > limitTopPosi ? recordPosi + 1 : limitTopPosi;

			this.loadRegion(limitTopPosi, limitBottomPosi, restoreView);

			/**
			 * 重新渲染超出区域被删除单元格，行列
			 * @param  {number} top    
			 * @param  {number} bottom
			 */
			function restoreView(top, bottom) {
				var headItemRowModel,
					tempCells,
					startIndex,
					endIndex,
					len, i;

				bottom = this.addRows(bottom);
				this.adaptSelectRegion(); //改为trigger

				startIndex = binary.indexModelBinary(top, headItemRowList, 'top', 'height');
				endIndex = binary.indexModelBinary(bottom, headItemRowList, 'top', 'height');

				for (i = startIndex; i <= endIndex; i++) {
					headItemRowModel = headItemRowList[i];
					if (headItemRowModel.get('isView') === false) {
						headItemRowModel.set('isView', true);
						this.publish('mainContainer', 'restoreRowView', headItemRowModel);
					}
				}
				tempCells = cells.getCellByRow(startIndex, endIndex);
				for (i = 0, len = tempCells.length; i < len; i++) {
					if (tempCells[i].get('showState') === false) {
						tempCells[i].set('showState', true);
						this.publish('mainContainer', 'restoreCellView', tempCells[i]);
					}
				}
				this.adjustColPropCell(startIndex, endIndex);
				cache.viewRegion.bottom = headItemRowList[endIndex].get('top') + headItemRowList[endIndex].get('height');
				this.adjustContainerHeight();
			}
		},
		/**
		 * 区域数据加载函数
		 * @method loadRegion
		 * @param  {number} top 请求顶部的坐标       
		 * @return {number} bottom 请求底部的坐标       
		 */
		loadRegion: function(top, bottom, fn) {
			var self = this,
				isUnloadRows,
				isUnloadCells;

			if (top > cache.localRowPosi || cache.localRowPosi === 0) {
				fn.call(this, top, bottom);
				return;
			}
			bottom = bottom < cache.localRowPosi ? bottom : cache.localRowPosi;

			isUnloadRows = loadRecorder.isUnloadPosi(top, bottom, cache.rowRegionPosi);
			isUnloadCells = loadRecorder.isUnloadPosi(top, bottom, cache.cellRegionPosi.vertical);
			//需要根据方向，进行添加缓冲区
			if (isUnloadRows || isUnloadCells) {
				bottom = bottom + cache.scrollBufferHeight;
				this.doRequest(top, bottom, isUnloadRows, isUnloadCells, fn);
			} else {
				fn.call(this, top, bottom);
			}
		},
		doRequest: function(top, bottom, loadRows, loadCells, fn) {
			var self = this;

			this.loadState = 'PENDING';

			send.PackAjax({
				url: config.url.sheet.load,
				async: true,
				isPublic: false,
				data: JSON.stringify({
					top: top,
					bottom: bottom
				}),
				success: analysisData
			});

			function analysisData(data) {

				if (!data) {
					return;
				}
				if (loadRows) {
					var startRowSort,
						bottomIndex,
						topIndex,
						rows;

					startRowSort = data.dataRowStartIndex;
					cache.localRowPosi = data.maxRowPixel;
					rows = data.returndata.spreadSheet[0].sheet.glY;

					original.analysisRowData(rows, startRowSort);

					topIndex = binary.indexModelBinary(top, headItemRowList, 'top', 'height');
					bottomIndex = binary.indexModelBinary(bottom, headItemRowList, 'top', 'height');

					top = headItemRowList[topIndex].get('top');
					bottom = headItemRowList[bottomIndex].get('top') + headItemRowList[bottomIndex].get('height');

					loadRecorder.insertPosi(top, bottom, cache.rowRegionPosi);
					fn.call(self, top, bottom);
				}
				if (loadCells) {
					var cells = data.returndata.spreadSheet[0].sheet.cells;
					original.analysisCellData(cells);
					topIndex = binary.indexModelBinary(top, headItemRowList, 'top', 'height');
					bottomIndex = binary.indexModelBinary(bottom, headItemRowList, 'top', 'height');
					loadRecorder.insertPosi(headItemRowList[topIndex].get('top'),
						headItemRowList[bottomIndex].get('top') + headItemRowList[bottomIndex].get('height'), cache.cellRegionPosi.vertical);
				}
				self.loadState = 'FULFILL';
			}
		},
		/**
		 * 自动到select中
		 * 在整行整列选中时，进行滚动操作，时时修改选中区域的宽高
		 * @return {[type]} [description]
		 */
		adaptSelectRegion: function() {
			var select = selectRegions.getModelByType('selected'),
				headLineRowModelList = headItemRows.models,
				endColAlias = select.get('wholePosi').endX,
				endRowAlias = select.get('wholePosi').endY,
				currentModelIndex,
				height,
				len, i,
				model;

			if (endColAlias !== 'MAX' && endRowAlias !== 'MAX') {
				return;
			}
			//暂时只做整列选中的调节
			if (endRowAlias === 'MAX') {
				height = select.get('physicsBox').height;
				currentModelIndex = binary.modelBinary(height - 1, headLineRowModelList, 'top', 'height', 0, headLineRowModelList.length - 1);
				len = headItemRows.length;
				model = headItemRows.models[len - 1];
				height = model.get('top') + model.get('height') - 1;
				select.set('physicsBox.height', height);
				siderLineRows.models[0].set({
					height: height
				});
			}
			for (i = currentModelIndex + 1; i < len; i++) {
				headLineRowModelList[i].set('activeState', true);
			}
		},
		adaptRowHeightChange: function(startPosi, diffDistance) {
			var userViewRowModel,
				userViewEndRowModel;
			if (cache.viewRegion.top > startPosi) {
				cache.viewRegion.top += diffDistance;
				userViewRowModel = headItemRows.getModelByPosition(this.recordScrollTop);
				cache.UserView.rowAlias = userViewRowModel.get('alias');
				if (diffDistance > 0) {
					this.addTop(cache.viewRegion.top);
				} else {
					this.deleteTop(cache.viewRegion.top);
				}
			}
			if (cache.viewRegion.bottom > startPosi) {
				cache.viewRegion.bottom += diffDistance;
				userViewEndRowModel = headItemRows.getModelByPosition(this.recordScrollTop + this.el.offsetHeight);
				cache.UserView.rowEndAlias = userViewEndRowModel.get('alias');
				if (diffDistance > 0) {
					this.deleteBottom(cache.viewRegion.bottom);
				} else {
					this.addBottom(cache.viewRegion.bottom);
				}
			}
			loadRecorder.adaptPosi(startPosi, diffDistance, cache.rowRegionPosi);
			loadRecorder.adaptPosi(startPosi, diffDistance, cache.cellRegionPosi.vertical);
			if (cache.localRowPosi !== 0) {
				cache.localRowPosi += diffDistance;
			}
		},
		/**
		 * 动态加载，添加列
		 * @method addCol
		 */
		// addCol: function() {
		// var len, colValue, i = 0;

		// len = config.User.addCol;
		// colValue = headItemCols.length;
		// while (i < len) {
		// 	headItemCols.add({
		// 		alias: (colValue + 1).toString(),
		// 		left: colValue * config.User.cellWidth,
		// 		width: config.User.cellWidth - 1,
		// 		displayName: buildAlias.buildColAlias(colValue)
		// 	});
		// 	colValue++;
		// 	i++;
		// }
		// this.cellsContainer.attributesRender({
		// 	width: headItemCols.getMaxDistanceWidth(),
		// 	height: headItemRows.getMaxDistanceHeight()
		// });
		// this.viewColsAllHeadContainer.$el.css({
		// 	width: headItemCols.getMaxDistanceWidth()
		// });
		// },
		addRows: function(height) {
			var maxheadItemHeight = headItemRows.getMaxDistanceHeight(),
				maxLocalHeight = cache.localRowPosi,
				startIndex = headItemRows.length,
				len;

			if (height <= maxheadItemHeight || height <= maxLocalHeight) {
				return height;
			}
			maxheadItemHeight = maxheadItemHeight > maxLocalHeight ? maxheadItemHeight : maxLocalHeight;
			len = Math.ceil((height + cache.scrollBufferHeight - maxheadItemHeight) / config.User.cellHeight);
			headItemRows.generate(len);
			send.PackAjax({
				url: config.url.row.plus_batch,
				data: JSON.stringify({
					num: len
				})
			});
			this.adjustColPropCell(startIndex, startIndex + len - 1);
			height = headItemRows.getMaxDistanceHeight();

			return height;
		},
		/**
		 * 加载行对象时，对进行过整列操作的列的所在单元格进行相应的渲染
		 * @param  {int} startIndex 行起始坐标
		 * @param  {int} endIndex   行结束坐标
		 */
		adjustColPropCell: function(startIndex, endIndex) {
			var headItemColList,
				headItemRowList,
				headItemModel,
				aliasCol,
				aliasRow,
				occupyCol,
				colProp,
				len, i = 0,
				j;
			headItemColList = headItemCols.models;
			headItemRowList = headItemRows.models;

			len = headItemColList.length;
			occupyCol = cache.CellsPosition.strandX;
			for (; i < len; i++) {
				headItemModel = headItemColList[i];
				colProp = headItemModel.get('operProp');
				if (!$.isEmptyObject(colProp)) {
					for (j = startIndex; j < endIndex + 1; j++) {
						aliasCol = headItemColList[i].get('alias');
						aliasRow = headItemRowList[j].get('alias');
						if (occupyCol[aliasCol] === undefined || occupyCol[aliasCol][aliasRow] === undefined) {
							cells.createCellModel(i, j, colProp);
						}
					}
				}
			}
		},
		adjustContainerHeight: function(height) {
			Backbone.trigger('event:cellsContainer:adaptHeight');
			Backbone.trigger('event:rowsAllHeadContainer:adaptHeight');
		},
		/**
		 * 视图销毁
		 * @method destroy
		 */
		destroy: function() {
			Backbone.trigger('event:cellsContainer:destroy');
			Backbone.off('call:mainContainer');
			Backbone.off('event:mainContainer:destroy');
			Backbone.off('event:mainContainer:attributesRender');
			this.remove();
		}
	});
	return MainContainer;
});