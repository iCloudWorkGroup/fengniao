define(function(require) {
	'use strict';
	describe('保护功能', function() {
		var send = require('basic/tools/send'),
			cells = require('collections/cells'),
			selects = require('collections/selectRegion'),
			gridRows = require('collections/headItemRow'),
			gridCols = require('collections/headItemCol'),
			protect = require('entrance/tool/protect'),
			cache = require('basic/tools/cache'),
			stubSend;

		beforeEach(function() {
			while (gridCols.length) {
				gridCols.shift();
			}
			while (gridRows.length) {
				gridRows.shift();
			}
			while (cells.length) {
				cells.shift();
			}
			while (selects.length) {
				selects.shift();
			}
			cache.CellsPosition.strandX={};
			cache.CellsPosition.strandY={};
			gridCols.add([{
				alias: '1'
			}, {
				alias: '2'
			}, {
				alias: '3'
			}, {
				alias: '4'
			}, {
				alias: '5'
			}, {
				alias: '6'
			}, {
				alias: '7'
			}, {
				alias: '8'
			}, {
				alias: '9'
			}, {
				alias: '10'
			}]);
			gridRows.add([{
				alias: '1'
			}, {
				alias: '2'
			}, {
				alias: '3'
			}, {
				alias: '4'
			}, {
				alias: '5'
			}, {
				alias: '6'
			}, {
				alias: '7'
			}, {
				alias: '8'
			}, {
				alias: '9'
			}, {
				alias: '10'
			}]);

			selects.reset();
			selects.add({
				wholePosi: {
					startX: '1',
					startY: '1',
					endX: '1',
					endY: '1',
				},
				selectType: 'selected'
			});
			stubSend = sinon.stub(send, 'PackAjax');
			cache.protectState = false;
		});
		it('锁定功能', function() {
			/**
			 * 行列进行锁定和解锁
			 */
			var gridRowList = gridRows.models;
			var gridColList = gridCols.models;
			var select = selects.getModelByType('selected');
			select.set('wholePosi', {
				startX: '1',
				startY: '1',
				endX: 'MAX',
				endY: '2',
			});
			protect.lock();
			expect(cells.length).toEqual(0);
			expect(gridRowList[0].get('operProp').locked).toEqual(true);
			expect(gridRowList[1].get('operProp').locked).toEqual(true);
			protect.unlock();
			expect(gridRowList[0].get('operProp').locked).toEqual(false);
			expect(gridRowList[1].get('operProp').locked).toEqual(false);
			expect(cells.length).toEqual(0);
			//列行交叉
			select.set('wholePosi', {
				startX: '1',
				startY: '1',
				endX: '2',
				endY: 'MAX',
			});
			protect.lock();
			expect(gridColList[0].get('operProp').locked).toEqual(true);
			expect(gridColList[1].get('operProp').locked).toEqual(true);
			expect(cells.length).toEqual(4);

			var i, len;
			for (i = 0, len = cells.length; i < len; i++) {
				expect(cells.at(i).get('locked')).toEqual(true);
			}
			protect.unlock();
			expect(cells.length).toEqual(4);
			for (i = 0, len = cells.length; i < len; i++) {
				expect(cells.at(i).get('locked')).toEqual(false);
			}
			//行列交叉
			select.set('wholePosi', {
				startX: '1',
				startY: '5',
				endX: 'MAX',
				endY: '6',
			});
			protect.unlock();
			expect(cells.length).toEqual(4);
			protect.lock();
			expect(cells.length).toEqual(8);

			for (i = 0; i < 4; i++) {
				expect(cells.at(i).get('locked')).toEqual(false);
			}
			for (i = 4; i < 8; i++) {
				expect(cells.at(i).get('locked')).toEqual(true);
			}
			/**
			 * 非行列操作
			 */
			cells.createCellModel(8, 9);
			select.set('wholePosi', {
				startX: '8',
				startY: '8',
				endX: '10',
				endY: '10',
			});
			protect.lock();
			expect(cells.length).toEqual(9);
			expect(cells.at(8).get('locked')).toEqual(true);
			protect.unlock();
			expect(cells.length).toEqual(17);
			for (i = 8; i < 17; i++) {
				expect(cells.at(i).get('locked')).toEqual(false);
			}
		});
		it('保护功能', function() {
			protect.execute();
			expect(cache.protectState).toEqual(true);
			protect.cancel();
			protect._toggleProtectState({
				returndata: true
			});
			expect(cache.protectState).toEqual(false);
		});
		it('保护过滤', function() {
			cache.protectState = true;
			//行列过滤
			var result;
			result = protect.interceptor({
				startColIndex: 5,
				endColIndex: 'MAX',
				startRowIndex: 3,
				endRowIndex: 4
			});
			expect(result).toEqual(true);

			result = protect.interceptor({
				startColIndex: 5,
				endColIndex: 6,
				startRowIndex: 3,
				endRowIndex: 'MAX'
			});
			expect(result).toEqual(true);
			//默认情况过滤
			result = protect.interceptor({
				startColIndex: 5,
				endColIndex: 6,
				startRowIndex: 3,
				endRowIndex: 4
			});
			expect(result).toEqual(true);

			// 行列情况过滤
			gridRows.at(3).set('operProp.locked', false);
			gridRows.at(4).set('operProp.locked', false);

			result = protect.interceptor({
				startColIndex: 5,
				endColIndex: 6,
				startRowIndex: 3,
				endRowIndex: 4
			});
			
			expect(result).toEqual(false);
			
			gridCols.at(5).set('operProp.locked', true);
			gridCols.at(6).set('operProp.locked', true);

			gridRows.at(3).set('operProp.locked', true);
			gridRows.at(4).set('operProp.locked', true);

			result = protect.interceptor({
				startColIndex: 5,
				endColIndex: 6,
				startRowIndex: 3,
				endRowIndex: 4
			});
			expect(result).toEqual(true);

			cells.createCellModel(5, 3).set('locked', false);
			cells.createCellModel(5, 4).set('locked', false);
			cells.createCellModel(6, 3).set('locked', false);
			cells.createCellModel(6, 4).set('locked', false);

			result = protect.interceptor({
				startColIndex: 5,
				endColIndex: 6,
				startRowIndex: 3,
				endRowIndex: 4
			});
			expect(result).toEqual(false);

			cells.createCellModel(5, 3).set('locked', true);
			cells.createCellModel(5, 4).set('locked', false);
			cells.createCellModel(6, 3).set('locked', false);
			cells.createCellModel(6, 4).set('locked', false);

			result = protect.interceptor({
				startColIndex: 5,
				endColIndex: 6,
				startRowIndex: 3,
				endRowIndex: 4
			});
			expect(result).toEqual(true);

		});
		afterEach(function() {
			stubSend.restore();
			cache.protectState = false;
			while (gridCols.length) {
				gridCols.shift();
			}
			while (gridRows.length) {
				gridRows.shift();
			}
			while (cells.length) {
				cells.shift();
			}
		});

	});
});