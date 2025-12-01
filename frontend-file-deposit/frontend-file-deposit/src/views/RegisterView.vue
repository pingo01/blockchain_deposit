<template>
  <div class="register-container">
    <el-card class="register-card">
      <h2 class="register-title">用户注册</h2>
      <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="registerForm.username" placeholder="请输入用户名，不能是11位手机号格式"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码"></el-input>
        </el-form-item>
         <!-- 🌟 新增：确认密码 -->
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="registerForm.confirmPassword" 
            type="password" 
            placeholder="请再次输入密码"
          ></el-input>
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="registerForm.role" placeholder="请选择角色">
            <el-option label="上传者（文件存证）" value="uploader"></el-option>
            <el-option label="验证者（文件验证）" value="verifier"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="registerForm.nickname" placeholder="请输入昵称（可选）"></el-input>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="registerForm.phone" placeholder="请输入手机号（用于密码重置）"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleRegister" class="register-btn">注册</el-button>
          <el-button type="text" @click="goToLogin">已有账号？登录</el-button>
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
  name: 'RegisterView',
  setup() {
    const router = useRouter();
    const userStore = useUserStore();
    const registerFormRef = ref(null);

    // 注册表单数据
    const registerForm = ref({
      username: '',
      password: '',
      confirmPassword: '', // 确认密码
      role: '',
      nickname: '',
      phone: ''
    });

    // 表单校验规则
    const registerRules = ref({
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' }, 
        { min: 3, max: 20, message: '用户名长度需在3-20位之间', trigger: 'blur' },
        { pattern: /^(?!1[3-9]\d{9}$).+$/, message: '用户名不能是11位手机号', trigger: 'blur' }
      ],
      password: [{ required: true, message: '请输入密码', trigger: 'blur' }, 
      { min: 6, max: 20,message: '密码长度需在6-20位之间', trigger: 'blur' }
    ],
    // 🌟 确认密码校验规则
      confirmPassword: [
        { required: true, message: '请确认密码', trigger: 'blur' },
        { 
          // 自定义校验：判断两次密码是否一致
          validator: (rule, value, callback) => {
            if (value !== registerForm.value.password) {
              callback(new Error('两次输入的密码不一致！'));
            } else {
              callback(); // 校验通过
            }
          },
          trigger: 'blur' // 失去焦点时校验
        }
      ],
      role: [{ required: true, message: '请选择角色', trigger: 'change' }],
      nickname: [{  message: '请输入昵称', trigger: 'blur' }],
      phone: [ { required: true, message: '请输入手机号', trigger: 'blur' },{ pattern: /^1[3-9]\d{9}$/, message: '请输入合法手机号', trigger: 'blur' }]
    });

    // 处理注册
    const handleRegister = async () => {
      try {
        await registerFormRef.value.validate();
        await userStore.register(registerForm.value);
        ElMessage.success('注册成功！请登录');
        router.push('/login'); // 跳登录页
      } catch (err) {
        ElMessage.error(err.message);
      }
    };

    // 跳登录页面
    const goToLogin = () => {
      router.push('/login');
    };

    return {
      registerForm,
      registerRules,
      registerFormRef,
      handleRegister,
      goToLogin
    };
  }
};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f8f9fa;
}

.register-card {
  width: 450px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.register-title {
  text-align: center;
  color: #1989fa;
  margin-bottom: 20px;
}

.register-btn {
  width: 100%;
}
</style>