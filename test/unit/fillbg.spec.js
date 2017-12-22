'use strict';
define(function(require) {
	var setBg = require('entrance/tool/batchsetbg'),
		cells = require('collections/cells'),
		headItemRows = require('collections/headItemRow'),
		headItemCols = require('collections/headItemCol'),
		rowOperate = require('entrance/row/rowoperation'),
		colOperate = require('entrance/col/coloperation'),
		CellModel = require('models/cell'),
		stubColGetIndex,
		stubRowGetIndex;
	describe('批量设置颜色', function() {
		beforeAll(function() {
			stubColGetIndex = sinon.stub(headItemCols, 'getIndexBySort');
			stubRowGetIndex = sinon.stub(headItemRows, 'getIndexBySort');
			stubColGetIndex.withArgs(9).returns(9);
			stubRowGetIndex.withArgs(9).returns(9);
			stubColGetIndex.withArgs(3).returns(3);
			stubRowGetIndex.withArgs(3).returns(3);
		});
		it('列表转换', function() {
			expect(setBg._getWeight()).toEqual({
				A: 1,
				B: 2,
				C: 3,
				D: 4,
				E: 5,
				F: 6,
				G: 7,
				H: 8,
				I: 9,
				J: 10,
				K: 11,
				L: 12,
				M: 13,
				N: 14,
				O: 15,
				P: 16,
				Q: 17,
				R: 18,
				S: 19,
				T: 20,
				U: 21,
				V: 22,
				W: 23,
				X: 24,
				Y: 25,
				Z: 26,
				a: 1,
				b: 2,
				c: 3,
				d: 4,
				e: 5,
				f: 6,
				g: 7,
				h: 8,
				i: 9,
				j: 10,
				k: 11,
				l: 12,
				m: 13,
				n: 14,
				o: 15,
				p: 16,
				q: 17,
				r: 18,
				s: 19,
				t: 20,
				u: 21,
				v: 22,
				w: 23,
				x: 24,
				y: 25,
				z: 26
			});
		});
		afterAll(function() {
			stubColGetIndex.restore();
			stubRowGetIndex.restore();
		});
	});
});