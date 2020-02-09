# Little-Vuex
Typescript实现的简易版vuex

- `myvuex`为vuex的实现，作为包导出

- `vue-test`是用vue-cli 4.x建立的基于Typescript的vue项目，用于测试`myvuex`

- 代码、各个模块的功能均已在vue-test中完成测试

  

[TOC]

## Running

克隆项目

```
$ git clone https://github.com/zhenghanhao1999/Little-Vuex.git
```

myvuex

```
$ cd myvuex
$ yarn install
```

vue-test

```
$ cd vue-test
$ yarn install
```

用vue-test连接myvuex导出的包：

```
$ cd myvuex
$ yarn link
$ cd ./vue-test
$ yarn link myvuex
```

启动vue-test项目

```
$ yarn serve
```

## 具体实现

Vuex在vue中的工作流程：

 <img src="./images/vuex.png" alt="vuex" style="zoom: 80%;" />



### 前期准备工作

TODO

<hr>

 ### Install和store

我们一般会这样使用vuex：

```typescript
// store/index.ts
import Vue from "vue"
import Vuex from "vuex"
Vue.use(Vuex) 
export default new Vuex.Store({
  state: {
    text: "Hello Vuex"
  },
  getters: {},
  mutations: {},
  actions: {},
  modules: {}
)}
                           
```

- 这说明我们的`vuex`必须得向外面暴露一个`install`方法，这个`install`方法可以帮助我们在`vue`原型上注册我们的功能（提供给use方法）。 

- 我们的`vuex`不仅需要暴露出`install`方法，同样还需要暴露出一个`store`的类,上面挂载了我们使用到的`state、muations、actions、getters`等参数以及`commit、dispatch`等方法 

```typescript
// main.ts
import Vue from 'vue';
import App from './App.vue';

import store from './store';

new Vue({
  store,
  render: (h) => h(App),
}).$mount('#app');
```

- 最后将`$store`实例注入到了`vue`上 

由此， 我们需要创建一个`install`函数和一个`store`的类，然后暴露出来 。

```typescript
// myvuex
let Vue
const install = _Vue => {
// vue.use()执行的时候，会将vue作为参数传入进来，这里我们用一个变量接收 vue
  Vue = _Vue 
}
class Store {
    
}
export default {
  install,
  Store
}
```

 `install`方法应该是一个实现挂载全局`$store`的过程 

```typescript
let Vue
const install = _Vue => {
// vue.use()执行的时候，会将vue实例作为参数传入进来，这里我们用一个变量接收
  Vue = _Vue 
  // Vue.mixin帮助我们全局混入$store
  Vue.mixin({
    beforeCreate(){
      // 这里的this指的是vue实例
      const options = this.$options
      if(options.store){
        // 判断当前组件内部是否定义了store，如果有则优先使用内部的store
        this.$store = typeof options.store === 'function' ? options.store() : options.store
      } else if(options.parent && options.parent.$store){
        // 组件内部没有定义store,则从父组件下继承$store方法
        this.$store = options.parent.$store
      }
    }
  })
}
```

能够将`$store`实例注册到vue上面后，接下来我们继续完善`Store`类里面的功能 

<hr>

### state

我们通常会在组件中使用`this.$store.state`直接或间接地来获取数据，所以这里我们需要在`Store`类上定义获取`state`时的方法 

```typescript
/**
 * interface
 */
interface Option {
  state: object;
}
/**
 * Store
 */
class Store {
  private options: object;

  constructor(options:Option){
      this.options = options;
  }
  get state(){
      return this.options.state
  }
}
```

我们都知道vue的数据是响应式的，要让state中的数据也变成响应式，这里提供两种简单的方法：

1. 利用`vue`自身提供的`data`响应式机制 

   ```typescript
   class Store {
       private options: object;
       public vmData: Option;
       
       constructor(options:Option){
           this.options = options
           this.vmData = new Vue({
             data: {
                 state: options.state
             }
           });
       }
       get state(){
           return this.vmData._data.state
       }
   }
   ```

2.  利用`vue`2.6.0新增的`Vue.observable()`实现 

   ```typescript
   class Store {
       private options: object;
       public vmData: Option;
       
       constructor(options:Option){
           this.options = options
           this.vmData = {
               state:Vue.observable(options.state || {})
           }
       }
       get state(){
           return this.vmData.state
       }
   }
   ```

个人更喜欢第二种方法。（第一种方法在后面的使用中出现了不明原因报错，待解决）



**测试**

TODO

<hr>

### getters

vuex的getter和vue的computed很像，我们很容易想到用Object.defineProperty来执行get时候，也就是访问getters上面属性的时候的操作

```typescript
/**
 * Store
 */
class Store {
  private options: object;

  public getters: object;

  public vmData: Option;
  
  constructor(options:Option){
      this.options = options;
      // 初始化getters
      this.getters = {}
    
     // 遍历store上的getters
      Object.keys(options.getters).forEach(key=>{
        //为getters里所有的函数定义get时执行的操作
        Object.defineProperty(this.getters,key,{
          get:()=>{
            return options.getters[key](this.vmData.state)
          }
        })
      })
      
      this.vmData = {
        state:Vue.observable(options.state || {})
      }
  }
  get state(){
      return this.vmData.state
  }
}
```

**测试**

TODO

<hr>

### mutation

mutation是更改 Vuex 的 store 中的状态的唯一途径，循环注册方法之后，用commit的执行指定函数。

```typescript
/**
 * Store
 */
class Store {
  private options: object;
  public getters: object;
    
  public mutations: object;

  public vmData: Option;
  // commit实际上就是执行mutations里指定的函数
  public commit=(type,param)=>{
    this.mutations[type].forEach(fn=>fn(param))
  }
 
  constructor(options:Option){
      this.options = options;
      // 初始化getters
      this.getters = {}
      // 注册，遍历store上的getters
      Object.keys(options.getters).forEach(key=>{
        //为getters里所有的函数定义get时执行的操作
        Object.defineProperty(this.getters,key,{
          get:()=>{
            return options.getters[key](this.vmData.state)
          }
        })
      })
      
      // 初始化mutations
      this.mutations = {}
 	  // 注册，遍历mutations里所有的函数
      Object.keys(options.mutations).forEach(key=>{
        // 拷贝赋值
        this.mutations[key] = payload=>{
          options.mutations[key](this.vmData.state,payload)
        }
      })

      this.vmData = {
        state:Vue.observable(options.state || {})
      }
  }
  get state(){
      return this.vmData.state
  }
}
```

**测试**

TODO

### action

action与mutations原理类似，同样dispatch实现方法与commit类似，下面的代码只显示action部分，其余省略

```typescript
/** 
* Store
*/
class Store {
  private options: object;
    
  public action: object;

  public vmData: Option;
    
  // dispatch方法
  public dispatch=(type,param)=>{
    this.actions[type].forEach(fn=>fn(param))
  }
 
  constructor(options:Option){
      this.options = options;
       // 初始化actions
      this.actions = {}
      Object.keys(options.actions).forEach(key => {
          this.actions[key] = payload => {
              options.actions[key](this, payload)
          }
      })	
      
      this.vmData = {
        state:Vue.observable(options.state || {})
      }
  }
  get state(){
      return this.vmData.state
  }
}
```

### 代码简化

1.将出现多次的`Object.keys().forEach()`封装成公共的`forEachValue`函数

```typescript
function forEachValue (obj, fn) {
  Object.keys(obj).forEach(key=>fn(obj[key], key));
}
```

2.把多个初始化重新赋值的部分封装为易读的`register`函数，比如getters：

```typescript
// 初始化getters
this.getters = {}
forEachValue(options.getters,(getterFn,getterName)=>{
    registerGetter(this,getterName,getterFn)
})

// 注册getters
function registerGetter(store,getterName,getterFn){
  Object.defineProperty(store.getters,getterName,{
    get:()=>{
      return getterFn.call(store,store.vmData.state)
    }
  })
}
```

使用时：getText方法被注册到getters上，访问getText时传入state并执行该方法

```typescript
import Vue from 'vue'
import Myvuex from 'myvuex';
Vue.use(Myvuex);

interface State {
  // 测试数据
  text: string;
}

const store =  new Myvuex.Store({
    state: {
        text: 'Hello Vuex',
    },
    getters: {
        getText(state: State) {
          return state.text;
        },
    },
    ...
});
export default store;
```

### module模块化

我们的项目有可能会很复杂，需要分模块，一般我们是这么使用的：

```typescript
import Vue from 'vue';
import Myvuex from 'myvuex';
Vue.use(Myvuex);

let moduleA = {...}
let moduleB = {...}

const store =  new Myvuex.Store({
    modules: {moduleA,moduleB},
    state: {
        ...
    },
    getters: {
        ...
    },
});
export default store;
```

在不启用nameSpace的情况下，我们发现我们获取模块内的`state`使用`this.$store.state.moduleB.nameA`的方式获取。而触发模块内的`mutations`或者`action`则是与以前一样,只不过若是**两个不同的模块有重名的`mutation`或者`action`,则需要全部都执行**。下面运用两个步骤进行模块化实现

1. **格式化`modules`传来的数据**

   格式化成下面这种格式,形成一个模块**状态树**

    ```javascript
   const newModule = {
       // 根模块store
       _rootModule:store,
       // 子模块
       _children:{
           moduleA:{
             _rootModule:moduleA,
             _children:{},
             state:moduleA.state
           },
           moduleB:{
             _rootModule:moduleB,
             _children:{},
             state:moduleB.state
           }
       },
       // 根模块状态
       state:store.state
   }
    ```

   为此我们需要新增一个`moduleCollection`类来收集`store.js`中的数据，然后格式化成状态树

   ```typescript
   class Store {
     public _modules: moduleCollection;
     constructor(options={}){
         // 省略部分代码
         // 格式化数据，生成状态树
         this._modules = new ModuleCollection(options)
     }
   }
   /**
   * 状态收集类
   */
   class moduleCollection{
     constructor(rootModule){
       this.register([],rootModule)
     }
     register(path,rootModule){
       const newModule = {
         _rootModule:rootModule, // 根模块 
         _children:{}, // 子模块
         state:rootModule.state // 根模块状态
       }
       // path长度为0,说明是根元素进行初始化数据
       if(path.length === 0){
         this.root = newModule 
       }else{
         //利用reduce可以快速的将扁平化数据转换成树状数据
         const parent = path.slice(0,-1).reduce((module,key)=>{
           return module._children(key)
         },this.root)
         parent._children[path[path.length - 1]] = newModule
       }
       // 如果含有modules，则需要循环注册内部模块
       if(rootModule.modules){
         forEachValue(rootModule.modules,(rootChildModule,key)=>{
           //递归拼接
            this.register(path.concat(key),rootChildModule)
         })
       }
   }}
   
   ```

2. **安装状态树**

   `store.js`中的数据已经被我们递归组装成了状态树，接下来需要将状态树安装进`Store`类中。

   新增`installModule`函数,`installModule`主要帮助我们将格式化好的状态树注册到`Store`类中，这里用到了Vue.set，源码也是这么写的

   ```typescript
   /**
    * 递归状态树,挂载getters,actions,mutations
    * @param store 
    * @param rootState 
    * @param path 
    * @param rootModule 
    */
   function installModule(store, rootState, path, rootModule) {
     // 这儿将模块中的state循环出来设置到根state中去,以便我们通过this.$store.state.moduleA来访问数据
     if (path.length > 0) {
       const parent = path.slice(0,-1).reduce((state,key)=>{
         return state[key]
       },rootState)
       // Vue.set注册新的属性，保证它也是响应式的
       Vue.set(parent, path[path.length - 1], rootModule.state)
     }
     // 循环注册包含模块内的所有getters
     let getters = rootModule._rootModule.getters
     if (getters) {
       forEachValue(getters, (getterFn, getterName) => {
         registerGetter(store, getterName, getterFn, rootModule);
       });
     }
     // 循环注册包含模块内的所有mutations
     	...
     // 循环注册包含模块内的所有actions
   	...
     // 如果模块嵌套模块，则需要递归安装
     forEachValue(rootModule._children, (child, key) => {
         installModule(store, rootState, path.concat(key), child)
     })
   }
   ```

   ​	然后在Store类里面使用它注册，省略部分代码：

   ```typescript
   /**
    * Store
    */
   class Store {
     private options: object;
   
     public _modules: moduleCollection;
   
     constructor(options:Option){
         this.options = options;
        
         // 初始化数据,生成状态树
         this._modules = new moduleCollection(options)
         
         const state = options.state;
         const path = []; // 初始路径给根路径为空
         installModule(this, state, path, this._modules.root);
   
     }
   }
   ```