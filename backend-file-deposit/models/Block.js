// backend-file-deposit/models/Block.js
const crypto = require('crypto');

class Block {
  constructor(index, prevHash, data, timestamp) {
    this.index = index; // 区块索引（第n个区块，从0开始）
    this.prevHash = prevHash; // 前一区块的哈希值（链式关联核心）
    this.data = data; // 区块数据（存证记录JSON字符串）
    this.timestamp = timestamp || new Date().toISOString(); // 区块生成时间
    this.hash = this.calculateHash(); // 当前区块的哈希值（不可篡改依据）
  }

  // 核心方法：计算区块哈希（SHA256）
  calculateHash() {
    // 哈希输入：索引+前一区块哈希+时间戳+数据（确保任一字段修改，哈希必变）
    const input = `${this.index}${this.prevHash}${this.timestamp}${JSON.stringify(this.data)}`;
    return crypto.createHash('sha256').update(input).digest('hex');
  }
}

module.exports = Block;