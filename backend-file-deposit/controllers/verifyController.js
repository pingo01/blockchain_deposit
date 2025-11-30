const blockchainService = require('../services/blockchainService');

// 文件完整性验证
exports.verifyFile = (req, res) => {
  try {
    const { fileHash } = req.query; // 接收文件哈希值（验证文件完整性需对比哈希）

    if (!fileHash) {
      return res.status(400).json({ success: false, msg: '文件哈希值不能为空' });
    }

    // 调用区块链服务验证文件完整性
    const result = blockchainService.verifyFileIntegrity(fileHash);
    if (result.success) {
      return res.status(200).json({ success: true, msg: result.msg, data: result.data });
    } else {
      return res.status(400).json({ success: false, msg: result.msg, tampered: result.tampered });
    }
  } catch (err) {
    console.error('文件完整性验证失败：', err);
    return res.status(500).json({ success: false, msg: '验证失败，请重试' });
  }
};