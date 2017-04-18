'use strict';
define(function(require) {
	var original = require('basic/tools/original'),
		domloader = require('basic/tools/template'),
		listener = require('basic/util/listener'),
		cache = require('basic/tools/cache'),
		setFontColor = require('entrance/tool/setfontcolor'),
		setFillColor = require('entrance/tool/setfillcolor'),
		setFontFamily = require('entrance/tool/setfontfamily'),
		setCellHeight = require('entrance/cell/setcellheight'),
		setCellWidth = require('entrance/cell/setcellwidth'),
		selectCell = require('entrance/cell/selectcell'),
		mergeCell = require('entrance/tool/mergecell'),
		splitCell = require('entrance/tool/splitcell'),
		setCellContent = require('entrance/tool/setcellcontent'),
		selectCellCols = require('entrance/cell/selectcellcols'),
		selectCellRows = require('entrance/cell/selectcellrows'),
		setCellBorder = require('entrance/tool/setcellborder'),
		setFontSize = require('entrance/tool/setfontsize'),
		setFontWeight = require('entrance/tool/setfontweight'),
		setFontStyle = require('entrance/tool/setfontstyle'),
		setFrozen = require('entrance/sheet/setfrozen'),
		setAlign = require('entrance/tool/setalign'),
		operationDataSourceRegion = require('entrance/selectregion/datasourceregionoperation'),
		getPointByPosi = require('entrance/sheet/getpointbyposi'),
		setWordWrap = require('entrance/tool/setwordwrap'),
		getTextByCoordinate = require('entrance/cell/gettextbycoordinate'),
		adaptScreen = require('entrance/sheet/adaptscreen'),
		getFrozenState = require('entrance/sheet/getfrozenstate'),
		getSelectRegion = require('entrance/sheet/getselectregion'),
		highlight = require('entrance/extention/highlight'),
		reloadCells = require('entrance/cell/reloadcells'),
		setTextType = require('entrance/tool/settexttype'),
		addRow = require('entrance/tool/addrow'),
		addCol = require('entrance/tool/addcol'),
		deleteRow = require('entrance/tool/deleterow'),
		deleteCol = require('entrance/tool/deletecol'),
		regionDel = require('entrance/tool/regiondel'),
		colHide = require('entrance/col/colhide'),
		clipSelectOperate = require('entrance/tool/clipselectoperate'),
		clipPasteOperate = require('entrance/tool/clippasteoperate'),
		comment = require('entrance/tool/comment');


	var excelBuild = {
		buildDom: function(id) {
			domloader(id);
		},
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
		},
		buildExcelPublicAPI: function(SpreadSheet) {
			SpreadSheet.prototype.setFontColor = setFontColor;
			SpreadSheet.prototype.setFillColor = setFillColor;
			SpreadSheet.prototype.setFontFamily = setFontFamily;
			SpreadSheet.prototype.setCellHeight = setCellHeight;
			SpreadSheet.prototype.selectCell = selectCell;
			SpreadSheet.prototype.mergeCell = mergeCell;
			SpreadSheet.prototype.splitCell = splitCell;
			SpreadSheet.prototype.setCellBorder = setCellBorder;
			SpreadSheet.prototype.setCellContent = setCellContent;
			SpreadSheet.prototype.setAlign = setAlign;
			SpreadSheet.prototype.selectCellCols = selectCellCols;
			SpreadSheet.prototype.selectCellRows = selectCellRows;
			SpreadSheet.prototype.setCellWidth = setCellWidth;
			SpreadSheet.prototype.setFontSize = setFontSize;
			SpreadSheet.prototype.setFontStyle = setFontStyle;
			SpreadSheet.prototype.setFontWeight = setFontWeight;
			SpreadSheet.prototype.setFrozen = setFrozen;

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
			SpreadSheet.prototype.reloadCells = reloadCells;

			SpreadSheet.prototype.clipSelectOperate = function(type) {
				clipSelectOperate(type);
			};
			SpreadSheet.prototype.clipPasteOperate = function() {
				if (cache.clipState === "null") {
					return;
				}
				clipPasteOperate();
			}

			SpreadSheet.prototype.addRow = addRow;
			SpreadSheet.prototype.addCol = addCol;
			SpreadSheet.prototype.deleteRow = deleteRow;
			SpreadSheet.prototype.deleteCol = deleteCol;
			SpreadSheet.prototype.regionDel = regionDel;
			SpreadSheet.prototype.clearQueue = function() {
				cache.sendQueueStep = 0;
			};
			SpreadSheet.prototype.getLastStep = function() {
				return cache.sendQueueStep;
			};
			SpreadSheet.prototype.colHide = colHide.hide.bind(colHide);
			SpreadSheet.prototype.colCancelHide = colHide.cancelHide.bind(colHide);

		},
		buildDataSourceOperation: function(SpreadSheet) {
			SpreadSheet.prototype.setDataSourceRegion = operationDataSourceRegion.setDataSourceRegion;
			SpreadSheet.prototype.setSelectRegion = operationDataSourceRegion.setSelectRegion;
			SpreadSheet.prototype.destroyDataSoureRegion = operationDataSourceRegion.destroyDataSoureRegion;
		},
		buildExcelEventListener: function(SpreadSheet) {
			SpreadSheet.prototype.addEventListener = listener.addEventListener;
			SpreadSheet.prototype.removeEventListener = listener.removeEventListener;
		},
		buildExcelExtend: function(SpreadSheet) {
			SpreadSheet.prototype.startHighlight = highlight.startHighlight;
			SpreadSheet.prototype.stopHighlight = highlight.stopHighlight;
			SpreadSheet.prototype.getHighlightDirection = highlight.getHighlightDirection;
		}
	};
	return excelBuild;
});