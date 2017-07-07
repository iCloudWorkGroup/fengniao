'use strict';
define(function(require) {
	var Backbone = require('lib/backbone'),
		history = require('basic/tools/history'),
		cache = require('basic/tools/cache'),
		binary = require('basic/util/binary'),
		send = require('basic/tools/send'),
		config = require('spreadsheet/config'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		cells = require('collections/cells'),
		redoUndo;

	redoUndo = {
		redo: function() {
			var headItemRowList = headItemRows.models,
				headItemColList = headItemCols.models,
				action = history.next(),
				cellList = cells.models,
				originalModelIndexs,
				currentModelIndexs,
				startColIndex,
				startRowIndex,
				endColIndex,
				endRowIndex,
				propValue,
				propName,
				region,
				occupyCol,
				occupyRow,
				occupyColLen,
				occupyRowLen,
				index,
				len,
				i, j, k;

			if (!action) {
				return;
			}
			if (action.type === 'update') {
				propName = action.propName;
				propValue = action.propValue;
				region = action.region;
				startColIndex = binary.indexAttrBinary(region.startColSort, headItemColList, 'sort');
				startRowIndex = binary.indexAttrBinary(region.startRowSort, headItemRowList, 'sort');
				endColIndex = binary.indexAttrBinary(region.endColSort, headItemColList, 'sort');
				endRowIndex = binary.indexAttrBinary(region.endRowSort, headItemRowList, 'sort');
				cells.oprCellsByRegion({
					startColIndex: startColIndex,
					startRowIndex: startRowIndex,
					endColIndex: endColIndex,
					endRowIndex: endRowIndex
				}, function(cell) {
					cell.set(propName, propValue);
				});
			} else {
				originalModelIndexs = action.originalModelIndexs;
				currentModelIndexs = action.currentModelIndexs;
				for (i = 0, len = originalModelIndexs.length; i < len; i++) {
					index = originalModelIndexs[i];
					cellList[index].set('isDestroy', true);
					occupyCol = cellList[index].get('occupy').x;
					occupyRow = cellList[index].get('occupy').y;
					for (j = 0, occupyColLen = occupyCol.length; j < occupyColLen; j++) {
						for (k = 0, occupyRowLen = occupyRow.length; k < occupyRowLen; k++) {
							cache.deletePosi(occupyRow[k], occupyCol[j]);
						}
					}
				}
				for (i = 0, len = currentModelIndexs.length; i < len; i++) {
					index =currentModelIndexs[i];
					cellList[index].set('isDestroy', false);
					Backbone.trigger('event:contentCellsContainer:restoreCell', cellList[index]);
					occupyCol = cellList[index].get('occupy').x;
					occupyRow = cellList[index].get('occupy').y;
					for (j = 0, occupyColLen = occupyCol.length; j < occupyColLen; j++) {
						for (k = 0, occupyRowLen = occupyRow.length; k < occupyRowLen; k++) {
							cache.cachePosition(occupyRow[k], occupyCol[j],index);
						}
					}
				}
			}
			this.sendData(config.url.sheet.redo);
		},
		undo: function() {
			var headItemRowList = headItemRows.models,
				headItemColList = headItemCols.models,
				action = history.previous(),
				cellList = cells.models,
				originalModelIndexs,
				currentModelIndexs,
				originalData,
				propName,
				tempModel,
				colIndex,
				rowIndex,
				occupyCol,
				occupyRow,
				occupyColLen,
				occupyRowLen,
				index,
				len,
				i, j, k;

			if (!action) {
				return;
			}
			if (action.type === 'update') {
				originalData = action.originalData;
				propName = action.propName;
				for (i = 0, len = originalData.length; i < len; i++) {
					colIndex = binary.indexAttrBinary(originalData[i].colSort, headItemColList, 'sort');
					rowIndex = binary.indexAttrBinary(originalData[i].rowSort, headItemRowList, 'sort');
					tempModel = cells.getCellByVertical(colIndex, rowIndex)[0];
					if (typeof tempModel !== 'undefined') {
						tempModel.set(propName, originalData[i].value);
					}
				}
			} else {
				originalModelIndexs = action.originalModelIndexs;
				currentModelIndexs = action.currentModelIndexs;
				for (i = 0, len = currentModelIndexs.length; i < len; i++) {
					index =currentModelIndexs[i];
					cellList[index].set('isDestroy', true);
					occupyCol = cellList[index].get('occupy').x;
					occupyRow = cellList[index].get('occupy').y;
					for (j = 0, occupyColLen = occupyCol.length; j < occupyColLen; j++) {
						for (k = 0, occupyRowLen = occupyRow.length; k < occupyRowLen; k++) {
							cache.deletePosi(occupyRow[k], occupyCol[j]);
						}
					}
				}
				for (i = 0, len = originalModelIndexs.length; i < len; i++) {
					index =originalModelIndexs[i];
					cellList[index].set('isDestroy', false);
					Backbone.trigger('event:contentCellsContainer:restoreCell', cellList[index]);
					occupyCol = cellList[index].get('occupy').x;
					occupyRow = cellList[index].get('occupy').y;
					for (j = 0, occupyColLen = occupyCol.length; j < occupyColLen; j++) {
						for (k = 0, occupyRowLen = occupyRow.length; k < occupyRowLen; k++) {
							cache.cachePosition(occupyRow[k], occupyCol[j],index);
						}
					}
				}
			}
			this.sendData(config.url.sheet.undo);
		},
		sendData: function(url) {
			send.PackAjax({
				url: url,
			});
		}
	}
	return redoUndo;
});