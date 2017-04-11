'use strict';
define(function(require) {
	var Backbone = require('lib/backbone'),
		config = require('spreadsheet/config'),
		SelectRegionModel = require('models/selectRegion'),
		SelectRegions;


	/**
	 * 选中区域集合类
	 * @author ray wu
	 * @since 0.1.0
	 * @class SelectRegion  
	 * @module collections
	 * @extends Backbone.Collection
	 * @constructor
	 */
	SelectRegions = Backbone.Collection.extend({
		/**
		 * 集合成员类型
		 * @property model 
		 * @type app.Models.SelectRegion
		 */
		model: SelectRegionModel,
		url: 'select',
		/**
		 * 获取选中区域，相邻对象
		 * @method getAdjacent 
		 * @param  direction {String} 相邻方向
		 */
		getAdjacent: function(direction) {
			var initPosiIndex = this.models[0].get('initPosi'),
				physicsPosi = this.models[0].get('physicsPosi'),
				wholePosiIndex = this.models[0].get('wholePosi'),
				initPosiRowIndex = initPosiIndex.startX,
				wholePosiStartRowIndex = wholePosiIndex.startX,
				wholePosiEndRowIndex = wholePosiIndex.endX,
				model = {};
			switch (direction) {
				case 'LEFT':
					model.initPosi = {};
					model.wholePosi = {};
					model.physicsPosi = {};
					model.physicsBox = {};
					model.initPosi.startX = initPosiRowIndex - 1;
					model.wholePosi.startX = wholePosiStartRowIndex - 1;
					model.wholePosi.endX = wholePosiEndRowIndex - 1;
					model.physicsPosi.left = physicsPosi.left - config.User.cellWidth;
					this.models[0].set(model);
					break;
				case 'RIGHT':

					model.initPosi = {};
					model.wholePosi = {};
					model.physicsPosi = {};
					model.physicsBox = {};
					model.initPosi.startX = initPosiRowIndex + 1;
					model.wholePosi.startX = wholePosiStartRowIndex + 1;
					model.wholePosi.endX = wholePosiEndRowIndex + 1;
					model.physicsPosi.left = physicsPosi.left + config.User.cellWidth;
					this.models[0].set(model);
					break;
				case 'UP':
					break;
				case 'DOWN':
					break;
			}
		},
		/**
		 * 通过选中区域状态进行筛选
		 * @param  {string} type 选中区域类型
		 * @return {array} 筛选结果
		 */
		getModelByType: function(type) {
			return this.findWhere({
				selectType: type
			});
		}
	});
	return new SelectRegions();
});