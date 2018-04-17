//mvvm构造类
let mvvm = function(options) {
  this.options = options;
  this.el = options.el;
  this.data = options.data;
  this.methods = options.methods;
  this.observe(this.data); //监听属性
  this.compile(this.el); //编译文档
};
//实现observer
mvvm.prototype.observe = function(obj) {
  let dep = new Dep();
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      let value = obj[key];
      if (typeof value === "object") {
        this.observe(value); //如果值还是对象，则递归处理
      }
      Object.defineProperty(this, key, {
        enumerable: true,
        configurable: true,
        get: function() {
          console.log(`获取${value}`);
          if (Dep.target) {
            dep.addSub(Dep.target);
          } // 将watcher添加到订阅事件中 [watcher]
          return this.data[key]; //数据代理
        },
        set: function(newVal) {
          console.log(`更新${newVal}`);
          if (value !== newVal) {
            this.data[key] = newVal;
            this.observe(newVal);
            console.log(dep);
            dep.notify();
          }
        }
      });
    }
  }
};

//实现compile
mvvm.prototype.compile = function(el) {
  let dom = document.querySelector(el);
  let fragment = document.createDocumentFragment();
  while ((child = dom.firstChild)) {
    fragment.appendChild(child); // 此时将el中的内容放入内存中
  }
  let that = this;
  function replace(frag) {
    Array.from(frag.childNodes).forEach(node => {
      let txt = node.textContent;
      let reg = /\{\{(.+?)\}\}/g; // 正则匹配是文本节点又有大括号的情况{{}}
      if (node.nodeType === 3 && reg.test(txt)) {
        console.log(RegExp.$1); //匹配data数据标记
        let arr = RegExp.$1.split(".");
        let value = that;
        arr.forEach(key => {
          value = value[key]; //调用属性get方法
        });
        node.textContent = txt.replace(reg, value).trim();
        new Watcher(that, RegExp.$1, newVal => {
          node.textContent = txt.replace(reg, newVal).trim(); // 用trim方法去除一下首尾空格
        });
      }
      // 如果还有子节点，继续递归replace
      if (node.childNodes && node.childNodes.length) {
        replace(node);
      }
    });
  }
  replace(fragment); // 替换内容
  dom.appendChild(fragment); // 再将文档碎片放入el中
};

class Dep {
  constructor() {
    this.subs = [];
  }
  addSub(sub) {
    this.subs.push(sub);
  }
  notify() {
    this.subs.forEach(sub => sub.update());
  }
}

class Watcher {
  constructor(mvvm, exp, fn) {
    this.fn = fn;
    this.mvvm = mvvm;
    this.exp = exp;
    Dep.target = this;
    //this.get();
  }
  get() {
    let arr = this.exp.split(".");
    let val = this.mvvm;
    arr.forEach(key => {
      val = val[key]; //调用属性get方法
    });
    Dep.target = null;
  }
}
Watcher.prototype.update = function() {
  let arr = this.exp.split(".");
  let value = this.mvvm;
  arr.forEach(key => {
    value = value[key]; // 通过get获取到新的值
  });
  this.fn(value); // 每次拿到的新值去替换{{}}的内容即可
};

//实例化对象
let app = new mvvm({
  el: "#app",
  data: {
    name: "hl123j",
    age: "24",
    point: { a: "11", b: "22" }
  },
  methods: {
    increment: function() {
      this.number++;
    }
  }
});
