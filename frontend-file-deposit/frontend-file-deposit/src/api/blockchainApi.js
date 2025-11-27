// src/api/blockchainApi.js
import request from '@/utils/request';

// 1. 文件哈希存证上链
export const depositFileToBlockchain = (fileMeta) => {
  return request({
    url: '/blockchain/deposit',
    method: 'POST',
    data: { fileMeta },
    headers: { 'Content-Type': 'application/json' }
  });
};

// 2. 根据文件哈希查询存证记录
export const queryDepositByHash = (fileHash) => {
  return request({
    url: '/blockchain/query/by-hash',
    method: 'GET',
    params: { fileHash }
  });
};

// 3. 根据存证编号查询存证记录
export const queryDepositByDepositId = (depositId) => {
  return request({
    url: '/blockchain/query/by-deposit-id',
    method: 'GET',
    params: { depositId }
  });
};

// 4. 验证文件完整性（是否被篡改）
export const verifyFileIntegrity = (fileHash) => {
  return request({
    url: '/blockchain/verify-file',
    method: 'GET',
    params: { fileHash }
  });
};

// 5. 验证区块链完整性
export const verifyBlockchain = () => {
  return request({
    url: '/blockchain/verify-chain',
    method: 'GET'
  });
};