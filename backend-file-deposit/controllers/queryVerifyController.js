// backend-file-deposit/controllers/queryVerifyController.js
const blockchainService = require('../services/blockchainService');

/**
 * 1. 按存证编号查询（上传者/验证者均支持）
 */
exports.queryByDepositId = async (req, res) => {
  try {
    const { depositId } = req.query;
    // 参数校验
    if (!depositId) {
      return res.status(400).json({ success: false, msg: '存证编号不能为空！' });
    }
    // 调用服务层查询
    const result = blockchainService.queryDepositByDepositId(depositId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('按存证编号查询失败：', error);
    return res.status(500).json({ success: false, msg: '存证查询失败：' + error.message });
  }
};

/**
 * 2. 按文件名查询（仅上传者）
 */
exports.queryByFileName = async (req, res) => {
  try {
    const { fileName } = req.query;
    const userId = req.user.userId; // 从JWT获取当前用户ID
    // 参数校验
    if (!fileName) {
      return res.status(400).json({ success: false, msg: '文件名不能为空！' });
    }
    // 调用服务层查询（仅返回当前用户的记录）
    const result = blockchainService.queryDepositByFileNameAndUserId(fileName, userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('按文件名查询失败：', error);
    return res.status(500).json({ success: false, msg: '存证查询失败：' + error.message });
  }
};

/**
 * 3. 文件完整性验证（仅验证者）
 */
exports.verifyFile = async (req, res) => {
  try {
    const { fileHash } = req.query;
    // 参数校验
    if (!fileHash) {
      return res.status(400).json({ success: false, msg: '文件SHA256哈希值不能为空！' });
    }

    // 步骤1：验证区块链完整性（确保存证数据未被篡改）
    const chainVerifyResult = blockchainService.verifyChainIntegrity();
    if (!chainVerifyResult.isIntegrity) {
      return res.status(200).json({
        success: false,
        msg: `文件验证失败：${chainVerifyResult.msg}`,
        tampered: true, // 文件是否篡改
        chainTampered: true, // 区块链是否篡改
        tamperedBlockIndex: chainVerifyResult.tamperedBlockIndex
      });
    }

    // 步骤2：查询该文件的存证记录
    const depositQueryResult = blockchainService.queryDepositByFileHash(fileHash);
    if (!depositQueryResult.success) {
      return res.status(200).json({
        success: false,
        msg: '文件验证失败：未查询到该文件的存证记录',
        tampered: true,
        chainTampered: false
      });
    }

    // 步骤3：验证通过（区块链完整+存证记录存在）
    return res.status(200).json({
      success: true,
      msg: '文件未被篡改，存证记录有效！',
      tampered: false,
      chainTampered: false,
      data: {
        depositRecord: depositQueryResult.data.depositRecord,
        blockInfo: depositQueryResult.data.blockInfo
      }
    });
  } catch (error) {
    console.error('文件验证失败：', error);
    return res.status(500).json({ success: false, msg: '文件验证失败：' + error.message });
  }
};