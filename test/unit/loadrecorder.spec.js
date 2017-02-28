define(function(require) {
	var loadRecorder = require('basic/tools/loadrecorder');

	describe('记录已加载区域', function() {
		it('测试不发生不相交且不跨越其他区域', function() {
			var region = [];
			loadRecorder.insertPosi(10, 15, region);
			loadRecorder.insertPosi(1, 5, region);
			loadRecorder.insertPosi(30, 35, region);
			loadRecorder.insertPosi(20, 25, region);
			loadRecorder.insertPosi(40, 40, region);
			expect(region).toEqual([{
				start: 1,
				end: 5
			}, {
				start: 10,
				end: 15
			}, {
				start: 20,
				end: 25
			}, {
				start: 30,
				end: 35
			}, {
				start: 40,
				end: 40
			}]);
		});
		it('测试不发生不相交但跨越其他区域', function() {
			var region = [{
				start: 1,
				end: 5
			}, {
				start: 10,
				end: 15
			}, {
				start: 20,
				end: 25
			}, {
				start: 30,
				end: 35
			}, {
				start: 40,
				end: 40
			}];
			loadRecorder.insertPosi(0, 6, region);
			loadRecorder.insertPosi(19, 41, region);
			expect(region).toEqual([{
				start: 0,
				end: 6
			}, {
				start: 10,
				end: 15
			}, {
				start: 19,
				end: 41
			}]);
		});
		it('测试只有一点发生相交且不跨越其他区域', function() {
			var region = [{
				start: 0,
				end: 5
			}, {
				start: 10,
				end: 15
			}, {
				start: 20,
				end: 25
			}];
			loadRecorder.insertPosi(10, 8, region);
			loadRecorder.insertPosi(24, 30, region);
			expect(region).toEqual([{
				start: 0,
				end: 5
			}, {
				start: 8,
				end: 15
			}, {
				start: 20,
				end: 30
			}]);

		});
		it('测试只有一点发生相交且跨越其他区域', function() {
			var region = [{
				start: 2,
				end: 5
			}, {
				start: 10,
				end: 15
			}, {
				start: 20,
				end: 25
			}, {
				start: 30,
				end: 35
			}, {
				start: 40,
				end: 45
			}];
			loadRecorder.insertPosi(1, 15, region);
			loadRecorder.insertPosi(24, 50, region);

			expect(region).toEqual([{
				start: 1,
				end: 15
			}, {
				start: 20,
				end: 50
			}]);

		});
		it('测试只有两点发生相交且不跨越其他区域', function() {
			var region = [{
				start: 1,
				end: 5
			}, {
				start: 10,
				end: 15
			}, {
				start: 20,
				end: 25
			}, {
				start: 30,
				end: 35
			}];
			loadRecorder.insertPosi(2, 15, region);
			loadRecorder.insertPosi(24, 35, region);

			expect(region).toEqual([{
				start: 1,
				end: 15
			}, {
				start: 20,
				end: 35
			}]);

		});
		it('测试只有两点发生相交且跨越其他区域', function() {
			var region = [{
				start: 1,
				end: 5
			}, {
				start: 10,
				end: 15
			}, {
				start: 20,
				end: 25
			}, {
				start: 30,
				end: 35
			}, {
				start: 40,
				end: 45
			}, {
				start: 50,
				end: 55
			}, {
				start: 60,
				end: 65
			}];
			loadRecorder.insertPosi(2, 20, region);
			loadRecorder.insertPosi(30, 65, region);
			expect(region).toEqual([{
				start: 1,
				end: 25
			}, {
				start: 30,
				end: 65
			}]);
		});

		it('测试相邻', function() {
			var region = [{
				start: 1,
				end: 5
			}, {
				start: 10,
				end: 15
			}, {
				start: 20,
				end: 25
			}, {
				start: 30,
				end: 35
			}, {
				start: 40,
				end: 45
			}, {
				start: 50,
				end: 55
			}, {
				start: 60,
				end: 65
			}];
			//一个点相邻
			loadRecorder.insertPosi(0, 0, region);
			loadRecorder.insertPosi(16, 18, region);
			expect(region).toEqual([{
				start: 0,
				end: 5
			}, {
				start: 10,
				end: 18
			}, {
				start: 20,
				end: 25
			}, {
				start: 30,
				end: 35
			}, {
				start: 40,
				end: 45
			}, {
				start: 50,
				end: 55
			}, {
				start: 60,
				end: 65
			}]);
			//两个点相邻
			loadRecorder.insertPosi(19, 19, region);
			loadRecorder.insertPosi(25, 29, region);
			expect(region).toEqual([{
				start: 0,
				end: 5
			}, {
				start: 10,
				end: 35
			}, {
				start: 40,
				end: 45
			}, {
				start: 50,
				end: 55
			}, {
				start: 60,
				end: 65
			}]);
			//跨越相邻
			loadRecorder.insertPosi(39, 66, region);
			expect(region.length).toBe(3);
			expect(region).toEqual([{
				start: 0,
				end: 5
			}, {
				start: 10,
				end: 35
			}, {
				start: 39,
				end: 66
			}]);

		});
	});
	describe("调整已加载区域", function() {
		it('测试调整已加载区域', function() {
			var region = [{
				start: 1,
				end: 5
			}, {
				start: 10,
				end: 15
			}, {
				start: 20,
				end: 25
			}];
			loadRecorder.adaptPosi(1, 1, region);
			expect(region).toEqual([{
				start: 1,
				end: 6
			}, {
				start: 11,
				end: 16
			}, {
				start: 21,
				end: 26
			}]);
			loadRecorder.adaptPosi(0, 1, region);
			expect(region).toEqual([{
				start: 2,
				end: 7
			}, {
				start: 12,
				end: 17
			}, {
				start: 22,
				end: 27
			}]);
			loadRecorder.adaptPosi(7, 1, region);
			expect(region).toEqual([{
				start: 2,
				end: 8
			}, {
				start: 13,
				end: 18
			}, {
				start: 23,
				end: 28
			}]);
		});
	});
	describe("判断是否含有未加载区域", function() {
		var region = [{
				start: 1,
				end: 5
			}, {
				start: 10,
				end: 15
			}, {
				start: 20,
				end: 25
			}, {
				start: 30,
				end: 35
			}, {
				start: 40,
				end: 45
			}, {
				start: 50,
				end: 55
			}, {
				start: 60,
				end: 65
			}];
		it('对于已加载判断', function() {
			expect(loadRecorder.isUnloadPosi(5,5,region)).toBe(false);
			expect(loadRecorder.isUnloadPosi(2,3,region)).toBe(false);
			expect(loadRecorder.isUnloadPosi(2,5,region)).toBe(false);
		});
		it('对于未加载判断', function() {
			expect(loadRecorder.isUnloadPosi(6,7,region)).toBe(true);
			expect(loadRecorder.isUnloadPosi(21,31,region)).toBe(true);
			expect(loadRecorder.isUnloadPosi(41,61,region)).toBe(true);
		});
	});
});