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
      	}
	})()
})