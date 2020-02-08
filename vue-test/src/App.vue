<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js + TypeScript App"/>
    <div id="content">{{ getState }}</div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import HelloWorld from './components/HelloWorld.vue';

@Component({
  components: {
    HelloWorld,
  },
})
export default class App extends Vue {
    //声明
    $store

    //直接获取state
    get getText(){
      return this.$store.state.text;
    } 
    //通过getter获取state
    get getState(){
        return this.$store.getters.getText
    }
    //在mounted中测试数据变更
    mounted(){
      setTimeout(() => {
         this.asyncSet();
      }, 1000)
    }
    /**
     * 同步更改state，通过mutations，commit方法
     */
    private syncSet(){
      this.$store.commit('syncSetText','同步更改数据')
    }
    /**
     * 异步更改state，通过action，dispatch方法
     */
    private asyncSet(){
      this.$store.dispatch('asyncSetText','异步更改数据')
    }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
#content {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  font-size: 30px;
  margin-top: 30px; 
}
</style>