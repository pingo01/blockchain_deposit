// uploadConfig.js（修改 uploadDir 为绝对路径）
const path = require('path'); // 引入 path 模块

module.exports = {
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'text/plain'
  ],
  allowedExtensions: ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.txt'],
  maxSize: 10 * 1024 * 1024,
  // 🔥 关键修复：使用绝对路径（__dirname 是当前文件所在目录，拼接上级目录的 uploads）
  uploadDir: path.join(__dirname, '../uploads/'), 
  jwtSecret: 'file_deposit_secret_2025'
};