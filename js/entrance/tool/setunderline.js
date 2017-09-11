define(function(require) {
	'use strict';
	var Backbone = require('lib/backbone'),
		send = require('basic/tools/send'),
		config = require('spreadsheet/config'),
		history = require('basic/tools/history'),
		gridCols = require('collections/headItemCol'),
		gridRows = require('collections/headItemRow'),
		selects = require('collections/selectRegion'),
		cells = require('collections/cells'),
		cache = require('basic/tools/cache'),
		parse = require('basic/tools/getoperregion'),
		rowOper = require('entrance/row/rowoperation'),
		colOper = require('entrance/col/coloperation'),
		gridColList = gridCols.models,
		gridRowList = gridRows.models;

	var result = {
		set: function(sheetId, underline, region) {
			var operRegion,
				selectCell,
				oldModelList = [];

			if (typeof sheetId === 'boolean') {
				region = underline;
				underline = sheetId;
			}
			if (cache.protectState) {
				Backbone.trigger('event:showMsgBar:show', '保护状态，不能进行该操作');
				return;
			}
			if (typeof underline !== 'boolean') {
				region = underline;
			}

			this._destroyClipRegion();

			region = parse(region);
			operRegion = region.operRegion;

			if (typeof underline === 'undefined') {
				//暂时使用左上角单元格的值，实现初始选中点时，使用初始选中点
				selectCell = cells.getCellByVertical(operRegion.startColIndex, operRegion.startRowIndex)[0];
				if (selectCell && selectCell.get('content').underline) {
					underline = 0;
				} else {
					underline = 1;
				}
			}

			if (operRegion.endRowIndex === 'MAX') {
				colOper.colPropOper(operRegion.startColIndex, 'content.underline', underline);
			} else if (operRegion.endColIndex === 'MAX') {
				rowOper.rowPropOper(operRegion.startRowIndex, 'content.underline', underline);
			} else {
				cells.oprCellsByRegion(operRegion, function(cell, colSort, rowSort) {
					var temp;
					if ((temp = cell.get('content').underline) !== underline) {
						oldModelList.push({
							colSort: colSort,
							rowSort: rowSort,
							value: temp
						});
						cell.set('content.underline', underline);
					}
				});
				this._history('content.underline', underline, operRegion, oldModelList);
			}
			this._send(region.sendRegion, underline);
		},
		_history: function(prop, value, region, oldList) {
			history.addUpdateAction(prop, value, {
				startColSort: gridColList[region.startColIndex].get('sort'),
				startRowSort: gridRowList[region.startRowIndex].get('sort'),
				endColSort: gridColList[region.endColIndex].get('sort'),
				endRowSort: gridRowList[region.endRowIndex].get('sort')
			}, oldList);
		},
		_destroyClipRegion: function() {
			var clip = selects.getModelByType('clip');
			if (clip) {
				cache.clipState = 'null';
				clip.destroy();
			}
		},
		_send: function(region, underline) {
			send.PackAjax({
				url: config.url.cell.underline,
				data: JSON.stringify({
					coordinate: region,
					underline: underline
				})
			});
		}
	};
	return result;
});