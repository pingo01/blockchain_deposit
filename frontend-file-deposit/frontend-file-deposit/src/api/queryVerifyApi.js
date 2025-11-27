// src/api/queryVerifyApi.js
import request from '@/utils/request';
import { ElMessage } from 'element-plus';

/**
 * 1. 按存证编号查询
 * @param {string} depositId - 存证编号
 * @returns {Promise} 查询结果
 */
export const queryByDepositId = (depositId) => {
  return request({
    url: '/query-verify/query/deposit-id',
    method: 'GET',
    params: { depositId }
  });
};

/**
 * 2. 按文件名查询（仅上传者）
 * @param {string} fileName - 文件名（支持模糊匹配）
 * @returns {Promise} 查询结果
 */
export const queryByFileName = (fileName) => {
  return request({
    url: '/query-verify/query/file-name',
    method: 'GET',
    params: { fileName }
  });
};

/**
 * 3. 文件完整性验证（仅验证者）
 * @param {string} fileHash - 文件SHA256哈希值
 * @returns {Promise} 验证结果
 */
export const verifyFileIntegrity = async (fileHash) => {
  try {
    const res = await request({
      url: '/query-verify/verify/file',
      method: 'GET',
      params: { fileHash }
    });
    return res;
  } catch (err) {
    // 捕获权限错误，优化提示
    if (err.msg && err.msg.includes('仅限验证者使用')) {
      ElMessage.error('权限不足：文件完整性验证功能仅限验证者使用');
    } else {
      ElMessage.error(err.msg || '文件验证失败');
    }
    throw err; // 抛出错误，供页面处理
  }
};

/**
 * 辅助：获取当前用户角色（用于UI适配）
 * @returns {string} 用户角色（uploader/verifier）
 */
export const getUserRole = () => {
  return localStorage.getItem('userRole') || '';
};