// backend-file-deposit/routes/queryVerifyRoutes.js
const express = require('express');
const router = express.Router();
const queryVerifyController = require('../controllers/queryVerifyController');
const { verifyLogin, verifyUploader, verifyVerifier } = require('../middleware/roleAuth');

// 1. 按存证编号查询（需登录，双角色支持）
router.get('/query/deposit-id', verifyLogin, queryVerifyController.queryByDepositId);

// 2. 按文件名查询（需登录+上传者角色）
router.get('/query/file-name', verifyLogin, verifyUploader, queryVerifyController.queryByFileName);

// 3. 文件完整性验证（需登录+验证者角色）
router.get('/verify/file', verifyLogin, verifyVerifier, queryVerifyController.verifyFile);

module.exports = router;