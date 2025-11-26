// 存储 Token（模块一登录成功后调用）
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

// 获取 Token（接口请求时携带）
export const getToken = () => {
  return localStorage.getItem('token');
};

// 清除 Token（退出登录时调用）
export const removeToken = () => {
  localStorage.removeItem('token');
};

// 检查是否已登录（前端快速判断）
export const isLogin = () => {
  return !!getToken(); // 有 Token 则返回 true，无则 false
};