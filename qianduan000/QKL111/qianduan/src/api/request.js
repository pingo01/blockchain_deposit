import axios from 'axios';
import { ElMessage, ElLoading } from 'element-plus';

// 创建Axios实例
const service = axios.create({
  baseURL: 'http://localhost:8080/api', // 后端接口基础路径（必须与后端一致）
  timeout: 30000, // 超时时间（30秒，大文件上传需要）
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
});

// 加载动画实例
let loadingInstance = null;

// 请求拦截器：添加加载动画和token
service.interceptors.request.use(
  (config) => {
    // 显示加载动画
    loadingInstance = ElLoading.service({
      text: '处理中...',
      background: 'rgba(255,255,255,0.7)'
    });
    // 添加登录token（实际项目中从localStorage获取）
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token;
    }
    return config;
  },
  (error) => {
    // 失败时关闭加载动画
    if (loadingInstance) loadingInstance.close();
    ElMessage.error('请求发送失败：' + error.message);
    return Promise.reject(error);
  }
);

// 响应拦截器：处理返回结果和错误
service.interceptors.response.use(
  (response) => {
    // 关闭加载动画
    if (loadingInstance) loadingInstance.close();
    // 直接返回后端数据（跳过response.data.data的嵌套）
    return response.data;
  },
  (error) => {
    // 关闭加载动画
    if (loadingInstance) loadingInstance.close();
    // 错误处理（网络错误/后端异常）
    const errorMsg = error.response?.data?.msg || error.message || '未知错误';
    ElMessage.error('请求失败：' + errorMsg);
    return Promise.reject(error);
  }
);

export default service;