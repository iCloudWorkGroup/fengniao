requirejs.config({
	baseUrl: '../js',
});
requirejs([
	//'./lib/backbone',
	// '../test/unit/clipBoardTest',
	// '../test/unit/reloadCellTest',
	// '../test/unit/wordWrapTest',
	// '../test/unit/texttype.spec',
	// '../test/unit/commentspec',
	//'../test/unit/row.spec',
	//'../test/unit/rowoper.spec.js',
	// '../test/unit/col.spec',
	// '../test/unit/loadrecorder.spec'
	'../test/unit/maintainer.spec',
	'../test/unit/fillbg.spec',
	'../test/unit/underline.spec',
	'../test/unit/calselect.spec'
], function() {
	window.onload();
});