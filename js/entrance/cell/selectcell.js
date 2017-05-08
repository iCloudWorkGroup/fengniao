'use strict';
define(function(require) {
	var selectRegions = require('collections/selectRegion'),
		siderLineRows = require('collections/siderLineRow'),
		siderLineCols = require('collections/siderLineCol'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		analysisLabel = require('basic/tools/analysislabel'),
		cells = require('collections/cells');


	var selectCell = function(sheetId, label) {
		var select,
			region = {},
			startColIndex,
			startRowIndex,
			endColIndex,
			endRowIndex,
			headItemColList = headItemCols.models,
			headItemRowList = headItemRows.models,
			width = 0,
			height = 0,
			len, i;

		if (label !== undefined) {
			region = analysisLabel(label);
			region = cells.getFullOperationRegion(region);
		} else {
			select = selectRegions.getModelByType('selected');
			region.startColIndex = headItemCols.getIndexByAlias(select.get('wholePosi').startX);
			region.startRowIndex = headItemRows.getIndexByAlias(select.get('wholePosi').startY);
		}
		if (region.startColIndex < 0 ||
			region.startRowIndex < 0 ||
			region.endColIndex < 0 ||
			region.endRowIndex < 0) {
			return;
		}

		startColIndex = region.startColIndex;
		startRowIndex = region.startRowIndex;
		endColIndex = region.endColIndex;
		endRowIndex = region.endRowIndex;


		width = headItemColList[endColIndex].get('width') + headItemColList[endColIndex].get('left') - headItemColList[startColIndex].get('left');
		height = headItemRowList[endRowIndex].get('height') + headItemRowList[endRowIndex].get('top') - headItemRowList[startRowIndex].get('top');

		selectRegions.models[0].set({
			initPosi: {
				startX: startColIndex,
				startY: startRowIndex
			},
			mousePosi: {
				mouseX: endColIndex,
				mouseY: endRowIndex
			},
			physicsBox: {
				top: headItemRowList[startRowIndex].get('top'),
				left: headItemColList[startColIndex].get('left'),
				width: width - 1,
				height: height - 1
			},
			wholePosi: {
				startX: startColIndex,
				startY: startRowIndex,
				endX: endColIndex,
				endY: endRowIndex
			}
		});
		siderLineRows.models[0].set({
			top: headItemRowList[startRowIndex].get('top'),
			height: height - 1
		});
		siderLineCols.models[0].set({
			left: headItemColList[startColIndex].get('left'),
			width: width - 1

		});
		len = headItemRowList.length;

		for (i = 0; i < len; i++) {
			headItemRowList[i].set({
				activeState: false
			});
		}

		len = headItemColList.length;
		for (i = 0; i < len; i++) {
			headItemColList[i].set({
				activeState: false
			});
		}
		for (i = 0; i < endColIndex - startColIndex + 1; i++) {
			headItemColList[startColIndex + i].set({
				activeState: true
			});
		}
		for (i = 0; i < endRowIndex - startRowIndex + 1; i++) {
			headItemRowList[startRowIndex + i].set({
				activeState: true
			});
		}
	};
	return selectCell;
});