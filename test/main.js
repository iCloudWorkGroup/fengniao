requirejs.config({
	baseUrl: '../js',
});
requirejs(['../test/unit/texttype.spec'],function() {
	//加载测试模块
	window.onload();
});
