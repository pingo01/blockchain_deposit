import axios from 'axios';
import { getToken } from '@/utils/auth'; // 引入 Token 工具类

// 创建 axios 实例（统一配置基础路径和超时时间）
const service = axios.create({
  baseURL: 'http://localhost:3001/api', // 后端接口基础路径（和后端 app.js 一致）
  timeout: 60000 // 超时时间：60 秒（文件上传可能较慢）
});

// 请求拦截器：每次请求自动携带 Token
service.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      // Token 格式：Bearer + 空格 + Token 值（后端控制器已对应）
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // 请求失败（如网络错误），返回错误信息
    return Promise.reject(error);
  }
);

// 响应拦截器：统一处理后端返回结果
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    // 🔴 关键修改：导出凭证接口返回的是 PDF blob 流，不是 JSON，需要特殊处理！
    // 判断响应类型，如果是 blob，直接返回 response（不解析 data）
    if (response.config.responseType === 'blob') {
      return response; // 保留 blob 流，供前端处理下载
    }
    if (!res.success) {
      // 后端返回失败（如格式错误、权限不足），抛出错误提示
      return Promise.reject(new Error(res.msg || '请求失败'));
    }
    return res; // 成功则返回后端数据
  },
  (error) => {
    // 网络错误或后端状态码错误（如 401 未登录、403 权限不足）
    let errorMsg = '网络错误，请重试！';
    if (error.response) {
      errorMsg = error.response.data.msg || errorMsg;
    }
    return Promise.reject(new Error(errorMsg));
  }
);

// 封装文件上传接口（核心）
export const uploadFile = (file) => {
  // 上传文件必须用 FormData 格式（后端 multer 只能解析这种格式）
  const formData = new FormData();
  formData.append('file', file); // 键名「file」必须和后端 multer.single('file') 一致
  return service({
    url: '/file/upload', // 接口路径（完整地址：http://localhost:3001/api/file/upload）
    method: 'POST',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' } // 上传文件必须的请求头
  });
};

// 🔴 新增：导出存证凭证接口
export const exportVoucher = (depositId) => {
  return service({
    url: '/file/export-voucher', // 后端导出接口路径（完整地址：/api/file/export-voucher）
    method: 'get',
    params: { depositId }, // 传递存证ID（后端接口接收的参数名）
    responseType: 'blob', // 关键：告诉 axios 响应是 blob 流（PDF文件）
    // 无需额外加 headers：请求拦截器已自动携带 Token，Content-Type 后端会处理
  });
};