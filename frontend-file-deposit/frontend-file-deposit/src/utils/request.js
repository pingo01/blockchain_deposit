import axios from 'axios';
import { ElMessage } from 'element-plus';
import { getToken } from '@/utils/auth';

const service = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json; charset=utf-8' }
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    ElMessage.error('请求发送失败：' + error.message);
    return Promise.reject(new Error('请求发送失败：' + error.message));
  }
);

// 响应拦截器（修复未使用变量 + 规范处理）
service.interceptors.response.use(
  (res) => {
    //  blob 类型（PDF流）：直接返回完整响应，不解析JSON
    if (res.config.responseType === 'blob') {
      return res;
    }

    // 普通 JSON 响应处理
    const responseData = res.data;
    if (!responseData.success) {
      ElMessage.error(responseData.msg || '请求失败');
      return Promise.reject(new Error(responseData.msg || '请求失败'));
    }
    return responseData;
  },
  (error) => {
    // 处理 blob 类型的错误响应（如后端返回500+JSON错误）
    if (error.config?.responseType === 'blob' && error.response?.data) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          // 尝试将 blob 转为文本，再解析为 JSON
          const errText = e.target.result;
          const errData = JSON.parse(errText);
          ElMessage.error('导出失败：' + errData.msg);
        } catch (parseErr) {
          // 捕获 JSON 解析失败的错误（避免未使用变量警告）
          console.warn('解析 blob 错误信息失败：', parseErr.message);
          ElMessage.error('导出失败：服务器返回异常流数据');
        }
      };
      reader.readAsText(error.response.data);
      return Promise.reject(new Error('导出失败：服务器返回异常'));
    }

    // 普通错误处理
    const errMsg = error.response?.data?.msg || '网络错误，请重试';
    ElMessage.error(errMsg);
    return Promise.reject(new Error(errMsg));
  }
);

export default service;