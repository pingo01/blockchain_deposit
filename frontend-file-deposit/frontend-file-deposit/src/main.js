// src/main.js 正确代码
import { createApp } from 'vue';
import { createPinia } from 'pinia'; // 新增：引入 Pinia（状态管理必需）
import ElementPlus from 'element-plus'; // 引入 Element Plus 组件库
import 'element-plus/dist/index.css'; // 引入 Element Plus 样式（必须）
import App from './App.vue';
// 👇 关键修改：删除自己定义的路由，引入 src/router/index.js 里的正确路由
import router from './router/index.js'; 

// 👇 新增：创建 Pinia 实例（用户状态存储必需，之前漏了！）
const pinia = createPinia();

// 创建 Vue 实例并挂载（只注册正确的 router 和 pinia）
createApp(App)
  .use(ElementPlus) // 注册 Element Plus
  .use(pinia)       // 注册 Pinia（必须，否则用户登录状态存不了）
  .use(router)      // 注册正确的路由（来自 src/router/index.js）
  .mount('#app');