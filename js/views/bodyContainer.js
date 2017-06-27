define(function(require) {
	'use strict';
	var $ = require('lib/jquery'),
		Backbone = require('lib/backbone'),
		send = require('basic/tools/send'),
		config = require('spreadsheet/config'),
		cache = require('basic/tools/cache'),
		getTemplate = require('basic/tools/template'),
		observerPattern = require('basic/util/observer.pattern'),
		headItemRows = require('collections/headItemRow'),
		headItemCols = require('collections/headItemCol'),
		selectRegions = require('collections/selectRegion'),
		siderLineCols = require('collections/siderLineCol'),
		siderLineRows = require('collections/siderLineRow'),
		cells = require('collections/cells'),
		original = require('basic/tools/original'),
		SheetsContainer = require('views/sheetsContainer'),
		MainContainer = require('views/mainContainer'),
		ColsPanelContainer = require('views/colsPanelContainer'),
		RowsPanelContainer = require('views/rowsPanelContainer'),
		InputContainer = require('views/inputContainer'),
		CommentContainer = require('views/commentcontainer'),
		BodyContainer;

	/**
	 * body标签DOM对象View视图
	 * @author ray wu
	 * @since 0.1.0
	 * @class BodyContainer  
	 * @module views
	 * @extends Backbone.View
	 * @constructor
	 */
	BodyContainer = Backbone.View.extend({
		/**
		 * 初始化绑定事件
		 * @property events
		 * @default {}
		 */
		events: {
			/**
			 * 当`mousemove`时，获取实时的鼠标信息
			 * @event mousemove
			 */
			'mousemove': 'mouseInfo',
			'mouseup': 'getFocus'
		},
		/**
		 * 初始化bodyContainer
		 * @method initialize
		 */
		initialize: function() {
			Backbone.on('event:bodyContainer:executiveFrozen', this.executiveFrozen, this);
			Backbone.on('event:bodyContainer:handleComment', this.handleComment, this);
			Backbone.on('event:reload', this.reload, this);
			this.commentContainer = null;
		},
		/**
		 * 渲染页面
		 * @method render
		 * @chainable
		 */
		render: function() {
			var inputContainer = new InputContainer();

			observerPattern.buildSubscriber(inputContainer);
			inputContainer.subscribe('mainContainer', 'transversePublish', 'transverseScroll');
			inputContainer.subscribe('mainContainer', 'verticalPublish', 'verticalScroll');

			this.$el.html(getTemplate('BODYTEMPLATE'));
			this.$el.find('.main-layout').append(inputContainer.render().el);

			this.calculation();
			this.adaptScreen();
			this.generateSheet();
			this.$el.css({
				'overflow': 'hidden',
				'position': 'relative'
			});
			inputContainer.$el.focus();
		},
		handleComment: function(options) {
			var action = options.action,
				commentContainer;

			if (!this.commentContainer) {
				commentContainer = this.commentContainer = new CommentContainer({
					parentNode: this
				});
				observerPattern.buildSubscriber(commentContainer);
				this.$el.find('.main-layout').append(commentContainer.render().el);
				commentContainer.subscribe('mainContainer', 'transversePublish', 'transverseScroll');
				commentContainer.subscribe('mainContainer', 'verticalPublish', 'verticalScroll');
			}
			if (action === 'hide') {
				this.commentContainer.hide();
			} else if (action === 'edit') {
				this.commentContainer.edit(options);
			} else if (action === 'add') {
				this.commentContainer.add(options);
			} else {
				this.commentContainer.show(options);
			}
		},
		generateSheet: function() {
			var sheetsView = new SheetsContainer();
			this.sheetsView = sheetsView;
			this.$el.find('.sheet-cf-list').append(sheetsView.render().el);
		},
		/**
		 * 在操作区域内，发生mouseup事件，隐藏输入框获取输入焦点，用来避免中文文本输入问题
		 * @return {[type]} [description]
		 */
		getFocus: function(e) {
			//判断输入框状态，如果输入框未失去焦点，不进行隐藏
			var focus = $(':focus')[0];
			if (focus === undefined || focus.type !== 'textarea') {
				Backbone.trigger('event:InputContainer:hide');
			}
		},
		/**
		 * 关闭Excel时候，保存用户可视区域
		 * @method saveUserView
		 */
		saveUserView: function() {
			var data = {
				excelId: window.SPREADSHEET_AUTHENTIC_KEY,
				sheetId: $("#sheetId").val(),
				startX: cache.UserView.rowAlias,
				startY: cache.UserView.colAlias
			};
		},
		/**
		 * 自动适应屏幕的宽高
		 * @method adaptScreen
		 */
		adaptScreen: function() {
			//待修改（应该把不冻结情况下代码独立）
			this.executiveFrozen();
		},
		/**
		 * 清楚冻结规则
		 * @method clearFrozenRule
		 */
		clearFrozenRule: function() {
			cache.FrozenRules = {
				main: [],
				row: [],
				col: []
			};
		},
		/**
		 * 进行冻结操作
		 * @method clearFrozenRule
		 */
		executiveFrozen: function() {
			var customID = '#' + this.el.id,
				modelRowList = headItemRows,
				modelColList = headItemCols,
				self = this,
				i, j,
				len,
				mainContainer;

			this.clearFrozenRule();

			this.ruleRow();
			this.ruleCol();
			this.ruleMain();

			// destory old view
			Backbone.trigger('event:colsPanelContainer:destroy');
			Backbone.trigger('event:rowsPanelContainer:destroy');
			Backbone.trigger('event:mainContainer:destroy');

			//build new view
			if (cache.TempProp.colFrozen && !cache.TempProp.rowFrozen) {
				//main rules
				len = cache.FrozenRules.main.length;
				for (i = len - 1; i >= 0; i--) {
					cache.CurrentRule = cache.FrozenRules.main[i];
					//添加白色背景，并设置z值
					mainContainer = new MainContainer({
						parentNode: this
					});
					$('tr:eq(1) td:eq(' + (i + 1) + ')', customID).prepend(mainContainer.render().el);
					buildObserverPattern(mainContainer);
				}
			} else if (!cache.TempProp.colFrozen && cache.TempProp.rowFrozen) {
				//main rules
				len = cache.FrozenRules.main.length;
				for (i = len - 1; i >= 0; i--) {
					cache.CurrentRule = cache.FrozenRules.main[i];
					mainContainer = new MainContainer({
						parentNode: this
					});
					$('tr:eq(1) td:eq(2)', customID).prepend(mainContainer.render().el);
					buildObserverPattern(mainContainer);
				}
			} else if (cache.TempProp.colFrozen && cache.TempProp.rowFrozen) {
				var currentPosi;
				for (i = 4; i > 0; i--) {
					currentPosi = i % 2 ? 1 : 2;
					cache.CurrentRule = cache.FrozenRules.main[i - 1];
					mainContainer = new MainContainer({
						parentNode: this
					});
					$('tr:eq(1) td:eq(' + currentPosi + ')', customID).prepend(mainContainer.render().el);
					buildObserverPattern(mainContainer);
				}
			} else if (!cache.TempProp.colFrozen && !cache.TempProp.rowFrozen) {
				cache.CurrentRule = cache.FrozenRules.main[0];
				mainContainer = new MainContainer({
					parentNode: this
				});
				$('tr:eq(1) td:eq(2)', customID).append(mainContainer.render().el);
				buildObserverPattern(mainContainer);
			}
			//colspanel rules
			len = cache.FrozenRules.col.length;
			for (i = 0; i < len; i++) {
				cache.CurrentRule = cache.FrozenRules.col[i];
				var colsPanelContainer = new ColsPanelContainer();
				$('tr:eq(0) td:eq(' + (3 - len + i) + ')', customID).append(colsPanelContainer.render().el);
				buildObserverPattern(colsPanelContainer);
			}
			//rowpanel rules
			len = cache.FrozenRules.row.length;
			for (i = len - 1; i >= 0; i--) {
				cache.CurrentRule = cache.FrozenRules.row[i];
				var rowsPanelContainer = new RowsPanelContainer();
				$('tr:eq(1) td:eq(0)', customID).prepend(rowsPanelContainer.render().el);
				buildObserverPattern(rowsPanelContainer);
			}
			/**
			 * 发布/订阅
			 * @method buildObserverPattern
			 * @param  {object} container 发布者
			 */
			function buildObserverPattern(container) {
				var currentRule = cache.CurrentRule,
					currentSubscribe, len, i;

				currentSubscribe = currentRule.isSubscribe || false;

				if (currentRule.isPublisher) {
					observerPattern.buildPublisher(container);
				}

				if (currentSubscribe) {
					len = currentSubscribe.length;
					observerPattern.buildSubscriber(container);

					for (i = 0; i < len; i++) {
						container.subscribe(currentSubscribe[i].publisherName,
							currentSubscribe[i].action,
							currentSubscribe[i].behavior);
					}

				}

			}
			// this.initMainView();
		},
		/**
		 * 生成列冻结操作规则
		 * @method ruleCol
		 */
		ruleCol: function() {
			var currentIndex,
				currentModel,
				currentModelLeft,
				modelList,
				tempRule,
				userViewModel,
				userViewIndex;
			modelList = headItemCols;

			currentIndex = modelList.getIndexByAlias(cache.TempProp.colAlias);
			if (currentIndex === -1) currentIndex = 0;
			currentModel = modelList.models[currentIndex];
			currentModelLeft = currentModel.toJSON().left;

			userViewModel = modelList.getModelByAlias(cache.UserView.colAlias);
			userViewIndex = modelList.getIndexByAlias(cache.UserView.colAlias);

			if (cache.TempProp.isFrozen && cache.TempProp.colFrozen) {
				tempRule = {
					displayPosition: {
						offsetLeft: 0, // must
						startIndex: userViewIndex,
						startAlias: cache.UserView.colAlias,
						endAlias: cache.TempProp.colAlias,
						endIndex: currentIndex
					},
					boxAttributes: {
						width: currentModelLeft - userViewModel.toJSON().left - 1,
						style: 'frozen-right-border'
					},
					autoScroll: false,
					reduceUserView: true
				};
				cache.FrozenRules.col.push(tempRule);
			} else {
				currentModelLeft = 0;
			}
			tempRule = {
				displayPosition: {
					offsetLeft: currentModelLeft,
					startAlias: cache.TempProp.colAlias,
					startIndex: currentIndex
				},
				boxAttributes: {
					width: this.scrollWidth - this.scrollbarWidth - currentModelLeft
				},
				autoScroll: true,
				isSubscribe: [{
					publisherName: 'mainContainer',
					behavior: 'scrollToPosition', //it's self behavior
					action: 'transversePublish' //publisher behavior
				}]
			};

			if (cache.TempProp.isFrozen && cache.TempProp.colFrozen) {
				tempRule.displayPosition.offsetLeft -= userViewModel.get('left');
				tempRule.boxAttributes.width += userViewModel.toJSON().left;
				tempRule.reduceUserView = true;
			}
			cache.FrozenRules.col.push(tempRule);
		},
		/**
		 * 生成行冻结操作规则
		 * @method ruleRow
		 */
		ruleRow: function() {
			var modelList, currentIndex, currentModel, tempRule, currentModelTop, userViewModel, userViewIndex;
			modelList = headItemRows;

			currentIndex = modelList.getIndexByAlias(cache.TempProp.rowAlias);

			if (currentIndex === -1) {
				currentModelTop = 0;
			} else {
				currentModel = modelList.models[currentIndex];
				currentModelTop = currentModel.toJSON().top;
			}

			userViewIndex = modelList.getIndexByAlias(cache.UserView.rowAlias);
			userViewModel = modelList.models[userViewIndex];


			// 如果索引不是0，说明锁定需要分为两块
			if (cache.TempProp.isFrozen && cache.TempProp.rowFrozen) {
				tempRule = {
					displayPosition: {
						offsetTop: 0, // must
						startAlias: cache.UserView.rowAlias,
						endAlias: cache.TempProp.rowAlias,
						startIndex: userViewIndex,
						endIndex: currentIndex
					},
					boxAttributes: {
						height: currentModelTop - userViewModel.toJSON().top - 1,
						style: 'frozen-bottom-border'
					},
					autoScroll: false,
					reduceUserView: true
				};
				cache.FrozenRules.row.push(tempRule);
			} else {
				currentModelTop = 0;
			}
			tempRule = {
				displayPosition: {
					offsetTop: currentModelTop,
					startIndex: currentIndex,
					startAlias: cache.TempProp.rowAlias
				},
				boxAttributes: {
					height: this.scrollHeight - this.scrollbarWidth - currentModelTop
				},
				autoScroll: true,
				isSubscribe: [{
					publisherName: 'mainContainer',
					behavior: 'scrollToPosition', //it's self behavior
					action: 'verticalPublish' //publisher behavior
				}]
			};
			if (cache.TempProp.isFrozen && cache.TempProp.rowFrozen) {
				tempRule.displayPosition.offsetTop -= userViewModel.get('top');
				tempRule.boxAttributes.height += userViewModel.toJSON().top;
				tempRule.reduceUserView = true;
			}
			cache.FrozenRules.row.push(tempRule);
		},
		/**
		 * 生成自定义冻结操作规则
		 * @method ruleMain
		 */
		ruleMain: function() {
			var tempRule,
				modelRowList = headItemRows,
				modelColList = headItemCols,
				currentRowModel,
				currentColModel,
				currentRowIndex,
				currentColIndex,
				currentRowModelTop,
				currentColModelLeft,
				userViewRowModel,
				userViewColModel,
				userViewRowIndex,
				userViewColIndex;


			currentRowIndex = modelRowList.getIndexByAlias(cache.TempProp.rowAlias);
			currentColIndex = modelColList.getIndexByAlias(cache.TempProp.colAlias);

			if (currentRowIndex === -1) {
				currentRowModelTop = 0;
			} else {
				currentRowModel = modelRowList.models[currentRowIndex];
				currentRowModelTop = currentRowModel.get('top');
			}

			if (currentColIndex === -1) {
				currentColModelLeft = 0;
			} else {
				currentColModel = modelColList.models[currentColIndex];
				currentColModelLeft = currentColModel.get('left');
			}

			//可视点
			userViewRowModel = modelRowList.getModelByAlias(cache.UserView.rowAlias);
			userViewRowIndex = modelRowList.getIndexByAlias(cache.UserView.rowAlias);
			userViewColModel = modelColList.getModelByAlias(cache.UserView.colAlias);
			userViewColIndex = modelColList.getIndexByAlias(cache.UserView.colAlias);


			if (cache.TempProp.isFrozen) {
				if (cache.TempProp.rowFrozen && cache.TempProp.colFrozen) {
					tempRule = {
						boxAttributes: {
							height: currentRowModelTop - userViewRowModel.toJSON().top - 1,
							width: currentColModelLeft - userViewColModel.toJSON().left - 1,
							style: 'container frozen-right-border frozen-bottom-border'
						},
						displayPosition: {
							startColIndex: userViewColIndex,
							endColIndex: currentColIndex,
							startRowIndex: userViewRowIndex,
							endRowIndex: currentRowIndex,
							startColAlias: cache.UserView.colAlias,
							startRowAlias: cache.UserView.rowAlias,
							endColAlias: cache.TempProp.colAlias,
							endRowAlias: cache.TempProp.rowAlias,
							offsetTop: 0,
							offsetLeft: 0
						}
					};
					cache.FrozenRules.main.push(tempRule);
				}
				if (cache.TempProp.rowFrozen) {
					tempRule = {
						boxAttributes: {
							height: currentRowModelTop - userViewRowModel.toJSON().top - 1,
							width: this.scrollWidth - this.scrollbarWidth - currentColModelLeft,
							style: 'container frozen-bottom-border'
						},
						displayPosition: {
							startRowIndex: userViewRowIndex,
							endRowIndex: currentRowIndex,
							startColIndex: currentColIndex,

							startColAlias: cache.TempProp.colAlias,
							startRowAlias: cache.UserView.rowAlias,
							endRowAlias: cache.TempProp.rowAlias,
							offsetLeft: currentColModelLeft,
							offsetTop: 0
						},
						autoScroll: true,
						autoColAlign: true,
						isSubscribe: [{
							publisherName: 'mainContainer',
							behavior: 'subscribeScroll', //it's self behavior
							action: 'transversePublish', //publisher behavior,
							args: {
								'direction': 'TRANSVERSE'
							}
						}]
					};
					if (cache.TempProp.colFrozen) {
						tempRule.boxAttributes.width += userViewColModel.toJSON().left;
						tempRule.displayPosition.offsetLeft -= userViewColModel.get('left');
					}
					cache.FrozenRules.main.push(tempRule);
				}
				if (cache.TempProp.colFrozen) {
					tempRule = {
						boxAttributes: {
							height: this.scrollHeight - this.scrollbarWidth - currentRowModelTop,
							width: currentColModelLeft - userViewColModel.toJSON().left - 1,
							style: 'container frozen-right-border'
						},
						displayPosition: {
							startColIndex: userViewColIndex,
							endColIndex: currentColIndex,
							startRowIndex: currentRowIndex,
							startColAlias: cache.UserView.colAlias,
							startRowAlias: cache.TempProp.rowAlias,
							endColAlias: cache.TempProp.colAlias,
							offsetLeft: 0,
							offsetTop: currentRowModelTop
						},
						autoScroll: true,
						autoRowAlign: true,
						isSubscribe: [{
							publisherName: 'mainContainer',
							behavior: 'subscribeScroll', //it's self behavior
							action: 'verticalPublish', //publisher behavior,
							args: {
								'direction': 'VERTICAL'
							},
						}]
					};
					if (cache.TempProp.rowFrozen) {
						tempRule.boxAttributes.height += userViewRowModel.toJSON().top;
						tempRule.displayPosition.offsetTop -= userViewRowModel.get('top');
					}
					cache.FrozenRules.main.push(tempRule);
				}

			} else {
				currentRowModelTop = 0;
				currentColModelLeft = 0;
			}
			tempRule = {
				boxAttributes: {
					height: this.scrollHeight - currentRowModelTop,
					width: this.scrollWidth - currentColModelLeft,
					style: 'scroll-container'
				},
				displayPosition: {
					startColIndex: currentColIndex,
					startRowIndex: currentRowIndex,
					startColAlias: cache.TempProp.colAlias,
					startRowAlias: cache.TempProp.rowAlias,
					offsetLeft: currentColModelLeft,
					offsetTop: currentRowModelTop,
				},
				autoRowAlign: true,
				autoColAlign: true,
				autoScroll: true,
				eventScroll: true,
				isPublisher: true,
				publisherName: 'mainContainer'
			};
			if (cache.TempProp.rowFrozen) {
				tempRule.boxAttributes.height += userViewRowModel.toJSON().top;
				tempRule.displayPosition.offsetTop -= userViewRowModel.get('top');
			}
			if (cache.TempProp.colFrozen) {
				tempRule.boxAttributes.width += userViewColModel.toJSON().left;
				tempRule.displayPosition.offsetLeft -= userViewColModel.get('left');
			}

			cache.FrozenRules.main.push(tempRule);
		},
		/**
		 * 页面初始化，mainContainer视图位置跳转
		 * @method initMainView
		 */
		// initMainView: function() {
		// 	var startRowHeadModel,
		// 		startColHeadModel;
		// 	if (cache.TempProp.isFrozen === true) {
		// 		return;
		// 	}
		// 	startRowHeadModel = headItemRows.getModelByAlias(cache.UserView.rowAlias);
		// 	startColHeadModel = headItemCols.getModelByAlias(cache.UserView.colAlias);
		// 	Backbone.trigger('event:mainContainer:appointPosition', startRowHeadModel.get('top'), 'VERTICAL');
		// 	Backbone.trigger('event:mainContainer:appointPosition', startColHeadModel.get('left'), 'TRANSVERSE');
		// },
		/**
		 * 计算页面的宽高页面滚动条宽度
		 * @method calculation
		 */
		calculation: function() {

			/**
			 * 页面可视宽度
			 * @property {int} scrollWidth 
			 */
			this.scrollWidth = this.el.offsetWidth - config.System.outerLeft;
			/**
			 * 页面可视高度
			 * @property {int} scrollHeight
			 */
			this.scrollHeight = this.el.offsetHeight - config.System.outerTop - config.System.outerBottom;
			/**
			 * 页面滚动条宽度
			 * @property {int} scrollbarWidth 
			 */
			this.scrollbarWidth = this.getScrollbarWidth();

			cache.scrollbarWidth = this.scrollbarWidth;
		},
		/**
		 * 寻址
		 * @method addressing
		 * @param  {[HTMLElement]}   currrentEl 当前element对象
		 * @param  {[object]}   target     当前对象
		 * @return {boolean} 确定是否已经找到对象
		 */
		addressing: function(currrentEl, target) {
			if (currrentEl.length && currrentEl === target) {
				return true;
			}
			if (currrentEl.parents(target).length && currrentEl.parents(target) === target) {
				return true;
			}
			return false;
		},
		reload: function() {
			var self = this;
			this.$el.find('.mask').css('display', 'block');

			setTimeout(resetData, 0);

			function resetData() {
				var cellList = cells.models,
					headRowList = headItemRows.models,
					headColList = headItemCols.models,
					selectList = selectRegions.models,
					siderLineColList = siderLineCols.models,
					siderLineRowList = siderLineRows.models,
					i, len;
				cache.CellsPosition.strandX = {};
				cache.CellsPosition.strandY = {};
				cache.rowRegionPosi = [];
				cache.sendQueueStep = 0;

				for (i = 0, len = cellList.length; i < len; i++) {
					cellList[0].destroy();
				}
				for (i = 0, len = headRowList.length; i < len; i++) {
					headRowList[0].destroy();
				}
				for (i = 0, len = headColList.length; i < len; i++) {
					headColList[0].destroy();
				}
				for (i = 0, len = selectList.length; i < len; i++) {
					selectList[0].destroy();
				}
				for (i = 0, len = siderLineColList.length; i < len; i++) {
					siderLineColList[0].destroy();
				}
				for (i = 0, len = siderLineRowList.length; i < len; i++) {
					siderLineRowList[0].destroy();
				}

				Backbone.trigger('event:colsPanelContainer:destroy');
				Backbone.trigger('event:rowsPanelContainer:destroy');
				Backbone.trigger('event:mainContainer:destroy');

				window.SPREADSHEET_BUILD_STATE = 'false';
				cache.TempProp = {
					isFrozen: false,
					rowFrozen: false,
					colFrozen: false
				};
				original.restoreExcel(self.el.id);
				self.executiveFrozen();
				self.$el.find('.mask').css('display', 'none');
			}

		},
		/**
		 * 获取鼠标信息
		 * @method mouseInfo
		 * @param  {object}  e body页面移动的event
		 */
		mouseInfo: function(e) {

			//获取相对位置
			this.mousePageX = e.pageX - this.$el.offset().left;
			this.mousePageY = e.pageY - this.$el.offset().top;
		},
		/**
		 * 获取页面的滚动条
		 * @method getScrollbarWidth
		 * @return {int} 滚动条的宽度
		 */
		getScrollbarWidth: function() {
			var virtualEl,
				scrollNone,
				scrollExist;
			virtualEl = $('<div/>').css({
				'width': 50,
				'height': 50,
				'overflow': 'hidden',
				'position': 'absolute',
				'top': -200,
				'left': -200
			}).html('<div style="height:1000px;">');
			this.$el.append(virtualEl);
			scrollNone = getWidth();
			virtualEl.css('overflow-y', 'auto');
			scrollExist = getWidth();
			$(virtualEl).remove();

			function getWidth() {
				return parseInt($('div', virtualEl).innerWidth(), 0);
			}
			return (scrollNone - scrollExist);
		},
		destroy: function() {
			Backbone.off('event:bodyContainer:executiveFrozen');
			Backbone.off('event:commentContainer:show');
			Backbone.off('event:commentContainer:remove');
			Backbone.trigger('event:colsPanelContainer:destroy');
			Backbone.trigger('event:rowsPanelContainer:destroy');
			Backbone.trigger('event:mainContainer:destroy');
			this.sheetsView.destroy();
			this.remove();
		}
	});
	return BodyContainer;
});