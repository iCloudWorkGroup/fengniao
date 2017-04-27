'use strict';
define(function(require) {
	var cache = require('basic/tools/cache'),
		addRowhandle = require('entrance/tool/addrow'),
		deleteRowhandle = require('entrance/tool/deleterow'),
		headItemRows = require('collections/headItemRow'),
		headItemCols = require('collections/headItemCol'),
		selectRegions = require('collections/selectRegion'),
		siderLineRows = require('collections/siderLineRow'),
		cells = require('collections/cells'),
		build;
	// build = require('test/unit/build.js');

	describe("删除行功能测试", function() {
		beforeEach(function() {
			build.buildRow();
			siderLineRows.add({
				top: 0,
				height: 17
			});
		});
		it("调整行集合测试", function() {
			var fristModel,
				lastModel;

			deleteRowhandle._adaptHeadRowItem(5);

			fristModel = headItemRows.models[0];
			lastModel = headItemRows.models[8];

			expect(fristModel.get('sort')).toEqual(0);
			expect(fristModel.get('top')).toEqual(0);
			expect(fristModel.get('displayName')).toEqual('1');

			expect(lastModel.get('sort')).toEqual(8);
			expect(lastModel.get('top')).toEqual(160);
			expect(lastModel.get('displayName')).toEqual('9');

		});
		it("调整选中区域测试", function() {
			var select;

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
			select = selectRegions.getModelByType('operation');

			deleteRowhandle._adaptSelectRegion(9);
			expect(select.get('physicsBox').top).toEqual(40);
			expect(select.get('physicsBox').left).toEqual(72);
			expect(select.get('physicsBox').width).toEqual(68);
			expect(select.get('physicsBox').height).toEqual(76);
			expect(select.get('wholePosi').startX).toEqual('2');
			expect(select.get('wholePosi').startY).toEqual('3');
			expect(select.get('wholePosi').endX).toEqual('2');
			expect(select.get('wholePosi').endY).toEqual('6');


			deleteRowhandle._adaptSelectRegion(5);
			expect(select.get('physicsBox').top).toEqual(40);
			expect(select.get('physicsBox').left).toEqual(72);
			expect(select.get('physicsBox').width).toEqual(68);
			expect(select.get('physicsBox').height).toEqual(76);
			expect(select.get('wholePosi').startX).toEqual('2');
			expect(select.get('wholePosi').startY).toEqual('3');
			expect(select.get('wholePosi').endX).toEqual('2');
			expect(select.get('wholePosi').endY).toEqual('5');

			deleteRowhandle._adaptSelectRegion(3);
			expect(select.get('physicsBox').top).toEqual(40);
			expect(select.get('physicsBox').left).toEqual(72);
			expect(select.get('physicsBox').width).toEqual(68);
			expect(select.get('physicsBox').height).toEqual(56);
			expect(select.get('wholePosi').startX).toEqual('2');
			expect(select.get('wholePosi').startY).toEqual('3');
			expect(select.get('wholePosi').endX).toEqual('2');
			expect(select.get('wholePosi').endY).toEqual('5');

			select.set('wholePosi.endY', '3');
			select.set('physicsBox.height', 19);
			deleteRowhandle._adaptSelectRegion(2);

			expect(select.get('physicsBox').top).toEqual(40);
			expect(select.get('physicsBox').left).toEqual(72);
			expect(select.get('physicsBox').width).toEqual(68);
			expect(select.get('physicsBox').height).toEqual(19);
			expect(select.get('wholePosi').startX).toEqual('2');
			expect(select.get('wholePosi').startY).toEqual('4');
			expect(select.get('wholePosi').endX).toEqual('2');
			expect(select.get('wholePosi').endY).toEqual('4');

			select.set('wholePosi.startY', '3');
			select.set('wholePosi.endY', '4');
			select.set('physicsBox.height', 39);
			deleteRowhandle._adaptSelectRegion(2);
			expect(select.get('physicsBox').top).toEqual(40);
			expect(select.get('physicsBox').left).toEqual(72);
			expect(select.get('physicsBox').width).toEqual(68);
			expect(select.get('physicsBox').height).toEqual(19);
			expect(select.get('wholePosi').startX).toEqual('2');
			expect(select.get('wholePosi').startY).toEqual('4');
			expect(select.get('wholePosi').endX).toEqual('2');
			expect(select.get('wholePosi').endY).toEqual('4');

		});

		it("调选单元格测试", function() {
			var cell1,
				cell2,
				cell3;

			cells.add({
				physicsBox: {
					top: 19,
					left: -1,
					height: 19,
					width: 71
				},
				occupy: {
					x: ['1'],
					y: ['2']
				},
			});
			cells.add({
				physicsBox: {
					top: 19,
					left: 71,
					height: 59,
					width: 71
				},
				occupy: {
					x: ['2'],
					y: ['2', '3', '4']
				},
			});
			cells.add({
				physicsBox: {
					top: 79,
					left: 143,
					height: 19,
					width: 71
				},
				occupy: {
					x: ['3'],
					y: ['5']
				},
			});
			cache.cachePosition('2', '1', 0);
			cache.cachePosition('2', '2', 1);
			cache.cachePosition('3', '2', 1);
			cache.cachePosition('4', '2', 1);
			cache.cachePosition('5', '3', 2);

			deleteRowhandle._adaptCells(1);

			cell1 = cells.models[0];
			cell2 = cells.models[1];
			cell3 = cells.models[2];

			expect(cell1.get('isDestroy')).toEqual(true);


			expect(cell2.get('physicsBox').top).toEqual(19);
			expect(cell2.get('physicsBox').left).toEqual(71);
			expect(cell2.get('physicsBox').height).toEqual(39);
			expect(cell2.get('physicsBox').width).toEqual(71);
			expect(cell2.get('occupy')).toEqual({
				x: ['2'],
				y: ['3', '4']
			});

			expect(cell3.get('physicsBox').top).toEqual(59);
			expect(cell3.get('physicsBox').left).toEqual(143);
			expect(cell3.get('physicsBox').height).toEqual(19);
			expect(cell3.get('physicsBox').width).toEqual(71);
			expect(cell3.get('occupy')).toEqual({
				x: ['3'],
				y: ['5']
			});

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
			deleteRowhandle.deleteRow('1', '3');
			expect(cache.TempProp.rowAlias).toEqual('4');
			deleteRowhandle.deleteRow('1', '1');
			expect(cache.UserView.rowAlias).toEqual('2');
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
			cache.CellsPosition.strandX = {};
			cache.CellsPosition.strandY = {};
		});
	});
	describe("插入行功能测试", function() {
		beforeEach(function() {
			build.buildRow();
			siderLineRows.add({
				top: 0,
				height: 17
			});
		});
		it("调整行集合测试", function() {
			var insertModel,
				nextModel,
				lastModel;

			nextModel = headItemRows.models[5];
			addRowhandle._adaptHeadRowItem(5);

			insertModel = headItemRows.models[5];
			lastModel = headItemRows.models[headItemRows.length - 1];


			expect(insertModel.get('alias')).toEqual('101');
			expect(insertModel.get('sort')).toEqual(5);
			expect(insertModel.get('top')).toEqual(100);
			expect(insertModel.get('displayName')).toEqual('6');

			expect(nextModel.get('sort')).toEqual(6);
			expect(nextModel.get('top')).toEqual(120);
			expect(nextModel.get('displayName')).toEqual('7');

			expect(lastModel.get('sort')).toEqual(10);
			expect(lastModel.get('top')).toEqual(200);
			expect(lastModel.get('displayName')).toEqual('11');

		});
		it("调整选中区域测试", function() {
			var select;

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
			select = selectRegions.getModelByType('operation');

			addRowhandle._adaptSelectRegion(5);
			expect(select.get('physicsBox').top).toEqual(40);
			expect(select.get('physicsBox').left).toEqual(72);
			expect(select.get('physicsBox').width).toEqual(68);
			expect(select.get('physicsBox').height).toEqual(96);
			expect(select.get('wholePosi').startX).toEqual('2');
			expect(select.get('wholePosi').startY).toEqual('3');
			expect(select.get('wholePosi').endX).toEqual('2');
			expect(select.get('wholePosi').endY).toEqual('6');

			addRowhandle._adaptSelectRegion(1);
			expect(select.get('physicsBox').top).toEqual(60);
			expect(select.get('physicsBox').left).toEqual(72);
			expect(select.get('physicsBox').width).toEqual(68);
			expect(select.get('physicsBox').height).toEqual(96);
			expect(select.get('wholePosi').startX).toEqual('2');
			expect(select.get('wholePosi').startY).toEqual('3');
			expect(select.get('wholePosi').endX).toEqual('2');
			expect(select.get('wholePosi').endY).toEqual('6');

			addRowhandle._adaptSelectRegion(9);
			expect(select.get('physicsBox').top).toEqual(60);
			expect(select.get('physicsBox').left).toEqual(72);
			expect(select.get('physicsBox').width).toEqual(68);
			expect(select.get('physicsBox').height).toEqual(96);
			expect(select.get('wholePosi').startX).toEqual('2');
			expect(select.get('wholePosi').startY).toEqual('3');
			expect(select.get('wholePosi').endX).toEqual('2');
			expect(select.get('wholePosi').endY).toEqual('6');

		});

		it("调选单元格测试", function() {
			var cell1,
				cell2,
				cell3;

			cells.add({
				physicsBox: {
					top: 19,
					left: -1,
					height: 19,
					width: 71
				},
				occupy: {
					x: ['1'],
					y: ['2']
				},
			});
			cells.add({
				physicsBox: {
					top: 19,
					left: 71,
					height: 59,
					width: 71
				},
				occupy: {
					x: ['2'],
					y: ['2', '3', '4']
				},
			});
			cells.add({
				physicsBox: {
					top: 79,
					left: 143,
					height: 19,
					width: 71
				},
				occupy: {
					x: ['3'],
					y: ['5']
				},
			});
			cache.cachePosition('2', '1', 0);
			cache.cachePosition('2', '2', 1);
			cache.cachePosition('3', '2', 1);
			cache.cachePosition('4', '2', 1);
			cache.cachePosition('5', '3', 2);

			addRowhandle._adaptHeadRowItem(2);
			addRowhandle._adaptCells(2);

			cell1 = cells.models[0];
			cell2 = cells.models[1];
			cell3 = cells.models[2];

			expect(cell1.get('physicsBox').top).toEqual(19);
			expect(cell1.get('physicsBox').left).toEqual(-1);
			expect(cell1.get('physicsBox').height).toEqual(19);
			expect(cell1.get('physicsBox').width).toEqual(71);
			expect(cell1.get('occupy')).toEqual({
				x: ['1'],
				y: ['2']
			});

			expect(cell2.get('physicsBox').top).toEqual(19);
			expect(cell2.get('physicsBox').left).toEqual(71);
			expect(cell2.get('physicsBox').height).toEqual(79);
			expect(cell2.get('physicsBox').width).toEqual(71);
			expect(cell2.get('occupy')).toEqual({
				x: ['2'],
				y: ['2', '101', '3', '4']
			});

			expect(cell3.get('physicsBox').top).toEqual(99);
			expect(cell3.get('physicsBox').left).toEqual(143);
			expect(cell3.get('physicsBox').height).toEqual(19);
			expect(cell3.get('physicsBox').width).toEqual(71);
			expect(cell3.get('occupy')).toEqual({
				x: ['3'],
				y: ['5']
			});

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
			addRowhandle.addRow('1', '6');
			insertModel = headItemRows.models[5];
			expect(insertModel.get('alias')).toEqual('101');
			expect(insertModel.get('sort')).toEqual(5);
			expect(insertModel.get('top')).toEqual(100);
			expect(insertModel.get('displayName')).toEqual('6');

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
			addRowhandle.addRow();
			insertModel = headItemRows.models[2];
			expect(insertModel.get('alias')).toEqual('102');
			expect(insertModel.get('sort')).toEqual(2);
			expect(insertModel.get('top')).toEqual(40);
			expect(insertModel.get('displayName')).toEqual('3');

		});
		afterEach(function() {
			build.destroyRow();
			build.destroyCol();
			cells.reset();
			selectRegions.reset();
			cache.CellsPosition.strandX = {};
			cache.CellsPosition.strandY = {};
			cache.aliasRowCounter = '100';
		});
	});
	build = {
		/**
		 * 在行集合中，添加10个合法Model
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
					top: i * 72,
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