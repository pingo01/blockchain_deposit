// src/utils/request.js
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { getToken } from './auth'; // 从auth工具类获取Token（模块一已实现）

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // 后端接口基础地址（从环境变量读取）
  timeout: 5000, // 请求超时时间（5秒）
  headers: {
    'Content-Type': 'application/json; charset=utf-8'
  }
});

// 请求拦截器：添加JWT Token（模块一登录后存储的Token）
service.interceptors.request.use(
  (config) => {
    // 获取本地存储的Token（模块一的auth.js中已实现getToken方法）
    const token = getToken();
    if (token) {
      // 给请求头添加Token（后端验证登录状态用）
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // 请求错误处理
    ElMessage.error('请求发送失败：' + error.message);
    return Promise.reject(error);
  }
);

// 响应拦截器：统一处理响应结果
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    // 若后端返回success: false，视为业务错误（如参数错误、权限不足）
    if (!res.success) {
      ElMessage.error(res.msg || '操作失败');
      return Promise.reject(res);
    }
    // 成功则返回数据
    return res;
  },
  (error) => {
    // 网络错误处理（如后端服务未启动、跨域问题）
    // 网络错误/服务器错误
    const errMsg = error.response?.data?.msg || error.message || '服务器错误';
    ElMessage.error('请求失败：' + errMsg);
    return Promise.reject(error.response?.data || { msg: errMsg });
  }
);

export default service;