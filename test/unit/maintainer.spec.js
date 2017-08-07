define(function(require) {
	var MainContainer = require('views/mainContainer'),
		loadRecorder = require('basic/tools/loadrecorder'),
		cache = require('basic/tools/cache');

	describe('调整行高度（包括删除，添加），触发显示区域的联动效果', function() {
		var mainContainer,
			stubInit,
			stubAddTop,
			stubAddBottom,
			stubDeleteTop,
			stubDeleteBottom,
			stubLoadRecorder,
			posi,
			diff;

		beforeAll(function() {
			stubInit = sinon.stub(MainContainer.prototype, 'initialize');
			stubLoadRecorder = sinon.stub(loadRecorder, 'adaptPosi');
		});
		beforeEach(function() {
			mainContainer = new MainContainer();
			stubAddTop = sinon.stub(MainContainer.prototype, 'addTop');
			stubAddBottom = sinon.stub(MainContainer.prototype, 'addBottom');
			stubDeleteTop = sinon.stub(MainContainer.prototype, 'deleteTop');
			stubDeleteBottom = sinon.stub(MainContainer.prototype, 'deleteBottom');
			stubUpdateUserView = sinon.stub(MainContainer.prototype, 'updateUserView');
			cache.viewRegion.top = 300;
			cache.viewRegion.bottom = 700;
		});
		it("调整位置位于视图加载区域上部且高度增加", function() {
			posi = 10;
			diff = 50;
			cache.localRowPosi = 0;
			mainContainer.adaptRowHeightChange(posi, diff);
			expect(stubAddTop.called).toBe(true);
			expect(stubAddBottom.called).toBe(false);
			expect(stubDeleteTop.called).toBe(false);
			expect(stubDeleteBottom.called).toBe(true);
			expect(stubLoadRecorder.called).toBe(false);
			expect(cache.viewRegion.top).toBe(350);
			expect(cache.viewRegion.bottom).toBe(750);
			expect(cache.localRowPosi).toBe(0);
		});
		it("调整位置位于视图加载区域内部且高度增加", function() {
			posi = 300;
			diff = 50;
			cache.localRowPosi = 1000;
			mainContainer.adaptRowHeightChange(posi, diff);
			expect(stubAddTop.called).toBe(false);
			expect(stubAddBottom.called).toBe(false);
			expect(stubDeleteTop.called).toBe(false);
			expect(stubDeleteBottom.called).toBe(true);
			expect(stubLoadRecorder.called).toBe(true);
			expect(cache.viewRegion.top).toBe(300);
			expect(cache.viewRegion.bottom).toBe(750);
			expect(cache.localRowPosi).toBe(1050);
		});
		it("调整位置位于视图加载区域下部且高度增加", function() {
			posi = 800;
			diff = 50;
			mainContainer.adaptRowHeightChange(posi, diff);
			expect(stubAddTop.called).toBe(false);
			expect(stubAddBottom.called).toBe(false);
			expect(stubDeleteTop.called).toBe(false);
			expect(stubDeleteBottom.called).toBe(false);
			expect(cache.viewRegion.top).toBe(300);
			expect(cache.viewRegion.bottom).toBe(700);
		});
		it("调整位置位于视图加载区域上部且高度减小", function() {
			posi = 100;
			diff = -50;
			mainContainer.adaptRowHeightChange(posi, diff);
			expect(stubAddTop.called).toBe(false);
			expect(stubAddBottom.called).toBe(true);
			expect(stubDeleteTop.called).toBe(true);
			expect(stubDeleteBottom.called).toBe(false);
			expect(cache.viewRegion.top).toBe(250);
			expect(cache.viewRegion.bottom).toBe(650);
		});
		it("调整位置位于视图加载区域内部且高度减小", function() {
			posi = 350;
			diff = -50;
			mainContainer.adaptRowHeightChange(posi, diff);
			expect(stubAddTop.called).toBe(false);
			expect(stubAddBottom.called).toBe(true);
			expect(stubDeleteTop.called).toBe(false);
			expect(stubDeleteBottom.called).toBe(false);
			expect(cache.viewRegion.top).toBe(300);
			expect(cache.viewRegion.bottom).toBe(650);
			posi = 601;
			diff = -50;
			mainContainer.adaptRowHeightChange(posi, diff);
			expect(cache.viewRegion.top).toBe(300);
			expect(cache.viewRegion.bottom).toBe(600);
			posi = 300;
			diff = -50;
			mainContainer.adaptRowHeightChange(posi, diff);
			expect(cache.viewRegion.top).toBe(300);
			expect(cache.viewRegion.bottom).toBe(550);
		});
		it("调整位置位于视图加载区域下部且高度减小", function() {
			posi = 850;
			diff = -50;
			mainContainer.adaptRowHeightChange(posi, diff);
			expect(stubAddTop.called).toBe(false);
			expect(stubAddBottom.called).toBe(false);
			expect(stubDeleteTop.called).toBe(false);
			expect(stubDeleteBottom.called).toBe(false);
			expect(cache.viewRegion.top).toBe(300);
			expect(cache.viewRegion.bottom).toBe(700);
		});
		afterEach(function() {
			stubAddTop.restore();
			stubAddBottom.restore();
			stubDeleteTop.restore();
			stubDeleteBottom.restore();
			stubUpdateUserView.restore();
		});
		afterAll(function() {
			stubInit.restore();
			stubLoadRecorder.restore();
		});
	});

});