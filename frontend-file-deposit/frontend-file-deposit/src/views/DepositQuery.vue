<template>
  <div class="query-container">
    <el-page-header content="存证查询与文件验证" />
    <div class="query-tabs">
      <el-tabs v-model="activeTab" type="card">
        <!-- 按文件哈希查询 -->
        <el-tab-pane label="按文件哈希查询" name="hash">
          <el-input
            v-model="queryHash"
            placeholder="请输入文件SHA256哈希值"
            class="query-input"
          />
          <el-button type="primary" @click="handleQueryByHash">查询存证</el-button>
        </el-tab-pane>
        <!-- 按存证编号查询 -->
        <el-tab-pane label="按存证编号查询" name="depositId">
          <el-input
            v-model="queryDepositId"
            placeholder="请输入存证编号（如20251127001）"
            class="query-input"
          />
          <el-button type="primary" @click="handleQueryByDepositId">查询存证</el-button>
        </el-tab-pane>
        <!-- 文件篡改验证 -->
        <el-tab-pane label="文件篡改验证" name="verify">
          <el-input
            v-model="verifyHash"
            placeholder="请输入待验证文件的SHA256哈希值"
            class="query-input"
          />
          <el-button type="primary" @click="handleVerifyFile">验证文件完整性</el-button>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 查询/验证结果展示 -->
    <div v-if="resultData" class="result-card">
      <h3 class="result-title" :style="{ color: resultSuccess ? '#096dd9' : '#e53e3e' }">
        {{ resultTitle }}
      </h3>
      <pre class="result-content">{{ JSON.stringify(resultData, null, 2) }}</pre>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import {
  queryDepositByHash,
  queryDepositByDepositId,
  verifyFileIntegrity
} from '@/api/blockchainApi';

export default {
  name: 'DepositQuery',
  setup() {
    const activeTab = ref('hash');
    const queryHash = ref('');
    const queryDepositId = ref('');
    const verifyHash = ref('');
    const resultData = ref(null);
    const resultTitle = ref('');
    const resultSuccess = ref(true);

    // 按文件哈希查询
    const handleQueryByHash = async () => {
      if (!queryHash.value) {
        ElMessage.warning('请输入文件哈希值！');
        return;
      }
      try {
        const res = await queryDepositByHash(queryHash.value);
        if (res.success) {
          resultSuccess.value = true;
          resultTitle.value = '存证查询成功';
          resultData.value = res.data;
        } else {
          resultSuccess.value = false;
          resultTitle.value = '存证查询失败';
          resultData.value = { msg: res.msg };
        }
      } catch (err) {
        resultSuccess.value = false;
        resultTitle.value = '查询异常';
        resultData.value = { msg: err.message };
      }
    };

    // 按存证编号查询
    const handleQueryByDepositId = async () => {
      if (!queryDepositByDepositId.value) {
        ElMessage.warning('请输入存证编号！');
        return;
      }
      try {
        const res = await queryDepositByDepositId(queryDepositId.value);
        if (res.success) {
          resultSuccess.value = true;
          resultTitle.value = '存证查询成功';
          resultData.value = res.data;
        } else {
          resultSuccess.value = false;
          resultTitle.value = '存证查询失败';
          resultData.value = { msg: res.msg };
        }
      } catch (err) {
        resultSuccess.value = false;
        resultTitle.value = '查询异常';
        resultData.value = { msg: err.message };
      }
    };

    // 验证文件完整性
    const handleVerifyFile = async () => {
      if (!verifyHash.value) {
        ElMessage.warning('请输入文件哈希值！');
        return;
      }
      try {
        const res = await verifyFileIntegrity(verifyHash.value);
        resultSuccess.value = res.success;
        resultTitle.value = res.msg;
        resultData.value = res.data || { msg: res.msg };
      } catch (err) {
        resultSuccess.value = false;
        resultTitle.value = '验证异常';
        resultData.value = { msg: err.message };
      }
    };

    return {
      activeTab,
      queryHash,
      queryDepositId,
      verifyHash,
      resultData,
      resultTitle,
      resultSuccess,
      handleQueryByHash,
      handleQueryByDepositId,
      handleVerifyFile
    };
  }
};
</script>

<style scoped>
.query-container {
  padding: 30px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.query-tabs {
  max-width: 800px;
  margin: 30px auto;
}

.query-input {
  width: 60%;
  margin-right: 20px;
  display: inline-block;
}

.result-card {
  max-width: 800px;
  margin: 30px auto;
  padding: 25px;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.result-title {
  margin-bottom: 20px;
  font-size: 18px;
}

.result-content {
  white-space: pre-wrap;
  word-break: break-all;
  color: #4a5568;
  font-family: 'Courier New', monospace;
  line-height: 1.8;
}
</style>