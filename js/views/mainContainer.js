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
		CellsContainer = require('views/cellsContainer');

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
		initialize: function() {
			var modelsHeadLineRowList,
				modelsHeadLineColList,
				modelsHeadLineRowRegionList,
				modelsHeadLineColRegionList,
				modelLastHeadLineRow,
				modelLastHeadLineCol,
				len;

			Backbone.on('event:mainContainer:destroy', this.destroy, this);
			Backbone.on('event:mainContainer:attributesRender', this.attributesRender, this);
			Backbone.on('event:mainContainer:appointPosition', this.appointPosition, this);

			this.currentRule = clone.clone(cache.CurrentRule);

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
				Backbone.on('event:mainContainer:nextCellPosition', this.nextCellPosition, this);
				Backbone.on('event:mainContainer:addBottom', this.addBottom, this);
			}
			this.boxModel = {};

			this.boxAttributes = this.currentRule.boxAttributes;

			// for reduction position , prevent event scroll auto trigger.
			this.isPreventScroll = true;

			this.recordScrollLeft = this.recordScrollTop = 0;

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
			//ps:计算问题
			this.boxModel.height = modelLastHeadLineRow.get('top') + modelLastHeadLineRow.get('height') - modelsHeadLineRowRegionList[0].get('top');
			this.boxModel.width = modelLastHeadLineCol.get('left') + modelLastHeadLineCol.get('width') - modelsHeadLineColRegionList[0].get('left');

			this.rowsViewBottomPosi = this.boxModel.height;
			config.displayRowHeight = this.rowsViewBottomPosi;
			cache.visibleRegion.top = 0;
			cache.visibleRegion.bottom = this.rowsViewBottomPosi;
		},
		/**
		 * 生成白色背景，用于遮挡输入框
		 */
		addBackGround: function() {
			if (this.currentRule.displayPosition.endColAlias !== undefined &&
				this.currentRule.displayPosition.endRowAlias !== undefined) {
				//修改为模板
				this.$el.append('<div style="position:absolute;width:inherit;height:inherit;background-color:white;top:0;left:0;z-index:13"></div>');
				this.cellsContainer.$el.css({
					'z-index': '14'
				});
			} else if (this.currentRule.displayPosition.endColAlias !== undefined ||
				this.currentRule.displayPosition.endRowAlias !== undefined) {
				this.$el.append('<div style="position:absolute;width:inherit;height:inherit;background-color:white;top:0;left:0;z-index:10"></div>');
				this.cellsContainer.$el.css({
					'z-index': '11'
				});
			}
		},
		addCellViewPublish: function(cellModel) {
			this.publish(cellModel, 'addCellViewPublish');
		},

		addRowHeadItemViewPublish: function(headItemRowModel) {
			this.publish(headItemRowModel, 'addRowHeadItemViewPublish');
		},
		addHeadItemView: function(headItemRowModel) {
			var gridLineRowContainer;
			gridLineRowContainer = new GridLineRowContainer({
				model: headItemRowModel,
				frozenTop: this.currentRule.displayPosition.offsetTop
			});
			this.cellsContainer.gridLineContainer.rowsGridContainer.$el.append(gridLineRowContainer.render().el);
		},
		/**
		 * 页面渲染方法
		 * @method render
		 */
		render: function() {
			this.attributesRender(this.boxAttributes);

			this.cellsContainer = new CellsContainer({
				boxAttributes: {
					height: this.boxModel.height,
					width: this.boxModel.width
				},
				parentView: this
			});
			this.$el.append(this.cellsContainer.render().el);
			this.addBackGround();
			this.triggerCallback();
			return this;
		},

		//for new diff object, subscribe it self object.
		subscribeScroll: function(value, directionObj) {
			this.appointPosition(value, directionObj.direction);
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
		 * 绑定其他视图
		 * @method triggerCallback
		 */
		triggerCallback: function() {
			_.bindAll(this, 'callView');
			Backbone.trigger('call:bodyContainer', this.callView('viewBodyContainer'));
			Backbone.trigger('call:colsAllHeadContainer', this.callView('viewColsAllHeadContainer'));
		},
		callView: function(name) {
			var object = this;
			return function(callback) {
				object[name] = callback;
			};
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
		nextCellPosition: function(direction) {
			switch (direction) {
				case 'LEFT':
					break;
				case 'RIGHT':
					break;
				case 'UP':
					break;
				case 'DOWN':
					this.downCellPosition();
					break;
				default:
					break;
			}
		},
		/**
		 * 输入回车，选中区域超出容器显示范围，进行向下滚动
		 */
		downCellPosition: function() {
			var rowAliasArray = [],
				loadStartAlias = [],
				loadEndAlias,
				offsetTop,
				userViewTop,
				recordScrollTop,
				cellModel,
				bottomHeadRowItem,
				top,
				i, len;


			//处理冻结情况,只有主区域能够进行滚动
			if (cache.TempProp.isFrozen &&
				(this.currentRule.displayPosition.endRowIndex ||
					this.currentRule.displayPosition.endColIndex)) {
				return;
			}

			//判断是否存在单元格未全部初始化
			cellModel = cells.getCellsByWholeSelectRegion()[0];
			if (cellModel === null) {
				rowAliasArray.push(selectRegions.models[0].get('wholePosi').startY);
			} else {
				rowAliasArray = cellModel.get('occupy').y;
			}

			len = rowAliasArray.length;
			for (i = 0; i < len; i++) {
				if (headItemRows.getIndexByAlias(rowAliasArray[i]) === -1) {
					loadStartAlias = rowAliasArray[i];
					break;
				}
			}
			if (loadStartAlias !== undefined) {
				loadEndAlias = rowAliasArray[len - 1];
			}
			bottomHeadRowItem = headItemRows.getModelByAlias(rowAliasArray[len - 1]);
			//判断Excel冻结状态，非冻结状态(冻结高度为0，用户可视起点高度为0)
			if (cache.TempProp.isFrozen === true) {
				offsetTop = this.currentRule.displayPosition.offsetTop;
				userViewTop = headItemRows.getModelByAlias(cache.UserView.rowAlias).get('top');
			} else {
				offsetTop = 0;
				userViewTop = 0;
			}
			//重新定位，可视区域底部高度值
			top = bottomHeadRowItem.get('top') + bottomHeadRowItem.get('height') + config.User.cellHeight + 10 - offsetTop - userViewTop;

			if (top < this.el.scrollTop + this.el.offsetHeight) {
				return;
			}
			recordScrollTop = this.el.scrollTop;
			this.el.scrollTop = (top - this.el.offsetHeight);
			this.deleteTop(recordScrollTop);
			this.addBottom(recordScrollTop);
		},
		/**
		 * 处理鼠标滚动事件
		 * @method syncScroll
		 * @param  {event} e 鼠标滚动事件
		 */
		syncScroll: function(e) {
			var verticalDirection,
				transverseDirection,
				modelRowList,
				modelColList,
				userViewRowModel,
				userViewColModel,
				userViewEndRowModel,
				userViewEndColModel,
				currentDisplayViewTop = this.recordScrollTop,
				currentDisplayViewLeft = this.recordScrollLeft;

			this.preventAutoScroll();
			this.triggerCallback();

			verticalDirection = currentDisplayViewTop - this.el.scrollTop;
			transverseDirection = currentDisplayViewLeft - this.el.scrollLeft;
			//save user view position , alias
			if (!cache.TempProp.isFrozen) {
				modelRowList = headItemRows;
				modelColList = headItemCols;
				userViewRowModel = modelRowList.getModelByPosition(this.recordScrollTop);
				userViewEndRowModel = modelRowList.getModelByPosition(this.recordScrollTop + this.el.offsetHeight);

				cache.UserView.rowAlias = userViewRowModel.get('alias');
				cache.UserView.rowEndAlias = userViewEndRowModel.get('alias');
				userViewColModel = modelColList.getModelByPosition(this.recordScrollLeft);
				userViewEndColModel = modelColList.getModelByPosition(this.recordScrollLeft + this.el.offsetWidth);
				cache.UserView.colAlias = userViewColModel.get('alias');
				cache.UserView.colEndAlias = userViewEndColModel.get('alias');
			}

			//as scrollbar scroll up
			if (verticalDirection > 0) {
				this.addTop(currentDisplayViewTop);
				this.deleteBottom(currentDisplayViewTop);
			}
			//as scrollbar scroll down
			if (verticalDirection < 0) {
				//delete top row
				this.addBottom(currentDisplayViewTop);
				this.deleteTop(currentDisplayViewTop);
			}
			//
			// if (transverseDirection > 0) {
			// }
			// if (transverseDirection < 0) {
			// }
		},
		/**
		 * 显示行上方超出预加载区域，删除超出视图
		 * @method deleteTop
		 * @param {num} localRecordScrollTop 上下移动，缓存高度
		 */
		deleteTop: function(recordViewTop) {
			var limitIndex, //预加载区域索引 
				limitTop, //预加载区域高度
				recordIndex,
				recordTop,
				headItemRowList,
				tempCells, //区域内单元格数组
				cellMaxRowIndex,
				maxRowIndex,
				cellPositionArray,
				offsetTop,
				userViewTop,
				i, j, k;

			//判断Excel冻结状态，非冻结状态(冻结高度为0，用户可视起点高度为0)
			if (cache.TempProp.isFrozen === true) {
				offsetTop = this.currentRule.displayPosition.offsetTop;
				userViewTop = headItemRows.getModelByAlias(cache.UserView.rowAlias).get("top");
			} else {
				offsetTop = 0;
				userViewTop = 0;
			}

			headItemRowList = headItemRows.models;

			//原状态预加载标线高度
			recordTop = recordViewTop - config.System.prestrainHeight + offsetTop + userViewTop;

			//当前状态预加载标线高度

			limitTop = this.el.scrollTop - config.System.prestrainHeight + offsetTop + userViewTop;


			if (recordTop < 0) recordTop = 0;
			if (limitTop < 0) limitTop = 0;

			limitIndex = binary.indexModelBinary(limitTop, headItemRowList, 'top', 'height');
			recordIndex = binary.indexModelBinary(recordTop, headItemRowList, 'top', 'height');

			if (recordIndex >= limitIndex) {
				return;
			}
			for (i = recordIndex; i < limitIndex; i++) {
				headItemRowList[i].destroyView();
			}

			tempCells = cells.getCellsByRowIndex(recordIndex, limitIndex - 1);

			for (j = 0; j < tempCells.length; j++) {
				//判断cell最下端单元格是否符合要求
				if (tempCells[j] === undefined || tempCells[j] === null) {
					continue;
				}
				cellPositionArray = tempCells[j].get("occupy").y;

				for (k = cellPositionArray.length - 1; k > -1; k--) {
					cellMaxRowIndex = headItemRows.getIndexByAlias(cellPositionArray[k]);
					if (cellMaxRowIndex === null || cellMaxRowIndex === undefined || cellMaxRowIndex === -1) {
						continue;
					}
					if (cellMaxRowIndex < limitIndex) {
						tempCells[j].hide();
					}
					break;
				}
			}
			cache.visibleRegion.top = headItemRowList[limitIndex].get("top");
			// config.DynamicLoad.row.start = limitIndex;
		},
		/**
		 * 显示行上方到达加载区域，添加视图视图
		 * @method addTop
		 * @param {num} localRecordScrollTop 上下移动，缓存高度
		 */
		addTop: function(currentDisplayViewTop) {
			// this mehod need to optimization code, 
			// situation judgment.
			var limitTopPosi,
				limitBottomPosi,
				limitTopIndex,
				limitBottomIndex,
				getTopPosi,
				getBottomPosi,
				currentTopPosi,
				currentTopIndex,
				headItemRowList,
				headItemRowModel,
				gridLineRowModel,
				headItemRowContainer,
				gridLineRowContainer,
				tempCells,
				offsetTop,
				userViewTop,
				i;

			headItemRowList = headItemRows.models;

			//冻结情况，计算视图的偏移量
			if (cache.TempProp.isFrozen === true) {
				offsetTop = this.currentRule.displayPosition.offsetTop;
				userViewTop = headItemRows.getModelByAlias(cache.UserView.rowAlias).get('top');
			} else {
				offsetTop = 0;
				userViewTop = 0;
			}
			this.loadRegionRows(offsetTop, userViewTop);

			limitTopPosi = this.el.scrollTop - config.System.prestrainHeight + offsetTop + userViewTop;
			limitTopPosi = limitTopPosi < 0 ? 0 : limitTopPosi;
			limitBottomPosi = this.el.scrollTop + this.el.offsetHeight + config.System.prestrainHeight + offsetTop + userViewTop;

			limitTopIndex = binary.indexModelBinary(limitTopPosi, headItemRowList, 'top', 'height');
			limitBottomIndex = binary.indexModelBinary(limitBottomPosi, headItemRowList, 'top', 'height');
			// user view limit top posi
			currentTopPosi = currentDisplayViewTop - config.System.prestrainHeight + offsetTop + userViewTop;
			currentTopPosi = currentTopPosi < 0 ? 0 : currentTopPosi;
			currentTopIndex = binary.indexModelBinary(currentTopPosi, headItemRowList, 'top', 'height');
			currentTopIndex = currentTopIndex > limitBottomIndex ? limitBottomIndex : currentTopIndex;


			for (i = currentTopIndex - 1; i >= limitTopIndex; i--) {
				headItemRowModel = headItemRowList[i];
				if (headItemRowModel.get('isView') === false) {
					headItemRowModel.set('isView', true);
					gridLineRowContainer = new GridLineRowContainer({
						model: headItemRowModel,
						frozenTop: this.currentRule.displayPosition.offsetTop
					});
					this.addRowHeadItemViewPublish(headItemRowModel);
					this.cellsContainer.gridLineContainer.rowsGridContainer.$el.prepend(gridLineRowContainer.render().el);
				}
			}
			// when mouse fast moving , we has prevent infinite scroll , the double value will be equal.
			if (limitTopIndex < currentTopIndex) {
				tempCells = cells.getCellsByRowIndex(limitTopIndex, currentTopIndex);
				for (i = 0; i < tempCells.length; i++) {

					if (tempCells[i] === undefined || tempCells[i] === null) {
						continue;
					}
					if (tempCells[i].get('showState') === false) {
						//ps:可优化
						tempCells[i].set('physicsBox', this.recountCellPhysicsBox(tempCells[i]));
						tempCells[i].set('showState', true);
						var tempView = new CellContainer({
							model: tempCells[i],
							currentRule: this.currentRule
						});
						this.cellsContainer.contentCellsContainer.$el.prepend(tempView.render().el);
						this.addCellViewPublish(tempCells[i]);
					}
				}
			}
			this.adjustColPropCell(limitTopIndex, currentTopIndex);
			cache.visibleRegion.top = headItemRowList[limitTopIndex].get("top");
		},
		/**
		 * 区域数据加载函数
		 * @method loadRegionRows
		 * @param  {[type]} offsetTop             [description]
		 * @return {[type]}                       [description]
		 */
		loadRegionRows: function(offsetTop, userViewTop) {
			var limitTopPosi,
				limitBottomPosi,
				unloadRegions,
				unloadCellRegions,
				i = 0;

			limitTopPosi = this.el.scrollTop - config.System.prestrainHeight + offsetTop + userViewTop;

			if (limitTopPosi < 0) limitTopPosi = 0;
			if (limitTopPosi > cache.localRowPosi || cache.localRowPosi === 0) {
				return;
			}
			limitBottomPosi = this.el.scrollTop + this.el.offsetHeight + config.System.prestrainHeight + offsetTop + userViewTop;


			if (limitBottomPosi > cache.localRowPosi) {
				limitBottomPosi = cache.localRowPosi;
			}
			unloadRegions = loadRecorder.getUnloadPosi(limitTopPosi, limitBottomPosi, cache.rowRegionPosi);
			unloadCellRegions = loadRecorder.getUnloadPosi(limitTopPosi, limitBottomPosi, cache.cellRegionPosi.vertical);
			for (; i < unloadRegions.length; i++) {
				this.requestRegionData(unloadRegions[i].start, unloadRegions[i].end);
			}
			for (i = 0; i < unloadCellRegions.length; i++) {
				this.requestCellRegionData(unloadCellRegions[i].start, unloadCellRegions[i].end);
			}
		},
		requestRegionData: function(getTopPosi, getBottomPosi) {
			if (getBottomPosi < getTopPosi) {
				var temp = getTopPosi;
				getTopPosi = getBottomPosi;
				getBottomPosi = temp;
			}
			send.PackAjax({
				url: 'excel.htm?m=openexcel',
				async: false,
				isPublic: false,
				data: JSON.stringify({
					excelId: window.SPREADSHEET_AUTHENTIC_KEY,
					sheetId: '1',
					rowBegin: getTopPosi,
					rowEnd: getBottomPosi
				}),
				success: function(data) {
					if (data === '') {
						return;
					}
					var startRowSort;
					startRowSort = data.dataRowStartIndex;
					data = data.returndata;
					var rows = data.spreadSheet[0].sheet.glY;
					original.analysisRowData(rows, startRowSort);
				}
			});
			loadRecorder.insertPosi(getTopPosi, getBottomPosi, cache.rowRegionPosi);

			var width = headItemCols.getMaxDistanceWidth(),
				height = headItemRows.getMaxDistanceHeight();

			this.adjustContainerHeight(height);
			this.publish(height, 'adjustHeadItemContainerPublish');
			this.publish(height, 'adjustContainerHeightPublish');
		},
		requestCellRegionData: function(getTopPosi, getBottomPosi) {
			if (getBottomPosi < getTopPosi) {
				var temp = getTopPosi;
				getTopPosi = getBottomPosi;
				getBottomPosi = temp;
			}
			send.PackAjax({
				url: 'excel.htm?m=openexcel',
				async: false,
				isPublic: false,
				data: JSON.stringify({
					excelId: window.SPREADSHEET_AUTHENTIC_KEY,
					sheetId: '1',
					rowBegin: getTopPosi,
					rowEnd: getBottomPosi
				}),
				success: function(data) {
					if (data === '') {
						return;
					}
					data = data.returndata;
					var cells = data.spreadSheet[0].sheet.cells;
					original.analysisCellData(cells);
				}
			});
			loadRecorder.insertPosi(getTopPosi, getBottomPosi, cache.cellRegionPosi.vertical);
		},
		/**
		 * 显示行下方超出预加载区域，删除超出视图
		 * @method deleteBottom
		 */
		deleteBottom: function(currentDisplayViewTop) {
			var limitDistance,
				limitIndex,
				currentDistance,
				currentIndex,
				localViewIndex, //缓存数据：row最底部视图对应集合索引
				tempCells,
				headItemRowList,
				cellRowAliasArray,
				cellMinRowIndex,
				offsetTop,
				userViewTop,
				i, j, k;

			//冻结情况，计算视图的偏移量
			if (cache.TempProp.isFrozen === true) {
				offsetTop = this.currentRule.displayPosition.offsetTop;
				userViewTop = headItemRows.getModelByAlias(cache.UserView.rowAlias).get("top");
			} else {
				offsetTop = 0;
				userViewTop = 0;
			}

			headItemRowList = headItemRows.models;

			currentDistance = this.rowsViewBottomPosi + offsetTop + userViewTop;
			// currentDisplayViewTop + this.el.offsetHeight + config.System.prestrainHeight;
			currentIndex = binary.indexModelBinary(currentDistance, headItemRowList, 'top', 'height');
			limitDistance = this.el.scrollTop + this.el.offsetHeight + config.System.prestrainHeight + offsetTop + userViewTop;
			limitIndex = binary.indexModelBinary(limitDistance, headItemRowList, 'top', 'height');
			for (i = limitIndex + 1; i <= currentIndex; i++) {
				headItemRowList[i].destroyView();
			}
			//删除超过加载区域(视图区+预加载区)cell视图对象
			tempCells = cells.getCellsByRowIndex(limitIndex + 1, localViewIndex);
			for (j = 0; j < tempCells.length; j++) {
				//判断cell视图对象最上端区域是否仍在加载区域(视图区+预加载区)
				cellRowAliasArray = tempCells[j].get("occupy").y;
				//处理未从后台获取情况
				for (k = 0; k < cellRowAliasArray.length; k++) {
					cellMinRowIndex = headItemRows.getIndexByAlias(cellPositionArray[k]);
					if (cellMinRowIndex === null || cellMinRowIndex === undefined) {
						continue;
					}
					if (cellMinRowIndex > limitIndex) {
						tempCells[j].hide();
					}
					break;
				}
			}
			this.rowsViewBottomPosi = headItemRowList[limitIndex].get('top') + headItemRowList[limitIndex].get('height') - offsetTop - userViewTop;
			config.displayRowHeight = this.rowsViewBottomPosi;
			cache.visibleRegion.bottom = this.rowsViewBottomPosi;
		},

		/**
		 * 显示行下方到达加载区域，添加视图视图
		 * @method addBottom
		 */
		addBottom: function(recordViewTop, currentViewTop) {
			var limitTopPosi,
				limitBottomPosi,
				limitTopIndex,
				limitBottomIndex,
				getTopPosi,
				getBottomPosi,
				currentBottomPosi,
				currentBottomIndex,
				headItemRowList,
				headItemRowModel,
				gridLineRowModel,
				headItemRowContainer,
				gridLineRowContainer,
				offsetTop,
				userViewTop,
				tempCells;

			//冻结情况，计算视图的偏移量
			if (cache.TempProp.isFrozen === true) {
				offsetTop = this.currentRule.displayPosition.offsetTop;
				userViewTop = headItemRows.getModelByAlias(cache.UserView.rowAlias).get("top");
			} else {
				offsetTop = 0;
				userViewTop = 0;
			}
			this.loadRegionRows(offsetTop, userViewTop);
			this.addRows();
			this.adaptSelectRegion();
			headItemRowList = headItemRows.models;

			limitTopPosi = this.el.scrollTop - config.System.prestrainHeight + offsetTop + userViewTop;
			limitTopPosi = limitTopPosi < 0 ? 0 : limitTopPosi;

			limitBottomPosi = this.el.scrollTop + this.el.offsetHeight + config.System.prestrainHeight + offsetTop + userViewTop;

			limitTopIndex = binary.indexModelBinary(limitTopPosi, headItemRowList, 'top', 'height');
			limitBottomIndex = binary.indexModelBinary(limitBottomPosi, headItemRowList, 'top', 'height');

			currentBottomPosi = this.rowsViewBottomPosi + offsetTop + userViewTop;
			currentBottomIndex = binary.indexModelBinary(currentBottomPosi, headItemRowList, 'top', 'height');

			if (currentBottomIndex >= limitBottomIndex) {
				return;
			}
			currentBottomIndex = currentBottomIndex < limitTopIndex ? limitTopIndex : currentBottomIndex;
			for (i = currentBottomIndex + 1; i <= limitBottomIndex; i++) {
				headItemRowModel = headItemRowList[i];
				if (headItemRowModel.get('isView') === false) {
					headItemRowModel.set('isView', true);
					gridLineRowContainer = new GridLineRowContainer({
						model: headItemRowModel,
						frozenTop: this.currentRule.displayPosition.offsetTop
					});
					this.cellsContainer.gridLineContainer.rowsGridContainer.$el.append(gridLineRowContainer.render().el);
					this.addRowHeadItemViewPublish(headItemRowModel);
				}
			}
			tempCells = cells.getCellsByRowIndex(currentBottomIndex, limitBottomIndex);
			for (var i = 0; i < tempCells.length; i++) {
				if (tempCells[i] === undefined && tempCells[i] === null) {
					continue;
				}
				if (tempCells[i].get('showState') === false) {
					tempCells[i].set('showState', true);
					tempCells[i].set('physicsBox', this.recountCellPhysicsBox(tempCells[i]));

					var tempView = new CellContainer({
						model: tempCells[i],
						currentRule: this.currentRule
					});
					this.cellsContainer.contentCellsContainer.$el.prepend(tempView.render().el);
					this.addCellViewPublish(tempCells[i]);
				}
			}
			this.adjustColPropCell(currentBottomIndex, limitBottomIndex);
			this.rowsViewBottomPosi = headItemRowList[limitBottomIndex].get('top') + headItemRowList[limitBottomIndex].get('height') - offsetTop - userViewTop;
			config.displayRowHeight = this.rowsViewBottomPosi;
			cache.visibleRegion.bottom = this.rowsViewBottomPosi;
		},
		/**
		 * 在整行整列选中时，进行滚动操作，时时修改选中区域的宽高
		 * @return {[type]} [description]
		 */
		adaptSelectRegion: function() {
			var select = selectRegions.getModelByType("operation")[0],
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
		/**
		 * 动态加载cell对象，对于一次未加载完全cell对象，重新计算cell对象physicsBox属性
		 * @method recountCellPhysicsBox
		 * @param  {Object} cell 单元格对象
		 * @return {Object} 重新计算后的cell
		 */
		recountCellPhysicsBox: function(cell) {
			var i, j,
				left = 0,
				top = 0,
				width = 0,
				height = 0,
				aliasColArr,
				aliasRowArr;
			aliasRowArr = aliasColArr = [];

			aliasRowArr = cell.get('occupy').y;
			aliasColArr = cell.get('occupy').x;
			left = cell.get('physicsBox').left;
			width = cell.get('physicsBox').width;
			//由于只存在行动态加载，所有只处理Cell模型高度问题
			for (i = 0; i < aliasRowArr.length; i++) {
				if (headItemRows.getModelByAlias(aliasRowArr[i]) !== undefined) {
					top = headItemRows.getModelByAlias(aliasRowArr[i]).get('top');
					for (; i < aliasRowArr.length; i++) {
						if (headItemRows.getModelByAlias(aliasRowArr[i]) !== undefined) {
							height += headItemRows.getModelByAlias(aliasRowArr[i]).get('height') + 1;
						} else {
							break;
						}
					}
					break;
				}
			}
			return {
				top: top,
				left: left,
				height: height - 1,
				width: width
			};
		},
		/**
		 * 禁止鼠标拖动超出单元格区域，单元格区域移动
		 * @method preventAutoScroll
		 */
		preventAutoScroll: function() {
			var distanceLeft,
				distanceRight,
				distanceTop,
				distanceBottom,
				localRecordScrollTop,
				localRecordScrollLeft;
			if (this.isPreventScroll) {
				//for get this offsetleft value , because of this div in table . so this offsetleft equal 0 ,
				//then we get other method get it's offsetleft value
				//code example : this.viewBodyContainer.el.innerWidth - this.el.offsetWidth

				distanceLeft = this.viewBodyContainer.mousePageX - (this.viewBodyContainer.el.offsetWidth - this.el.offsetWidth);
				distanceTop = this.viewBodyContainer.mousePageY - (this.viewBodyContainer.el.offsetHeight - this.el.offsetHeight - config.System.outerBottom);
				distanceBottom = distanceTop - this.el.clientHeight;
				distanceRight = distanceLeft - this.el.clientWidth;

				if (distanceRight >= 0 || distanceLeft <= 0) {
					this.el.scrollLeft = this.recordScrollLeft;
				} else {
					this.recordScrollLeft = this.el.scrollLeft;
					this.publish(this.recordScrollLeft, 'transversePublish');
				}

				if (distanceBottom >= 0 || distanceTop <= 0) {
					this.el.scrollTop = this.recordScrollTop;
				} else {
					this.recordScrollTop = this.el.scrollTop;
					this.publish(this.recordScrollTop, 'verticalPublish');
				}
			}
			//did'nt prevent scoll and ensure it's main area ,
			if (!this.isPreventScroll && this.currentRule.eventScroll) {
				if (this.recordScrollLeft !== this.el.scrollLeft) {
					this.recordScrollLeft = this.el.scrollLeft;
					this.publish(this.recordScrollLeft, 'transversePublish');
				}
				if (this.recordScrollTop !== this.el.scrollTop) {
					this.recordScrollTop = this.el.scrollTop;
					this.publish(this.recordScrollTop, 'verticalPublish');
				}
			}
			this.isPreventScroll = true;
		},
		/**
		 * 动态加载，添加列
		 * @method addCol
		 */
		addCol: function() {
			var len, colValue, i = 0;

			len = config.User.addCol;
			colValue = headItemCols.length;
			while (i < len) {
				headItemCols.add({
					alias: (colValue + 1).toString(),
					left: colValue * config.User.cellWidth,
					width: config.User.cellWidth - 1,
					displayName: buildAlias.buildColAlias(colValue)
				});
				colValue++;
				i++;
			}
			this.cellsContainer.attributesRender({
				width: headItemCols.getMaxDistanceWidth(),
				height: headItemRows.getMaxDistanceHeight()
			});
			this.viewColsAllHeadContainer.$el.css({
				width: headItemCols.getMaxDistanceWidth()
			});
		},
		addRows: function() {
			var currentBottomPosi,
				limitBottomPosi,
				localBottomPosi,
				headLineList,
				headLineLast,
				lastModelTop,
				lastModelHeight,
				diffDistancePixel,
				startPosi,
				endPosi,
				rowLen,
				offsetTop,
				userViewTop,
				sort,
				width,
				height,
				len, i = 0;
			//冻结情况，计算视图的偏移量
			if (cache.TempProp.isFrozen === true) {
				offsetTop = this.currentRule.displayPosition.offsetTop;
				userViewTop = headItemRows.getModelByAlias(cache.UserView.rowAlias).get('top');
			} else {
				offsetTop = 0;
				userViewTop = 0;
			}

			headLineList = headItemRows.models;
			rowLen = headLineList.length;
			headLineLast = headLineList[rowLen - 1];
			lastModelTop = headLineLast.get('top');
			lastModelHeight = headLineLast.get('height');
			sort = headLineLast.get('sort');
			if (sort + 2 > config.User.maxRowNum) {
				return;
			}
			// get last model top + height , that is the bottom position
			currentBottomPosi = lastModelHeight + lastModelTop;

			if (currentBottomPosi < cache.localRowPosi) {
				return;
			}
			limitBottomPosi = this.el.scrollTop + this.el.offsetHeight + config.System.prestrainHeight + offsetTop + userViewTop;
			diffDistancePixel = limitBottomPosi - currentBottomPosi;

			if (diffDistancePixel > 0) {
				len = Math.ceil(diffDistancePixel / config.User.cellHeight);
				startPosi = lastModelTop + lastModelHeight + 1;
				while (i < len) {
					if (sort + i + 2 > config.User.maxRowNum) {
						break;
					}
					headItemRows.add({
						sort: (sort + 1 + i),
						alias: (sort + 2 + i).toString(),
						top: lastModelTop + lastModelHeight + config.User.cellHeight * i + 1,
						height: config.User.cellHeight - 1,
						displayName: buildAlias.buildRowAlias(sort + i + 1)
					});
					i++;
				}

				endPosi = lastModelTop + lastModelHeight + config.User.cellHeight * i;
			} else {
				return;
			}
			send.PackAjax({
				url: 'sheet.htm?m=addrowline',
				data: JSON.stringify({
					rowNum: len
				})
			});
			this.adjustColPropCell(rowLen, rowLen + len - 1);
			loadRecorder.insertPosi(startPosi, endPosi, cache.rowRegionPosi);
			width = headItemCols.getMaxDistanceWidth();
			height = headItemRows.getMaxDistanceHeight();
			this.adjustContainerHeight(height);
			this.publish(height, 'adjustHeadItemContainerPublish');
			this.publish(height, 'adjustContainerHeightPublish');

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
				cellModel,
				occupyCol,
				colProp,
				cellProp,
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
			this.cellsContainer.attributesRender({
				height: height
			});
		},
		/**
		 * 视图销毁
		 * @method destroy
		 */
		destroy: function() {
			Backbone.off('call:mainContainer');
			Backbone.off('event:mainContainer:destroy');
			Backbone.off('event:mainContainer:attributesRender');
			this.cellsContainer.destroy();
			this.remove();
		}
	});
	return MainContainer;
});