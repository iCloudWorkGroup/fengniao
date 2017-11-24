'use strict';
define(function(require) {
	var Backbone = require('lib/backbone'),
		history = require('basic/tools/history'),
		cache = require('basic/tools/cache'),
		send = require('basic/tools/send'),
		config = require('spreadsheet/config'),
		cols = require('collections/headItemCol'),
		rows = require('collections/headItemRow'),
		cells = require('collections/cells'),
		strandMap = require('basic/tools/strandmap'),
		selectValidate = require('basic/tools/selectvalidate'),
		selects = require('collections/selectRegion'),
		rowList = rows.models,
		colList = cols.models,
		cellList = cells.models,
		redoUndo;

	redoUndo = {
		redo: function() {
			var action = history.next(),
				prefix = '_redo',
				handler,
				i, len;

			if (!action) {
				return;
			}
			if (typeof action === 'object' &&
				Object.prototype.toString.call(action) !== '[object Array]') {
				action = [action];
			}
			for (i = 0, len = action.length; i < len; i++) {
				handler = prefix + action[i].type[0].toUpperCase() + action[i].type.substring(1);
				if (this[handler]) {
					this[handler](action[i]);
				}
			}
			this.sendData(config.url.sheet.redo);
		},
		undo: function() {
			var action = history.previous(),
				prefix = '_undo',
				handler,
				i, len;


			if (!action) {
				return;
			}
			if (typeof action === 'object' &&
				Object.prototype.toString.call(action) !== '[object Array]') {
				action = [action];
			}
			for (i = 0, len = action.length; i < len; i++) {
				handler = prefix + action[i].type[0].toUpperCase() + action[i].type.substring(1);
				if (this[handler]) {
					this[handler](action[i]);
				}
			}
			this.sendData(config.url.sheet.undo);
		},
		_redoUpdateCellProp: function(action) {
			var propName = action.propName,
				propValue = action.propValue,
				region = action.region,
				startColIndex,
				startRowIndex,
				endColIndex,
				endRowIndex;

			startColIndex = cols.getIndexBySort(region.startColSort);
			startRowIndex = rows.getIndexBySort(region.startRowSort);
			endColIndex = cols.getIndexBySort(region.endColSort);
			endRowIndex = rows.getIndexBySort(region.endRowSort);

			cells.oprCellsByRegion({
				startColIndex: startColIndex,
				startRowIndex: startRowIndex,
				endColIndex: endColIndex,
				endRowIndex: endRowIndex
			}, function(cell) {
				cell.set(propName, propValue);
			});
		},
		_redoCoverCellModel: function(action) {
			var originalModelIndexs = action.originalModelIndexs,
				currentModelIndexs = action.currentModelIndexs,
				occupyCol, occupyRow,
				occupyColLen, occupyRowLen,
				index, len, i, j ,k;

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
				index = currentModelIndexs[i];
				cellList[index].set('isDestroy', false);
				Backbone.trigger('event:contentCellsContainer:restoreCell', cellList[index]);
				occupyCol = cellList[index].get('occupy').x;
				occupyRow = cellList[index].get('occupy').y;
				for (j = 0, occupyColLen = occupyCol.length; j < occupyColLen; j++) {
					for (k = 0, occupyRowLen = occupyRow.length; k < occupyRowLen; k++) {
						cache.cachePosition(occupyRow[k], occupyCol[j], index);
					}
				}
			}
		},
		_redoUpdateValidateRule: function(action) {
			var region = action.region,
				ruleIndex = action.currentRuleIndex,
				startRowIndex = rows.getIndexBySort(region.startRowSort),
				startColIndex = cols.getIndexBySort(region.startColSort),
				endRowIndex = rows.getIndexBySort(region.endRowSort),
				endColIndex = cols.getIndexBySort(region.endColSort),
				select,
				i, j;

			for (i = startColIndex; i < endColIndex + 1; i++) {
				for (j = startRowIndex; j < endRowIndex + 1; j++) {
					strandMap.addPointRecord(colList[i].get('alias'), rowList[j].get('alias'), 'validate', ruleIndex);
				}
			}
			select = selects.getModelByType('selected');
			selectValidate.set(strandMap.calcPointRecord(select.get('wholePosi').startX, select.get('wholePosi').startY, 'validate'));
		},
		_redoCoverValidateRule: function(action) {
			var currentData = action.currentData,
				originalData = action.originalData,
				i, len;
			for (i = 0, len = originalData.length; i < len; i++) {
				strandMap.deletePointRecord(originalData[i].colAlias, originalData[i].rowAlias, 'validate');
			}
			for (i = 0, len = currentData.length; i < len; i++) {
				strandMap.addPointRecord(currentData[i].colAlias, currentData.colAlias[i], 'validate', currentData[i].index);
			}
		},
		_undoUpdateCellProp: function(action) {
			var originalData = action.originalData,
				propName = action.propName,
				tempModel,
				colIndex,
				rowIndex,
				len, i;

			for (i = 0, len = originalData.length; i < len; i++) {
				colIndex = cols.getIndexBySort(originalData[i].colSort);
				rowIndex = rows.getIndexBySort(originalData[i].rowSort);
				tempModel = cells.getCellByVertical(colIndex, rowIndex)[0];
				if (typeof tempModel !== 'undefined') {
					tempModel.set(propName, originalData[i].value);
				}
			}
		},
		_undoCoverCellModel: function(action) {
			var originalModelIndexs = action.originalModelIndexs,
				currentModelIndexs = action.currentModelIndexs,
				occupyCol, occupyRow,
				occupyColLen, occupyRowLen,
				len, i, j, k,
				index;

			for (i = 0, len = currentModelIndexs.length; i < len; i++) {
				index = currentModelIndexs[i];
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
				index = originalModelIndexs[i];
				cellList[index].set('isDestroy', false);
				Backbone.trigger('event:contentCellsContainer:restoreCell', cellList[index]);
				occupyCol = cellList[index].get('occupy').x;
				occupyRow = cellList[index].get('occupy').y;
				for (j = 0, occupyColLen = occupyCol.length; j < occupyColLen; j++) {
					for (k = 0, occupyRowLen = occupyRow.length; k < occupyRowLen; k++) {
						cache.cachePosition(occupyRow[k], occupyCol[j], index);
					}
				}
			}
		},
		_undoUpdateValidateRule: function(action) {
			var originalData = action.originalData,
				select,
				colIndex,
				rowIndex,
				ruleIndex,
				i, len;
			for (i = 0, len = originalData.length; i < len; i++) {
				rowIndex = rows.getIndexBySort(originalData[i].rowSort);
				colIndex = cols.getIndexBySort(originalData[i].colSort);
				ruleIndex = originalData[i].originalIndex;
				if (ruleIndex !== undefined) {
					strandMap.addPointRecord(colList[colIndex].get('alias'), rowList[rowIndex].get('alias'), 'validate', ruleIndex);
				} else {
					strandMap.deletePointRecord(colList[colIndex].get('alias'), rowList[rowIndex].get('alias'), 'validate');
				}
			}
			select = selects.getModelByType('selected');
			selectValidate.set(strandMap.calcPointRecord(select.get('wholePosi').startX, select.get('wholePosi').startY, 'validate'));
		},
		_undoCoverValidateRule: function(action) {
			var currentData = action.currentData,
				originalData = action.originalData,
				i, len;

			for (i = 0, len = currentData.length; i < len; i++) {
				strandMap.deletePointRecord(currentData[i].colAlias, currentData[i].colAlias, 'validate');
			}
			for (i = 0, len = originalData.length; i < len; i++) {
				strandMap.addPointRecord(originalData[i].colAlias, originalData.rowAlias[i], 'validate', originalData[i].index);
			}

		},
		sendData: function(url) {
			send.PackAjax({
				url: url
			});
		}
	};
	return redoUndo;
});