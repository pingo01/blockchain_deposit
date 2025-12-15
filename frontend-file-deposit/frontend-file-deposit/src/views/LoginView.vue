<template>
  <div class="login-container">
    <div class="page-title">
      数字资产存证系统
    </div>
    <el-card class="login-card">
      <h2 class="login-title">用户登录</h2>
      <el-form 
        :model="loginForm" 
        :rules="loginRules" 
        ref="loginFormRef" 
        label-width="113px"
      >
        <el-form-item label="用户名/手机号" prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="请输入用户名/手机号"
            :disabled="isLoading" 
          ></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码"
            :disabled="isLoading" 
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleLogin" 
            class="login-btn"
            :loading="isLoading" 
            :disabled="isLoading"
            @dblclick.prevent="() => {}"
          >
            登录
          </el-button>
          <el-button type="text" @click="goToRegister">注册账号</el-button>
          <el-button type="text" @click="goToResetPwd">忘记密码？</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
//import { ElMessage } from 'element-plus';

export default {
  name: 'LoginView',
  setup() {
    const router = useRouter();
    const userStore = useUserStore();
    const loginFormRef = ref(null);
    const loginForm = ref({
      username: '',
      password: ''
    });

    const loginRules = ref({
      username: [
        { required: true, message: '请输入用户名/手机号', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度至少6位', trigger: 'blur' }
      ]
    });

    const isLoading = ref(false);

    const handleLogin = async () => {
      if (isLoading.value) return;
      isLoading.value = true;
      try {
        await loginFormRef.value.validate();
        // 🔥 1. 去掉 catch(() => {})，让错误正常抛出（避免重复请求误判）
        await userStore.login(loginForm.value);
      } catch (err) {
        console.error('登录失败：', err);
        // 🔥 2. 错误提示只在 catch 中处理（避免 finally 误判）
        //ElMessage.error(err.message || '登录失败，请重试');
      } finally {
        // 🔥 3. 去掉 finally 中的所有提示！只做跳转逻辑
        const hasValidUserInfo = Object.keys(userStore.userInfo).length > 0 && userStore.userInfo.userId;
        if (hasValidUserInfo) {
          // 去掉 ElMessage.success('登录成功！') → 只在 userStore 中提示一次
          setTimeout(() => {
            router.replace('/dashboard');
          }, 300);
        }

        isLoading.value = false;
      }
    };

    const goToRegister = () => {
      router.push('/register');
    };

    const goToResetPwd = () => {
      router.push('/reset-password');
    };

    return {
      loginForm,
      loginRules,
      loginFormRef,
      handleLogin,
      goToRegister,
      goToResetPwd,
      isLoading
    };
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column; /* 改为纵向布局，让标题和卡片垂直排列 */
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f8f9fa;
  padding-top: 20px; /* 顶部留空，避免标题贴边 */
}

/* 新增：页面顶部的系统标题样式 */
/* 系统大标题：上移 + 调整间距 */
.page-title {
  font-size: 32px;
  font-weight: bold;
  color: #1989fa;
  margin-bottom: 30px; /* 减少与登录框的间距 */
  letter-spacing: 2px;
  /* 额外上移（可选）：通过负margin让标题更靠上 */
  margin-top: -50px;
}

.login-card {
  width: 400px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.login-title {
  text-align: center;
  color: #1989fa;
  margin-bottom: 20px;
}

.login-btn {
  width: 100%;
}
</style>