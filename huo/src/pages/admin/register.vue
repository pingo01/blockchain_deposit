<template>
  <view class="register-container">
    <view class="register-form">
      <h2 class="title">管理员注册</h2>
      <p class="subtitle">创建管理员账号</p>
      
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
      
      <view class="form-group">
        <input 
          id="confirmPassword" 
          v-model="form.confirmPassword" 
          type="password" 
          placeholder="请确认密码"
          required
        />
        <label for="confirmPassword" class="floating-label">确认密码</label>
        <span class="input-icon">🔒</span>
      </view>
      
      <view class="form-group">
        <input 
          id="name" 
          v-model="form.name" 
          type="text" 
          placeholder="请输入真实姓名"
          required
        />
        <label for="name" class="floating-label">真实姓名</label>
        <span class="input-icon">📋</span>
      </view>
      
      <view class="form-group">
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
      
      <view class="form-group">
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
      
      <button class="register-btn" @click="handleRegister">注册</button>
      
      <view class="login-link">
        已有账号? <text @click="navigateToLogin">立即登录</text>
      </view>
    </view>
  </view>
</template>

<script>
import { registerAdmin } from '../../utils/auth';

export default {
  data() {
    return {
      form: {
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        phone: '',
        idCard: ''
      }
    };
  },
  methods: {
    handleRegister() {
      // 表单验证
      if (!this.form.username || !this.form.password || !this.form.confirmPassword || !this.form.name || !this.form.phone || !this.form.idCard) {
        uni.showToast({
          title: '请填写所有必填项',
          icon: 'none'
        });
        return;
      }
      
      // 密码确认验证
      if (this.form.password !== this.form.confirmPassword) {
        uni.showToast({
          title: '两次输入的密码不一致',
          icon: 'none'
        });
        return;
      }
      
      // 密码长度验证
      if (this.form.password.length < 6) {
        uni.showToast({
          title: '密码长度不能少于6位',
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
      
      // 调用注册函数
      const result = registerAdmin(this.form.username, this.form.password, this.form.name, this.form.phone, this.form.idCard);
      
      if (result.success) {
        uni.showToast({
          title: result.message,
          icon: 'success'
        });
        
        // 注册成功后跳转到登录页面
        setTimeout(() => {
          uni.navigateTo({
            url: '/pages/user/login'
          });
        }, 1500);
      } else {
        uni.showToast({
          title: result.message,
          icon: 'none'
        });
      }
    },
    
    navigateToLogin() {
      uni.navigateTo({
        url: '/pages/user/login'
      });
    }
  }
};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #a6c0fe 0%, #fda2af 100%);
  padding: 20rpx;
  position: relative;
  overflow: hidden;
}

/* 背景装饰元素 */
.register-container::before {
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

.register-form {
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
  border-color: #a6c0fe;
  box-shadow: 0 0 0 4rpx rgba(166, 192, 254, 0.2);
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
  color: #a6c0fe;
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

.register-btn {
  width: 100%;
  padding: 26rpx;
  background: linear-gradient(135deg, #a6c0fe 0%, #fda2af 100%);
  color: #fff;
  border: none;
  border-radius: 16rpx;
  font-size: 34rpx;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8rpx 25rpx rgba(166, 192, 254, 0.3);
}

.register-btn:active {
  transform: translateY(2rpx);
  box-shadow: 0 4rpx 15rpx rgba(166, 192, 254, 0.3);
}

.login-link {
  text-align: center;
  margin-top: 30rpx;
  font-size: 26rpx;
  color: #666;
}

.login-link text {
  color: #a6c0fe;
  cursor: pointer;
  font-weight: bold;
}
</style>