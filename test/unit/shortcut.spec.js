define(function(require) {
	var shortcut = require('entrance/sheet/shortcut'),
		selects = require('collections/selectRegion'),
		gridRows = require('collections/headItemRow'),
		gridCols = require('collections/headItemCol'),
		textHandle = require('entrance/cell/setcelltext'),
		cache = require('basic/tools/cache'),
		cells = require('collections/cells'),
		sinon = require('lib/sinon'),
		Select = require('models/selectRegion');
	describe('内部回车', function() {
		it('输入框键值处理', function() {
			var elem = document.createElement('textarea');
			document.body.appendChild(elem);
			elem.value = 'content';
			if (elem.setSelectionRange) {
				elem.focus();
				elem.setSelectionRange(8, 8);
			}
			shortcut._insertAtCursor('n', elem);
			expect(elem.value).toBe('contentn');
			document.body.removeChild(elem);
		});
	});
	describe('方向键', function() {
		beforeAll(function() {
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
			}]);
		});
		it('非边界情况', function() {
			selects.add({
				wholePosi: {
					startX: '1',
					startY: '1',
					endX: '1',
					endY: '1',
				},
				selectType: 'selected'
			});
			shortcut.arrow('RIGHT');

			expect(selects.models[0].get('tempPosi')).toEqual({
				initColIndex: 1,
				initRowIndex: 0,
				mouseColIndex: 1,
				mouseRowIndex: 0
			});

			shortcut.arrow('DOWN');

			expect(selects.models[0].get('tempPosi')).toEqual({
				initColIndex: 1,
				initRowIndex: 1,
				mouseColIndex: 1,
				mouseRowIndex: 1
			});
			shortcut.arrow('LEFT');

			expect(selects.models[0].get('tempPosi')).toEqual({
				initColIndex: 0,
				initRowIndex: 1,
				mouseColIndex: 0,
				mouseRowIndex: 1
			});
			shortcut.arrow('UP');

			expect(selects.models[0].get('tempPosi')).toEqual({
				initColIndex: 0,
				initRowIndex: 0,
				mouseColIndex: 0,
				mouseRowIndex: 0
			});
			cells.add([{
				occupy: {
					x: ['1'],
					y: ['1']
				}
			}, {
				occupy: {
					x: ['1'],
					y: ['2']
				}
			}, {
				occupy: {
					x: ['2'],
					y: ['1']
				}
			}, {
				occupy: {
					x: ['2'],
					y: ['2']
				}
			}]);
			cache.CellsPosition = {
				strandX: {
					'1': {
						'1': 0,
						'2': 1
					},
					'2': {
						'1': 2,
						'2': 3
					}
				},
				strandY: {
					'1': {
						'1': 0,
						'2': 2
					},
					'2': {
						'1': 1,
						'2': 3
					}
				}
			}
			shortcut.arrow('RIGHT');

			expect(selects.models[0].get('tempPosi')).toEqual({
				initColIndex: 1,
				initRowIndex: 0,
				mouseColIndex: 1,
				mouseRowIndex: 0
			});

			shortcut.arrow('DOWN');

			expect(selects.models[0].get('tempPosi')).toEqual({
				initColIndex: 1,
				initRowIndex: 1,
				mouseColIndex: 1,
				mouseRowIndex: 1
			});
			shortcut.arrow('LEFT');

			expect(selects.models[0].get('tempPosi')).toEqual({
				initColIndex: 0,
				initRowIndex: 1,
				mouseColIndex: 0,
				mouseRowIndex: 1
			});
			shortcut.arrow('UP');

			expect(selects.models[0].get('tempPosi')).toEqual({
				initColIndex: 0,
				initRowIndex: 0,
				mouseColIndex: 0,
				mouseRowIndex: 0
			});
			cells.reset();
			cache.CellsPosition = {
				strandY: {},
				strandX: {}
			};
		});
		it('边界情况', function() {
			shortcut.arrow('LEFT');
			expect(selects.models[0].get('tempPosi')).toEqual({
				initColIndex: 0,
				initRowIndex: 0,
				mouseColIndex: 0,
				mouseRowIndex: 0
			});
			shortcut.arrow('UP');

			expect(selects.models[0].get('tempPosi')).toEqual({
				initColIndex: 0,
				initRowIndex: 0,
				mouseColIndex: 0,
				mouseRowIndex: 0
			});
		});
		afterAll(function() {});
	});
	describe('删除键', function() {
		it('删除按键', function() {
			stubTextHandle = sinon.stub(textHandle, 'set');
			shortcut.backspace();
			expect(stubTextHandle.calledWith('')).toBe(true);
		});
	});
});