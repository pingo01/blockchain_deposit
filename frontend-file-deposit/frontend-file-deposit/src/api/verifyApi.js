// src/api/verifyApi.js
import request from '@/utils/request';

/**
 * 验证文件完整性
 * @param {Object} params - { depositId: 存证ID, fileHash: 待验证文件哈希 }
 */
export const verifyFileByDepositId = (params) => {
  return request({
    url: '/api/verifier/verify',
    method: 'post',
    data: params
  });
};