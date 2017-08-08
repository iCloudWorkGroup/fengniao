//attention bug, those name didn't significance
//attention bug, between user config and system config mix
'use strict';
define(function() {
	/**
	 * 系统配置变量
	 * @author ray wu
	 * @class config
	 * @since 0.1.0
	 * @module basic
	 */
	return {
		/**
		 * 用户可配置属性
		 * @property {object} User
		 */
		User: {
			/**
			 * 页面初始化行数
			 * @property {int} initRowNum
			 */
			initRowNum: 100,
			/**
			 * 页面初始化列数
			 * @property {int} initColNum
			 */
			initColNum: 26,
			/**
			 * 单元格宽度
			 * @property {int} cellWidth
			 */
			cellWidth: 72,
			/**
			 * 单元格高度
			 * @property {int} cellHeight
			 */
			cellHeight: 20,
			/**
			 * excel最大支持行数
			 * @property {number} maxRowNum
			 */
			maxColNum: 100,
			/**
			 * excel最大支持行数
			 * @property {number} maxRowNum
			 */
			maxRowNum: 9999,
			/**
			 * 备注宽度
			 * @type {Number}
			 */
			commentWidth: 150,
			/**
			 * 备注高度
			 */
			commentHeight: 150,
		},
		/**
		 * 系统配置属性
		 * @property {object} System
		 */
		System: {
			/**
			 * 页面左侧距离
			 * @property {int} outerLeft
			 */
			outerLeft: 37,
			/**
			 * 页面顶部距离
			 * @property {int} outerTop
			 */
			outerTop: 20,
			/**
			 * 页面底部距离
			 * @property {int} outerBottom
			 */
			outerBottom: 30,
			/**
			 * 列调整时，鼠标手势变化的距离
			 * @property {int} effectDistanceCol
			 */
			effectDistanceCol: 10,
			/**
			 * 行调整时，鼠标手势变化的距离
			 * @property {int} effectDistanceRow
			 */
			effectDistanceRow: 5,
			/**
			 * 预加载，行隐藏的距离
			 * @property {int} prestrainHeight
			 */
			prestrainHeight: 200,
			/**
			 * 预加载，列隐藏的距离
			 * @property {number} prestrainWidth
			 */
			prestrainWidth: 100,
			/**
			 * excel最大支持行数
			 * @property {number} maxRowNum
			 */
			maxRowNum: 9999,
			/**
			 * 批注输入框宽高
			 * @type {Object}
			 */
			comment: {
				height: 150,
				width: 150
			}
		},
		mouseOperateState: {
			select: 'selected',
			dataSource: 'datasource',
			drag: 'drag',
			highlight: 'highlight'
		},
		dateFormatType: {
			frist: 'yyyy/MM/dd',
			second: 'yyyy/MM',
			third: 'yyyy',
			fourth: 'yyyy年MM月dd日',
			fifth: 'yyyy年MM月',
			sixth: 'yyyy年'
		},
		defaultNumberFormat: {
			decimal: 6
		},
		shortcuts: {
			clip: true,
			alt_enter: true,
			enter: true,
			delete: true,
			redo: true,
			undo: true,
			arrow: true
		},
		url: {
			row: {
				plus: 'row/plus',
				reduce: 'row/reduce',
				hide: 'row/hide',
				show: 'row/show',
				adjust: 'row/adjust',
				plusBatch: 'row/plus-batch'
			},
			col: {
				plus: 'col/plus',
				reduce: 'col/reduce',
				hide: 'col/hide',
				show: 'col/show',
				adjust: 'col/adjust',
				plus_batch: 'col/plus-batch'
			},
			cell: {
				merge: 'cell/merge',
				split: 'cell/split',
				border: 'cell/border',
				bg: 'cell/bg',
				wordwrap: 'cell/wordwrap',
				align_transverse: 'cell/align-landscape',
				align_vertical: 'cell/align-portrait',
				format: 'cell/format',
				content: 'cell/content',
				comment_plus: 'cell/comment-plus',
				comment_del: 'cell/comment-reduce',
				font_size: 'cell/font-size',
				font_family: 'cell/font-family',
				font_weight: 'cell/font-weight',
				font_italic: 'cell/font-italic',
				font_color: 'cell/font-color',
				bg_batch: 'cell/bg-batch',
				underline: 'cell/font-underline'
			},
			table: {
				reload: 'reload'
			},
			sheet: {
				cut: 'sheet/cut',
				copy: 'sheet/copy',
				paste: 'sheet/paste',
				undo: 'sheet/undo',
				redo: 'sheet/redo',
				frozen: 'sheet/frozen',
				unfrozen: 'sheet/unfrozen',
				load: 'sheet/area'
			},

		},
		version: '@version@',
		rootPath: 'http://excel-inc.acmr.com.cn/master/'
	};
});