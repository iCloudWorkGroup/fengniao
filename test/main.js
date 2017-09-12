requirejs.config({
	baseUrl: '../js',
	paths:{
		'build' : '../test/util/build'
	}
});
requirejs([
	'../test/unit/build.spec',
	'../test/unit/fillbg.spec',
	'../test/unit/loadrecorder.spec',
	'../test/unit/maintainer.spec',
	'../test/unit/protect.spec',
	'../test/unit/texttype.spec',
	'../test/unit/shortcut.spec',
	'../test/unit/underline.spec',

], function() {
	window.onload();
});