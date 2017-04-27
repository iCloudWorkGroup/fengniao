  'use strict';
  define(function(require) {
    var send = require('basic/tools/send'),
      cells = require('collections/cells'),
      config = require('spreadsheet/config'),
      getOperRegion = require('basic/tools/getoperregion'),
      selectRegions = require('collections/selectRegion'),
      headItemRows = require('collections/headItemRow'),
      headItemCols = require('collections/headItemCol'),
      rowOperate = require('entrance/row/rowoperation'),
      colOperate = require('entrance/col/coloperation'),
      history = require('basic/tools/history'),
      cache = require('basic/tools/cache'),
      textTypeHandler;

    textTypeHandler = {
      /**
       * 自动识别类型：暂只支持由默认的常规类型，转为日期类型的识别方式
       * @return {string} 返回识别后，格式化类型
       */
      typeRecognize: function(model) {
        var text = model.get('content').texts,
          type = model.get('format').type;
        if (type === 'normal' && this.isDate(text)) {
          model.set('format.dateFormat', this.getDateFormat(text));
          model.set('format.type', 'date');
          this.generateDisplayText(model);
        }
      },
      /**
       * 暂时不支持由日期类型转为常规类型
       */
      setNormal: function(sheetId, label) {
        var self,
          clip,
          region,
          operRegion,
          sendRegion,
          format;

        self = this;

        clip = selectRegions.getModelByType('clip');
        if (clip !== undefined) {
          cache.clipState = 'null';
          clip.destroy();
        }
        region = getOperRegion(label);
        operRegion = region.operRegion;
        sendRegion = region.sendRegion;
        format = {
          type: 'normal',
          isValid: false,
          decimal: null,
          thousands: null,
          dateFormat: null,
          currencySign: null,
          currencyValid: false
        };
        //处理第三方调用，操作超出已加载区域
        if (operRegion.startColIndex === -1 || operRegion.startRowIndex === -1) {
          this.sendData(format, sendRegion);
          return;
        }
        if (operRegion.endColIndex === 'MAX') { //整行操作
          rowOperate.rowPropOper(operRegion.startRowIndex, 'format', format);
        } else if (operRegion.endRowIndex === 'MAX') {
          colOperate.colPropOper(operRegion.startColIndex, 'format', format);
        } else {
          cells.operateCellsByRegion(operRegion, function(cell) {
            cell.set('format', format);
          });
        }
        this.sendData(format, sendRegion);
      },
      setText: function(sheetId, label) {
        var self = this,
          clip,
          region,
          operRegion,
          sendRegion,
          format;


        clip = selectRegions.getModelByType('clip');
        if (clip !== undefined) {
          cache.clipState = 'null';
          clip.destroy();
        }
        region = getOperRegion(label);
        operRegion = region.operRegion;
        sendRegion = region.sendRegion;
        format = {
          type: 'text',
          isValid: false,
          decimal: null,
          thousands: null,
          dateFormat: null,
          currencySign: null,
          currencyValid: false
        };
        if (operRegion.startColIndex === -1 || operRegion.startRowIndex === -1) {
          this.sendData(format, sendRegion);
          return;
        }
        if (operRegion.endColIndex === 'MAX') { //整行操作
          rowOperate.rowPropOper(operRegion.startRowIndex, 'format', format);
        } else if (operRegion.endRowIndex === 'MAX') {
          colOperate.colPropOper(operRegion.startColIndex, 'format', format);
        } else {
          cells.operateCellsByRegion(operRegion, function(cell) {
            cell.set('format', format);
          });
        }

        this.sendData(format, sendRegion);
      },
      setNum: function(sheetId, thousands, decimal, label) {
        var self,
          clip,
          region,
          operRegion,
          sendRegion,
          changeModelList = [],
          headItemRowList = headItemRows.models,
          headItemColList = headItemCols.models,
          format;

        clip = selectRegions.getModelByType('clip');
        if (clip !== undefined) {
          cache.clipState = 'null';
          clip.destroy();
        }
        self = this;
        region = getOperRegion(label);
        operRegion = region.operRegion;
        sendRegion = region.sendRegion;
        format = {
          type: 'number',
          isValid: false,
          decimal: decimal,
          thousands: thousands,
          dateFormat: null,
          currencySign: null,
          currencyValid: false
        };
        if (operRegion.startColIndex === -1 || operRegion.startRowIndex === -1) {
          this.sendData(format, sendRegion);
          return;
        }
        if (operRegion.endColIndex === 'MAX') { //整行操作
          rowOperate.rowPropOper(operRegion.startRowIndex, 'format', format);
        } else if (operRegion.endRowIndex === 'MAX') { //整行操作
          colOperate.colPropOper(operRegion.startColIndex, 'format', format);
        } else {
          cells.operateCellsByRegion(operRegion, function(cell, colSort, rowSort) {
            changeModelList.push({
              colSort: colSort,
              rowSort: rowSort,
              value: cell.get('format')
            });
            cell.set('format', format);
          });
          history.addUpdateAction('format', format, {
            startColSort: headItemColList[operRegion.startColIndex].get('sort'),
            startRowSort: headItemRowList[operRegion.startRowIndex].get('sort'),
            endColSort: headItemColList[operRegion.endColIndex].get('sort'),
            endRowSort: headItemRowList[operRegion.endRowIndex].get('sort')
          }, changeModelList);
        }
        this.sendData(format, sendRegion);
      },
      setDate: function(sheetId, dateFormat, label) {
        var self,
          clip,
          region,
          operRegion,
          sendRegion,
          changeModelList = [],
          headItemRowList = headItemRows.models,
          headItemColList = headItemCols.models,
          format;
        clip = selectRegions.getModelByType('clip');
        if (clip !== undefined) {
          cache.clipState = 'null';
          clip.destroy();
        }
        format = {
          type: 'date',
          isValid: false,
          decimal: null,
          thousands: null,
          dateFormat: dateFormat,
          currencySign: null,
          currencyValid: false
        };
        region = getOperRegion(label);
        operRegion = region.operRegion;
        sendRegion = region.sendRegion;
        self = this;
        if (operRegion.startColIndex === -1 || operRegion.startRowIndex === -1) {
          this.sendData(format, sendRegion);
          return;
        }
        if (operRegion.endColIndex === 'MAX') { //整行操作
          rowOperate.rowPropOper(operRegion.startRowIndex, 'format', format);
        } else if (operRegion.endRowIndex === 'MAX') { //整列操作
          colOperate.colPropOper(operRegion.startColIndex, 'format', format);
        } else {
          cells.operateCellsByRegion(operRegion, function(cell, colSort, rowSort) {
            changeModelList.push({
              colSort: colSort,
              rowSort: rowSort,
              value: cell.get('format')
            });
            cell.set('format', format);
          });
          history.addUpdateAction('format', format, {
            startColSort: headItemColList[operRegion.startColIndex].get('sort'),
            startRowSort: headItemRowList[operRegion.startRowIndex].get('sort'),
            endColSort: headItemColList[operRegion.endColIndex].get('sort'),
            endRowSort: headItemRowList[operRegion.endRowIndex].get('sort')
          }, changeModelList);
        }
        this.sendData(format, sendRegion);
      },
      setPercent: function(sheetId, decimal, label) {
        var self,
          clip,
          region,
          operRegion,
          sendRegion,
          changeModelList = [],
          headItemRowList = headItemRows.models,
          headItemColList = headItemCols.models,
          format;

        self = this;
        clip = selectRegions.getModelByType('clip');
        if (clip !== undefined) {
          cache.clipState = 'null';
          clip.destroy();
        }
        format = {
          type: 'percent',
          isValid: false,
          decimal: decimal,
          thousands: false,
          dateFormat: null,
          currencySign: null,
          currencyValid: false
        };
        region = getOperRegion(label);
        operRegion = region.operRegion;
        sendRegion = region.sendRegion;
        self = this;
        if (operRegion.startColIndex === -1 || operRegion.startRowIndex === -1) {
          this.sendData(format, sendRegion);
          return;
        }
        if (operRegion.endColIndex === 'MAX') { //整行操作
          rowOperate.rowPropOper(operRegion.startRowIndex, 'format', format, function(cell) {
            self.generateDisplayText(cell);
          });

        } else if (operRegion.endRowIndex === 'MAX') { //整列操作
          colOperate.colPropOper(operRegion.startColIndex, 'format', format, function(cell) {
            self.generateDisplayText(cell);
          });
        } else {
          cells.operateCellsByRegion(operRegion, function(cell, colSort, rowSort) {
            changeModelList.push({
              colSort: colSort,
              rowSort: rowSort,
              value: cell.get('format')
            });
            cell.set('format', format);
          });
          history.addUpdateAction('format', format, {
            startColSort: headItemColList[operRegion.startColIndex].get('sort'),
            startRowSort: headItemRowList[operRegion.startRowIndex].get('sort'),
            endColSort: headItemColList[operRegion.endColIndex].get('sort'),
            endRowSort: headItemRowList[operRegion.endRowIndex].get('sort')
          }, changeModelList);
        }
        this.sendData(format, sendRegion);
      },
      setCurrency: function(sheetId, decimal, sign, label) {
        var clip,
          self,
          format,
          region,
          changeModelList = [],
          headItemRowList = headItemRows.models,
          headItemColList = headItemCols.models,
          operRegion,
          sendRegion;

        clip = selectRegions.getModelByType('clip');
        if (clip !== undefined) {
          cache.clipState = 'null';
          clip.destroy();
        }
        region = getOperRegion(label);
        operRegion = region.operRegion;
        sendRegion = region.sendRegion;
        self = this;
        format = {
          type: 'currency',
          isValid: false,
          decimal: decimal,
          thousands: false,
          dateFormat: null,
          currencySign: sign,
          currencyValid: false
        };
        if (operRegion.startColIndex === -1 || operRegion.startRowIndex === -1) {
          this.sendData(format, sendRegion);
          return;
        }
        if (operRegion.endColIndex === 'MAX') { //整行操作
          rowOperate.rowPropOper(operRegion.startRowIndex, 'format', format, function(cell) {
            self.generateDisplayText(cell);
          });
        } else if (operRegion.endRowIndex === 'MAX') { //整行操作
          colOperate.colPropOper(operRegion.startColIndex, 'format', format, function(cell) {
            self.generateDisplayText(cell);
          });
        } else {
          cells.operateCellsByRegion(operRegion, function(cell, colSort, rowSort) {
            changeModelList.push({
              colSort: colSort,
              rowSort: rowSort,
              value: cell.get('format')
            });
            cell.set('format', format);
          });
          history.addUpdateAction('format', format, {
            startColSort: headItemColList[operRegion.startColIndex].get('sort'),
            startRowSort: headItemRowList[operRegion.startRowIndex].get('sort'),
            endColSort: headItemColList[operRegion.endColIndex].get('sort'),
            endRowSort: headItemRowList[operRegion.endRowIndex].get('sort')
          }, changeModelList);
        }
        this.sendData(format, sendRegion);
      },
      sendData: function(format, sendRegion) {
        var data;
        data = {
          excelId: window.SPREADSHEET_AUTHENTIC_KEY,
          sheetId: '1',
          coordinate: sendRegion,
          format: format.type
        };
        switch (format.type) {
          case 'number':
            data.decimalPoint = format.decimal || 0;
            data.thousandPoint = format.thousands || false;
            break;
          case 'date':
            data.dateFormat = format.dateFormat || '';
            break;
          case 'currency':
            data.decimalPoint = format.decimal || 0;
            data.currencySymbol = format.currencySign;
            break;
          case 'percent':
            data.decimalPoint = format.decimal || 0;
            break;
        }
        send.PackAjax({
          url: 'text.htm?m=data_format',
          data: JSON.stringify(data)
        });
      },
      /**
       * 考虑是否改为内容方法
       */
      isNum: function(value) {
        var reg;
        if (value === '') {
          return false;
        }
        if (value.indexOf(',') === -1) {
          reg = /^(\-|\+)?[0-9]+(\.[0-9]+)?$/;
        } else {
          reg = /^(\-|\+)?([1-9][0-9]{0,2})+(,\d{3})*(\.[0-9]+)?$/;
        }
        return reg.test(value);
      },
      /**
       * 去除数值开始与末尾无效0字符
       * @param  {String} value 原始值
       * @return {String} 格式化结果
       */
      trimZero: function(value) {
        var head,
          tail,
          values;
        if (!this.isNum(value)) {
          return value;
        }
        values = value.split('.');
        head = values[0];
        tail = values[1];

        head = head.replace(/^0*/, '');
        head = head === '' ? '0' : head;
        if (typeof tail !== 'undefined') {
          tail = tail.replace(/0*$/, '');
          if (tail.length !== 0) {
            head += '.';
          }
          head += tail;
        }
        return head;
      },
      /**
       * 格式化数值类型
       * @param  {String} value     原始值
       * @param  {Boolean} thousands 是否包含千分位
       * @param  {Number} decimal   保留小数位数
       * @return {String}   格式化后的结果
       */
      getFormatNumber: function(value, thousands, decimal) {
        var num,
          values,
          remainder,
          head,
          tail,
          sign = '',
          temp,
          len, i;
        //需要去除末尾无效的0字符
        if (!this.isNum(value)) {
          return value;
        }
        value = this.trimZero(value);
        //含有千分位的，先去除千分位，进行处理
        value = value.replace(/,/g, '');
        num = parseFloat(value);
        num = num * Math.pow(10, decimal);
        num = Math.round(num);
        value = (num / Math.pow(10, decimal)).toString();
        if (thousands) {
          values = value.split('.');
          head = values[0];
          if (head.charAt(0) === '-' || head.indexOf('+') === 0) {
            sign = head.charAt(0);
            head = head.substring(1, head.length);
          }
          len = Math.ceil(head.length / 3);
          remainder = head.length % 3 > 0 ? head.length % 3 : 3;
          temp = head;
          head = '';
          for (i = len - 1; i > -1; i--) {
            if (i === 0) {
              head = temp.substring(0, remainder) + head;
            } else {
              head = ',' + temp.substring(3 * (i - 1) + remainder, 3 * i + remainder) + head;
            }
          }
          value = sign + head;
          if (typeof values[1] !== 'undefined') {
            value += '.' + values[1];
          }
        }
        values = value.split('.');
        //补零
        if (decimal && (typeof values[1] === 'undefined' || values[1].length < decimal)) {
          head = values[0];
          tail = values[1] || '';
          for (i = 0, len = decimal - tail.length; i < len; i++) {
            tail += '0';
          }
          value = head + '.' + tail;
        }
        return value;

      },
      isDate: function(value) {
        var regularLine = /^\d{4}\/\d{1,2}\/\d{1,2}$/,
          regularWord = /^\d{4}\u5e74\d{1,2}\u6708(\d{1,2}\u65e5)?$/,
          year,
          month,
          day,
          date;
        if (value === '') {
          return false;
        }
        if (!regularLine.test(value) && !regularWord.test(value)) {
          return false;
        }
        year = value.match(/\d{4}/)[0];
        month = value.match(/(\/|\u5e74)\d{1,2}(\/|\u6708)/);
        if (month !== null) {
          month = month[0].substring(1, month[0].length - 1);
        }
        day = value.match(/\d{1,2}\u65e5/);

        if (day === null) {
          day = value.match(/\d{1,2}$/);
        }
        if (day !== null) {
          day = day[0].substring(0, day[0].length);
        }
        if (day !== null && day.indexOf('日') !== -1) {
          day = day.substring(0, day.length - 1);
        }

        date = new Date(year + '/' + (month || '01') + '/' + (day || '01'));
        if (parseInt(year) !== date.getFullYear()) {
          return false;
        }
        if (month !== null && parseInt(month) !== date.getMonth() + 1) {
          return false;
        }
        if (day !== null && parseInt(day) !== date.getDate()) {
          return false;
        }
        return true;
      },
      getFormatDate: function(value, formatType) {
        var year,
          month,
          day,
          result;
        if (!this.isDate(value) || value === '') {
          return value;
        }
        year = value.match(/\d{4}/)[0];
        month = value.match(/(\/|\u5e74)\d{1,2}(\/|\u6708)/);
        if (month !== null) {
          month = month[0].substring(1, month[0].length - 1);
        } else {
          month = '01';
        }
        day = value.match(/\d{1,2}\u65e5/);
        if (day === null) {
          day = value.match(/\d{1,2}$/);
        }
        if (day !== null) {
          day = day[0].substring(0, day[0].length);
        }
        if (day !== null && day.indexOf('日') !== -1) {
          day = day.substring(0, day.length - 1);
        }
        if (day === null) {
          day = '01';
        }
        switch (formatType) {
          case config.dateFormatType.frist:
            result = year + '/' + month + '/' + day;
            break;
          case config.dateFormatType.second:
            result = year + '/' + month;
            break;
          case config.dateFormatType.third:
            result = year;
            break;
          case config.dateFormatType.fourth:
            result = year + '年' + month + '月' + day + '日';
            break;
          case config.dateFormatType.fifth:
            result = year + '年' + month + '月';
            break;
          case config.dateFormatType.sixth:
            result = year + '年';
            break;
          default:
            result = value;
            break;
        }
        return result;
      },
      /**
       * 获取日期格式类型
       * @return {[type]} [description]
       */
      getDateFormat: function(value) {
        var regular1 = /^\d{4}\/\d{1,2}\/\d{1,2}$/, // 1999/01/01
          regular2 = /^\d{4}\u5e74\d{1,2}\u6708$/, // 1999年1月
          regular3 = /^\d{4}\u5e74\d{1,2}\u6708\d{1,2}\u65e5$/; // 1999年1月1日
        if (regular1.test(value)) {
          return config.dateFormatType.frist;
        }
        if (regular2.test(value)) {
          return config.dateFormatType.fifth;
        }
        if (regular3.test(value)) {
          return config.dateFormatType.fourth;
        }
        return null;
      },
      isCurrency: function(value) {
        if (value.charAt(0) === '¥' || value.charAt(0) === '$') {
          value = value.substring(1, value.length);
        }
        return this.isNum(value);
      },
      isLossCurrency: function(value) {
        if (value.charAt(0) === '¥' || value.charAt(0) === '$') {
          value = value.substring(1, value.length);
        }
        if (value.charAt(0) === '-') {
          return true;
        } else {
          return false;
        }
      },
      getFormatCurrency: function(value, decimal, sign) {
        var temp = value,
          result;
        if (value === '') {
          return value;
        }
        if (this.isCurrency(value)) {
          if (value.charAt(0) === '¥' || value.charAt(0) === '$') {
            value = value.substring(1, value.length);
          }
          sign = sign || '$';
          //货币千分位
          result = sign + this.getFormatNumber(value, true, decimal);
          return result;
        }
        return temp;
      },
      isPercent: function(value) {
        if (value.charAt(value.length - 1) === '%') {
          value = value.substring(0, value.length - 1);
        }
        return this.isNum(value);
      },
      getFormatPercent: function(value, decimal) {
        var temp = value;
        if (value === '') {
          return value;
        }
        if (value.charAt(value.length - 1) === '%') {
          value = value.substring(0, value.length - 1);
          if (this.isNum(value)) {
            value = this.getFormatNumber(value, false, decimal);
            return value + '%';
          }
        } else {
          if (this.isNum(value)) {
            value = value.replace(/,/g, '');
            value = (Number(value) * 100).toString();
            value = this.getFormatNumber(value, false, decimal);
            return value + '%';
          }
        }
        return temp;
      },
      /**
       * 生成显示文本，格式化保存文本，以及设置相关属性设置
       * @return {[type]} [description]
       */
      generateDisplayText: function(model) {
        var displayText,
          isValid,
          text = model.get('content.texts'),
          format = model.get('format'),
          type = format.type,
          decimal = format.decimal,
          thousands = format.thousands,
          dateFormat = format.dateFormat,
          currencySign = format.currencySign;

        switch (type) {
          case 'normal':
            if (this.isNum(text)) {
              isValid = true;
              if (text.indexOf(',') !== -1) {
                thousands = true;
                model.set('content.texts', text.replace(/,/g, ''));
              }
              displayText = this.getFormatNumber(text, thousands, config.defaultNumberFormat.decimal);
              displayText = this.trimZero(displayText);
              model.set('content.displayTexts', displayText);
              if (model.get('format').thousands !== thousands) {
                model.set('format.thousands', thousands);
              }
            } else {
              model.set('content.displayTexts', text);
            }
            break;
          case 'date':
            isValid = this.isDate(text);
            if (isValid) {
              model.set('content.displayTexts', textTypeHandler.getFormatDate(text, dateFormat));
            } else {
              model.set('content.displayTexts', text);
            }
            break;
          case 'number':
            isValid = this.isNum(text);
            if (isValid) {
              if (text.indexOf(',') !== -1) {
                thousands = true;
                model.set('content.texts', text.replace(/,/g, ''));
              }
              model.set('content.displayTexts', textTypeHandler.getFormatNumber(text, thousands, decimal));
            } else {
              model.set('content.displayTexts', text);
            }
            break;
          case 'currency':
            isValid = this.isCurrency(text);
            if (isValid) {
              if (text.indexOf(',') !== -1) {
                thousands = true;
                model.set('content.texts', text.replace(/,/g, ''));
              }
              if (text.indexOf('$') !== -1 || text.indexOf('¥') !== -1) {
                model.set('content.texts', text.replace(/¥/g, ''));
              }
              model.set('content.displayTexts', textTypeHandler.getFormatCurrency(text, decimal, currencySign));
            } else {
              model.set('content.displayTexts', text);
            }
            break;
          case 'percent':
            isValid = this.isPercent(text);
            if (isValid) {
              if (text.indexOf(',') !== -1) {
                thousands = true;
                model.set('content.texts', text.replace(/,/g, ''));
              }
              if (text.indexOf('%') !== -1) {
                text = text.replace(/%/g, '');
                text = (parseInt(text) / 100).toString();
                model.set('content.texts', text);
              }
              model.set('content.displayTexts', textTypeHandler.getFormatPercent(text, decimal));
            } else {
              model.set('content.displayTexts', text);
            }
            break;
          default:
            model.set('content.displayTexts', text);
            isValid = true;
            break;
        }
        if (model.get('format').isValid !== isValid) {
          model.set('format.isValid', isValid);
        }
      }
    };
    return textTypeHandler;
  });