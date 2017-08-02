define(function(require) {
	'use strict';
	var $ = require('lib/jquery'),
		_ = require('lib/underscore'),
		getTemplate = require('basic/tools/template'),
		binary = require('basic/util/binary'),
		Backbone = require('lib/backbone'),
		headItemRows = require('collections/headItemRow'),
		headItemCols = require('collections/headItemCol'),
		selectRegions = require('collections/selectRegion'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		getTextBox = require('basic/tools/gettextbox'),
		setCellHeight = require('entrance/cell/setcellheight'),
		formatHandler = require('entrance/tool/settexttype'),
		headItemColList = headItemCols.models,
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
		/**
		 * 监听model事件
		 * @method initialize 
		 */
		initialize: function(options) {
			var modelRowList = headItemRows,
				modelColList = headItemCols;

			this.listenTo(this.model, 'change:physicsBox.width', this.changeWidth);
			this.listenTo(this.model, 'change:physicsBox.height', this.changeHeight);
			this.listenTo(this.model, 'change:physicsBox.left', this.changeLeft);
			this.listenTo(this.model, 'change:physicsBox.top', this.changeTop);

			this.listenTo(this.model, 'change:content.size', this.changeFontSize);
			this.listenTo(this.model, 'change:content.family', this.changeFontFamily);
			this.listenTo(this.model, 'change:content.italic', this.changeItalic);
			this.listenTo(this.model, 'change:content.bd', this.changeBold);
			this.listenTo(this.model, 'change:content.underline', this.changeUnderline);
			this.listenTo(this.model, 'change:content.color', this.changeColor);
			this.listenTo(this.model, 'change:content.alignRow', this.changeTransverseAlign);
			this.listenTo(this.model, 'change:content.alignCol', this.changeVerticalAlign);
			this.listenTo(this.model, 'change:content.texts', this.generateDisplayText);

			this.listenTo(this.model, 'change:border.left', this.changeLeftBorder);
			this.listenTo(this.model, 'change:border.right', this.changeRightBorder);
			this.listenTo(this.model, 'change:border.top', this.changeTopBorder);
			this.listenTo(this.model, 'change:border.bottom', this.changeBottomBorder);

			this.listenTo(this.model, 'change:customProp.background', this.changeBackground);

			this.listenTo(this.model, 'change:customProp.comment', this.showCommentSign);
			//初始化不走该方法，直接将显示文本贴到html中
			this.listenTo(this.model, 'change:format', this.generateDisplayText);

			this.listenTo(this.model, 'change:wordWrap', this.changeWordWrap);

			this.currentRule = options.currentRule;

			if (cache.TempProp.isFrozen !== true ||
				this.currentRule.displayPosition.endRowIndex === undefined) {
				this.listenTo(this.model, 'change:showState', this.destroy);
			}
			//待修改：需要验证现删除DOM，视图对象是否得到了释放
			this.listenTo(this.model, 'change:isDestroy', this.destroy);
			this.listenTo(this.model, 'change:hidden', this.destroy);
			this.listenTo(this.model, 'destroy', this.remove);

			this.offsetLeft = cache.TempProp.isFrozen ? (this.currentRule.displayPosition.offsetLeft || 0) : 0;
			this.offsetTop = cache.TempProp.isFrozen ? (this.currentRule.displayPosition.offsetTop || 0) : 0;

			this.userViewLeft = cache.TempProp.isFrozen ? modelColList.getModelByAlias(cache.UserView.colAlias).get('left') : 0;
			this.userViewTop = cache.TempProp.isFrozen ? modelRowList.getModelByAlias(cache.UserView.rowAlias).get('top') : 0;
		},
		/**
		 * 渲染单元格
		 * @method render 
		 */
		render: function() {
			var modelAttr = this.model.attributes;
			this.template = getTemplate('CELLTEMPLATE');

			this.$el.html(this.template());

			this.$contentBody = $('.bg', this.$el);
			this.$contentBody[0].innerText = modelAttr.content.displayTexts;

			this.changeFontFamily(modelAttr);
			this.changeFontSize(modelAttr);
			this.changeColor(modelAttr);

			this.changeWidth(modelAttr);
			this.changeHeight(modelAttr);
			this.changeLeft(modelAttr);
			this.changeTop(modelAttr);

			this.changeItalic(modelAttr);
			this.changeBold(modelAttr);
			this.changeTransverseAlign(modelAttr);
			this.changeVerticalAlign(modelAttr);

			this.changeTopBorder(modelAttr);
			this.changeLeftBorder(modelAttr);
			this.changeBottomBorder(modelAttr);
			this.changeRightBorder(modelAttr);
			this.changeUnderline(modelAttr);

			this.changeBackground(modelAttr);
			this.changeWordWrap(modelAttr);
			this.showCommentSign(modelAttr);
			return this;
		},
		// getHtmlText: function(modelAttr) {
		// 	var text;

		// 	if (modelAttr.attributes) {
		// 		modelAttr = this.model.attributes;
		// 	}

		// 	text = modelAttr.content.displayTexts || '';

		// 	if (modelAttr.wordWrap) {
		// 		text =text.replace(/\n/g, '<br>');
		// 	}
		// 	return text;
		// },
		changeWidth: function(modelAttr) {
			if (modelAttr.attributes) {
				modelAttr = this.model.attributes;
			}
			this.$el.css({
				width: modelAttr.physicsBox.width
			});
		},
		changeHeight: function(modelAttr) {
			if (modelAttr.attributes) {
				modelAttr = this.model.attributes;
			}
			this.$el.css({
				height: modelAttr.physicsBox.height
			});
		},
		changeLeft: function(modelAttr) {
			if (modelAttr.attributes) {
				modelAttr = this.model.attributes;
			}
			this.$el.css({
				left: modelAttr.physicsBox.left - this.offsetLeft - this.userViewLeft - 1
			});
		},
		changeTop: function(modelAttr) {
			if (modelAttr.attributes) {
				modelAttr = this.model.attributes;
			}
			this.$el.css({
				top: modelAttr.physicsBox.top - this.offsetTop - this.userViewTop - 1
			});
		},
		changeBold: function(modelAttr) {
			if (modelAttr.attributes) {
				modelAttr = this.model.attributes;
			}
			if (modelAttr.content.bd) {
				this.$contentBody.css({
					'fontWeight': 'bold'
				});
			} else {
				this.$contentBody.css({
					'fontWeight': 'normal'
				});
			}
		},
		changeUnderline: function(modelAttr) {
			if (modelAttr.attributes) {
				modelAttr = this.model.attributes;
			}
			if (modelAttr.content.underline) {
				this.$contentBody.css({
					'textDecoration': 'underline'
				});
			} else {
				this.$contentBody.css({
					'textDecoration': 'none'
				});
			}
		},
		/**
		 * 设置单元格内容斜体
		 * @method changeItalic 
		 * @param modelJSON {modelJSON} 对象属性集合
		 */
		changeItalic: function(modelAttr) {
			if (modelAttr.attributes) {
				modelAttr = this.model.attributes;
			}
			if (modelAttr.content.italic) {
				this.$contentBody.css({
					'fontStyle': 'italic'
				});
			} else {
				this.$contentBody.css({
					'fontStyle': 'normal'
				});
			}
		},
		changeTransverseAlign: function(modelAttr) {
			if (modelAttr.attributes) {
				modelAttr = this.model.attributes;
			}
			var format = modelAttr.format,
				isValid = format.isValid,
				type = format.type,
				text = modelAttr.content.texts,
				alignRow = modelAttr.content.alignRow;
			if (alignRow) {
				this.$contentBody.css({
					'textAlign': alignRow
				});
				return;
			}
			if (type !== 'text' && type !== 'normal' && isValid === true) {
				this.$contentBody.css({
					'textAlign': 'right'
				});
				return;
			}
			if (type === 'normal' && formatHandler.isNum(text)) {
				this.$contentBody.css({
					'textAlign': 'right'
				});
				return;
			}
			this.$contentBody.css({
				'textAlign': 'left'
			});
		},
		/**
		 * 设置单元格内容垂直对齐方式
		 * @method changeVerticalAlign 
		 * @param modelJSON {modelJSON} 对象属性集合
		 */
		changeVerticalAlign: function(modelAttr) {
			if (modelAttr.attributes) {
				modelAttr = this.model.attributes;
			}
			this.$contentBody.css({
				'verticalAlign': this.model.attributes.content.alignCol
			});
		},
		/**
		 * 渲染上边框
		 * @method changeTopBorder 
		 * @param modelJSON {modelJSON} 对象属性集合
		 */
		changeTopBorder: function(modelAttr) {
			if (modelAttr.attributes) {
				modelAttr = this.model.attributes;
			}
			if (modelAttr.border.top) {
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
		 * 渲染下边框边框
		 * @method changeBottomBorder 
		 * @param modelJSON {modelJSON} 对象属性集合
		 */
		changeBottomBorder: function(modelAttr) {
			if (modelAttr.attributes) {
				modelAttr = this.model.attributes;
			}
			if (modelAttr.border.bottom) {
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
		 * 渲染左边框
		 * @method changeLeftBorder 
		 * @param modelJSON {modelJSON} 对象属性集合
		 */
		changeLeftBorder: function(modelAttr) {
			var headItemModel;

			if (modelAttr.attributes) {
				modelAttr = this.model.attributes;
			}
			if (!modelAttr.border.left) {
				this.$el.css({
					'borderLeftColor': 'transparent'
				});
			} else {
				headItemModel = headItemCols.getModelByAlias(modelAttr.occupy.x[0]);
				if (headItemModel.attributes.isLeftAjacentHide) {
					this.$el.css({
						'borderLeftColor': 'transparent'
					});
				} else {
					this.$el.css({
						'borderLeftColor': '#000'
					});
				}
			}
		},
		/**
		 * 渲染右边框边框
		 * @method changeRightBorder 
		 * @param modelJSON {modelJSON} 对象属性集合
		 */
		changeRightBorder: function(modelAttr) {
			var headItemModel,
				occupyX;

			if (modelAttr.attributes) {
				modelAttr = this.model.attributes;
			}
			occupyX = modelAttr.occupy.x;
			if (!modelAttr.border.right) {
				this.$el.css({
					'borderRightColor': 'transparent'
				});
			} else {
				headItemModel = headItemCols.getModelByAlias(occupyX[occupyX.length - 1]);
				if (headItemModel.attributes.isRightAjacentHide) {
					this.$el.css({
						'borderRightColor': 'transparent'
					});
				} else {
					this.$el.css({
						'borderRightColor': '#000'
					});
				}
			}
		},
		/**
		 * 渲染单元格背景
		 * @method changeBackground 
		 * @param modelJSON {modelJSON} 对象属性集合
		 */
		changeBackground: function(modelAttr) {
			if (modelAttr.attributes) {
				modelAttr = this.model.attributes;
			}
			if (modelAttr.customProp.background !== '') {
				this.$contentBody.css({
					'backgroundColor': modelAttr.customProp.background
				});
			} else {
				this.$contentBody.css({
					'backgroundColor': '#fff'
				});
			}
		},
		changeWordWrap: function(modelAttr) {
			if (modelAttr.attributes) {
				modelAttr = this.model.attributes;
			}
			if (modelAttr.wordWrap === true) {
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
		 * 显示备注标记
		 * @param  {object} modelJSON showCommentSign
		 */
		showCommentSign: function(modelAttr) {
			if (modelAttr.attributes) {
				modelAttr = this.model.attributes;
			}
			if (modelAttr.customProp.comment !== null &&
				modelAttr.customProp.comment !== undefined) {
				this.$el.prepend('<div class="comment-ico"><div class="triangle"></div></div>');
			} else {
				var commentSign = this.$el.find('.comment-ico');
				commentSign.remove();
			}
		},
		generateDisplayText: function() {
			formatHandler.typeRecognize(this.model);
			formatHandler.generateDisplayText(this.model);

			var modelAttr = this.model.attributes;
			this.changeTransverseAlign(modelAttr);
			this.$contentBody[0].innerText = modelAttr.content.displayTexts;

		},
		changeFontFamily: function() {
			this.$contentBody.css({
				'fontFamily': this.model.attributes.content.family,
			});
		},
		changeFontSize: function() {
			this.$contentBody.css({
				'fontSize': this.model.attributes.content.size + 'pt',
			});
		},
		changeColor: function() {
			this.$contentBody.css({
				'color': this.model.attributes.content.color,
			});
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
		 * 根据状态暂时移除视图
		 * @method destroy 
		 */
		destroy: function() {
			var attr = this.model.attributes;
			if (attr.hidden || !attr.showState || attr.isDestroy) {
				this.remove();
			}
		},
	});
	return CellContainer;
});