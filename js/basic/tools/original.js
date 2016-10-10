define(function(require) {
  	'use strict';
	var $ = require('lib/jquery'),
		config = require('spreadsheet/config'),
		binary = require('basic/util/binary'),
		cache = require('basic/tools/cache'),
		send = require('basic/tools/send'),
		loadRecorder = require('basic/tools/loadrecorder'),
		buildAlias = require('basic/tools/buildalias'),
		LineRow = require('models/lineRow'),
		LineCol = require('models/lineCol'),
		Cell = require('models/cell'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		siderLineCols = require('collections/siderLineCol'),
		siderLineRows = require('collections/siderLineRow'),
		selectRegions = require('collections/selectRegion'),
		sheets = require('collections/sheets'),
		cells = require('collections/cells');

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
					displayName: buildAlias.buildColAlias(i)
				};
				headItemCols.add(currentObject);
			}
			for (j = 0; j < lenRow; j++) {
				currentObject = {
					sort: j,
					alias: (j + 1).toString(),
					top: j * config.User.cellHeight,
					height: config.User.cellHeight - 1,
					displayName: buildAlias.buildRowAlias(j)
				};
				headItemRows.add(currentObject);
			}
			this.restoreSelectRegion();
			loadRecorder.insertPosi(0, headItemRows.models[lenRow - 1].height + headItemRows.models[lenRow - 1].top, cache.rowRegionPosi);
			loadRecorder.insertPosi(0, headItemRows.models[lenRow - 1].height + headItemRows.models[lenRow - 1].top, cache.cellRegionPosi.vertical);
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
				tempHeadRow = new LineRow();
				tempHeadRow.set('sort', startRowSort + i);
				tempHeadRow.set('top', rows[i].top);
				tempHeadRow.set('height', rows[i].height);
				tempHeadRow.set('alias', rows[i].aliasY);
				tempHeadRow.set('operProp', rows[i].operProp);
				tempHeadRow.set('displayName', buildAlias.buildRowAlias(startRowSort + i));
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
				tempHeadCol = new LineCol();
				tempHeadCol.set('sort', startColSort + i);
				tempHeadCol.set('left', cols[i].left);
				tempHeadCol.set('width', cols[i].width);
				tempHeadCol.set('alias', cols[i].aliasX);
				tempHeadCol.set('hidden', cols[i].hidden);
				tempHeadCol.set('originalWidth', cols[i].originWidth);
				if (!isEmptyObject(cols[i].operProp.content)) {
					tempHeadCol.set('operProp.content', cols[i].operProp.content);
				}
				if (!isEmptyObject(cols[i].operProp.customProp)) {
					tempHeadCol.set('operProp.customProp', cols[i].operProp.customProp);
				}
				if (!isEmptyObject(cols[i].operProp.border)) {
					tempHeadCol.set('operProp.border', cols[i].operProp.border);
				}
				tempHeadCol.set('displayName', buildAlias.buildColAlias(startColSort + i));
				if (cols[i].hidden && i > 0) {
					headItemCols.models[i - 1].set('isRightAjacentHide', true);
				}
				if (i > 0 && cols[i - 1].hidden) {
					tempHeadCol.set('isLeftAjacentHide', true);
				}
				headItemCols.add(tempHeadCol);
			}


			if (headItemCols.length < config.User.initColNum) {
				len = config.User.initColNum - headItemCols.length;
				collen = headItemCols.length;
				for (j = 0; j < len; j++) {
					tempHeadCol = new LineCol();
					tempHeadCol.set('sort', collen + j);
					tempHeadCol.set('left', headItemCols.models[collen + j - 1].get('left') + headItemCols.models[collen + j - 1].get('width') + 1);
					tempHeadCol.set('width', 71);
					tempHeadCol.set('alias', (headItemCols.length + 1).toString());
					tempHeadCol.set('displayName', buildAlias.buildColAlias(collen + j));
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
				tempCell,
				existCell, //已存在单元格
				gridLineColList,
				gridLineRowList,
				cellAttributes, //cell模型属性 
				physicsBox = {},
				gridAliasColList, //cell列索引list
				gridAliasRowList, //cell行索引list
				cellStartRowIndex, //cell起始row索引
				cellStartColIndex, //cell起始col索引
				cellEndRowIndex, //cell结束row索引
				cellEndColIndex, //cell结束row索引
				cellsPositionX,
				width,
				height,
				i,
				model; //gridrow加载数量

			gridLineColList = headItemCols.models;
			gridLineRowList = headItemRows.models;


			//解析cell
			for (i = 0; i < cellsData.length; i++) {
				cellAttributes = cellsData[i];
				if (cellAttributes === null) {
					continue;
				}

				gridAliasColList = cellAttributes.occupy.x;
				gridAliasRowList = cellAttributes.occupy.y;
				width = 0;
				height = 0;
				//获取已加载行模型内，cell起始索引，结束索引
				for (j = 0; j < gridAliasRowList.length; j++) {
					if (headItemRows.getIndexByAlias(gridAliasRowList[j]) !== -1) {
						cellStartRowIndex = headItemRows.getIndexByAlias(gridAliasRowList[j]);
						break;
					}
				}
				for (j = gridAliasRowList.length - 1; j > -1; j--) {
					if (headItemRows.getIndexByAlias(gridAliasRowList[j]) !== -1) {
						cellEndRowIndex = headItemRows.getIndexByAlias(gridAliasRowList[j]);
						break;
					}
				}
				if (cellStartRowIndex === -1 || cellEndRowIndex === -1) {
					continue;
				}
				//列模型未涉及动态加载功能，直接使用cell模型列索引
				cellStartColIndex = headItemCols.getIndexByAlias(gridAliasColList[0]);
				cellEndColIndex = headItemCols.getIndexByAlias(gridAliasColList[gridAliasColList.length - 1]);

				//判断cell模型是否已加载
				cellsPositionX = cache.CellsPosition.strandX;
				if (cellsPositionX[gridAliasColList[0]] !== undefined &&
					cellsPositionX[gridAliasColList[0]][gridAliasRowList[0]] !== undefined) {
					existCell = cells.models[cellsPositionX[gridAliasColList[0]][gridAliasRowList[0]]];
				}

				//计算cell模型宽高
				for (j = cellStartColIndex; j < cellEndColIndex + 1; j++) {
					model = gridLineColList[j];
					if(!model.get('hidden')){
						width += model.get('width') + 1;
					}
				}
				for (j = cellStartRowIndex; j < cellEndRowIndex + 1; j++) {
					model = gridLineRowList[j];
					height += model.get('height') + 1;
				}
				physicsBox = {
					top: gridLineRowList[cellStartRowIndex].get('top'),
					left: gridLineColList[cellStartColIndex].get('left'),
					width: width - 1,
					height: height - 1
				};
				if (existCell !== null && existCell !== undefined) {
					//重新渲染cell模型宽高
					existCell.set('physicsBox', physicsBox);
				} else {
					tempCell = new Cell(cellAttributes);
					tempCell.set('physicsBox', physicsBox);
					cells.add(tempCell);
					//维护postion
					for (j = 0; j < gridAliasColList.length; j++) {
						for (k = 0; k < gridAliasRowList.length; k++) {
							cache.cachePosition(gridAliasRowList[k], gridAliasColList[j], cells.length - 1);
						}
					}
				}
				existCell = null;
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
					physicsPosi: {
						top: cell.get('physicsBox').top,
						left: cell.get('physicsBox').left
					},
					physicsBox: {
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
					physicsPosi: {
						top: headItemRowModel.get('top'),
						left: headItemColModel.get('left')
					},
					physicsBox: {
						width: headItemColModel.get('width'),
						height: headItemRowModel.get('height')
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
				self = this,
				i;
			if (build === 'true' || build === undefined) {
				this.bulidNewExcel();
				cache.localRowPosi = 0;
				return;
			}

			//containerHeight,通知后台,加载高度
			send.PackAjax({
				//ps:修改id
				url: 'excel.htm?m=position',
				async: false,
				isPublic: false,
				data: JSON.stringify({
					containerHeight: $('#' + domId).height()
				}),
				dataType: 'json',
				success: function(data) {
					if (data === '') {
						return;
					}
					cache.UserView.rowAlias = data.displayRowStartAlias;
					cache.UserView.colAlias = data.displayColStartAlias;

					if (data.returndata.spreadSheet[0].sheet.frozen.state === '1') {
						cache.TempProp = {
							isFrozen: true,
							colAlias: data.returndata.spreadSheet[0].sheet.frozen.colIndex,
							rowAlias: data.returndata.spreadSheet[0].sheet.frozen.rowIndex,
							rowFrozen: true,
							colFrozen: true
						};
					}
					for (i = 0; i < data.returndata.spreadSheet.length; i++) {
						sheetNames.push(data.returndata.spreadSheet[i].name);
					}
					cache.localRowPosi = data.maxPixel;
					startRowSort = data.dataRowStartIndex;
					startColSort = data.dataColStartIndex;
					data = data.returndata;
					var cellModels = data.spreadSheet[0].sheet.cells;
					var rows = data.spreadSheet[0].sheet.glY;
					var cols = data.spreadSheet[0].sheet.glX;
					self.analysisSheetData(sheetNames);
					self.analysisRowData(rows, startRowSort);
					self.analysisColData(cols, startColSort);
					self.analysisCellData(cellModels);
					self.restoreSelectRegion();
				}
			});
			loadRecorder.insertPosi(headItemRows.models[0].get('top'), headItemRows.models[headItemRows.length - 1].get('top') + headItemRows.models[headItemRows.length - 1].get('height'), cache.rowRegionPosi);
			loadRecorder.insertPosi(headItemRows.models[0].get('top'), headItemRows.models[headItemRows.length - 1].get('top') + headItemRows.models[headItemRows.length - 1].get('height'), cache.cellRegionPosi.vertical);
		}
	};
});
