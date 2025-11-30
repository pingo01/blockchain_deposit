// backend-file-deposit/routes/blockchainRoutes.js
const express = require('express');
const router = express.Router();
const blockchainController = require('../controllers/blockchainController');
const { verifyLogin } = require('../middleware/roleAuth');

// 1. 文件哈希存证上链（需要登录）
router.post('/deposit', verifyLogin, blockchainController.depositFile);

// 2. 验证区块链完整性（公开接口）
router.get('/verify-chain', blockchainController.verifyChain);

// 3. 根据文件哈希查询存证（公开接口）
router.get('/query/by-hash', blockchainController.queryByFileHash);

// 4. 根据存证编号查询存证（公开接口）
router.get('/query/by-deposit-id', blockchainController.queryByDepositId);

// 5. 验证文件完整性（公开接口）
router.get('/verify-file', blockchainController.verifyFile);

module.exports = router;