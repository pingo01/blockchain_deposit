// backend-file-deposit/models/DepositRecord.js
class DepositRecord {
  constructor(fileMeta, userId) {
    // 存证编号：年月日+自增序号（如 20251127001）
    this.id = this.generateDepositId();
    this.fileHash = fileMeta.sha256Hash; // 核心：文件哈希值（不可篡改依据）
    this.userId = userId; // 上传者ID（关联模块一用户）
    this.fileName = fileMeta.fileName; // 原文件名
    this.fileSize = fileMeta.fileSize; // 文件大小
    this.fileType = fileMeta.fileType; // 文件类型
    this.depositTime = new Date().toISOString(); // 存证时间（ISO格式）
  }

  // 生成唯一存证编号
  generateDepositId() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    // 从区块链服务获取自增序号（后续在service中实现）
    const seq = global.depositSeq || 1;
    global.depositSeq = seq + 1;
    return `${date}${seq.toString().padStart(3, '0')}`;
  }
}

module.exports = DepositRecord;