// backend-file-deposit/middleware/roleAuth.js
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/config'); // 从配置文件读取JWT密钥

/**
 * 通用登录验证：所有模块四功能需先登录
 */
exports.verifyLogin = (req, res, next) => {
  // 从请求头获取Token（格式：Bearer xxx）
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, msg: '未登录，请先登录！' });
  }
  try {
    // 验证Token有效性，解析用户信息（userId、role）
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded; // 挂载用户信息到req，供后续使用
    next();
  } catch (err) {
    return res.status(401).json({ success: false, msg: '登录状态失效，请重新登录！' });
  }
};

/**
 * 上传者角色验证：仅上传者可调用「按文件名查询」
 */
exports.verifyUploader = (req, res, next) => {
  if (req.user.role !== 'uploader') {
    return res.status(403).json({ 
      success: false, 
      msg: '权限不足！仅上传者可按文件名查询' 
    });
  }
  next();
};

/**
 * 验证者角色验证：仅验证者可调用「文件验证」
 */
exports.verifyVerifier = (req, res, next) => {
  if (req.user.role !== 'verifier') {
    return res.status(403).json({ 
      success: false, 
      msg: '权限不足！文件完整性验证功能仅限验证者使用' 
    });
  }
  next();
};