// 引入依赖和配置
const multer = require('multer');
const sha256 = require('sha256-file');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const uploadConfig = require('../config/uploadConfig');

// ---------------- 中间件：验证用户是否登录（复用模块一的 JWT）----------------
const verifyLogin = (req, res, next) => {
  // 从请求头获取 Token（前端格式：Authorization: Bearer xxx）
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, msg: '未登录，请先登录！' });
  }
  try {
    // 验证 Token 有效性（密钥必须和模块一一致）
    const decoded = jwt.verify(token, uploadConfig.jwtSecret);
    // 解码后获取用户信息（如 userId、role），挂载到 req 上供后续使用
    req.user = decoded;
    next(); // 验证通过，进入下一个逻辑
  } catch (err) {
    return res.status(401).json({ success: false, msg: '登录状态失效，请重新登录！' });
  }
};

// ---------------- 中间件：验证用户角色是否为「上传者」----------------
const verifyUploaderRole = (req, res, next) => {
  // 模块一用户表需有 role 字段（uploader=上传者，verifier=验证者）
  if (req.user.role !== 'uploader') {
    return res.status(403).json({ success: false, msg: '权限不足！仅上传者可上传文件' });
  }
  next(); // 角色通过，进入文件上传逻辑
};

// ---------------- multer 配置：文件暂存规则 ----------------
const storage = multer.diskStorage({
  // 1. 暂存目录（确保目录存在，不存在则自动创建）
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadConfig.uploadDir)) {
      fs.mkdirSync(uploadConfig.uploadDir, { recursive: true }); // 递归创建目录
    }
    cb(null, uploadConfig.uploadDir); // 指向暂存目录
  },
  // 2. 暂存文件名（时间戳 + 原文件名，避免重复覆盖）
   // 👇 修改：服务器存储文件名 = 文件哈希值 + 扩展名（无中文，彻底避免乱码）
  filename: (req, file, cb) => {
    // 先获取文件扩展名（之前在 fileFilter 里挂载的 fileExt）
    const fileExt = file.fileExt;
    // 生成临时哈希值（用时间戳+随机数，避免上传中重名，后续会用真实文件哈希重命名）
    const tempHash = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const storedFileName = tempHash + fileExt;
    cb(null, storedFileName);
  }
});

// ---------------- multer 配置：文件校验（格式 + 大小）----------------
const fileFilter = (req, file, cb) => {

  // 获取文件后缀名（转小写，避免大小写问题，如 .PDF 和 .pdf）
  const fileExt = path.extname(file.originalname).toLowerCase();
  // 获取文件 MIME 类型（如 application/pdf）
  const fileMime = file.mimetype;

  // 1. 格式校验（后缀名 + MIME 双重校验，更严谨）
  if (!uploadConfig.allowedExtensions.includes(fileExt) || !uploadConfig.allowedTypes.includes(fileMime)) {
    const error = new Error(`文件格式不允许！仅支持：${uploadConfig.allowedExtensions.join(', ')}`);
    return cb(error, false); // 校验失败，拒绝接收文件
  }

  // 2. 大小校验
  if (file.size > uploadConfig.maxSize) {
    const error = new Error(`文件过大！最大支持 ${uploadConfig.maxSize / 1024 / 1024}MB`);
    return cb(error, false); // 校验失败，拒绝接收文件
  }

  // 👇 新增：把 fileExt 挂载到 file 对象上，供后续 uploadFile 函数使用
  file.fileExt = fileExt;
  cb(null, true); // 校验通过，接收文件
};

// ---------------- 初始化 multer 上传对象 ----------------
const upload = multer({
  storage: storage,    // 暂存规则
  fileFilter: fileFilter,  // 校验规则
  limits: { fileSize: uploadConfig.maxSize } // 大小限制（双重保险）
});

// ---------------- 核心逻辑：文件上传 + SHA256 哈希生成 ----------------
const uploadFile = (req, res) => {
  try {
    // multer 会把上传的文件信息存入 req.file
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, msg: '请选择要上传的文件！' });
    }

    // 生成文件 SHA256 哈希值（传入文件暂存路径）
    const fileSha256 = sha256(file.path);
    // 服务器最终存储文件名 = 哈希值 + 扩展名（无中文，无乱码）
    const finalStoredFileName = fileSha256 + file.fileExt;
    // 最终存储路径
    const finalStoredPath = path.join(uploadConfig.uploadDir, finalStoredFileName);


    // 重命名文件：从临时名改为「哈希值+扩展名」
    fs.renameSync(file.path, finalStoredPath);

        // 👇 必须加：对中文原文件名做 UTF-8 编码（和前端 decodeURIComponent 对应）
    const encodedFileName = encodeURIComponent(file.originalname);

    // 构造文件元数据（返回给前端，后续模块三存证需用到 sha256 和 userId）
     // 👇 修改：从 file 对象获取 fileExt（之前在 fileFilter 里挂载的）
    const fileMeta = {
      fileName: file.originalname,// 原文件名,原中文文件名（如「屏幕截图 2025-09-15 223137.png」，用户可见）
      storedFileName: finalStoredFileName, // 服务器存储名（哈希值+扩展名，无乱码）
      storedPath: finalStoredPath,         // 服务器存储路径
      fileSize: file.size,// 文件大小（字节）
      fileType: file.mimetype, // 文件类型（如 application/pdf）
      fileExt: file.fileExt, //file.originalname 文件后缀名（如 .pdf）现在有定义了！来自 fileFilter 挂载的属性
      sha256Hash: fileSha256,// 核心：文件唯一哈希值
      uploadTime: new Date().toISOString(),// 上传时间（ISO格式）
      userId: req.user.userId// 上传者 ID（关联模块一用户）
    };

    // 返回成功结果给前端
    res.status(200).json({
      success: true,
      msg: '文件上传成功，哈希值生成完成！',
      data: fileMeta
    });

   } catch (err) {
    // 捕获错误时，删除临时文件（避免垃圾文件）
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json({// 捕获校验错误或哈希生成错误，返回给前端
      success: false,
      msg: err.message || '文件上传失败！'
    });
  }
};

// 导出控制器方法（供路由使用）
module.exports = {
  verifyLogin,
  verifyUploaderRole,
  upload,
  uploadFile
};