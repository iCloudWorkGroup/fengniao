define(function(require) {
	'use strict';
	var $ = require('lib/jquery'),
		config = require('spreadsheet/config'),
		binary = require('basic/util/binary'),
		cache = require('basic/tools/cache'),
		send = require('basic/tools/send'),
		loadRecorder = require('basic/tools/loadrecorder'),
		getDisplayName = require('basic/tools/getdisplayname'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		siderLineCols = require('collections/siderLineCol'),
		siderLineRows = require('collections/siderLineRow'),
		selectRegions = require('collections/selectRegion'),
		sheets = require('collections/sheets'),
		cells = require('collections/cells'),
		headItemColList = headItemCols.models,
		headItemRowList = headItemRows.models;

	/**
	 * 后台数据还原类
	 * 系统配置变量
	 * @author caijl
	 * @module basic
	 * @since 0.1.0
	 */
	return {
		/**
		 * 创建新Excel表单
		 * @method bulidNewExcel
		 */
		bulidNewExcel: function() {
			var i,
				j,
				lenCol,
				lenRow,
				currentObject;
			lenCol = config.User.initColNum;
			lenRow = config.User.initRowNum;

			for (i = 0; i < lenCol; i++) {
				currentObject = {
					sort: i,
					alias: (i + 1).toString(),
					left: i * config.User.cellWidth,
					width: config.User.cellWidth - 1,
					displayName: getDisplayName.getColDisplayName(i)
				};
				headItemCols.add(currentObject);
			}
			for (j = 0; j < lenRow; j++) {
				currentObject = {
					sort: j,
					alias: (j + 1).toString(),
					top: j * config.User.cellHeight,
					height: config.User.cellHeight - 1,
					displayName: getDisplayName.getRowDisplayName(j)
				};
				headItemRows.add(currentObject);
			}
			this.restoreSelectRegion();
		},
		/**
		 * 解析后台返回行索引数据，如果行数未满足加载区域，则生成新行，进行补充
		 * @method analysisRowData
		 * @param  {Array} rows 行数据数组
		 */
		analysisRowData: function(rows, startRowSort) {
			var tempHeadRow,
				index, //插入Rows中的索引值
				i;
			for (i = 0; i < rows.length; i++) {
				index = binary.indexModelBinary(rows[i].top, headItemRows.models, 'top', 'height');
				//待修改：判定是否已存在加载类，应使用二分查询进行判定
				if (headItemRows.getIndexByAlias(rows[i].aliasY) !== -1) {
					index++;
					continue;
				}
				tempHeadRow = {
					sort: startRowSort + i,
					top: rows[i].top,
					height: rows[i].height,
					alias: rows[i].aliasY,
					operProp: rows[i].operProp,
					displayName: getDisplayName.getRowDisplayName(startRowSort + i)
				};
				headItemRows.push(tempHeadRow, {
					at: index
				});
			}

		},
		/**
		 * 解析后台返回列索引数据，如果列数未满足加载区域，则生成新列，进行补充
		 * @method analysisColData
		 * @param  {Array} cols 列数据数组
		 */
		analysisColData: function(cols, startColSort) {

			//隐藏列还原
			var tempHeadCol, i, j, len, collen;
			for (i = 0; i < cols.length; i++) {
				//待修改：判定是否已存在加载类，应使用二分查询进行判定
				if (headItemCols.getIndexByAlias(cols[i].aliasY) !== -1) {
					continue;
				}
				tempHeadCol = {
					sort: startColSort + i,
					left: cols[i].left,
					width: cols[i].width,
					alias: cols[i].aliasX,
					hidden: cols[i].hidden,
					originalWidth: cols[i].originWidth,
					operProp: {}
				};
				if (!isEmptyObject(cols[i].operProp.content)) {
					tempHeadCol.operProp.content = cols[i].operProp.content;
				}
				if (!isEmptyObject(cols[i].operProp.customProp)) {
					tempHeadCol.operProp.customProp = cols[i].operProp.customProp;
				}
				if (!isEmptyObject(cols[i].operProp.border)) {
					tempHeadCol.operProp.border = cols[i].operProp.border;
				}
				tempHeadCol.displayName = getDisplayName.getColDisplayName(startColSort + i);
				if (cols[i].hidden && i > 0) {
					headItemCols.models[i - 1].set('isRightAjacentHide', true);
				}
				if (i > 0 && cols[i - 1].hidden) {
					tempHeadCol.isLeftAjacentHide = true;
				}
				headItemCols.add(tempHeadCol);
			}


			if (headItemCols.length < config.User.initColNum) {
				len = config.User.initColNum - headItemCols.length;
				collen = headItemCols.length;
				for (j = 0; j < len; j++) {
					tempHeadCol = {
						sort: collen + j,
						left: headItemCols.models[collen + j - 1].get('left') + headItemCols.models[collen + j - 1].get('width') + 1,
						width: config.User.cellWidth,
						alias: (headItemCols.length + 1).toString(),
						displayName: getDisplayName.getColDisplayName(collen + j),
					};
					headItemCols.add(tempHeadCol);
				}
			}

			function isEmptyObject(obj) {
				var prop;
				for (prop in obj) {
					return false;
				}
				return true;
			}
		},
		/**
		 * @method 解析cell模型数据
		 * @param  {Array} cellsData cell模型数组数据
		 */
		analysisCellData: function(cellsData) {
			var j, k, //循环变量
				tempCell = null,
				limitRowIndex = headItemRows.length - 1,
				cellAttributes, //cell模型属性 
				physicsBox = {},
				gridAliasColList, //cell列索引list
				gridAliasRowList, //cell行索引list
				cellStartRowIndex, //cell起始row索引
				cellStartColIndex, //cell起始col索引
				cellEndRowIndex, //cell结束row索引
				cellEndColIndex, //cell结束row索引
				cellsPositionX = cache.CellsPosition.strandX,
				colSort, rowSort,
				width = 0,
				height = 0,
				i,
				model; //gridrow加载数量


			//解析cell
			for (i = 0; i < cellsData.length; i++) {
				cellAttributes = cellsData[i];
				if (cellAttributes === null) {
					continue;
				}

				gridAliasColList = cellAttributes.occupy.x;
				gridAliasRowList = cellAttributes.occupy.y;
				colSort = cellAttributes.occupy.col;
				rowSort = cellAttributes.occupy.row;
				delete cellAttributes.occupy.col;
				delete cellAttributes.occupy.row;

				cellStartRowIndex = binary.indexAttrBinary(rowSort, headItemRowList, 'sort');
				cellEndRowIndex = cellStartRowIndex + gridAliasRowList.length - 1;
				if (cellEndRowIndex > limitRowIndex) {
					cellEndRowIndex = limitRowIndex;
				}
				if (cellStartRowIndex === -1) {
					continue;
				}
				cellStartColIndex = binary.indexAttrBinary(colSort, headItemColList, 'sort');
				cellEndColIndex = cellStartColIndex + gridAliasColList.length - 1;

				//判断cell模型是否已加载
				if (cellsPositionX[gridAliasColList[0]] &&
					cellsPositionX[gridAliasColList[0]][gridAliasRowList[0]] !== undefined) {
					tempCell = cells.models[cellsPositionX[gridAliasColList[0]][gridAliasRowList[0]]];
				}

				//计算cell模型宽高
				for (j = cellStartColIndex; j < cellEndColIndex + 1; j++) {
					model = headItemColList[j];
					if (!model.get('hidden')) {
						width += model.get('width') + 1;
					}
				}
				for (j = cellStartRowIndex; j < cellEndRowIndex + 1; j++) {
					model = headItemRowList[j];
					height += model.get('height') + 1;
				}
				physicsBox = {
					top: headItemRowList[cellStartRowIndex].get('top'),
					left: headItemColList[cellStartColIndex].get('left'),
					width: width - 1,
					height: height - 1
				};
				if (tempCell !== null) {
					//重新渲染cell模型宽高
					tempCell.set('physicsBox', physicsBox);
				} else {
					cellAttributes.physicsBox = physicsBox;
					cells.add(cellAttributes);
					//维护postion
					for (j = 0; j < gridAliasColList.length; j++) {
						for (k = 0; k < gridAliasRowList.length; k++) {
							cache.cachePosition(gridAliasRowList[k], gridAliasColList[j], cells.length - 1);
						}
					}
				}
				tempCell = null;
				width = 0;
				height = 0;
			}
		},
		analysisSheetData: function(sheetsData) {
			var i;
			for (i = 0; i < sheetsData.length; i++) {
				sheets.add({
					name: sheetsData[i],
					sort: i
				});
			}
		},
		/**
		 * 还原选中区域
		 * @method restoreSelectRegion
		 * @param  {Array} cellsData cell模型数组数据
		 */
		restoreSelectRegion: function() {
			var headItemRowModel,
				headItemColModel,
				rowAlias,
				colAlias,
				colIndex,
				endRowAlias,
				endColAlias,
				endColIndex,
				endRowIndex,
				startColIndex,
				startRowIndex,
				cellsPositionX,
				cell,
				len, i,
				selectRegionModel;

			rowAlias = cache.UserView.rowAlias;
			colAlias = cache.UserView.colAlias;

			headItemRowModel = headItemRows.getModelByAlias(rowAlias);
			colIndex = headItemCols.getIndexByAlias(colAlias);


			headItemColModel = headItemCols.models[colIndex];

			len = headItemCols.length;
			for (i = colIndex; i < len; i++) {
				if (headItemColModel.get('hidden')) {
					headItemColModel = headItemCols.models[++colIndex];
					colAlias = headItemColModel.get('alias');
				} else {
					break;
				}
			}

			cellsPositionX = cache.CellsPosition.strandX;

			if (cellsPositionX[colAlias] !== undefined &&
				cellsPositionX[colAlias][rowAlias] !== undefined) {
				cell = cells.models[cellsPositionX[colAlias][rowAlias]];
			}
			if (cell !== undefined) {
				endRowAlias = cell.get('occupy').y;
				endRowAlias = endRowAlias[endRowAlias.length - 1];
				endColAlias = cell.get('occupy').x;
				endColAlias = endColAlias[endColAlias.length - 1];

				endColIndex = headItemCols.getIndexByAlias(endColAlias);
				endRowIndex = headItemRows.getIndexByAlias(endRowAlias);
				startColIndex = headItemCols.getIndexByAlias(colAlias);
				startRowIndex = headItemRows.getIndexByAlias(rowAlias);

				selectRegionModel = {
					physicsBox: {
						top: cell.get('physicsBox').top,
						left: cell.get('physicsBox').left,
						width: cell.get('physicsBox').width,
						height: cell.get('physicsBox').height
					},
					wholePosi: {
						startX: colAlias,
						startY: rowAlias,
						endX: endColAlias,
						endY: endRowAlias
					}
				};
				selectRegions.add(selectRegionModel);
				siderLineCols.add({
					left: cell.get('physicsBox').left,
					width: cell.get('physicsBox').width
				});
				siderLineRows.add({
					top: cell.get('physicsBox').top,
					height: cell.get('physicsBox').height
				});


				len = headItemRows.length;

				for (i = 0; i < len; i++) {
					headItemRows.models[i].set({
						activeState: false
					});
				}

				len = headItemCols.length;
				for (i = 0; i < len; i++) {
					headItemCols.models[i].set({
						activeState: false
					});
				}
				for (i = 0; i < endColIndex - startColIndex + 1; i++) {
					headItemCols.models[startColIndex + i].set({
						activeState: true
					});
				}
				for (i = 0; i < endRowIndex - startRowIndex + 1; i++) {
					headItemRows.models[startRowIndex + i].set({
						activeState: true
					});
				}
			} else {
				selectRegionModel = {
					physicsBox: {
						width: headItemColModel.get('width'),
						height: headItemRowModel.get('height'),
						top: headItemRowModel.get('top'),
						left: headItemColModel.get('left')
					},
					wholePosi: {
						startX: colAlias,
						startY: rowAlias,
						endX: colAlias,
						endY: rowAlias
					}
				};
				selectRegions.add(selectRegionModel);
				siderLineCols.add({
					left: headItemColModel.get('left'),
					width: headItemColModel.get('width')
				});
				siderLineRows.add({
					top: headItemRowModel.get('top'),
					height: headItemRowModel.get('height')
				});
			}

		},

		/**
		 * 从后台发送请求，得到excel数据，进行重新加载
		 * @method  
		 */
		restoreExcel: function(domId) {
			var build = window.SPREADSHEET_BUILD_STATE,
				startRowSort,
				startColSort,
				sheetNames = [],
				self = this;

			if (build === 'true' || build === undefined) {
				this.bulidNewExcel();
				cache.localRowPosi = 0;
				return;
			}

			//containerHeight,通知后台,加载高度
			send.PackAjax({
				url: config.url.table.reload,
				async: false,
				isPublic: false,
				data: JSON.stringify({
					top: 0,
					bottom: $('#' + domId).height() + config.System.prestrainHeight
				}),
				dataType: 'json',
				success: function() {
					fillData.apply(this, arguments);
				}
			});

			function fillData(data) {
				var sheetData,
					headItemColList,
					headItemRowList,
					colLen,
					rowLen;

				if (!data) {
					return;
				}

				if (!data.returndata) {
					return;
				}
				cache.UserView.rowAlias = data.displayRowStartAlias;
				cache.UserView.colAlias = data.displayColStartAlias;
				cache.protectState = data.protect;
				startRowSort = data.dataRowStartIndex;
				startColSort = data.dataColStartIndex;

				cache.localRowPosi = data.maxPixel;

				cache.aliasRowCounter = data.aliasRowCounter;
				cache.aliasColCounter = data.aliasColCounter;

				data = data.returndata;

				if (data.spreadSheet && data.spreadSheet[0] &&
					(sheetData = data.spreadSheet[0].sheet)) {

					sheetNames.push(data.spreadSheet[0].name);
					var cellModels = sheetData.cells;
					var rows = sheetData.glY;
					var cols = sheetData.glX;

					self.analysisSheetData(sheetNames);
					self.analysisRowData(rows, startRowSort);
					self.analysisColData(cols, startColSort);
					self.analysisCellData(cellModels);
					self.restoreSelectRegion();

					headItemColList = headItemCols.models;
					headItemRowList = headItemRows.models;

					cache.TempProp.colAlias = headItemColList[0].get('alias');
					cache.TempProp.rowAlias = headItemRowList[0].get('alias');
					colLen = headItemCols.length;
					rowLen = headItemRows.length;

					loadRecorder.insertPosi(headItemRowList[0].get('top'),
						headItemRowList[rowLen - 1].get('top') + headItemRowList[rowLen - 1].get('height'),
						cache.rowRegionPosi);
					loadRecorder.insertPosi(headItemRowList[0].get('top'),
						headItemRowList[rowLen - 1].get('top') + headItemRowList[rowLen - 1].get('height'),
						cache.cellRegionPosi.vertical);
				}
			}
		}
	};
});