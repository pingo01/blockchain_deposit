const jwt = require('jsonwebtoken');
//const { jwtSecret } = require('../config/config'); // 确保从正确路径读取密钥
require('dotenv').config(); // 加载 .env 环境变量（确保添加这行）

/**
 * 通用登录验证：所有模块四功能需先登录
 */
exports.verifyLogin = (req, res, next) => {
  try {
    console.log('====================================');
    console.log('【登录验证中间件】开始处理');
    console.log('使用的 JWT_SECRET：', process.env.JWT_SECRET); // 打印密钥（确认已加载）
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.error('❌ 未收到 Authorization 请求头');
      return res.status(401).json({ success: false, msg: '未登录，请先登录！' });
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      console.error('❌ Authorization 格式错误，应为 "Bearer <token>"');
      return res.status(401).json({ success: false, msg: '登录状态失效，请重新登录！' });
    }
    console.log('提取的 Token：', token);

    // 🔥 关键：用 process.env.JWT_SECRET 验证（和登录接口生成 Token 时的密钥一致）
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token 验证成功，解码用户信息：', decoded);
      req.user = decoded;
      next();
    } catch (jwtErr) {
      console.error('❌ Token 验证失败：', jwtErr.name, '→', jwtErr.message);
      const errMsg = jwtErr.name === 'TokenExpiredError' 
        ? '登录已过期，请重新登录！' 
        : '登录状态失效，请重新登录！';
      return res.status(401).json({ success: false, msg: errMsg });
    }
  } catch (err) {
    console.error('❌ 登录验证中间件异常：', err.message);
    return res.status(401).json({ success: false, msg: '登录状态失效，请重新登录！' });
  }
};

/**
 * 上传者角色验证：仅上传者可调用「按文件名查询」
 */
exports.verifyUploader = (req, res, next) => {
  try {
    console.log('====================================');
    console.log('【上传者角色验证中间件】开始处理');
    // 1. 打印当前用户角色（从 verifyLogin 中间件获取）
    console.log('当前用户角色：', req.user.role);
    console.log('需要的角色：uploader');

    // 2. 验证角色
    if (req.user.role !== 'uploader') {
      console.error('❌ 角色验证失败：当前角色是', req.user.role, '，仅 uploader 可访问');
      return res.status(403).json({ 
        success: false, 
        msg: '权限不足！仅上传者可按文件名查询' 
      });
    }

    console.log('✅ 角色验证通过');
    next(); // 角色通过，进入控制器处理查询
  } catch (err) {
    console.error('❌ 角色验证中间件异常：', err.message);
    return res.status(403).json({ success: false, msg: '权限验证失败，请重试！' });
  }
};

/**
 * 验证者角色验证：仅验证者可调用「文件验证」
 */
exports.verifyVerifier = (req, res, next) => {
  try {
    console.log('====================================');
    console.log('【验证者角色验证中间件】开始处理');
    console.log('当前用户角色：', req.user.role);
    console.log('需要的角色：verifier');

    if (req.user.role !== 'verifier') {
      console.error('❌ 角色验证失败：当前角色是', req.user.role, '，仅 verifier 可访问');
      return res.status(403).json({ 
        success: false, 
        msg: '权限不足！文件完整性验证功能仅限验证者使用' 
      });
    }

    console.log('✅ 角色验证通过');
    next();
  } catch (err) {
    console.error('❌ 角色验证中间件异常：', err.message);
    return res.status(403).json({ success: false, msg: '权限验证失败，请重试！' });
  }
};