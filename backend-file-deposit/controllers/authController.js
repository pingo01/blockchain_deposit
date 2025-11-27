// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { executeSql } = require('../db/index');
require('dotenv').config();

// ---------------- 1. 用户注册 ----------------
const register = async (req, res) => {
  try {
    // 1. 获取前端传参（用户名、密码、角色、昵称、手机号）
    const { username, password, role, nickname, phone } = req.body;

    // 2. 校验必填参数（避免空值）
    if (!username || !password || !role) {
      return res.status(400).json({ success: false, msg: '用户名、密码、角色不能为空！' });
    }

    // 3. 校验角色合法性（只能是 uploader/verifier）
    if (!['uploader', 'verifier'].includes(role)) {
      return res.status(400).json({ success: false, msg: '角色只能是 uploader（上传者）或 verifier（验证者）！' });
    }

    // 4. 校验用户名是否已存在
    const userExists = await executeSql(
      'SELECT id FROM user WHERE username = ?',
      [username]
    );
    if (userExists.length > 0) {
      return res.status(400).json({ success: false, msg: '用户名已存在，请更换！' });
    }

    // 5. 校验手机号是否已存在（如果传了手机号）
    if (phone) {
      const phoneExists = await executeSql(
        'SELECT id FROM user WHERE phone = ?',
        [phone]
      );
      if (phoneExists.length > 0) {
        return res.status(400).json({ success: false, msg: '手机号已被注册！' });
      }
    }

    // 6. 密码加密（BCrypt 加盐，安全存储）
    const salt = await bcrypt.genSalt(10); // 加盐强度（10-12 为宜）
    const encryptedPassword = await bcrypt.hash(password, salt);

    // 7. 插入用户数据到数据库
    const result = await executeSql(
      `INSERT INTO user (username, password, role, nickname, phone) 
       VALUES (?, ?, ?, ?, ?)`,
      [username, encryptedPassword, role, nickname || '默认用户', phone || '']
    );

    // 8. 返回注册成功结果
    res.status(201).json({
      success: true,
      msg: '注册成功！',
      data: {
        userId: result.insertId, // 新用户 ID
        username,
        role,
        nickname: nickname || '默认用户',
        status: '正常'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: '注册失败：' + err.message });
  }
};

// ---------------- 2. 用户登录 ----------------
const login = async (req, res) => {
  try {
    // 1. 获取前端传参（用户名、密码）
    const { username, password } = req.body;

    // 2. 校验必填参数
    if (!username || !password) {
      return res.status(400).json({ success: false, msg: '用户名和密码不能为空！' });
    }

    // 3. 查询用户是否存在
    const users = await executeSql(
      'SELECT id, username, password, role, nickname, status FROM user WHERE username = ?',
      [username]
    );
    const user = users[0];
    if (!user) {
      return res.status(401).json({ success: false, msg: '用户名或密码错误！' });
    }

    // 4. 校验账号状态（是否正常）
    if (user.status !== '正常') {
      return res.status(403).json({ success: false, msg: '账号已被禁用，请联系管理员！' });
    }

    // 5. 校验密码（加密后对比）
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, msg: '用户名或密码错误！' });
    }

    // 6. 生成 JWT Token（包含用户 ID 和角色，供模块二校验）
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET, // 与模块二一致的密钥
      { expiresIn: process.env.JWT_EXPIRES_IN } // 有效期 24 小时
    );

    // 7. 返回登录成功结果（Token + 用户信息）
    res.status(200).json({
      success: true,
      msg: '登录成功！',
      data: {
        token, // 核心：前端需存储此 Token
        userInfo: {
          userId: user.id,
          username: user.username,
          role: user.role,
          nickname: user.nickname,
          status: user.status
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: '登录失败：' + err.message });
  }
};

// ---------------- 3. 密码重置（通过手机号）----------------
const resetPassword = async (req, res) => {
  try {
    // 1. 获取前端传参（手机号、新密码）
    const { phone, newPassword } = req.body;

    // 2. 校验必填参数
    if (!phone || !newPassword) {
      return res.status(400).json({ success: false, msg: '手机号和新密码不能为空！' });
    }

    // 3. 校验手机号是否存在
    const users = await executeSql(
      'SELECT id FROM user WHERE phone = ?',
      [phone]
    );
    if (users.length === 0) {
      return res.status(400).json({ success: false, msg: '该手机号未注册！' });
    }

    // 4. 新密码加密
    const salt = await bcrypt.genSalt(10);
    const encryptedNewPassword = await bcrypt.hash(newPassword, salt);

    // 5. 更新密码
    await executeSql(
      'UPDATE user SET password = ? WHERE phone = ?',
      [encryptedNewPassword, phone]
    );

    // 6. 返回结果
    res.status(200).json({ success: true, msg: '密码重置成功，请重新登录！' });
  } catch (err) {
    res.status(500).json({ success: false, msg: '密码重置失败：' + err.message });
  }
};

// ---------------- 4. 修改个人信息 ----------------
const updateProfile = async (req, res) => {
  try {
    // 1. 获取前端传参（从 Token 中解析的 userId + 要修改的信息）
    const { userId } = req.user; // 从 JWT 中间件解析而来（后续配置）
    const { nickname, phone } = req.body;

    // 2. 校验要修改的信息（至少传一项）
    if (!nickname && !phone) {
      return res.status(400).json({ success: false, msg: '至少修改一项个人信息！' });
    }

    // 3. 校验手机号是否已被他人使用（如果修改手机号）
    if (phone) {
      const users = await executeSql(
        'SELECT id FROM user WHERE phone = ? AND id != ?',
        [phone, userId] // 排除当前用户
      );
      if (users.length > 0) {
        return res.status(400).json({ success: false, msg: '手机号已被注册！' });
      }
    }

    // 4. 构建更新 SQL（动态拼接要修改的字段）
    let updateFields = [];
    let params = [];
    if (nickname) {
      updateFields.push('nickname = ?');
      params.push(nickname);
    }
    if (phone) {
      updateFields.push('phone = ?');
      params.push(phone);
    }
    params.push(userId); // 最后一个参数是 userId（WHERE 条件）

    const sql = `UPDATE user SET ${updateFields.join(', ')} WHERE id = ?`;

    // 5. 执行更新
    await executeSql(sql, params);

    // 6. 查询更新后的用户信息（返回给前端）
    const updatedUser = await executeSql(
      'SELECT id, username, nickname, phone, role, status FROM user WHERE id = ?',
      [userId]
    );

    // 7. 返回结果
    res.status(200).json({
      success: true,
      msg: '个人信息修改成功！',
      data: updatedUser[0]
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: '修改个人信息失败：' + err.message });
  }
};

// ---------------- 中间件：验证登录状态（供修改个人信息使用）----------------
const verifyLogin = (req, res, next) => {
  try {
    // 从请求头获取 Token（格式：Authorization: Bearer xxx）
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, msg: '未登录，请先登录！' });
    }

    // 验证 Token 有效性
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // 挂载用户信息到 req，供后续控制器使用
    next();
  } catch (err) {
    return res.status(401).json({ success: false, msg: '登录状态失效，请重新登录！' });
  }
};

// 导出控制器方法
module.exports = {
  register,
  login,
  resetPassword,
  updateProfile,
  verifyLogin
};