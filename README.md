# 在线电子表格
[![Build Status](https://travis-ci.org/iCloudWorkGroup/fengniao.svg?branch=master)](https://travis-ci.org/iCloudWorkGroup/fengniao)

使office表格在能网页中还原并对其进行再次处理，提高office表格在共享工作环境中流转速度

## Feature

1. 以插件形式嵌入到项目中，完全独立的操作
2. 采用 `div` 形式布局，快速显示、操作结果

## Environments

Node.js 4+ （独立时）

## How to build
构建环境

	npm install

源代码应用预览

    node sever.js

打包dist目录

	npm install
    grunt build

## How to use

###初始化新表格

	<html>
		<head>
			<link type="text/css" rel="stylesheet" href="css/main.css"/>
		</head>
		<body>
		    <div id="fn-container"></div>
			<script src="dist/fengniao.js"></script>
			<script>
		    	var fengniao = new SpreadSheet('fn-container');
			</script>
		</body>
	</html>

### 打开office表格

**Note:** 打开表格时需要项目独立部署到服务器端。项目后台采用 `java` 作为后台支持，具体信息：[fengniao后端](https://github.com/iCloudWorkGroup/table)

	<html>
		<head>
			<link type="text/css" rel="stylesheet" href="css/main.css"/>
		</head>
		<body>
		    <div id="fn-container"></div>
			<script src="index.html?m=getscript&id={文件ID}"></script>
			<script>
		    	var fengniao = new SpreadSheet('fn-container');
			</script>
		</body>
	</html>

### 应用示例


## License

fengniao is available under terms of [AGP V3](https://github.com/iCloudWorkGroup/fengniao/blob/master/LICENSE)
   
