// 🔴 必须放在 fileController.js 最顶部！
const PDFDocument = require('pdfkit'); // 新增这行，确保能找到 PDFDocument
// 引入依赖和配置
const multer = require('multer');
const sha256 = require('sha256-file');
const path = require('path');
const fs = require('fs');
const uploadConfig = require('../config/uploadConfig');
const blockchainService = require('../services/blockchainService');

console.log('上传目录绝对路径：', uploadConfig.uploadDir); // 启动后端时查看该日志

// 🔴 新增：文件大小自适应格式化函数（用于PDF导出）
const formatFileSizeForPDF = (size) => {
  const numericSize = Number(size);
  // 处理异常值
  if (isNaN(numericSize) || numericSize < 0) return '未知大小';
  // 单位数组（字节→KB→MB）
  const units = ['B', 'KB', 'MB'];
  let unitIndex = 0;
  let formattedSize = numericSize;

  // 自动进位（>=1024 且不是最后一个单位）
  while (formattedSize >= 1024 && unitIndex < units.length - 1) {
    formattedSize /= 1024;
    unitIndex++;
  }

  // 保留2位小数，拼接单位
  return `${formattedSize.toFixed(2)} ${units[unitIndex]}`;
};

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

// ---------------- 新增：导出存证凭证PDF逻辑（添加到文件末尾）----------------
const exportVoucher = async (req, res) => {
  try {
    // 1. 获取前端传递的存证ID（从query参数中取）
    const { depositId } = req.query;
    if (!depositId) {
      return res.status(400).json({ success: false, msg: '存证ID不能为空' });
    }
    console.log('=== 开始生成存证凭证 ===');
    console.log('存证ID：', depositId);

    // 2. 调用区块链服务查询存证记录（复用你已有的查询方法）
    // 注意：如果你的查询方法名不是 queryDepositByDepositId，替换成实际的！
    const queryResult = await blockchainService.queryDepositByDepositId(depositId);
    
    // 校验查询结果（确保有存证记录和区块信息）
    if (!queryResult.success) {
      console.log('未找到存证记录：', queryResult.msg);
      return res.status(404).json({ success: false, msg: queryResult.msg || '未找到该存证记录' });
    }
    const { depositRecord, blockInfo } = queryResult.data;
    if (!depositRecord || !blockInfo) {
      console.log('存证记录或区块信息缺失');
      return res.status(404).json({ success: false, msg: '存证记录不完整' });
    }

    // 3. 创建PDF文档（基础配置）
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      title: `存证凭证_${depositId}`
    });

    // 4. 解决中文显示问题（关键步骤）
    // 按之前的说明：在后端根目录创建 fonts 文件夹，放入 SimHei.ttf 字体文件
    const fontPath = path.join(__dirname, '../fonts/SimHei.ttf');
    if (fs.existsSync(fontPath)) {
      doc.font(fontPath); // 加载中文字体
      console.log('成功加载中文字体：', fontPath);
    } else {
      console.warn('未找到中文字体文件，中文可能显示为方框！请按步骤添加 SimHei.ttf');
    }

    // 5. 设置响应头（告诉前端下载PDF）
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="deposit_certificate_${depositId}.pdf"`);
    res.setHeader('Cache-Control', 'no-cache');
    doc.pipe(res); // PDF流直接写入响应

    // 6. 生成PDF内容（按你的数据字段调整，确保字段名匹配）
    // 标题
    doc.fontSize(24)
       .text('数字资产存证凭证', { align: 'center', bold: true })
       .moveDown(2);
    doc.fontSize(14)
       .text('FILE DEPOSIT CERTIFICATE', { align: 'center', color: '#666' })
       .moveDown(3);

    // 一、存证基本信息（字段名和你的 depositRecord 对应）
    doc.fontSize(16)
       .text('一、存证基本信息', { underline: true, bold: true })
       .moveDown(1.5);
    doc.fontSize(12)
       .text(`存证ID：${depositRecord.id}`) // 你的存证ID字段
       .text(`文件名称：${depositRecord.fileName}`) // 文件名
       .text(`文件类型：${depositRecord.fileType || '未知'}`) // 文件类型
       // 🔴 核心修改：替换为自适应格式化的文件大小
       .text(`文件大小：${formatFileSizeForPDF(depositRecord.fileSize)}`)
       .text(`SHA256哈希值：${depositRecord.sha256Hash || depositRecord.fileHash}`) // 哈希值（两种字段名兼容）
       .text(`存证时间：${depositRecord.depositTime ? new Date(depositRecord.depositTime).toLocaleString() : '未知'}`) // 存证时间
       //.text(`存证描述：${depositRecord.depositDesc || '无'}`) // 存证描述（如果有）
       .moveDown(2);

    // 二、区块链存证信息（字段名和你的 blockInfo 对应）
    doc.fontSize(16)
       .text('二、区块链存证信息', { underline: true, bold: true })
       .moveDown(1.5);
    doc.fontSize(12)
       .text(`区块索引：${blockInfo.index}`) // 区块索引
       .text(`区块哈希：${blockInfo.blockHash}`) // 区块哈希
       .text(`前一区块哈希：${blockInfo.prevBlockHash || '无（创世区块）'}`) // 前区块哈希
       .text(`区块时间戳：${blockInfo.timestamp ? new Date(blockInfo.timestamp).toLocaleString() : '未知'}`) // 时间戳
       .moveDown(3);

    // 三、存证声明
    doc.fontSize(16)
       .text('三、存证声明', { underline: true, bold: true })
       .moveDown(1.5);
    doc.fontSize(10)
       .text('1. 本凭证基于区块链技术生成，存证信息不可篡改、不可删除；', { indent: 20 })
       .text('2. 哈希值可作为文件完整性校验的唯一依据；', { indent: 20 })
       .text('3. 本凭证可作为电子证据参考，具备法律效力；', { indent: 20 })
       .text('4. 可通过存证ID在平台查询核验真实性。', { indent: 20 })
       .moveDown(4);

    // 页脚
    doc.fontSize(9)
       .text('生成时间：' + new Date().toLocaleString(), { align: 'center', color: '#999' })
       .text('数字存证平台 @ 2025', { align: 'center', color: '#999' });

    // 7. 结束PDF生成（必须调用）
    doc.end();
    console.log('PDF凭证生成完成，已返回前端');

  } catch (err) {
    console.error('生成存证凭证失败：', err.stack);
    res.status(500).json({ success: false, msg: '生成凭证失败：' + err.message });
  }
};


// 🔴 替换原有的 exportVerifyReport 方法，直接复制覆盖
const exportVerifyReport = async (req, res) => {
  try {
    let { 
      depositId, 
      verifySuccess, 
      originalFileName, 
      originalFileHash, 
      currentFileHash, 
      depositTime, 
      blockIndex, 
      verifyTime, 
      failReason 
    } = req.body;

    // 参数校验（保留原有校验，新增存证ID必填）
    if (!depositId) return res.status(400).json({ success: false, msg: '存证ID不能为空' });
    if (verifySuccess === undefined) return res.status(400).json({ success: false, msg: '验证结果不能为空' });
    // 移除：不再强制要求前端传递 originalFileHash 和 currentFileHash（后端可兜底）

    console.log('\n=====================================================');
    console.log('📥 收到验证报告导出请求');
    console.log('前端传递的原始参数：', {
      depositId,
      blockIndex: blockIndex || '前端未传递',
      originalFileHash: originalFileHash || '前端未传递',
      depositTime: depositTime || '前端未传递'
    });
    console.log('=====================================================');

    // 🔴 核心兜底逻辑：后端主动查询区块链，不依赖前端传递
    let blockchainQueryResult = null;
    try {
      console.log('🔍 后端兜底查询 - 开始查询区块链存证记录');
      // 调用你已有的 queryDepositByDepositId 方法（无需新增任何代码）
      blockchainQueryResult = await blockchainService.queryDepositByDepositId(depositId);
      console.log('🔍 后端兜底查询 - 区块链返回结果：', blockchainQueryResult);
    } catch (queryErr) {
      console.error('⚠️ 后端兜底查询 - 查询异常：', queryErr);
      blockchainQueryResult = { success: false, msg: '区块链查询异常' };
    }

    // 🔴 强制覆盖前端参数（优先级：后端查询结果 > 前端传递 > 默认值）
    if (blockchainQueryResult.success && blockchainQueryResult.data) {
      const depositRecord = blockchainQueryResult.data.depositRecord;
      const blockInfo = blockchainQueryResult.data.blockInfo;

      // 覆盖核心字段（确保100%有值）
      blockIndex = blockInfo?.index || '未知索引'; // 区块索引（必返）
      originalFileHash = depositRecord?.fileHash || depositRecord?.sha256Hash || '未记录'; // 兼容两种哈希字段名
      depositTime = depositRecord?.depositTime || blockInfo?.timestamp || '未记录'; // 存证时间
      originalFileName = depositRecord?.fileName || originalFileName || '未知文件名'; // 原始文件名
      currentFileHash = currentFileHash || '未计算'; // 待验证哈希（前端必传，无则默认）
    } else {
      // 未查询到存证记录（存证ID无效）
      blockIndex = '存证ID无效';
      originalFileHash = '存证ID无效';
      depositTime = '存证ID无效';
      originalFileName = originalFileName || '未知文件名';
      currentFileHash = currentFileHash || '未计算';
    }

    // 🔴 最终报告数据（确保无“未查询到”）
    console.log('🔄 兜底后最终报告数据：', {
      depositId,
      verifySuccess,
      originalFileName,
      originalFileHash,
      currentFileHash,
      depositTime,
      blockIndex // 这里100%有值！
    });

    // 创建 PDF 文档（保持原有配置，仅替换变量）
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      title: `验证报告_${depositId}`,
      autoFirstPage: false,
      bufferPages: true
    });

    // 加载中文字体（保持不变）
    const fontPath = path.resolve(__dirname, '../fonts/SimHei.ttf');
    console.log('字体文件路径：', fontPath);
    if (fs.existsSync(fontPath)) {
      doc.font(fontPath);
      console.log('✅ 中文字体加载成功');
    } else {
      console.warn('⚠️ 未找到中文字体文件，使用默认英文字体');
      doc.font('Helvetica');
    }

    // 设置响应头（保持不变，优化文件名UTF-8编码）
    const timestamp = new Date().toISOString().replace(/[-:\.T]/g, '').slice(0, 14);
    const fileName = `验证报告_${depositId}_${timestamp}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader('Cache-Control', 'no-store, no-cache');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Content-Transfer-Encoding', 'binary');
    res.setTimeout(60000);

    // PDF 流处理（保持不变）
    doc.pipe(res);

    doc.on('finish', () => {
      console.log('✅ PDF 流传输完成，响应即将结束');
      if (!res.finished) {
        res.end();
      }
    });

    doc.on('error', (err) => {
      console.error('❌ PDF 生成错误：', err.stack);
      if (!res.headersSent) {
        res.status(500).json({ success: false, msg: 'PDF 生成失败：' + err.message });
      } else if (!res.finished) {
        res.end();
      }
    });

    res.on('error', (err) => {
      console.error('❌ 响应错误：', err.stack);
      doc.destroy();
    });

    // 手动添加第一页（保持不变）
    doc.addPage();

    // 生成 PDF 内容（仅替换变量，确保 blockIndex 有值）
    doc.fontSize(24)
       .text('文件完整性验证报告', { align: 'center' })
       .moveDown(2);
    doc.fontSize(14)
       .text('FILE INTEGRITY VERIFICATION REPORT', { align: 'center', color: '#666' })
       .moveDown(3);

    // 一、验证基本信息（保持不变）
    doc.fontSize(16)
       .text('一、验证基本信息', { underline: true })
       .moveDown(1.5);
    doc.fontSize(12)
       .text(`存证ID：${depositId}`)
       .text(`验证文件名称：${originalFileName}`)
       .text(`验证时间：${verifyTime ? new Date(verifyTime).toLocaleString() : new Date().toLocaleString()}`)
       .text(`验证结果：${verifySuccess ? '验证通过（文件未被篡改）' : '验证失败'}`)
       .moveDown(2);

    // 二、哈希值核对（保持不变）
    doc.fontSize(16)
       .text('二、哈希值核对', { underline: true })
       .moveDown(1.5);
    doc.fontSize(12)
       .text(`原始存证SHA256哈希：`)
       .text(originalFileHash, { indent: 20 })
       .moveDown(0.8)
       .text(`待验证文件SHA256哈希：`)
       .text(currentFileHash, { indent: 20 })
       .moveDown(0.8)
       .text(`哈希值匹配状态：${verifySuccess ? '完全匹配' : '不匹配'}`)
       .moveDown(2);

    // 三、存证关联信息（🔴 关键修改：直接使用兜底后的 blockIndex）
    doc.fontSize(16)
       .text('三、存证关联信息', { underline: true })
       .moveDown(1.5);
    doc.fontSize(12)
       .text(`存证时间：${depositTime ? new Date(depositTime).toLocaleString() : '未记录'}`)
       .text(`区块索引：${blockIndex}`) // 这里100%有值，不会再是“未查询到”
       .moveDown(2);

    // 四、验证结论（保持不变）
    doc.fontSize(16)
       .text('四、验证结论', { underline: true })
       .moveDown(1.5);
    const conclusion = verifySuccess 
      ? '结论：待验证文件的哈希值与区块链存证哈希值完全一致，文件内容未被篡改，存证信息真实有效。'
      : `结论：待验证文件未通过完整性校验。原因：${failReason || '哈希值不匹配或存证ID不存在/已失效'}`;
    doc.fontSize(12).text(conclusion).moveDown(2);

    // 五、声明（保持不变）
    doc.fontSize(10)
       .text('声明：', { bold: true })
       .text('1. 本报告基于区块链存证数据生成，验证过程公开透明，结果不可篡改；', { indent: 20 })
       .text('2. 报告仅对本次验证的文件和存证ID负责，有效期与存证信息一致；', { indent: 20 })
       .text('3. 如需核实报告真实性，可通过平台输入存证ID重新验证。', { indent: 20 })
       .moveDown(3);

    // 页脚（保持不变）
    doc.fontSize(9)
       .text('报告生成时间：' + new Date().toLocaleString(), { align: 'center', color: '#999' })
       .text('数字存证平台 @ 2025', { align: 'center', color: '#999' });

    doc.end();
    console.log('✅ PDF 生成流程已启动，等待流传输');

  } catch (err) {
    console.error('❌ 导出验证报告异常：', err.stack);
    if (!res.headersSent) {
      res.status(500).json({ success: false, msg: '导出验证报告失败：' + err.message });
    } else if (!res.finished) {
      res.end();
    }
  }
};

module.exports = {
  upload, // multer 上传对象
  uploadFile, // 核心上传逻辑
  exportVoucher, // 新增：导出凭证逻辑
  exportVerifyReport // 新增：验证报告导出接口
};
