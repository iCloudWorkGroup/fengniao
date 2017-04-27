'use strict';
define(function(require) {
	var cache = require('basic/tools/cache'),
		addColhandle = require('entrance/tool/addcol'),
		deleteColhandle = require('entrance/tool/deletecol'),
		headItemRows = require('collections/headItemRow'),
		headItemCols = require('collections/headItemCol'),
		selectRegions = require('collections/selectRegion'),
		siderLineCols = require('collections/siderLineCol'),
		siderLineRows = require('collections/siderLineCol'),
		buildAlias = require('basic/tools/buildalias'),
		cells = require('collections/cells'),
		build;
	// build = require('test/unit/build.js');

	describe("删除列功能测试", function() {
		beforeEach(function() {
			build.buildCol();
			siderLineCols.add({
				left: 0,
				width: 72
			});
		});
		it("调整列集合测试", function() {
			var fristModel,
				lastModel;

			deleteColhandle._adaptHeadColItem(5);

			fristModel = headItemCols.models[0];
			lastModel = headItemCols.models[8];

			expect(fristModel.get('sort')).toEqual(0);
			expect(fristModel.get('left')).toEqual(0);
			expect(fristModel.get('displayName')).toEqual('A');

			expect(lastModel.get('sort')).toEqual(8);
			expect(lastModel.get('left')).toEqual(576);
			expect(lastModel.get('displayName')).toEqual('I');

		});
		it("调整选中区域测试", function() {
			var select;

			selectRegions.add({
				physicsBox: {
					top: 40,
					left: 72,
				},
				physicsBox: {
					width: 288,
					height: 76
				},
				wholePosi: {
					startX: '2',
					startY: '3',
					endX: '5',
					endY: '6'
				}
			});
			select = selectRegions.getModelByType('operation');

			deleteColhandle._adaptSelectRegion(9);
			expect(select.get('physicsBox').left).toEqual(72);
			expect(select.get('physicsBox').width).toEqual(288);
			expect(select.get('wholePosi').startX).toEqual('2');
			expect(select.get('wholePosi').startY).toEqual('3');
			expect(select.get('wholePosi').endX).toEqual('5');
			expect(select.get('wholePosi').endY).toEqual('6');


			deleteColhandle._adaptSelectRegion(3);
			expect(select.get('physicsBox').left).toEqual(72);
			expect(select.get('physicsBox').width).toEqual(216);
			expect(select.get('wholePosi').startX).toEqual('2');
			expect(select.get('wholePosi').endX).toEqual('5');

			select.set('wholePosi.endX', '2');
			select.set('physicsBox.width', 72);
			select.set('physicsBox.left', 72);
			deleteColhandle._adaptSelectRegion(1);

			expect(select.get('physicsBox').left).toEqual(72);
			expect(select.get('physicsBox').width).toEqual(71);
			expect(select.get('wholePosi').startX).toEqual('3');
			expect(select.get('wholePosi').endX).toEqual('3');

			deleteColhandle._adaptSelectRegion(0);

			expect(select.get('physicsBox').left).toEqual(0);
			expect(select.get('physicsBox').width).toEqual(71);
			expect(select.get('wholePosi').startX).toEqual('3');
			expect(select.get('wholePosi').endX).toEqual('3');

		});

		it("调选单元格测试", function() {
			var cell1,
				cell2,
				cell3;

			cells.add({
				physicsBox: {
					left: -1,
					width: 71
				},
				occupy: {
					x: ['1'],
					y: ['2']
				},
			});
			cells.add({
				physicsBox: {
					left: 71,
					width: 215,
				},
				occupy: {
					x: ['2', '3', '4'],
					y: ['2']
				},
			});
			cells.add({
				physicsBox: {
					left: 143,
					width: 71
				},
				occupy: {
					x: ['3'],
					y: ['5']
				},
			});
			cache.cachePosition('2', '1', 0);
			cache.cachePosition('2', '2', 1);
			cache.cachePosition('2', '3', 1);
			cache.cachePosition('2', '4', 1);
			cache.cachePosition('5', '3', 2);

			deleteColhandle._adaptCells(2);

			cell1 = cells.models[0];
			cell2 = cells.models[1];
			cell3 = cells.models[2];

			expect(cell3.get('isDestroy')).toEqual(true);
			expect(cell2.get('physicsBox').left).toEqual(71);
			expect(cell2.get('physicsBox').width).toEqual(143);
			expect(cell2.get('occupy').x).toEqual(['2', '4']);
			expect(cell1.get('physicsBox').left).toEqual(-1);
			expect(cell1.get('physicsBox').width).toEqual(71);

		});
		it("插入行接口测试", function() {
			cache.TempProp = {
				isFrozen: true,
				colAlias: '3',
				rowAlias: '3',
				rowFrozen: true,
				colFrozen: true
			};
			selectRegions.add({
				physicsBox: {
					top: 40,
					left: 72,
				},
				physicsBox: {
					width: 68,
					height: 76
				},
				wholePosi: {
					startX: '2',
					startY: '3',
					endX: '2',
					endY: '6'
				}
			});
			deleteColhandle.deleteCol('1', 'C');
			expect(cache.TempProp.colAlias).toEqual('4');
			deleteColhandle.deleteCol('1', 'A');
			expect(cache.UserView.colAlias).toEqual('2');
		});
		afterEach(function() {
			build.destroyRow();
			build.destroyCol();

			selectRegions.reset();
			cells.reset();
			cache.UserView = {
				colAlias: '1',
				rowAlias: '1',
				colEndAlias: '1',
				rowEndAlias: '1'
			};
			cache.aliasColCounter = '26';
			cache.CellsPosition.strandX = {};
			cache.CellsPosition.strandY = {};
		});
	});
	describe("插入行功能测试", function() {
		beforeEach(function() {
			build.buildCol();
			siderLineCols.add({
				left: 0,
				width: 72
			});
		});
		it("调整行集合测试", function() {
			var insertModel,
				nextModel,
				lastModel;

			nextModel = headItemCols.models[5];
			addColhandle._adaptHeadColItem(5);

			insertModel = headItemCols.models[5];
			lastModel = headItemCols.models[headItemCols.length - 1];


			expect(insertModel.get('alias')).toEqual('27');
			expect(insertModel.get('sort')).toEqual(5);
			expect(insertModel.get('left')).toEqual(360);
			expect(insertModel.get('displayName')).toEqual('F');

			expect(nextModel.get('sort')).toEqual(6);
			expect(nextModel.get('left')).toEqual(432);
			expect(nextModel.get('displayName')).toEqual('G');

			expect(lastModel.get('sort')).toEqual(10);
			expect(lastModel.get('left')).toEqual(720);
			expect(lastModel.get('displayName')).toEqual('K');

		});
		it("调整选中区域测试", function() {
			var select;
			selectRegions.add({
				physicsBox: {
					left: 72,
				},
				physicsBox: {
					width: 68,
				},
				wholePosi: {
					startX: '2',
					endX: '2',
				}
			});
			select = selectRegions.getModelByType('operation');

			addColhandle._adaptSelectRegion(5);
			expect(select.get('physicsBox').left).toEqual(72);
			expect(select.get('physicsBox').width).toEqual(68);
			expect(select.get('wholePosi').startX).toEqual('2');
			expect(select.get('wholePosi').endX).toEqual('2');

			addColhandle._adaptSelectRegion(1);
			expect(select.get('physicsBox').left).toEqual(144);
			expect(select.get('physicsBox').width).toEqual(68);
			expect(select.get('wholePosi').startX).toEqual('2');
			expect(select.get('wholePosi').endX).toEqual('2');

			// addColhandle._adaptSelectRegion(2);
			// select.set('wholePosi.endX','3');
			// expect(select.get('physicsBox').left).toEqual(72);
			// expect(select.get('physicsBox').width).toEqual(68);
			// expect(select.get('wholePosi').startX).toEqual('2');
			// expect(select.get('wholePosi').endX).toEqual('2');

		});

		it("调选单元格测试", function() {
			var cell1,
				cell2,
				cell3;

			cells.add({
				physicsBox: {
					left: -1,
					width: 71
				},
				occupy: {
					x: ['1'],
					y: ['2']
				},
			});
			cells.add({
				physicsBox: {
					left: 71,
					width: 215
				},
				occupy: {
					x: ['2', '3', '4'],
					y: ['2']
				},
			});
			cells.add({
				physicsBox: {
					left: 143,
					width: 71
				},
				occupy: {
					x: ['3'],
					y: ['5']
				},
			});
			cache.cachePosition('2', '1', 0);
			cache.cachePosition('2', '2', 1);
			cache.cachePosition('2', '3', 1);
			cache.cachePosition('2', '4', 1);
			cache.cachePosition('5', '3', 2);

			addColhandle._adaptHeadColItem(2);
			addColhandle._adaptCells(2);

			cell1 = cells.models[0];
			cell2 = cells.models[1];
			cell3 = cells.models[2];

			expect(cell1.get('physicsBox').left).toEqual(-1);
			expect(cell1.get('physicsBox').width).toEqual(71);
			expect(cell1.get('occupy').x).toEqual(['1']);

			expect(cell2.get('physicsBox').left).toEqual(71);
			expect(cell2.get('physicsBox').width).toEqual(287);
			expect(cell2.get('occupy').x).toEqual(['2', '27', '3', '4']);

			expect(cell3.get('physicsBox').left).toEqual(215);
			expect(cell3.get('physicsBox').width).toEqual(71);
			expect(cell3.get('occupy').x).toEqual(['3']);
		});
		it("插入行接口测试", function() {
			var insertModel;
			cache.TempProp = {
				isFrozen: true,
				colAlias: '3',
				rowAlias: '3',
				rowFrozen: true,
				colFrozen: true
			}
			selectRegions.add({
				physicsBox: {
					left: 72
				},
				physicsBox: {
					width: 68
				},
				wholePosi: {
					startX: '2',
					endX: '2',
				}
			});
			addColhandle.addCol('1', 'F');
			insertModel = headItemCols.models[5];
			expect(insertModel.get('alias')).toEqual('27');
			expect(insertModel.get('sort')).toEqual(5);
			expect(insertModel.get('displayName')).toEqual('F');

			selectRegions.add({
				physicsBox: {
					left: 72,
				},
				physicsBox: {
					height: 76
				},
				wholePosi: {
					startX: '2',
					endX: '2'
				}
			});
			addColhandle.addCol('1','C');
			insertModel = headItemCols.models[2];
			expect(insertModel.get('alias')).toEqual('28');
			expect(insertModel.get('sort')).toEqual(2);
			expect(insertModel.get('displayName')).toEqual('C');

		});
		afterEach(function() {
			build.destroyRow();
			build.destroyCol();
			cells.reset();
			selectRegions.reset();
			cache.CellsPosition.strandX = {};
			cache.CellsPosition.strandY = {};
			cache.aliasColCounter = '26';
		});
	});
	build = {
		/**
		 * 在行集合中，添加10个合法Model
		 */
		buildRow: function() {
			var i = 0,
				len = 10;
			for (; i < len; i++) {
				headItemRows.add({
					sort: i,
					alias: (i + 1).toString(),
					top: i * 20,
					displayName: (i + 1).toString()
				});
			}
		},
		/**
		 * 清空行集合
		 */
		destroyRow: function() {
			headItemRows.reset();
		},
		/**
		 * 在列集合中，添加10个合法Model
		 */
		buildCol: function() {
			var i = 0,
				len = 10;
			for (; i < len; i++) {
				headItemCols.add({
					sort: i,
					alias: (i + 1).toString(),
					left: i * 72,
					displayName: buildAlias.buildColAlias(i)
				});
			}
		},
		/**
		 * 清空列集合
		 */
		destroyCol: function() {
			headItemCols.reset();
		}
	};
});