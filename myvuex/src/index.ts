/**
 * interface
 */
interface Option {
  state: object;
}
/**
 * install
 */
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

/**
 * Store
 */
class Store {
  private options: object;

  public getters: object;
  public mutations: object;
  public actions: object;
  public _modules: moduleCollection;
  public vmData: Option;
  // commit实际上就是执行mutations里指定的函数
  // 这里不用箭头函数是找不到this的
  public commit=(type,param)=>{
    this.mutations[type].forEach(fn=>fn(param))
  }
  public dispatch=(type,param)=>{
    this.actions[type].forEach(fn=>fn(param))
  }
  constructor(options:Option){
      this.options = options;
      // 初始化getters
      this.getters = {}
      // 初始化mutations
      this.mutations = {}
      // 初始化actions
      this.actions = {}
      // 初始化数据,生成状态树
      this._modules = new moduleCollection(options)
      
      const state = options.state;
      const path = []; // 初始路径给根路径为空
      installModule(this, state, path, this._modules.root);
      this.vmData = {
        state:Vue.observable(options.state || {})
      }
  }
  get state(){
      return this.vmData.state
  }
}

/**
 * 状态收集
 * moduleCollection
 */
class moduleCollection{
  //根元素
  public root: object = {};
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
        return module._children[key]
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
    }
    constructor(rootModule){
      this.register([],rootModule)
    }
  }

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
    // set注册新的属性，保证它也是响应式的
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
  let mutations = rootModule._rootModule.mutations
  if (mutations) {
    forEachValue(mutations, (mutationFn, mutationName) => {
      registerMutation(store, mutationName, mutationFn, rootModule)
    });
  }
  // 循环注册包含模块内的所有actions
  let actions = rootModule._rootModule.actions
  if (actions) {
    forEachValue(actions, (actionFn, actionName) => {
      registerAction(store, actionName, actionFn);
    });
  }
  // 如果模块嵌套模块，则需要递归安装
  forEachValue(rootModule._children, (child, key) => {
      installModule(store, rootState, path.concat(key), child)
  })
}

/**
 * 这儿的getters中的state是各自模块中的state
 * @param store 
 * @param getterName 
 * @param getterFn 
 * @param currentModule 
 */
function registerGetter(store,getterName,getterFn,currentModule){
  Object.defineProperty(store.getters,getterName,{
    get:()=>{
      return getterFn.call(store,currentModule.state)
    }
  })
}

/**
 * 由于各个模块mutation存在重复情况，因此这里使用发布-订阅模式进行注册
 * @param store 
 * @param mutationName 
 * @param mutationFn 
 * @param currentModule 
 */
function registerMutation(store,mutationName,mutationFn,currentModule){
  let mutationArr = store.mutations[mutationName] || (store.mutations[mutationName] = []);
  mutationArr.push((payload)=>{
    mutationFn.call(store,currentModule.state,payload)
  })
}

/**
 * 注册Action
 * @param store 
 * @param actionName 
 * @param actionFn 
 */
function registerAction(store,actionName,actionFn){
  let actionArr = store.actions[actionName] || (store.actions[actionName] = []);
  actionArr.push((payload)=>{
    actionFn.call(store,store,payload)
  })
}

/**
 * 遍历执行，工具函数
 * @param obj 
 * @param fn 
 */
function forEachValue (obj, fn) {
  Object.keys(obj).forEach(key=>fn(obj[key], key));
}

/**
 * 辅助函数
 */
export const mapState = stateList => {
  return stateList.reduce((prev,stateName)=>{
    prev[stateName] =function(){
      return this.$store.state[stateName]
    }
    return prev
  },{})
}
export const mapGetters = gettersList => {
  return gettersList.reduce((prev,gettersName)=>{
    prev[gettersName] =function(){
      return this.$store.getters[gettersName]
    }
    return prev
  },{})
}
export const mapMutations = mutationsList => {
  return mutationsList.reduce((prev,mutationsName)=>{
    prev[mutationsName] =function(payload){
      return this.$store.commit(mutationsName,payload)
    }
    return prev
  },{})
}
export const mapActions = actionsList => {
  return actionsList.reduce((prev,actionsName)=>{
    prev[actionsName] =function(payload){
      return this.$store.dispatch(actionsName,payload)
    }
    return prev
  },{})
}
export default {
  install,
  Store,
}