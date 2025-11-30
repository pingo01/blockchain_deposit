<template>
  <div class="dashboard-container">
    <!-- 顶部标题 -->
    <h2 class="page-title">个人中心</h2>

    <!-- 角色信息区域 -->
    <div class="user-info">
      <p>用户名：{{ userStore.userInfo?.username || '未知用户' }}</p>
      <p>用户角色：{{ userStore.userInfo?.role === 'uploader' ? '上传者' : '验证者' }}</p>
      <button class="btn edit-btn" @click="$router.push('/profile')">编辑个人信息</button>
    </div>

    <!-- 功能入口区域（纯按钮，无图标） -->
    <div class="function-area">
      <h3 class="function-title">功能菜单</h3>
      
      <!-- 通用功能：个人信息管理 -->
      <button class="btn function-btn" @click="$router.push('/profile')">
        个人信息管理
      </button>

      <!-- 上传者专属功能 -->
      <button 
        v-if="userStore.userInfo.role === 'uploader'" 
        class="btn function-btn" 
        @click="$router.push('/upload')"
      >
        文件上传
      </button>
      <button 
        v-if="userStore.userInfo.role === 'uploader'" 
        class="btn function-btn" 
        @click="$router.push('/query')"
      >
        文件查询
      </button>

      <!-- 验证者专属功能 -->
      <button 
        v-if="userStore.userInfo.role === 'verifier'" 
        class="btn function-btn" 
        @click="$router.push('/verify')"
      >
        文件验证
      </button>
    </div>

    <!-- 退出登录按钮 -->
    <button class="btn logout-btn" @click="handleLogout">退出登录</button>
  </div>
</template>

<script>
import { useUserStore } from '@/stores/userStore';
import { useRouter } from 'vue-router';
//import { ElMessage } from 'element-plus';

export default {
  name: 'DashboardView',
  setup() {
    const userStore = useUserStore();
    const router = useRouter();

    // 🔥 修复退出登录：用 replace 跳转，避免路由守卫拦截
    const handleLogout = () => {
      userStore.logout(); // 调用你已有的 logout 方法（清空状态+本地存储）
      //ElMessage.success('退出登录成功！');
      // 用 replace 替代 push：替换当前路由，避免回退到个人中心
      router.replace('/login'); 
    };

    return {
      userStore,
      handleLogout
    };
  }
};
</script>

<style scoped>
/* 极简样式，无额外依赖 */
.dashboard-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.page-title {
  text-align: center;
  margin-bottom: 30px;
  color: #2d3748;
}

.user-info {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.user-info p {
  margin: 8px 0;
  color: #4a5568;
}

.function-area {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.function-title {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2d3748;
  font-size: 16px;
}

/* 按钮样式 */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.edit-btn {
  background-color: #4299e1;
  color: #fff;
  margin-top: 10px;
}

.edit-btn:hover {
  background-color: #3182ce;
}

.function-btn {
  display: block;
  width: 100%;
  margin-bottom: 10px;
  background-color: #f7fafc;
  color: #2d3748;
  text-align: left;
}

.function-btn:hover {
  background-color: #edf2f7;
}

.logout-btn {
  background-color: #e53e3e;
  color: #fff;
  display: block;
  margin: 0 auto;
}

.logout-btn:hover {
  background-color: #c53030;
}
</style>