<template>
  <div class="reset-pwd-container">
    <el-card class="reset-pwd-card">
      <h2 class="reset-pwd-title">密码重置</h2>
      <el-form :model="resetPwdForm" :rules="resetPwdRules" ref="resetPwdFormRef" label-width="80px">
        <el-form-item label="手机号" prop="phone">
          <el-input 
            v-model="resetPwdForm.phone" 
            placeholder="请输入注册时的手机号"
            type="tel"
            maxlength="11"
            show-word-limit
            @input="trimPhone"
          ></el-input>
        </el-form-item>

        <!-- 🌟 新增：4位Canvas图形验证码 -->
        <el-form-item label="验证码" prop="code">
          <el-row :gutter="10">
            <el-col :span="16">
              <el-input
               v-model="resetPwdForm.code" placeholder="请输入4位验证码，区分大小写"
                @input="preventSpace('code')"
               ></el-input>
            </el-col>
            <el-col :span="8">
              <!-- Canvas验证码展示区 -->
              <canvas 
                ref="codeCanvas" 
                width="120" 
                height="40" 
                class="code-canvas"
                @click="generateCanvasCode"
                title="点击刷新验证码"
              ></canvas>
            </el-col>
          </el-row>
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input 
            v-model="resetPwdForm.newPassword" 
            type="password" 
            placeholder="6-20位，支持字母、数字及!@#$%&*()_+."
            maxlength="20"
            show-word-limit
            show-password
            @input="preventSpace('newPassword')"
          ></el-input>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="resetPwdForm.confirmPassword" 
            type="password" 
            placeholder="请再次输入新密码"
            maxlength="20"
            show-word-limit
            show-password
            @input="preventSpace('confirmPassword')"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleResetPwd" class="reset-pwd-btn">重置密码</el-button>
          <el-button type="text" @click="goToLogin">返回登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import { ElMessage } from 'element-plus';

export default {
  name: 'ResetPwdView',
  setup() {
    const router = useRouter();
    const userStore = useUserStore();
    const resetPwdFormRef = ref(null);
    const codeCanvas = ref(null); // 新增：Canvas元素引用
    const graphicCode = ref(''); // 新增：存储生成的4位验证码（用于校验）

    // 密码重置表单数据
    const resetPwdForm = ref({
      phone: '',
      code: '', // 验证码输入
      newPassword: '',
      confirmPassword: ''
    });

     // 手机号实时去空格（避免用户误输入空格导致格式错误）
    const trimPhone = () => {
      resetPwdForm.value.phone = resetPwdForm.value.phone.trim();
    };

     // 🌟 核心：仅禁止输入空格（不让空格显示在输入框）
    const preventSpace = (field) => {
      // 替换所有空格为空字符串（禁止输入空格）
      resetPwdForm.value[field] = resetPwdForm.value[field].replace(/\s+/g, '');
    };

    //  新增：生成4位Canvas图形验证码
    const generateCanvasCode = () => {
      const canvas = codeCanvas.value;
      const ctx = canvas.getContext('2d');
      
      // 1. 清空画布（防止字符叠加）
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 2. 绘制背景（浅灰+噪点，增加干扰）
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // 背景噪点
      for (let i = 0; i < 50; i++) {
        ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.1)`;
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, 2 * Math.PI);
        ctx.fill();
      }

      // 3. 生成4位随机字符（字母+数字）
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      let code = '';
      for (let i = 0; i < 4; i++) { // 循环4次，生成4位
        const char = chars[Math.floor(Math.random() * chars.length)];
        code += char;

        // 随机字符样式（颜色、大小、旋转角度）
        ctx.fillStyle = `hsl(${Math.random() * 360}, 60%, 40%)`; // 随机色相
        ctx.font = `${18 + Math.random() * 4}px Arial, sans-serif`; // 随机大小
        ctx.textBaseline = 'middle';
        const rotateAngle = (Math.random() - 0.5) * 0.5; // 随机旋转（-30°~30°）
        const x = 20 + i * 25; // 字符均匀分布
        const y = canvas.height / 2;

        // 旋转绘制字符（避免机器识别）
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotateAngle);
        ctx.fillText(char, 0, 0);
        ctx.restore();
      }

      // 4. 绘制3条干扰线（进一步增加干扰）
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
        ctx.lineWidth = 1;
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();
      }

      // 5. 存储验证码（用于前端校验）
      graphicCode.value = code;
    };

    // 新增：页面加载时生成第一个验证码
    onMounted(() => {
      generateCanvasCode();
    });


    // 表单校验规则,新增 code 字段校验
    const resetPwdRules = ref({
      phone: [
        { required: true, message: '请输入手机号', trigger: 'blur' }, 
        { pattern: /^1[3-9]\d{9}$/, message: '请输入合法手机号', trigger: 'blur' }
      ],
      code: [
        { required: true, message: '请输入验证码', trigger: 'blur' },
        { min: 4, max: 4, message: '验证码长度为4位，区分大小写', trigger: 'blur' }, // 限制4位
        { 
          validator: (rule, value, callback) => {
            if (value !== graphicCode.value) {
              callback(new Error('验证码输入错误！'));
              generateCanvasCode(); // 错误后自动刷新验证码
            } else {
              callback(); // 校验通过
            }
          },
          trigger: 'blur'
        }
      ],
      newPassword: [
        { required: true, message: '请输入新密码', trigger: ['blur', 'input']},         
        { min: 6, max: 20, message: '6-20位，支持字母、数字及!@#$%&*()_+.', trigger: ['blur', 'input']},
        // 非法字符校验：提示统一文案
        {
          pattern: /^[A-Za-z0-9!@#$%&*()_+.]{0,20}$/, // 允许空值（输入过程中），最大20位
          message: '6-20位，支持字母、数字及!@#$%&*()_+.',
          trigger: ['blur', 'input'] // 输入时实时提示
        }
        ],
      confirmPassword: [
        { required: true, message: '请确认新密码', trigger: ['blur', 'input'] },
        // 非法字符校验：提示统一文案
        {
          pattern: /^[A-Za-z0-9!@#$%&*()_+.]{0,20}$/,
          message: '6-20位，支持字母、数字及!@#$%&*()_+.',
          trigger: ['blur', 'input']
        },
        { 
          validator: (rule, value, callback) => {
            if (value !== resetPwdForm.value.newPassword) {
              callback(new Error('两次输入的密码不一致！'));
            } else {
              callback();
            }
          },
          trigger: ['blur', 'input']
        }
      ]
    });

    // 处理密码重置
const handleResetPwd = async () => {
  try {
    // 1. 表单校验（正确，保留）
    await resetPwdFormRef.value.validate();
    
    // 2. 关键修改：传递对象（phone、code、newPassword），不是两个独立参数
    const result = await userStore.resetPassword({
          phone: resetPwdForm.value.phone,
          code: resetPwdForm.value.code,
          newPassword: resetPwdForm.value.newPassword,
          confirmNewPassword: resetPwdForm.value.confirmPassword // 关键：传递确认密码
        });

    // 3. 不需要再弹成功弹窗（userStore 中已经弹了，避免重复）
    if (result) {
      // userStore 中已调用 logout() 跳登录页，这里可以省略，或保留冗余保障
      setTimeout(() => router.push('/login'), 1500);
    }
  } catch (err) {
    // 4. 错误弹窗（保留，捕获表单校验或接口调用的错误）
    ElMessage.error(err.message || '密码重置失败，请重试');
  }
};

    // 跳登录页面
    const goToLogin = () => {
      router.push('/login');
    };

    return {
      resetPwdForm,
      resetPwdRules,
      resetPwdFormRef,
      codeCanvas, // 🌟 导出Canvas引用
      generateCanvasCode, // 🌟 导出生成验证码方法
      trimPhone,
      preventSpace, // 导出禁止空格方法
      handleResetPwd,
      goToLogin
    };
  }
};
</script>

<style scoped>
.reset-pwd-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f8f9fa;
}

.reset-pwd-card {
  width: 450px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.reset-pwd-title {
  text-align: center;
  color: #1989fa;
  margin-bottom: 20px;
}

.reset-pwd-btn {
  width: 100%;
}

/* 🌟 新增：Canvas验证码样式 */
.code-canvas {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  background-color: #f8f9fa;
  transition: background-color 0.2s;
}

/* 鼠标悬浮时轻微变色，提示可点击 */
.code-canvas:hover {
  background-color: #f3f4f6;
}

/* 调整验证码行的表单项间距，和其他项一致 */
.el-form-item:nth-child(2) {
  margin-bottom: 20px;
}
/* 调整表单项间距 */
.el-form-item {
  margin-bottom: 20px;
}

.el-input__placeholder {
  color: #9ca3af !important;
  font-size: 13px !important;
}
</style>