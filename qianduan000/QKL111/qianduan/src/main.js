import { createApp } from 'vue'
import App from './App.vue'
// 1. 引入Element Plus及样式
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 2. 引入Element Plus所有图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
// 3. 引入Axios封装实例
import service from './api/request'

// 创建Vue应用实例
const app = createApp(App)

// 全局注册Element Plus
app.use(ElementPlus)

// 全局注册所有图标（确保<el-icon>可用）
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 全局挂载Axios（组件中可通过 this.$http 调用）
app.config.globalProperties.$http = service

// 挂载Vue应用到#app节点
app.mount('#app')