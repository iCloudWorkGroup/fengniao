define(function(require) {
	'use strict';
	var $ = require('lib/jquery'),
		config = require('spreadsheet/config'),
		cache = require('basic/tools/cache'),
		Point = require('basic/tools/point'),
		excelBuild = require('spreadsheet/excelbuild');

	function SpreadSheet(id) {
		if (!document.getElementById(id)) {
			throw new Error('未找到id为' + id + '容器');
		}
		cache.containerId = id;
		excelBuild.buildExcelOriginalData(id);
		excelBuild.buildExcelView(id);
		excelBuild.buildExcelToolbar();
		excelBuild.buildExcelPublicAPI(SpreadSheet);
		excelBuild.buildDataSourceOperation(SpreadSheet);
		excelBuild.buildExcelEventListener(SpreadSheet);
		excelBuild.buildExcelExtend(SpreadSheet);

	}
	SpreadSheet.Point = Point;
	return SpreadSheet;
});