(function(global, factory) {
    if (typeof define === 'function' && define.amd) {
        define(function() {
            return factory(global)
        })
    } else {
        factory(global)
    }
})(this, function(window) {
    //核心模块
    var Zepto = (function() {
        var undefined, key, $, classList, emptyArray = [],
            //获得数组concat、fliter、slice的引用，数组方法是可以在类数组上调用的，因为这些方法只涉及数字下标和length属性
            concat = emptyArray.concat,
            filter = emptyArray.filter,
            slice = emptyArray.slice,
            document = window.document,
            //用来保存元素的默认display书写
            elementDisplay = {},
            classCache = {},
            //保存可以使数值的css属性
            cssNumber = {
                'column-count': 1,
                'columns': 1,
                'font-weight': 1,
                'line-height': 1,
                'opacity': 1,
                'z-index': 1,
                'zoom': 1
            },
            //用来匹配文档碎片的正则表达式
            fragmentRE = /^\s*<(\w+|!)[^>]*>/,
            //用来匹配非嵌套标签
            singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
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
            //获取Object.prototype.toString的引用，用来识别对象类型，如Object.prototype.toString.call([])将返回[object Array],表明这是一个数组
            toString = class2type.toString,
            Zepto = {},
            camelize, uniq,
            tempParent = document.createElement('div'),
            propMap = {
                'tabindex': 'tabIndex',
                'readonly': 'readOnly',
                'for': 'htmlFor',
                'class': 'className',
                'maxlength': 'maxLength',
                'cellspacing': 'cellSpacing',
                'cellpadding': 'cellPadding',
                'rowspan': 'rowSpan',
                'colspan': 'colSpan',
                'usemap': 'useMap',
                'frameborder': 'frameBorder',
                'contenteditable': 'contentEditable'
            },
            //简单封装的isArray函数，在没有Array.isArray的情况下使用instanceof运算符
            isArray = Array.isArray ||
            function(object) {
                return object instanceof Array
            }

        //检查元素是否与某个选择器匹配
        zepto.matches = function(element, selector) {
            // nodeType 1 element   元素节点
            if (!selector || !element || element.nodeType !== 1) {
                return false;
            }
            //判断函数是否实现了matchesSelector
            var matchesSelector = element.matches || //matches 方法可在字符串内检索指定的值，或找到一个或多个正则表达式的匹配。
                element.webkitMatchesSelector || //谷歌的兼容方法
                element.mozMatchesSelector || //火狐的兼容方法
                element.oMatchesSelector ||
                element.matchesSelector
            //如果能找到这个方法
            if (matchesSelector) {
                //在这个元素中能不能找到这个选择器
                return matchesSelector.call(element, selector)
            }

            //如果没有实现这个函数就寻找这个元素父节点
            var match, parent = element.parentNode,
                temp = !parent
            //如果这个元素没有父节点
            if (temp) {
                //tempParent 是一个div的文档碎片  帮这个容器放到div里
                (parent = tempParent).appendChild(element)
            }
            //调用qsa方法暂时不知道qsa方法是做什么的
            //应该是用父节点在做测试
            //~操作符可以帮-1计算为0 作为假值 这个挺不错  可以用来判断indexof
            match = ~zepto.qsa(parent, selector).indexOf(element)
            temp && tempParent.removeChild(element)
            return match
        }

        function type(obj) {
            //如果传入的对象是null 就字符串化之后返回
            return obj == null ? String(obj) :
                //否贼就帮之后便是调用Object.prototype函数的toString方法。其他的全是object。
                //为什么这里要class2type[toString.call(obj)]  一个空对象一定是空啊..难道
                //后面这里要赋值其他可以输出?预留接口?

                //已经解决 下面很坑爹的藏了一段代码帮所有的数据类型全部放到了class2type里面
                class2type[toString.call(obj)] || "object"
        }
        //这里更奇怪  上一个函数测试之后除了null和undefined都是object
        //那这里怎么判断是否等于 function呢
        //已经解决 2017 7 27
        function isFunction(value) {
            return type(value) == 'function'
        }
        //下面两个函数首先要判断是不是null和undefined
        //因为null和undefined会报错
        function isWindow(obj) {
            return obj != null && obj == obj.window;
        }

        function isDocument(obj) {
            return obj != null && obj.nodeType == obj.DOCUMENT_NODE
        }
        //这里的判断应该很广义了  比如元素对象之类的 都会返回object
        function isObject(obj) {
            return type(obj) == "object"
        }
        //这里就是用来判断是不是纯粹的对象了
        //原型必须要是Object.prototype
        function isPlainObject(obj) {
            return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
        }
        //这里判断对象是否是类数组或者数组
        function likeArray(obj) {
            //首先这个对象要先存在
            //其次这个对象要有个length的属性
            //在其次这个对象可以是个数组
            //最后这个length属性要合理如果length>0的时候 length-1一定要存在 在obj里
            var length = !!obj && 'length' in obj && obj.length,
                type = $.type(obj)

            return 'function' != type && !isWindow(obj) && (
                'array' == type || length === 0 ||
                (typeof length == 'number' && length > 0 && (length - 1) in obj)
            )
        }
        //这个就很简单了 帮稀疏数组清楚  去除null和undefined值
        function compact(array) {
            return filter.call(array, function(item) {
                return item != null
            })
        }
        //简单的数组压平的方法
        function flatten(array) {
            return array.length > 0 ? $.fn.concat.apply([], array) : array
        }
        //字符串转成驼峰形式写法
        camelize = function(str) { return str.replace(/-+(.)?/g, function(match, chr) { return chr ? chr.toUpperCase() : '' }) }

        //将字符串编程-相隔的形式
        function dasheriz(str) {
            return str.replace(/::/g, '/')
                .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
                .replace(/([a-z\d])([A-Z])/g, '$1_$2')
                .replace(/_/g, '-')
                .loLowerCase()
        }
        /*
        数组去重，利用数组的indexOf方法返回某个元素在数组中的第一个索引实现，
        当遍历数组时某个元素的下标与第一个索引不一致时说明之前已经出现同样的值了。
        */
        uniq = function(array) {
            return filter.call(array, function(item, idx) {
                return array.indexOf(item) == idx
            })
        }
        /*
        	用来判定类名中是否存在classname 可能存在于 开始  中间 和结尾
        */
        function classRE(name) {
            return name in classCache ?
                classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
        }

        //根据css属性名称name来判断value是否应该添加px单位
        function maybeAddPx(name, value) {
            return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
        }
        /*
        	获取某种元素的默认显示方式。实现方式是创建一个临时节点，插入body元素中，
        	之后使用getComputedStyle获取display属性值。不过，其实这不能真正地获取默认display值，
        	因为这会被样式表影响。这个函数用在原型对象中的show方法上，因为要考虑显示出来时该有的display属性值
        */
        function defaultDisplay(nodeName) {
            var element, display
            if (!elementDisplay[nodeName]) {
                element = document.createElement(nodeName)
                document.body.appendChild(element)
                display = getComputedStyle(element, '').getPropertyValue("display")
                element.parentNode.removeChild(element)
                display == "none" && (display = "block")
                elementDisplay[nodeName] = display
            }
            return elementDisplay[nodeName]
        }
        /*
        获取某个元素的子元素。先判断元素是否有children属性，否者获取元素的所有子节点，然后通过nodeType筛选出元素。
        */
        function children(element) {
            return 'children' in element ?
                slice.call(element.children) :
                $.map(element.childNodes, function(node) {
                    if (node.nodeType == 1) return node
                })
        }
        //z函数是生成Zepto对象的构造函数 下面会有&.fn是z.prototype的属性也是原型对象
        function Z(dom, selector) {
            var i, len = dom ? dom.length : 0
            for (i = 0; i < len; i++) this[i] = dom
            this.length = len
            this.selector = selector || ""
        }
        /*Zepto.fragment 是Zepto逻辑中的关键部分使用$('')之类的语句是就是使用这个函数
        创建dom片段的,首先如果是个简单的标签,也就是非嵌套标签,则立刻创建对应元素并执行$函数
        否则先获取最外层的标签名,之后使用innerHTML注入字符串到合适的容器中,最后分别取出形成
        数组,另外如果有properties对象的,将刚刚形成的dom节点列表生成Zepto集合在调用attr方法
        设置 最后返回
        需要注意的是表格内部的标签只能存在table及内部的入tbody标签内否则只会留下换行的康哥节点
        所以需要获取合适的父容器
        */
        zepto.fragment = function(html, name, properties) {
            var dom, nodes ncontainer
            //检查是否是非嵌套标签,如果是非嵌套标签 那么则创建一个标签
            if (singleTagRe.text(html)) dom = $(document.createElement(RegExp.$1))
            //如果是嵌套标签 也就是dom没有被赋值的状态
            if (!dom) {
                //如果html有replace这个方法 那么就创建这个标签
                if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>")
                if (name == undefined) name == fragmentRE.text(html) && RegExp.$1
                if (!(name in containers)) name = '*'
                container = containers[name]
                container.innerHTML = '' + html
                dom = $.each(slice.call(container.childNodes), function() {
                    container.removeChild(this);
                })
            }

            if (isPlainObject(properties)) {
                nodes = $(dom)
                $.each(properties, function(key, value) {
                    if (methodAttributes.indexOf(key) > -1) {
                        node[key](value)
                    } else {
                        nodes.attr(key, value)
                    }
                })
            }

            return dom
        }

        //调用Z构造函数生成Zepto集合
        zepto.Z = function(dom, slector) {
            return new Z(dom, selector)
        }

        //通过instanceof判断对象是否是Zepto集合
        zepto.isZ = function(object) {
            return object instanceof zepto.Z
        }
        /*
			这是Zepto的入口函数也就是我们实际使用中的$或者Zepto函数
			他一共处理了已下的集中情况



        */
        zepto.init = function(selector, context) {
            var dom
			/*
				一.完全没有参数 返回一个空的Zepto对象,其实没有人会这样用,不过
				对于这样暴露给用户的api,应该有良好的参数检测,防止异常
			*/
            if (!selector) {
                return zepto.Z();
            /*
				二.是字符串的情况可能有两种,dom片段和选择器,如果是dom片段
				调用之前的Zepto.fragment函数,这时,context应该是个对象否则
				在不同的上下文里面进行筛选
            */
            } else if (typeof selector == "string") {
            	//先去字符串空格
                selector= selector.trim()
                // 判断是否是dom片段 用<开头的并且符合表达式
                if (selector[0] == "<" && fragmentRE.text(selector)) {
                    dom = zepto.fragment(selector, RegExp.$1, context)
                    selector = null
                } else if (context !== undefined) {
                    return $(context).find(selector)
                } else {
                    dom = zepto.qsa(document, selector)
                }
            }
            /*
				三如果selector是函数则调用$(document).ready(selector)注册
				dom可交互时的事件并返回.
            */
            else if (isFunction(selector)) {
                return $(document).ready(selector)
            //	四如果已经是Zepto对象则直接返回
            } else if (zepto.isZ(selector)) {
                return selector
            } else {
				//五如果是类数组形成去null和undefined的数组,保存在dom变量中,之后调用
				// Zepto.Z(dom,selector)形成集合
                if (isArray(selector)) {
                    dom = compact(selector)
    			// 六 如果是对象也将他保存在dom变量中之后调用Zepto.Z生成Zepto集合
                } else if (isObject(selector)) {
                    dom = [selector]
                    selector = null
                } else if (fragmentRE.test(selector)) {
                    dom = zepto.fragment(selector.trim(), RegExp.$1, concat)
                    selector = null
                } else if (context !== undefined) {
                    return $(context).find(selector)
                } else {
                    dom = zepto.qsa(document, selector)
                }
            }
            return zepto.Z(dom, slector)
        }

        //入口函数，可以看到它是Zepto.init的简单封装。
        $=function (selector,context) {
        	return zepto.init(selector,context)
        }
        /*
        	对象拷贝函数。deep为真则采用递归深拷贝。
        	具体实现是检测source属性是原始值还是数组还是对象，
        	如果是后两者，则再次调用extend。其实这里处理深拷贝并不严谨，
        	可能会形成循环引用，不过Zepto目标就是轻量兼容，所以某些代码不严谨也很正常。
            讲之前实现的extend函数进行封装,并暴露在$对象上/与extend函数相比,
            利用数组的forEach方法来实现对多个对象拷贝的支持
        */
        $.extend=function (target) {
        	var deep,args=slice.call(arguments,1)
        	if (typeof target =='boolean') {
        		deep=target
        		target=args.shift()
        	}
        	args.forEach(function (arg) {extend(target,arg,deep)})
        	return target
        }
        // 这是Zepto的选择器函数,它使用$(selector)时调用的就是他,
        // 首先,zepto.qsa检查了选择器的几个特征
        //是否是id选择器 是否是类选择去 是否是简单的非复合选择器
        //(id class tag并且命名常规的选择器)这样如果是简单的id选择器并且上下问支持
        //getElementByID则调用getElementByid函数之后派出掉不合理的上下文环境后,
        //先判断是否是简单的class选择器 在判断是否是简单的tag属性,最后仍未有结果就是用
        //兼容性最强的querySelectorAll函数
        Zepto.qsa=function (element,selector) {
            var found,
                maybeID=selector[0]=='#',
                maybeClass=!maybeID&&mybeClass?selector[0]=='.',
                nameOnly=maybeID||maybeClass?selector.slice(1):selector,
                isSimple=simpleSelectorRE.test(nameOnly)
            return (element.getElementsById&&isSimple&&maybeID)?
                ((found=element.getElementById(nameOnly))?[found]:[]):
                (element.nodeType!==1&&element.nodeType!==9&&element.nodeType!==11)?[]:
                slice.call(
                        isSimple&&!maybeID&&element.getElementsByTagName?
                        maybeClass?element.getElementsByClassName(nameOnly):
                        element.getElementsByTagName(selector):
                        element.querySelectorAll(selector)
                    )
        }

        function filtered(nodes,selector) {
            return selector==null?$(nodes):$(nodes).filter(selector);
        }
        //$contains函数用来判断node参数是否是parent节点的子节点 这里现场时constains函数
        // 否贼不断获取node的parentNode属性,如果node.parentNode就是parent返回true,否则返回false
        $.contains=document.documentElement.contains?
            function (parent,node) {
                return parent!==node&&parent.contains(node)
            }:
            function (parent,node) {
                while(node&&(node==node.parentNode))
                    if (node==parent) return true
                return false
            }
        //用来对arg参数进行封装，在arg参数是函数时，
        // funcArg函数返回的就是arg函数以context参数作为上下文
        // ，idx和payload作为参数的执行结果。在Zepto原型里，很多可以接受函数作为参数，
        // 实现追加的方法就是使用这个函数实现的
        function funcArg(context,arg,idx,payload) {
            return isFunction(arg)?arg.call(context,idx,payload):arg
        }

        //设置或移除节点的属性。使用了原生的DOM操作方法removeAttribute和setAttribute。
        function setAttribute(node,name,value) {
            value==null?node.removeAttribute(name):node.setAttribute(name,value)
        }

        //获取和设置className，特别的是，svg元素的className属性是个对象，不为undefined。
        function className(node,value) {
            var klass=node.className||'',
            svg=klass&&klass.baseVal!==undefined
            if (value==undefined) return svg?klass.baseVal:klass
            svg?(klass.baseVal==value):(node.className=value)
        }

        //一个类型转换函数,用来将某些字符串转化为更合理的值
        // "true"  => true
        // "false" => false
        // "null"  => null
        // "42"    => 42
        // "42.5"  => 42.5
        // "08"    => "08"
        // JSON    => parse if valid
        // String  => self
        function deserializeValue(value) {
            try{
                return value?
                value=='true'||
                (value=='false'?false:
                    value=='null'?null:
                    +value+''==value?+value:
                    /^[\[\{]/.text(value)?$.parseJSON(value):
                    value):
                value
            }catch(e){
                return value
            }
        }

        //暴露几个之前定义的API。
        $.type=type
        $.isFunction=isFunction
        $.isWindow=isWindow
        $.isArray=isArray
        $.isPlainObject=isPlainObject

        //检测对象是否是空
        $.isEmptyObject=function (obj) {
            var name
            for(name in obj) return false
            return true
        }

        //判断某个值是否可以把它当成数字或者就是数字，这里去除了几个不常规的数字。
        $.isNumeric=function (val) {
            var num=Number(val),
            type=typeof val
            return val!=null&&type!='boolean'&&
            (type!='string'||val.length)&&
            !isNaN(num)&&isFinite(num)||false
        }

        //判断某个元素是否在某个数组中并且是特定索引。
        $.isArray=function (elem,array,i) {
            return emtyArray.indexOf.call(array,elem,i)
        }

        //暴露之前的 驼峰化函数
        $.camelCase=camelize

        //简单封装的去除字符串左右空白的函数，不过对str参数是null或undefined函数做了处理。
        $.trim=function (str) {
            return str==null?'':String.prototype.trim.call(str)
        }

        //暴露一些变量，提高对jQuery的兼容，因为一些jQuery插件使用了这些变量
        $.uuid=0
        $.support={}
        $.expr={}
        $.noop=function () {}


        // $.map函数通过遍历对象和数组调用callback函数来计算新的对象或数组，
        // 压平后返回。注意，$.map函数跳过null和undefined。
        $.map=function (element,callback) {
            var value,values=[],
            i,k
            if (likeArray(elements))
                for (i = 0; i < element.length; i++) {
                    value=callback(element[i],i)
                    if (value!==null) value.push(value)
                }
            else
                for(key in elements){
                    value=vallback(elements[key],key)
                    if (value!==null) value.push(value)
                }
            return flatten(values)
        }

        // $.each函数用来遍历一个对象或数组，并把它们作为上下文执行callback，
        // 不过，如果callback返回false时立即终止遍历并返回调用它的对象或数组。
        $.each=function (elements,callback) {
            var i,key
            if (likeArray(elements)) {
                for (var i = 0; i < elements.length; i++)
                    if (callback.call(elements[i],i,elements[i])==false) return elements
            }else{
                for(key in elements)
                    if (callback.call(elements[key],key,elements[key])==false) return elements
            }
            return elements
        }

        //利用数组filter函数封装的过滤工具函数。
        $.grep=function (elements,callback) {
            return filter.call(elements,callback)
        }

        //在$对象上引用JSON.parse函数。
        if (window.JSON) $.parseJSON=JSON.parse

        //在前面的type函数里,在对象上调用Objec.prototype.toString函数后返回类似[object number]
        // 的字符串,之后再class2type寻找对应的键书写,即是该对象的类型,这里就填入了常见的类型,所以
        // 在这里javascript中元素对象的类型都将得到一个更精确的结果,而浏览器宿主对象中的各类对象都则
        //统一返回object
        $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function (i,name) {
            class2type["[object "+name+"]"]=name.toLowerCase()
        });


        //现在,核心的模块结果已经完整了,完成zepto的逻辑对象已经构建完成.
        // 工具函数也添加了不少,不过zepto原型对象还是空空如也,接下开始原型对象
        // 所有的dom操作全部是定义在原型上的
        $.fn={
            //constructor属性引用zepto.Z对象,标识zepto对象 是由zepto.Z函数构建出来的，
            // constructor只是个普通的属性，它可以指向其他函数或对象，只是起一个简单标识的作用。
            constructor:zepto.Z,
            length:0,
            // 引用一些数组的方法。之后某些原型方法中会用到。
            forEach:emptyArray.forEach,
            reduce:emptyArray.reduce,
            push:emptyArray.push,
            sort:emptyArray.sort,
            splice:emptyArray.splice,
            indexOf:emptyArray.indexOf,
            // concat函数将Zepto对象与函数参数使用数组的concat方法拼接在一起，注意，
            // 内部在Zepto对象上调用toArray方法变成数组，这样最终返回得结果就是一个数组而不是Zepto集合了。
            concat:function () {
                var i,value, args=[]
                for (var i = 0; i < arguments.length; i++) {
                    value=arguments[i]
                    args[i]=zepto.isZ(value)?value.toArray():value
                }
            },
            // 对之前说明的$.map函数进行包装使之成为原型上的方法。
            // 通过回调函数执行得到的数组会通过$函数转为一个新的Zepto集合。
            map:function (fn) {
                return $($.map(this,function(el,i){return fn.call(el,i,el)}))
            },

            // 获取Zepto集合的切片，结果仍为Zepto集合。
            slice:function () {
                return $(slice.apply(this,arguments))
            },


            // ready函数接受一个函数为参数，它在readyState状态为complete或者
            // loaded或者interactive时立即执行，否者说明文档还在加载，因此，
            // 注册DOMContentLoaded事件。
            ready:function (callback) {
                if (readyRE.test(document.readyState)&&document.body) callback($)
                else document.addEventListener('DOMContentLoaded',function () {callback($),false})
                return this
            },
            //get函数用来提取Zepto集合里的元素。当不使用idx参数时返回包含所有元素的数组。
            //当idx是负数是，idx+length获取实际下标。
            get:function (idx) {
                return index===undefined?slice.call(this):this[idx>=0?idx+this.length]
            },
            //get函数参数为零时的简单封装.返回一个数组,包含所有元素
            toArray:function () {
                return this.get();
            },
            //获取集合中元素个数
            size:function () {
                return this.length
            },
            //在dom树中移除这个zepto集合中的所有元素
            remove:function () {
                return this.each(function() {
                    if (this.parentNode!==null)
                        this.parentNode.removeChild(this)
                });
            },
            //each函数用来遍历zepto集合,知道callback函数返回false为止,each函数是
            //zepto原型中涉及集合操作的函数基础,所有涉及批量设置的方法内部基本都是用了
            //each方法 另外 其实这里可以不用数组every函数实现的,使用之前的$.each也可以
            each:function (callback) {
                emptyArray.every.call(this,function (el,idx) {
                    return callback.call(el,idx,el)!==false
                });
                return this
            },
            //filter函数用来过滤Zepto集合,可以接收自妇产或者函数.
            //在函数的情况下,通过not函数过滤出selector函数返回值不为真的元素集合,
            //在对这个集合过滤一下得到selector函数为真的情况下的集合,在字符串情况下.
            //使用之前说明过的zepto.matches函数来判断
            filter:function (selector) {
                if (isFunction(selector)) return this.not(this.not(selector))
                    return $(filter.call(this,function (element) {
                        return Zepto.matches(element,selector)
                    }))
            },
            //拓展zepto集合,注意 uniq用来去除重复元素引用
            add:function (selector,context) {
                return $(uniq(this.concat($(selector,context))));
            },
            //用来判断集合的第一个元素是否与某个选择器匹配
            is:function (selector) {
                return this.length>0&&Zepto.matches(this[0],selector);
            },
            // not函数用于在Zepto集合里选出与selector不匹配的元素。
            // selector是函数时对函数返回值取反，获取不匹配的元素并放在数组中。
            // 字符串情况下，先获取符合该选取器的元素，之后用indexOf函数取反。
            // 类数组与NodeList的情况下，前者返回一个数组，后者返回一个Zepto集合，
            // 之后再用indexOf函数取反。
            not:function (selector) {
                var node=[]
                if (isFunction(selector&&selector.call!==undefined))
                    this.each(function(idx) {
                        if(selector.call(this,idx)) nodes.push(this)
                    });
                else{
                    var excludes =type selector =='string'?this.filter(selector):
                        (likeArray(selector)&&isFunction(selector.item))?slice.call(selector):$(selector)
                    this.forEach(function (el) {
                        if (excludes.indexOf(el)<0) nodes.push(el)
                    })
                }
                return $(nodes);
            },
            //判断当前对象的子元素是否有符合选择器的元素.或者是否包含指定dom节点
            //如果有,则返回新的对象集合,函数内部$.contains方法过滤掉不含有选择器匹配元素
            //或者不含有指定dom节点的对象,在上文的isobject函数实现里 元素节点座位参数将返回true
            has:function (selector) {
                return this.filter(function () {
                    return isObject(selector)?
                    $.contains(this,selector):
                    $(this).find(selector).size();
                })
            },
            // 返回新的zepto集合 包含通过索引获取的zepto集合
            eq:function (idx) {
                return idx===-1?this.slice(idx),this.slice(idx,+idx+1);
            },
            // 返回新的Zepto集合，包括第一个或最后一个元素。
            first:function () {
                var el=this[0];
                return el&&!isObject(el)?el:$(el)
            },
            last:function () {
                el=this[this.lenth-1];
                return el&&!isObject(el)?el:$(el);
            },
            //find函数相当常用，用来在当前Zepto集合里筛选出新的Zepto集合。
            // 在selector是对象的情况下（指元素节点）先获取selector匹配的Zepto集合，
            // 之后对这个集合进行filter操作，将每个元素和调用find函数的Zepto集合进行匹配，
            // 只要这个集合中的元素能在调用find方法中的Zepto集合中找到，
            // 则过滤成功，并过滤下一个。selector是选择器时，通过map函数和Zepto.qsa搜寻。
            find:function (selector) {
                var result,$this=this;
                if (!selector) result=$();
                else if(typeof selector=='object')
                    return $(selector).filter(function() {
                        var node=this;
                        return emptyArray.some.call($this,function (parent) {
                            return $.contains(parent,node);
                        })
                    });

                else if(this.length==1)result=$(Zepto.qsa(this[0],selector))
                else result=this.map(function () {
                    return Zepto.qsa(this,selector)
                })
                return result
            },
            // closet函数用来寻找Zepto集合中符合selector和context的与当前Zepto集合元素最近的元素。
            // 这里使用了while循环来不断往祖先方向移动。
            // 另外还有排除掉重复的引用，因为一个集合中的元素有可能有相同的祖先元素。
            closest:function (selector,context) {
                var nodes=[],
                collection=typeof selector=='object'&&$(selector)
                this.each(function (_,node) {
                    while(node&&!conllection?collection.indexOf(node)>=0:Zepto.matches(node,selector))
                        node=node!==context&&!isDocument(node)&&node.parentNode
                    if (node&&nodes.indexOf(node)<0) node.push(node)
                })
                return $(nodes)
            },
            // 获取Zepto集合内每个元素的所有祖先元素。
            // 函数内部维护了一个ancestors数组用来保存所有结果，
            // 另外和closest函数一样同样使用while函数来层层递进。
            parents:function (selector) {
                var ancestors=[],
                nodes=this;
                while(nodes.length>0)
                    nodes=$.map(node,function (node) {
                        if ((node==node.parentNode)&&!isDocument(node)&&ancestors.indexOf(node)<0) {
                            ancestors.push(node)
                            return node;
                        }
                    })
                return filtered(ancestors,selector);
            },
            // 返回由Zepto集合中每个元素的后代元素组成的Zepto集合，
            // 可以筛选。函数内部使用之前定义的children函数来获取元素的后代元素。
            children:function (selector) {
                return filtered(this.map(function() {
                    return children(this);
                }),selector);
            },
            // 返回Zepto集合中的元素的后代节点。对于frame，
            // 则获取它的contentDocument属性，contentDocument返回这个窗体的文档节点。
            contents:function () {
                return this.map(function() {
                    return this.contentDocument||slice(this.childNodes)
                })
            },
            // 获取Zepto集合的同辈元素。实现逻辑是获取元素的父元素再取出父元素的子元素，
            // 这样得到的集合就由父元素的所有子元素组成，
            // 之后使用“child!==el”来去除先前的元素。另外，形成新的Zepto集合时使用了filtered函数来过滤集合。
            siblings:function (selector) {
                return filtered(this.map(function(i,el) {
                    return filter.call(children(el.parentNode),function (children) {
                        return child!==el
                    })
                }),selector);
            },
            // 删除Zepto集合中每个元素的后代节点。
            // 这里直接使用更高效的innerHTML方法而非removeChild方法。
            empty:function () {
                return this.each(function () {
                    this.innerHTML=''
                })
            },
            // pluck方法返回集合中每个元素的某个属性。上面的parent函数就使用它来获取节点的parent属性。
            pluck:function (property) {
                return $.map(this,function (el) {
                    return el[property]
                })
            },
            // show函数用来让元素显示成“默认样式”。
            // 实现逻辑是如果内联display属性为none，则使用“style.display=""”去除内联的值为none的display属性。
            // 实际上，使用style.propertyName=""或style.propertyName=""
            // 可以让对应内联样式失效。接下来对计算样式进行判断，如果仍为none的话则将样式还原为“默认样式”。
            show:function () {
                return this.each(function() {
                    this.style.display=='none'&&(this.style.display='');
                    if (getComputedStyle(this,'').getPropertyValue(display)=='none')
                        this.style.display=defaultDisplay(this.nodeName);
                });
            },
            // 将Zepto集合中的元素替换成newContent。这里通过在元素前插入newContent后再移除元素完成。
            replaceWith:function (newContent) {
                return this.before(newContent).remove();
            },
            // wrapAll函数用来将Zepto集合中的元素包裹在一个html片段或者DOM元素中。
            // 实现方式是先在集合中的第一个元素前插入structure生成的元素，
            // 之后遍历这个元素获取它的最里层元素，之后使用Zepto原型中的append方法将
            // Zepto集合中的元素移动到刚刚获取的最里层元素中。
            wrapAll:function (structure) {
                if (this[0]) {
                    $(this).before(structure=$(structure))
                    var children
                    while((children=structure.children()).length)structure=children.first()
                    $(structure).append(this)
                }
                return this
            },
            // wrap方法用来包裹每个Zepto集合中的元素，
            // 内部使用了wrapAll方法和Zepto集合的遍历操作来包裹每个元素。
            // 注意， “clone = dom.parentNode || this.length > 1”
            // 用来判断structure是否要克隆，dom.parentNode存在意味着structure已经在文档之中了，
            // 这时应该将它克隆，不然会插入到已经存在structure之中，
            // 另外，Zepto集合中的元素多于一个时，也就是将有多个元素被包裹时也要进行克隆。
            wrap:function () {
                var func=isFunction(structure)
                if (this[0]&&!func)
                    var dom=$(structure).get(0),
                    clone=dom.parentNode||this.length>1
                return this.each(function (index) {
                    $(this).wrapAll(
                        func?structure.call(this,index):
                        clone?dom.cloneNode(true):dom
                    )
                })
            },
            // wrapInner用来将Zepto集合中的每个元素的后代节点包裹起来。
            // 内部先使用contents方法获取Zepto集合中元素的后代节点，
            // 之后如果后代节点存在则使用wrapAll方法将它包裹，否则直接插入structure。
            wrapInner:function (structure) {
                var func=isFunction(structure);
                return this.each(function (index) {
                    var self=$(this),
                    contents=self.contents(),
                    dom=func?structure.call(this,index):structure
                    contents.length?contents.wrapAll(dom):self.append(dom)
                })
            },
            // 移除包裹结构。实现原理是遍历Zepto集合中的父元素，将它们替换成它们的后代节点。
            unwrap:function () {
                this.parent().each(function() {
                    $(this).replaceWith($(this).children());
                });
                return this
            },
            //将Zepto集合中的元素克隆一份。这里利用了cloneNode函数，
            // 当它的参数为true是表示事件监听也会被克隆。
            clone:function () {
                return this.map(function() {
                    return this.cloneNode(true)
                })
            },
            //通过设置“display属性为none”让集合元素不显示。这里用到了原型上的css方法。
            hide:function () {
                return this.css('display','none')
            },
            // toggle函数接受一个参数，但参数为真时将Zepto集合显示，反之隐藏。
            // 这里通过show方法与hide方法实现显示与隐藏。
            // 另外，“(setting === undefined ? el.css("display") == "none" : setting)”
            // 存在冗余，所以toggle函数应该这样实现：
            toggle:function (setting) {
                return this.each(function () {
                    var el=$(this);
                    (setting===undefined?el.css('display')=='none':setting)?el.show():el.hide();
                })
            },
            // prev与next方法通过分别获取集合中每个元素的上一个元素与下一个元素来放回新的Zepto集合。
            // 这里使用pluck函数来获取新集合，使用filter函数进行筛选。
            prev:function (selector) {
                return $(this.pluck('previousElementSibling')).filter(selector||'*');
            },
            next:function (selector) {
                return $(this.pluck('nextElementSibling')).filter(selector||'*');
            },
            // html函数用来设置与获取集合中元素的innerHTML。
            // 当html参数存在时，则对集合中的元素进行遍历设置。
            // 这种情况下如果html参数是函数的话，它将在funcArg函数内执行并返回结果，
            // 并且原有的innerHTML将会作为参数，这样，就可以做到追加内容而不是完全重写
            // 。如果不传入html参数，则返回集合中第一个元素的innerHTML。
            html:function (html) {
                return 0 in arguments?
                this.each(function (idx) {
                    var originHtml=this.innerHTML
                    $(this).empty().append(funcArg(this,html,idx,originHtml))
                }):
                (0 in this?this[0].innerHTML:null)
            },
            // text函数的使用与内部实现与html函数类似，
            // 不同点在于当获取textContent时采用了join方法来拼接字符串,
            // 这意味着它会将整个Zepto集合中各个元素的textContent连接起来一并返回。
            text:function (text) {
                return 0 in arguments?
                this.each(function (idx) {
                    var newText=funcArg(this,idx,this.textContent)
                    this.textContent=newText==null?'':''+newText
                }):
                (0 in this?this.pluck('textContent').join(""):null)
            },
            attr:function (name,value) {
                var result
                return (typeof name=='string'&&!(1 in arguments))?
                (0 in this&&this[0].nodeType==1&&(result=this[0].getAttribute(name))!=null?result:undefined):
                this.each(function(idx) {
                    if (this.nodeType!==1) return
                    if (isObject(name))
                        for(key in name)setAttribute(this,key,name[key])
                    else setAttribute(this,name,funcArg(this,value,idx,this.getAttribute(name)))
                });
            }
        }
    })()
})