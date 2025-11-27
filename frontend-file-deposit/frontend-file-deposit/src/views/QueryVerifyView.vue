<template>
  <div class="query-verify-container">
    <!-- 页面标题 -->
    <el-page-header content="存证查询与文件验证系统" class="page-header" />

    <!-- 角色提示栏 -->
    <div class="role-info" v-if="userRole">
      <el-tag :type="userRole === 'uploader' ? 'primary' : 'success'">
        当前角色：{{ userRole === 'uploader' ? '上传者' : '验证者' }}
      </el-tag>
      <span class="role-desc">
        {{ 
          userRole === 'uploader' 
            ? '可查询本人上传文件的存证记录（按存证编号/文件名）' 
            : '可查询存证记录+验证文件完整性' 
        }}
      </span>
    </div>

    <!-- 核心功能标签页 -->
    <el-tabs 
      v-model="activeTab" 
      type="card" 
      class="function-tabs"
      @tab-click="handleTabChange"
    >
      <!-- 标签页1：按存证编号查询 -->
      <el-tab-pane label="按存证编号查询" name="depositId">
        <div class="query-form">
          <el-input
            v-model="queryForm.depositId"
            placeholder="请输入存证编号（示例：20251127001）"
            class="query-input"
            clearable
          />
          <el-button type="primary" @click="handleQuery('depositId')">立即查询</el-button>
        </div>
      </el-tab-pane>

      <!-- 标签页2：按文件名查询（仅上传者） -->
      <el-tab-pane label="按文件名查询" name="fileName" v-if="userRole === 'uploader'">
        <div class="query-form">
          <el-input
            v-model="queryForm.fileName"
            placeholder="请输入文件名（支持模糊匹配）"
            class="query-input"
            clearable
          />
          <el-button type="primary" @click="handleQuery('fileName')">立即查询</el-button>
          <el-tag type="info" size="small" class="tip-tag">仅查询本人上传文件</el-tag>
        </div>
      </el-tab-pane>

      <!-- 标签页3：文件完整性验证（仅验证者） -->
      <el-tab-pane label="文件完整性验证" name="verify" v-if="userRole === 'verifier'">
        <div class="query-form">
          <el-input
            v-model="queryForm.fileHash"
            placeholder="请输入待验证文件的SHA256哈希值"
            class="query-input"
            clearable
          />
          <el-button type="primary" @click="handleVerify">开始验证</el-button>
          <el-tag type="warning" size="small" class="tip-tag">哈希不匹配则文件被篡改</el-tag>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 结果展示区域 -->
    <div v-if="showResult" class="result-container">
      <div v-if="activeTab !== 'verify'" class="result-card">
        <el-divider content="查询结果" />
        <div v-if="queryResult.success && queryResult.data.length > 0">
          <el-table 
            :data="queryResult.data" 
            border 
            stripe 
            :header-cell-style="{ background: '#f8f9fa' }"
          >
            <el-table-column label="存证编号" prop="depositRecord.id" align="center" width="180" />
            <el-table-column label="文件名" prop="depositRecord.fileName" align="center" width="250" />
            <el-table-column label="文件类型" prop="depositRecord.fileType" align="center" width="120" />
            <el-table-column label="文件大小(KB)" prop="depositRecord.fileSize" align="center" width="150" />
            <el-table-column label="存证时间" prop="depositRecord.depositTime" align="center" width="220" />
            <el-table-column label="区块索引" prop="blockInfo.index" align="center" width="120" />
          </el-table>
        </div>
        <div v-else class="empty-result">
          <p class="empty-desc">暂无匹配数据</p>
        </div>
      </div>

      <!-- 验证结果展示 -->
      <div v-if="activeTab === 'verify'" class="verify-result-card">
        <el-divider content="验证结果" />
        <div class="verify-result">
          <div class="result-content">
            <h3 class="result-title" :style="{ color: verifyResult.success ? '#48bb78' : '#e53e3e' }">
              {{ verifyResult.success ? '验证通过：文件未被篡改' : '验证失败：文件已被篡改或无此存证' }}
            </h3>
            <div v-if="verifyResult.success" class="result-detail">
              <el-descriptions title="存证信息" :column="2" border>
                <el-descriptions-item label="存证编号">{{ verifyResult.data.depositRecord.id }}</el-descriptions-item>
                <el-descriptions-item label="文件名">{{ verifyResult.data.depositRecord.fileName }}</el-descriptions-item>
                <el-descriptions-item label="原始哈希值">{{ verifyResult.data.depositRecord.fileHash }}</el-descriptions-item>
                <el-descriptions-item label="区块哈希">{{ verifyResult.data.blockInfo.blockHash }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

// 只导入核心API，无任何图标相关代码
import { 
  queryByDepositId, queryByFileName, verifyFileIntegrity, 
  getUserRole 
} from '@/api/queryVerifyApi';
import { isLogin } from '@/utils/auth';

export default {
  name: 'QueryVerifyView',
  components: {}, // 无任何组件注册
  setup() {
    const router = useRouter();
    const userRole = ref('');
    const activeTab = ref('depositId');
    const showResult = ref(false);
    const queryResult = ref({ success: false, data: [] });
    const verifyResult = ref({ success: false, data: {} });

    const queryForm = ref({
      depositId: '',
      fileName: '',
      fileHash: ''
    });

    // 页面加载时检查登录状态
    onMounted(() => {
      if (!isLogin()) {
        ElMessage.warning('请先登录');
        router.push('/login');
        return;
      }
      // 获取当前用户角色
      userRole.value = getUserRole() || 'uploader';
    });

    // 切换标签页重置表单
    const handleTabChange = () => {
      showResult.value = false;
      queryForm.value.depositId = '';
      queryForm.value.fileName = '';
      queryForm.value.fileHash = '';
    };

    // 处理查询逻辑
    const handleQuery = async (queryType) => {
      showResult.value = false;
      try {
        let res;
        if (queryType === 'depositId') {
          if (!queryForm.value.depositId.trim()) {
            ElMessage.warning('请输入存证编号');
            return;
          }
          res = await queryByDepositId(queryForm.value.depositId.trim());
        } else if (queryType === 'fileName') {
          if (!queryForm.value.fileName.trim()) {
            ElMessage.warning('请输入文件名');
            return;
          }
          res = await queryByFileName(queryForm.value.fileName.trim());
        }

        queryResult.value = res || { success: false, data: [] };
        showResult.value = true;
      } catch (err) {
        console.error('查询失败：', err);
        ElMessage.error('查询失败，请重试');
      }
    };

    // 处理验证逻辑
    const handleVerify = async () => {
      showResult.value = false;
      try {
        if (!queryForm.value.fileHash.trim()) {
          ElMessage.warning('请输入文件SHA256哈希值');
          return;
        }
        const res = await verifyFileIntegrity(queryForm.value.fileHash.trim());
        verifyResult.value = res || { success: false };
        showResult.value = true;
      } catch (err) {
        console.error('验证失败：', err);
        ElMessage.error('验证失败，请重试');
      }
    };

    return {
      userRole,
      activeTab,
      showResult,
      queryResult,
      verifyResult,
      queryForm,
      handleTabChange,
      handleQuery,
      handleVerify
    };
  }
};
</script>

<style scoped>
.query-verify-container {
  padding: 20px 30px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 20px;
}

.role-info {
  margin-bottom: 25px;
  padding: 12px 16px;
  background-color: #e8f4f8;
  border-radius: 8px;
  display: flex;
  align-items: center;
}

.role-desc {
  margin-left: 12px;
  color: #4a5568;
  font-size: 14px;
}

.function-tabs {
  max-width: 1400px;
  margin: 0 auto 30px;
}

.query-form {
  display: flex;
  align-items: center;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.query-input {
  flex: 1;
  max-width: 600px;
  margin-right: 16px;
}

.tip-tag {
  margin-left: 12px;
}

.result-container {
  max-width: 1400px;
  margin: 0 auto;
}

.result-card, .verify-result-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  padding: 20px;
}

.el-divider {
  margin: 0 0 20px 0;
}

.empty-result {
  text-align: center;
  padding: 80px 20px;
  color: #718096;
}

.empty-desc {
  margin-top: 16px;
  font-size: 16px;
}

.verify-result {
  padding: 20px 0;
}

.result-title {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 20px;
}

.result-detail {
  margin-top: 20px;
}

@media (max-width: 768px) {
  .query-form {
    flex-direction: column;
  }
  .query-input {
    max-width: 100%;
    margin-right: 0;
    margin-bottom: 16px;
  }
}
</style>