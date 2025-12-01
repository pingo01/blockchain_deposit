const express = require('express');
const router = express.Router();
const queryController = require('../controllers/queryController'); // 新增查询专属控制器（后续需创建）
const { verifyLogin, verifyUploader } = require('../middleware/roleAuth');

// 1. 我的文件列表（需登录 + 上传者角色）- 新增路由
router.get(
  '/user-files', // 路由路径：/api/query/user-files（挂载后）
  verifyLogin,   // 校验登录
  verifyUploader,// 校验上传者角色
  queryController.getUserFileList // 迁移后的方法（在 queryController 中）
);
// 2. 按存证编号查询（需登录 + 上传者角色）
router.get(
  '/deposit-id', // 路径简化：原 /query/deposit-id → 现在路由挂载后是 /api/query/deposit-id
  verifyLogin,
  verifyUploader,
  queryController.queryFileById
);

// 3. 按文件名查询（需登录 + 上传者角色）
router.get(
  '/file-name', // 路径简化：原 /query/file-name → 现在路由挂载后是 /api/query/file-name
  verifyLogin,
  verifyUploader,
  queryController.queryByFileName
);

module.exports = router;