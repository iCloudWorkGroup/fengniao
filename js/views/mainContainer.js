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
		Backbone = require('lib/backbone'),
		binary = require('basic/util/binary'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		original = require('basic/tools/original'),
		clone = require('basic/util/clone'),
		send = require('basic/tools/send'),
		loadRecorder = require('basic/tools/loadrecorder'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		siderLineRows = require('collections/siderLineRow'),
		cells = require('collections/cells'),
		selectRegions = require('collections/selectRegion'),
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
			var lineRowList,
				lineColList,
				lastLineRow,
				lastLineCol,
				startRowIndex,
				startColIndex,
				endRowIndex,
				endColIndex,
				len;

			Backbone.on('event:mainContainer:destroy', this.destroy, this);
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

			lineRowList = headItemRowList;
			lineColList = headItemColList;

			startRowIndex = this.currentRule.displayPosition.startRowIndex;
			startColIndex = this.currentRule.displayPosition.startColIndex;
			endRowIndex = this.currentRule.displayPosition.endRowIndex;
			endColIndex = this.currentRule.displayPosition.endColIndex;

			this.parentNode = options.parentNode;

			//计算容器高度
			if (cache.TempProp.isFrozen) {
				if (endRowIndex) {
					lineRowList = lineRowList.slice(startRowIndex, endRowIndex);
				} else {
					lineRowList = lineRowList.slice(startRowIndex);
				}
				if (endColIndex) {
					lineColList = lineColList.slice(startColIndex, endColIndex);
				} else {
					lineColList = lineColList.slice(startColIndex);
				}
			}
			//避免len为0的情况
			if (len = lineRowList.length) {
				lastLineRow = lineRowList[len - 1];
				this.boxModel.height = lastLineRow.get('top') + lastLineRow.get('height') -
					lineRowList[0].get('top');
			} else {
				this.boxModel.height = 0;
			}
			//避免len为0的情况
			if (len = lineColList.length) {
				lastLineCol = lineColList[len - 1];
				this.boxModel.width = lastLineCol.get('left') + lastLineCol.get('width') -
					lineColList[0].get('left');
			} else {
				this.boxModel.width = 0;
			}

			if (endRowIndex === undefined) {
				Backbone.on('event:changeSidebarContainer', this.shrink, this);
			}
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
				cache.viewRegion.top = lineRowList[0].get('top');
				cache.viewRegion.bottom = lastLineRow.get('top') + lastLineRow.get('height');
				cache.viewRegion.scrollTop = 0;
				cache.viewRegion.scrollLeft = 0;
				this.loadRowState = 'FULFILL';
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
		shrink: function() {
			if (cache.sidebarState) {
				this.$el.width(this.boxAttributes.width - config.sidebarWidth);
			} else {
				this.$el.width(this.boxAttributes.width);
			}
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
			var width = newAttributes.width,
				endColIndex =this.currentRule.displayPosition.endColIndex ;
			if (typeof endColIndex === 'undefined' && cache.sidebarState) {
				width = width - config.sidebarWidth;
				width = width < 0 ? 0 : width;
			}
			this.$el.css({
				'width': width,
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
				selectModel,
				adjustPosi;

			selectModel = selectRegions.getModelByType('selected');
			bottomRowModel = headItemRows.getModelByAlias(selectModel.get('wholePosi').startY);
			limitBottomPosi = bottomRowModel.get('top') + bottomRowModel.get('height');

			adjustPosi = limitBottomPosi - this.offsetTop - this.userViewTop -
				this.el.scrollTop - this.el.offsetHeight;
			if (adjustPosi > 0) {
				this.el.scrollTop += adjustPosi + 17;
			}

		},
		/**
		 * 处理鼠标滚动事件
		 * @method syncScroll
		 * @param  {event} e 鼠标滚动事件
		 */
		syncScroll: function(e, direction) {
			var verticalDirection,
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
			this.updateUserView();
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
				limitTopPosi,
				limitBottomPosi,
				offsetTop,
				userViewTop,
				self = this;

			//冻结情况，计算视图的偏移量
			offsetTop = this.offsetTop;
			userViewTop = this.userViewTop;

			//计算新的边界高度
			limitTopPosi = this.el.scrollTop - config.System.prestrainHeight + offsetTop + userViewTop;
			limitTopPosi = limitTopPosi < 0 ? 0 : limitTopPosi;
			limitBottomPosi = this.el.scrollTop + this.el.offsetHeight + config.System.prestrainHeight + offsetTop + userViewTop;
			limitBottomPosi = recordTop < limitBottomPosi ? recordTop : limitBottomPosi;

			this.loadRegion(limitTopPosi, limitBottomPosi, restoreView);

			/**
			 * 重新渲染超出区域被删除单元格，行列
			 * @param  {number} top    
			 * @param  {number} bottom
			 */
			function restoreView(top, bottom) {
				var headItemRowModel,
					cellModel,
					cellList,
					startIndex,
					endIndex,
					len, i;

				startIndex = binary.indexModelBinary(top, headItemRowList, 'top', 'height');
				endIndex = binary.indexModelBinary(bottom, headItemRowList, 'top', 'height');
				for (i = endIndex; i >= startIndex; i--) {
					headItemRowModel = headItemRowList[i];
					if (headItemRowModel.get('isView') === false) {
						headItemRowModel.set('isView', true);
						self.publish('mainContainer', 'restoreRowView', headItemRowModel, 'up');
					}
				}
				cellList = cells.getCellByRow(startIndex, endIndex);
				for (i = 0, len = cellList.length; i < len; i++) {
					cellModel = cellList[i];
					if (cellModel.get('showState') === false) {
						cellModel.set('showState', true);
						self.publish('mainContainer', 'restoreCellView', cellModel);
					}
				}
				self.adjustColPropCell(startIndex, endIndex);
				cache.viewRegion.top = headItemRowList[startIndex].get('top');
			}
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

			if (this.loadRowState === 'PENDING') {
				return;
			}

			offsetTop = this.offsetTop;
			userViewTop = this.userViewTop;

			recordIndex = binary.indexModelBinary(recordPosi, headItemRowList, 'top', 'height');

			limitPosi = this.el.scrollTop + this.el.offsetHeight + config.System.prestrainHeight + offsetTop + userViewTop;
			limitIndex = binary.indexModelBinary(limitPosi, headItemRowList, 'top', 'height');
			for (i = limitIndex + 1; i <= recordIndex; i++) {
				headItemRowList[i].set('isView', false);
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
				userViewTop,
				self = this;

			if (this.loadRowState === 'PENDING') {
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
					cellList,
					cellModel,
					maxBottom,
					startIndex,
					endIndex,
					i, len;

				maxBottom = headItemRows.getMaxDistanceHeight();
				maxBottom = maxBottom < bottom ? maxBottom : bottom;

				startIndex = binary.indexModelBinary(top, headItemRowList, 'top', 'height');
				endIndex = binary.indexModelBinary(maxBottom, headItemRowList, 'top', 'height');
				for (i = startIndex; i <= endIndex; i++) {
					headItemRowModel = headItemRowList[i];
					if (headItemRowModel.get('isView') === false) {
						headItemRowModel.set('isView', true);
						self.publish('mainContainer', 'restoreRowView', headItemRowModel, 'down');
					}
				}
				cellList = cells.getCellByRow(startIndex, endIndex);
				for (i = 0, len = cellList.length; i < len; i++) {
					cellModel = cellList[i];
					if (cellModel.get('showState') === false) {
						cellModel.set('showState', true);
						self.publish('mainContainer', 'restoreCellView', cellModel);
					}
				}
				if (maxBottom < bottom) {
					bottom = self.addRows(bottom);
					endIndex = binary.indexModelBinary(bottom, headItemRowList, 'top', 'height');
				}

				self.adjustColPropCell(startIndex, endIndex);
				self.adaptSelectRegion();
				cache.viewRegion.bottom = headItemRowList[endIndex].get('top') + headItemRowList[endIndex].get('height');
				self.adjustContainerHeight();
			}
		},
		/**
		 * 区域数据加载函数
		 * @method loadRegion
		 * @param  {number} top 请求顶部的坐标       
		 * @return {number} bottom 请求底部的坐标       
		 */
		loadRegion: function(top, bottom, restoreView) {
			var existUnloads;

			//超出表格的最大高度或新建表格，直接进行视图的还原和添加
			if (top > cache.localRowPosi || cache.localRowPosi === 0) {
				restoreView.call(this, top, bottom);
				return;
			}
			bottom = bottom < cache.localRowPosi ? bottom : cache.localRowPosi;

			existUnloads = loadRecorder.isUnloadPosi(top, bottom, cache.rowRegionPosi);

			if (existUnloads) {
				this.doRequest(top, bottom, restoreView);
			} else {
				restoreView.call(this, top, bottom);
			}
		},
		doRequest: function(top, bottom, restoreView) {
			var self = this;

			this.loadRowState = 'PENDING';
			bottom = bottom + cache.scrollBufferHeight;

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
				var bottomIndex,
					startRowSort,
					rowList,
					cellList,
					topIndex;
				if (!data) {
					return;
				}

				startRowSort = data.dataRowStartIndex;
				cache.localRowPosi = data.maxRowPixel;
				rowList = data.returndata.spreadSheet[0].sheet.glY;
				cellList = data.returndata.spreadSheet[0].sheet.cells;

				original.analysisRowData(rowList, startRowSort);
				original.analysisCellData(cellList);

				topIndex = binary.indexModelBinary(top, headItemRowList, 'top', 'height');
				bottomIndex = binary.indexModelBinary(bottom, headItemRowList, 'top', 'height');

				top = headItemRowList[topIndex].get('top');
				bottom = headItemRowList[bottomIndex].get('top') + headItemRowList[bottomIndex].get('height');
				loadRecorder.insertPosi(top, bottom, cache.rowRegionPosi);
				restoreView.call(self, top, bottom);
				self.loadRowState = 'FULFILL';
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
		adaptRowHeightChange: function(startPosi, diff) {
			if (cache.localRowPosi !== 0) {
				cache.localRowPosi += diff;
				loadRecorder.adaptPosi(startPosi, diff, cache.rowRegionPosi);
			}

			if (cache.viewRegion.top > startPosi) {
				cache.viewRegion.top += diff;
				if (diff > 0) {
					this.addTop(cache.viewRegion.top);
				} else {
					this.deleteTop(cache.viewRegion.top);
				}
			}
			if (cache.viewRegion.bottom > startPosi) {
				cache.viewRegion.bottom += diff;
				//处理末尾行删除情况
				if (cache.viewRegion.bottom < cache.viewRegion.top) {
					cache.viewRegion.top = cache.viewRegion.bottom;
				}
				if (diff > 0) {
					this.deleteBottom(cache.viewRegion.bottom);
				} else {
					this.addBottom(cache.viewRegion.bottom);
				}
			}
			this.updateUserView();
		},
		updateUserView: function() {
			if (cache.TempProp.isFrozen) {
				return;
			}
			var startRowModel, endRowModel, startColModel, endColModel;

			startRowModel = headItemRows.getModelByPosition(this.el.scrollTop);
			endRowModel = headItemRows.getModelByPosition(this.el.scrollTop + this.el.offsetHeight);
			cache.UserView.rowAlias = startRowModel.get('alias');
			cache.UserView.rowEndAlias = endRowModel.get('alias');

			startColModel = headItemCols.getModelByPosition(cache.viewRegion.scrollLeft);
			endColModel = headItemCols.getModelByPosition(cache.viewRegion.scrollLeft + this.el.offsetWidth);
			cache.UserView.colAlias = startColModel.get('alias');
			cache.UserView.colEndAlias = endColModel.get('alias');
		},
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
				url: config.url.row.plusBatch,
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
			var headItemModel,
				aliasCol,
				aliasRow,
				occupyCol,
				colProp,
				len, i = 0,
				j;

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
		adjustContainerHeight: function() {
			Backbone.trigger('event:cellsContainer:adaptHeight');
			Backbone.trigger('event:rowsAllHeadContainer:adaptHeight');
		},
		/**
		 * 视图销毁
		 * @method destroy
		 */
		destroy: function() {
			if (this.unsubscribe) {
				this.unsubscribe('mainContainer', 'transversePublish');
				this.unsubscribe('mainContainer', 'verticalPublish');
			}
			Backbone.trigger('event:cellsContainer:destroy');
			Backbone.off('call:mainContainer');
			Backbone.off('event:mainContainer:destroy');
			Backbone.off('event:mainContainer:adaptRowHeightChange');
			Backbone.off('event:mainContainer:showSelectRegion');
			Backbone.off('event:mainContainer:appointPosition');
			Backbone.off('event:changeSidebarContainer');
			this.remove();

		}
	});
	return MainContainer;
});