<template>
  <div class="query-container">
    <!-- 头部：返回按钮 + 页面标题 -->
    <div class="header-bar">
      <el-button type="text" @click="$router.push('/dashboard')" class="back-btn">
        ← Back
      </el-button>
      <h2 class="page-title">上传者 - 我的文件查询</h2>
    </div>

    <!-- 功能标签页 -->
    <el-tabs v-model="activeTab" type="card" class="function-tabs">
      <!-- 我的文件列表（默认显示） -->
      <el-tab-pane label="我的文件列表" name="fileList">
        <div class="list-header">
          <el-button type="primary" icon="Refresh" @click="fetchMyFiles">刷新列表</el-button>
          <span class="file-count">共 {{ fileList.length }} 个文件</span>
        </div>
        <div class="result-card">
          <el-table 
            :data="fileList" 
            border 
            stripe 
            :loading="isLoading"
            empty-text="暂无上传文件"
          >
            <!-- 序号：按上传时间正序生成（1、2、3...） -->
            <el-table-column label="序号" type="index" align="center" width="80" :index="(index) => index + 1" />
            <el-table-column label="存证ID" prop="depositId" align="center" width="220" />
            <el-table-column label="文件名" prop="fileName" align="center" />
            <el-table-column label="文件类型" prop="fileType" align="center" width="120" />
            <el-table-column label="文件大小(KB)" prop="fileSize" align="center" width="150" />
            <!-- 新增：哈希值列 -->
            <el-table-column label="SHA256哈希值" prop="fileHash" align="center" min-width="280" />
            <!-- 格式化存证时间 -->
            <el-table-column label="存证时间" align="center" width="220">
              <template #default="scope">
                {{ formatTime(scope.row.depositTime) }}
              </template>
            </el-table-column>
            <el-table-column label="区块索引" prop="blockIndex" align="center" width="120" /> <!-- 新增 -->
            <el-table-column label="区块哈希" prop="blockHash" align="center" min-width="280" /> <!-- 新增 -->
            <el-table-column label="前一区块哈希" prop="prevBlockHash" align="center" min-width="280" /> <!-- 新增 -->
            <el-table-column label="操作" align="center" width="120">
              <template #default="scope">
                <el-button type="text" @click="viewDetail(scope.row)">查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 按文件名查询 -->
      <el-tab-pane label="按文件名查询" name="queryByName">
        <div class="query-form">
          <el-input
            v-model="queryForm.fileName"
            placeholder="输入文件名（支持模糊匹配）"
            class="query-input"
            clearable
          />
          <el-button type="primary" @click="queryByFileName">立即查询</el-button>
        </div>
        <div v-if="nameQueryResult.show" class="result-card">
          <el-divider content="查询结果" />
          <el-table 
            :data="nameQueryResult.data" 
            border 
            stripe
            empty-text="未找到匹配的文件（仅显示您的文件）"
          >
            <el-table-column label="存证ID" prop="depositId" align="center" />
            <el-table-column label="文件名" prop="fileName" align="center" />
            <el-table-column label="文件类型" prop="fileType" align="center" />
            <el-table-column label="SHA256哈希值" prop="fileHash" align="center" min-width="280" />
            <el-table-column label="存证时间" align="center">
              <template #default="scope">
                {{ formatTime(scope.row.depositTime) }}
              </template>
            </el-table-column>
            <el-table-column label="区块索引" prop="blockIndex" align="center" width="120" /> <!-- 新增 -->
            <el-table-column label="区块哈希" prop="blockHash" align="center" min-width="280" /> <!-- 新增 -->
            <el-table-column label="前一区块哈希" prop="prevBlockHash" align="center" min-width="280" /> <!-- 新增 -->
            <el-table-column label="操作" align="center">
              <template #default="scope">
                <el-button type="text" @click="viewDetail(scope.row)">查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 按存证ID查询 -->
      <el-tab-pane label="按存证ID查询" name="queryById">
        <div class="query-form">
          <el-input
            v-model="queryForm.depositId"
            placeholder="输入存证ID（如：20251129001）"
            class="query-input"
            clearable
          />
          <el-button type="primary" @click="queryById">立即查询</el-button>
        </div>
        <div v-if="idQueryResult.show" class="result-card">
          <el-divider content="查询结果" />
          <div v-if="idQueryResult.data" class="detail-card">
            <!-- 修复：用插槽渲染，替代 content 属性 -->
            <el-descriptions :column="2" border>
              <el-descriptions-item label="存证ID">
                {{ idQueryResult.data.depositId }}
              </el-descriptions-item>
              <el-descriptions-item label="文件名">
                {{ idQueryResult.data.fileName }}
              </el-descriptions-item>
              <el-descriptions-item label="文件类型">
                {{ idQueryResult.data.fileType }}
              </el-descriptions-item>
              <el-descriptions-item label="文件大小(KB)">
                {{ idQueryResult.data.fileSize }}
              </el-descriptions-item>
              <el-descriptions-item label="文件哈希">
                {{ idQueryResult.data.fileHash }}
              </el-descriptions-item>
              <el-descriptions-item label="存证时间">
                {{ formatTime(idQueryResult.data.depositTime) }}
              </el-descriptions-item>
              <el-descriptions-item label="区块索引">
                {{ idQueryResult.data.blockIndex }}
              </el-descriptions-item>
              <el-descriptions-item label="区块哈希">
                {{ idQueryResult.data.blockHash }}
              </el-descriptions-item>
              <el-descriptions-item label="前一区块哈希">
                {{ idQueryResult.data.prevBlockHash }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
          <div v-else class="empty-result">
            <p>未找到该存证ID（仅能查询您的文件）</p>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
// 导入API（替换为你的实际API路径）
import { 
  getUserFileList, 
  queryFileByName, 
  queryFileById 
} from '@/api/queryApi';
import { isLogin } from '@/utils/auth';

export default {
  name: 'QueryView',
  setup() {
    const router = useRouter();
    const activeTab = ref('fileList');
    const isLoading = ref(false);

    // 查询表单
    const queryForm = ref({
      fileName: '',
      depositId: ''
    });

    // 我的文件列表
    const fileList = ref([]);

    // 按文件名查询结果
    const nameQueryResult = ref({
      show: false,
      data: []
    });

    // 按存证ID查询结果
    const idQueryResult = ref({
      show: false,
      data: null
    });

    // 时间格式化函数（将ISO格式转为本地时间，如：2025/11/27 19:50:30）
// QueryView.vue 中的 formatTime 函数
  const formatTime = (isoTimeStr) => {
  if (!isoTimeStr) return '无';
  const date = new Date(isoTimeStr); // ISO 字符串可直接解析
  if (isNaN(date.getTime())) {
    console.error('无效的ISO时间：', isoTimeStr);
    return '无效时间';
  }
  // 格式化显示为本地时间（如 2025/11/29 16:30:00）
  return date.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
};

    // 页面加载时获取文件列表
    onMounted(() => {
      if (!isLogin()) {
        router.push('/login');
        return;
      }
      fetchMyFiles();
    });

    // 刷新我的文件列表
    const fetchMyFiles = async () => {
      isLoading.value = true;
      try {
        const res = await getUserFileList();
        // 后端已按上传时间正序返回，直接赋值即可
        fileList.value = res.success ? res.data : [];
      } catch (err) {
        fileList.value = [];
        ElMessage.error('获取文件列表失败，请重试');
        console.error(err);
      } finally {
        isLoading.value = false;
      }
    };

    // 按文件名查询
    const queryByFileName = async () => {
      if (!queryForm.value.fileName.trim()) {
        ElMessage.warning('请输入文件名');
        return;
      }
      isLoading.value = true;
      try {
        const res = await queryFileByName(queryForm.value.fileName.trim());
        nameQueryResult.value = {
          show: true,
          data: res.success ? res.data : []
        };
      } catch (err) {
        nameQueryResult.value = { show: true, data: [] };
        ElMessage.error('查询失败，请重试');
        console.error(err);
      } finally {
        isLoading.value = false;
      }
    };

    // 🔥 重点修改：按存证ID查询（适配后端嵌套格式）
    // 按存证ID查询（已添加完整日志，直接替换）
const queryById = async () => {
  // 1. 校验输入，打印日志
  if (!queryForm.value.depositId.trim()) {
    console.log('❌ 前端查询：未输入存证ID，提示用户');
    ElMessage.warning('请输入存证ID');
    return;
  }
  isLoading.value = true;

  try {
    // 2. 打印输入的存证ID（确认传参正确）
    const inputDepositId = queryForm.value.depositId.trim();
    console.log('✅ 前端查询：输入的存证ID =', inputDepositId);

    // 3. 调用接口，打印请求发送状态
    console.log('🔄 前端查询：正在发送请求到后端...');
    const res = await queryFileById(inputDepositId);

    // 4. 打印后端返回的完整响应（最关键！确认是否收到数据）
    console.log('✅ 前端查询：收到后端响应 =', res);
    console.log('✅ 后端响应 success =', res.success);
    console.log('✅ 后端响应 data =', res.data);

    // 5. 处理成功响应
    if (res.success && res.data) {
      // 打印嵌套字段是否存在（避免字段缺失）
      console.log('✅ 后端 data 中 depositRecord =', res.data.depositRecord);
      console.log('✅ 后端 data 中 blockInfo =', res.data.blockInfo);

      // 格式转换（和之前一致，加日志）
      const flatData = {
        depositId: res.data.depositRecord.id,
        fileName: res.data.depositRecord.fileName,
        fileType: res.data.depositRecord.fileType,
        fileSize: res.data.depositRecord.fileSize,
        fileHash: res.data.depositRecord.fileHash,
        depositTime: res.data.depositRecord.depositTime,
        blockIndex: res.data.blockInfo.index,
        blockHash: res.data.blockInfo.blockHash,
        prevBlockHash: res.data.blockInfo.prevBlockHash
      };
      console.log('✅ 格式转换完成：flatData =', flatData);

      // 赋值给渲染变量，打印最终结果
      idQueryResult.value = {
        show: true,
        data: flatData
      };
      console.log('✅ 渲染数据赋值完成：idQueryResult =', idQueryResult.value);

    } else {
      // 6. 处理后端返回的失败（如未查到数据）
      console.log('❌ 前端查询：后端返回失败，msg =', res.msg);
      idQueryResult.value = { show: true, data: null };
      ElMessage.warning('未查询到该存证ID的记录');
    }

  } catch (err) {
    // 7. 捕获前端异常（如接口报错、网络问题）
    console.error('❌ 前端查询：发生异常 =', err);
    console.error('❌ 异常详情：', err.message, err.stack);
    idQueryResult.value = { show: true, data: null };
    ElMessage.error('查询失败，请重试');
  } finally {
    isLoading.value = false;
    console.log('🔚 前端查询：流程结束');
  }
};
    // 查看文件详情
    const viewDetail = (row) => {
      queryForm.value.depositId = row.depositId;
      activeTab.value = 'queryById';
      queryById(); // 自动查询详情
    };

    return {
      activeTab,
      isLoading,
      queryForm,
      fileList,
      nameQueryResult,
      idQueryResult,
      fetchMyFiles,
      queryByFileName,
      queryById,
      viewDetail,
      formatTime // 导出时间格式化函数
    };
  }
};
</script>

<style scoped>
.query-container {
  padding: 20px 30px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.header-bar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
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

.function-tabs {
  max-width: 1600px;
  margin: 0 auto;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.file-count {
  color: #4a5568;
  font-size: 14px;
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

.result-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 20px;
}

.empty-result {
  text-align: center;
  padding: 80px 20px;
  color: #718096;
  font-size: 16px;
}

.detail-card {
  margin-top: 10px;
}

/* 适配哈希值列的换行问题 */
.el-table .cell {
  white-space: normal !important;
  word-break: break-all;
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
  .detail-card {
    overflow-x: auto;
  }
  /* 移动端隐藏哈希值列（避免拥挤） */
  .el-table-column[label="SHA256哈希值"] {
    display: none !important;
  }
}
</style>

