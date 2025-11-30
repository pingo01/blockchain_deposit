// src/api/queryApi.js
import request from '@/utils/request'; // 你的请求工具（如axios封装）

/**
 * 获取当前上传者的所有文件列表
 */
export const getUserFileList = () => {
  return request({
    url: '/query/user-files',
    method: 'get'
  });
};

/**
 * 按文件名查询当前上传者的文件（模糊匹配）
 * @param {string} fileName - 文件名
 */
export const queryFileByName = (fileName) => {
  return request({
    //url: '/uploader/query/name',
    url: '/query/file-name',
    method: 'get',
    params: {  fileName  }
  });
};

/**
 * 按存证ID查询当前上传者的文件（精准匹配）
 * @param {string} depositId - 存证ID
 */
export const queryFileById = (depositId) => {
  return request({
    //url: '/uploader/query/id',
    url: '/query/deposit-id',
    method: 'get',
    params: { depositId }
  });
};