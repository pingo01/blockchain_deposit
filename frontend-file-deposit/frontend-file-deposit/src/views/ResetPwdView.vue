<template>
  <div class="reset-pwd-container">
    <el-card class="reset-pwd-card">
      <h2 class="reset-pwd-title">密码重置</h2>
      <el-form :model="resetPwdForm" :rules="resetPwdRules" ref="resetPwdFormRef" label-width="80px">
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="resetPwdForm.phone" placeholder="请输入注册时的手机号"></el-input>
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="resetPwdForm.newPassword" type="password" placeholder="请输入新密码"></el-input>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="resetPwdForm.confirmPassword" type="password" placeholder="请再次输入新密码"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleResetPwd" class="reset-pwd-btn">重置密码</el-button>
          <el-button type="text" @click="goToLogin">返回登录</el-button>
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
  name: 'ResetPwdView',
  setup() {
    const router = useRouter();
    const userStore = useUserStore();
    const resetPwdFormRef = ref(null);

    // 密码重置表单数据
    const resetPwdForm = ref({
      phone: '',
      newPassword: '',
      confirmPassword: ''
    });

    // 表单校验规则
    const resetPwdRules = ref({
      phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入合法手机号', trigger: 'blur' }],
      newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }, { min: 6, message: '密码长度至少6位', trigger: 'blur' }],
      confirmPassword: [
        { required: true, message: '请确认新密码', trigger: 'blur' },
        { 
          validator: (rule, value, callback) => {
            if (value !== resetPwdForm.value.newPassword) {
              callback(new Error('两次输入的密码不一致！'));
            } else {
              callback();
            }
          },
          trigger: 'blur'
        }
      ]
    });

    // 处理密码重置
const handleResetPwd = async () => {
  try {
    // 1. 表单校验（正确，保留）
    await resetPwdFormRef.value.validate();
    
    // 2. 正确调用：传递两个独立参数（phone 和 newPassword），不是对象！
    const result = await userStore.resetPassword(
      resetPwdForm.value.phone, // 第一个参数：手机号
      resetPwdForm.value.newPassword // 第二个参数：新密码
    );

    // 3. 不需要再弹成功弹窗（userStore 中已经弹了，避免重复）
    if (result) {
      // userStore 中已调用 logout() 跳登录页，这里可以省略，或保留冗余保障
      setTimeout(() => router.push('/login'), 1500);
    }
  } catch (err) {
    // 4. 错误弹窗（保留，捕获表单校验或接口调用的错误）
    ElMessage.error(err.message || '密码重置失败，请重试');
  }
};

    // 跳登录页面
    const goToLogin = () => {
      router.push('/login');
    };

    return {
      resetPwdForm,
      resetPwdRules,
      resetPwdFormRef,
      handleResetPwd,
      goToLogin
    };
  }
};
</script>

<style scoped>
.reset-pwd-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f8f9fa;
}

.reset-pwd-card {
  width: 450px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.reset-pwd-title {
  text-align: center;
  color: #1989fa;
  margin-bottom: 20px;
}

.reset-pwd-btn {
  width: 100%;
}
</style>