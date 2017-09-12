define(function(require) {
	'use strict';
	var Backbone = require('lib/backbone'),
		send = require('basic/tools/send'),
		config = require('spreadsheet/config'),
		cache = require('basic/tools/cache'),
		cells = require('collections/cells'),
		history = require('basic/tools/history'),
		cols = require('collections/headItemCol'),
		rows = require('collections/headItemRow'),
		selects = require('collections/selectRegion'),
		getOperRegion = require('basic/tools/getoperregion'),
		rowList = rows.models,
		colList = cols.models,
		protect;

	protect = {
		lock: function(sheetId, arrOper) {
			if (typeof arrOper === 'undefined') {
				arrOper = sheetId;
			}
			this._toggle(true, arrOper);
		},
		unlock: function(sheetId, arrOper) {
			if (typeof arrOper === 'undefined') {
				arrOper = sheetId;
			}
			this._toggle(false, arrOper);
		},
		_toggle: function(lock, arrOper) {
			var clip,
				region,
				operRegion,
				sendRegion,
				cellList = [],
				i, len1, j, len2,
				tempCell,
				tempArr = [],
				tempLock;

			if (cache.protectState) {
				Backbone.trigger('event:showMsgBar:show', '保护状态，不能进行该操作');
				return;
			}

			if (clip = selects.getModelByType('clip')) {
				cache.clipState = 'null';
				clip.destroy();
			}

			region = getOperRegion(arrOper);

			operRegion = region.operRegion;
			sendRegion = region.sendRegion;
			//整行操作或多行操作
			if (operRegion.endColIndex === 'MAX') {
				//筛选出已经进行设置过的锁定列
				for (i = 0, len1 = colList.length; i < len1; i++) {
					if (typeof(tempLock = colList[i].get('operProp').locked) === 'boolean' && tempLock !== lock) {
						tempArr.push(i);
					}
				}
				for (i = operRegion.startRowIndex, len1 = operRegion.endRowIndex + 1; i < len1; i++) {
					rowList[i].set('operProp.locked', lock);
					//交叉位置创建单元格
					for (j = 0, len2 = tempArr.length; j < len2; j++) {
						tempCell = cells.createCellModel(tempArr[j], i);
						tempCell.set('locked', lock);
					}
				}
				cellList = cells.getCellByVertical(operRegion);
				for (i = 0, len1 = cellList.length; i < len1; i++) {
					cellList[i].set('locked', lock);
				}
				//整列或多列操作
			} else if (operRegion.endRowIndex === 'MAX') {
				for (i = 0, len2 = rowList.length; i < len2; i++) {
					if (typeof(tempLock = rowList[i].get('operProp').locked) === 'boolean' && tempLock !== lock) {
						tempArr.push(i);
					}
				}
				for (i = operRegion.startColIndex, len1 = operRegion.endColIndex + 1; i < len1; i++) {
					colList[i].set('operProp.locked', lock);
					//交叉位置创建单元格
					for (j = 0, len2 = tempArr.length; j < len2; j++) {
						tempCell = cells.createCellModel(i, tempArr[j]);
						tempCell.set('locked', lock);
					}
				}
				cellList = cells.getCellByVertical(operRegion);
				for (i = 0, len1 = cellList.length; i < len1; i++) {
					cellList[i].set('locked', lock);
				}
			} else {
				if (lock) {
					cellList = cells.getCellByVertical(operRegion);
					for (i = 0, len1 = cellList.length; i < len1; i++) {
						cellList[i].set('locked', lock);
					}
				} else {
					cells.oprCellsByRegion(operRegion, function(cell) {
						cell.set('locked', lock);
					});
				}
			}

			send.PackAjax({
				url: config.url.cell.lock,
				data: JSON.stringify({
					coordinate: [sendRegion],
					lock: lock
				})
			});

		},
		execute: function(pwd) {
			history.clear();
			cache.protectState = true;
			send.PackAjax({
				url: config.url.sheet.protect,
				data: JSON.stringify({
					password: pwd,
					protect: true
				})
			});
		},
		cancel: function(pwd) {
			var result;
			send.PackAjax({
				url: config.url.sheet.protect,
				data: JSON.stringify({
					password: pwd,
					protect: false
				}),
				success: this._toggleProtectState
			});
			return result;
		},
		_toggleProtectState: function(data) {
			if (data.returndata) {
				history.clear();
				cache.protectState = false;
			}
		},
		interceptor: function(region) {
			if (!cache.protectState) {
				return false;
			}
			var startColIndex = region.startColIndex,
				endColIndex = region.endColIndex || region.startColIndex,
				startRowIndex = region.startRowIndex,
				endRowIndex = region.endRowIndex || region.startRowIndex,
				strandX = cache.CellsPosition.strandX,
				cellList = cells.models,
				temp = {},
				index, colLock, rowLock,
				i, j,
				rowAlias, colAlias;

			if (endColIndex === 'MAX' || endRowIndex === 'MAX') {
				return true;
			}
			for (i = startColIndex; i < endColIndex + 1; i++) {
				colAlias = colList[i].get('alias');
				colLock = colList[i].get('operProp').locked;
				for (j = startRowIndex; j < endRowIndex + 1; j++) {
					rowAlias = rowList[j].get('alias');
					rowLock = rowList[j].get('operProp').locked;
					if (strandX[colAlias] &&
						typeof(index = strandX[colAlias][rowAlias]) !== 'undefined') {
						if (temp[index]) {
							continue;
						}
						if (cellList[index].get('locked')) {
							return true;
						}
						temp[index] = true;
					} else if (colLock === true || rowLock === true) {
						return true;
					} else if (typeof colLock === 'undefined' && typeof rowLock === 'undefined') {
						return true;
					}
				}
			}
			return false;
		},
		showLockContainer: function() {
			if(cache.protectState){
				Backbone.trigger('event:showMsgBar:show','保护状态，不能进行该操作');
				return;
			}
			Backbone.trigger('event:sidebarContainer:show', 'lock');
		},
		showProtectContainer: function() {
			Backbone.trigger('event:sidebarContainer:show', 'protect');
		}
	};
	return protect;
});