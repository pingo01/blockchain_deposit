<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <el-header class="app-header">
      <div class="logo">区块链文件存证系统</div>
      <el-menu 
        :default-active="activeMenu" 
        mode="horizontal" 
        @select="handleMenuSelect"
      >
        <el-menu-item index="upload">文件上传</el-menu-item>
        <el-menu-item index="verify">存证验证</el-menu-item>
        <el-menu-item index="login" v-if="!isLogin">登录</el-menu-item>
        <el-menu-item index="logout" v-if="isLogin">退出</el-menu-item>
      </el-menu>
    </el-header>

    <!-- 页面内容区：根据导航切换显示不同页面 -->
    <el-main class="app-main">
      <UploadFile v-if="activeMenu === 'upload'" />
      <Verify v-if="activeMenu === 'verify'" />
      <Login v-if="activeMenu === 'login'" @loginSuccess="handleLoginSuccess" />
    </el-main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
// 引入页面组件
import UploadFile from './views/UploadFile.vue';
import Verify from './views/Verify.vue';
import Login from './views/Login.vue';

// 当前激活的菜单（默认显示上传页）
const activeMenu = ref('upload');
// 登录状态（默认未登录）
const isLogin = ref(false);

// 切换菜单
const handleMenuSelect = (index) => {
  activeMenu.value = index;
  // 未登录时访问上传/验证页，强制跳转登录
  if (!isLogin.value && (index === 'upload' || index === 'verify')) {
    activeMenu.value = 'login';
    ElMessage.warning('请先登录');
  }
};

// 登录成功回调
const handleLoginSuccess = () => {
  isLogin.value = true;
  activeMenu.value = 'upload'; // 登录后跳转到上传页
};
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background-color: #165DFF;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.logo {
  font-size: 18px;
  font-weight: bold;
}

.app-main {
  flex: 1;
  padding: 20px;
  background-color: #f5f7fa;
}
</style>