define(function(require) {
	'use strict';
	var CellsContainerView = require('views/cellsContainer'),
		SelectRegionView = require('views/selectRegion'),
		Backbone = require('lib/backbone'),
		cache = require('basic/tools/cache'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		selectRegions = require('collections/selectRegion'),
		SelectRegionModel = require('models/selectRegion'),
		cells = require('collections/cells'),
		headItemColList = headItemCols.models,
		headItemRowList = headItemRows.models,
		highlightAction,
		highlightRender,
		addListen,
		extend,
		initialize1,
		initialize2;

	extend = function(target, options) {
		var name;
		for (name in options) {
			target[name] = options[name];
		}
	}
	addListen = function(modelName, fn) {
		Backbone.trigger('event:' + modelName + ':extend', fn);
	}

	highlightAction = {
		/**
		 * 开启单元格边框高亮功能
		 */
		startHighlight: function() {
			//鼠标移动阻止原有事件（mousedown,mousemove）
			this.undelegateEvents();
			this.$el.off('mousemove', this.dragSelect);
			//监听鼠标移动事件
			this.$el.on('mousemove', this.highlightMove);
		},
		/**
		 * 停止单元格边框高亮功能
		 * @return {[type]} [description]
		 */
		stopHighlight: function() {
			var selectModel;
			//移除鼠标事件监听
			this.$el.off('mousemove', this.highlightMove);
			//绑定视图原有事件
			this.delegateEvents();
			selectModel = selectRegions.getModelByType('highlight');
			if (typeof selectModel !== undefined) {
				selectModel.destroy();
			}
		},
		/**
		 * 模块监听
		 * @param  {object} event 鼠标移动事件
		 */
		highlightMove: function(event) {
			var strandCol = cache.CellsPosition.strandX,
				cellModel,
				selectModel,
				relativeRowPosi,
				relativeColPosi,
				colIndex,
				rowIndex,
				colAlias,
				rowAlias,
				direction,
				select,
				left,
				top,
				right,
				bottom;

			select = this.getCoordinateByMouseEvent(event);
			colIndex = select.colIndex;
			rowIndex = select.rowIndex;
			relativeRowPosi = select.relativeRowPosi;
			relativeColPosi = select.relativeColPosi;
			colAlias = headItemColList[colIndex].get('alias');
			rowAlias = headItemRowList[rowIndex].get('alias');

			selectModel = selectRegions.getModelByType('highlight')

			if (strandCol[colAlias] && typeof strandCol[colAlias][rowAlias] !== 'undefined') {
				cellModel = cells.models[strandCol[colAlias][rowAlias]];
			}

			if (typeof cellModel !== 'undefined' && cellModel.get('highlight')) {
				left = cellModel.get('physicsBox').left;
				top = cellModel.get('physicsBox').top;
				right = left + cellModel.get('physicsBox').width;
				bottom = top + cellModel.get('physicsBox').height;
			} else {
				cache.highlightDirection = 'null';
				selectModel && selectModel.set('hightlight', null);
				return;
			}
			if (typeof selectModel === 'undefined') {
				selectModel = new SelectRegionModel();
				selectModel.set('selectType', 'highlight');
				selectRegions.add(selectModel);
			}
			selectModel.set('tempPosi', {
				initColIndex: colIndex,
				initRowIndex: rowIndex,
				mouseColIndex: colIndex,
				mouseRowIndex: rowIndex
			});
			direction = getLightDirection();
			selectModel.set(
				'highlightDirection', direction
			);
			cache.highlightDirection = direction;

			function getLightDirection() {
				var rightDistance = right - relativeColPosi,
					leftDistance = relativeColPosi - left,
					topDistance = relativeRowPosi - top,
					bottomDistance = bottom - relativeRowPosi,
					temp = rightDistance,
					direction = "right";

				if (temp > leftDistance) {
					temp = leftDistance;
					direction = "left";
				}
				if (temp > topDistance) {
					temp = topDistance;
					direction = "top";
				}
				if (temp > bottomDistance) {
					temp = bottomDistance;
					direction = "bottom";
				}
				return direction;
			}
		}
	}
	highlightRender = {
		highlight: function() {
			var direction = this.model.get('highlightDirection');
			this.$el.removeClass("highlight-right");
			this.$el.removeClass("highlight-left");
			this.$el.removeClass("highlight-top");
			this.$el.removeClass("highlight-bottom");
			this.$el.addClass('highlight-' + direction);
		}
	}
	extend(CellsContainerView.prototype, highlightAction);
	extend(SelectRegionView.prototype, highlightRender);

	initialize1 = CellsContainerView.prototype.initialize;
	CellsContainerView.prototype.initialize = function(options) {
		initialize1.call(this, options);
		Backbone.on('event:cellsContainer:startHighlight', this.startHighlight, this);
		Backbone.on('event:cellsContainer:stopHighlight', this.stopHighlight, this);
		_.bindAll(this, 'highlightMove');
	}
	initialize2 = SelectRegionView.prototype.initialize;
	SelectRegionView.prototype.initialize = function(options) {
		initialize2.call(this, options);
		if (this.model.get('selectType') === 'highlight') {
			this.listenTo(this.model, 'change:highlightDirection', this.highlight);
		}
	}

	return {
		startHighlight: function() {
			Backbone.trigger('event:cellsContainer:startHighlight');
		},
		stopHighlight: function() {
			Backbone.trigger('event:cellsContainer:stopHighlight');
		},
		getLightDirection: function() {
			return cache.highlightDirection;
		}
	}
});