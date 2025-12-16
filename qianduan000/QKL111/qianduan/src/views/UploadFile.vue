<template>
  <el-card class="upload-card">
    <div slot="header">
      <h2>文件存证上传</h2>
      <p class="tip">支持PDF、Word、图片、文本格式，存证后生成唯一哈希值，不可篡改</p>
    </div>

    <!-- 上传组件 -->
    <el-upload
      class="upload-demo"
      action="#"
      :auto-upload="false"
      :on-change="handleFileChange"
      :file-list="fileList"
      :limit="1"
      accept=".pdf,.doc,.docx,.jpg,.png,.txt"
      :on-exceed="handleExceed"
    >
      <el-button type="primary" icon="Upload" size="default">选择文件</el-button>
      <div slot="tip" class="upload-tip">
        单个文件大小不超过100MB，支持格式：.pdf .doc .docx .jpg .png .txt
      </div>
    </el-upload>

    <!-- 预计算哈希（可选） -->
    <div v-if="fileHash" class="hash-info">
      <el-tag type="info">文件预计算哈希：</el-tag>
      <code class="hash-code">{{ fileHash }}</code>
    </div>

    <!-- 提交按钮 -->
    <el-button
      type="success"
      icon="CheckCircle"
      size="default"
      @click="submitDeposit"
      :disabled="!selectedFile"
      class="submit-btn"
    >
      提交存证
    </el-button>

    <!-- 存证结果 -->
    <el-card v-if="depositResult" class="result-card">
      <div class="result-title">
        <el-icon color="#52c41a"><CheckCircle /></el-icon>
        <h3>存证成功！</h3>
      </div>
      <el-descriptions column="1" border>
        <el-descriptions-item label="存证编号">{{ depositResult.depositId }}</el-descriptions-item>
        <el-descriptions-item label="文件名称">{{ depositResult.fileName }}</el-descriptions-item>
        <el-descriptions-item label="文件大小">{{ formatFileSize(depositResult.fileSize) }}</el-descriptions-item>
        <el-descriptions-item label="SHA-256哈希值">
          <code>{{ depositResult.fileHash }}</code>
          <el-button 
            type="text" 
            icon="Copy" 
            size="small" 
            @click="copyHash(depositResult.fileHash)"
          >
            复制
          </el-button>
        </el-descriptions-item>
        <el-descriptions-item label="存证时间">{{ formatDateTime(depositResult.depositTime) }}</el-descriptions-item>
        <el-descriptions-item label="存证状态">
          <el-tag type="success" v-if="depositResult.depositStatus === 1">已打包至区块</el-tag>
          <el-tag type="warning" v-else>待打包</el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </el-card>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Upload, CheckCircle, Copy } from '@element-plus/icons-vue';
// 引入存证接口
import { submitDeposit, calculateFileHash } from '../api/deposit';

// 选中的文件
const selectedFile = ref(null);
// 上传组件文件列表
const fileList = ref([]);
// 存证结果
const depositResult = ref(null);
// 预计算的文件哈希
const fileHash = ref('');

// 选择文件后触发
const handleFileChange = async (uploadFile) => {
  selectedFile.value = uploadFile.raw;
  fileList.value = [uploadFile];
  // 预计算文件哈希（可选，提升用户体验）
  try {
    fileHash.value = await calculateFileHash(uploadFile.raw);
    ElMessage.info('文件哈希预计算完成');
  } catch (err) {
    ElMessage.warning('哈希预计算失败，不影响存证');
    fileHash.value = '';
  }
};

// 超过文件数量限制
const handleExceed = () => {
  ElMessage.warning('最多只能选择1个文件');
};

// 提交存证
const submitDeposit = async () => {
  ElMessageBox.confirm(
    `确定对文件「${selectedFile.value.name}」进行存证吗？存证后哈希值将永久记录。`,
    '存证确认',
    {
      confirmButtonText: '确认存证',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(async () => {
    try {
      // 调用存证接口
      const res = await submitDeposit(selectedFile.value);
      if (res.success) {
        depositResult.value = res.data;
        ElMessage.success('存证成功！请保存存证编号和哈希值');
        // 清空选择
        fileList.value = [];
        selectedFile.value = null;
        fileHash.value = '';
      } else {
        ElMessage.error('存证失败：' + res.msg);
      }
    } catch (err) {
      console.error('存证失败：', err);
    }
  }).catch(() => {
    ElMessage.info('已取消存证');
  });
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// 格式化时间
const formatDateTime = (dateStr) => {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 复制哈希值
const copyHash = (hash) => {
  navigator.clipboard.writeText(hash).then(() => {
    ElMessage.success('哈希值已复制');
  }).catch(() => {
    ElMessage.error('复制失败，请手动复制');
  });
};
</script>

<style scoped>
.upload-card {
  max-width: 800px;
  margin: 0 auto;
}

.tip {
  color: #666;
  font-size: 14px;
  margin-top: 5px;
}

.upload-demo {
  margin: 20px 0;
}

.upload-tip {
  color: #999;
  font-size: 13px;
}

.hash-info {
  margin: 10px 0;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.hash-code {
  display: inline-block;
  max-width: 600px;
  word-break: break-all;
  margin-left: 10px;
  color: #e53e3e;
}

.submit-btn {
  margin: 10px 0 30px 0;
}

.result-card {
  margin-top: 20px;
  border-color: #e6f7ed;
}

.result-title {
  display: flex;
  align-items: center;
  color: #52c41a;
  margin-bottom: 15px;
}

.result-title h3 {
  margin: 0 0 0 10px;
}
</style>