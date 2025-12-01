// src/utils/fileHash.js（完整替换，删除 SparkMD5，改用 CryptoJS）
import CryptoJS from 'crypto-js';

/**
 * 标准 SHA256 哈希计算（与后端存证时完全一致）
 * @param {File} file - 待计算哈希的文件对象
 * @returns {Promise<string>} - 64 位十六进制 SHA256 哈希值（和后端格式统一）
 */
export const calculateFileSHA256 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const chunkSize = 2 * 1024 * 1024; // 2MB 分片读取（避免大文件内存溢出）
    let offset = 0;
    // 初始化 CryptoJS WordArray（用于存储完整文件的二进制数据）
    const totalWordArray = CryptoJS.lib.WordArray.create();

    // 分片读取文件
    const readNextChunk = () => {
      const slice = file.slice(offset, offset + chunkSize);
      reader.readAsArrayBuffer(slice);
    };

    // 读取分片成功
    reader.onload = (e) => {
      try {
        // 将当前分片的 ArrayBuffer 转换为 CryptoJS WordArray
        const chunkWordArray = CryptoJS.lib.WordArray.create(e.target.result);
        // 追加到总数据中
        totalWordArray.concat(chunkWordArray);

        offset += chunkSize;
        if (offset < file.size) {
          readNextChunk(); // 继续读取下一分片
        } else {
          // 所有分片读取完成，计算 SHA256 哈希（64 位十六进制）
          const sha256Hash = CryptoJS.SHA256(totalWordArray).toString(CryptoJS.enc.Hex);
          console.log('✅ SHA256 哈希计算完成：', {
            文件名: file.name,
            哈希值: sha256Hash,
            哈希长度: sha256Hash.length, // 正确应为 64 位
            算法: 'SHA256'
          });
          resolve(sha256Hash);
        }
      } catch (err) {
        console.error('❌ 分片哈希计算失败：', err);
        reject(new Error('文件哈希计算失败：' + err.message));
      }
    };

    // 读取文件失败
    reader.onerror = (err) => {
      console.error('❌ 文件读取失败：', err);
      reject(new Error('文件读取失败：' + err.message));
    };

    // 开始读取第一个分片
    readNextChunk();
  });
};