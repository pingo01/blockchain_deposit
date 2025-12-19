<template>
  <view class="admin-container">
    <view class="admin-header">
      <h1>管理员后台</h1>
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </view>
    
    <view class="admin-content">
      <div class="welcome-message">
        <h2>欢迎回来，{{ currentUser?.name || '管理员' }}</h2>
        <p>这里是您的管理控制台</p>
      </div>
      
      <div class="function-grid">
        <view class="function-item">
          <div class="function-icon">🚌</div>
          <div class="function-name">线路管理</div>
        </view>
        <view class="function-item">
          <div class="function-icon">🎟️</div>
          <div class="function-name">车票管理</div>
        </view>
        <view class="function-item">
          <div class="function-icon">👥</div>
          <div class="function-name">用户管理</div>
        </view>
        <view class="function-item">
          <div class="function-icon">📊</div>
          <div class="function-name">统计报表</div>
        </view>
        <view class="function-item">
          <div class="function-icon">🔍</div>
          <div class="function-name">订单查询</div>
        </view>
        <view class="function-item">
          <div class="function-icon">⚙️</div>
          <div class="function-name">系统设置</div>
        </view>
      </div>
    </view>
  </view>
</template>

<script>
import { getCurrentUser, logout } from '../../utils/auth';

export default {
  data() {
    return {
      currentUser: null
    };
  },
  onLoad() {
    // 获取当前登录用户信息
    this.currentUser = getCurrentUser();
    
    // 如果用户未登录，跳转到登录页面
    if (!this.currentUser) {
      uni.navigateTo({
        url: '/pages/user/login'
      });
    }
  },
  methods: {
    handleLogout() {
      // 调用登出函数
      const result = logout();
      
      if (result.success) {
        uni.showToast({
          title: result.message,
          icon: 'success'
        });
        
        // 跳转到登录页面
        setTimeout(() => {
          uni.navigateTo({
            url: '/pages/user/login'
          });
        }, 1000);
      }
    }
  }
};
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #a6c0fe 0%, #fda2af 100%);
  padding: 20rpx;
  position: relative;
  overflow: hidden;
}

/* 背景装饰元素 */
.admin-container::before {
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

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20rpx);
  padding: 20rpx 30rpx;
  border-radius: 16rpx;
  box-shadow: 0 8rpx 25rpx rgba(0, 0, 0, 0.15);
  margin-bottom: 30rpx;
  position: relative;
  z-index: 1;
}

.admin-header h1 {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.logout-btn {
  background: linear-gradient(135deg, #a6c0fe 0%, #fda2af 100%);
  color: white;
  border: none;
  border-radius: 12rpx;
  padding: 16rpx 28rpx;
  font-size: 28rpx;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4rpx 15rpx rgba(166, 192, 254, 0.3);
}

.logout-btn:active {
  transform: translateY(2rpx);
  box-shadow: 0 2rpx 8rpx rgba(166, 192, 254, 0.3);
}

.admin-content {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20rpx);
  padding: 40rpx 30rpx;
  border-radius: 16rpx;
  box-shadow: 0 8rpx 25rpx rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 1;
}

.welcome-message {
  text-align: center;
  margin-bottom: 50rpx;
}

.welcome-message h2 {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.welcome-message p {
  font-size: 28rpx;
  color: #666;
  margin: 0;
}

.function-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30rpx;
}

.function-item {
  background: rgba(255, 255, 255, 0.8);
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  padding: 30rpx 20rpx;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.function-item:hover {
  transform: translateY(-5rpx);
  box-shadow: 0 8rpx 20rpx rgba(166, 192, 254, 0.3);
  border-color: #a6c0fe;
}

.function-icon {
  font-size: 60rpx;
  margin-bottom: 15rpx;
}

.function-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}
</style>