import Vue from 'vue';
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
    mutations: {
        syncSetText(state: State, param: string) {
          state.text = param;
        },
    },
    actions: {
        asyncSetText({commit}: any, param: string) {
          commit('syncSetText', param);
        },
    },
    modules: {},
});
export default store;
