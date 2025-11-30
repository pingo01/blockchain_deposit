// backend-file-deposit/services/blockchainService.js
const Block = require('../models/Block');
const DepositRecord = require('../models/DepositRecord');
const fs = require('fs');
const path = require('path');

// 区块链数据持久化路径（避免服务重启后数据丢失）
const CHAIN_STORAGE_PATH = path.join(__dirname, '../data/blockchain.json');

class BlockchainService {
  constructor() {
    // 初始化区块链（从本地加载或创建创世区块）
    this.chain = this.loadChainFromStorage();
  }

  // 1. 初始化：创建创世区块（区块链的第一个区块，无前置区块）
  createGenesisBlock() {
    return new Block(0, '0', { message: '数字资产存证系统创世区块' });
  }

  // 2. 加载区块链（从本地文件读取，实现持久化）
  loadChainFromStorage() {
    try {
      if (fs.existsSync(CHAIN_STORAGE_PATH)) {
        const chainData = fs.readFileSync(CHAIN_STORAGE_PATH, 'utf-8');
        const parsedChain = JSON.parse(chainData);
        // 还原Block实例（JSON解析后会丢失原型方法，需重新构造）
        return parsedChain.map(block => 
          new Block(block.index, block.prevHash, block.data,block.timestamp)
        );
      }
      // 本地无数据，创建创世区块并保存
      const genesisBlock = this.createGenesisBlock();
      const initialChain = [genesisBlock];
      this.saveChainToStorage(initialChain);
      return initialChain;
    } catch (error) {
      console.error('加载区块链失败，创建新链：', error);
      const genesisBlock = this.createGenesisBlock();
      const initialChain = [genesisBlock];
      this.saveChainToStorage(initialChain);
      return initialChain;
    }
  }

  // 3. 保存区块链（持久化到本地文件）
  saveChainToStorage(chain) {
    try {
      // 确保data目录存在
      const dataDir = path.dirname(CHAIN_STORAGE_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(CHAIN_STORAGE_PATH, JSON.stringify(chain, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存区块链失败：', error);
      throw new Error('区块链数据持久化失败');
    }
  }

  // 4. 获取最新区块（链尾区块）
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  // 5. 核心功能：创建存证记录并上链
  async depositFile(fileMeta, userId) {
    try {
      // ① 创建存证记录
      const depositRecord = new DepositRecord(fileMeta, userId);
      
      // ② 创建新区块
      const latestBlock = this.getLatestBlock();
      const newBlock = new Block(
        latestBlock.index + 1, // 新区块索引 = 最新区块索引 + 1
        latestBlock.hash, // 新区块prevHash = 最新区块的hash
        depositRecord // 区块数据 = 存证记录
      );

      // ③ 将新区块加入区块链
      this.chain.push(newBlock);
      
      // ④ 持久化更新后的区块链
      this.saveChainToStorage(this.chain);

      return {
        success: true,
        msg: '文件哈希存证上链成功！',
        data: {
          depositRecord, // 存证记录（含存证编号）
          block: {
            index: newBlock.index,
            blockHash: newBlock.hash,
            prevBlockHash: newBlock.prevHash
          }
        }
      };
    } catch (error) {
      console.error('文件存证上链失败：', error);
      return {
        success: false,
        msg: '存证上链失败：' + error.message
      };
    }
  }

  // 6. 核心功能：验证区块链完整性（检测是否被篡改）
  verifyChainIntegrity() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // 验证1：当前区块的hash是否正确（重新计算对比）
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return {
          isIntegrity: false,
          msg: `区块 ${currentBlock.index} 被篡改！区块哈希不匹配`,
          tamperedBlockIndex: currentBlock.index
        };
      }

      // 验证2：当前区块的prevHash是否等于前一区块的hash（链式关联验证）
      if (currentBlock.prevHash !== previousBlock.hash) {
        return {
          isIntegrity: false,
          msg: `区块 ${currentBlock.index} 与前一区块关联断裂！前一区块哈希不匹配`,
          tamperedBlockIndex: currentBlock.index
        };
      }
    }

    return {
      isIntegrity: true,
      msg: '区块链完整，无数据篡改'
    };
  }

  // 7. 核心功能：根据文件哈希查询存证记录
  queryDepositByFileHash(fileHash) {
    // 遍历所有区块，查找包含目标文件哈希的存证记录
    for (const block of this.chain) {
      const blockData = block.data;
      // 排除创世区块（创世区块数据不是存证记录）
      if (blockData.fileHash && blockData.fileHash === fileHash) {
        return {
          success: true,
          data: {
            depositRecord: blockData,
            blockInfo: {
              index: block.index,
              blockHash: block.hash,
              prevBlockHash: block.prevHash,
              timestamp: block.timestamp
            }
          }
        };
      }
    }
    return {
      success: false,
      msg: '未查询到该文件的存证记录'
    };
  }

  // 8. 核心功能：根据存证编号查询存证记录（无需修改，已正确匹配 id）
queryDepositByDepositId(depositId) {
  for (const block of this.chain) {
    const blockData = block.data;
    // 现在 blockData.id 是 DepositRecord 自动生成的存证ID（如 20251127001），能精准匹配
    if (blockData.id && blockData.id === depositId) {
      return {
        success: true,
        data: {
          depositRecord: blockData,
          blockInfo: {
            index: block.index,
            blockHash: block.hash,
            prevBlockHash: block.prevHash,
            timestamp: block.timestamp
          }
        }
      };
    }
  }
  return {
    success: false,
    msg: '未查询到该存证编号的记录'
  };
}

 // 新增：9. 核心功能：按文件名+用户ID查询存证记录（仅返回该用户的匹配记录）
  // 适配模块四“按文件名查询”功能，支持模糊匹配，仅上传者可调用
  queryDepositByFileNameAndUserId(fileName, userId) {
    const matchedRecords = [];
    // 遍历所有区块，筛选符合条件的存证记录
    for (const block of this.chain) {
      const blockData = block.data;
      // 筛选条件：
      // 1. 是存证记录（含fileHash，排除创世区块）
      // 2. 属于当前查询用户（userId匹配）
      // 3. 文件名模糊匹配（不区分大小写，适配“按文件名查询”需求）
      if (blockData.fileHash && blockData.userId === userId) {
        const isMatch = blockData.fileName.toLowerCase().includes(fileName.toLowerCase());
        if (isMatch) {
          matchedRecords.push({
            depositRecord: blockData, // 存证记录详情（文件名、哈希、存证编号等）
            blockInfo: { // 关联的区块信息
              index: block.index,
              blockHash: block.hash,
              prevBlockHash: block.prevHash,
              timestamp: block.timestamp
            }
          });
        }
      }
    }
    // 根据匹配结果返回响应
    return matchedRecords.length > 0
      ? { success: true, data: matchedRecords }
      : { success: false, msg: `未查询到用户${userId}名下匹配"${fileName}"的存证记录` };
  }



  // 10. 核心功能：验证文件是否被篡改（对比哈希值）
  verifyFileIntegrity(fileHash) {
    // ① 查询存证记录
    const queryResult = this.queryDepositByFileHash(fileHash);
    if (!queryResult.success) {
      return {
        success: false,
        msg: '未查询到该文件的存证记录，无法验证'
      };
    }

    // ② 验证区块链完整性（确保存证记录未被篡改）
    const chainVerifyResult = this.verifyChainIntegrity();
    if (!chainVerifyResult.isIntegrity) {
      return {
        success: false,
        msg: `文件验证失败：${chainVerifyResult.msg}`,
        tampered: true
      };
    }

    // ③ 验证通过（存证记录存在且区块链完整 → 文件未被篡改）
    return {
      success: true,
      msg: '文件未被篡改，存证记录有效！',
      data: queryResult.data.depositRecord
    };
  }
}

// 单例模式：确保整个系统只有一条区块链
module.exports = new BlockchainService();