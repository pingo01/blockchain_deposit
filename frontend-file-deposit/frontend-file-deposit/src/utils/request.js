import axios from 'axios';
import { ElMessage } from 'element-plus';
import { getToken } from '@/utils/auth';

const service = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 5000,
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

// 响应拦截器
service.interceptors.response.use(
  (res) => {
    const responseData = res.data;
    if (!responseData.success) {
      //ElMessage.error(responseData.msg || '请求失败');
      return Promise.reject(new Error(responseData.msg || '请求失败'));
    }
    return responseData;
  },
  (error) => {
    const errMsg = error.response?.data?.msg || '网络错误，请重试';
    //ElMessage.error(errMsg);
    return Promise.reject(new Error(errMsg));
  }
);

export default service;