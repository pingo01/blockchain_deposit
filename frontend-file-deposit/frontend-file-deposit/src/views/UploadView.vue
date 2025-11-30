<template>
  <div class="upload-view">
    <!-- 🔥 修改：替换原 el-page-header，添加返回按钮 -->
    <div class="header-bar">
      <el-button type="text" @click="$router.push('/dashboard')" class="back-btn">
        ← Back
      </el-button>
      <h2 class="page-title">数字资产存证系统 - 文件上传</h2>
    </div>

    <!-- 保留原有核心上传组件 -->
    <file-upload />
  </div>
</template>

<script>
// 引入上传组件（不变）
import FileUpload from '@/components/FileUpload.vue';

export default {
  name: 'UploadView',
  components: { FileUpload } // 注册组件（不变）
};
</script>

<style scoped>
.upload-view {
  padding: 30px;
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
</style>