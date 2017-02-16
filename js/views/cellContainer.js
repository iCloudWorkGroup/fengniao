// beacause of we used nested model ,but backbone not support nested lsitenTo .
// so listenTo nested model didn't done.


define(function(require) {
	'use strict';
	var $ = require('lib/jquery'),
		Handlebars = require('lib/handlebars'),
		binary = require('basic/util/binary'),
		Backbone = require('lib/backbone'),
		headItemRows = require('collections/headItemRow'),
		headItemCols = require('collections/headItemCol'),
		selectRegions = require('collections/selectRegion'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		getTextBox = require('basic/tools/gettextbox'),
		setCellHeight = require('entrance/cell/setcellheight'),
		textTypeHandler = require('entrance/tool/settexttype'),
		CellContainer;

	/**
	 * 单元格视图类，用于显示单元格对象
	 * @author ray wu
	 * @since 0.1.0
	 * @class CellContainer  
	 * @module views
	 * @extends Backbone.View
	 * @constructor
	 */
	CellContainer = Backbone.View.extend({
		/**
		 * 单元格标签class属性
		 * @property className  
		 * @type {string}
		 */
		className: 'item',
		events: {
			'mouseenter': 'overCellView',
			'mouseleave': 'outCellView'
		},
		/**
		 * 监听model事件
		 * @method initialize 
		 */
		initialize: function(options) {

			var modelRowList = headItemRows,
				modelColList = headItemCols;

			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model, 'change:wordWrap', this.adaptCellHight);
			this.listenTo(this.model, 'change:content', this.adaptCellHight);
			this.listenTo(this.model, 'change:isDestroy', this.destroy);
			this.listenTo(this.model, 'change:commentShowState', this.commentViewHandler);
			this.listenTo(this.model, 'change:hidden', this.destroy);
			this.listenTo(this.model, 'destroy', this.clear);

			this.currentRule = options.currentRule;
			if (cache.TempProp.isFrozen !== true ||
				this.currentRule.displayPosition.endRowIndex === undefined) {
				this.listenTo(this.model, 'change:showState', this.changeShowState);
			}
			this.currentRule = options.currentRule;

			this.offsetLeft = cache.TempProp.isFrozen ? (this.currentRule.displayPosition.offsetLeft || 0) : 0;
			this.offsetTop = cache.TempProp.isFrozen ? (this.currentRule.displayPosition.offsetTop || 0) : 0;

			this.userViewLeft = cache.TempProp.isFrozen ? modelColList.getModelByAlias(cache.UserView.colAlias).get('left') : 0;
			this.userViewTop = cache.TempProp.isFrozen ? modelRowList.getModelByAlias(cache.UserView.rowAlias).get('top') : 0;

			_.bindAll(this, 'showComment', 'hideComment');
		},
		overCellView: function() {
			var self = this;
			this.overEvent = setTimeout(function() {
				if ($('.comment').length === 0) {
					if (self.model.get('customProp').comment !== null &&
						self.model.get('customProp').comment !== undefined) {
						self.showComment();
					}
				}
			}, 1000);
		},
		outCellView: function() {
			this.hideComment();
			clearTimeout(this.overEvent);
		},
		commentViewHandler: function() {
			if (this.model.get('commentShowState') === true) {
				this.showComment();
			} else {
				this.hideComment();
			}
		},
		/**
		 * 显示备注视图
		 */
		showComment: function() {
			this.newCommentView();
		},
		newCommentView: function() {
			//ps:修改
			var rowAlias,
				colAlias,
				rowIndex,
				colIndex,
				occupy = this.model.get('occupy'),
				comment = this.model.get('customProp').comment,
				options;
			if (cache.commentState) {
				return;
			}

			rowAlias = occupy.y[0];
			colAlias = occupy.x[occupy.x.length - 1];
			rowIndex = headItemRows.getIndexByAlias(rowAlias);
			colIndex = headItemCols.getIndexByAlias(colAlias);
			//冻结问题
			options = {
				colIndex: colIndex,
				rowIndex: rowIndex,
				comment: comment,
				state: 'show'
			};
			Backbone.trigger('event:commentContainer:show', options);
		},
		hideComment: function() {
			clearTimeout(this.overEvent);
			if (cache.commentState) {
				return;
			}
			Backbone.trigger('event:commentContainer:remove');
		},
		/**
		 * 渲染单元格
		 * @method render 
		 */
		render: function() {
			var modelJSON = this.model.toJSON();

			this.template = Handlebars.compile($('#tempItemCell').html());
			// this.$el.removeAttr('style');
			this.$el.css({
				'width': modelJSON.physicsBox.width,
				'height': modelJSON.physicsBox.height,
				'left': modelJSON.physicsBox.left - this.offsetLeft - this.userViewLeft - 1,
				'top': modelJSON.physicsBox.top - this.offsetTop - this.userViewTop - 1
			}).html(this.template(modelJSON));

			// "color": modelJSON.content.color
			// this is improve poiont , marinottejs itemview function can be replace this bug
			this.$contentBody = $('.bg', this.$el);
			this.$contentBody.css({
				"color": modelJSON.content.color,
				"font-family": modelJSON.content.family,
				"font-size": modelJSON.content.size + 'pt'
			}).html(this.getDisplayText(modelJSON));

			this.changeTopBorder(modelJSON);
			this.changeLeftBorder(modelJSON);
			this.changeBottomBorder(modelJSON);
			this.changeRightBorder(modelJSON);
			this.changeBackground(modelJSON);
			this.setTransverseAlign(modelJSON);
			this.setVerticalAlign(modelJSON);
			this.setBold(modelJSON);
			this.setItalic(modelJSON);
			this.wordWrap(modelJSON);
			this.showCommentSign(modelJSON);
			return this;
		},
		/**
		 * 更新单元格显示状态
		 * @method changeShowState 
		 */
		changeShowState: function() {
			if (this.model.get('showState') === false) {
				this.remove();
			}
		},
		/**
		 * 显示备注标记
		 * @param  {object} modelJSON showCommentSign
		 */
		showCommentSign: function(modelJSON) {
			if (modelJSON.customProp.comment !== null &&
				modelJSON.customProp.comment !== undefined) {
				this.$el.prepend('<div class="comment-ico"><div class="triangle"></div></div>');
			}
		},
		/**
		 * 根据不同单元格类型，生成不同displaytext
		 * @return {[type]} [description]
		 */
		// getFormatText: function(modelJSON) {
		// },
		getDisplayText: function(modelJSON) {
			var inputText,
				texts,
				text,
				temp,
				i = 0,
				height;
			text = modelJSON.content.displayTexts;
			temp = text;
			texts = text.split('\n');
			text = '';
			if (this.model.get('wordWrap') === false) {
				for (i = 0; i < texts.length; i++) {
					text += texts[i];
				}
			} else {
				for (i = 0; i < texts.length; i++) {
					text += texts[i] + '<br>';
				}
			}
			text = text.replace(/\u0020/g, '&nbsp;');
			return text;
		},
		adaptCellHight: function() {
			var text,
				height,
				occupyY,
				occupyX,
				initHeight,
				colItemIndex,
				rowItemIndex,
				headModelRow,
				headModelCol,
				fontsize;
			initHeight = config.User.cellHeight;
			occupyY = this.model.get('occupy').y;
			occupyX = this.model.get('occupy').x;
			fontsize = this.model.get('content').size;
			if (this.model.get('wordWrap') === true && occupyX.length === 1 && occupyY.length === 1) {
				headModelRow = headItemRows.getModelByAlias(occupyY[0]);
				headModelCol = headItemCols.getModelByAlias(occupyX[0]);
				text = this.model.get('content').displayTexts;
				height = getTextBox.getTextHeight(text, fontsize, headModelCol.get('width'));
				if (height > initHeight && headModelRow.get('height') < height) {
					setCellHeight('sheetId', headModelRow.get('displayName'), height);
					if (cache.TempProp.isFrozen) {
						Backbone.trigger('event:bodyContainer:executiveFrozen');
					};
				}
				return;
			}
			if (fontsize > 11) {
				//处理设置字体问题
				headModelRow = headItemRows.getModelByAlias(occupyY[0]);
				height = getTextBox.getTextHeight('', fontsize, 200);
				if (height > initHeight && headModelRow.get('height') < height) {
					setCellHeight('sheetId', headModelRow.get('displayName'), height);
					if (cache.TempProp.isFrozen) {
						Backbone.trigger('event:bodyContainer:executiveFrozen');
					};
				}
			}
		},
		/**
		 * 设置单元格内容斜体
		 * @method setItalic 
		 * @param modelJSON {modelJSON} 对象属性集合
		 */
		setItalic: function(modelJSON) {
			if (modelJSON.content.italic) {
				this.$contentBody.css({
					'font-style': 'italic'
				});
			} else {
				this.$contentBody.css({
					'font-style': 'normal'
				});
			}
		},
		/**
		 * 设置单元格内容粗体
		 * @method setBold 
		 * @param modelJSON {modelJSON} 对象属性集合
		 */
		setBold: function(modelJSON) {
			if (modelJSON.content.bd) {
				this.$contentBody.css({
					'font-weight': 'bold'
				});
			} else {
				this.$contentBody.css({
					'font-weight': 'normal'
				});
			}

		},
		/**
		 * 设置单元格内容水平对齐方式
		 * @method setTransverseAlign 
		 * @param modelJSON {modelJSON} 对象属性集合
		 */
		setTransverseAlign: function(modelJSON) {
			var format = modelJSON.format,
				type = format.type,
				text = modelJSON.content.texts,
				isValid = format.isValid,
				alignRowPosi = modelJSON.content.alignRow;
			//分离操作
			if (alignRowPosi === 'center' || alignRowPosi === 'right' || alignRowPosi === 'left') {
				this.$contentBody.css({
					'text-align': alignRowPosi
				});
				return;
			}
			if (type !== 'text' && type !== 'normal' && isValid === true) {
				this.$contentBody.css({
					'text-align': 'right'
				});
				return;
			}
			if (type === 'normal' && textTypeHandler.isNum(text)) {
				this.$contentBody.css({
					'text-align': 'right'
				});
				return;
			}
			this.$contentBody.css({
				'text-align': 'left'
			});
		},
		/**
		 * 设置单元格内容垂直对齐方式
		 * @method setVerticalAlign 
		 * @param modelJSON {modelJSON} 对象属性集合
		 */
		setVerticalAlign: function(modelJSON) {
			if (modelJSON.content.alignCol === 'middle') {
				this.$contentBody.css({
					"vertical-align": "middle",
				});
			} else if (modelJSON.content.alignCol === 'bottom') {
				this.$contentBody.css({
					"vertical-align": "bottom"
				});
			} else {
				this.$contentBody.css({
					"vertical-align": "top"
				});
			}
		},
		/**
		 * 渲染上边框
		 * @method changeTopBorder 
		 * @param modelJSON {modelJSON} 对象属性集合
		 */
		changeTopBorder: function(modelJSON) {
			if (modelJSON.border.top) {
				this.$el.css({
					'borderTopColor': '#000'
				});
			} else {
				this.$el.css({
					'borderTopColor': 'transparent'
				});
			}
		},
		/**
		 * 渲染左边框
		 * @method changeLeftBorder 
		 * @param modelJSON {modelJSON} 对象属性集合
		 */
		changeLeftBorder: function(modelJSON) {
			var left = modelJSON.physicsBox.left,
				headItemColList = headItemCols.models,
				index;

			index = binary.indexModelBinary(left + 1, headItemColList, 'left', 'width');
			if (headItemColList[index].get('isLeftAjacentHide') || !modelJSON.border.left) {
				this.$el.css({
					'borderLeftColor': 'transparent'
				});
			} else {
				this.$el.css({
					'borderLeftColor': '#000'
				});
			}

		},
		/**
		 * 渲染下边框边框
		 * @method changeBottomBorder 
		 * @param modelJSON {modelJSON} 对象属性集合
		 */
		changeBottomBorder: function(modelJSON) {
			if (modelJSON.border.bottom) {
				this.$el.css({
					'borderBottomColor': '#000'
				});
			} else {
				this.$el.css({
					'borderBottomColor': 'transparent'
				});
			}
		},
		/**
		 * 渲染右边框边框
		 * @method changeRightBorder 
		 * @param modelJSON {modelJSON} 对象属性集合
		 */
		changeRightBorder: function(modelJSON) {
			var right = modelJSON.physicsBox.left + modelJSON.physicsBox.width,
				headItemColList = headItemCols.models,
				index;
			index = binary.indexModelBinary(right, headItemColList, 'left', 'width');
			//边框处理
			if (headItemColList[index].get('isRightAjacentHide') || !modelJSON.border.right) {
				this.$el.css({
					'borderRightColor': 'transparent'
				});
			} else {
				this.$el.css({
					'borderRightColor': '#000'
				});
			}
		},
		/**
		 * 渲染单元格背景
		 * @method changeBackground 
		 * @param modelJSON {modelJSON} 对象属性集合
		 */
		changeBackground: function(modelJSON) {
			if (modelJSON.customProp.background !== '') {
				this.$contentBody.css({
					'backgroundColor': modelJSON.customProp.background
				});
			} else {
				this.$contentBody.css({
					'backgroundColor': '#fff'
				});
			}
		},
		wordWrap: function(modelJSON) {
			if (modelJSON.wordWrap === true) {
				this.$contentBody.css({
					'wordBreak': 'break-word',
					'whiteSpace': 'normal'
				});
			} else {
				this.$contentBody.css({
					'whiteSpace': 'nowrap'
				});
			}
		},
		/**
		 * 根据状态暂时移除视图
		 * @method destroy 
		 */
		destroy: function() {
			if (this.model.get('isDestroy') || this.model.get('hidden')) {
				this.remove();
			}
		},
		/**
		 * 彻底清除视图
		 * @method clear
		 */
		clear: function() {
			this.remove();
		}
	});
	return CellContainer;
});