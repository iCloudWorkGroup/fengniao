'use strict';
define(function(require) {
	var _ = require('lib/underscore'),
		Backbone = require('lib/backbone'),
		binary = require('basic/util/binary'),
		LineColModel = require('models/lineCol'),
		selectRegions = require('collections/selectRegion');
	/**
	 *列标集合类
	 * @author ray wu
	 * @since 1.0.0
	 * @class HeadItemCol 
	 * @module collections
	 * @extends Backbone.Collection
	 * @constructor
	 */
	var HeadItemCols = Backbone.Collection.extend({
		/**
		 * 集合成员类型
		 * @property model 
		 * @type app.Models.LineCol
		 */
		model: LineColModel,
		url: 'itemcol',
		/**
		 * 获取选中区域初始单元格列标
		 * @method getModelInitSelectRegion
		 * @return {app.Models.LineCol} lineCol对象
		 */
		getModelInitSelectRegion: function() {
			return this.models[selectRegions.models[0].toJSON().initPosi.startX];
		},
		/**
		 * 获取选中区域的所有列对象
		 * @method getModelListByWholeSelectRegion
		 * @return {app.Models.LineCol} lineCol对象
		 */
		getModelListByWholeSelectRegion: function() {
			var modelList = [],
				selectRegion,
				between,
				startIndexCol,
				endIndexCol,
				i = 0;

			selectRegion = selectRegions.models[0];
			startIndexCol = selectRegion.get('wholePosi').startX;
			endIndexCol = selectRegion.get('wholePosi').endX;
			between = endIndexCol - startIndexCol + 1;
			for (; i < between; i++) {
				modelList.push(this.models[startIndexCol + i]);
			}
			return modelList;
		},
		getIndexBySort: function(sort) {
			if (sort === 'MAX') {
				return 'MAX';
			}
			return binary.indexAttrBinary(sort, this.models, 'sort');
		},
		getAliasBySort: function(sort) {
			var index;
			if (sort === 'MAX') {
				return 'MAX';
			}
			index = binary.indexAttrBinary(sort, this.models, 'sort');
			if (index === -1) {
				return -1;
			}
			return this.models[index].get('alias');
		},
		getIndexByDisplayname: function(displayName) {
			var model = this.findWhere({
				'displayName': displayName
			});
			return _.indexOf(this.models, model);
		},
		/**
		 * 获取区域的所有列对象
		 * @method getModelListByIndex
		 * @return {Array} lineCol数组
		 */
		getModelListByIndex: function(startColIndex, endColIndex) {
			var i, modelList = [];
			for (i = startColIndex; i < endColIndex + 1; i++) {
				modelList.push(this.models[i]);
			}
			return modelList;
		},

		/**
		 * 获取整个列标容器宽度
		 * @method getMaxDistanceWidth
		 * @return {int} 宽度
		 */
		getMaxDistanceWidth: function() {
			var currentModel = this.models[this.models.length - 1];
			return currentModel.get('left') + currentModel.get('width');
		},
		/**
		 * 根据别名获取对象的索引
		 * @method getModelByAlias
		 * @param {string} alias 列别名
		 * @return {int} 索引值
		 */
		getIndexByAlias: function(alias) {
			var i, len, modelList = this.models;
			if (alias === 'MAX') {
				return 'MAX';
			} else {
				for (i = 0, len = this.length; i < len; i++) {
					if (modelList[i].attributes.alias === alias) {
						return i;
					}
				}
			}
			return -1;
		},
		/**
		 * 通过别名查询符合条件标线的对象
		 * @method getModelByAlias
		 * @param  {string} alias 别名
		 * @return {app.Models.LineCol} 对象
		 */
		getModelByAlias: function(alias) {
			return this.findWhere({
				'alias': alias
			});
		},
		/**
		 * 通过坐标查询符合条件标线的对象
		 * @method getModelByAlias
		 * @param  {number} posi 坐标
		 * @return {app.Models.LineCol} 对象
		 */
		getModelByPosition: function(posi) {
			var currentIndex = binary.newModelBinary(posi, this.models, 'left', 'width', 0, this.models.length - 1);
			return this.models[currentIndex];
		},
		/**
		 * 获取相邻标线的对象
		 * @method getNeighborModelByAlias
		 * @param  {number} alias 坐标
		 * @return {app.Models.LineCol} 对象
		 */
		getNeighborModelByAlias: function(alias, redirction) {
			var modelList = this.models,
				len = modelList.length,
				currentIndex;
			//toward to right
			if (redirction === 'RIGHT') {
				currentIndex = this.getIndexByAlias(alias);
				if (currentIndex === len - 1) {
					return null;
				}
				return modelList[currentIndex + 1];
			}
			// toward to left
			if (redirction === 'LEFT') {
				currentIndex = this.getIndexByAlias(alias);
				if (currentIndex === 0) {
					return null;
				}
				return modelList[currentIndex - 1];
			}
			return null;
		}
	});
	return new HeadItemCols();
});