<template>
  <el-card class="verify-card">
    <div slot="header">
      <h2>存证验证</h2>
      <p class="tip">输入存证编号和文件哈希值，验证文件是否被篡改</p>
    </div>

    <el-form :model="verifyForm" :rules="verifyRules" ref="verifyFormRef" label-width="120px">
      <el-form-item label="存证编号" prop="depositId">
        <el-input 
          v-model="verifyForm.depositId" 
          placeholder="请输入存证时生成的编号"
          clearable
        ></el-input>
      </el-form-item>

      <el-form-item label="文件哈希值" prop="fileHash">
        <el-input 
          v-model="verifyForm.fileHash" 
          placeholder="请输入待验证文件的SHA-256哈希值"
          clearable
          type="textarea"
          rows="2"
        ></el-input>
      </el-form-item>

      <el-form-item>
        <el-button 
          type="primary" 
          icon="Search" 
          @click="handleVerify"
        >
          开始验证
        </el-button>
        <el-button 
          type="default" 
          @click="resetForm"
          style="margin-left: 10px"
        >
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 验证结果 -->
    <el-card 
      v-if="verifyResult !== null" 
      class="result-card"
      :border="false"
    >
      <div v-if="verifyResult" class="success-result">
        <el-icon color="#52c41a" size="30"><CheckCircle /></el-icon>
        <div class="result-text">
          <h3>验证成功</h3>
          <p>文件未被篡改，哈希值与存证记录一致</p>
        </div>
      </div>
      <div v-else class="fail-result">
        <el-icon color="#f5222d" size="30"><CloseCircle /></el-icon>
        <div class="result-text">
          <h3>验证失败</h3>
          <p>文件已被篡改，或存证编号不存在</p>
        </div>
      </div>
    </el-card>
  </el-card>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, CheckCircle, CloseCircle } from '@element-plus/icons-vue';
// 引入验证接口
import { verifyDeposit } from '../api/deposit';

// 表单数据
const verifyForm = reactive({
  depositId: '',
  fileHash: ''
});

// 表单验证规则
const verifyRules = {
  depositId: [
    { required: true, message: '请输入存证编号', trigger: 'blur' }
  ],
  fileHash: [
    { required: true, message: '请输入文件哈希值', trigger: 'blur' },
    { min: 64, max: 64, message: 'SHA-256哈希值长度为64位', trigger: 'blur' }
  ]
};

// 表单引用
const verifyFormRef = ref(null);

// 验证结果（null-未验证，true-成功，false-失败）
const verifyResult = ref(null);

// 开始验证
const handleVerify = async () => {
  // 表单验证
  verifyFormRef.value.validate(async (valid) => {
    if (!valid) return;

    try {
      // 调用验证接口
      const res = await verifyDeposit(verifyForm.depositId, verifyForm.fileHash);
      if (res.success) {
        // 后端返回"文件未篡改"则验证成功
        verifyResult.value = res.data === '文件未篡改';
      } else {
        ElMessage.error('验证失败：' + res.msg);
        verifyResult.value = null;
      }
    } catch (err) {
      console.error('验证接口调用失败：', err);
      verifyResult.value = null;
    }
  });
};

// 重置表单
const resetForm = () => {
  verifyFormRef.value.resetFields();
  verifyResult.value = null;
};
</script>

<style scoped>
.verify-card {
  max-width: 800px;
  margin: 0 auto;
}

.tip {
  color: #666;
  font-size: 14px;
  margin-top: 5px;
}

.result-card {
  margin-top: 20px;
  padding: 20px;
}

.success-result {
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 4px;
}

.fail-result {
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
}

.result-text {
  margin-left: 15px;
}

.result-text h3 {
  margin: 0 0 5px 0;
  font-size: 16px;
}

.result-text p {
  margin: 0;
  color: #666;
}
</style>