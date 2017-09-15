'use strict';
define(function(require) {
	var Handlebars = require('lib/handlebars'),
		templatesHTML = {},
		template = {};

	templatesHTML.BODYTEMPLATE = '<div class="main-layout">';
	templatesHTML.BODYTEMPLATE += '<table class="cui-grid" cellspacing="0" cellpadding="0" id="tableContainer">';
	templatesHTML.BODYTEMPLATE += '<tbody><tr><td><div class="left-corner"></div></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></tbody>';
	templatesHTML.BODYTEMPLATE += '</table></div>';
	templatesHTML.BODYTEMPLATE += '<div class="sheet-layout"><div class="sheet-body">';
	templatesHTML.BODYTEMPLATE += '<div class="sheet-cf-box glyphicons glyphicon-plus"></div>';
	templatesHTML.BODYTEMPLATE += '<div class="sheet-cf-box active glyphicons glyphicon-th-list"></div>';
	templatesHTML.BODYTEMPLATE += '<div class="sheet-cf-list"></div></div></div>';
	templatesHTML.BODYTEMPLATE += '<div class="mask"><div class="mask-bg"></div>';
	templatesHTML.BODYTEMPLATE += '<div class="mask-text">加载中..&nbsp;. &nbsp;. &nbsp;&nbsp;.</div></div>';
	templatesHTML.BODYTEMPLATE += '</div>';

	templatesHTML.SHEETTEMPLATE = '<span>{{name}}</span>';

	templatesHTML.ROWHEADTEMPLATE = '<div class="item">{{displayName}}</div>';
	templatesHTML.COLHEADTEMPLATE = '<div class="item">{{displayName}}</div>';

	templatesHTML.INPUTTEMPLATE = '<div class="textarea"><textarea class="input-container"></textarea><div>';

	templatesHTML.SELECTTEMPLATE = '<div class="box"><div class="expand"></div><div class="bg"></div></div>';

	templatesHTML.CELLTEMPLATE = '<div class="bg" style="display:table-cell;"></div>';

	templatesHTML.COLGRIDTEMPLATE = '<div class="col" style="left:{{left}}px;"></div>';
	templatesHTML.ROWGRIDTEMPLATE = '<div class="row" style="top:{{top}}px;"></div>';

	templatesHTML.COMMENTTEMPLAET = '<div></div>';

	templatesHTML.SIDERBARTEMPLATE = '<div class="siderbar-title"><span>{{title}}</span>';
	templatesHTML.SIDERBARTEMPLATE += '<a href="#" class="fui-cf-bg-extend2-ico ico-close close" title="关闭"></a></div>';
	templatesHTML.SIDERBARTEMPLATE += '<div class="siderbar-body"></div></div>';

	templatesHTML.LOCKCONTAINER = '<div class="siderbar-item"><div class="lock-content">';
	templatesHTML.LOCKCONTAINER += '<div class="title"><span>锁定</span><div class="checkbox lock-toggle"></div></div>';
	templatesHTML.LOCKCONTAINER += '<div class="content"><label>所选区域：</label><input type="text" disabled="disabled"></div>';
	templatesHTML.LOCKCONTAINER += '<div class="oper"><a href="#" class="confirm">确定</a><a href="#" class="cancel">取消</a></div></div></div>';

	templatesHTML.PROTECTCONTAINER = '<div class="siderbar-item"><div class="protect-content">';
	templatesHTML.PROTECTCONTAINER += '<div class="content"><label>密码：</label><input type="password"></div>';
	templatesHTML.PROTECTCONTAINER += '<div class="oper"><a href="#" class="confirm">确定</a><a href="#" class="cancel">取消</a></div></div></div>';

	templatesHTML.MSGCONTAINER = '<div class="msg"><span class="msg-content">{{msg}}</span></div>';

	function getTemplate(type) {
		var tmpType;
		if (tmpType = template[type]) {
			return tmpType;
		}
		tmpType = template[type] = Handlebars.compile(templatesHTML[type]);
		return tmpType;
	}
	return getTemplate;
});