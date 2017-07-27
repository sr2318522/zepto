(function (global,factory) {
	if (typeof define === 'function' &&define.amd) {
		define(function(){
			return factory(global)
		})
	}else{
		factory(global)
	}
})(this,function (window) {
	//核心模块
	var Zepto =(function () {
		var undefined,key,$,classList,emptyArray=[],
      	//获得数组concat、fliter、slice的引用，数组方法是可以在类数组上调用的，因为这些方法只涉及数字下标和length属性
      	concat=emptyArray.concat,
      	filter=emptyArray.filter,
      	slice=emptyArray.slice,
      	document=window.document,
      	//用来保存元素的默认display书写
      	elementDisplay={},
      	classCache={},
      	//保存可以使数值的css属性
      	cssNumber={
      		'column-count':1,
      		'columns':1,
      		'font-weight':1,
      		'line-height':1,
      		'opacity':1,
      		'z-index':1,
      		'zoom':1
      	},
      	//用来匹配文档碎片的正则表达式
        fragmentRE = /^\s*<(\w+|!)[^>]*>/,
        //用来匹配非嵌套标签
        singleTagRE=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,
        tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
        rootNodeRE = /^(?:body|html)$/i,
        capitalRE = /([A-Z])/g,
        //被封装成setter和getter的属性列表，用在使用入口函数创建文档片段时设置属性
        methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],
        //相对于某个元素的偏移操作的函数的属性名称列表
        adjacencyOperators = ['after', 'prepend', 'before', 'append'],
        table = document.createElement('table'),
        tableRow = document.createElement('tr'),
        containers = {
            'tr': document.createElement('tbody'),
            'tbody': table,
            'thead': table,
            'tfoot': table,
            'td': tableRow,
            'th': tableRow,
            '*': document.createElement('div')
        },
        //匹配文档可以交互的3种readyState值
        readyRE = /complete|loaded|interactive/,
      	//检测是否是“简单选择器”
      	simpleSelectorRE = /^[\w-]*$/,
	    class2type = {},

	})()
})