// 直接导入 spark-md5 的 ES6 模块（无需 require）
import SparkMD5 from 'spark-md5';

/**
 * 计算文件的SHA256哈希（与存证时算法保持一致）
 * @param {File} file - 待计算哈希的文件
 * @returns {Promise<string>} - SHA256哈希字符串
 */
export const calculateFileSHA256 = (file) => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    const chunkSize = 4 * 1024 * 1024; // 4MB分片读取（避免大文件卡顿）
    let currentChunk = 0;
    const chunks = Math.ceil(file.size / chunkSize);
    const spark = new SparkMD5.ArrayBuffer(); // 直接使用 SparkMD5 的 ArrayBuffer 方法

    fileReader.onload = (e) => {
      spark.append(e.target.result);
      currentChunk++;
      if (currentChunk < chunks) {
        loadNextChunk();
      } else {
        const hash = spark.end();
        resolve(hash);
      }
    };

    fileReader.onerror = (err) => {
      reject(err);
    };

    const loadNextChunk = () => {
      const start = currentChunk * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      fileReader.readAsArrayBuffer(file.slice(start, end));
    };

    loadNextChunk();
  });
};