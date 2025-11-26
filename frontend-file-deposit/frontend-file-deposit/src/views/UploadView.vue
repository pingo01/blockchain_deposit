<template>
  <div class="upload-view">
    <!-- 页面头部 -->
    <el-page-header content="数字资产存证系统 - 文件上传" />
    <!-- 引入核心上传组件 -->
    <file-upload />
  </div>
</template>

<script>
// 引入上传组件
import FileUpload from '@/components/FileUpload.vue';

export default {
  name: 'UploadView',
  components: { FileUpload } // 注册组件
};
</script>

<style scoped>
.upload-view {
  padding: 30px;
  background-color: #f8f9fa;
  min-height: 100vh;
}
</style>