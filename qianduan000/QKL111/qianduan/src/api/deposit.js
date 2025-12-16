import service from './request';

/**
 * 提交文件存证
 * @param {File} file - 要存证的文件对象
 * @returns {Promise} - 后端返回的存证结果
 */
export const submitDeposit = (file) => {
  const formData = new FormData();
  formData.append('file', file); // 键名必须与后端@RequestParam("file")一致
  return service.post('/deposit/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' } // 文件上传必须的类型
  });
};

/**
 * 验证存证（对比哈希值）
 * @param {String} depositId - 存证编号
 * @param {String} fileHash - 待验证文件的哈希值
 * @returns {Promise} - 验证结果（true/false）
 */
export const verifyDeposit = (depositId, fileHash) => {
  return service.get('/deposit/verify', {
    params: { depositId, fileHash } // 拼接查询参数
  });
};

/**
 * 计算文件哈希值（前端预计算，可选）
 * @param {File} file - 文件对象
 * @returns {Promise} - 文件的SHA-256哈希值
 */
export const calculateFileHash = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target.result;
      // 简单模拟哈希计算（实际项目中可用crypto-js库）
      const hash = 'mock_' + Array.from(new Uint8Array(arrayBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('').slice(0, 64);
      resolve(hash);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};