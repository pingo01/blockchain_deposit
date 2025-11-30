const fs = require('fs');
const path = require('path'); // 🔥 新增：引入 path 模块（之前漏掉了）

class DepositRecord {
  constructor(fileMeta, userId) {
    this.id = fileMeta.depositId;// 生成 20251127001 格式的存证ID
    this.fileHash = fileMeta.sha256Hash;
    this.userId = userId;
    this.fileName = fileMeta.fileName;
    this.fileSize = fileMeta.fileSize;
    this.fileType = fileMeta.fileType;
    this.depositTime = new Date().toISOString();
  }
 /*
  generateDepositId() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    // 从文件读取自增序号（确保每次生成不重复）
    const seqPath = path.join(__dirname, '../data/seq.json');
    let seq = 1;
    if (fs.existsSync(seqPath)) {
      const seqData = JSON.parse(fs.readFileSync(seqPath, 'utf-8'));
      seq = seqData.seq + 1;
    }
    fs.writeFileSync(seqPath, JSON.stringify({ seq }), 'utf-8');
    return `${date}${seq.toString().padStart(3, '0')}`; // 20251127001
  }
  */
}

module.exports = DepositRecord;