<template>
  <div class="register-container">
    <el-card class="register-card">
      <h2 class="register-title">用户注册</h2>
      <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <!-- 🌟 优化占位符：明确提示约束规则 -->
          <el-input 
            v-model="registerForm.username" 
            placeholder="3-20位，支持字母、数字及!@#$%&*()_+."
            maxlength="20" 
            show-word-limit
            @input="preventSpace('username')"
          ></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="registerForm.password" 
            type="password" 
            placeholder="6-20位，支持字母、数字及!@#$%&*()_+."
            maxlength="20" 
            show-word-limit
            show-password
            @input="preventSpace('password')"
          ></el-input>
        </el-form-item>
        <!-- 确认密码 -->
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="registerForm.confirmPassword" 
            type="password" 
            placeholder="请再次输入密码"
            maxlength="20" 
            show-word-limit
            show-password
            @input="preventSpace('confirmPassword')"
          ></el-input>
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="registerForm.role" placeholder="请选择角色">
            <el-option label="上传者（文件存证）" value="uploader"></el-option>
            <el-option label="验证者（文件验证）" value="verifier"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input 
            v-model="registerForm.nickname" 
            placeholder="1-20位（可选）"
            maxlength="20" 
            show-word-limit
            @input="preventSpace('nickname')"
          ></el-input>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input 
            v-model="registerForm.phone" 
            type="tel"
            placeholder="11位合法手机号（用于密码重置，必填）"
            maxlength="11" 
            show-word-limit
            @input="preventSpace('phone')"
          ></el-input>
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
      confirmPassword: '',
      role: '',
      nickname: '',
      phone: ''
    });
     // 🌟 核心：仅禁止输入空格（不让空格显示在输入框）
    const preventSpace = (field) => {
      // 替换所有空格为空字符串（禁止输入空格）
      registerForm.value[field] = registerForm.value[field].replace(/\s+/g, '');
    };
    // 🌟 核心：同步后端的表单校验规则
    const registerRules = ref({
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' ,},
        { min: 3, max: 20, message: '用户名长度需在3-20位之间', trigger: 'blur' },
        { 
          pattern: /^[A-Za-z0-9!@#$%&*()_+.]{3,20}$/, 
          message: '仅限字母、数字及!@#$%&*()_+.，不能包含空格', 
          trigger: 'blur' 
        },
        { 
          pattern: /^(?!1[3-9]\d{9}$).*$/, 
          message: '用户名不能是11位手机号格式', 
          trigger: 'blur' 
        }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '密码长度需在6-20位之间', trigger: 'blur' },
        { 
          pattern: /^[A-Za-z0-9!@#$%&*()_+.]{6,20}$/, 
          message: '仅限字母、数字及!@#$%&*()_+.，不能包含空格', 
          trigger: 'blur' 
        }
      ],
      confirmPassword: [
        { required: true, message: '请确认密码', trigger: 'blur' },
        { 
          validator: (rule, value, callback) => {
            if (!value) {
              callback(new Error('请输入确认密码'));
            } else if (value !== registerForm.value.password) {
              callback(new Error('两次输入的密码不一致！'));
            } else {
              callback();
            }
          },
          trigger: 'blur'
        }
      ],
      role: [
        { required: true, message: '请选择角色', trigger: 'change' }
      ],
      nickname: [
        { required: false, trigger: 'blur' }, // 非必填
        { min: 1, max: 20, message: '昵称长度需在1-20位之间', trigger: 'blur' },
        { 
          pattern: /^[^\s]{1,20}$/, 
          message: '昵称不能包含空格', 
          trigger: 'blur' 
        }
      ],
      phone: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入合法的11位手机号', trigger: 'blur' }
      ]
    });

    // 处理注册
    const handleRegister = async () => {
      try {
        await registerFormRef.value.validate(); // 前端先校验
        const result = await userStore.register(registerForm.value); // 传给后端
        if (result) {
          ElMessage.success('注册成功！请登录');
          router.push('/login');
        }
      } catch (err) {
        // 捕获前端校验或后端返回的错误
        ElMessage.error(err.message || '注册失败，请重试');
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
      preventSpace, // 导出禁止空格方法
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
  padding: 20px; /* 🌟 新增：适配小屏幕，避免溢出 */
}

.register-card {
  width: 100%;
  max-width: 450px; /* 🌟 优化：响应式宽度 */
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border-radius: 12px; /* 🌟 优化：圆角更美观 */
}

.register-title {
  text-align: center;
  color: #1989fa;
  margin-bottom: 25px;
  font-size: 20px;
  font-weight: 600;
}

.register-btn {
  width: 100%;
  height: 44px; /* 🌟 优化：按钮高度更舒适 */
  font-size: 16px;
}

/* 🌟 优化：输入框占位符样式 */
.el-input__placeholder {
  color: #9ca3af !important;
  font-size: 13px !important;
}

/* 🌟 优化：表单项间距 */
.el-form-item {
  margin-bottom: 20px;
}
</style>