'use strict';
define(function(require) {
	var send = require('basic/tools/send'),
		cells = require('collections/cells'),
		Backbone = require('lib/backbone'),
		config = require('spreadsheet/config'),
		selectRegions = require('collections/selectRegion'),
		getOperRegion = require('basic/tools/getoperregion'),
		history = require('basic/tools/history'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		rowOperate = require('entrance/row/rowoperation'),
		colOperate = require('entrance/col/coloperation'),
		cache = require('basic/tools/cache'),
		commentHandler;

	commentHandler = {
		removeClip: function() {
			var clip = selectRegions.getModelByType('clip');
			if (clip !== undefined) {
				cache.clipState = 'null';
				clip.destroy();
			}
		},
		modifyComment: function(sheetId, comment, label) {
			var clip,
				region,
				operRegion,
				sendRegion,
				headItemRowList = headItemRows.models,
				headItemColList = headItemCols.models,
				changeModelList = [];

			this.removeClip();
			region = getOperRegion(label);
			operRegion = region.operRegion;
			sendRegion = region.sendRegion;

			if (operRegion.startColIndex === -1 || operRegion.startRowIndex === -1) {
				if (comment === null) {
					this.sendData(sendRegion, null, config.url.cell.comment_del);
				} else {
					this.sendData(sendRegion, comment, config.url.cell.comment_plus);
				}
				return;
			}

			if (operRegion.endColIndex === 'MAX') { //整行操作
				rowOperate.rowPropOper(operRegion.startRowIndex, 'customProp.comment', comment);
			} else if (operRegion.endRowIndex === 'MAX') {
				colOperate.colPropOper(operRegion.startColIndex, 'customProp.comment', comment);
			} else {
				cells.operCellsByRegion(operRegion, function(cell, colSort, rowSort) {
					if (cell.get('customProp').comment !== comment) {
						changeModelList.push({
							colSort: colSort,
							rowSort: rowSort,
							value: cell.get('customProp').comment
						});
						cell.set('customProp.comment', comment);
					}
				});
				history.addUpdateAction('customProp.comment', comment, {
					startColSort: headItemColList[operRegion.startColIndex].get('sort'),
					startRowSort: headItemRowList[operRegion.startRowIndex].get('sort'),
					endColSort: headItemColList[operRegion.endColIndex].get('sort'),
					endRowSort: headItemRowList[operRegion.endRowIndex].get('sort')
				}, changeModelList);
			}
			if (comment === null) {
				this.sendData(sendRegion, null, config.url.cell.comment_del);
			} else {
				this.sendData(sendRegion, comment, config.url.cell.comment_plus);
			}
		},

		createAddCommentView: function(sheetId) {
			this.removeClip();
			Backbone.trigger('event:bodyContainer:handleComment', {
				'action': 'add',
			});
		},

		createEditComment: function(sheetId) {
			this.removeClip();
			Backbone.trigger('event:bodyContainer:handleComment', {
				'action': 'edit'
			});
		},

		deleteComment: function(sheetId, label) {
			this.removeClip();
			this.modifyComment('1', null, label);
			// comment_del
		},
		sendData: function(sendRegion, comment, url) {
			var data = {
				coordinate: sendRegion
			};
			if (comment !== null) {
				data.comment = comment;
			}
			send.PackAjax({
				url: url,
				data: JSON.stringify(data)
			});
		}
	};
	return commentHandler;
});