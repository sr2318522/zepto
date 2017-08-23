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
    })()
})