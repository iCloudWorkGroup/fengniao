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
        lockContainer;

    lockContainer = Backbone.View.extend({
        events: {
            'click .confirm': 'confirm',
            'click .cancel': 'close',
        },
        initialize: function() {
            this.changeSelect = this.getListenerFn();
            listener.addEventListener('selectRegionChange', this.changeSelect);
        },
        render: function() {
            var template = getTemplate('LOCKCONTAINER'),
                startCol,
                startRow,
                endCol,
                endRow,
                region,
                content,
                checked = true,
                cellList,
                i, len;

            region = this.parseSelect();
            startCol = getDisplayName.getColDisplayName(region.startColIndex);
            startRow = getDisplayName.getRowDisplayName(region.startRowIndex);
            endCol = getDisplayName.getColDisplayName(region.endColIndex);
            endRow = getDisplayName.getRowDisplayName(region.endRowIndex);

            cellList = cells.getCellByVertical(region);

            for (i = 0, len = cellList.length; i < len; i++) {
                if (!cellList[i].get('lock')) {
                    checked = false;
                }
            }
            content = this.parseText({
                col: [startCol, endCol],
                row: [startRow, endRow]
            });
            this.$el.html(template({
                content: content,
                checked: checked
            }));
            return this;
        },
        getListenerFn: function() {
            var self = this;
            return function(model) {
                var content = self.parseText(model.point);
                self.$el.find('input[type=text]').val(content);
            }
        },
        parseText: function(point) {
            var col = point.col,
                row = point.row,
                colLen = col.length,
                rowLen = row.length,
                text = '';
            //整行操作
            if (col[colLen - 1] === 'MAX') {
                if (rowLen === 2 && row[0] === row[1]) {
                    text = row[0];
                } else {
                    text = row[0] + ' : ' + row[rowLen - 1];
                }
            } else if (row[rowLen - 1] === 'MAX') { //整列操作
                if (colLen === 2 && col[0] === col[1]) {
                    text = col[0];
                } else {
                    text = col[0] + ' : ' + col[colLen - 1];
                }
            } else {
                if ((rowLen === 1 || row[0] === row[rowLen - 1]) && (colLen === 1 || col[0] === col[colLen - 1])) {
                    text = col[0] + row[0];
                } else {
                    text = col[0] + row[0] + ':' + col[colLen - 1] + row[rowLen - 1];
                }
            }
            return text;
        },
        parseSelect: function() {
            var select = selects.getModelByType('selected'),
                wholePosi = select.get('wholePosi'),
                startColIndex,
                endColIndex,
                startRowIndex,
                endRowIndex;

            startColIndex = cols.getIndexByAlias(wholePosi.startX);
            startRowIndex = rows.getIndexByAlias(wholePosi.startY);
            endColIndex = cols.getIndexByAlias(wholePosi.endX);
            endRowIndex = rows.getIndexByAlias(wholePosi.endY);

            return {
                startColIndex: startColIndex,
                endColIndex: endColIndex,
                startRowIndex: startRowIndex,
                endRowIndex: endRowIndex
            }
        },
        confirm: function() {
            var isLock = this.$el.find('input[type=checkbox]').get(0).checked;
            this.lock(isLock);
        },
        lock: function(isLock) {
            if (isLock) {
                protect.lock();
            } else {
                protect.unlock();
            }
            this.destroy();
        },
        close: function(event) {
            event.preventDefault();
            this.destroy();
        },
        destroy: function() {
            listener.removeEventListener('selectRegionChange', this.changeSelect);
            Backbone.trigger('event:sidebarContainer:remove');
        }
    });

    return lockContainer;
});