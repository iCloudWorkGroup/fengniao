define(function(require) {
	describe('设置下划线', function() {
		var underline = require('entrance/tool/setunderline'),
			send = require('basic/tools/send'),
			cells = require('collections/cells'),
			selects = require('collections/selectRegion'),
			gridRows = require('collections/headItemRow'),
			gridCols = require('collections/headItemCol'),
			history = require('basic/tools/history');

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
		});
		it('销毁复制区', function() {
			selects.add({
				selectType: 'clip'
			});
			underline._destroyClipRegion();
			expect(selects.length).toEqual(1);
		});
		it('写入历史记录', function() {
			underline._history('content.underline', true, {
				startColIndex: 0,
				startRowIndex: 0,
				endColIndex: 0,
				endRowIndex: 0
			}, {
				colSort: 0,
				rowSort: 0,
				value: false
			});
			expect(history.previous()).toEqual({
				originalData: {
					colSort: 0,
					rowSort: 0,
					value: false
				},
				propName: 'content.underline',
				propValue: true,
				region: {
					endColSort: 0,
					endRowSort: 0,
					startColSort: 0,
					startRowSort: 0
				},
				type: 'update'
			});
		});
		it('设置下划线', function() {
			underline.set();
			expect(cells.models[0].get('content').underline).toEqual(true);
			underline.set(false);
			expect(cells.models[0].get('content').underline).toEqual(false);
			underline.set('sheetId', true, 'A1');
			expect(cells.models[0].get('content').underline).toEqual(true);
			selects.models[0].set('wholePosi', {
				startY: '1',
				startX: '1',
				endY: '1',
				endX: 'MAX'
			});
			underline.set();
			expect(cells.models[0].get('content').underline).toEqual(false);
			selects.models[0].set('wholePosi', {
				startY: '1',
				startX: '1',
				endY: 'MAX',
				endX: '1'
			});
			underline.set();
			expect(cells.models[0].get('content').underline).toEqual(true);
		});
	});
});