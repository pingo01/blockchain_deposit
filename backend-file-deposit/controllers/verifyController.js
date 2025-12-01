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
      // 重点修改1：提取区块链返回的存证记录字段（适配前端需要的格式）
      
      const depositRecord = verifyResult.data || {}; // 区块链返回的存证详情
      const blockInfo = verifyResult.blockInfo || {}; // 区块信息（含 index）

      const frontEndData = {
        depositId: depositId, // 存证ID（前端直接使用）
        fileName: depositRecord.fileName || depositRecord.originalFileName || '未知文件名', // 原始文件名（兼容两种可能字段名）
        fileHash: verifyResult.originalHash, // 核心映射：后端 originalHash → 前端 fileHash（对应“原始文件哈希”）
        depositTime: depositRecord.depositTime || depositRecord.createTime || '', // 存证时间（兼容时间字段名）
        // 🌟 核心修改2：用区块的 blockInfo.index 作为区块索引（替代存证记录的 blockIndex）
        blockIndex: blockInfo.index || '无',
        verifyHash: fileHash // 保留待验证文件哈希（前端可能备用）
      };

      return res.status(200).json({ 
        success: true, 
        msg: verifyResult.msg || '文件未被篡改，验证通过', 
        data: frontEndData // 🌟 重点修改2：返回映射后的扁平字段，前端直接渲染
      });
    } else {
      console.log('❌ 后端验证 - 验证失败，返回结果给前端：', verifyResult.msg);
      
      // 🌟 核心修改3：失败时也提取 blockInfo（存证ID存在但哈希不匹配时有用）
      const blockInfo = verifyResult.blockInfo || {};
      // 🌟 重点修改3：失败时也返回统一格式，避免前端字段缺失
      const frontEndData = {
        depositId: depositId,
        fileName: '无', // 失败时默认值
        fileHash: verifyResult.originalHash || '无', // 原始哈希（可能为空）
        depositTime: '', // 失败时默认空
        blockIndex: '无', // 失败时默认值
        verifyHash: fileHash
      };

      return res.status(200).json({ 
        success: false, 
        msg: verifyResult.msg || '文件已被篡改或存证ID无效', 
        tampered: verifyResult.tampered || true,
        data: frontEndData // 🌟 重点修改4：失败时也返回完整字段结构
      });
    }
  } catch (err) {
    console.error('❌ 后端验证 - 接口异常：', err);
    console.error('异常堆栈：', err.stack);
    
    // 🌟 重点修改5：异常时返回统一格式，避免前端渲染报错
    const frontEndData = {
      depositId: req.body.depositId || '无',
      fileName: '无',
      fileHash: '无',
      depositTime: '',
      blockIndex: '无',
      verifyHash: req.body.fileHash || '无'
    };

    return res.status(500).json({ 
      success: false, 
      msg: '验证接口异常，请重试',
      data: frontEndData // 异常时也返回完整字段结构
    });
  }
};