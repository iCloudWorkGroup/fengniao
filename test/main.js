requirejs.config({
	baseUrl: '../../js',
	paths: {
		"excel": "./spreadsheet/spreadsheet",
	}
});
requirejs(['./lib/backbone',
	// '../test/unit/clipBoardTest',
	'../test/unit/reloadCellTest'], function() {
});