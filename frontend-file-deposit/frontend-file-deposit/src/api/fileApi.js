// src/api/fileApi.js（完全替换成下面的代码）
import axios from 'axios';
import { getToken } from '@/utils/auth';

// 创建文件专用的 axios 实例（和验证接口隔离）
const fileService = axios.create({
  baseURL: 'http://localhost:3001/api', // 和后端接口地址一致
  timeout: 60000 // 上传文件超时设为 60 秒（避免大文件超时）
});

// 请求拦截器：携带 Token（和全局逻辑一致）
fileService.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：统一处理错误（不拦截业务错误，只处理网络异常）
fileService.interceptors.response.use(
  (response) => response.data, // 直接返回响应体，交给组件处理
  (error) => {
    let errorMsg = '文件操作失败，请重试';
    if (error.response) {
      errorMsg = error.response.data.msg || `服务器错误（状态码：${error.response.status}）`;
    }
    console.error('❌ fileApi - 接口异常：', errorMsg);
    return Promise.reject(new Error(errorMsg));
  }
);

// 🔴 核心：导出 uploadFile 方法（FileUpload.vue 要导入的关键）
export const uploadFile = async (formData) => {
  console.log('\n📤 fileApi - 上传文件请求：');
  console.log('表单数据：', formData);
  return fileService({
    url: '/file/upload', // 后端上传接口路径（必须和 fileController.js 的路由一致）
    method: 'POST',
    data: formData,
    //headers: {
      //'Content-Type': 'multipart/form-data' // 上传文件必须用这个 Content-Type
    //}
  });
};

// 可选：文件列表查询（按需保留）
export const getFileList = () => {
  return fileService({
    url: '/file/list',
    method: 'GET'
  });
};
/*
// 可选：文件下载（按需保留）
export const downloadFile = (depositId) => {
  return fileService({
    url: `/file/download/${depositId}`,
    method: 'GET',
    responseType: 'blob' // 下载文件必须指定响应类型为 blob
  });
};

*/
// 可选：导出存证凭证PDF（和后端 exportVoucher 接口对应）
export const exportVoucher = (depositId) => {
  return fileService({
    url: `/file/export-voucher`,
    method: 'GET',
    params: { depositId }, // 存证ID通过 query 参数传递（和后端路由一致）
    responseType: 'blob',
    timeout: 60000 // 延长超时（大文件 PDF 生成可能较慢）
  });
};

// 可选：导出验证报告PDF（和后端 exportVerifyReport 接口对应）
export const exportVerifyReport = (reportData) => {
  return fileService({
    url: '/file/export-verify-report',
    method: 'POST',
    data: reportData,
    responseType: 'blob'
  });
};



/*
import axios from 'axios';
import { getToken } from '@/utils/auth'; // 引入 Token 工具类

// 🔴 单独创建 axios 实例，不使用全局 request（避免被响应拦截器干扰）
const verifyService = axios.create({
  baseURL: 'http://localhost:3001/api', // 和全局一致
  timeout: 60000 // 超时时间 60 秒
});

// 🔴 单独配置请求拦截器（保持 Token 携带逻辑）
verifyService.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 🔴 关键：单独配置响应拦截器，不拦截 success: false（保留完整响应）
verifyService.interceptors.response.use(
  (response) => {
    const res = response.data;
    // 仅处理网络响应成功（状态码 2xx），无论 res.success 是 true/false，都返回完整数据
    console.log('📡 verifyApi - 接口响应（不拦截 success: false）：', res);
    return res; // 直接返回完整响应，不抛出错误
  },
  (error) => {
    // 仅捕获网络错误、超时、状态码 4xx/5xx 等真正的异常
    let errorMsg = '网络错误，请重试！';
    if (error.response) {
      errorMsg = error.response.data.msg || `服务器错误（状态码：${error.response.status}）`;
    }
    console.error('❌ verifyApi - 接口请求异常：', errorMsg);
    return Promise.reject(new Error(errorMsg));
  }
);


//验证文件完整性（存证ID + 文件哈希）
// 核心修改：不拦截 success: false，返回完整响应

export const verifyFileByDepositId = async (params) => {
  try {
    console.log('\n📡 verifyApi - 发送验证接口请求：');
    console.log('请求参数：', params);
    console.log('请求配置：', {
      url: '/verify/file',
      method: 'POST',
      baseURL: verifyService.defaults.baseURL,
      最终请求URL: verifyService.defaults.baseURL + '/verify/file'
    });

    const response = await verifyService({
      url: '/verify/file',
      method: 'POST',
      data: params,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });

    return response; // 返回完整响应（含 success: false 的情况）
  } catch (err) {
    console.error('❌ verifyApi - 验证接口异常：', err);
    throw err; // 仅抛出真正的异常（网络错误等）
  }
};
*/






/*
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
*/