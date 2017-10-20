define(function(require) {
    'use strict';
    var Backbone = require('lib/backbone'),
        getTemplate = require('basic/tools/template'),
        getDisplayName = require('basic/tools/getdisplayname'),
        selectRegions = require('collections/selectRegion'),
        protect = require('entrance/tool/protect'),
        selects = require('collections/selectRegion'),
        cols = require('collections/headItemCol'),
        rows = require('collections/headItemRow'),
        cells = require('collections/cells'),
        cache = require('basic/tools/cache'),
        colList = cols.models,
        rowList = rows.models,
        cellList = cells.models,
        lockContainer;

    lockContainer = Backbone.View.extend({
        events: {
            'click .lock-toggle': 'toggle',
            'click .confirm': 'confirm',
            'click .cancel': 'close',
        },
        initialize: function() {
            var select = selectRegions.getModelByType('selected');
            this.listenTo(select, 'change:wholePosi', this.listenToSelect);
            this.lockState = null;
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
            this.$el.html(template());
            this.listenToSelect(selectRegions.getModelByType('selected'));
            return this;
        },
        listenToSelect: function(model) {
            var wholePosi = model.get('wholePosi'),
                startCol,
                endCol,
                startRow,
                endRow;

            startCol = cols.getIndexByAlias(wholePosi.startX);
            startRow = rows.getIndexByAlias(wholePosi.startY);
            endCol = cols.getIndexByAlias(wholePosi.endX);
            endRow = rows.getIndexByAlias(wholePosi.endY);

            this.onLock(startCol, startRow, endCol, endRow);
            this.onContent(startCol, startRow, endCol, endRow);
        },
        onLock: function(startCol, startRow, endCol, endRow) {
            //locked:包含锁定  unlocked:包未锁定
            var i, j, len, len2,
                locked = false,
                unlocked = false,
                rowAlias, colAlias,
                pos = cache.CellsPosition.strandX,
                temp, tempRecord = {},
                tempRowLock = {},
                rowLocked,
                colLocked;

            if (endCol === 'MAX') {
                for (i = startRow, len = endRow + 1; i < len; i++) {
                    locked = (temp = !(rowList[i].get('operProp').locked === false)) || locked;
                    unlocked = !temp || unlocked;
                    if (locked && unlocked) {
                        break;
                    }
                }
            } else if (endRow === 'MAX') {
                for (i = startCol, len = endCol + 1; i < len; i++) {
                    locked = (temp = !(colList[i].get('operProp').locked === false)) || locked;
                    unlocked = !temp || unlocked;
                    if (locked && unlocked) {
                        break;
                    }
                }
            } else {
                outerLooP: for (i = startCol, len = endCol + 1; i < len; i++) {
                    colLocked = colList[i].get('operProp').locked;
                    colLocked = typeof colLocked === 'undefined' ? true : colLocked;
                    for (j = startRow, len2 = endRow + 1; j < len2; j++) {
                        rowAlias = rowList[j].get('alias');
                        colAlias = colList[i].get('alias');

                        if (typeof tempRowLock[j] === 'undefined') {
                            rowLocked = typeof(rowLocked = rowList[j].get('operProp').locked) === 'undefined' ? true : rowLocked;
                            tempRowLock[j] = rowLocked;
                        } else {
                            rowLocked = tempRowLock[j];
                        }

                        if (pos[colAlias] && typeof(temp = pos[colAlias][rowAlias]) !== 'undefined') {
                            if (!tempRecord[temp]) {
                                tempRecord[temp] === true;
                                temp = cellList[temp].get('locked');
                                unlocked = !temp || unlocked;
                                locked = temp || locked;
                            }
                        } else if (!rowLocked || !colLocked) {
                            unlocked = true;
                        } else {
                            locked = true;
                        }
                        if (locked && unlocked) {
                            break outerLooP;
                        }
                    }

                }
            }
            if (locked && unlocked) {
                this.lockState = 'half-locked';
                this.$el.find('.checkbox').removeClass('checked');
                this.$el.find('.checkbox').addClass('half-checked');
            } else if (locked) {
                this.lockState = 'locked';
                this.$el.find('.checkbox').removeClass('half-checked');
                this.$el.find('.checkbox').addClass('checked');
            } else {
                this.lockState = 'unlocked';
                this.$el.find('.checkbox').removeClass('checked');
                this.$el.find('.checkbox').removeClass('half-checked');
            }
        },
        onContent: function(startCol, startRow, endCol, endRow) {
            this.$el.find('input[type=text]').val(this.parseText(
                colList[startCol].get('displayName'),
                rowList[startRow].get('displayName'),
                endCol === 'MAX' ? 'MAX' : colList[endCol].get('displayName'),
                endRow === 'MAX' ? 'MAX' : rowList[endRow].get('displayName')
            ));
        },
        parseText: function(startColName, startRowName, endColName, endRowName) {
            var text = '';
            //整行操作
            if (endColName === 'MAX') {
                if (startRowName !== endRowName) {
                    text = startRowName + ':' + endRowName;
                } else {
                    text = startRowName;
                }
            } else if (endRowName === 'MAX') { //整列操作
                if (startColName !== endColName) {
                    text = startColName + ':' + endColName;
                } else {
                    text = startColName;
                }
            } else {
                if ((startRowName === endRowName) && (startColName === endColName)) {
                    text = startColName + startRowName;
                } else {
                    text = startColName + startRowName + ':' + endColName + endRowName;
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
        toggle: function() {
            if (this.lockState === 'locked' || this.lockState === 'half-locked') {
                this.lockState = 'unlocked';
                this.$el.find('.checkbox').removeClass('checked');
                this.$el.find('.checkbox').removeClass('half-checked');
            } else {
                this.lockState = 'locked';
                this.$el.find('.checkbox').removeClass('half-checked');
                this.$el.find('.checkbox').addClass('checked');
            }
        },
        confirm: function(event) {
            event.preventDefault();
            if (this.lockState === 'half-locked') {
                return;
            }
            if (this.lockState === 'locked') {
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
            this.remove();
            Backbone.trigger('event:sidebarContainer:remove');
        }
    });

    return lockContainer;
});