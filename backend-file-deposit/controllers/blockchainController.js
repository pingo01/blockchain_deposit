// backend-file-deposit/controllers/blockchainController.js
const blockchainService = require('../services/blockchainService');
const { verifyLogin } = require('./fileController'); // 复用模块一的登录验证中间件

// 1. 文件哈希存证上链（对接模块二上传成功后调用）
exports.depositFile = async (req, res) => {
  try {
    const { fileMeta } = req.body; // 模块二返回的文件元数据（含sha256Hash）
    const userId = req.user.userId; // 登录用户ID（从JWT解码获取）

    if (!fileMeta || !fileMeta.sha256Hash) {
      return res.status(400).json({ success: false, msg: '文件哈希值不能为空！' });
    }

    const result = await blockchainService.depositFile(fileMeta, userId);
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('存证上链控制器错误：', error);
    return res.status(500).json({ success: false, msg: '服务器错误，存证上链失败' });
  }
};

// 2. 验证区块链完整性
exports.verifyChain = async (req, res) => {
  try {
    const result = blockchainService.verifyChainIntegrity();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, msg: '区块链完整性验证失败' });
  }
};

// 3. 根据文件哈希查询存证记录
exports.queryByFileHash = async (req, res) => {
  try {
    const { fileHash } = req.query;
    if (!fileHash) {
      return res.status(400).json({ success: false, msg: '文件哈希值不能为空！' });
    }
    const result = blockchainService.queryDepositByFileHash(fileHash);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, msg: '存证查询失败' });
  }
};

// 4. 根据存证编号查询存证记录
exports.queryByDepositId = async (req, res) => {
  try {
    const { depositId } = req.query;
    if (!depositId) {
      return res.status(400).json({ success: false, msg: '存证编号不能为空！' });
    }
    const result = blockchainService.queryDepositByDepositId(depositId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, msg: '存证查询失败' });
  }
};

// 5. 验证文件完整性（检测是否被篡改）
exports.verifyFile = async (req, res) => {
  try {
    const { fileHash } = req.query;
    if (!fileHash) {
      return res.status(400).json({ success: false, msg: '文件哈希值不能为空！' });
    }
    const result = blockchainService.verifyFileIntegrity(fileHash);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, msg: '文件完整性验证失败' });
  }
};