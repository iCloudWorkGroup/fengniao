//attention bug, those name didn't significance
'use strict';
define(function(require) {
	var BackboneNest = require('lib/backbone.nested'),
		SelectRegion;

	/**
	 * 选中区域模型对象
	 * @author ray wu
	 * @since 0.1.0
	 * @class SelectRegion  
	 * @module models
	 * @extends Backbone.NestedModel
	 * @constructor
	 */
	SelectRegion = BackboneNest.NestedModel.extend({
		defaults: {
			/**
			 * 瞬间操作缓存对象，直接记录索引值
			 * @property {object} tempPosi
			 */
			tempPosi: {
				/**
				 * 点击位置索引
				 * @property {number} initColIndex
				 */
				initColIndex: 0,
				/**
				 * 点击位置索引
				 * @property {number} initRowIndex
				 */
				initRowIndex: 0,
				/**
				 * 鼠标当前位置索引
				 * @property {number} mouseRowIndex
				 */
				mouseColIndex: 0,
				/**
				 * 鼠标当前位置索引
				 * @property {number} mouseRowIndex
				 */
				mouseRowIndex: 0
			},
			/**
			 * 盒子模型
			 * @property {object} physicBox
			 */
			physicsBox: {
				/**
				 * 宽度
				 * @property {number} width
				 */
				width: 71,
				/**
				 * 高度
				 * @property {number} height
				 */
				height: 19,
				/**
				 * 相对位置`top`值
				 * @property {number} top
				 */
				top: 0,
				/**
				 * 相对位置`left`值
				 * @property {number} left
				 */
				left: 0,
			},
			//current box start,end postion index value (complete)
			/**
			 * 待修改:缓存值使用排序码
			 * [wholePosi description]
			 * @property {object} wholePosi
			 */
			wholePosi: {
				/**
				 * 开始盒模型`col`别名
				 * @property {number} startX
				 */
				startX: 0,
				/**
				 * 开始盒模型`row`别名
				 * @property {number} startY
				 */
				startY: 0,
				/**
				 * 结束盒模型`col`别名
				 * @property {number} endX
				 */
				endX: 0,
				/**
				 * 结束盒模型`row`别名
				 * @property {number} endY
				 */
				endY: 0
			},
			selectType: 'selected' // 'dataSource','drag' , 'clip' , 'highlight'
		}
	});
	return SelectRegion;
});