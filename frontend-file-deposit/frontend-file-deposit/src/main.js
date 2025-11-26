import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import ElementPlus from 'element-plus'; // 引入 Element Plus 组件库
import 'element-plus/dist/index.css'; // 引入 Element Plus 样式（必须）
import App from './App.vue';
import UploadView from './views/UploadView.vue'; // 后续创建的上传页面

// 路由配置（仅上传页面，后续可扩展其他页面）
const routes = [
  { path: '/', name: 'Upload', component: UploadView } // 默认访问上传页面
];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
});

// 创建 Vue 实例并挂载
createApp(App)
  .use(ElementPlus) // 注册 Element Plus
  .use(router)      // 注册路由
  .mount('#app');   // 挂载到 index.html 的 #app 节点