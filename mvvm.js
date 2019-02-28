//mvvm构造类
class mvvm {
    constructor(options) {
        this.options = options;
        this.el = options.el;
        this.data = options.data;
        this.methods = options.methods;
        this.observe(this.data); //监听属性
        this.compile(this.el); //编译文档
        this.options.life.mounted.call(this);//文档所有属性已经挂载
    }
};
//实现observer
mvvm.prototype.observe = function (obj) {
    let dep = new EventLoop();
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            let value = obj[key];
            if (typeof value === "object") {
                this.observe(value); //如果值还是对象，则递归处理
            }
            else {
                Object.defineProperty(this, key, {
                    enumerable: true,
                    configurable: true,
                    get: function () {
                        console.log(`值：${value}`)
                        if (EventLoop.target) {
                            dep.addSub(EventLoop.target);
                        } // 将watcher添加到订阅事件中
                        return this.data[key]; //数据代理
                    },
                    set: function (newVal) {
                        this.data[key] = newVal;
                        this.observe(newVal);
                        dep.notify();
                    }
                });
            }
        }
    }
};

/** 正则表达式实现模板替换*/
mvvm.prototype.replace = function (frag) {
    Array.from(frag.childNodes).forEach(node => {
        let txt = node.textContent;
        let reg = /\{\{(.+?)\}\}/g; // 正则匹配是文本节点又有大括号的情况{{}}
        if (node.nodeType === 3 && reg.test(txt)) {
            console.log(`变量key：${RegExp.$1}`); //匹配data数据标记
            new Watcher(this, RegExp.$1, newVal => {
                node.textContent = txt.replace(reg, newVal).trim();
            });
            let v = this[RegExp.$1]; //调用属性get方法
            node.textContent = txt.replace(reg, v).trim();
        }
        //判断数据绑定指令v-data
        else if (node.nodeType == 1) {
            let nodeAttr = node.attributes;
            Array.from(nodeAttr).forEach((attr) => {
                let AttrName = attr.name;
                let exp = attr.value;
                if (node.value != this[exp] && AttrName.includes("v-data")) {
                    new Watcher(this, exp, newVal => {
                        node.value = newVal;
                    });
                    node.value = this[exp];
                    node.addEventListener('input', (e) => {
                        this[exp] = e.target.value;
                    })
                }
                else if (AttrName.includes("v-if")) {
                    new Watcher(this, exp, newVal => {
                        node.style.display = newVal ? "block" : "none";
                        console.log(`显示状态为:${newVal}`);
                    });
                    node.style.display = this[exp] ? "block" : "none";
                }
            })
        }
        // 如果还有子节点，继续递归replace
        if (node.childNodes && node.childNodes.length) {
            this.replace(node);
        }
    });
}
/** 实现compile编译文档*/
mvvm.prototype.compile = function (el) {
    let dom = document.querySelector(el);
    let fragment = document.createDocumentFragment();
    while ((child = dom.firstChild)) {
        fragment.appendChild(child); // 此时将el中的内容放入内存中
    }
    this.replace(fragment); // 替换内容
    dom.appendChild(fragment); // 再将文档碎片放入el中
};
/** 建立事件池*/
class EventLoop {
    constructor() {
        this.EventArray = [];
    }
    addSub(EventFn) {
        this.EventArray.push(EventFn);
    }
    notify() {
        this.EventArray.forEach(EventFn => EventFn.update());
    }
}

class Watcher {
    constructor(mvvm, exp, fn) {
        this.fn = fn;
        this.mvvm = mvvm;
        this.exp = exp;
        EventLoop.target = this;
    }
}

Watcher.prototype.update = function () {
    let arr = this.exp.split(".");
    arr.forEach(key => {
        this.fn(this.mvvm[key]); // 每次拿到的新值去替换{{}}的内容
    });
    EventLoop.target = null;
};

//实例化对象
let app = new mvvm({
    el: "#app",
    data: {
        name: "hl123j",
        age: "24",
        divshow: true,
        point: { a: "11", b: "22" }
    },
    life: {
        mounted: function () {
            console.log("Dom is OK")
        }
    }
});