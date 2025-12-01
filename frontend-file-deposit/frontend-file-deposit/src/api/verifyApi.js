// src/api/verifyApi.js
import service from '@/utils/request';

/**
 * 验证文件完整性
 * @param {Object} params - { depositId: 存证ID, fileHash: 待验证文件哈希 }
 */
export const verifyFileByDepositId = (params) => {
console.log('\n📡 verifyApi - 发送验证接口请求：');
  console.log('请求参数：', params);
  console.log('请求配置：', {
    url: '/verify/file',
    method: 'POST',
    baseURL: service.defaults.baseURL,
    最终请求URL: service.defaults.baseURL + '/verify/file'
  });
  return service({
    url: '/verify/file',
    method: 'post',
    data: params,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};