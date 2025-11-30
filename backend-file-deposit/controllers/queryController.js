const fs = require('fs');
const path = require('path');
const uploadConfig = require('../config/uploadConfig');
const blockchainService = require('../services/blockchainService');


// ---------------- 核心逻辑：文件列表查询（终极修复版）----------------
const getUserFileList = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const uploadDir = uploadConfig.uploadDir;

    if (!fs.existsSync(uploadDir)) {
      return res.status(200).json({ success: true, data: [], msg: '暂无上传文件' });
    }

    const files = fs.readdirSync(uploadDir,{ encoding: 'utf8' });
    if (files.length === 0) {
      return res.status(200).json({ success: true, data: [], msg: '暂无上传文件' });
    }

    const fileList = [];
    for (const storedFileName of files) {
      // 跳过 .meta 备份文件，只处理真实文件
      if (path.extname(storedFileName) === '.meta' || !storedFileName.startsWith(`${currentUserId}-`)) {
        continue;
      }

      // 提取文件信息
      const fileExt = path.extname(storedFileName);
      const fileHash = storedFileName
        .replace(`${currentUserId}-`, '')
        .replace(fileExt, '');
      const filePath = path.join(uploadDir, storedFileName);
      const fileStat = fs.statSync(filePath);

      // 🔥 关键：读取 .meta 文件中的真实存证ID
      const metaFilePath = path.join(uploadDir, `${storedFileName}.meta`);
      if (!fs.existsSync(metaFilePath)) {
        console.warn(`文件 ${storedFileName} 缺少.meta备份，跳过`);
        continue;
      }

    // 🔥 关键修复：添加 JSON 解析容错，避免单个文件解析失败影响整个列表
    let metaData;
    try {
      const metaContent = fs.readFileSync(metaFilePath, 'utf8');
      // 移除可能的 BOM 头和首尾空白字符
      const cleanMetaContent = metaContent
        .replace(/^\ufeff/, '') // 移除 UTF-8 BOM 头
        .trim(); // 移除首尾空格/换行
      metaData = JSON.parse(cleanMetaContent);
    } catch (parseErr) {
      console.error(`解析.meta文件失败（${metaFilePath}）：`, parseErr);
      continue; // 跳过解析失败的文件，不影响其他文件展示
    }
      const realDepositId = metaData.depositId; // 真实存证ID（如 20251127001）
      const originalFileName = metaData.fileName; // 本地备份的原文件名

      // 🔥 按真实存证ID查询区块链（现在能精准匹配！）
      let blockIndex = '未上链';
      let blockHash = '未上链';
      let prevBlockHash = '无'; // 默认值
      let depositTime = fileStat.birthtime.toISOString();

      const depositResult = blockchainService.queryDepositByDepositId(realDepositId);
      if (depositResult.success && depositResult.data.depositRecord) {
        // 从区块链获取区块信息和存证时间
        blockIndex = depositResult.data.blockInfo.index || '未上链';
        blockHash = depositResult.data.blockInfo.blockHash || '未上链';
        prevBlockHash = depositResult.data.blockInfo.prevBlockHash || '无';
        depositTime = depositResult.data.depositRecord.depositTime || depositTime;
      }

      // 构造文件列表项（前端显示真实存证ID和文件名）
      fileList.push({
        depositId: realDepositId, // 显示自动生成的存证ID（如 20251127001）
        fileName: originalFileName, // 显示真实原文件名
        fileType: fileExt.slice(1).toUpperCase(),
        fileSize: Math.round(fileStat.size / 1024),
        fileHash: fileHash, // 哈希值
        depositTime: depositTime, // 区块链存证时间
        blockIndex: blockIndex,
        blockHash: blockHash,
        prevBlockHash: prevBlockHash // 新增：返回前一区块哈希
      });
    }

    // 按存证时间正序排列（序号1、2、3...）
    fileList.sort((a, b) => new Date(a.depositTime) - new Date(b.depositTime));

    res.status(200).json({
      success: true,
      data: fileList,
      msg: `共查询到 ${fileList.length} 个文件`
    });

  } catch (err) {
    console.error('获取文件列表失败：', err);
    res.status(500).json({
      success: false,
      msg: '获取文件列表失败，请重试',
      error: err.message
    });
  }
};



// 按存证编号查询（修改后）
const queryByDepositId = (req, res) => {
  try {
    const { depositId } = req.query;
    const userId = req.user.userId;
    const username = req.user.username; // 直接读取当前登录用户名

    if (!depositId) {
      return res.status(400).json({ success: false, msg: '存证ID不能为空' });
    }

    const result = blockchainService.queryDepositByDepositId(depositId);
    if (result.success) {
      if (result.data.depositRecord.userId === userId) {
        return res.status(200).json({ success: true, data: result.data });
      } else {
        // 🔥 替换为用户名：优化无权限提示
        return res.status(403).json({ 
          success: false, 
          msg: `无权限查询他人存证记录（当前用户：${username}）` 
        });
      }
    } else {
      // 🔥 替换为用户名：未查询到记录（覆盖区块链服务的默认提示）
      return res.status(404).json({ 
        success: false, 
        msg: `未查询到用户${username}名下该存证编号的记录` 
      });
    }
  } catch (err) {
    console.error('按存证ID查询失败：', err);
    return res.status(500).json({ success: false, msg: '查询失败，请重试' });
  }
};

// 按文件名查询（添加时间戳日志）
const queryByFileName = (req, res) => {
  try {
    const { fileName } = req.query;
    const userId = req.user.userId;
    const username = req.user.username;

    if (!fileName) {
      return res.status(400).json({ success: false, msg: '文件名不能为空' });
    }

    const decodedFileName = decodeURIComponent(fileName);
    console.log('【按文件名查询】', { decodedFileName, userId, username });

    const result = blockchainService.queryDepositByFileNameAndUserId(decodedFileName, userId);
    console.log('区块链查询结果：', result.success ? `匹配到${result.data.length}条` : result.msg);

    if (result.success) {
      const formattedData = result.data.map(item => {
        // 🔥 核心：添加时间戳日志，打印原始值和类型
        console.log('【时间戳调试日志】', {
          存证ID: item.depositRecord.id,
          文件名: item.depositRecord.fileName,
          原始时间戳: item.depositRecord.timestamp, // 看后端存储的原始值
          时间戳类型: typeof item.depositRecord.timestamp, // 是 number 还是 string
          时间戳长度: String(item.depositRecord.timestamp).length // 看是10位（秒）还是13位（毫秒）
        });

        return {
          depositId: item.depositRecord.id,//存证ID
          fileName: item.depositRecord.fileName,//文件名
          fileType: item.depositRecord.fileName.split('.').pop().toUpperCase(),
          fileSize: item.depositRecord.fileSize || '未知',//文件大小（KB）
          fileHash: item.depositRecord.fileHash,//文件哈希值
          depositTime: item.depositRecord.depositTime, //存证时间
          blockIndex: item.blockInfo.index, // 区块索引/区块高度
          blockHash: item.blockInfo.blockHash || item.blockInfo.hash, // 区块哈希
          prevBlockHash: item.blockInfo.prevBlockHash || item.blockInfo.previousHash, // 前一区块哈希
          userId: item.depositRecord.userId
        };
      });

      return res.status(200).json({ 
        success: true, 
        data: formattedData,
        total: formattedData.length
      });
    } else {
      return res.status(404).json({ 
        success: false, 
        msg: `未查询到用户${username}名下匹配"${decodedFileName}"的存证记录` 
      });
    }
  } catch (err) {
    console.error('按文件名查询失败：', err);
    return res.status(500).json({ success: false, msg: '查询失败，请重试' });
  }
};

module.exports = {
  getUserFileList,
  queryByDepositId,
  queryByFileName
};