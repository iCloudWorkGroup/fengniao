'use strict';
define(function(require) {
	var Backbone = require('lib/backbone'),
		cache = require('basic/tools/cache'),
		getTextBox = require('basic/tools/gettextbox'),
		history = require('basic/tools/history'),
		config = require('spreadsheet/config'),
		send = require('basic/tools/send'),
		Cell = require('models/cell'),
		headItemRows = require('collections/headItemRow'),
		headItemCols = require('collections/headItemCol'),
		selectRegions = require('collections/selectRegion'),
		cells = require('collections/cells'),
		setTextType = require('entrance/tool/settexttype'),
		clipSelectOperate = require('entrance/tool/clipselectoperate'),
		clipPasteOperate = require('entrance/tool/clippasteoperate'),
		InputContainer;


	/**
	 * InputContainer
	 * @author ray wu
	 * @since 0.1.0
	 * @class InputContainer  
	 * @module views
	 * @extends Backbone.View
	 * @constructor
	 */
	InputContainer = Backbone.View.extend({
		/**
		 * 设置标签类型
		 * @property tagName
		 * @type {String}
		 */
		tagName: 'textarea',
		/**
		 * 设置标签class属性
		 * @method className
		 * @type {String}
		 */
		className: 'edit-frame',
		/**
		 * 绑定鼠标事件
		 * @method events
		 * @type {Object}
		 */
		events: {
			'input': 'adapt',
			'propertychange': 'adapt',
			'keydown': 'keypressHandle',
			'blur': 'hide',
			'copy': 'copyData',
			'paste': 'pasteData',
			'cut': 'cutData'
		},
		/**
		 * 类初始化函数
		 * @method initialize
		 */
		initialize: function() {
			Backbone.on('event:InputContainer:show', this.show, this);
			Backbone.on('event:InputContainer:hide', this.hide, this);
		},
		/**
		 * 显示输入框
		 * @param  {Boolean} dblclick 是否为双击进入输入框
		 */
		show: function(dblclick) {
			var mainContainer,
				modelJSON,
				rowAlias,
				colAlias,
				colIndex,
				rowIndex,
				select,
				clip,
				left,
				top,
				cell;

			clip = selectRegions.getModelByType('clip');
			if (clip !== undefined) {
				cache.clipState = 'null';
				clip.destroy();
			}
			select = selectRegions.getModelByType('selected');
			colAlias = select.get('wholePosi').startX;
			colIndex = headItemCols.getIndexByAlias(colAlias);
			rowAlias = select.get('wholePosi').startY;
			rowIndex = headItemRows.getIndexByAlias(rowAlias);

			Backbone.trigger('call:mainContainer', function(container) {
				mainContainer = container;
			});

			this.rowIndex = rowIndex;
			this.colIndex = colIndex;
			this.mainContainer = mainContainer;
			cell = cells.getRegionCells(colIndex, rowIndex)[0];
			if (cell === null) {
				cell = this.createCell(rowIndex, colIndex);
			}
			this.model = cell;
			this.showState = true;
			left = this.getAbsoluteLeft();
			top = this.getAbsoluteTop();
			this.adjustZIndex();
			if (dblclick === false) {
				this.model.set('content.texts', '');
			}
			modelJSON = this.model.toJSON();
			if (modelJSON.content.bd === true) {
				this.$el.css({
					'fontWeight': 'bold'
				});
			} else {
				this.$el.css({
					'fontWeight': 'normal'
				});
			}
			if (modelJSON.content.italic === true) {
				this.$el.css({
					'fontStyle': 'italic'
				});
			} else {
				this.$el.css({
					'fontStyle': 'normal'
				});
			}
			this.$el.css({
				'color': modelJSON.content.color,
				'fontSize': modelJSON.content.size + 'pt',
				'fontFamily': modelJSON.content.family,
				'left': left,
				'top': top,
			});
			if (dblclick !== false) {
				this.$el.val(modelJSON.content.texts);
			}
			//适应文本宽度高度
			this.adjustWidth(true);
			this.adjustHeight();
		},
		/**
		 * 粘贴监听事件
		 * @method pasteData
		 */
		pasteData: function(event) {
			if (this.showState === false) {
				event.preventDefault();
				var pasteText;
				if (window.clipboardData && window.clipboardData.getData) { // IE
					pasteText = window.clipboardData.getData('Text');
				} else {
					pasteText = event.originalEvent.clipboardData.getData('Text'); //e.clipboardData.getData('text/plain');
				}
				clipPasteOperate(pasteText);
			}
		},
		copyData: function(event) {
			if (this.showState === false) {
				clipSelectOperate('copy', event);
			}
		},
		cutData: function(event) {
			if (this.showState === false) {
				clipSelectOperate('cut', event);
			}
		},
		/**
		 * 创建单元格
		 * @method createCell
		 * @param  {num} indexRow 行索引
		 * @param  {num} indexCol 列索引
		 * @return {Cell} cell 单元格对象
		 */
		createCell: function(indexRow, indexCol) {
			var cacheCell,
				aliasCol,
				aliasRow,
				gridLineColList,
				gridLineRowList;

			gridLineColList = headItemCols.models;
			gridLineRowList = headItemRows.models;
			aliasCol = gridLineColList[indexCol].get('alias');
			aliasRow = gridLineRowList[indexRow].get('alias');
			var top, left, width, height;
			top = gridLineRowList[indexRow].get('top');
			left = gridLineColList[indexCol].get('left');
			width = gridLineColList[indexCol].get('width');
			height = gridLineRowList[indexRow].get('height');
			cacheCell = new Cell();
			cacheCell.set('occupy', {
				x: [aliasCol],
				y: [aliasRow]
			});
			cacheCell.set('physicsBox', {
				top: top,
				left: left,
				width: width,
				height: height
			});
			cache.cachePosition(aliasRow, aliasCol, cells.length);
			cells.add(cacheCell);
			return cacheCell;
		},
		/**
		 * 隐藏输入框
		 */
		hide: function(event) {
			var headItemRowList = headItemRows.models,
				headItemColList = headItemCols.models,
				model = this.model,
				originalText,
				rowSort,
				colSort,
				text;

			if (this.showState === true) {
				this.$el.css({
					'left': -1000,
					'top': -1000,
					'width': 0,
					'height': 0,
					'z-index': -100
				});
				rowSort = headItemRowList[this.rowIndex].get('sort');
				colSort = headItemColList[this.colIndex].get('sort');

				originalText = model.get('content').texts;
				text = this.$el.val();
				if (originalText !== text) {
					history.addUpdateAction('content.texts', text, {
						startColSort: colSort,
						startRowSort: rowSort,
						endColSort: colSort,
						endRowSort: rowSort
					}, [{
						colSort: colSort,
						rowSort: rowSort,
						value: originalText
					}]);

					if (text.indexOf('\n') !== -1 && (model.get('wordWrap') === false)) {
						model.set('wordWrap', true);
						this.sendWordWrap(colSort, rowSort);
					}
					model.set('content.texts', text);
					this.sendChangeText(colSort, rowSort, text);
				}
			}
			this.$el.val('');
			if (event === undefined) {
				this.$el.focus();
			}
			this.showState = false;
		},
		/**
		 * 横向移动输入框
		 */
		transverseScroll: function() {
			var left;
			if (this.showState === true) {
				left = this.getAbsoluteLeft();
				this.$el.css({
					'left': left
				});
			}
		},
		/**
		 * 纵向移动输入框
		 */
		verticalScroll: function() {
			var top;
			if (this.showState === true) {
				top = this.getAbsoluteTop();
				this.$el.css({
					'top': top
				});
			}
		},
		/**
		 * 输入内容时，输入框位于显示区域外，自动滚动回显示区
		 */
		autoScrollLeft: function() {
			var scrollBarWidth,
				right,
				limitRight,
				scrollLeft,
				differ;
			scrollBarWidth = this.mainContainer.$el[0].offsetWidth - this.mainContainer.$el[0].clientWidth;
			right = this.$el.position().left + this.$el.width();
			limitRight = this.$el.parent()[0].clientWidth - scrollBarWidth;
			differ = limitRight - right;
			if (differ < 0) {
				scrollLeft = this.mainContainer.$el.scrollLeft();
				this.mainContainer.$el.scrollLeft(scrollLeft - differ);
			}
		},
		/**
		 * 输入内容时，输入框位于显示区域外，自动滚动回显示区
		 */
		autoScrollTop: function() {
			var scrollBarHeight,
				bottom,
				limitBottom,
				scrollTop,
				differ;
			scrollBarHeight = this.mainContainer.$el[0].offsetHeight - this.mainContainer.$el[0].clientHeight;
			bottom = this.$el.position().top + this.$el.height();
			limitBottom = this.$el.parent()[0].clientHeight - scrollBarHeight;
			differ = limitBottom - bottom;
			if (differ < 0) {
				scrollTop = this.mainContainer.$el.scrollTop() - differ;
				this.mainContainer.$el.scrollTop(scrollTop);
			}
		},
		/**
		 * 获取输入框left坐标
		 * @param  {object} mainContainer mainContainer
		 * @param  {number} colIndex 选中区域列索引
		 */
		getAbsoluteLeft: function() {
			var outLeft,
				scrollLeft,
				userViewLeft,
				userViewIndex,
				frozenColIndex,
				headItemLeft,
				mainContainer,
				colIndex,
				result;

			colIndex = this.colIndex;
			mainContainer = this.mainContainer;

			outLeft = config.System.outerLeft;
			scrollLeft = mainContainer.$el.scrollLeft();
			headItemLeft = headItemCols.models[colIndex].get('left');

			if (cache.TempProp.colFrozen) { //冻结情况
				frozenColIndex = headItemCols.getIndexByAlias(cache.TempProp.colAlias);
				if (frozenColIndex > colIndex) {
					scrollLeft = 0;
				}
				userViewIndex = headItemCols.getIndexByAlias(cache.UserView.colAlias);
				userViewLeft = headItemCols.models[userViewIndex].get('left');
				result = headItemLeft - userViewLeft + outLeft - scrollLeft + 1;
				return result;
			} else { //非冻结情况
				result = headItemLeft + outLeft - scrollLeft + 1;
				return result;
			}
		},
		getAbsoluteTop: function() {
			var outTop,
				scrollTop,
				userViewTop,
				userViewIndex,
				frozenRowIndex,
				mainContainer,
				rowIndex,
				headItemTop,
				result;

			rowIndex = this.rowIndex;
			mainContainer = this.mainContainer;

			outTop = config.System.outerTop;
			scrollTop = mainContainer.$el.scrollTop();
			headItemTop = headItemRows.models[rowIndex].get('top');

			if (cache.TempProp.colFrozen) { //冻结情况
				frozenRowIndex = headItemRows.getIndexByAlias(cache.TempProp.rowAlias);
				if (frozenRowIndex > rowIndex) {
					scrollTop = 0;
				}
				userViewIndex = headItemRows.getIndexByAlias(cache.UserView.rowAlias);
				userViewTop = headItemRows.models[userViewIndex].get('top');
				result = headItemTop - userViewTop + outTop - scrollTop + 1;
				return result;
			} else { //非冻结情况
				result = headItemTop + outTop - scrollTop + 1;
				return result;
			}
		},
		adjustZIndex: function() {
			var colIndex,
				rowIndex,
				frozenColIndex,
				frozenRowIndex;

			colIndex = this.colIndex;
			rowIndex = this.rowIndex;

			if (cache.TempProp.colFrozen && cache.TempProp.rowFrozen) { //冻结情况
				frozenColIndex = headItemCols.getIndexByAlias(cache.TempProp.colAlias);
				frozenRowIndex = headItemRows.getIndexByAlias(cache.TempProp.rowAlias);
				if (frozenColIndex > colIndex && frozenRowIndex > rowIndex) {
					this.$el.css({
						'z-index': '15'
					});
				} else if (frozenColIndex > colIndex || frozenRowIndex > rowIndex) {
					this.$el.css({
						'z-index': '12'
					});
				} else {
					this.$el.css({
						'z-index': '9'
					});
				}
			} else if (cache.TempProp.colFrozen) {
				frozenColIndex = headItemCols.getIndexByAlias(cache.TempProp.colAlias);
				if (frozenColIndex > colIndex) {
					this.$el.css({
						'z-index': '12'
					});
				} else {
					this.$el.css({
						'z-index': '9'
					});
				}
			} else if (cache.TempProp.rowFrozen) {
				frozenRowIndex = headItemRows.getIndexByAlias(cache.TempProp.rowAlias);
				if (frozenRowIndex > rowIndex) {
					this.$el.css({
						'z-index': '12'
					});
				} else {
					this.$el.css({
						'z-index': '9'
					});
				}
			} else { //非冻结情况
				this.$el.css({
					'z-index': '9'
				});
			}
		},
		/**
		 * 视图显示函数
		 * @method render
		 */
		render: function() {
			this.hide();
			return this;
		},
		/**
		 * 自适应输入框的大小
		 */
		adapt: function(e) {
			if (this.showState === true) {
				this.adjustWidth(e);
				this.adjustHeight(e);
			} else {
				if (this.keyHandle() === false) {
					return;
				}
				this.showState === true;
				this.show(false);
			}
		},
		/**
		 * 调整输入框高度
		 */
		adjustHeight: function(e) {
			var height,
				scrollBarHeight,
				maxHeight,
				minHeight,
				fontSize,
				width,
				inputText,
				texts,
				text = '',
				len, i;

			scrollBarHeight = this.mainContainer.$el[0].offsetHeight - this.mainContainer.$el[0].clientHeight;
			maxHeight = this.$el.parent().height() - this.$el.position().top - scrollBarHeight;
			minHeight = this.model.get('physicsBox').height;

			inputText = this.$el.val();

			fontSize = this.model.get('content').size;
			width = this.$el.width();

			height = getTextBox.getInputHeight(inputText, fontSize, width);
			height = height > minHeight ? height : minHeight;

			if (height < maxHeight) {
				this.$el.height(height);
				return height;
			} else {
				this.$el.height(maxHeight);
				return height;
			}
		},
		/**
		 * 调整输入框宽度
		 * @method adjustWidth
		 * @param e {event} propertychange函数
		 */
		adjustWidth: function(init) {
			var text = '',
				texts,
				width,
				inputText,
				scrollBarWidth,
				currentWidth,
				fontSize,
				maxWidth,
				minWidth,
				len, i;


			//不能超出当前显示区域
			scrollBarWidth = this.mainContainer.$el[0].offsetWidth - this.mainContainer.$el[0].clientWidth;
			maxWidth = this.$el.parent().width() - this.$el.position().left - scrollBarWidth;
			minWidth = this.model.get('physicsBox').width - 1;

			//自动换行，宽度等于输入框初始化列宽
			if (this.model.get('wordWrap') === true) {
				this.$el.width(minWidth);
				return;
			}
			inputText = this.$el.val();
			fontSize = this.model.get('content').size;
			currentWidth = this.$el.width();

			width = getTextBox.getInputWidth(inputText, fontSize) + 20;

			width = width > minWidth ? width : minWidth;
			if (init !== true) {
				width = width > currentWidth ? width : currentWidth;
			}
			if (width < maxWidth) {
				this.$el.width(width);
				return width;
			} else {
				this.$el.width(maxWidth);
				return maxWidth;
			}

		},
		sendWordWrap: function(col, row) {
			send.PackAjax({
				url: config.url.cell.wordwrap,
				data: JSON.stringify({
					coordinate: {
						startCol: col,
						startRow: row,
						endCol: col,
						endRow: row
					},
					wordWrap: true
				})
			});
		},
		/**
		 * 输入框移除输入焦点，视图销毁
		 * @method close
		 * @param e {event}  输入焦点移除
		 */
		sendChangeText: function(col, row, text) {
			var text,
				colAlias,
				rowAlias,
				colSort,
				rowSort;
			send.PackAjax({
				url: config.url.cell.content,
				data: JSON.stringify({
					coordinate: {
						startRow: row,
						startCol: col,
						endRow: row,
						endCol: col
					},
					content: encodeURIComponent(text)
				})
			});
		},
		isShortKey: function(needle) {
			var prop,
				keyboard = config.keyboard;
			for (prop in keyboard) {
				if (keyboard[prop] === needle) {
					return true;
				}
			}
			return false;
		},
		keypressHandle: function(e) {
			var self = this,
				isShortKey, keyboard;

			keyboard = config.keyboard;
			isShortKey = this.isShortKey(e.keyCode);

			//处理用户输入回车键
			if (isShortKey) {
				if (config.shortcuts.enter &&
					e.altKey === false &&
					e.keyCode === keyboard.enter) {
					Backbone.trigger('event:cellsContainer:moveSelectRegion', 'DOWN');
					if (this.showState === true) {
						this.hide();
					}
					e.preventDefault();
					return;
				}
			}
			if (this.showState === true) {
				//内部换行处理
				if (isShortKey) {
					if (config.shortcuts.altEnter && e.altKey) {
						insertAtCursor('\n');
						this.adjustHeight();
						return;
					}
				}
				this.autoScrollLeft();
				this.autoScrollTop();
			}

			function insertAtCursor(myValue) {
				var $t = self.$el[0];
				if (document.selection) {
					self.$el.focus();
					self = document.selection.createRange();
					self.text = myValue;
					self.$el.focus();
				} else if ($t.selectionStart || $t.selectionStart === '0') {
					var startPos = $t.selectionStart;
					var endPos = $t.selectionEnd;
					var scrollTop = $t.scrollTop;
					$t.value = $t.value.substring(0, startPos) + myValue + $t.value.substring(endPos, $t.value.length);
					self.$el.focus();
					$t.selectionStart = startPos + myValue.length;
					$t.selectionEnd = startPos + myValue.length;
					$t.scrollTop = scrollTop;
				} else {
					self.value += myValue;
					self.$el.focus();
				}
			}

		},
		/**
		 * 判断未显示输入框时，点击按键是否填出输入框
		 * @param  {[type]} e 键盘点击事件
		 */
		keyHandle: function() {
			var inputChar,
				regular;

			regular = /[a-zA-Z0-9]/;
			inputChar = this.$el.val();
			if (regular.test(inputChar)) {
				return true;
			} else {
				this.$el.val('');
				return false;
			}

		},
		/**
		 * 视图销毁
		 * @method destroy
		 */
		destroy: function() {
			Backbone.off('event:InputContainer:show');
			Backbone.off('event:InputContainer:hide');
			this.remove();
		}
	});
	return InputContainer;
});