<template>
  <div class="verify-container">
    <!-- 修改：替换原 el-page-header，添加返回按钮 -->
    <div class="header-bar">
      <el-button type="text" @click="$router.push('/dashboard')" class="back-btn">
        ← Back
      </el-button>
      <h2 class="page-title">验证者 - 文件完整性验证</h2>
    </div>

    <!-- 验证表单卡片 -->
    <div class="verify-card">
      <el-form :model="verifyForm" label-width="130px" class="verify-form">
        <!-- 上传待验证文件 -->
        <el-form-item label="待验证文件" required>
          <el-upload
            class="file-upload"
            action="#"
            :auto-upload="false"
            :on-change="handleFileSelect"
            :file-list="fileList"
            :before-upload="beforeFileUpload"
            accept=".pdf,.docx,.doc,.jpg,.png,.jpeg,.txt"
          >
            <el-button type="primary" icon="Upload">选择待验证文件</el-button>
            <div class="upload-tip">支持 PDF、Word、图片、文本等格式</div>
          </el-upload>
        </el-form-item>

        <!-- 输入存证ID -->
        <el-form-item label="存证ID" required>
          <el-input
            v-model="verifyForm.depositId"
            placeholder="输入文件对应的存证ID（如：20251127001）"
            clearable
            maxlength="50"
          />
        </el-form-item>

        <!-- 验证按钮 -->
        <el-form-item label=" " class="verify-btn">
          <el-button 
            type="primary" 
            size="large" 
            @click="startVerify"
            :disabled="!verifyForm.depositId || !fileList.length || isVerifying"
          >
            <el-icon v-if="isVerifying" class="loading-icon"><Loading /></el-icon>
            {{ isVerifying ? '验证中...' : '开始验证文件完整性' }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 验证结果展示 -->
    <div v-if="verifyResult.visible" class="result-card">
          <!--  新增：导出验证报告按钮 -->
      <div class="export-btn-container">
        <el-button 
          type="success" 
          icon="Download" 
          @click="exportVerifyReport"
          :disabled="isVerifying || isExporting"
          class="export-btn"
        >
          <el-icon v-if="isExporting" class="loading-icon"><Loading /></el-icon>
          {{ isExporting ? '生成报告中...' : '导出验证报告' }}
        </el-button>
      </div>

      <el-divider content="验证结果" />
      <div class="result-content">
        <!-- 验证状态（成功/失败） -->
        <div class="result-status" :class="verifyResult.success ? 'success' : 'fail'">
          <el-icon :class="verifyResult.success ? 'success-icon' : 'fail-icon'">
            <Check v-if="verifyResult.success" />
            <Close v-else />
          </el-icon>
          <h3 class="status-title">
            {{ verifyResult.success ? '验证通过：文件未被篡改' : '验证失败：文件已被篡改或存证ID无效' }}
          </h3>
        </div>

        <!-- 验证成功：展示详细核对信息 -->
        <div v-if="verifyResult.success && verifyResult.data" class="success-detail">
          <el-descriptions title="存证信息与文件核对" :column="2" border class="fixed-table">
            <el-descriptions-item label="存证ID">{{ verifyResult.data.depositId || '暂未记录'}}</el-descriptions-item>
            <el-descriptions-item label="原始文件名">{{ verifyResult.data.fileName || '暂未记录'}}</el-descriptions-item>
            <el-descriptions-item label="原始文件哈希（SHA256）">{{ verifyResult.data.fileHash || '暂未记录'}}</el-descriptions-item>
            <el-descriptions-item label="待验证文件哈希（SHA256）">{{ currentFileHash || '暂未记算'}}</el-descriptions-item>
            <el-descriptions-item label="存证时间">{{ formatTime(verifyResult.data.depositTime) || '暂未记录'}}</el-descriptions-item>
            <el-descriptions-item label="区块索引">{{ verifyResult.data.blockIndex || '暂未记录'}}</el-descriptions-item>
          </el-descriptions>
          <p class="success-tip">✅ 哈希值完全匹配，文件内容未被修改，存证信息真实有效</p>
        </div>


        <!-- 🔴 新增：验证失败也展示详细信息（含区块索引） -->
        <div v-if="!verifyResult.success && verifyResult.data" class="fail-detail">
          <p class="fail-reason">❌ 失败原因：{{ verifyResult.msg || '待验证文件哈希与存证哈希不匹配，或存证ID不存在/已失效' }}</p>
          <el-descriptions title="存证关联信息（供核对）" :column="2" border class="fixed-table" style="margin-top: 15px;">
            <el-descriptions-item label="存证ID">{{ verifyResult.data.depositId || '暂未记录'}}</el-descriptions-item>
            <el-descriptions-item label="原始文件名">{{ verifyResult.data.fileName || '暂未记录'}}</el-descriptions-item>
            <el-descriptions-item label="原始文件哈希（SHA256）">{{ verifyResult.data.fileHash || '暂未记录'}}</el-descriptions-item>
            <el-descriptions-item label="区块索引">{{ verifyResult.data.blockIndex || '暂未记录'}}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'; // 🔴 新增：导入 watch 监听存证ID变化
import { ElMessage, ElIcon, ElLoading } from 'element-plus';
import { Check, Close, Loading } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
// 导入API和工具函数
import { verifyFileByDepositId } from '@/api/verifyApi'; // 验证接口（存证ID+文件哈希）
import { calculateFileSHA256 } from '@/utils/fileHash'; // 计算文件SHA256哈希
import { isLogin, getToken } from '@/utils/auth';
//import service from '@/utils/request'; // 导入request实例，用于打印完整URL

export default {
  name: 'VerifyView',
  components: { ElIcon, Check, Close, Loading },
  setup() {
    const router = useRouter();
    const isVerifying = ref(false); // 验证中状态
    const isExporting = ref(false); //  新增：导出中状态
    const fileList = ref([]); // 待验证文件列表
    const currentFileHash = ref(''); // 待验证文件的哈希值

    // 验证表单
    const verifyForm = ref({
      depositId: '' // 存证ID
    });

    // 验证结果
    const verifyResult = ref({
      visible: false, // 是否显示结果
      success: false, // 成功/失败
      data: {}, // 🔴 修改：默认值改为空对象，避免 undefined // 验证成功的存证数据
      msg: '' // 失败原因
    });

    //  新增：时间格式化方法（解决时间格式怪异问题）
    const formatTime = (time) => {
      if (!time) return '';
      const date = new Date(time);
      // 避免 Invalid Date 情况
      if (isNaN(date.getTime())) return '';
      // 格式：年-月-日 时:分:秒（本地时区，24小时制）
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    };

    //  新增：重置验证结果（复用逻辑）
    const resetVerifyResult = () => {
      verifyResult.value = {
        visible: false,
        success: false,
        data: null,
        msg: ''
      };
      console.log('🔄 已重置旧验证结果');
    };

    //  新增：监听存证ID变化，重置结果
    watch(
      () => verifyForm.value.depositId,
      (newVal, oldVal) => {
        // 存证ID从有值变空，或从一个值变成另一个值时，重置结果
        if ((!newVal && oldVal) || (newVal && oldVal && newVal !== oldVal)) {
          resetVerifyResult();
        }
      }
    );

    // ======================== 日志：页面初始化 ========================
    console.log('📄 VerifyView - 页面初始化');
    console.log('🔍 登录状态：', isLogin() ? '已登录' : '未登录');
    if (isLogin()) {
      console.log('🔍 Token存在：', !!getToken());
    } else {
      console.log('🔍 未登录，跳转到登录页');
      router.push('/login');
    }

    // 选择待验证文件：计算文件哈希（带日志）
    const handleFileSelect = async (file) => {
       //  核心修改：选择新文件时，先重置旧验证结果
      resetVerifyResult();

      // ======================== 日志：文件选择 ========================
      console.log('\n📂 选择待验证文件 - 开始处理：');
      console.log('文件信息：', {
        文件名: file.name,
        文件大小: (file.size / 1024 / 1024).toFixed(2) + 'MB',
        文件类型: file.type,
        文件原始对象: file.raw
      });

      fileList.value = [file]; // 仅允许选择一个文件
      try {
        ElMessage.info('正在计算文件哈希，请稍候...');
        console.log('🔄 开始计算文件SHA256哈希...');
        
        // 计算待验证文件的SHA256哈希（与存证时算法一致）
        const hash = await calculateFileSHA256(file.raw);
        currentFileHash.value = hash;
        
        // ======================== 日志：哈希计算成功 ========================
        console.log('✅ 文件哈希计算完成：');
        console.log('SHA256哈希值：', hash);
        
        ElMessage.success('文件哈希计算完成');
      } catch (err) {
        fileList.value = [];
        currentFileHash.value = '';
        resetVerifyResult(); //  新增：哈希计算失败时也重置结果
        
        // ======================== 日志：哈希计算失败 ========================
        console.error('❌ 计算文件哈希失败：', err);
        console.error('失败堆栈：', err.stack);
        
        ElMessage.error('文件哈希计算失败，请选择有效文件重试');
      }
    };

    // 文件上传前校验（格式+大小）（带日志）
    const beforeFileUpload = (file) => {
      // ======================== 日志：文件上传前校验 ========================
      console.log('\n🔍 文件上传前校验：');
      console.log('待校验文件信息：', {
        文件名: file.name,
        文件大小: (file.size / 1024 / 1024).toFixed(2) + 'MB',
        文件类型: file.type
      });

      // 校验文件大小（最大100MB，可调整）
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        const fileSize = (file.size / 1024 / 1024).toFixed(2);
        console.error('❌ 文件大小校验失败：', `当前文件${fileSize}MB，超过最大限制100MB`);
        ElMessage.error(`文件大小不能超过100MB，当前文件${fileSize}MB`);
        return false;
      }

      console.log('✅ 文件校验通过：格式和大小均符合要求');
      return true;
    };

    // 开始验证文件完整性（带完整日志）
    const startVerify = async () => {
      // ======================== 日志：开始验证流程 ========================
      console.log('\n=====================================================');
      console.log('🚀 开始文件完整性验证流程');
      console.log('=====================================================');
      console.log('当前表单数据：', {
        存证ID: verifyForm.value.depositId.trim(),
        已选择文件数: fileList.value.length,
        待验证文件哈希: currentFileHash.value || '未计算',
        验证中状态: isVerifying.value
      });

      // 参数校验（带日志）
      if (!verifyForm.value.depositId.trim()) {
        console.error('❌ 验证流程终止：未输入存证ID');
        ElMessage.warning('请输入存证ID');
        return;
      }
      if (!fileList.value.length || !currentFileHash.value) {
        console.error('❌ 验证流程终止：未选择有效文件或哈希未计算完成');
        ElMessage.warning('请选择有效文件并等待哈希计算完成');
        return;
      }

      // 校验通过，开始验证
      isVerifying.value = true;
      verifyResult.value.visible = false; // 隐藏之前的结果
      const loading = ElLoading.service({ text: '正在验证文件...' });

      try {
        const depositId = verifyForm.value.depositId.trim();
        const fileHash = currentFileHash.value;

        // ======================== 日志：调用验证接口前 ========================
        console.log('\n📤 准备调用验证接口：');
        console.log('接口参数：', {
          depositId: depositId,
          fileHash: fileHash
        });
        

        // 🔴 核心修改：调用重新封装的 verifyFileByDepositId（不拦截 success: false）
        const res = await verifyFileByDepositId({
          depositId: depositId,
          fileHash: fileHash
        });

        // 🔴 新增日志：打印 res.data.blockIndex
console.log('🔍 前端收到的 blockIndex：', res.data?.blockIndex); // 关键日志


        // ======================== 日志：接口响应成功 ========================
        console.log('\n✅ 验证接口响应成功：');
        console.log('响应数据：', res);

 // 🔴 核心修改：无论成功/失败，都保存 res.data（原始存证信息）
        verifyResult.value = {
          visible: true,
          success: res.success,
          data: res.data || {}, // 确保 data 是对象，避免 undefined
          msg: res.msg || ''
        };

        if (res.success) {
          console.log('✅ 验证流程完成：文件未被篡改');
          ElMessage.success('验证通过！文件未被篡改');
        } else {
          console.log('❌ 验证流程完成：文件已被篡改或存证ID无效');
          // 【删除】移除这行手动错误提示（request.js已弹）
      // ElMessage.error('验证失败：' + res.msg);
        }

      } catch (err) {
        // ======================== 日志：验证失败（异常捕获） ========================
        console.error('\n❌ 验证流程异常：');
        console.error('异常对象：', err);
        console.error('异常消息：', err.message);
        console.error('异常堆栈：', err.stack);
        console.error('响应状态：', err.response?.status || '无');
        console.error('响应数据：', err.response?.data || '无');

        // 处理异常结果
        verifyResult.value = {
          visible: true,
          success: false,
          data: null,
          msg: err.message || '验证接口异常，请重试'
        };

          // 【删除】移除这行手动错误提示（request.js已弹）
    // ElMessage.error('验证失败：' + (err.message || '验证接口异常，请重试'));
      } finally {
        isVerifying.value = false;
        loading.close();
        console.log('\n=====================================================');
        console.log('🔚 验证流程结束');
        console.log('=====================================================');
      }
    };

    //  新增：导出验证报告（调用后端接口）
    const exportVerifyReport = async () => {
      if (!verifyResult.value.visible) {
        ElMessage.warning('暂无验证结果，无法导出报告');
        return;
      }

      isExporting.value = true;
      const loading = ElLoading.service({ text: '正在生成验证报告...' });

      try {
        // 1. 构造报告数据（和后端接口参数对应）
        const reportData = {
          depositId: verifyForm.value.depositId.trim(),
          verifySuccess: verifyResult.value.success,
          // 🔴 优化：优先从 verifyResult.data 拿原始文件名（失败时也有值）
          originalFileName: verifyResult.value.data?.fileName || fileList.value[0]?.name || '未知文件名',
          // 🔴 优化：优先从 verifyResult.data 拿原始哈希（失败时也有值）
          originalFileHash: verifyResult.value.data?.fileHash || '未查询到',
          currentFileHash: currentFileHash.value,
          // 🔴 优化：优先从 verifyResult.data 拿存证时间（失败时也有值）
          depositTime: verifyResult.value.data?.depositTime || '未查询到',
          // 🔴 优化：优先从 verifyResult.data 拿区块索引（失败时也有值）
          blockIndex: verifyResult.value.data?.blockIndex || '未查询到',
          verifyTime: new Date().toISOString(),
          failReason: verifyResult.value.msg || '无详细原因'
        };

        // 🔴 重点日志：打印 blockIndex 相关信息
        console.log('📤 导出报告 - blockIndex 详情：');
        console.log('verifyResult.data.blockIndex：', verifyResult.value.data?.blockIndex);
        console.log('传递给后端的 blockIndex：', reportData.blockIndex);

        console.log('\n📤 调用验证报告导出接口：');
        console.log('接口参数：', reportData);
        ;

 // 2. 调用后端接口（响应类型为二进制流）
        const response = await axios({
          url: 'http://localhost:3001/api/file/export-verify-report',
          method: 'POST',
          data: reportData,
          responseType: 'blob', // 关键：指定二进制流响应
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          }
        });

        // 3. 处理PDF流，触发浏览器下载
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');

        // 文件名格式：验证报告_存证ID_时间戳.pdf
        const timestamp = new Date().toISOString().replace(/[-:.T]/g, '').slice(0, 14);
        const fileName = `验证报告_${reportData.depositId}_${timestamp}.pdf`;

        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();

        // 4. 清理临时资源
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        console.log('✅ 验证报告导出成功：', fileName);
        ElMessage.success('验证报告导出成功');
      } catch (err) {
        console.error('\n❌ 导出验证报告失败：', err);
        console.error('异常消息：', err.message);
        console.error('异常堆栈：', err.stack);
        console.error('响应状态：', err.response?.status || '无');
        console.error('响应数据：', err.response?.data || '无');

        ElMessage.error('导出验证报告失败：' + (err.message || '服务器异常，请重试'));
      } finally {
        isExporting.value = false;
        loading.close();
      }
    };

    return {
      isVerifying,
      isExporting, // 导出中状态
      fileList,
      currentFileHash,
      verifyForm,
      verifyResult,
      formatTime, // 🌟 导出时间格式化方法
      handleFileSelect,
      beforeFileUpload,
      startVerify,
      exportVerifyReport // 导出报告方法
    };
  }
};
</script>

<style scoped>
.verify-container {
  padding: 20px 30px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

/* 新增：头部样式（和其他页面统一） */
.header-bar {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
}

.back-btn {
  color: #4299e1;
  font-size: 16px;
  margin-right: 16px;
  padding: 0;
}

.back-btn:hover {
  color: #3182ce;
}

.page-title {
  font-size: 20px;
  font-weight: 500;
  color: #2d3748;
  margin: 0;
}

.verify-card {
  max-width: 900px;
  margin: 0 auto 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 30px;
}

.verify-form {
  max-width: 700px;
  margin: 0 auto;
}

.file-upload {
  margin-top: 5px;
}

.upload-tip {
  margin-top: 8px;
  color: #718096;
  font-size: 14px;
}

.verify-btn {
  display: flex;
  justify-content: center;
  margin-top: 15px;
}

.loading-icon {
  margin-right: 8px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.result-card {
  max-width: 900px;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 20px;
}

/* 🔴 新增：导出按钮样式 */
.export-btn-container {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 15px;
}

.export-btn {
  background-color: #48bb78;
  border-color: #48bb78;
}

.export-btn:hover {
  background-color: #38a169;
  border-color: #38a169;
}

.result-content {
  padding: 10px 0;
}

.result-status {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.success-icon {
  color: #48bb78;
  font-size: 24px;
  margin-right: 12px;
}

.fail-icon {
  color: #e53e3e;
  font-size: 24px;
  margin-right: 12px;
}

.status-title {
  font-size: 18px;
  font-weight: 500;
  color: #2d3748;
}

.success-detail {
  margin-top: 20px;
}

.success-tip {
  margin-top: 15px;
  color: #48bb78;
  font-size: 14px;
}

.fail-detail {
  margin-top: 15px;
}

.fail-reason {
  color: #e53e3e;
  font-size: 14px;
}

/* 🌟 新增：解决内容出框问题（哈希值自动换行） */
.fixed-table .el-descriptions__content {
  word-wrap: break-word; /* 长文本自动换行 */
  word-break: break-all; /* 英文/哈希值强制换行 */
  white-space: normal; /* 取消默认不换行 */
  padding: 8px 12px; /* 增加内边距，更美观 */
}

/* 🌟 新增：调整列宽比例，优化布局 */
.fixed-table .el-descriptions__item {
  display: flex;
  align-items: flex-start; /* 顶部对齐，避免内容错位 */
}
.fixed-table .el-descriptions__label {
  width: 180px; /* 固定标签列宽度 */
  flex-shrink: 0; /* 标签列不收缩 */
  font-weight: 500; /* 标签文字加粗，更清晰 */
}
.fixed-table .el-descriptions__body {
  flex: 1; /* 内容列自适应剩余宽度 */
}

@media (max-width: 768px) {
  .verify-card {
    padding: 20px;
  }
  .success-detail {
    overflow-x: auto;
  }
}
</style>