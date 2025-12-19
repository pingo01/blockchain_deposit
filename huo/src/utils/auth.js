// 用户认证相关工具函数

// 密码加密 (简单示例，实际项目应使用更安全的加密方式)
function encryptPassword(password) {
  // 这里使用简单的Base64编码作为示例，实际项目应使用bcrypt等安全算法
  return btoa(password);
}

// 存储用户信息到本地
function saveUser(user) {
  uni.setStorageSync('user', JSON.stringify(user));
}

// 从本地获取用户信息
function getCurrentUser() {
  const userJson = uni.getStorageSync('user');
  return userJson ? JSON.parse(userJson) : null;
}

// 清除本地用户信息
function logout() {
  uni.removeStorageSync('user');
  return { success: true };
}

// 检查用户是否已登录
function isLoggedIn() {
  return !!getCurrentUser();
}

// 获取当前用户角色
function getCurrentUserRole() {
  const user = getCurrentUser();
  return user ? user.role : null;
}

// 用户注册
function registerUser(username, password, name) {
  // 简单验证
  if (!username || !password || !name) {
    return { success: false, message: '请填写所有必填信息' };
  }
  
  // 检查用户名是否已存在
  const existingUsers = uni.getStorageSync('users') || [];
  if (existingUsers.find(user => user.username === username)) {
    return { success: false, message: '用户名已存在' };
  }
  
  // 创建新用户
  const newUser = {
    id: Date.now(),
    username,
    password: encryptPassword(password),
    name,
    role: 'user',
    createdAt: new Date().toISOString()
  };
  
  // 保存用户
  existingUsers.push(newUser);
  uni.setStorageSync('users', existingUsers);
  
  return { success: true, message: '注册成功' };
}

// 管理员注册
function registerAdmin(username, password, name, phone, idCard) {
  // 简单验证
  if (!username || !password || !name || !phone || !idCard) {
    return { success: false, message: '请填写所有必填信息' };
  }
  
  // 检查用户名是否已存在
  const existingUsers = uni.getStorageSync('users') || [];
  if (existingUsers.find(user => user.username === username)) {
    return { success: false, message: '用户名已存在' };
  }
  
  // 创建新管理员
  const newAdmin = {
    id: Date.now(),
    username,
    password: encryptPassword(password),
    name,
    phone,
    idCard,
    role: 'admin',
    createdAt: new Date().toISOString()
  };
  
  // 保存管理员
  existingUsers.push(newAdmin);
  uni.setStorageSync('users', existingUsers);
  
  return { success: true, message: '注册成功' };
}

// 用户登录
function login(username, password, role, phone = '', idCard = '') {
  // 简单验证
  if (!username || !password) {
    return { success: false, message: '请填写用户名和密码' };
  }
  
  // 获取所有用户
  const existingUsers = uni.getStorageSync('users') || [];
  
  // 查找用户
  const user = existingUsers.find(user => {
    if (role === 'admin') {
      return user.username === username && user.role === 'admin';
    } else {
      return user.username === username && user.role === 'user';
    }
  });
  
  // 检查用户是否存在
  if (!user) {
    return { success: false, message: '用户名或密码错误' };
  }
  
  // 验证密码
  if (user.password !== encryptPassword(password)) {
    return { success: false, message: '用户名或密码错误' };
  }
  
  // 管理员登录需要额外验证手机号和身份证号
  if (role === 'admin') {
    if (user.phone !== phone || user.idCard !== idCard) {
      return { success: false, message: '手机号或身份证号错误' };
    }
  }
  
  // 保存用户信息到本地
  saveUser(user);
  
  return { success: true, message: '登录成功' };
}

export {
  encryptPassword,
  registerUser,
  registerAdmin,
  login,
  isLoggedIn,
  getCurrentUser,
  getCurrentUserRole,
  logout
};
