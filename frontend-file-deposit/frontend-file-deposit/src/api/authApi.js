// src/api/authApi.js
import axios from 'axios';
import { getToken } from '@/utils/auth';

// 创建 axios 实例
const service = axios.create({
  baseURL: 'http://localhost:3001/api', // 后端接口基础路径
  timeout: 5000
});

// 请求拦截器：修改个人信息时携带 Token
service.interceptors.request.use(
  (config) => {
    if (getToken() && config.url.includes('update-profile')) {
      config.headers.Authorization = `Bearer ${getToken()}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：统一处理结果
service.interceptors.response.use(
  (res) => {
    if (!res.data.success) {
      return Promise.reject(new Error(res.data.msg || '请求失败'));
    }
    return res.data;
  },
  (error) => {
    const errMsg = error.response?.data?.msg || '网络错误，请重试！';
    return Promise.reject(new Error(errMsg));
  }
);

// 1. 用户注册接口
export const register = (userData) => {
  return service({
    url: '/auth/register',
    method: 'POST',
    data: userData
  });
};

// 2. 用户登录接口
export const login = (userData) => {
  return service({
    url: '/auth/login',
    method: 'POST',
    data: userData
  });
};

// 3. 密码重置接口
export const resetPassword = (pwdData) => {
  return service({
    url: '/auth/reset-password',
    method: 'POST',
    data: pwdData
  });
};

// 4. 修改个人信息接口
export const updateProfile = (profileData) => {
  return service({
    url: '/auth/update-profile',
    method: 'PUT',
    data: profileData
  });
};