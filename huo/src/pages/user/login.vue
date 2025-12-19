<template>
  <view class="login-container">
    <view class="login-form">
      <h2 class="title">欢迎回来</h2>
      <p class="subtitle">请登录您的账号</p>
      
      <!-- 角色选择 -->
      <view class="role-selector">
        <view 
          class="role-item" 
          :class="{ active: selectedRole === 'user' }"
          @click="selectedRole = 'user'"
        >
          用户
        </view>
        <view 
          class="role-item" 
          :class="{ active: selectedRole === 'admin' }"
          @click="selectedRole = 'admin'"
        >
          管理员
        </view>
      </view>
      
      <view class="form-group">
        <input 
          id="username" 
          v-model="form.username" 
          type="text" 
          placeholder="请输入用户名"
          required
        />
        <label for="username" class="floating-label">用户名</label>
        <span class="input-icon">👤</span>
      </view>
      
      <view class="form-group">
        <input 
          id="password" 
          v-model="form.password" 
          type="password" 
          placeholder="请输入密码"
          required
        />
        <label for="password" class="floating-label">密码</label>
        <span class="input-icon">🔒</span>
      </view>
      
      <!-- 管理员登录时显示手机号和身份证号 -->
      <view v-if="selectedRole === 'admin'" class="form-group">
        <input 
          id="phone" 
          v-model="form.phone" 
          type="tel" 
          placeholder="请输入手机号"
          required
        />
        <label for="phone" class="floating-label">手机号</label>
        <span class="input-icon">📱</span>
      </view>
      
      <view v-if="selectedRole === 'admin'" class="form-group">
        <input 
          id="idCard" 
          v-model="form.idCard" 
          type="text" 
          placeholder="请输入身份证号"
          required
        />
        <label for="idCard" class="floating-label">身份证号</label>
        <span class="input-icon">🆔</span>
      </view>
      
      <view class="login-options">
        <label class="remember-me">
          <input type="checkbox" v-model="rememberMe" />
          <span>记住我</span>
        </label>
        <text class="forgot-password">忘记密码？</text>
      </view>
      
      <button class="login-btn" @click="handleLogin">登录</button>
      
      <view class="register-link">
        还没有账号? <text @click="navigateToRegister">立即注册</text>
      </view>
    </view>
  </view>
</template>

<script>
import { login } from '../../utils/auth';

export default {
  data() {
    return {
      selectedRole: 'user', // 默认用户角色
      form: {
        username: '',
        password: '',
        phone: '',
        idCard: ''
      },
      rememberMe: false
    };
  },
  methods: {
    handleLogin() {
      // 表单验证
      if (!this.form.username || !this.form.password) {
        uni.showToast({
          title: '请填写用户名和密码',
          icon: 'none'
        });
        return;
      }
      
      // 管理员登录时需要验证手机号和身份证号
      if (this.selectedRole === 'admin') {
        if (!this.form.phone || !this.form.idCard) {
          uni.showToast({
            title: '管理员登录需填写手机号和身份证号',
            icon: 'none'
          });
          return;
        }
        
        // 手机号格式验证
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(this.form.phone)) {
          uni.showToast({
            title: '请输入11位手机号',
            icon: 'none'
          });
          return;
        }
        
        // 身份证号格式验证
        const idCardRegex = /^\d{18}$|^\d{17}(\d|X|x)$/;
        if (!idCardRegex.test(this.form.idCard)) {
          uni.showToast({
            title: '请输入18位身份证号',
            icon: 'none'
          });
          return;
        }
      }
      
      // 调用登录函数
      const result = login(this.form.username, this.form.password, this.selectedRole, this.form.phone, this.form.idCard);
      
      if (result.success) {
        uni.showToast({
          title: result.message,
          icon: 'success'
        });
        
        // 根据角色跳转到不同页面
        setTimeout(() => {
          if (this.selectedRole === 'user') {
            // 用户登录成功跳转到首页
            uni.switchTab({
              url: '/pages/index/index'
            });
          } else {
            // 管理员登录成功跳转到管理员首页
            uni.navigateTo({
              url: '/pages/admin/index'
            });
          }
        }, 1500);
      } else {
        uni.showToast({
          title: result.message,
          icon: 'none'
        });
      }
    },
    
    navigateToRegister() {
      if (this.selectedRole === 'user') {
        uni.navigateTo({
          url: '/pages/user/register'
        });
      } else {
        uni.navigateTo({
          url: '/pages/admin/register'
        });
      }
    }
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #87CEEB 0%, #E0F7FA 100%);
  padding: 20rpx;
  position: relative;
  overflow: hidden;
}

/* 背景装饰元素 */
.login-container::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
  background-size: 50rpx 50rpx;
  animation: float 20s linear infinite;
}

@keyframes float {
  0% {
    transform: translate(0, 0) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

.login-form {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20rpx);
  padding: 60rpx 50rpx;
  border-radius: 24rpx;
  box-shadow: 0 15rpx 50rpx rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 600rpx;
  position: relative;
  z-index: 1;
}

.title {
  text-align: center;
  font-size: 44rpx;
  margin-bottom: 10rpx;
  color: #333;
  font-weight: bold;
}

.subtitle {
  text-align: center;
  font-size: 26rpx;
  margin-bottom: 50rpx;
  color: #666;
}

.role-selector {
  display: flex;
  margin-bottom: 40rpx;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.1);
}

.role-item {
  flex: 1;
  padding: 24rpx;
  text-align: center;
  font-size: 30rpx;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #f5f5f5;
}

.role-item.active {
  background: linear-gradient(135deg, #a6c0fe 0%, #fda2af 100%);
  color: #fff;
  font-weight: bold;
  box-shadow: 0 4rpx 12rpx rgba(166, 192, 254, 0.4);
}

.form-group {
  position: relative;
  margin-bottom: 40rpx;
}

.form-group input {
  width: 100%;
  padding: 32rpx 24rpx 32rpx 60rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  font-size: 34rpx;
  box-sizing: border-box;
  background-color: rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
  outline: none;
}

.form-group input:focus {
  border-color: #87CEEB;
  box-shadow: 0 0 0 4rpx rgba(135, 206, 235, 0.2);
  background-color: #fff;
}

.floating-label {
  position: absolute;
  left: 60rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 30rpx;
  color: #999;
  transition: all 0.3s ease;
  pointer-events: none;
}

.form-group input:focus + .floating-label,
.form-group input:not(:placeholder-shown) + .floating-label {
  top: 0;
  left: 40rpx;
  font-size: 22rpx;
  color: #87CEEB;
  background-color: #fff;
  padding: 0 10rpx;
  border-radius: 8rpx;
}

.input-icon {
  position: absolute;
  left: 20rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 30rpx;
  color: #999;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40rpx;
  font-size: 26rpx;
  line-height: 1.5;
}

.remember-me {
  display: flex;
  align-items: center;
  color: #666;
  cursor: pointer;
  padding: 8rpx 0;
}

.remember-me input[type="checkbox"] {
  margin-right: 10rpx;
  transform: scale(1.3);
}

.forgot-password {
  color: #87CEEB;
  cursor: pointer;
  padding: 8rpx 0;
}

.login-btn {
  width: 100%;
  padding: 26rpx;
  background: rgba(255, 255, 255, 0.9);
  color: #87CEEB;
  border: 2rpx solid #87CEEB;
  border-radius: 16rpx;
  font-size: 34rpx;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.1);
}

.login-btn:active {
  transform: translateY(2rpx);
  opacity: 0.9;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.register-link {
  text-align: center;
  margin-top: 30rpx;
  font-size: 26rpx;
  color: #666;
}

.register-link text {
  color: #87CEEB;
  cursor: pointer;
  font-weight: bold;
}
</style>