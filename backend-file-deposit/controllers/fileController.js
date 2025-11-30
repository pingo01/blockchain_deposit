// 引入依赖和配置
const multer = require('multer');
const sha256 = require('sha256-file');
const path = require('path');
const fs = require('fs');
const uploadConfig = require('../config/uploadConfig');
const blockchainService = require('../services/blockchainService');

console.log('上传目录绝对路径：', uploadConfig.uploadDir); // 启动后端时查看该日志

// ---------------- multer 配置（保持原有稳定逻辑）----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadConfig.uploadDir)) {
      fs.mkdirSync(uploadConfig.uploadDir, { recursive: true });
    }
    cb(null, uploadConfig.uploadDir);
  },
  filename: (req, file, cb) => {
    const fileExt = file.fileExt;
    const tempHash = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const storedFileName = tempHash + fileExt;
    cb(null, storedFileName);
  }
});

const fileFilter = (req, file, cb) => {
  // 关键修复：用 UTF-8 解码后的 originalNameUtf8 提取扩展名
  const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
  const fileExt = path.extname(originalName).toLowerCase(); // 从解码后的文件名取扩展名
  const fileMime = file.mimetype;

  if (!uploadConfig.allowedExtensions.includes(fileExt) || !uploadConfig.allowedTypes.includes(fileMime)) {
    const error = new Error(`文件格式不允许！仅支持：${uploadConfig.allowedExtensions.join(', ')}`);
    return cb(error, false);
  }

  if (file.size > uploadConfig.maxSize) {
    const error = new Error(`文件过大！最大支持 ${uploadConfig.maxSize / 1024 / 1024}MB`);
    return cb(error, false);
  }

  file.fileExt = fileExt;
  file.originalNameUtf8 = originalName; // 存储UTF-8编码的中文文件名
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: uploadConfig.maxSize } });

// ---------------- 核心逻辑：文件上传（终极修复版）----------------
const uploadFile = async (req, res) => {
  try {
    console.log('=== 开始处理文件上传 ===');
    console.log('请求文件：', req.file ? req.file.originalname : '无文件');
    console.log('用户ID：', req.user.userId);

    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, msg: '请选择要上传的文件！' });
    }
    // 关键修改2：使用UTF-8编码的原文件名（替代file.originalname）
    const originalFileName = file.originalNameUtf8 || file.originalname;
    console.log('请求文件（UTF-8）：', originalFileName);
    console.log('用户ID：', req.user.userId);

    // 1. 确保上传目录存在（Windows路径兼容）
    if (!fs.existsSync(uploadConfig.uploadDir)) {
      console.log(`上传目录不存在，创建：${uploadConfig.uploadDir}`);
      fs.mkdirSync(uploadConfig.uploadDir, { recursive: true });
    }
    console.log('上传目录存在：', fs.existsSync(uploadConfig.uploadDir));

    // 2. 生成文件哈希（关键步骤，打印日志）
    console.log('临时文件路径：', file.path);
    const fileSha256 = sha256(file.path);
    console.log('生成的哈希值：', fileSha256);
    if (!fileSha256) {
      throw new Error('文件哈希值生成失败！');
    }

    // 3. 构造存储文件名和路径（Windows路径兼容）
    const userId = req.user.userId;
    const fileExt = path.extname(originalFileName).toLowerCase(); // 统一小写扩展名
    const finalStoredFileName = `${userId}-${fileSha256}${fileExt}`;
    const finalStoredPath = path.join(uploadConfig.uploadDir, finalStoredFileName);
    console.log('最终存储路径：', finalStoredPath);

    // 4. 重命名文件（Windows下fs.renameSync可能因文件占用失败，改用fs.copyFileSync+fs.unlinkSync）
    console.log('开始复制文件...');
    fs.copyFileSync(file.path, finalStoredPath); // 复制临时文件到目标路径
    fs.unlinkSync(file.path); // 删除临时文件
    console.log('文件复制删除成功');



    const generateBlockchainSeq = () => {

      //  新增：打印调用日志+调用栈，定位重复调用来源
  console.log('====================================');
  console.log('【序号生成函数被调用】');
  console.log('调用时间：', new Date().toLocaleString());
  console.log('调用栈：');
  console.trace(); // 打印调用栈，看谁在重复调用
  console.log('====================================');

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // 20251127
   // 关键：序号文件按日期命名（每天一个独立序号文件）
  const seqPath = path.join(__dirname,  `../data/seq_${date}.json`); // 统一序号存储文件
  let seq = 1;

  // 读取已有序号（确保连续+1）
  if (fs.existsSync(seqPath)) {
    try {
      const seqData = JSON.parse(fs.readFileSync(seqPath, 'utf8'));
      seq = seqData.seq + 1; // 每次上传+1，无跳变
      console.log(`当前序号：${seqData.seq} → 新序号：${seq}`); // 新增日志
    } catch (err) {
      console.error('读取序号文件失败，重置为1：', err);
      seq = 1;
    }
  }
  //保存当天的序号
  // 保存新序号（覆盖原文件，确保下次+1）
  fs.writeFileSync(seqPath, JSON.stringify({ seq }), 'utf8');
  const formalSeq = seq.toString().padStart(3, '0'); // 补零为3位
  const depositId = `${date}${formalSeq}`;
  console.log(`生成存证ID：${depositId}`); // 新增日志
  return depositId;
  //return `${date}${formalSeq}`; // 生成规范存证ID（如 20251127012）
};

// 生成统一存证ID（供区块链存证使用）
const formalDepositId = generateBlockchainSeq();
console.log('生成区块链存证ID：', formalDepositId);

    // 5. 构造元数据
    const fileMeta = {
      depositId: formalDepositId, // 把统一ID传递给区块链
      fileName: originalFileName,
      sha256Hash: fileSha256,
      fileSize: file.size,
      fileType: file.mimetype,
      fileExt: fileExt,
      uploadTime: new Date().toISOString()
    };
    console.log('元数据：', fileMeta);

    // fileController.js 的 uploadFile 方法中，区块链存证部分修改
// 6. 区块链存证（增加重试逻辑，减少临时ID）
let realDepositId = '';
let retryCount = 0;
const maxRetry = 2; // 最多重试2次
let blockchainSuccess = false;

while (retryCount < maxRetry && !blockchainSuccess) {
  try {
    // 确保 fileMeta 包含所有必要字段（depositId、fileName、sha256Hash等）
    console.log('传递给区块链的 fileMeta：', JSON.stringify(fileMeta, null, 2));
    console.log('传递给区块链的 userId：', userId);
    
    const blockchainResult =await blockchainService.depositFile(fileMeta, userId);
    
    if (blockchainResult.success) {
      realDepositId = formalDepositId; 
      console.log('区块链存证成功，存证ID：', realDepositId);
      blockchainSuccess = true;
    } else {
      throw new Error('区块链存证失败：' + blockchainResult.msg);
    }
  } catch (blockchainErr) {
    retryCount++;
    console.error(`区块链存证异常（第${retryCount}次重试）：`, blockchainErr);
    if (retryCount >= maxRetry) {
      // 即使区块链存证失败，也使用统一ID（而非 TEMP），确保格式一致
      realDepositId = formalDepositId;
      console.log('区块链存证失败，使用本地统一存证ID：', realDepositId)
    }
  }
}

    // 7. 创建.meta文件（Windows路径兼容）
    const metaFilePath = path.join(uploadConfig.uploadDir, `${finalStoredFileName}.meta`);
    try {
      // 关键修改3：移除 \ufeff BOM 头，纯 UTF-8 存储
      const metaContent = JSON.stringify({
        depositId: realDepositId,
        fileName: originalFileName, // UTF-8编码的中文文件名
        fileHash: fileSha256,
        uploadTime: new Date().toISOString()
      }, null, 2);
      fs.writeFileSync(metaFilePath, metaContent, 'utf8');
      console.log('.meta文件创建成功（纯UTF-8）：', metaFilePath);
    } catch (metaErr) {
      console.error('.meta文件创建失败：', metaErr);
    }

    // 8. 返回成功结果
    res.status(200).json({
    success: true,
    msg: '文件上传成功！',
    data: {
      fileName: originalFileName,
      fileHash: fileSha256, // 必须返回 fileHash 字段（前端依赖这个字段）
      fileSize: file.size,
      fileType: file.mimetype,
      fileExt: fileExt,
      uploadTime: new Date().toISOString(),
      userId: userId, // 必须返回 userId，供存证时使用
      depositId: realDepositId // 后端直接返回统一ID
    }
  });

  } 
  catch (err) {
    // 打印完整错误信息（包括堆栈，精准定位）
    console.error('=== 上传失败，完整错误信息 ===');
    console.error(err.stack);

    // 新增：序号回滚逻辑（核心修复）
  const seqPath = path.join(__dirname, '../data/seq.json');
  if (fs.existsSync(seqPath)) {
    try {
      const seqData = JSON.parse(fs.readFileSync(seqPath, 'utf8'));
      // 上传失败，序号减回原数值（抵消之前的+1）
      fs.writeFileSync(seqPath, JSON.stringify({ seq: seqData.seq - 1 }), 'utf8');
      console.log('上传失败，序号回滚：', seqData.seq - 1);
    } catch (rollbackErr) {
      console.error('序号回滚失败：', rollbackErr);
    }
  }

    // 清理临时文件
    if (req.file) {
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
          console.log('已删除临时文件：', req.file.path);
        }
      } catch (unlinkErr) {
        console.error('删除临时文件失败：', unlinkErr);
      }
    }

    res.status(500).json({
      success: false,
      msg: '文件上传失败：' + err.message
    });
  }
};

module.exports = {
  upload, // multer 上传对象
  uploadFile // 核心上传逻辑
};
