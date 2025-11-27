import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 极简配置：只保留Vue编译和路径别名，无其他插件
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  }
})
/*import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
// 新增：自动导入插件
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusIconsResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    // 自动导入Element Plus Icons
    Icons({
      autoInstall: true, // 自动安装缺失的图标
    }),
    // 自动解析并注册组件（包括图标）
    Components({
      resolvers: [
        // 自动识别Element Plus图标，组件名格式：Icon+图标名（首字母大写）
        ElementPlusIconsResolver({
          prefix: 'Icon', 
        }),
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  }
})*/
/*
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)) // 保留原有路径别名
    },
  },
  // 新增：预编译Element Plus Icons，解决500编译错误
  optimizeDeps: {
    include: [
      '@element-plus/icons-vue/search.vue',
      '@element-plus/icons-vue/check-circle.vue',
      '@element-plus/icons-vue/check-circle-filled.vue',
      '@element-plus/icons-vue/close-circle-filled.vue',
      '@element-plus/icons-vue/warning-filled.vue',
      '@element-plus/icons-vue/empty.vue'
    ]
  }
})
*/