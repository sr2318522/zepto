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
                selector = selector.trim()
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
                //  四如果已经是Zepto对象则直接返回
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
        $ = function(selector, context) {
            return zepto.init(selector, context)
        }
        /*
            对象拷贝函数。deep为真则采用递归深拷贝。
            具体实现是检测source属性是原始值还是数组还是对象，
            如果是后两者，则再次调用extend。其实这里处理深拷贝并不严谨，
            可能会形成循环引用，不过Zepto目标就是轻量兼容，所以某些代码不严谨也很正常。
            讲之前实现的extend函数进行封装,并暴露在$对象上/与extend函数相比,
            利用数组的forEach方法来实现对多个对象拷贝的支持
        */
        $.extend = function(target) {
            var deep, args = slice.call(arguments, 1)
            if (typeof target == 'boolean') {
                deep = target
                target = args.shift()
            }
            args.forEach(function(arg) { extend(target, arg, deep) })
            return target
        }
        // 这是Zepto的选择器函数,它使用$(selector)时调用的就是他,
        // 首先,zepto.qsa检查了选择器的几个特征
        //是否是id选择器 是否是类选择去 是否是简单的非复合选择器
        //(id class tag并且命名常规的选择器)这样如果是简单的id选择器并且上下问支持
        //getElementByID则调用getElementByid函数之后派出掉不合理的上下文环境后,
        //先判断是否是简单的class选择器 在判断是否是简单的tag属性,最后仍未有结果就是用
        //兼容性最强的querySelectorAll函数
        Zepto.qsa = function(element, selector) {
            var found,
                maybeID = selector[0] == '#',
                maybeClass = !maybeID && mybeClass ? selector[0] == '.',
                nameOnly = maybeID || maybeClass ? selector.slice(1) : selector,
                isSimple = simpleSelectorRE.test(nameOnly)
            return (element.getElementsById && isSimple && maybeID) ?
                ((found = element.getElementById(nameOnly)) ? [found] : []) :
                (element.nodeType !== 1 && element.nodeType !== 9 && element.nodeType !== 11) ? [] :
                slice.call(
                    isSimple && !maybeID && element.getElementsByTagName ?
                    maybeClass ? element.getElementsByClassName(nameOnly) :
                    element.getElementsByTagName(selector) :
                    element.querySelectorAll(selector)
                )
        }

        function filtered(nodes, selector) {
            return selector == null ? $(nodes) : $(nodes).filter(selector);
        }
        //$contains函数用来判断node参数是否是parent节点的子节点 这里现场时constains函数
        // 否贼不断获取node的parentNode属性,如果node.parentNode就是parent返回true,否则返回false
        $.contains = document.documentElement.contains ?
            function(parent, node) {
                return parent !== node && parent.contains(node)
            } :
            function(parent, node) {
                while (node && (node == node.parentNode))
                    if (node == parent) return true
                return false
            }
        //用来对arg参数进行封装，在arg参数是函数时，
        // funcArg函数返回的就是arg函数以context参数作为上下文
        // ，idx和payload作为参数的执行结果。在Zepto原型里，很多可以接受函数作为参数，
        // 实现追加的方法就是使用这个函数实现的
        function funcArg(context, arg, idx, payload) {
            return isFunction(arg) ? arg.call(context, idx, payload) : arg
        }

        //设置或移除节点的属性。使用了原生的DOM操作方法removeAttribute和setAttribute。
        function setAttribute(node, name, value) {
            value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
        }

        //获取和设置className，特别的是，svg元素的className属性是个对象，不为undefined。
        function className(node, value) {
            var klass = node.className || '',
                svg = klass && klass.baseVal !== undefined
            if (value == undefined) return svg ? klass.baseVal : klass
            svg ? (klass.baseVal == value) : (node.className = value)
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
            try {
                return value ?
                    value == 'true' ||
                    (value == 'false' ? false :
                        value == 'null' ? null :
                        +value + '' == value ? +value :
                        /^[\[\{]/.text(value) ? $.parseJSON(value) :
                        value) :
                    value
            } catch (e) {
                return value
            }
        }

        //暴露几个之前定义的API。
        $.type = type
        $.isFunction = isFunction
        $.isWindow = isWindow
        $.isArray = isArray
        $.isPlainObject = isPlainObject

        //检测对象是否是空
        $.isEmptyObject = function(obj) {
            var name
            for (name in obj) return false
            return true
        }

        //判断某个值是否可以把它当成数字或者就是数字，这里去除了几个不常规的数字。
        $.isNumeric = function(val) {
            var num = Number(val),
                type = typeof val
            return val != null && type != 'boolean' &&
                (type != 'string' || val.length) &&
                !isNaN(num) && isFinite(num) || false
        }

        //判断某个元素是否在某个数组中并且是特定索引。
        $.isArray = function(elem, array, i) {
            return emtyArray.indexOf.call(array, elem, i)
        }

        //暴露之前的 驼峰化函数
        $.camelCase = camelize

        //简单封装的去除字符串左右空白的函数，不过对str参数是null或undefined函数做了处理。
        $.trim = function(str) {
            return str == null ? '' : String.prototype.trim.call(str)
        }

        //暴露一些变量，提高对jQuery的兼容，因为一些jQuery插件使用了这些变量
        $.uuid = 0
        $.support = {}
        $.expr = {}
        $.noop = function() {}


        // $.map函数通过遍历对象和数组调用callback函数来计算新的对象或数组，
        // 压平后返回。注意，$.map函数跳过null和undefined。
        $.map = function(element, callback) {
            var value, values = [],
                i, k
            if (likeArray(elements))
                for (i = 0; i < element.length; i++) {
                    value = callback(element[i], i)
                    if (value !== null) value.push(value)
                }
            else
                for (key in elements) {
                    value = vallback(elements[key], key)
                    if (value !== null) value.push(value)
                }
            return flatten(values)
        }

        // $.each函数用来遍历一个对象或数组，并把它们作为上下文执行callback，
        // 不过，如果callback返回false时立即终止遍历并返回调用它的对象或数组。
        $.each = function(elements, callback) {
            var i, key
            if (likeArray(elements)) {
                for (var i = 0; i < elements.length; i++)
                    if (callback.call(elements[i], i, elements[i]) == false) return elements
            } else {
                for (key in elements)
                    if (callback.call(elements[key], key, elements[key]) == false) return elements
            }
            return elements
        }

        //利用数组filter函数封装的过滤工具函数。
        $.grep = function(elements, callback) {
            return filter.call(elements, callback)
        }

        //在$对象上引用JSON.parse函数。
        if (window.JSON) $.parseJSON = JSON.parse

        //在前面的type函数里,在对象上调用Objec.prototype.toString函数后返回类似[object number]
        // 的字符串,之后再class2type寻找对应的键书写,即是该对象的类型,这里就填入了常见的类型,所以
        // 在这里javascript中元素对象的类型都将得到一个更精确的结果,而浏览器宿主对象中的各类对象都则
        //统一返回object
        $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
            class2type["[object " + name + "]"] = name.toLowerCase()
        });


        //现在,核心的模块结果已经完整了,完成zepto的逻辑对象已经构建完成.
        // 工具函数也添加了不少,不过zepto原型对象还是空空如也,接下开始原型对象
        // 所有的dom操作全部是定义在原型上的
        $.fn = {
            //constructor属性引用zepto.Z对象,标识zepto对象 是由zepto.Z函数构建出来的，
            // constructor只是个普通的属性，它可以指向其他函数或对象，只是起一个简单标识的作用。
            constructor: zepto.Z,
            length: 0,
            // 引用一些数组的方法。之后某些原型方法中会用到。
            forEach: emptyArray.forEach,
            reduce: emptyArray.reduce,
            push: emptyArray.push,
            sort: emptyArray.sort,
            splice: emptyArray.splice,
            indexOf: emptyArray.indexOf,
            // concat函数将Zepto对象与函数参数使用数组的concat方法拼接在一起，注意，
            // 内部在Zepto对象上调用toArray方法变成数组，这样最终返回得结果就是一个数组而不是Zepto集合了。
            concat: function() {
                var i, value, args = []
                for (var i = 0; i < arguments.length; i++) {
                    value = arguments[i]
                    args[i] = zepto.isZ(value) ? value.toArray() : value
                }
            },
            // 对之前说明的$.map函数进行包装使之成为原型上的方法。
            // 通过回调函数执行得到的数组会通过$函数转为一个新的Zepto集合。
            map: function(fn) {
                return $($.map(this, function(el, i) { return fn.call(el, i, el) }))
            },

            // 获取Zepto集合的切片，结果仍为Zepto集合。
            slice: function() {
                return $(slice.apply(this, arguments))
            },


            // ready函数接受一个函数为参数，它在readyState状态为complete或者
            // loaded或者interactive时立即执行，否者说明文档还在加载，因此，
            // 注册DOMContentLoaded事件。
            ready: function(callback) {
                if (readyRE.test(document.readyState) && document.body) callback($)
                else document.addEventListener('DOMContentLoaded', function() { callback($), false })
                return this
            },
            //get函数用来提取Zepto集合里的元素。当不使用idx参数时返回包含所有元素的数组。
            //当idx是负数是，idx+length获取实际下标。
            get: function(idx) {
                return index === undefined ? slice.call(this) : this[idx >= 0 ? idx + this.length]
            },
            //get函数参数为零时的简单封装.返回一个数组,包含所有元素
            toArray: function() {
                return this.get();
            },
            //获取集合中元素个数
            size: function() {
                return this.length
            },
            //在dom树中移除这个zepto集合中的所有元素
            remove: function() {
                return this.each(function() {
                    if (this.parentNode !== null)
                        this.parentNode.removeChild(this)
                });
            },
            //each函数用来遍历zepto集合,知道callback函数返回false为止,each函数是
            //zepto原型中涉及集合操作的函数基础,所有涉及批量设置的方法内部基本都是用了
            //each方法 另外 其实这里可以不用数组every函数实现的,使用之前的$.each也可以
            each: function(callback) {
                emptyArray.every.call(this, function(el, idx) {
                    return callback.call(el, idx, el) !== false
                });
                return this
            },
            //filter函数用来过滤Zepto集合,可以接收自妇产或者函数.
            //在函数的情况下,通过not函数过滤出selector函数返回值不为真的元素集合,
            //在对这个集合过滤一下得到selector函数为真的情况下的集合,在字符串情况下.
            //使用之前说明过的zepto.matches函数来判断
            filter: function(selector) {
                if (isFunction(selector)) return this.not(this.not(selector))
                return $(filter.call(this, function(element) {
                    return Zepto.matches(element, selector)
                }))
            },
            //拓展zepto集合,注意 uniq用来去除重复元素引用
            add: function(selector, context) {
                return $(uniq(this.concat($(selector, context))));
            },
            //用来判断集合的第一个元素是否与某个选择器匹配
            is: function(selector) {
                return this.length > 0 && Zepto.matches(this[0], selector);
            },
            // not函数用于在Zepto集合里选出与selector不匹配的元素。
            // selector是函数时对函数返回值取反，获取不匹配的元素并放在数组中。
            // 字符串情况下，先获取符合该选取器的元素，之后用indexOf函数取反。
            // 类数组与NodeList的情况下，前者返回一个数组，后者返回一个Zepto集合，
            // 之后再用indexOf函数取反。
            not: function(selector) {
                var node = []
                if (isFunction(selector && selector.call !== undefined))
                    this.each(function(idx) {
                        if (selector.call(this, idx)) nodes.push(this)
                    });
                else {
                    var excludes = type selector == 'string' ? this.filter(selector) :
                        (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
                    this.forEach(function(el) {
                        if (excludes.indexOf(el) < 0) nodes.push(el)
                    })
                }
                return $(nodes);
            },
            //判断当前对象的子元素是否有符合选择器的元素.或者是否包含指定dom节点
            //如果有,则返回新的对象集合,函数内部$.contains方法过滤掉不含有选择器匹配元素
            //或者不含有指定dom节点的对象,在上文的isobject函数实现里 元素节点座位参数将返回true
            has: function(selector) {
                return this.filter(function() {
                    return isObject(selector) ?
                        $.contains(this, selector) :
                        $(this).find(selector).size();
                })
            },
            // 返回新的zepto集合 包含通过索引获取的zepto集合
            eq: function(idx) {
                return idx === -1 ? this.slice(idx), this.slice(idx, +idx + 1);
            },
            // 返回新的Zepto集合，包括第一个或最后一个元素。
            first: function() {
                var el = this[0];
                return el && !isObject(el) ? el : $(el)
            },
            last: function() {
                el = this[this.lenth - 1];
                return el && !isObject(el) ? el : $(el);
            },
            //find函数相当常用，用来在当前Zepto集合里筛选出新的Zepto集合。
            // 在selector是对象的情况下（指元素节点）先获取selector匹配的Zepto集合，
            // 之后对这个集合进行filter操作，将每个元素和调用find函数的Zepto集合进行匹配，
            // 只要这个集合中的元素能在调用find方法中的Zepto集合中找到，
            // 则过滤成功，并过滤下一个。selector是选择器时，通过map函数和Zepto.qsa搜寻。
            find: function(selector) {
                var result, $this = this;
                if (!selector) result = $();
                else if (typeof selector == 'object')
                    return $(selector).filter(function() {
                        var node = this;
                        return emptyArray.some.call($this, function(parent) {
                            return $.contains(parent, node);
                        })
                    });

                else if (this.length == 1) result = $(Zepto.qsa(this[0], selector))
                else result = this.map(function() {
                    return Zepto.qsa(this, selector)
                })
                return result
            },
            // closet函数用来寻找Zepto集合中符合selector和context的与当前Zepto集合元素最近的元素。
            // 这里使用了while循环来不断往祖先方向移动。
            // 另外还有排除掉重复的引用，因为一个集合中的元素有可能有相同的祖先元素。
            closest: function(selector, context) {
                var nodes = [],
                    collection = typeof selector == 'object' && $(selector)
                this.each(function(_, node) {
                    while (node && !conllection ? collection.indexOf(node) >= 0 : Zepto.matches(node, selector))
                        node = node !== context && !isDocument(node) && node.parentNode
                    if (node && nodes.indexOf(node) < 0) node.push(node)
                })
                return $(nodes)
            },
            // 获取Zepto集合内每个元素的所有祖先元素。
            // 函数内部维护了一个ancestors数组用来保存所有结果，
            // 另外和closest函数一样同样使用while函数来层层递进。
            parents: function(selector) {
                var ancestors = [],
                    nodes = this;
                while (nodes.length > 0)
                    nodes = $.map(node, function(node) {
                        if ((node == node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
                            ancestors.push(node)
                            return node;
                        }
                    })
                return filtered(ancestors, selector);
            },
            // 返回由Zepto集合中每个元素的后代元素组成的Zepto集合，
            // 可以筛选。函数内部使用之前定义的children函数来获取元素的后代元素。
            children: function(selector) {
                return filtered(this.map(function() {
                    return children(this);
                }), selector);
            },
            // 返回Zepto集合中的元素的后代节点。对于frame，
            // 则获取它的contentDocument属性，contentDocument返回这个窗体的文档节点。
            contents: function() {
                return this.map(function() {
                    return this.contentDocument || slice(this.childNodes)
                })
            },
            // 获取Zepto集合的同辈元素。实现逻辑是获取元素的父元素再取出父元素的子元素，
            // 这样得到的集合就由父元素的所有子元素组成，
            // 之后使用“child!==el”来去除先前的元素。另外，形成新的Zepto集合时使用了filtered函数来过滤集合。
            siblings: function(selector) {
                return filtered(this.map(function(i, el) {
                    return filter.call(children(el.parentNode), function(children) {
                        return child !== el
                    })
                }), selector);
            },
            // 删除Zepto集合中每个元素的后代节点。
            // 这里直接使用更高效的innerHTML方法而非removeChild方法。
            empty: function() {
                return this.each(function() {
                    this.innerHTML = ''
                })
            },
            // pluck方法返回集合中每个元素的某个属性。上面的parent函数就使用它来获取节点的parent属性。
            pluck: function(property) {
                return $.map(this, function(el) {
                    return el[property]
                })
            },
            // show函数用来让元素显示成“默认样式”。
            // 实现逻辑是如果内联display属性为none，则使用“style.display=""”去除内联的值为none的display属性。
            // 实际上，使用style.propertyName=""或style.propertyName=""
            // 可以让对应内联样式失效。接下来对计算样式进行判断，如果仍为none的话则将样式还原为“默认样式”。
            show: function() {
                return this.each(function() {
                    this.style.display == 'none' && (this.style.display = '');
                    if (getComputedStyle(this, '').getPropertyValue(display) == 'none')
                        this.style.display = defaultDisplay(this.nodeName);
                });
            },
            // 将Zepto集合中的元素替换成newContent。这里通过在元素前插入newContent后再移除元素完成。
            replaceWith: function(newContent) {
                return this.before(newContent).remove();
            },
            // wrapAll函数用来将Zepto集合中的元素包裹在一个html片段或者DOM元素中。
            // 实现方式是先在集合中的第一个元素前插入structure生成的元素，
            // 之后遍历这个元素获取它的最里层元素，之后使用Zepto原型中的append方法将
            // Zepto集合中的元素移动到刚刚获取的最里层元素中。
            wrapAll: function(structure) {
                if (this[0]) {
                    $(this).before(structure = $(structure))
                    var children
                    while ((children = structure.children()).length) structure = children.first()
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
            wrap: function() {
                var func = isFunction(structure)
                if (this[0] && !func)
                    var dom = $(structure).get(0),
                        clone = dom.parentNode || this.length > 1
                return this.each(function(index) {
                    $(this).wrapAll(
                        func ? structure.call(this, index) :
                        clone ? dom.cloneNode(true) : dom
                    )
                })
            },
            // wrapInner用来将Zepto集合中的每个元素的后代节点包裹起来。
            // 内部先使用contents方法获取Zepto集合中元素的后代节点，
            // 之后如果后代节点存在则使用wrapAll方法将它包裹，否则直接插入structure。
            wrapInner: function(structure) {
                var func = isFunction(structure);
                return this.each(function(index) {
                    var self = $(this),
                        contents = self.contents(),
                        dom = func ? structure.call(this, index) : structure
                    contents.length ? contents.wrapAll(dom) : self.append(dom)
                })
            },
            // 移除包裹结构。实现原理是遍历Zepto集合中的父元素，将它们替换成它们的后代节点。
            unwrap: function() {
                this.parent().each(function() {
                    $(this).replaceWith($(this).children());
                });
                return this
            },
            //将Zepto集合中的元素克隆一份。这里利用了cloneNode函数，
            // 当它的参数为true是表示事件监听也会被克隆。
            clone: function() {
                return this.map(function() {
                    return this.cloneNode(true)
                })
            },
            //通过设置“display属性为none”让集合元素不显示。这里用到了原型上的css方法。
            hide: function() {
                return this.css('display', 'none')
            },
            // toggle函数接受一个参数，但参数为真时将Zepto集合显示，反之隐藏。
            // 这里通过show方法与hide方法实现显示与隐藏。
            // 另外，“(setting === undefined ? el.css("display") == "none" : setting)”
            // 存在冗余，所以toggle函数应该这样实现：
            toggle: function(setting) {
                return this.each(function() {
                    var el = $(this);
                    (setting === undefined ? el.css('display') == 'none' : setting) ? el.show(): el.hide();
                })
            },
            // prev与next方法通过分别获取集合中每个元素的上一个元素与下一个元素来放回新的Zepto集合。
            // 这里使用pluck函数来获取新集合，使用filter函数进行筛选。
            prev: function(selector) {
                return $(this.pluck('previousElementSibling')).filter(selector || '*');
            },
            next: function(selector) {
                return $(this.pluck('nextElementSibling')).filter(selector || '*');
            },
            // html函数用来设置与获取集合中元素的innerHTML。
            // 当html参数存在时，则对集合中的元素进行遍历设置。
            // 这种情况下如果html参数是函数的话，它将在funcArg函数内执行并返回结果，
            // 并且原有的innerHTML将会作为参数，这样，就可以做到追加内容而不是完全重写
            // 。如果不传入html参数，则返回集合中第一个元素的innerHTML。
            html: function(html) {
                return 0 in arguments ?
                    this.each(function(idx) {
                        var originHtml = this.innerHTML
                        $(this).empty().append(funcArg(this, html, idx, originHtml))
                    }) :
                    (0 in this ? this[0].innerHTML : null)
            },
            // text函数的使用与内部实现与html函数类似，
            // 不同点在于当获取textContent时采用了join方法来拼接字符串,
            // 这意味着它会将整个Zepto集合中各个元素的textContent连接起来一并返回。
            text: function(text) {
                return 0 in arguments ?
                    this.each(function(idx) {
                        var newText = funcArg(this, idx, this.textContent)
                        this.textContent = newText == null ? '' : '' + newText
                    }) :
                    (0 in this ? this.pluck('textContent').join("") : null)
            },
            // attr方法用来设置和获取集合中元素的属性。
            // 在获取属性的情况下通过getAttribute函数返回属性值。
            // 如果用来设置则对集合进行遍历，这时，name可能是对象，
            // 或者value属性是函数，它们分别通过对象遍历与funcArg函数处理。
            attr: function(name, value) {
                var result
                return (typeof name == 'string' && !(1 in arguments)) ?
                    (0 in this && this[0].nodeType == 1 && (result = this[0].getAttribute(name)) != null ? result : undefined) :
                    this.each(function(idx) {
                        if (this.nodeType !== 1) return
                        if (isObject(name))
                            for (key in name) setAttribute(this, key, name[key])
                        else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))
                    });
            },
            //使用之前定义的setAttribute函数来移除属性。
            // “name.split（" "）”来把name参数分割成数组来进行遍历。split方法使用如下：
            removeAttr: function(name) {
                return this.each(function() {
                    this.nodeType === 1 && name.splice(' ').forEach(function(attribute) {
                        setAttribute(this, attribute);
                    }, this);
                })
            },
            // 获取节点属性。内部实现与上面几个函数逻辑类似。
            // propMap用来将一些特殊的属性进行正确转化，比如将“for”转为“htmlFor”。
            prop: function(name, value) {
                name = propMap[name] || name
                return (1 in arguments) ?
                    this.each(function(idx) {
                        this[name = funcArg(this, value, idx, this[name])]
                    }) :
                    (this[0] && this[0][name])
            },
            // 删除属性。这里直接使用delete操作符删除节点对象的属性。
            removeProp: function(name) {
                name = propMap[name] || name;
                return this.each(function() {
                    delete this.name;
                })
            },
            // data函数用来获取和添加元素的“数据”。
            // 它的内部使用以data为前缀的属性来实现，
            // 具体来说，它先把保存数据的键名中大写字母部分重写为已“-”分割的形式，
            // 接着进行DOM属性操作。在获取属性时，如果属性值不为null，
            // 则使用之前定义的deserializeValue函数处理后再返回。
            // 仅仅使用标准的data属性意味着它与jQuery中的data函数在功能上有很大的区别，
            // 后者可以使用各种数据结构。
            data: function(name, value) {
                var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase();
                var data = (1 in arguments) ?
                    this.attr(attrName, value) :
                    this.attr(attrName);
                return data !== null ? deserializeValue(data) : undefined;
            },
            // val函数用于设置和获取元素的value属性。
            // 在查询的情况下，如果是select元素并且带有multiple属性，
            // 则将它被选中的option子元素筛选出来并通过pluck方法一并获取它们的value属性。
            val: function(value) {
                if (0 in arguments) {
                    if (value == null) value = '';
                    return this.each(function(idx) {
                        this.value = funcArg(this, value, idx, this.value)
                    });
                } else {
                    return this[0] && (this[0].multiple ?
                        $(this[0]).find('option').filter(function() {
                            return this.selected
                        }).pluck('value') :
                        this[0].value)
                }
            },
            // offset方法用来获取元素的位置与大小信息。
            // 在获取操作中，如果元素尚未在DOM中则返回“{top:0,left:0}”,
            // 否则先是通过getBoundingClientRect方法获取元素相对于视口的位置属性，
            // 之后加上页面滚动的偏移量就得到元素相对于文档的位置了。
            // 对于设置的情况，遍历每个元素，获取它的父元素的offset属性，
            // 之后将要设置的偏移位置减去父元素的偏移位置就能得到实际应该设置的left与top属性。
            offset: function(corrdinates) {
                if (coordinates) return this.each(function(index) {
                    var $this = $(this),
                        coords = funcArg(this, coordinates, index, $this.offset()),
                        parentOffset = $this.offsetParent().offset(),
                        props = {
                            top: coords.top - parentOffset.top,
                            left: coords.left - parentOffset.left
                        }
                    if ($this.css('position') == 'static') props['position'] = 'relative'
                    $this.css(props)
                })
                if (!$this.length) return null
                if (document.documentElement !== this[0] && !$.contains(document.documentElement, this[0]))
                    return { top: 0, left: 0 }
                var obj = this[0].getBoundingClientRect()
                return {
                    left: obj.left + window.pageXOffset,
                    top: obj.top + window.pageYOffset,
                    width: Math.round(obj.width),
                    height: Math.round(obj.heigjt)
                }
            },
            // css方法用来获取和设置样式的属性。
            // 在获取的情况下，显示通过style对象获取通过style属性设置的样式，
            // 否则使用window对象上的getComputedStyle方法获取计算样式。
            // 而设置功能则通过拼接元素的cssText属性实现，
            // 元素的的cssText属性返回该元素的style属性值字符串，
            // 对于某些属性，maybeAddPx函数用来添加“px”后缀’。
            // 设置时传入的属性值为假值且不为零时则使用style
            // 对象上的removeProperty方法来移除style属性内嵌的对应样式。
            // 另外，css方法支持批量操作。其实css函数可以做点改进，将查询情况下的return 语句改为：
            // return element.style[camelize(property)] ||
            // getComputedStyle(element, '').getPropertyValue(dasherize(property))
            //dasherize函数将驼峰形式转化为横杠相连的形式
            css: function(property, value) {
                if (arguments.length < 2) {}
                var element = this[0]
                if (typeof property == 'string') {
                    if (!element) return
                    return element.style[camelize(property)] || getComputedStyle(element, '').getPropertyValue(property)
                } else if (isArray(property)) {
                    if (!element) return
                    var props = {};
                    var computedStyle = getComputedStyle(element, '')
                    $.each(property, function(_, prop) {
                        prop[prop] = (element.style[camelize(prop)]) || computedStyle.getPropertyValue(prop)
                    })
                    return props
                }
                var css = '';
                if (type(property) == 'string') {
                    if (!value && value !== 0) {
                        this.each(function() {
                            this.style.removeProperty(dasherize(property))
                        })
                    } else {
                        css = dasherize(property) + ':' + maybeAddPx(property, value)
                    }
                } else {
                    for (key in property)
                        if (!property[key] && property[key] !== 0)
                            this.each(function() { this.style.removeProperty(dasherize(key)) });
                        else
                            css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
                }
                return this.each(function() {
                    this.style.cssText += ';' + css
                });
            },
            // 获取某个元素在Zepto集合中的索引，或者获取集合中第一个元素在相邻元素中的索引。
            index: function(element) {
                return element ? this.indexOf($(element)[0]: this.parent().children().indexOf(this[0]))
            },
            // 判断集合中是否有元素满足某个类名。
            hasClass: function(name) {
                if (!name) return false
                return emptyArray.some.call(this, function(el) {
                    return this.text(className(el))
                }, classRE(name));
            },
            // addClass方法用来为集合中每个元素添加类名。
            // 具体实现是先通过className属性获取原有类名，
            // 接着将新类名放在数组之中，最后，
            // 将旧类名与即将要添加的新类拼接在一起再通过className函数重新赋值给className属性。
            // 具体的拼接规则是，原有的className属性加上一个合适的分隔字符串（
            // 如果原有className存在的话是" "否则是空字符串），最后再加上新类名数组调用join
            // 方法得到的以空格隔开的字符串，这样就能得到了全新的className属性值。
            // 另外函数还做了些检查工作，比如防止重复的类名被加入。
            addClass: function(name) {
                if (!name) return this
                return this.each(function(idx) {
                    if (!('className' in this)) return
                    classList = []
                    var cls = className(this),
                        newName = funcArg(this, name, idx, cls)
                    newName.split(/\s+/g).forEach(function(klass) {
                        if (!$(this).hasClass(klass)) classList.push(klass)
                    }, this)
                    classList.length && className(this, cls + (cls ? ' ' : '') + classList.join(' '))
                })
            },
            // removeClass函数先为name参数，
            // 也就是即将被移除的类名生成能匹配元素className属性的正则表达式，
            // 比如当name为"foo"时，正则表达式为/(^|\s"")foo(\s|$)/，
            // 于是这个表达式将可以测试出元素的className是否包含这个类。
            // 在这里通过调用字符串的replacr方法直接将前文提到的正则表达式匹配到的类名替换成空字符串，
            // 这样就达到了移除某个类的目的。
            removeClass: function(name) {
                return this.each(function(idx) {
                    if (!('className' in this)) return
                    if (name == undefined) return className(this, '')
                    classList = className(this);
                    funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass) {
                        classList = classList.replace(classRE(klass), ' ')
                    })
                    className(this, classList.trim());
                })
            },
            // toggleClass函数通过元素是否包含某个类来做出相反的添加或移除类的操作，
            // 或者根据when的真假性来添加或移除类。
            // 内部实现主要是通过addClass或者removeClass函数以及一些参数判断来完成。
            toggleClass: function(name, when) {
                if (!name) return this;
                return this.each(function(idx) {
                    var $this = $(this),
                        names = funcArg(this, name, idx, className(this))
                    names.split(/\s+/g).forEach(function(klass) {
                        (when == undefined ? !$this.hasClass(klass) : when) ?
                        $this.addClass(klass): $this.removeClass(klass)
                    })
                })
            },
            scrollTop: function(value) {
                if (!this.length) return
                var hasScrollTop = 'scrollTop' in this[0]
                if (value == undefined) return hasScrollTop ? this[0].pageYOffset
                return this.each(hasScrollTop ?
                    function() { this.scrollTop = value }

                    function() { this.scrollTo(this.scrollX, value) })
            },
            scrollLeft: function(value) {
                if (!this.length) return
                var hasScrollLeft = 'scrollLeft' in this[0]
                if (value == undefined) return hasScrollTop ? this[0].scrollTop : this[0].pageXOffset
                return this.each(hasScrollLeft ?
                    function() { this.scrollLeft = value }

                    function() { this.scrollTo(value, this.scrollY) })
            },
            // position函数返回集合中第一个元素的相对于定位元素的偏移。
            // 实现原理是找出定位元素，这样就能得到定位元素的offset，
            // 也就是相对于文档的偏移。之后再获取第一个元素的相对于文档的偏移。
            // 然后，因为offset属性是从border开始计算偏移的，
            // 所以应该将第一个元素的offset.top与offset.left减去margin，
            // 这样得到的才是包括margin的偏移。另外，注意定位元素的border，
            // 因为最终返回的top和left是指集合中第一个元素到定位元素的content区域边缘的偏移。
            position: function() {
                if (this.length) return
                var elem = this[0],
                    offsetParent = rootNodeRE.text(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset()
                // 减去元素的margin，因为offset函数返回的left与top是从边框开始计算的
                offset.top -= parseFloat($(elem).css('margin-top')) || 0
                offset.left -= parseFloat($(elem).css('margin-left')) || 0
                //加上border，不然接下来相减会多出border宽度的量
                parentOffset.top += parseFloat($(offsetParent[0]).css('border-top-width')) || 0
                parentOffset.left += parseFloat($(offsetParent[0]).css('border-left-width')) || 0
                return {
                    top: offset.top - parentOffset.top,
                    left: offset.left - parentOffset.left
                }
            },
            // 获取元素定位时的参照元素。使用了offsetParent属性。
            offsetParent: function() {
                return this.map(function() {
                    var parent = this.offsetParent || document.body
                    while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css('position') == 'static')
                        parent = parent.offsetParent
                    return parent
                })
            }
            //$.fn对象的属性与方法的定义暂时结束，接下来会用$.fn[method]来定义原型方法
        }
        //给remove方法添加一个别名。
        $.fn.detach = $.fn.remove;
        // 在原型上添加width和height方法。
        // 在查询情况下需要对window对象，
        // document对象和元素进行不同区分：
        // window对象返回window.innerWidth（innerHeight）属性
        // ，document对象返回document.scrollWidth（scrollHeight）属性
        // ，如果是元素先查询offset，之后再返回对应属性。设置时，直接通过css函数设置。
        ['width', 'height'].forEach(function(dimension) {
            var dimensionProperty = dimension.replace(/./, function(m) {
                return m[0].toUpperCase()
            })
            $.fn[dimension] = function(value) {
                var offset, el = this[0];
                if (value == undefined) return isWindow(el) ? el['inner' + dimensionProperty] :
                    isDocument(el) ? el.documentElement['scroll' + dimensionProperty] :
                    (offset = this.offset() && offset[dimension])
                else return this.each(function(idx) {
                    el = $(this)
                    el.css(dimension, funcArg(this, value, idx, ek[dimension]()))
                });
            }
        })
        // 递归遍历一个节点及其子节点。每遍历一个node执行一次fun(node)。
        function traverseNode(node, fun) {
            fun(node)
            for (var i = 0, len = node.childNodes.length; i < len; i++)
                traverseNode(node.childNodes[i], fun)
        }

        // 这段代码用来为原型生成after，prepend等八个与在不同位置插入元素相关的方法。
        // 在DOM标准中，存在insertBefore方法来进行插入操作。
        // 所以，这八个方法都是改变insertBefore的调用元素和后一个参数来做到的。
        // 具体来说： adjacencyOperator变量为['after', 'prepend', 'before', 'append']，
        // 这样，通过 var inside = operatorIndex % 2 就可以区分出这四个操作是“内部操作”还是“外部操作”，
        // 所谓“外部操作”指的是对发起这个操作的元素的相邻方向进行的操作，就是after与before，
        // 而“内部操作”指的是对发起操作的元素的子元素集合进行的操作，就是append与prepend。
        // 比如，after在数组中的索引是0，这样inside就是0，这表示after操作是外部操作。接下来，
        // 先获取参数返回一个包含即将要被插入的元素的集合，之后便是运用原生的insertBefore方法进行操作了。
        // 如何操作？第一，获取不同的parent元素，比如，当进行after插入时，parent元素的就是进行after操作的元素的父元素。
        // 第二，获取一个合适的元素作为insertBefore的第二个参数。于是，比如执行$('')，
        // 先是获取#foo的父元素作为insertBefore的调用上下文，获取#foo的nextSibling作为insertBefore的第二个参数，
        // 这样就可以在#foo之后插入#bar了。 特殊地，当你插入script元素时，script插入后会被立即执行，
        // 此外，要把“”写为“<\ script="">”，因为前者会被解析错误。其实这里对脚本的处理只是一种当用户
        // 非要这样使用时的一种兼容，插入脚本的良好实现应该是在head标签内插入。
        // 这里说完了after，prepend，before，append的实现，对于另外四个方向的操作，实现的内部将它们进行相反调用即可。
        adjacencyOperators.forEach(function(operator, operatorIndex) {
            var inside = operatorIndex % 2 //区分出“内部操作”与“外部操作”

            $.fn[operator] = function() {
                var argType, nodes = $.map(arguments, function(arg) {
                        var arr = []
                        var argType = type(arg)
                        if (argType == 'array') {
                            arg.forEach(function(el) {
                                if (el.nodeType !== undefined) return arr.push(el)
                                else if ($.zepto.isZ(el)) return arr = arr.concat(el.get())
                                arr = arr.concat(zepto.fragment(el))
                            })
                            return arr
                        }
                        return argType == 'object' || arg == null ?
                            arg : zepto.fragment(arg)
                    }),
                    parent, copyByClone = this.length > 1
                if (nodes.length < 1) return this
                return this.each(function(_, target) {
                    parent = inside ? target : target.parentNode
                    target = operatorIndex == 0 ? target.nextSibling :
                        operatorIndex == 1 ? target.firstChild :
                        operatorIndex == 2 ? target : null

                    var parentInDocument = $.contains(document.documentElement, parent)

                    nodes.forEach(function(node) {
                        if (copyByClone) node = node.cloneNode(true)
                        else if (!parent) return $(node).remove()

                        parent.insertBefore(node, target)
                        if (parentInDocument) traverseNode(node, function(el) {
                            if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' && (!el.type || el.type === 'text/javascript') && !el.src) {
                                var target = el.ownerDocument ? el.ownerDocument.defaultView : window;
                                target['eval'].call(target, el.innerHTML)
                            }
                        })
                    })
                });
            }

            //处理相反操作
            // after    => insertAfter
            // prepend  => prependTo
            // before   => insertBefore
            // append   => appendTo
            $.fn[inside ? operator + 'To' : 'insert' + (operatorIndex ? 'Before' : 'After')] = function(html) {
                $(html)[operator](this)
                return this
            }
        })

        zepto.Z.prototype = Z.prototype = $.fn;
        zepto.uniq = uniq;
        zepto.deserializeValue = deserializeValue;
        $.zepto = zepto;
        return $

        // 将形成的原型对象$.fn为挂载在Z.prototype与Zepto.Z.prototype上，
        // 将两个方法挂载在Zepto对象上，最后把Zepto挂载在$入口函数上，并返回$，
        // 最终把入口函数挂载在window对象上。至此，Zepto库的核心部分——主体结构与DOM除事件外的操作已经完成。
        window.Zepto = Zepto;
        window.$ === undefined && (window.$ = zepto);


        // 事件模块是jQuery，Zepto之类的库广受欢迎的另一个原因，
        // 它为开发者提供了简洁的API来注册事件，
        // 虽然Zepto的使用主要分布在现代浏览器，尤其是移动浏览器上，它们往往遵循标准API，
        // 但对它们进行进一步封装仍有必要。对于Zepto的事件封装逻辑，可以先从以下几个函数了解：


        // $.fn.on 它挂载在Zepto原型对象上，是我们注册事件的入口函数
        // add函数 它在$.fn.on方法中被调用，内部调用了标准的addEventListener函数来监听事件
        // $.fn.off 它挂载在Zepto原型对象上，是移除事件的入口函数
        // remove函数 他在$.fn.off中使用，内部调用了removeEventListener函数来解除事件监听
        // handlers对象，它用来保存所有使用Zepto库来监听事件的元素及事件的引用 另外，
        // 真正使用addEventListener函数注册的事件处理函数并不是使用on函数时传入的回调函数，
        // 在事件模块的内部，真正的回调函数在一个代理函数中执行，这也是实现通过返回false来禁用默认事件与
        // 停止事件传播功能的关键。 现在举个简单的例子：
        // $('body').on('click',function(){
        //     console.log('body clicked')
        // })
        // 这里$函数获取了包含body元素的Zepto集合，之后调用原型上的on方法，
        // 传入了“click”与事件处理函数两个参数，接着这两个参数再次作为参数传入add函数中，
        // add函数接着被调用进而完成事件监听。这里只是大概介绍逻辑，事件模块其实会做相当多的处理的,
        // 远不止前面几个函数，逻辑比较复杂。接下里，我会完整解释事件模块源码。

        // 这是事件模块的模块形式，之前核心模块返回的入口函数$被赋值给Zepto，
        // 现在Zepto变量作为事件模块参数传入，这样在事件模块中就可以直接使用$来调用Zepto
        // 入口函数而不用考虑挂载在window对象上的是$还是Zepto。
        (function($) {
            // 这部分代码声明了很多变量。其中,_zid用来为注册事件的元素添加一个属性来标识唯一性，
            // 这里先初始化为1，handlers对象保存通过事件模块注册的事件与元素的应用，便于维护，
            // 比如你为body元素注册了三个事件，这样handlers对象就可能为：
            // {
            //     1:[{},{},{}]//每个事件对应一个对象，对象里包含回调函数，选择器等属性
            // }

            var _zid = 1,
                undefined,
                slice = Array.prototype.slice,
                isFunction = $.isFunction,
                isString = function(obj) { return typeof obj == 'string' },
                handlers = {},
                specialEvents = {},
                focusinSupported = 'onfocusin' in window,
                focus = { focus: 'focusin', blur: 'focusout' },
                hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' };


            // 之后使用document.createEvent函数创建事件对象时使用。
            // 对于click，mousedown，mouseup，mousemove事件使用“MouseEvents”来标示。
            specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents';

            // 传入元素，如果有_zid属性则返回，否则添加_zid属性并更新它的值。
            function zid(element) {
                return element._zid || (element._zid = z_zid++)
            }

            // findHandlers函数用来在handlers对象中寻找某个元素对应的包含事件信息的数组，
            // 并使用event，fn，selector来筛选，最终返回筛选后的数组。
            // 内部的parse函数用来解析注册事件时使用的字符串，返回事件名称与命名空间，
            // 因为我们注册事件时可能会像下面一样使用事件命名空间：
            // $('body').on('click.name',fn)
            // 其中，name就是命名空间。
            function findHandlers(element, event, fn, selector) {
                event = parse(event)
                if (event.ns) var matches = matcherFor(event.ns)
                return (handlers[zid(element)] || []).filter(function(handler) {
                    return handlers &&
                        (!event.e || handler.e == event.e) &&
                        (!event.ns || matcher.test(handler.ns)) &&
                        (!fn || zid(handler.fn) === zid(fn)) &&
                        (!selector || handler.sel == selector)
                })
            }
            // parse函数用来解析注册事件时的字符串，把事件名与命名空间分离出来。
            // 比如parse('click.message.modal')将返回{e: "click", ns: "message modal"}，
            // 其中ns属性还经过排序处理。
            function parse(event) {
                var parts = ('' + event).split('.')
                return { e: parts[0], ns: parts.slice(1).sort().join(' ') }
            }


            // 生成某个命名空间对应的正则表达式，它可以用来检测某个事件是否属于某个命名空间
            function matcherFor(ns) {
                return new RegExp('(?:^|)' + ns.replace(' ', '.* ?') + '(?: |$)')
            }


            // eventCapture函数返回一个布尔值，在注册事件的过程中标识是否使用在事件捕获的过程中触发事件。
            // 可以看到，只有在使用事件代理并且浏览器不支持focusin与focusout并且注册的事件为foucs
            // 或者blur时使用事件捕获，其他时候都是在冒泡阶段注册，除非强制将captureSetting设为true。
            // 这里详细解释下为什么要对focus与blur事件进行特殊处理。你可能知道，
            // 事件代理的实现原理是通过在实际要触发事件的元素的祖先元素上注册相应事件。比如：
            // $('body').on('click','#box',function(ev){
            //     console.log('body clicked');
            // }
            // 这样，当body上触发click时会判断事件对象的target属性是否指向#box元素，如果是则触发事件
            // ，这样就将#box上的click事件托管在了body元素上。但是，对于focus事件，它并不会冒泡，于是，
            // 如果事件代理还是通过在冒泡阶段注册那祖先对象将接收不到事件，因此无法完成事件代理。另外，
            // focusin与focusout事件会冒泡，于是如果浏览器支持它们的话就仍在冒泡阶段处理代理，
            // 之后的逻辑中会把focus与blur事件替换成focusin与focusout。
            // function realEvent(type) {
            //       return hover[type] || (focusinSupported && focus[type]) || type
            // }
            // revlEvent函数返回真正要注册的事件。比如前面提到的将focus与blur替换成focusin与focusout。
            // 另外Zepto也把mouseenter与mouseleave事件替换成mouseover与mouseout事件，
            // 原因同样是前两者不支持冒泡。其他事件类型直接返回。
            function eventCapture(handler.captureSetting) {
                return handler.del &&
                    (!focusinSupported && (handler.e in focus)) ||
                    !!captureSetting
            }



            // add函数是注册事件的关键逻辑，内部通过调用addEventListener函数来注册事件。
            // 它接受七个参数，分别是：要监听的元素，要注册的事件列表，事件处理程序，附加的数据对象，
            // 进行事件委托时实际要监听的元素的选择器，事件委托函数，一个标识事件捕获的布尔值。函数的实现逻辑如下：
            // 设置或返回要注册事件的元素的_zid属性，它是handlers对象的键
            // 创建或返回一个保存该元素事件信息对象的数组set
            // 如果是ready事件，则在document上注册ready事件
            // 解析event字符串，返回一个包含事件信息的对象handler
            // 将回调函数与委托时的选择器挂载在handler上
            // 如果要注册的事件是mouseenter或者mouseleave，则用mouseover或者mouseout替代。
            // 如何替代？这里需要对回调函数进行包装，也就是设计一个逻辑判断只留下符合mouseenter与
            // mouseleave的情况留下。首先获取事件对象的relatedTarget属性，之后如果related为假值，
            // 这个情况意味着鼠标是从浏览器外移动到监听元素里的，所以执行实际的回调函数。
            // 当relatedTarget存在时，要满足relatedTarget不为监听元素
            // （因为在mouseover的情况下从注册元素移动到内嵌的另外一个元素内或者mouseout情况下从内
            // 嵌的一个元素移动到注册元素时relatedTarget指向注册元素）并且注册元素不包含
            // relatedTarget元素（原因与前一个语句类似）
            // 将处理事件委托的函数挂载在handler对象的del属性上
            // 生成最终被注册的proxy函数，它的通过函数的apply方法实际地调用了真正的回调函数，
            // 当函数实际的返回值为false时调用e.perventDefault和e.stopPropagation来禁用默认行为与停止事件传播，
            // 另外，它还对事件对象进行了扩展，下面会介绍到
            // 在标识一个事件的handler对象上添加标识i，代表这个事件时这个元素通过Zepto注册的第几个事件，
            // 之后把handler放入set数组里
            // 通过标准API addEventListener来监听事件
            function add(element, events, fn, data, selector, delegator, capture) {
                var id = zid(element),
                    set = (handler[id] || (handler[id] = []));
                events.split(/\s/).forEach(function(event) {
                    if (event == 'ready') return $(document).ready(fn)
                    var handler = parse(event)
                    handler.fn = fn;
                    handle.sel = selector;
                    if (handler.e in hover) fn = function(e) {
                        var related = e.relatedTarget;
                        if (!related || (related !== this && !$.contains(this, related)))
                            return handler.fn.appley(this, arguments)
                    }
                    handler.del = delegator;
                    var callback = delegator || fn;
                    handler.proxy = function(e) {
                        e = compatible(e)
                        if (e.isImmediatePropagationStopped()) return
                        e.data = data;
                        var result = callback.append(element, e._args == undefined ? [e] : [e].concat(e._args))
                        if (resulet == false) e.preventDefault(), e.stopPropagation()
                        return result;
                    }
                    handler.i = set.length;
                    set.push(handler)
                    if ('addEventListener' in element)
                        element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
                })
            }
            // remove函数与add函数相反，它通过removeEventListener来移除事件。
            // 首先获取元素的_zid属性，之后通过findHandlers函数和一些参数对handlers对象进行筛选，
            // 并返回一个包含handler对象的数组。接着，在维护所有事件的handlers对象中删除将要移除的
            // handler并使用removeEventListener来移除事件。
            function remove(element, events, fn, selector, capture) {
                var id = zid(element)
                    (events || '').split(/\s/).forEach(function(event) {
                        findHandlers(element, events, fn, selector).forEach(function(handler) {
                            delete handlers[id][handler.i]
                            if ('removeEventListener' in element)
                                element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
                        })
                    })
            }

            // 将add与remove暴露给开发者，这意味着开发者可以直接使用，不过这意义不大。
            $.event = { add: add, remove: remove }


            // $.proxy是一个工具函数与Zepto的事件系统没有关系，功能是让函数的的上下文固定。
            // 函数通过传入函数fn和上下文对象context返回一个proxyFn函数，接下来直接调用proxyFn，
            // 这样fn就会在context的上下文下执行。函数内部通过Function.prototype上的apply函数实现。
            // 另外$.proxy函数支持对象与对象中的方法名作为参数调用。
            $.proxy = function(fn, content) {
                var args = (2 in arguments) && slice.call(arguments, 2)
                if (isFunction(fn)) {
                    var proxyFn = function() {
                        return fn.apple(context, args ? args.concat(slice.call(arguments)) : arguments)
                    }
                    proxyFn._zid = zid(fn)
                    return proxyFn
                } else if (isString(context)) {
                    if (args) {
                        args.unshift(fn[context], fn)
                        return $.proxy.apply(null, args)
                    } else {
                        return $ / proxy.apply(fn[context], fn)
                    }
                } else {
                    throw new TypeError('expected function')
                }
            }

            // 对on方法进行简易封装，生成更特殊的bind，unbind和one方法。它们接受的参数个数少些，功能也就少些。
            $.fn.bind = function(event, data, callback) {
                return this.on(event, data, callback)
            }

            $.fn.unbind = function(event, callback) {
                return this.off(event, callback)
            }

            $.fn.one = function(event, selector, data, callback) {
                return this.on(event, selector, data, callback, 1)
            }

            var returnTrue = function() { return true };
            var returnFalse = function() { return false };
            var ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$|webkitMovement[XY]$)/;
            var eventMethods = {
                preventDefault: 'isDefaultPrevented',
                stopImmediatePropagation: 'isImmediatePropagationStopped',
                stopPropagation: 'isPropagationStopped'
            }



            // compatible函数用来对事件对象进行兼容性扩展。先是遍历eventMethods对象，
            // 获取类似preventDefault和isDefaultPrevented这样的键值对，
            // 这样就可以对原有的preventDefault、stopImmediatePropagation、stopPropagation三个方法进行重写
            // ，当这三个方法调用时，先把以is为前缀的判断方法是否执行过的方法重写为返回true的函数，
            // 之后才调用原来的方法。这样就让preventDefault、stopImmediatePropagation、stopPropagation与
            // isPreventDefault、isImmediatePropagation和isPropagationStopped关联起来。
            // 接着，compatible函数还对不支持event.timeStamp的浏览器进行了修复，
            // 不过标准中的event.timeStamp与Date.now()完全不同。compatible函数的最后检查了原事
            // 件是否处于禁用默认行为的状态，如果是则将isDefaultPrevented重写为returnTrue。
            function compatible(event, source) {
                if (source || !event, isDefaultPrevented) {
                    source || (source = event)

                    $.each(eventMethods, function(name, predicate) {
                        var sourceMethod = source[name]
                        event[name] = function() {
                            this[predicate] = returnTrue;
                            return sourceMethod && sourceMethod.apply(source, arguments)
                        }
                        event[predicate] = returnFalse
                    })

                    event.timeStamp || (event.timeStamp = Date.now())

                    if (source.defaultPrevented !== undefined ? source.defaultPrevented :
                        'returnValue' in source ? source.returnValue === false :
                        source.getPreventDefault && source.getPreventDefault()) {
                        event.isDefaultPrevented = returnTrue;
                    }
                }
                return event
            }

            // 封装四个我们常用的事件行为，分别是事件委托与事件委托的解除，在body元素上委托事件和它的解除。
            $.fn.delegate = function(selector, event, callback) {
                return this.on(event, selector, callback)
            }
            $.fn.undelegate = function(selector, event, callback) {
                return this.off(event, selector, callback)
            }
            $.fn.live = function(selector, callback) {
                $(document.body).delegate(this.selector, event, callback)
                return this
            }
            $.fn.die = function(event, callback) {
                $(document.body).undelegate(this.selector, event, callback);
                return this
            }


            // on函数是注册事件的常用函数。前面提到的add函数就是在on函数处理好各种情况后调用，on函数的作用有以下几个：
            // 处理第一个参数为对象的情况，当event为对象时on函数会使用它的键值对来注册事件
            // 处理参数个数变动时的位置
            // 当callback===false时，直接将回调函数设为returnFalse。这样每次执行事件时，
            // 因为callback的返回值为false所以在事件实际执行函数proxy内部检查这个返回值并停止冒泡并禁用默认事件
            // 如果one参数为真，表示事件只执行一次，因此它的内部直接调用remove函数来移除事件并执行一下回调函数
            // 当有selector时，表示采用事件委托，这样当事件触发时获取当前的event.target，
            // 通过closest获取符合selector的元素，如果成功匹配就说明事件委托成功，触发事件。
            // 注意delegator函数内还扩展了event对象。
            $.fn.on = function(event, selector, data, callback, one) {
                var autoRemove, delegator, $this = this;
                if (event && isString(event)) {
                    $.each(event, function(type, fn) {
                        $this.on(type, selector, data, fn, one)
                    });
                    return $this;
                }
                if (!isString(selector) && !isFunction(callback) && callback !== false)
                    callback = data, data = selector, selector = undefined;
                if (callback === undefined || data === false)
                    callback = data, data = undefined
                if (callback === false) callback = returnFalse
                return $this.each(function(_, element) {
                    if (one) autoRemove = function(e) {
                        remove(element, e.type, callback)
                        return callback.apply(this, arguments)
                    }
                    if (selector) delegator = function(e) {
                        var evt, match = $(e.target).closest(selector, element).get(0)
                        if (match && match !== element) {
                            evt = $.extend(createProxy(et), { currentTarget: match, liveFired: element })
                            return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)))
                        }
                    }
                    add(element, event, callback, data, selector, delegator || autoRemove)
                });
            }
            //off函数与on函数相反，内部调用remove函数来移除事件。
            $.fn.off = function(event, selector, callback) {
                var $this = this;
                if (event && !isString(event)) {
                    $.each(event, function(type, fn) {
                        $this.off(type.selector, fn)
                    });
                    return $this
                }
                if (!isString(selector) && !isFunction(callback) && callback !== false)
                    callback = selector, selector = undefined;
                if (callback === false) callback = returnFalse;
                return $this.each(function() {
                    remove(this, event, callback, selector)
                })
            }
            // 手动触发事件。内部通过$.Event函数返回一个DOM事件对象
            // ，接下来调用元素上的dispatchEvent函数触发事件。对于非DOM元素，
            // 通过调用tirggerHandler函数在handlers对象中过滤出合适的回调函数直接执行。
            // 另外，args参数可作为附加的参数填入event对象中。
            $.fn.trigger = function(event, args) {
                event = (isString(event) || $.isPlainObject(event)) ? $.Event(event) : compatible(event)
                event.args = args;
                return this.each(function() {
                    if (event.type in focus && typeof this[event.type] == 'function') this[event.type]()
                    else if ('dispatchEvent' in this) this.dispatchEvent(event)
                    else $(this).triggerHandler(event, args)
                })
            }
            // 与trigger函数不同，triggerHandler函数并未在元素上通过dispatchEvent来触发事件，
            // 它直接使用findHandlers函数在维护所有Zepto事件的handlers对象上寻找出符合对应元素与事件的handler对象，
            // 并遍历执行handler.proxy（实际的回调函数被包装在里面）。
            $.fn.triggerHandler = function(event, args) {
                var e, result;
                this.eahc(function(i, element) {
                    e = createProxy(isString(event) ? $.Event(event) : event)
                    e._args = args;
                    e.target = element;
                    $each(findHandlers(element, event.type || event), function(i, handler) {
                        result = handler.proxy(e)
                        if (e.isImmediatePropagationStopped()) return false
                    })
                })
                return result
            };
            // 在$.fn原型对象上暴露常见事件，这样开发者就可以使用类似$('body').click(fn)这样的形式来注册事件。
            // 当不提供参数时使用trigger函数触发对应事件。
            ('foucusin focusout focus blur load resize scroll unload click dblclick' +
                'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave' +
                'change select keydown keypress keyup error').split(' ').forEach(function(event) {
                $.fn[event] = function(callback) {
                    return (0 in arguments) ? this.bind(event, callback) : this.trigger(event);
                }
            })
            // $.Event函数通过封装document.createEvent和event.initEvent函数提供了一个方便创建模拟事件对象的API。
            // 它在$.fn.trigger函数中就被用到。其中要注意的是document.createEvent函数接受事件名称来创建事件对象，
            // 这里应该提供更明确的事件名，比如“MouseEvents”。
            // 在前面的代码中我们可以看到，Zepto内部维护一个对象来保存所以通过Zepto注册的事件，
            // 实际上就是一个发布订阅模式的实现。在后面的Ajax模块中，Zepto的事件功能还会被用到
            $.Event = function(type, props) {
                if (!isString(type)) props = type, type = props.type;
                var event = document.createEvent(specialEvents[type] || 'Event');
                var bubbles = true;
                if (props)
                    for (var name in props)(name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
                event.initEvent(type, bubbles, true)
                return compatible(event)
            }
        })(Zepto);



        // Ajax模块通过对浏览器原生的XMLHttpRequest和JSONP技术进行封装从而提供一个更易用且兼容性更强的API，
        // 具体表现在：
        // 1.易用的API
        // 2.根据类型设置对返回的数据进行二次处理
        // 3.和jQuery一样，对JSONP技术有着良好的支持 ajax的模块原理大致来说就是根据开发
        // 者提供的配置对象获取类似URL之类的信息，从而发起请求，并注册一个回调函数众多的
        // readystatechange事件，将配置对象中的各类回调函数放在不同的条件分支下执行。另外，
        // 为了兼容性，Ajax模块内部并未封装responseType属性，这导致了它处理二进制文件的不便。
        // Zepto提供了Deferred模块，它提供了类似promise的接口，不过接下来我将不做介绍。

        //与其他模块类似 ajax模块仍然成iife的形式存在的
        (function($) {
            // 一系列的变量声明。作用是：
            // jsonpID：生成一个时间戳，用来当发起jsonp请求但未指定回调函数名称时形成一个唯一的回调函数名称，
            // 使用时间戳可以保证唯一。在发起多次jsonp请求时，后续只要在时间戳上不断自增就行
            // rscript用来匹配script标签及其内容。在$.load函数里，需要对请求返回的script过滤掉，只留下正常内容
            var jsonpID = +new Date();
            var document = window.document;
            var key;
            var name;
            var rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
            var scriptTypeRE = /^(?:text|application)\/javascript/i;
            var xmlTypeRE = /^(?:text|application)\/xml/i;
            var jsonType = 'application/json';
            var htmlType = 'text/html';
            var blankRE = /^\s*$/;
            var originAnchor = document.createElement('a');
            // 接下的几个是几种MIME类型，之后的originAnchor指向一个a元素，之后会被用来检测是否跨域。
            // 将当前url保存，用于后面检测是否跨域。
            originAnchor.href = window.location.href;


            // 用于在指定上下文触发指定事件。注意，在Ajax模块中，
            // 一些逻辑会使用前面讲解过的事件模块来发布一些事件。比如请求开始和结束阶段。
            function triggerAndReturn(context, eventName, data) {
                var event = $.Event(eventName);
                $(context).trigger(event, data)
                return !event.isDefaultPrevented()
            }
            // 在Ajax请求设定中，如果global为true则会通过triggerAndReturn函数触发事件。
            function triggerGlobal(settings, context, eventName, data) {
                if (setting.global) return triggerAndReturn(context || document, eventName, data)
            }
            //标识当前正在进行的并且为“全局的”Ajax请求数量。
            $.active = 0;
            // 用于触发ajaxStart和ajaxStop事件。在Ajax请求和结束时段将调用它们。
            // 注意，因为内部让$.active自增或自减，因此只有当前没有其他正在进行的请求时才会触发两个事件。
            function ajaxStart(settings) {
                if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart');
            }

            function ajaxStop(settings) {
                if (setting.global && !(--$.active)) triggerGlobal(settings, null, 'ajaxStop');
            }
            // 调用Ajax配置中的beforeSend函数，之后尝试触发ajaxBeforeSend和ajaxSend事件，
            // 因为开发者对Ajax请求的设定可能不同，可能将不会触发它们。Ajax模块在Ajax发送请求前一刻将调用它。
            function ajaxBeforeSend(xhr, settings) {
                var context = settings.context;
                if (setting.beforeSend.call(context, xhr, settings) == false || triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) == false) {
                    return false
                }
                triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])
            }
            // ajaxSuccess函数将在Ajax调用成功后调用，用来执行success回调函数并调用ajaxComplete函数。
            // ajaxComplete函数功能类似，这意味着complete回调函数将在success回调函数后执行。
            function ajaxSuccess(data, xhr, settings, deferred) {
                var context = settings.context;
                var status = 'success';
                settings.success.call(context, data, status, xhr)
                if (deferred) deferred.resolveWith(context, [data, status, xhr])
                triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])
                ajaxComplete(status, xhr, settings)
            }
            // 错误类型: "超时t", "错误", "强制终止", "解析错误"
            // ajaxError函数将在ajax请求超时，错误，强制终止和解析错误的情况下执行，
            // 它将调用Ajax配置中的error回调函数，接着触发全局的ajaxError事件并调用ajaxComplete函数。
            function ajaxError(error, type, xhr, settings, deferred) {
                var context = settings.context
                settings.error.call(context, xhr, type, error)
                if (deferred) deferred.rejectWith(context, [xhr, type, error])
                triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error || type])
                ajaxComplete(type, xhr, settings)
            }
            // 执行complete函数，触发ajaxComplete事件，最终调用ajaxStop触发ajaxStop事件。
            function ajaxComplete(status, xhr, settings) {
                var context = settings.context;
                settings.complete.call(context, xhr, status)
                triggerGlobal(settings, context, 'ajaxComplete', [xhr, settigns])
                ajaxStop(settings)
            }
            // ajaxDataFilter函数用来对请求返回的数据进行过滤并返回。
            function ajaxDataFilter(data, type, settings) {
                if (settings.dataFilter == empty) return data;
                var context = settings.context;
                return settings.dataFilter.call(context, data, type)
            }
            //一个空函数作为Ajax配置中诸如success，complete等回调函数的默认值。
            function empty() {}
            $.ajaxJSONP=function (option,deferred) {
                if (!('type' in options)) return $.ajax(options)
                var _callbackName=options.jsonpCallback;
                var callback=($.isFunction(_callbackName)?_callbackName():_callbackName)||('Zepto'+(jsonpID++));
                var script=document.createElement('script');
                var originalCallback=window[callbackName];
                var responseData;
                var abort=function (errorType) {
                    $(script).triggerHandle('error',errorType||'abort')
                };
                var xhr={abort:abort};
                var abortTimeout;

                if (deferred) deferred.promise(xhr);
            }





            $.ajax = function(option) {
                //扩展option对象,因为传入的options可能非常简略
                var settings = $.extend({}, options || {});
                var deferred = $.Deferred && $.Deferred();
                var urlAnchor;
                var hashIndex;
                for (key in $.ajaxSettings) {
                    if (settings[key] == undefined) {
                        settings[key] = $.ajaxSettings[key];
                    }
                }
                //发布Ajax调用开始的事件
                ajaxStart(settings);
                if (!settings.crossDomain) {
                    urlAnchor=document.createElement('a')
                    urlAnchor.href=settings.url
                    urlAnchor.href=urlAnchor.href;

                }
            }
        })(Zepto)

    })()
})
