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
