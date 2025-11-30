const express = require('express');
const router = express.Router(); // 创建路由实例
const fileController = require('../controllers/fileController');
// 🔥 引入公共中间件（替代 fileController 里的重复中间件）
const { verifyLogin, verifyUploader } = require('../middleware/roleAuth');

// 文件上传接口：POST /api/file/upload
// 接口流程：验证登录 → 验证角色 → 接收文件 → 生成哈希
router.post(
  '/upload',
  verifyLogin,          // 中间件1：校验是否登录
  verifyUploader,   // 中间件2：校验是否为上传者
  fileController.upload.single('file'),// 中间件3：接收单个文件（前端传参名必须是 file）
  fileController.uploadFile            // 核心逻辑：上传+哈希生成
);


module.exports = router; // 导出路由，供入口文件注册