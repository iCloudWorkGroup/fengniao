define(function(require) {
	'use strict';
	var SiderbarContainer,
		Backbone = require('lib/backbone'),
		getTemplate = require('basic/tools/template'),
		PreventContainer = require('views/preventcontainer');

	SiderbarContainer = Backbone.View.extend({
		className: 'siderbar',
		events: {
			'click .close': 'close'
		},
		initialize: function(options) {
			this.width = options.width;
			this.type = options.type;
		},
		render: function() {
			var template = getTemplate('SIDERBARTEMPLATE'),
				title = '',
				child;

			switch (this.type) {
				case 'prevent':
					title = '单元格锁定';
					child = new PreventContainer();
					break;
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
				width: this.width
			});
			return this;
		},
		appendProtectItem: function(template) {
			var protectItemContainer;
			protectItemContainer = new ProtectItemContainer();
			(protectItemContainer.render().el);
		},
		close: function(e) {
			e.preventDefault();
			Backbone.trigger('event:siderbarContainer:remove');
			Backbone.trigger('event:cancelShrinkContainer');
		},
		destroy: function() {
			this.remove();
		}
	});

	return SiderbarContainer;
});