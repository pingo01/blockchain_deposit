<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2 class="login-title">用户登录</h2>
      <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" class="login-btn">登录</el-button>
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
import { ElMessage } from 'element-plus';

export default {
  name: 'LoginView',
  setup() {
    const router = useRouter();
    const userStore = useUserStore();
    const loginFormRef = ref(null); // 表单引用

    // 登录表单数据
    const loginForm = ref({
      username: '',
      password: ''
    });

    // 表单校验规则
    const loginRules = ref({
      username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
      password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码长度至少6位', trigger: 'blur' }]
    });

    // 处理登录
    const handleLogin = async () => {
      try {
        // 表单校验
        await loginFormRef.value.validate();
        // 调用 Pinia 登录动作
        await userStore.login(loginForm.value);
        ElMessage.success('登录成功！');
        // 根据角色跳对应页面（上传者跳上传页，验证者跳验证页）
        if (userStore.userInfo.role === 'uploader') {
          router.push('/upload');
        } else {
          router.push('/verify');
        }
      } catch (err) {
        ElMessage.error(err.message);
      }
    };

    // 跳注册页面
    const goToRegister = () => {
      router.push('/register');
    };

    // 跳密码重置页面
    const goToResetPwd = () => {
      router.push('/reset-password');
    };

    return {
      loginForm,
      loginRules,
      loginFormRef,
      handleLogin,
      goToRegister,
      goToResetPwd
    };
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f8f9fa;
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