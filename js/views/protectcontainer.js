define(function(require) {
    'use strict';
    var Backbone = require('lib/backbone'),
        getTemplate = require('basic/tools/template'),
        getDisplayName = require('basic/tools/getdisplayname'),
        listener = require('basic/util/listener'),
        protect = require('entrance/tool/protect'),
        selects = require('collections/selectRegion'),
        cols = require('collections/headItemCol'),
        rows = require('collections/headItemRow'),
        cells = require('collections/cells'),
        cache = require('basic/tools/cache'),
        protectContainer;

    protectContainer = Backbone.View.extend({
        events: {
            'click .confirm': 'confirm',
            'click .cancel': 'close',
        },
        render: function() {
            var template = getTemplate('PROTECTCONTAINER');
            this.$el.html(template());
            return this;
        },
        confirm: function(event) {
            event.preventDefault();
            var value = this.$el.find('input[type=password]').val();
            if (cache.protectState) {
                if (!protect.cancel(value)) {
                    Backbone.trigger('event:showMsgBar:show', '输入密码错误!');
                    return;
                }
            } else {
                protect.execute(value);
            }
            this.close();
        },
        close: function(event) {
            event && event.preventDefault();
            this.remove();
            Backbone.trigger('event:sidebarContainer:remove');
        }
    });

    return protectContainer;
});