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
			 * 进行选中操作，初始点击位置，保存值为索引值
			 * @property {object} initPosi
			 */
			initPosi: {
				/**
				 * 鼠标的`X`的位置索引
				 * @property {number} startX
				 */
				startX: 0,
				/**
				 * 鼠标的`Y`的位置索引
				 * @property {number} startY
				 */
				startY: 0,
			},
			/**
			 * 鼠标位置，保存值为索引值
			 * @property {object} mousePosi
			 */
			mousePosi: {
				/**
				 * 鼠标的`X`的位置索引
				 * @property {number} mouseX
				 */
				mouseX: 0,
				/**
				 * 鼠标的`Y`的位置索引
				 * @property {number} mouseY
				 */
				mouseY: 0
			},
			/**
			 * 相对位置属性
			 * @property {object} physicsPosi
			 */
			physicsPosi: {
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
			/**
			 * 宽高属性
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
				height: 19
			},
			//current box start,end postion index value (complete)
			/**
			 * [wholePosi description]
			 * @property {object} wholePosi
			 */
			wholePosi: {
				/**
				 * 开始盒模型`col`索引值
				 * @property {number} startX
				 */
				startX: 0,
				/**
				 * 开始盒模型`row`索引值
				 * @property {number} startY
				 */
				startY: 0,
				/**
				 * 结束盒模型`col`索引值
				 * @property {number} endX
				 */
				endX: 0,
				/**
				 * 结束盒模型`row`索引值
				 * @property {number} endY
				 */
				endY: 0
			},
			selectType: 'operation' // 'dataSource','drag' , 'clip'
		}
	});
	return SelectRegion;
});