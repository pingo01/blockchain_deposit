const express = require('express');
const router = express.Router();
const verifyController = require('../controllers/verifyController'); // 新增验证专属控制器（后续需创建）
const { verifyLogin, verifyVerifier } = require('../middleware/roleAuth');

// 文件完整性验证（需登录 + 验证者角色）
router.get(
  '/file', // 路径简化：原 /verify/file → 现在路由挂载后是 /api/verify/file
  verifyLogin,
  verifyVerifier,
  verifyController.verifyFile
);

module.exports = router;