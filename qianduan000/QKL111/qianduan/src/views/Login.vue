<template>
  <div class="login-container">
    <el-card class="login-card">
      <div slot="header" class="login-title">
        <h2>区块链存证系统 - 登录</h2>
      </div>

      <el-form 
        :model="loginForm" 
        :rules="loginRules" 
        ref="loginFormRef" 
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="请输入用户名"
            prefix-icon="User"
          ></el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="loginForm.password" 
            placeholder="请输入密码"
            type="password"
            prefix-icon="Lock"
            show-password
          ></el-input>
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            class="login-btn" 
            @click="handleLogin"
            icon="Login"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { User, Lock, Login } from '@element-plus/icons-vue';

// 登录表单数据
const loginForm = reactive({
  username: 'test', // 测试账号（后端已初始化）
  password: '123456' // 测试密码
});

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
};

// 表单引用
const loginFormRef = ref(null);

// 登录成功回调（传给父组件）
const emit = defineEmits(['loginSuccess']);

// 处理登录
const handleLogin = async () => {
  // 表单验证
  loginFormRef.value.validate(async (valid) => {
    if (!valid) return;

    // 模拟登录请求（实际项目中调用后端登录接口）
    try {
      // 这里用setTimeout模拟后端请求
      setTimeout(() => {
        // 测试账号密码验证（实际项目中由后端验证）
        if (loginForm.username === 'test' && loginForm.password === '123456') {
          // 保存token（实际项目中存储后端返回的token）
          localStorage.setItem('token', 'mock_token_' + Date.now());
          ElMessage.success('登录成功');
          // 通知父组件登录成功
          emit('loginSuccess');
        } else {
          ElMessage.error('用户名或密码错误');
        }
      }, 800);
    } catch (err) {
      ElMessage.error('登录失败：' + err.message);
    }
  });
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.login-card {
  width: 400px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.login-title {
  text-align: center;
}

.login-btn {
  width: 100%;
}
</style>