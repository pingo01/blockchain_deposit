// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { executeSql } = require('../db/index');
require('dotenv').config();

// ---------------- 1. 用户注册 ----------------
// ---------------- 1. 用户注册（修复bug+同步特殊字符规则）----------------
const register = async (req, res) => {
  try {
    // 1. 获取前端传参（包含 confirmPassword，前端已新增）
    const { username, password, confirmPassword, role, nickname, phone } = req.body;
    
    // 2. 定义统一正则表达式（特殊字符仅保留 !@#$%&*()_+.，避免正则报错）
    const regex = {
      // 用户名：3-20位，仅限 大小写字母、数字、指定特殊字符（无空格）
      username: /^[A-Za-z0-9!@#$%&*()_+.]{3,20}$/,
      // 密码：6-20位，同上（和用户名字符集一致）
      password: /^[A-Za-z0-9!@#$%&*()_+.]{6,20}$/,
      // 昵称：1-20位，无空格（任意字符除空格）
      nickname: /^[^\s]{1,20}$/,
      // 手机号：严格11位数字（必填，用于密码重置）
      phone: /^1[3-9]\d{9}$/
    };

    // 3. 逐一校验字段（按优先级排序，修复关键bug）
    // （1）必填参数校验（修复：之前漏了 confirmPassword 从 req.body 获取，导致未定义报错）
    if (!username || !password || !confirmPassword || !role || !phone) {
      return res.status(400).json({ success: false, msg: '用户名、密码、确认密码、角色、手机号不能为空！' });
    }

    // （2）用户名校验（修复：错误提示文案同步简化后的特殊字符，避免误导）
    if (!regex.username.test(username)) {
      return res.status(400).json({ 
        success: false, 
        msg: '用户名需3-20位，仅限大小写字母、数字及!@#$%&*()_+.，不能包含空格！' 
      });
    }
    if (regex.phone.test(username)) {
      return res.status(400).json({ success: false, msg: '用户名不能是11位手机号格式！' });
    }
    // 用户名唯一性校验
    const usernameExists = await executeSql('SELECT id FROM user WHERE username = ?', [username]);
    if (usernameExists.length > 0) {
      return res.status(400).json({ success: false, msg: '用户名已存在，请更换！' });
    }

    // （3）密码校验（修复：错误提示文案同步，去掉多余的特殊字符描述）
    if (!regex.password.test(password)) {
      return res.status(400).json({ 
        success: false, 
        msg: '密码需6-20位，仅限大小写字母、数字及!@#$%&*()_+.，不能包含空格！' 
      });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, msg: '两次输入的密码不一致！' });
    }

    // （4）昵称校验（可选，传则校验）
    if (nickname) {
      if (!regex.nickname.test(nickname)) {
        return res.status(400).json({ success: false, msg: '昵称需1-20位，不能包含空格！' });
      }
    }

    // （5）手机号校验（修复：从“可选”改为“必填”，同步前端规则；补充格式校验）
    if (!regex.phone.test(phone)) {
      return res.status(400).json({ success: false, msg: '请输入合法的11位手机号！' });
    }
    // 手机号唯一性校验
    const phoneExists = await executeSql('SELECT id FROM user WHERE phone = ?', [phone]);
    if (phoneExists.length > 0) {
      return res.status(400).json({ success: false, msg: '手机号已被注册！' });
    }

    // （6）角色合法性校验（原有逻辑保留）
    if (!['uploader', 'verifier'].includes(role)) {
      return res.status(400).json({ success: false, msg: '角色只能是 uploader（上传者）或 verifier（验证者）！' });
    }

    // 4. 密码加密（BCrypt 加盐，安全存储）
    const salt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(password, salt);

    // 5. 插入用户数据到数据库（原有逻辑保留，手机号不再默认空字符串）
    const result = await executeSql(
      `INSERT INTO user (username, password, role, nickname, phone) 
       VALUES (?, ?, ?, ?, ?)`,
      [username, encryptedPassword, role, nickname || '默认用户', phone] // 手机号必填，无需 || ''
    );

    // 6. 返回注册成功结果
    res.status(201).json({
      success: true,
      msg: '注册成功！',
      data: {
        userId: result.insertId,
        username,
        role,
        nickname: nickname || '默认用户',
        status: '正常'
      }
    });
  } catch (err) {
    console.error('注册异常：', err); // 若仍报错，查看控制台打印的具体错误
    res.status(500).json({ success: false, msg: '注册失败：' + err.message });
  }
};

// ---------------- 2. 用户登录 （核心修改：支持用户名/手机号双登录）----------------
const login = async (req, res) => {
  try {
    // 1. 获取前端传参（用户名、密码）
    console.log('===== 登录接口被触发 =====');
    console.log('前端传入的参数：', req.body); // 看是否拿到用户名密码
    const { username: loginInput, password } = req.body;
console.log('解析后的登录输入：', loginInput);
    console.log('解析后的密码：', password);
    // 2. 校验必填参数
    if (!loginInput || !password) {
      return res.status(400).json({ success: false, msg: '用户名/手机号和密码不能为空！' });
    }

     // 3. 关键：判断输入格式，定向查询（避免冲突）
    const phoneRegex = /^1[3-9]\d{9}$/;
    let querySql = '';
    let queryParams = [];

    if (phoneRegex.test(loginInput)) {
      // 输入是手机号格式 → 只查询 phone 字段
      querySql = 'SELECT id, username, password, role, nickname, status, phone FROM user WHERE phone = ? LIMIT 1';
      queryParams = [loginInput];
    } else {
      // 输入是用户名格式 → 只查询 username 字段
      querySql = 'SELECT id, username, password, role, nickname, status, phone FROM user WHERE username = ? LIMIT 1';
      queryParams = [loginInput];
    }

    // 执行查询
    const users = await executeSql(querySql, queryParams);
    console.log('数据库查询结果：', users); // 看是否查询到用hu
    const user = users[0];
     console.log('查询到的用户：', user); // 看是否有用户数据

    // 4. 校验用户是否存在
    if (!user) {
      console.log('用户不存在，返回 401');
          return res.status(401).json({ success: false, msg: '用户名/手机号或密码错误！' });
        }

    // 5. 校验账号状态（是否正常）
    if (user.status !== '正常') {
      console.log('账号状态异常，返回 403');
      return res.status(403).json({ success: false, msg: '账号已被禁用，请联系管理员！' });
    }

    // 6. 校验密码（加密后对比）
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('密码校验结果：', isPasswordValid); // 🔥 看密码是否正确
    if (!isPasswordValid) {
      console.log('密码错误，返回 401');
      return res.status(401).json({ success: false, msg: '用户名/手机号或密码错误！' });
    }

    // 7. 生成 JWT Token（包含用户 ID 和角色，供模块二校验）
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET, // 与模块二一致的密钥
      { expiresIn: process.env.JWT_EXPIRES_IN } // 有效期 24 小时
    );
console.log('生成的 Token：', token);
    console.log('即将返回成功响应');
    
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
          status: user.status,
          phone: user.phone // 补充 phone 字段，前端就能拿到了
        }
      }
    });
  } catch (err) {
    console.error('===== 登录接口错误 =====', err);
    res.status(500).json({ success: false, msg: '登录失败：' + err.message });
  }
};

// ---------------- 3. 密码重置（新增密码长度上限校验：6-20位，手机号+4位图形验证码+新密码）----------------
const resetPassword = async (req, res) => {
  try {
    // 1. 获取前端传参（手机号、验证码、新密码、确认密码）
    const { phone, code, newPassword , confirmNewPassword} = req.body;

    // 2. 定义正则表达式（严格按约束：特殊字符仅保留 !@#$%&*()_+.）
    const regex = {
      phone: /^1[3-9]\d{9}$/, // 手机号：11位合法格式
      password: /^[A-Za-z0-9!@#$%&*()_+.]{6,20}$/, // 新密码：6-20位，指定字符集+无空格
      code: /^[A-Za-z0-9]{4}$/ // 改为：大小写字母+数字，4位
    };


    // 3. 逐一校验字段（按优先级，补充你缺失的校验）
    // （1）必填参数校验（新增 confirmNewPassword 校验）
    if (!phone || !code || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ success: false, msg: '手机号、验证码、新密码、确认密码不能为空！' });
    }

    // （2）手机号校验（复用正则，避免重复定义）
    if (!regex.phone.test(phone)) {
      return res.status(400).json({ success: false, msg: '请输入合法的11位手机号！' });
    }

    // （3）手机号是否注册校验
    const users = await executeSql('SELECT id FROM user WHERE phone = ?', [phone]);
    if (users.length === 0) {
      return res.status(400).json({ success: false, msg: '该手机号未注册！' });
    }

    // （4）验证码校验（从“长度校验”升级为“4位数字校验”）
    if (!regex.code.test(code)) {
      return res.status(400).json({ success: false, msg: '验证码为4位大小写字母或数字！' });
    }

    // （5）新密码校验（补充字符集+无空格校验，你之前只校验了长度）
    if (!regex.password.test(newPassword)) {
      return res.status(400).json({
        success: false,
        msg: '新密码需6-20位，仅限大小写字母、数字及!@#$%&*()_+.，不能包含空格！'
      });
    }

    // （6）确认密码校验（新增：与新密码一致性）
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ success: false, msg: '两次输入的新密码不一致！' });
    }

    // 4. 新密码加密（与注册模块一致的BCrypt逻辑）
    const salt = await bcrypt.genSalt(10);
    const encryptedNewPassword = await bcrypt.hash(newPassword, salt);

    // 5. 更新数据库密码
    await executeSql(
      'UPDATE user SET password = ? WHERE phone = ?',
      [encryptedNewPassword, phone]
    );

    // 6. 返回结果
    res.status(200).json({ success: true, msg: '密码重置成功，请重新登录！' });
  } catch (err) {
    console.error('密码重置异常：', err);
    res.status(500).json({ success: false, msg: '密码重置失败：' + err.message });
  }
};

// ---------------- 4. 修改个人信息 ----------------
const updateProfile = async (req, res) => {
  try {
    // 1. 获取前端传参（从 Token 中解析的 userId + 要修改的信息）
    const { userId } = req.user; // 从 JWT 中间件解析而来（后续配置）
    const { nickname, phone } = req.body;

    // 🌟 新增：定义与前端/注册模块一致的正则规则
    const regex = {
      nickname: /^[^\s]{1,20}$/, // 昵称：1-20位，无空格
      phone: /^1[3-9]\d{9}$/     // 手机号：11位合法格式
    };

 // 1. 校验要修改的信息（至少传一项）
    if (!nickname && !phone) {
      return res.status(400).json({ success: false, msg: '至少修改一项个人信息！' });
    }

    // 2. 昵称校验（如果传递了昵称）
    if (nickname) {
      if (!regex.nickname.test(nickname)) {
        return res.status(400).json({ success: false, msg: '昵称需1-20位，不能包含空格！' });
      }
    }

    // 3. 手机号校验（如果传递了手机号）
    if (phone) {
      // （1）格式校验
      if (!regex.phone.test(phone)) {
        return res.status(400).json({ success: false, msg: '请输入合法的11位手机号！' });
      }
      // （2）唯一性校验（排除当前用户）
      const users = await executeSql(
        'SELECT id FROM user WHERE phone = ? AND id != ?',
        [phone, userId]
      );
      if (users.length > 0) {
        return res.status(400).json({ success: false, msg: '手机号已被注册！' });
      }
    }

    // 4. 构建更新 SQL
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
    params.push(userId);

    const sql = `UPDATE user SET ${updateFields.join(', ')} WHERE id = ?`;

    // 5. 执行更新
    await executeSql(sql, params);

    // 6. 查询更新后的用户信息
    const updatedUser = await executeSql(
      'SELECT id, username, nickname, phone, role, status FROM user WHERE id = ?',
      [userId]
    );

    // 7. 返回结果（统一字段名：userId 与前端一致）
    res.status(200).json({
      success: true,
      msg: '个人信息修改成功！',
      data: {
        ...updatedUser[0],
        userId: updatedUser[0].id // 补充 userId 字段，前端无需适配字段名
      }
    });
  } catch (err) {
    console.error('修改个人信息异常：', err);
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