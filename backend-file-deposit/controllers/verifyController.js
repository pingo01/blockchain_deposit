const blockchainService = require('../services/blockchainService');

// 文件完整性验证（修正后）
exports.verifyFile = (req, res) => {
  try {


     // 1. 接收参数日志
    console.log('\n=====================================================');
    console.log('📥 后端验证接口 - 收到请求：');
    console.log('请求方法：', req.method);
    console.log('请求URL：', req.originalUrl);
    console.log('接收参数（req.body）：', req.body);
    console.log('=====================================================');


    // 1. 接收前端传递的参数（POST 请求 → 从 req.body 拿）
    const { depositId, fileHash } = req.body; 

    // 2. 校验参数（存证ID和待验证哈希都不能为空）
    if (!depositId) {
      console.error('❌ 后端验证 - 参数错误：存证ID不能为空');
      return res.status(400).json({ success: false, msg: '存证ID不能为空' });
    }
    if (!fileHash) {
      console.error('❌ 后端验证 - 参数错误：文件哈希值不能为空');
      return res.status(400).json({ success: false, msg: '文件哈希值不能为空' });
    }

    console.log('【验证接口】接收参数：', { depositId, fileHash });

    // 3. 调用区块链服务验证（传递存证ID + 待验证哈希）
    console.log('🔄 后端验证 - 调用区块链服务验证：', {
      depositId: depositId,
      待验证哈希: fileHash
    });
    const verifyResult = blockchainService.verifyFileIntegrity(depositId, fileHash);
     console.log('✅ 后端验证 - 区块链服务返回结果：', verifyResult);

    // 4. 根据区块链服务结果，返回响应给前端
    if (verifyResult.success) {
       console.log('✅ 后端验证 - 验证成功，返回结果给前端');
      return res.status(200).json({ 
        success: true, 
        msg: verifyResult.msg, 
        data: {
          depositId,
          originalHash: verifyResult.originalHash,
          verifyHash: fileHash,
          depositRecord: verifyResult.data
        }
      });
    } else {
      console.log('❌ 后端验证 - 验证失败，返回结果给前端：', verifyResult.msg);
      return res.status(200).json({ 
        success: false, 
        msg: verifyResult.msg, 
        tampered: verifyResult.tampered,
        data: {
          depositId,
          originalHash: verifyResult.originalHash || '无',
          verifyHash: fileHash
        }
      });
    }
  } catch (err) {
    console.error('❌ 后端验证 - 接口异常：', err);
    console.error('异常堆栈：', err.stack);
    console.error('文件完整性验证失败：', err);
    return res.status(500).json({ success: false, msg: '验证接口异常，请重试' });
  }
};