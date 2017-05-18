define(function(require) {
	'use strict';

	var Backbone = require('lib/backbone'),
		cache = require('basic/tools/cache'),
		SelectRegionModel = require('models/selectRegion'),
		selectRegions = require('collections/selectRegion'),
		headItemCols = require('collections/headItemCol'),
		headItemRows = require('collections/headItemRow'),
		cells = require('collections/cells'),
		CellsContainerView = require('views/cellsContainer'),
		SelectRegionView = require('views/selectRegion'),
		headItemColList = headItemCols.models,
		headItemRowList = headItemRows.models,
		highlightAction,
		highlightRender,
		extend,
		initialize;

	extend = function(target, options) {
		var name;
		for (name in options) {
			target[name] = options[name];
		}
	}

	highlightAction = {
		hightlightMoveState: function() {
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

			selectModel = selectRegions.getModelByType('highlight');
			cellModel = cells.getCellByVertical(colIndex, rowIndex)[0];

			if (typeof cellModel !== 'undefined' && cellModel.get('highlight')) {
				left = cellModel.get('physicsBox').left;
				top = cellModel.get('physicsBox').top;
				right = left + cellModel.get('physicsBox').width;
				bottom = top + cellModel.get('physicsBox').height;
			} else {
				cache.highlightDirection = 'null';
				selectModel && selectModel.set('highlightDirection', null);
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
			if(direction){
				this.$el.addClass('highlight-' + direction);
			}	
		}
	}

	extend(CellsContainerView.prototype, highlightAction);
	extend(SelectRegionView.prototype, highlightRender);

	initialize = SelectRegionView.prototype.initialize;
	SelectRegionView.prototype.initialize = function(options) {
		initialize.call(this, options);
		if (this.model.get('selectType') === 'highlight') {
			this.listenTo(this.model, 'change:highlightDirection', this.highlight);
		}
	}
	return {
		startHighlight: function() {
			Backbone.trigger('event:cellsContainer:setMouseState', 'moveState', 'hightlightMoveState');
		},
		stopHighlight: function() {
			if (selectRegions.getModelByType('highlight') !== undefined) {
				selectRegions.getModelByType('highlight').destroy();
			}
			Backbone.trigger('event:cellsContainer:setMouseState', 'moveState', 'commonMoveState');
		},
		getLightDirection: function() {
			return cache.highlightDirection;
		}
	}
});