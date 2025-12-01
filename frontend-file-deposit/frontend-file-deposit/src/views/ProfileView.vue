<template>
  <div class="profile-container">
    <!-- 只保留1个Back按钮 + 标题（简化结构） -->
    <div class="header-bar">
      <!-- 唯一的返回按钮（绑定跳转） -->
      <el-button 
        type="text" 
        @click="$router.push('/dashboard')" 
        class="back-btn"
      >
        ← Back
      </el-button>
      <!-- 页面标题（替换el-page-header，避免重复渲染） -->
      <h2 class="page-title">个人信息管理</h2>
    </div>

    <el-card class="profile-card">
      <el-form :model="profileForm" :rules="profileRules" ref="profileFormRef" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="profileForm.username" disabled placeholder="用户名不可修改"></el-input>
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-input v-model="profileForm.role" disabled placeholder="角色不可修改"></el-input>
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input 
            v-model="profileForm.nickname" 
            placeholder="请输入1-20位昵称"
            maxlength="20"
            show-word-limit
            @input="preventSpace('nickname')"
          ></el-input>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input 
            v-model="profileForm.phone" 
            placeholder="请输入11位合法手机号"
            type="tel"
            maxlength="11"
            show-word-limit
            @input="trimPhone" 
          ></el-input>
        </el-form-item>
        <el-form-item label="账号状态" prop="status">
          <el-input v-model="profileForm.status" disabled></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleUpdateProfile">保存修改</el-button>
          <el-button type="danger" @click="handleLogout">退出登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import { ElMessage } from 'element-plus';

export default {
  name: 'ProfileView',
  setup() {
    const router = useRouter();
    const userStore = useUserStore();
    const profileFormRef = ref(null);

    // 个人信息表单数据
    const profileForm = ref({
      username: '',
      role: '',
      nickname: '',
      phone: '',
      status: ''
    });

    // 🌟 核心1：禁止昵称输入空格（匹配规则：昵称不能有空格）
    const preventSpace = (field) => {
      profileForm.value[field] = profileForm.value[field].replace(/\s+/g, ''); // 移除所有空格
    };

    // 🌟 核心2：手机号实时去空格（避免用户误输入）
    const trimPhone = () => {
      profileForm.value.phone = profileForm.value.phone.trim();
    };


    // 表单校验规则
    const profileRules = ref({
      nickname: [
        { required: true, message: '请输入昵称', trigger: 'blur' },
        { min: 1, max: 20, message: '昵称长度需在1-20位之间', trigger: ['blur', 'input'] }, // 实时提示
        { 
          pattern: /^[^\s]{1,20}$/, 
          message: '昵称不能包含空格', 
          trigger: ['blur', 'input'] // 实时提示
        }
      ],
      phone: [
        {required: true, pattern: /^1[3-9]\d{9}$/, message: '请输入合法的11位手机号', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入合法的11位手机号', trigger: ['blur', 'input'] }, // 实时提示
        { min: 11, max: 11, message: '手机号长度必须为11位', trigger: ['blur', 'input'] } // 补充长度提示
      ]
    });

    // 页面加载时，初始化表单数据（从 Pinia 获取）
    onMounted(() => {
      if (userStore.userInfo) {
        profileForm.value = { ...userStore.userInfo };
      }
    });

    // 处理修改个人信息
    const handleUpdateProfile = async () => {
      try {
        await profileFormRef.value.validate();
        await userStore.updateProfile({
          nickname: profileForm.value.nickname,
          phone: profileForm.value.phone
        });
        //ElMessage.success('个人信息修改成功！');
      } catch (err) {
        ElMessage.error(err.message|| '修改失败，请重试');
      }
    };

    // 处理退出登录
    // 处理退出登录（修改跳转方式）
    const handleLogout = () => {
      userStore.logout();
      //ElMessage.success('退出登录成功！');
      router.replace('/login'); // 用 replace 替代 push
    };

    return {
      profileForm,
      profileRules,
      profileFormRef,
      handleUpdateProfile,
      preventSpace, // 导出禁止空格方法
      trimPhone, // 导出手机号去空格方法
      handleLogout
    };
  }
};
</script>

<style scoped>
.profile-container {
  padding: 30px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

/* 头部栏样式（仅一个按钮+标题） */
.header-bar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.back-btn {
  color: #4299e1;
  font-size: 16px;
  margin-right: 16px;
  padding: 0;
}

.back-btn:hover {
  color: #3182ce;
}

.page-title {
  font-size: 20px;
  font-weight: 500;
  color: #2d3748;
  margin: 0;
}

.profile-card {
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
</style>