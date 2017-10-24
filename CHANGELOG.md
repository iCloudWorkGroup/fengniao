<a name="0.12.0"></a>
# [0.12.0](https://github.com/iCloudWorkGroup/fengniao/compare/v0.11.0...v0.12.0) (2017-10-24)


### Bug Fixes

* **basic/tools/template:** fix template repeat compile problem ([#180](https://github.com/iCloudWorkGroup/fengniao/issues/180)) ([dd100c5](https://github.com/iCloudWorkGroup/fengniao/commit/dd100c5)), closes [#176](https://github.com/iCloudWorkGroup/fengniao/issues/176)
* **basic/tools/template:** 数据模板加入缓存功能 ([#182](https://github.com/iCloudWorkGroup/fengniao/issues/182)) ([c7ffe06](https://github.com/iCloudWorkGroup/fengniao/commit/c7ffe06)), closes [#176](https://github.com/iCloudWorkGroup/fengniao/issues/176)
* **changelog.md:** 修正日志冲突 ([#178](https://github.com/iCloudWorkGroup/fengniao/issues/178)) ([fac8cf5](https://github.com/iCloudWorkGroup/fengniao/commit/fac8cf5))
* **config.js:** 清除提交冲突 ([#172](https://github.com/iCloudWorkGroup/fengniao/issues/172)) ([2ae1f34](https://github.com/iCloudWorkGroup/fengniao/commit/2ae1f34))
* **core-cell:** firefox选中单元格存在问题 ([#234](https://github.com/iCloudWorkGroup/fengniao/issues/234)) ([e1277fb](https://github.com/iCloudWorkGroup/fengniao/commit/e1277fb))
* **core-cell:** 下划线状态由true和false，改为0与1 ([#326](https://github.com/iCloudWorkGroup/fengniao/issues/326)) ([23cd833](https://github.com/iCloudWorkGroup/fengniao/commit/23cd833))
* **core-cell:** 使用jquery的text方法，进行html文本处理，避免出现效率问题 ([a720c3f](https://github.com/iCloudWorkGroup/fengniao/commit/a720c3f))
* **core-cell:** 修复圈选单元格时,一些合并的单元格选中后，选取区域未做相应扩大 ([189e440](https://github.com/iCloudWorkGroup/fengniao/commit/189e440)), closes [#254](https://github.com/iCloudWorkGroup/fengniao/issues/254)
* **core-cell:** 修改reload方法请求类型 ([#304](https://github.com/iCloudWorkGroup/fengniao/issues/304)) ([bca584b](https://github.com/iCloudWorkGroup/fengniao/commit/bca584b))
* **core-cell:** 修改使用delete快捷键,没有向后台发送请求问题 ([#320](https://github.com/iCloudWorkGroup/fengniao/issues/320)) ([f3a6536](https://github.com/iCloudWorkGroup/fengniao/commit/f3a6536))
* **core-cell:** 修改填充背景颜色接口 ([#244](https://github.com/iCloudWorkGroup/fengniao/issues/244)) ([988f046](https://github.com/iCloudWorkGroup/fengniao/commit/988f046)), closes [#226](https://github.com/iCloudWorkGroup/fengniao/issues/226)
* **core-cell:** 修改备注模块的相关问题 ([#239](https://github.com/iCloudWorkGroup/fengniao/issues/239)) ([a59b6b9](https://github.com/iCloudWorkGroup/fengniao/commit/a59b6b9))
* **core-cell:** 修改设置下划线，对于是否设置下划线的值判断错误，导致无法取消下划线 ([#322](https://github.com/iCloudWorkGroup/fengniao/issues/322)) ([b8a2ca1](https://github.com/iCloudWorkGroup/fengniao/commit/b8a2ca1))
* **core-cell:** 修正填充单元格，发送行列坐标颠倒 ([e2aedfc](https://github.com/iCloudWorkGroup/fengniao/commit/e2aedfc))
* **core-cell:** 回车快捷键操作跳回第一行 ([#270](https://github.com/iCloudWorkGroup/fengniao/issues/270)) ([6522849](https://github.com/iCloudWorkGroup/fengniao/commit/6522849))
* **core-cell:** 没有对特殊字符进行处理，例如script标签 ([911a7b3](https://github.com/iCloudWorkGroup/fengniao/commit/911a7b3)), closes [#209](https://github.com/iCloudWorkGroup/fengniao/issues/209)
* **core-cell:** 滚动中输入框不跟随移动 ([359e84c](https://github.com/iCloudWorkGroup/fengniao/commit/359e84c))
* **core-cell:** 解决文本中含有换行符问题，使用原生innerText对文本处理，替换掉JQuery的text方法 ([#260](https://github.com/iCloudWorkGroup/fengniao/issues/260)) ([46bf3c8](https://github.com/iCloudWorkGroup/fengniao/commit/46bf3c8)), closes [#253](https://github.com/iCloudWorkGroup/fengniao/issues/253)
* **core-cell:** 输入文本内容无法回退 ([8881620](https://github.com/iCloudWorkGroup/fengniao/commit/8881620))
* **core-other:** 代码与使用文档对应 ([#272](https://github.com/iCloudWorkGroup/fengniao/issues/272)) ([4135734](https://github.com/iCloudWorkGroup/fengniao/commit/4135734))
* **core-row/col:** 修改了删除行列，容器宽度高度错误问题。修正了删除行列时发送请求错误 ([#261](https://github.com/iCloudWorkGroup/fengniao/issues/261)) ([8d1b7e4](https://github.com/iCloudWorkGroup/fengniao/commit/8d1b7e4)), closes [#250](https://github.com/iCloudWorkGroup/fengniao/issues/250)
* **core-row/col:** 修改删除添加行列的对外接口 ([456b091](https://github.com/iCloudWorkGroup/fengniao/commit/456b091)), closes [#241](https://github.com/iCloudWorkGroup/fengniao/issues/241)
* **core-row/col:** 设置生成alias的起始值 ([12ba15d](https://github.com/iCloudWorkGroup/fengniao/commit/12ba15d))
* **core-sheet:** 使用剪切板中，报错问题 ([#230](https://github.com/iCloudWorkGroup/fengniao/issues/230)) ([0d3d0d5](https://github.com/iCloudWorkGroup/fengniao/commit/0d3d0d5)), closes [#214](https://github.com/iCloudWorkGroup/fengniao/issues/214)
* **core-sheet:** 修复锁定功能中的问题 ([90545da](https://github.com/iCloudWorkGroup/fengniao/commit/90545da)), closes [#318](https://github.com/iCloudWorkGroup/fengniao/issues/318)
* **core-sheet:** 修正初始化miancontainer一些缓存值的设置，修正滚动操作单元格视图还原问题 ([#264](https://github.com/iCloudWorkGroup/fengniao/issues/264)) ([e5571ea](https://github.com/iCloudWorkGroup/fengniao/commit/e5571ea))
* **core-sheet:** 冻结操作，冻结点为可视区域的左上角顶点时，出现的白屏情况 ([#243](https://github.com/iCloudWorkGroup/fengniao/issues/243)) ([dd30482](https://github.com/iCloudWorkGroup/fengniao/commit/dd30482))
* **core-sheet:** 冻结操作对外接口存在问题 ([eb891e1](https://github.com/iCloudWorkGroup/fengniao/commit/eb891e1)), closes [#228](https://github.com/iCloudWorkGroup/fengniao/issues/228)
* **core-sheet:** 剪切板操作混乱  ([#235](https://github.com/iCloudWorkGroup/fengniao/issues/235)) ([56e5402](https://github.com/iCloudWorkGroup/fengniao/commit/56e5402)), closes [#214](https://github.com/iCloudWorkGroup/fengniao/issues/214) [#203](https://github.com/iCloudWorkGroup/fengniao/issues/203)
* **core-sheet:** 暂时不支持冻结状态的还原 ([b3a6a25](https://github.com/iCloudWorkGroup/fengniao/commit/b3a6a25))
* **core-sheet:** 粘贴、剪切时背景增加颜色，方便用户定位操作区域 ([0b6d3b9](https://github.com/iCloudWorkGroup/fengniao/commit/0b6d3b9))
* **core-sheet:** 行视图滚动删除后，再进行滚动还原，行视图数据容器的顺序 ([#266](https://github.com/iCloudWorkGroup/fengniao/issues/266)) ([108662b](https://github.com/iCloudWorkGroup/fengniao/commit/108662b)), closes [#249](https://github.com/iCloudWorkGroup/fengniao/issues/249)
* **core-tool:** 由于请求数据时丢失步骤参数，造成的无限循环问题 ([#217](https://github.com/iCloudWorkGroup/fengniao/issues/217)) ([c1eb6f1](https://github.com/iCloudWorkGroup/fengniao/commit/c1eb6f1)), closes [#204](https://github.com/iCloudWorkGroup/fengniao/issues/204)
* **js/views/cellscontainer:** 单元格视图移除监听事件，相关鼠标事件由其容器视图进行监听 ([#185](https://github.com/iCloudWorkGroup/fengniao/issues/185)) ([c48b351](https://github.com/iCloudWorkGroup/fengniao/commit/c48b351)), closes [#177](https://github.com/iCloudWorkGroup/fengniao/issues/177)
* **other:** 修改transition速度 ([d50cd27](https://github.com/iCloudWorkGroup/fengniao/commit/d50cd27))
* **other:** 修改watch的状态 ([e41b863](https://github.com/iCloudWorkGroup/fengniao/commit/e41b863))
* **other:** 修改按纽图标 ([#219](https://github.com/iCloudWorkGroup/fengniao/issues/219)) ([fe6d1b4](https://github.com/iCloudWorkGroup/fengniao/commit/fe6d1b4)), closes [#202](https://github.com/iCloudWorkGroup/fengniao/issues/202)
* **other:** 补充karma-main.js文件 ([d96180f](https://github.com/iCloudWorkGroup/fengniao/commit/d96180f))
* **other:** 解决冲突deploy and master ([517c1b3](https://github.com/iCloudWorkGroup/fengniao/commit/517c1b3))
* **sheet-core:** 对于同步可能会失败的请求（粘贴操作，取消保护操作）,使用isLegal判断是否回退 ([d215d1d](https://github.com/iCloudWorkGroup/fengniao/commit/d215d1d)), closes [#318](https://github.com/iCloudWorkGroup/fengniao/issues/318)


### Features

* **core-cell:** 批量设置背景色 ([#298](https://github.com/iCloudWorkGroup/fengniao/issues/298)) ([ab6584c](https://github.com/iCloudWorkGroup/fengniao/commit/ab6584c))
* **core-sheet:** 重新刷新表格数据 ([#288](https://github.com/iCloudWorkGroup/fengniao/issues/288)) ([29fd479](https://github.com/iCloudWorkGroup/fengniao/commit/29fd479))
* **sheet-core:** 添加数据验证功能 ([#338](https://github.com/iCloudWorkGroup/fengniao/issues/338)) ([8e1efad](https://github.com/iCloudWorkGroup/fengniao/commit/8e1efad)), closes [#335](https://github.com/iCloudWorkGroup/fengniao/issues/335)



<a name="0.11.1"></a>
## [0.11.1](https://github.com/iCloudWorkGroup/fengniao/compare/v0.11.0...v0.11.1) (2017-06-12)


### Bug Fixes

* **basic/tools/template:** fix template repeat compile problem (#180) ([dd100c5](https://github.com/iCloudWorkGroup/fengniao/commit/dd100c5)), closes [#180](https://github.com/iCloudWorkGroup/fengniao/issues/180) [#176](https://github.com/iCloudWorkGroup/fengniao/issues/176)
* **basic/tools/template:** 数据模板加入缓存功能 (#182) ([c7ffe06](https://github.com/iCloudWorkGroup/fengniao/commit/c7ffe06)), closes [#176](https://github.com/iCloudWorkGroup/fengniao/issues/176)
* **changelog.md:** 修正日志冲突 (#178) ([fac8cf5](https://github.com/iCloudWorkGroup/fengniao/commit/fac8cf5))
* **config.js:** 清除提交冲突 (#172) ([2ae1f34](https://github.com/iCloudWorkGroup/fengniao/commit/2ae1f34))
* **core-cell:** firefox选中单元格存在问题 (#234) ([e1277fb](https://github.com/iCloudWorkGroup/fengniao/commit/e1277fb))
* **core-cell:** 使用jquery的text方法，进行html文本处理，避免出现效率问题 ([a720c3f](https://github.com/iCloudWorkGroup/fengniao/commit/a720c3f))
* **core-cell:** 修改填充背景颜色接口 (#244) ([988f046](https://github.com/iCloudWorkGroup/fengniao/commit/988f046)), closes [#226](https://github.com/iCloudWorkGroup/fengniao/issues/226)
* **core-cell:** 修改备注模块的相关问题 (#239) ([a59b6b9](https://github.com/iCloudWorkGroup/fengniao/commit/a59b6b9))
* **core-cell:** 没有对特殊字符进行处理，例如script标签 ([911a7b3](https://github.com/iCloudWorkGroup/fengniao/commit/911a7b3)), closes [#209](https://github.com/iCloudWorkGroup/fengniao/issues/209)
* **core-row/col:** 修改删除添加行列的对外接口 ([456b091](https://github.com/iCloudWorkGroup/fengniao/commit/456b091)), closes [#241](https://github.com/iCloudWorkGroup/fengniao/issues/241)
* **core-sheet:** 使用剪切板中，报错问题 (#230) ([0d3d0d5](https://github.com/iCloudWorkGroup/fengniao/commit/0d3d0d5)), closes [#214](https://github.com/iCloudWorkGroup/fengniao/issues/214)
* **core-sheet:** 冻结操作，冻结点为可视区域的左上角顶点时，出现的白屏情况 (#243) ([dd30482](https://github.com/iCloudWorkGroup/fengniao/commit/dd30482))
* **core-sheet:** 冻结操作对外接口存在问题 ([eb891e1](https://github.com/iCloudWorkGroup/fengniao/commit/eb891e1)), closes [#228](https://github.com/iCloudWorkGroup/fengniao/issues/228)
* **core-sheet:** 剪切板操作混乱  (#235) ([56e5402](https://github.com/iCloudWorkGroup/fengniao/commit/56e5402)), closes [#214](https://github.com/iCloudWorkGroup/fengniao/issues/214) [#203](https://github.com/iCloudWorkGroup/fengniao/issues/203)
* **core-sheet:** 暂时不支持冻结状态的还原 ([b3a6a25](https://github.com/iCloudWorkGroup/fengniao/commit/b3a6a25))
* **core-tool:** 由于请求数据时丢失步骤参数，造成的无限循环问题 (#217) ([c1eb6f1](https://github.com/iCloudWorkGroup/fengniao/commit/c1eb6f1)), closes [#204](https://github.com/iCloudWorkGroup/fengniao/issues/204)
* **js/views/cellscontainer:** 单元格视图移除监听事件，相关鼠标事件由其容器视图进行监听 (#185) ([c48b351](https://github.com/iCloudWorkGroup/fengniao/commit/c48b351)), closes [#177](https://github.com/iCloudWorkGroup/fengniao/issues/177)
* **other:** 修改按纽图标 (#219) ([fe6d1b4](https://github.com/iCloudWorkGroup/fengniao/commit/fe6d1b4)), closes [#202](https://github.com/iCloudWorkGroup/fengniao/issues/202)
* **other:** 解决冲突deploy and master ([517c1b3](https://github.com/iCloudWorkGroup/fengniao/commit/517c1b3))




<a name="0.11.0"></a>
# [0.11.0](https://github.com/iCloudWorkGroup/fengniao/compare/v0.10.0...v0.11.0) (2017-04-27)

### Bug Fixes

* **js/views/cellsContainer** 修改cellsContainer模块结构:
		1.将高亮功能从cellscontainer模块分离
		2.将selectModel盒模型的计算转移到selectModel视图中

<a name="0.10.0"></a>
# [0.10.0](https://github.com/iCloudWorkGroup/fengniao/compare/v0.9.0...v0.10.0) (2017-04-18)
将请求修改为rest风格
<a name="0.9.0"></a>
# [0.9.0](https://github.com/iCloudWorkGroup/fengniao/compare/v0.8.0...v0.9.0) (2017-04-18)

### Bug Fixes

* **js/views/contentCellsContainer** 修复由于单元格重新加载，造成的行消失问题 ([c7c8d32](https://github.com/iCloudWorkGroup/fengniao/commit/c7c8d32))

* **comment** 修复由于单元格视图没有销毁，造成的备注视图无法销毁  ([8873852](https://github.com/iCloudWorkGroup/fengniao/commit/8873852))

## 0.8.0(2016-09-18)

### Bug Fixes
- **修改** 修复了对于单元格数据类型功能中存在的bug

<a name="0.7.1"></a>
## [0.7.1](https://github.com/iCloudWorkGroup/fengniao/compare/v0.7.0...v0.7.1) (2016-09-18)


### Bug Fixes

* **entrance/tool/setfillcolor:** 填充背景色，添加对于批量处理功能 ([fb61620](https://github.com/iCloudWorkGroup/fengniao/commit/fb61620))


#### 0.5.3 (2016-7-7) ####
-----------
- **新增** 区域删除功能
- **修改** 对外开放接口，添加数据过滤功能

#### 0.5.2 (2016-6-28) ####
------------
- **修改** 文本框超出父级区域，发生位移问题
- **修改** 剪切板不能使用问题

#### 0.5.1 (2016-6-16) ####
------------
- **增加** 整行操作功能
- **修改** 修改无输入焦点时，输入中文bug问题

#### 0.5.0 (2016-5-27) ####
------------
- **增加** 插入行功能

#### 0.4.0 （2016-5-20）####
------------
- **增加** 备注的操作
- **增加** 单元格类型，常规，数字，文本，货币，百分比
- **修改** 自动识别类型的数字识别
- **增加** 日期格式的自动识别

#### 0.3.0 (2016-4-14) ####
------------
- **增加** 复制，粘贴，剪切功能
- **增加** 高亮方向组件
- **增加** 数据同步功能

#### 0.2.1 (2016-3-17) ####
------------
- 修改粘入文本bug

#### 0.2.0 (2016-3-10) ####
------------
- 修改项目结构，优化代码扩展
- 增加输入换行快捷键(enter)

#### 0.1.5  (2015-1-21) ####
------------
- 添加拖拽功能
- 开放由鼠标坐标获取操作区域坐标功能
- 添加文本直接输入功能
- 添加自动换行功能
- 修改行标题dom顺序bug

#### 0.1.4  (2015-1-8) ####
------------
- 去除sea.js使用，避免冲突问题
- 增加数据源选择功能
- 添加操作方法
- 将js代码进行打包

#### 0.1.3  (2015-1-2) ####
----------
- 操作区dom自动填充
- 对外开放js文件
- 开放工具栏接口
- 操作区域自动填充

#### 0.1.2  (2015-12-25) ####
-------
- 将bodycontainer域绑定到spreadSheet的div上

#### 0.1.1  (2015-12-2) ####
----------
- 修改项目依赖，为模块化做准备

#### 0.1.0  (2015-11-25) ####
----------
- 冻结功能实现
- DOM结构更改，使用订阅模式
- `seajs`模块化实现

#### 0.0.1 (2015-11-05) ####
----------
- 实现操作区域单击，多选，行列选中，编辑功能
- 菜单栏字体，对齐方式，数字，单元格模块功能完成
