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
		before: function() {
			var clip = selectRegions.getModelByType('clip');
			if (clip !== undefined) {
				cache.clipState = 'null';
				clip.destroy();
			}
			if (cache.protectState) {
				Backbone.trigger('event:showMsgBar:show', '保护状态，不能进行该操作');
				return true;
			}
		},
		modifyComment: function(sheetId, comment, label) {
			var region,
				operRegion,
				sendRegion,
				headItemRowList = headItemRows.models,
				headItemColList = headItemCols.models,
				changeModelList = [];

			if (this.before()) {
				return;
			}
			region = getOperRegion(label);
			operRegion = region.operRegion;
			sendRegion = region.sendRegion;

			if (operRegion.startColIndex === -1 || operRegion.startRowIndex === -1) {
				if (comment === null) {
					this.sendData(sendRegion, null, config.url.cell.commentDel);
				} else {
					this.sendData(sendRegion, comment, config.url.cell.commentPlus);
				}
				return;
			}

			if (operRegion.endColIndex === 'MAX') { //整行操作
				rowOperate.rowPropOper(operRegion.startRowIndex, 'customProp.comment', comment);
			} else if (operRegion.endRowIndex === 'MAX') {
				colOperate.colPropOper(operRegion.startColIndex, 'customProp.comment', comment);
			} else {
				cells.oprCellsByRegion(operRegion, function(cell, colSort, rowSort) {
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
				this.sendData(sendRegion, null, config.url.cell.commentDel);
			} else {
				this.sendData(sendRegion, comment, config.url.cell.commentPlus);
			}
		},
		createAddCommentView: function() {
			if (this.before()) {
				return;
			}
			Backbone.trigger('event:bodyContainer:handleComment', {
				'action': 'add',
			});
		},
		createEditComment: function() {
			if (this.before()) {
				return;
			}
			Backbone.trigger('event:bodyContainer:handleComment', {
				'action': 'edit'
			});
		},

		deleteComment: function(label) {
			if (this.before()) {
				return;
			}
			this.modifyComment('1', null, label);
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