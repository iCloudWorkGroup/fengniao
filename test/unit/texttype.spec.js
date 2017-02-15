define(function(require) {
	var handler = require('entrance/tool/settexttype'),
		config = require('spreadsheet/config'),
		Model = require('models/cell');

	describe('常规类型处理',function(){
		it('合法数值去除开始部分和小数部分末尾无效的0',function(){
			expect(handler.trimZero('12.0000')).toEqual('12');
			expect(handler.trimZero('012.0100')).toEqual('12.01');
			expect(handler.trimZero('001012')).toEqual('1012');
			expect(handler.trimZero('0101.010200')).toEqual('101.0102');
			expect(handler.trimZero('0.0')).toEqual('0');
		});
	});
	describe('自动识别处理',function(){
		it('日期类型识别',function(){
			var model = new Model();
			model.set('content.texts','1999/6/6');
			handler.typeRecognize(model);
			expect(model.get('format').type).toEqual('date');

		});
	});
	describe('数值类型处理',function(){
		it('数值类型合法性判断',function(){
			//含千分位的判断(测试重点)
			expect(handler.isNum("+123,123")).toEqual(true);
			expect(handler.isNum("-123,123.00")).toEqual(true);
			expect(handler.isNum("123,123.001")).toEqual(true);
			expect(handler.isNum("23,123.100")).toEqual(true);
			expect(handler.isNum("3,123.0010")).toEqual(true);
			expect(handler.isNum("23,123.0010")).toEqual(true);
			expect(handler.isNum("123,123.01001")).toEqual(true);
			
			expect(handler.isNum("3,123.")).toEqual(false);
			expect(handler.isNum("0,123.01001")).toEqual(false);
			expect(handler.isNum("00,123.01")).toEqual(false);
			expect(handler.isNum(",123.01")).toEqual(false);
			expect(handler.isNum("123,1234.01")).toEqual(false);
			expect(handler.isNum("123,1234,123.01")).toEqual(false);
			expect(handler.isNum("123,123.00.10")).toEqual(false);
			expect(handler.isNum("123.00,10")).toEqual(false);

			// // 不含千分位校验
			expect(handler.isNum("123")).toEqual(true); 
			expect(handler.isNum("123.123")).toEqual(true); 
			expect(handler.isNum("+123.123")).toEqual(true); 
			expect(handler.isNum("-123.123")).toEqual(true); 
			expect(handler.isNum("123.0120")).toEqual(true);
			expect(handler.isNum("0.0120")).toEqual(true);
			expect(handler.isNum("0.3")).toEqual(true);

			expect(handler.isNum("123.12.3")).toEqual(false); 
			expect(handler.isNum(".3")).toEqual(false); 
			//含有非法字符
			expect(handler.isNum("@123")).toEqual(false); 
			expect(handler.isNum("AB")).toEqual(false); 
			expect(handler.isNum("AB,AB")).toEqual(false); 
		});
		it('数值类型格式千分位格式化',function(){
			//重点测试
			expect(handler.getFormatNumber("12345678",true,2)).toEqual('12,345,678.00'); 
			expect(handler.getFormatNumber("12,345,678.00",true,2)).toEqual('12,345,678.00'); 
			expect(handler.getFormatNumber("12345.001",true,3)).toEqual('12,345.001');
			expect(handler.getFormatNumber("123,45.001",true,3)).toEqual('123,45.001');  
			expect(handler.getFormatNumber("0.00100",true,3)).toEqual('0.001'); 
			expect(handler.getFormatNumber("0123.001123",true,3)).toEqual('123.001');
			expect(handler.getFormatNumber("0123.00",true,3)).toEqual('123.000');
			expect(handler.getFormatNumber("0123.99",true,0)).toEqual('124');
			expect(handler.getFormatNumber("12.56789",true,1)).toEqual('12.6');
			expect(handler.getFormatNumber("12.056789",true,1)).toEqual('12.1');
		});
		it('数值类型格式非千分位格式化',function(){
			expect(handler.getFormatNumber("12345678",false,2)).toEqual('12345678.00'); 
			expect(handler.getFormatNumber("12,345,678",false,2)).toEqual('12345678.00'); 
			expect(handler.getFormatNumber("12345.001",false,3)).toEqual('12345.001'); 
			expect(handler.getFormatNumber("0.00100",false,3)).toEqual('0.001'); 
			expect(handler.getFormatNumber("0123.001123",false,4)).toEqual('123.0011');
			expect(handler.getFormatNumber("0123.00",false,3)).toEqual('123.000');
		});
	});
	describe('日期类型转换',function(){
		it('日期类型校验',function(){
			//正确格式校验
			expect(handler.isDate("1999/09/09")).toEqual(true); 
			expect(handler.isDate("1999/9/9")).toEqual(true); 
			expect(handler.isDate("1999年09月09日")).toEqual(true);
			expect(handler.isDate("1999年9月9日")).toEqual(true);
			expect(handler.isDate("1999年9月")).toEqual(true);
			expect(handler.isDate("1999年09月")).toEqual(true);
			expect(handler.isDate("2000/2/29")).toEqual(true); 
			// //错误格式校验
			expect(handler.isDate("1999/900/9")).toEqual(false); 
			expect(handler.isDate("999/9/9")).toEqual(false); 
			//错误时间值校验
			expect(handler.isDate("1999/13/9")).toEqual(false); 
			expect(handler.isDate("1999/2/32")).toEqual(false); 
			expect(handler.isDate("1999/2/29")).toEqual(false); 
		});
		it('日期类型转换',function(){
			expect(handler.getFormatDate("1999/2/9",config.dateFormatType.frist)).toEqual('1999/2/9'); 
			expect(handler.getFormatDate("1999/2/9",config.dateFormatType.fourth)).toEqual('1999年2月9日'); 
			expect(handler.getFormatDate("1999/2/9",config.dateFormatType.fifth)).toEqual('1999年2月'); 

			expect(handler.getFormatDate("1999年2月9日",config.dateFormatType.frist)).toEqual('1999/2/9'); 
			expect(handler.getFormatDate("1999年2月9日",config.dateFormatType.fourth)).toEqual('1999年2月9日'); 
			expect(handler.getFormatDate("1999年2月9日",config.dateFormatType.fifth)).toEqual('1999年2月'); 

			expect(handler.getFormatDate("1999年2月",config.dateFormatType.frist)).toEqual('1999/2/01'); 
			expect(handler.getFormatDate("1999年2月",config.dateFormatType.fourth)).toEqual('1999年2月01日'); 
			expect(handler.getFormatDate("1999年2月",config.dateFormatType.fifth)).toEqual('1999年2月'); 

		});
		it('获取格式类型',function(){
			expect(handler.getDateFormat('1999/11/11')).toEqual('yyyy/MM/dd');
			expect(handler.getDateFormat('1999年11月11日')).toEqual('yyyy年MM月dd日');
			expect(handler.getDateFormat('1999年11月')).toEqual('yyyy年MM月');
			expect(handler.getDateFormat('1222/222/22')).toEqual(null);
		});
	});
	describe('百分比类型处理',function(){
		it('百分比类型合法性校验',function(){
			expect(handler.isPercent("19%")).toEqual(true);
			expect(handler.isPercent("19")).toEqual(true);
			expect(handler.isPercent("1a9")).toEqual(false);
		});
		it('百分比类型转换',function(){
			expect(handler.getFormatPercent("1.9",2)).toEqual('190.00%');
			expect(handler.getFormatPercent("123,456.9",2)).toEqual('12345690.00%');
		});
	});
	describe('货币类型处理',function(){
		it('货币类型合法性校验',function(){
			expect(handler.isCurrency("$14")).toEqual(true);
			expect(handler.isCurrency("¥14")).toEqual(true);
			expect(handler.isCurrency("14")).toEqual(true);
		});
		it('货币类型格式转换',function(){
			expect(handler.getFormatCurrency("14",2,'$')).toEqual('$14.00');
			expect(handler.getFormatCurrency("-14",2,'$')).toEqual('$-14.00');
			expect(handler.getFormatCurrency("14",2,'¥')).toEqual('¥14.00');
			expect(handler.getFormatCurrency("-14",2,'¥')).toEqual('¥-14.00');

		});
		// it('货币类型错误提示',function(){
		// 	expect(handler.isLossCurrency("14")).toEqual(false);
		// 	expect(handler.isLossCurrency("-14")).toEqual(true);
		// });
	});

	describe('生成文本测试',function(){
		var model = new Model();
		it('常规格式生成文本',function(){
			model.set('content.texts','123.456789923');
			handler.generateDisplayText(model);
			expect(model.get('content').displayTexts).toEqual('123.45679');
			model.set('content.texts','123.aa');
			handler.generateDisplayText(model);
			expect(model.get('content').displayTexts).toEqual('123.aa');
		});
		it('文本类型',function(){
			model.set('format.type','text');
			model.set('content.texts','11.1111111111111');
			handler.generateDisplayText(model);
			expect(model.get('content').displayTexts).toEqual('11.1111111111111');
		});
		it('日期类型',function(){
			model.set('format.type','date');
			model.set('format.dateFormat', 'yyyy/MM/dd');
			model.set('content.texts','1999年2月');
			handler.generateDisplayText(model);
			expect(model.get('content').displayTexts).toEqual('1999/2/01');
		});
		it('数值类型',function(){
			model.set('format.type','number');
			model.set('format.dateFormat', null);
			model.set('content.texts','1234567.123456789012');
			model.set('format.thousands',null);
			model.set('format.decimal',10);
			handler.generateDisplayText(model);
			expect(model.get('content').displayTexts).toEqual('1234567.1234567890');
		});
		it('货币类型',function(){
			model.set('format.type','currency');
			model.set('format.dateFormat', null);
			model.set('content.texts','1234567.123456789012');
			model.set('format.thousands',true);
			model.set('format.decimal',2);
			model.set('format.currencySign','¥');
			handler.generateDisplayText(model);
			expect(model.get('content').displayTexts).toEqual('¥1,234,567.12');
		});
		it('百分比类型',function(){
			model.set('format.type','percent');
			model.set('format.dateFormat', null);
			model.set('content.texts','1234567.123456789012');
			model.set('format.thousands',false);
			model.set('format.decimal',2);
			model.set('format.currencySign',null);
			handler.generateDisplayText(model);
			expect(model.get('content').displayTexts).toEqual('123456712.35%');
		});
		
	});
});