<template>
  <div class="verify-container">
    <!-- 🔥 修改：替换原 el-page-header，添加返回按钮 -->
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
            accept=".pdf,.docx,.doc,.jpg,.png,.jpeg,.zip,.rar,.txt"
          >
            <el-button type="primary" icon="Upload">选择待验证文件</el-button>
            <div class="upload-tip">支持 PDF、Word、图片、压缩包、文本等格式</div>
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
          <el-descriptions title="存证信息与文件核对" :column="2" border>
            <el-descriptions-item label="存证ID">{{ verifyResult.data.depositId }}</el-descriptions-item>
            <el-descriptions-item label="原始文件名">{{ verifyResult.data.fileName }}</el-descriptions-item>
            <el-descriptions-item label="原始文件哈希（SHA256）">{{ verifyResult.data.fileHash }}</el-descriptions-item>
            <el-descriptions-item label="待验证文件哈希（SHA256）">{{ currentFileHash }}</el-descriptions-item>
            <el-descriptions-item label="存证时间">{{ verifyResult.data.depositTime }}</el-descriptions-item>
            <el-descriptions-item label="区块索引">{{ verifyResult.data.blockIndex }}</el-descriptions-item>
          </el-descriptions>
          <p class="success-tip">✅ 哈希值完全匹配，文件内容未被修改，存证信息真实有效</p>
        </div>

        <!-- 验证失败：展示失败原因 -->
        <div v-if="!verifyResult.success" class="fail-detail">
          <p class="fail-reason">❌ 失败原因：{{ verifyResult.msg || '待验证文件哈希与存证哈希不匹配，或存证ID不存在/已失效' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { ElMessage, ElIcon } from 'element-plus';
import { Check, Close, Loading } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
// 导入API和工具函数
import { verifyFileByDepositId } from '@/api/verifyApi'; // 验证接口（存证ID+文件哈希）
import { calculateFileSHA256 } from '@/utils/fileHash'; // 计算文件SHA256哈希
import { isLogin } from '@/utils/auth';

export default {
  name: 'VerifyView',
  components: { ElIcon, Check, Close, Loading },
  setup() {
    const router = useRouter();
    const isVerifying = ref(false); // 验证中状态
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
      data: null, // 验证成功的存证数据
      msg: '' // 失败原因
    });

    // 页面加载时检查登录状态
    if (!isLogin()) {
      router.push('/login');
    }

    // 选择待验证文件：计算文件哈希
    const handleFileSelect = async (file) => {
      fileList.value = [file]; // 仅允许选择一个文件
      try {
        ElMessage.info('正在计算文件哈希，请稍候...');
        // 计算待验证文件的SHA256哈希（与存证时算法一致）
        const hash = await calculateFileSHA256(file.raw);
        currentFileHash.value = hash;
        ElMessage.success('文件哈希计算完成');
      } catch (err) {
        fileList.value = [];
        currentFileHash.value = '';
        ElMessage.error('文件哈希计算失败，请选择有效文件重试');
        console.error('计算文件哈希失败：', err);
      }
    };

    // 文件上传前校验（格式+大小）
    const beforeFileUpload = (file) => {
      // 校验文件大小（最大100MB，可调整）
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        ElMessage.error(`文件大小不能超过100MB，当前文件${(file.size / 1024 / 1024).toFixed(2)}MB`);
        return false;
      }
      return true;
    };

    // 开始验证文件完整性
    const startVerify = async () => {
      // 修复后（添加 .value 访问 ref 包装的对象）
        if (!verifyForm.value.depositId.trim()) {
        ElMessage.warning('请输入存证ID');
        return;
        }
      // 修复后（fileList 是 ref，需通过 .value 访问长度）
        if (!fileList.value.length || !currentFileHash.value) {
        ElMessage.warning('请选择有效文件并等待哈希计算完成');
        return;
        }

      isVerifying.value = true;
      verifyResult.value.visible = false; // 隐藏之前的结果

      try {
        // 调用验证接口：传递存证ID + 待验证文件哈希
        // 修复后（verifyForm 是 ref，需通过 .value 访问 depositId）
        const res = await verifyFileByDepositId({
        depositId: verifyForm.value.depositId.trim(),
        fileHash: currentFileHash.value
        });

        verifyResult.value = {
          visible: true,
          success: res.success,
          data: res.success ? res.data : null,
          msg: res.msg || ''
        };
      } catch (err) {
        verifyResult.value = {
          visible: true,
          success: false,
          data: null,
          msg: '验证接口异常，请重试'
        };
        console.error('验证失败：', err);
      } finally {
        isVerifying.value = false;
      }
    };

    return {
      isVerifying,
      fileList,
      currentFileHash,
      verifyForm,
      verifyResult,
      handleFileSelect,
      beforeFileUpload,
      startVerify
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

/* 🔥 新增：头部样式（和其他页面统一） */
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

@media (max-width: 768px) {
  .verify-card {
    padding: 20px;
  }
  .success-detail {
    overflow-x: auto;
  }
}
</style>