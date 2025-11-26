// 文件上传规则配置（课程设计常用格式，可按需调整）
module.exports = {
  // 允许的文件格式（电子合同/版权证书常用类型）
  allowedTypes: [
    'application/pdf',  // PDF
    'application/msword',  // DOC
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  // DOCX
    'image/png',  // PNG
    'image/jpeg',  // JPG/JPEG
    'text/plain'  // TXT
  ],
  // 允许的文件后缀名（双重校验，避免格式绕过）
  allowedExtensions: ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.txt'],
  maxSize: 10 * 1024 * 1024,  // 最大文件大小：10MB（单位：字节）
  uploadDir: './uploads/',    // 文件暂存目录（相对路径，对应项目根目录下的 uploads 文件夹）
  jwtSecret: 'file_deposit_secret_2025'  // JWT 密钥（必须和模块一登录/注册时一致！）
};