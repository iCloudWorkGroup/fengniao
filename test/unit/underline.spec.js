define(function(require) {
	describe('设置下划线', function() {
		var underline = require('entrance/tool/setunderline'),
			selects = require('collections/selectRegion'),
			parse = require('basic/tools/getoperregion');

		beforeAll(function(){
			sinon.stub(parse)
		});
		it('销毁复制区', function() {
			selects.add({
				selectType: 'clip'
			});
			underline._destroyClipRegion();
			expect(selects.length).toEqual(0);
		});
		it('', function() {
			selects.add({

			});
			underline.set();
		});
		it('', function() {

		});
	});
});