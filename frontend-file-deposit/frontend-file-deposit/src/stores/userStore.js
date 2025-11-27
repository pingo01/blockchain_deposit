// src/stores/userStore.js
import { defineStore } from 'pinia';
import { login as loginApi, register as registerApi, resetPassword as resetPwdApi, updateProfile as updateProfileApi } from '@/api/authApi';
import { getToken, setToken, removeToken } from '@/utils/auth';

// 定义并导出 Pinia Store
export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken() || '', // 从本地存储获取 Token（持久化）
    userInfo: JSON.parse(localStorage.getItem('userInfo')) || null // 用户信息
  }),
  actions: {
    // 1. 登录动作（调用后端接口）
    async login(userData) {
      const res = await loginApi(userData);
      this.token = res.data.token; // 存储 Token 到 Pinia
      this.userInfo = res.data.userInfo; // 存储用户信息到 Pinia
      // 持久化到本地存储（刷新页面不丢失）
      setToken(res.data.token);
      localStorage.setItem('userInfo', JSON.stringify(res.data.userInfo));
      return res;
    },

    // 2. 注册动作
    async register(userData) {
      const res = await registerApi(userData);
      return res;
    },

    // 3. 密码重置动作
    async resetPassword(pwdData) {
      const res = await resetPwdApi(pwdData);
      return res;
    },

    // 4. 修改个人信息动作
    async updateProfile(profileData) {
      const res = await updateProfileApi(profileData);
      this.userInfo = res.data; // 更新 Pinia 中的用户信息
      localStorage.setItem('userInfo', JSON.stringify(res.data)); // 持久化
      return res;
    },

    // 5. 退出登录动作
    logout() {
      this.token = ''; // 清空 Pinia Token
      this.userInfo = null; // 清空 Pinia 用户信息
      removeToken(); // 清空本地存储 Token
      localStorage.removeItem('userInfo'); // 清空本地存储用户信息
    }
  }
});