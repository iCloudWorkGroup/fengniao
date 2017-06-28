'use strict';
define(function(require) {
	var setBg = require('entrance/tool/batchsetbg'),
		cells = require('collections/cells');
	describe('批量设置颜色', function() {
		it('解析操作范围数据', function() {
			var result;
			expect(function() {
				setBg._parse({
					'10010D',
					'11A'
				});
			}).toThrow('传入行超出范围：10000D');
			expect(function() {
				setBg._parse({
					'10010DA',
					'11A'
				});
			}).toThrow('传入列超出范围：10010DA');
			expect(function() {
				setBg._parse({
					'10010-DA',
					'11A'
				});
			}).toThrow('非法参数：10010-DA');
			result = setBg._parse('50H');
			expect(result).toEqual([{
				startCol: 8,
				endCol: 8,
				startRow: 50,
				endRow: 50
			}]);
			result = setBg._parse({
				'100D',
				'11F'
			});
			expect(result).toEqual([{
				startCol: 4,
				endCol: 6,
				startRow: 11,
				endRow: 100
			}]);
			result = setBg._parse([{
				'100D',
				'11F'
			}, {
				'3d',
				'56b'
			}]);
			expect(result).toEqual([{
				startCol: 4,
				endCol: 6,
				startRow: 11,
				endRow: 100
			},{
				startCol: 2,
				endCol: 4,
				startRow: 3,
				endRow: 56
			}]);
		});
		it('批量操作单元格的回调操作', function() {
			var sion.stub();cells
			//cells.operateCellsByRegion();
		});
	});
});