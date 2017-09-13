define(function(require) {
	'use strict';
	var SiderbarContainer,
		Backbone = require('lib/backbone'),
		getTemplate = require('basic/tools/template'),
		cache = require('basic/tools/cache'),
		config = require('spreadsheet/config'),
		LockContainer = require('views/lockcontainer'),
		ProtectContainer = require('views/protectcontainer');

	SiderbarContainer = Backbone.View.extend({
		className: 'siderbar',

		events: {
			'click .close': 'close'
		},
		initialize: function(options) {
			this.type = options.type;
		},
		render: function() {
			var template = getTemplate('SIDERBARTEMPLATE'),
				title = '',
				child;
			switch (this.type) {
				case 'lock':
					title = '单元格锁定';
					child = new LockContainer();
					break;
				case 'protect':
					title = cache.protectState ? '撤销保护工作簿' : '保护工作薄';
					child = new ProtectContainer();
				default:
					break;
			}

			this.$el.html(template({
				title: title
			}));

			if (child) {
				this.$el.find('.siderbar-body').append(child.render().el);
			}

			this.$el.css({
				width: config.sidebarWidth
			});
			return this;
		},
		close: function(e) {
			e.preventDefault();
			Backbone.trigger('event:sidebarContainer:remove');
		},
		destroy: function() {
			this.remove();
		}
	});

	return SiderbarContainer;
});