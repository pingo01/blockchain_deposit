

// 获取 Token（接口请求时携带）
export const getToken = () => {
  return localStorage.getItem('token');
};

// 存储 Token（模块一登录成功后调用）
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

// 清除 Token（退出登录时调用）
export const removeToken = () => {
  localStorage.removeItem('token');
};

// 检查是否已登录（前端快速判断）
export const isLogin = () => {
  return !!getToken(); // 有 Token 则返回 true，无则 false
};

// 新增：存储用户角色（登录成功后调用，与 setToken 配套使用）
// 角色值：'uploader'（上传者） / 'verifier'（验证者）
export const setUserRole = (role) => {
  localStorage.setItem('userRole', role);
};

// 新增：获取用户角色（模块四 UI 适配用，判断显示哪些功能）
export const getUserRole = () => {
  // 从本地存储获取，无则返回空字符串（默认未登录/无角色）
  return localStorage.getItem('userRole') || '';
};

// 新增：清除用户角色（退出登录时调用，与 removeToken 配套使用）
export const removeUserRole = () => {
  localStorage.removeItem('userRole');
};