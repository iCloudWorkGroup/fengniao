'use strict';
define(function(require) {
	var original = require('basic/tools/original'),
		listener = require('basic/util/listener'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		setFontColor = require('entrance/tool/setfontcolor'),
		setFillColor = require('entrance/tool/setfillcolor'),
		setFontFamily = require('entrance/tool/setfontfamily'),
		setRowHeight = require('entrance/cell/setcellheight'),
		setColWidth = require('entrance/cell/setcellwidth'),
		mergeCell = require('entrance/tool/mergecell'),
		splitCell = require('entrance/tool/splitcell'),
		setCellContent = require('entrance/tool/setcellcontent'),
		setCellBorder = require('entrance/tool/setcellborder'),
		setFontSize = require('entrance/tool/setfontsize'),
		setFontWeight = require('entrance/tool/setfontweight'),
		setFontStyle = require('entrance/tool/setfontstyle'),
		setFrozen = require('entrance/sheet/setfrozen'),
		setAlign = require('entrance/tool/setalign'),
		mouseOpr = require('entrance/selectregion/datasourceregionoperation'),
		getPointByPosi = require('entrance/sheet/getpointbyposi'),
		setWordWrap = require('entrance/tool/setwordwrap'),
		getTextByCoordinate = require('entrance/cell/gettextbycoordinate'),
		adaptScreen = require('entrance/sheet/adaptscreen'),
		getFrozenState = require('entrance/sheet/getfrozenstate'),
		getSelectRegion = require('entrance/sheet/getselectregion'),
		reload = require('entrance/sheet/reload'),
		setTextType = require('entrance/tool/settexttype'),
		addRowModule = require('entrance/tool/addrow'),
		addColModule = require('entrance/tool/addcol'),
		deleteRow = require('entrance/tool/deleterow'),
		deleteCol = require('entrance/tool/deletecol'),
		regionDel = require('entrance/tool/regiondel'),
		colHide = require('entrance/col/colhide'),
		comment = require('entrance/tool/comment'),
		toolbar = require('basic/tools/bindtoolbar');


	var excelBuild = {
		buildExcelOriginalData: function(domId) {
			original.restoreExcel(domId);
		},
		buildExcelView: function(containerId) {
			var Screen = require('views/screen');
			new Screen(containerId);
		},
		buildExcelToolbar: function() {
			var ShearPlateContainer = require('widgets/clipboard/shearPlateContainer'),
				FontFamilyContainer = require('widgets/font/fontFamilyContainer'),
				FontSizeContainer = require('widgets/font/fontSizeContainer'),
				BorderContainer = require('widgets/celloperation/borderContainer'),
				FillColorContainer = require('widgets/celloperation/fillColorContainer'),
				FontColorContainer = require('widgets/font/fontColorContainer'),
				ContentAlignContainer = require('widgets/align/contentAlignContainer'),
				TextFormatContainer = require('widgets/cellformat/textFormatContainer'),
				MergeCellContainer = require('widgets/celloperation/mergeCellContainer'),
				ContentFontContainer = require('widgets/font/contentFontContainer'),
				FrozenContainer = require('widgets/frozen/frozenContainer'),
				InsertOperation = require('widgets/insert/insertoperation'),
				DeleteOperation = require('widgets/delete/deleteoperation'),
				CommentContainer = require('widgets/celloperation/commentcontainer'),
				WordWrapContainer = require('widgets/celloperation/wordwrapcontainer'),
				ColHide = require('widgets/hidecol/colhidecontainer'),
				RegionDelContainer = require('widgets/celldel/regiondel'),
				UndoredoContainer = require('widgets/undoredo/undoredocontainer');
			new ShearPlateContainer();
			new FontFamilyContainer();
			new FontSizeContainer();
			new BorderContainer();
			new FillColorContainer();
			new FontColorContainer();
			new ContentAlignContainer();
			new TextFormatContainer();
			new MergeCellContainer();
			new ContentFontContainer();
			new FrozenContainer();
			new CommentContainer();
			new InsertOperation();
			new DeleteOperation();
			new WordWrapContainer();
			new RegionDelContainer();
			new ColHide();
			new UndoredoContainer();
			toolbar.init(config.toolbarId);

		},
		buildExcelPublicAPI: function(SpreadSheet) {
			SpreadSheet.prototype.setFontColor = setFontColor;
			SpreadSheet.prototype.setFillColor = setFillColor;
			SpreadSheet.prototype.setFontFamily = setFontFamily;

			SpreadSheet.prototype.mergeCell = mergeCell;
			SpreadSheet.prototype.splitCell = splitCell;
			SpreadSheet.prototype.setCellBorder = setCellBorder;
			SpreadSheet.prototype.setCellContent = setCellContent;
			SpreadSheet.prototype.setAlign = setAlign;

			SpreadSheet.prototype.setColWidth = setColWidth;
			SpreadSheet.prototype.setRowHeight = setRowHeight;

			SpreadSheet.prototype.setFontSize = setFontSize;
			SpreadSheet.prototype.setFontStyle = setFontStyle;
			SpreadSheet.prototype.setFontWeight = setFontWeight;

			SpreadSheet.prototype.frozen = function(sheetId, point) {
				setFrozen(sheetId, point);
			};
			SpreadSheet.prototype.colFrozen = function() {
				setFrozen('temp', null, 'col');
			};
			SpreadSheet.prototype.rowFrozen = function() {
				setFrozen('temp', null, 'row');
			};
			SpreadSheet.prototype.unFrozen = function() {
				setFrozen('temp', null, 'unfrozen');
			};
			SpreadSheet.prototype.setNormalType = setTextType.setNormal.bind(setTextType);
			SpreadSheet.prototype.setTextType = setTextType.setText.bind(setTextType);
			SpreadSheet.prototype.setNumType = setTextType.setNum.bind(setTextType);
			SpreadSheet.prototype.setDateType = setTextType.setDate.bind(setTextType);
			SpreadSheet.prototype.setPercentType = setTextType.setPercent.bind(setTextType);
			SpreadSheet.prototype.setCoinType = setTextType.setCurrency.bind(setTextType);

			SpreadSheet.prototype.modifyComment = comment.modifyComment.bind(comment);
			SpreadSheet.prototype.createAddCommentView = comment.createAddCommentView.bind(comment);
			SpreadSheet.prototype.createEditCommentView = comment.createEditComment.bind(comment);
			SpreadSheet.prototype.deleteComment = comment.deleteComment.bind(comment);

			SpreadSheet.prototype.getPointByPosi = getPointByPosi;
			SpreadSheet.prototype.adaptScreen = adaptScreen;
			SpreadSheet.prototype.getTextByCoordinate = getTextByCoordinate;
			SpreadSheet.prototype.getFrozenState = getFrozenState;
			SpreadSheet.prototype.setWordWrap = setWordWrap;
			SpreadSheet.prototype.getSelectRegion = getSelectRegion;
			SpreadSheet.prototype.reload = reload;

			SpreadSheet.prototype.addRow = addRowModule.add.bind(addRowModule);
			SpreadSheet.prototype.addCol = addColModule.add.bind(addColModule);
			SpreadSheet.prototype.deleteRow = deleteRow.deleteRow.bind(deleteRow);
			SpreadSheet.prototype.deleteCol = deleteCol.deleteCol.bind(deleteCol);
			SpreadSheet.prototype.regionDel = regionDel;

			SpreadSheet.prototype.colHide = colHide.hide.bind(colHide);
			SpreadSheet.prototype.colCancelHide = colHide.cancelHide.bind(colHide);

		},
		buildDataSourceOperation: function(SpreadSheet) {
			SpreadSheet.prototype.setDataSourceState = mouseOpr.setDataSourceState;
			SpreadSheet.prototype.setSelectState = mouseOpr.setSelectState;
			SpreadSheet.prototype.destroyDataSoure = mouseOpr.destroyDataSoure;
		},
		buildExcelEventListener: function(SpreadSheet) {
			SpreadSheet.prototype.addEventListener = listener.addEventListener;
			SpreadSheet.prototype.removeEventListener = listener.removeEventListener;
		},
		buildExcelExtend: function(SpreadSheet) {
			var highlight = require('extension/highlight');
			SpreadSheet.prototype.startHighlight = highlight.startHighlight;
			SpreadSheet.prototype.stopHighlight = highlight.stopHighlight;
			SpreadSheet.prototype.getHighlightDirection = highlight.getHighlightDirection;
		}
	};
	return excelBuild;
});