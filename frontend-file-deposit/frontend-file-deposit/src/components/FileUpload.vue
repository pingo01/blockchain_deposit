<template>
  <div class="upload-container">
    <!-- 标题 -->
    <h2 class="upload-title">文件存证上传（仅支持 PDF/Word/图片/TXT）</h2>


    <!-- Element Plus 上传组件（支持拖拽+点击选择） -->
<el-upload
  class="upload-component"
  :auto-upload="true"  
  :http-request="handleCustomUpload" 
  :file-list="fileList"  
  :before-upload="handleBeforeUpload"  
  :on-remove="handleRemoveFile"  
  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt" 
  drag  
>   
    <!-- 选择文件后自动上传 -->
    <!-- 自定义上传逻辑（替代默认 action） -->
    <!-- 已选择文件列表 -->
    <!-- 上传前前端预校验 -->
    <!-- 移除已选择文件 -->
    <!-- 前端限制文件选择 -->
    <!-- 开启拖拽上传 -->
  <i class="el-icon-upload"></i>
  <div class="el-upload__text">将文件拖到此处，或<em>点击选择</em></div>
  
  <!-- 改为完整具名插槽写法，避免解析混淆 -->
  <template v-slot:tip>
    <div class="el-upload__tip">
      支持格式：PDF、Word（doc/docx）、图片（png/jpg/jpeg）、TXT | 最大大小：10MB
    </div>
  </template>
</el-upload>

    <!-- 上传成功后展示文件元数据和哈希值 -->
    <div v-if="uploadSuccess" class="meta-card">
      <h3 class="meta-title">📁 上传成功！文件元数据</h3>
      <div class="meta-item">
        <span class="meta-label">原文件名：</span>
        <span class="meta-value">{{ fileMeta.fileName }}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">文件大小：</span>
        <span class="meta-value">{{ (fileMeta.fileSize / 1024).toFixed(2) }} KB</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">文件类型：</span>
        <span class="meta-value">{{ fileMeta.fileType }}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">SHA256 哈希值：</span>
        <span class="meta-value hash-value">{{ fileMeta.sha256Hash }}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">上传时间：</span>
        <span class="meta-value">{{ formatTime(fileMeta.uploadTime) }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { uploadFile } from '@/api/fileApi'; // 引入上传接口
import { isLogin } from '@/utils/auth'; // 引入登录判断工具
import { depositFileToBlockchain } from '@/api/blockchainApi'; // 引入上链接口

export default {
  name: 'FileUpload',
  setup() {
    // 响应式变量（Vue3 Composition API）
    const fileList = ref([]); // 已选择文件列表
    const uploadSuccess = ref(false); // 上传是否成功
    const fileMeta = ref({}); // 上传成功后的文件元数据

    // ---------------- 上传前前端预校验（双重保险，减少无效请求）----------------
    const handleBeforeUpload = (file) => {
      // 1. 检查是否已登录
      if (!isLogin()) {
        ElMessage.warning('请先登录再上传文件！');
        return false; // 阻止上传
      }

      // 2. 格式校验（和后端一致）
      const allowedExt = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.txt'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowedExt.includes(fileExt)) {
        ElMessage.warning(`文件格式不允许！仅支持：${allowedExt.join(', ')}`);
        return false;
      }

      // 3. 大小校验（和后端一致：10MB）
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        ElMessage.warning(`文件过大！最大支持 10MB`);
        return false;
      }

      return true; // 预校验通过，允许上传
    };

    // ---------------- 自定义上传逻辑（模块二上传 + 模块三上链）----------------
      const handleCustomUpload = async (options) => {
        const file = options.file; // 获取选择的文件
        try {
          // ① 调用模块二接口：文件上传 + 生成 SHA256 哈希
          const uploadRes = await uploadFile(file);
          if (!uploadRes.success) {
            throw new Error(uploadRes.msg || '文件上传失败');
          }

          // ② 调用模块三接口：将文件哈希+元数据存证上链（核心联动）
          const blockchainRes = await depositFileToBlockchain(uploadRes.data);
          if (!blockchainRes.success) {
            throw new Error(blockchainRes.msg || '存证上链失败');
          }

          // ③ 整合前端本地文件名 + 模块二元数据 + 模块三存证信息
          const localOriginalFileName = file.name; // 前端本地中文文件名（无乱码）
          fileMeta.value = {
            ...uploadRes.data, // 模块二：哈希值、文件大小、类型等
            fileName: localOriginalFileName, // 覆盖为前端本地中文文件名
            depositId: blockchainRes.data.depositRecord.id, // 模块三：存证编号
            blockIndex: blockchainRes.data.block.index, // 模块三：区块索引
            blockHash: blockchainRes.data.block.blockHash, // 模块三：区块哈希
          };

          // ④ 更新状态并提示
          uploadSuccess.value = true;
          fileList.value = []; // 清空文件列表
          ElMessage.success(`
            文件上传成功！
            存证上链成功！
            存证编号：${fileMeta.value.depositId}
          `);

        } catch (err) {
          // 上传/上链失败，提示错误
          ElMessage.error(`操作失败：${err.message}`);
        }
      };

    // ---------------- 移除已选择的文件 ----------------
    const handleRemoveFile = (file, list) => {
      fileList.value = list; // 更新文件列表
    };

    // ---------------- 时间格式化工具（将 ISO 时间转为本地时间）----------------
    const formatTime = (isoTime) => {
      return new Date(isoTime).toLocaleString(); // 格式：2025/11/26 15:30:00
    };

    // 暴露变量和方法给模板使用
    return {
      fileList,
      uploadSuccess,
      fileMeta,
      handleBeforeUpload,
      handleCustomUpload,
      handleRemoveFile,
      formatTime
    };
  }
};
</script>

<style scoped>
.upload-container {
  max-width: 800px;
  margin: 50px auto;
  padding: 0 20px;
}

.upload-title {
  text-align: center;
  color: #1989fa;
  margin-bottom: 30px;
  font-size: 20px;
}

.upload-component {
  margin-bottom: 30px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 40px;
}

.meta-card {
  padding: 25px;
  border: 1px solid #e6f7ff;
  border-radius: 8px;
  background-color: #f0f9ff;
}

.meta-title {
  color: #096dd9;
  margin-bottom: 20px;
  font-size: 18px;
}

.meta-item {
  margin-bottom: 15px;
  display: flex;
  align-items: flex-start;
}

.meta-label {
  font-weight: 600;
  color: #2d3748;
  width: 120px;
  flex-shrink: 0;
}

.meta-value {
  color: #4a5568;
  word-break: break-all;
  font-size: 14px;
}

.hash-value {
  color: #e53e3e;
  font-family: 'Courier New', monospace; /* 等宽字体，哈希值更易读*/
}
</style>