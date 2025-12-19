<template>
  <view class="index-container">
    <view class="index-content">
      <!-- Logo -->
      <div class="logo-container">
        <svg class="logo" width="180" height="180" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#87CEEB" />
              <stop offset="100%" style="stop-color:#E0F7FA" />
            </linearGradient>
          </defs>
          <!-- 圆形背景 -->
          <circle cx="50" cy="50" r="45" fill="url(#logoGradient)" />
          <!-- 抽象公路线条 -->
          <path d="M20,60 L80,40" stroke="white" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
          <path d="M20,70 L80,50" stroke="white" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
          <!-- 汽车图形 -->
          <rect x="35" y="55" width="30" height="15" rx="3" fill="white" opacity="0.9"/>
          <circle cx="40" cy="70" r="5" fill="white" opacity="0.9"/>
          <circle cx="60" cy="70" r="5" fill="white" opacity="0.9"/>
          <!-- 汽车窗户 -->
          <rect x="38" y="58" width="8" height="6" rx="2" fill="#87CEEB" opacity="0.8"/>
          <rect x="48" y="58" width="14" height="6" rx="2" fill="#87CEEB" opacity="0.8"/>
          <!-- 汽车顶部弧线 -->
          <path d="M35,55 C35,48 65,48 65,55" stroke="white" stroke-width="2" fill="none" opacity="0.9"/>
          <!-- 太阳或装饰元素 -->
          <circle cx="70" cy="30" r="8" fill="white" opacity="0.8"/>
          <line x1="70" y1="20" x2="70" y2="26" stroke="white" stroke-width="2" opacity="0.8"/>
          <line x1="70" y1="34" x2="70" y2="40" stroke="white" stroke-width="2" opacity="0.8"/>
          <line x1="64" y1="30" x2="68" y2="30" stroke="white" stroke-width="2" opacity="0.8"/>
          <line x1="72" y1="30" x2="76" y2="30" stroke="white" stroke-width="2" opacity="0.8"/>
        </svg>
      </div>
      
      <!-- 标题 -->
      <h1 class="main-title">长途汽车售票系统</h1>
      <p class="subtitle">便捷、安全、高效的出行选择</p>
      
      <!-- 按钮 -->
      <div class="button-container">
        <button class="action-btn primary" @click="navigateToLogin">登录</button>
        <button class="action-btn secondary" @click="navigateToUserRegister">用户注册</button>
        <button class="action-btn tertiary" @click="navigateToAdminRegister">管理员注册</button>
      </div>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
    }
  },
  onLoad() {},
  methods: {
    navigateToLogin() {
      uni.navigateTo({
        url: '/pages/user/login'
      });
    },
    navigateToUserRegister() {
      uni.navigateTo({
        url: '/pages/user/register'
      });
    },
    navigateToAdminRegister() {
      uni.navigateTo({
        url: '/pages/admin/register'
      });
    }
  },
}
</script>

<style scoped>
.index-container {
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
.index-container::before {
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

.index-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20rpx);
  padding: 80rpx 50rpx;
  border-radius: 24rpx;
  box-shadow: 0 15rpx 50rpx rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 600rpx;
  position: relative;
  z-index: 1;
}

.logo-container {
  margin-bottom: 40rpx;
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo {
  width: 180rpx;
  height: 180rpx;
}

.main-title {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 15rpx;
  text-align: center;
}

.subtitle {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 60rpx;
  text-align: center;
}

.button-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 20rpx;
}

.action-btn {
  padding: 24rpx;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2rpx solid #87CEEB;
  width: 100%;
  box-sizing: border-box;
}

.action-btn.primary {
  background: rgba(255, 255, 255, 0.9);
  color: #87CEEB;
  box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.1);
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.9);
  color: #87CEEB;
  box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.1);
}

.action-btn.tertiary {
  background: rgba(255, 255, 255, 0.9);
  color: #87CEEB;
  box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.1);
}

.action-btn:active {
  transform: translateY(2rpx);
  opacity: 0.9;
}
</style>
