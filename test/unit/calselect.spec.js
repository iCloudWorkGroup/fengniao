define(function(require) {
	describe('选择区对象数据生成', function() {
		var cells = require('collections/cells'),
			Select = require('models/selectRegion'),
			selects = require('collections/selectRegion'),
			selectView = require('views/selectRegion'),
			siderLineRows = require('collections/siderLineRow'),
			siderLineCols = require('collections/siderLineCol'),
			cache = require('basic/tools/cache'),
			build = require('build');

		beforeEach(function() {
			build.buildRow();
			build.buildCol();
			
		});
		it('选择区大小计算', function() {
			var result;
			//单行
			result = cells.getFullOperationRegion('MAX', 4);
			expect(result).toEqual({
				startRowIndex: 4,
				endRowIndex: 4,
				startColIndex: 0,
				endColIndex: 9
			});
			//多行
			result = cells.getFullOperationRegion('MAX', 7, 0, 4);
			expect(result).toEqual({
				startRowIndex: 4,
				endRowIndex: 7,
				startColIndex: 0,
				endColIndex: 9
			});
			//单列
			result = cells.getFullOperationRegion(7, 'MAX');
			expect(result).toEqual({
				startRowIndex: 0,
				endRowIndex: 9,
				startColIndex: 7,
				endColIndex: 7
			});
			//多列
			result = cells.getFullOperationRegion(7, 'MAX', 3, 1);
			expect(result).toEqual({
				startRowIndex: 0,
				endRowIndex: 9,
				startColIndex: 3,
				endColIndex: 7
			});
			//区域扩展
			cells.createCellModel(1, 1, 2, 2);
			cells.createCellModel(3, 2, 4, 3);
			//向上
			result = cells.getFullOperationRegion(0, 2, 1, 2);
			expect(result).toEqual({
				startRowIndex: 1,
				endRowIndex: 2,
				startColIndex: 0,
				endColIndex: 2
			});
			//向下
			result = cells.getFullOperationRegion(1, 1, 0, 0);
			expect(result).toEqual({
				startRowIndex: 0,
				endRowIndex: 2,
				startColIndex: 0,
				endColIndex: 2
			});
			//向左
			result = cells.getFullOperationRegion(2, 2);
			expect(result).toEqual({
				startRowIndex: 1,
				endRowIndex: 2,
				startColIndex: 1,
				endColIndex: 2
			});
			//向右
			result = cells.getFullOperationRegion(1, 1);
			expect(result).toEqual({
				startRowIndex: 1,
				endRowIndex: 2,
				startColIndex: 1,
				endColIndex: 2
			});
			//连续扩展
			result = cells.getFullOperationRegion(2, 3, 3, 3);
			expect(result).toEqual({
				startRowIndex: 1,
				endRowIndex: 3,
				startColIndex: 1,
				endColIndex: 4
			});
		});
		it('选择区缓存值计算', function() {
			var select = new Select();
			selects.add(select);
			siderLineRows.add({});
			siderLineCols.add({});
			var temp = {
				model: select,
				changeHeadLineModel:function(){},
			}
			
			select.set('tempPosi', {
				initColIndex: 0,
				initRowIndex: 0,
				mouseColIndex: 'MAX',
				mouseRowIndex: 4
			});
			selectView.prototype.changePosi.call(temp);
			expect(select.get('wholePosi')).toEqual({
				startX: '1',
				startY: '1',
				endX: 'MAX',
				endY: '5'
			});
			//多行
			select.set('tempPosi', {
				initColIndex: 0,
				initRowIndex: 4,
				mouseColIndex: 'MAX',
				mouseRowIndex: 7
			});
			selectView.prototype.changePosi.call(temp);
			expect(select.get('wholePosi')).toEqual({
				startX: '1',
				startY: '5',
				endX: 'MAX',
				endY: '8'
			});
			//单列
			select.set('tempPosi', {
				initColIndex: 4,
				initRowIndex: 0,
				mouseColIndex: 4,
				mouseRowIndex: 'MAX'
			});
			selectView.prototype.changePosi.call(temp);
			expect(select.get('wholePosi')).toEqual({
				startX: '5',
				startY: '1',
				endX: '5',
				endY: 'MAX'
			});
			// 多列
			select.set('tempPosi', {
				initColIndex: 4,
				initRowIndex: 0,
				mouseColIndex: 7,
				mouseRowIndex: 'MAX'
			});
			selectView.prototype.changePosi.call(temp);
			expect(select.get('wholePosi')).toEqual({
				startX: '5',
				startY: '1',
				endX: '8',
				endY: 'MAX'
			});
			// 区域
			select.set('tempPosi', {
				initColIndex: 4,
				initRowIndex: 0,
				mouseColIndex: 7,
				mouseRowIndex: 7
			});
			selectView.prototype.changePosi.call(temp);
			expect(select.get('wholePosi')).toEqual({
				startX: '5',
				startY: '1',
				endX: '8',
				endY: '8'
			});
			siderLineRows.reset();
			siderLineCols.reset();
		});
		afterEach(function() {
			cells.reset();
			selects.reset();
			cache.CellsPosition.strandX={};
			cache.CellsPosition.strandY={}
			build.destroyCol();
			build.destroyRow();
		});
	});
});