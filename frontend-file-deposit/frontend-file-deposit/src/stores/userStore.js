import { defineStore } from 'pinia';
import { login as loginApi } from '@/api/authApi';
import { getToken, setToken, removeToken } from '@/utils/auth';
import { ElMessage } from 'element-plus';
import router from '@/router';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken() || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo')) || {
      userId: '',
      username: '',
      role: '',
      nickname: '',
      status: '',
      phone: ''
    },
    // 只保留必要的去重锁（删除冗余变量）
    lastOperateTime: 0, // 记录上次操作时间（登录/退出通用去重）
    operateInterval: 1500 // 1.5秒内不重复执行
  }),
  actions: {
    async login(userData) {
      const now = Date.now();
      // 1.5秒内重复登录直接拦截
      if (now - this.lastOperateTime < this.operateInterval) return;
      this.lastOperateTime = now;

      try {
        // 手动清空旧状态（不调用 logout，避免退出弹窗）
        this.token = '';
        this.userInfo = { userId: '', username: '', role: '', nickname: '', status: '', phone: '' };
        removeToken();
        localStorage.removeItem('userInfo');

        const res = await loginApi(userData);
        console.log('登录响应：', res);

        // 验证响应有效性
        if (res.success && res.data?.token && res.data?.userInfo && res.data.userInfo.userId) {
          this.token = res.data.token;
          this.userInfo = res.data.userInfo;
          setToken(this.token);
          localStorage.setItem('userInfo', JSON.stringify(this.userInfo));
          ElMessage.success(res.msg || '登录成功！'); // 唯一登录提示
          return res;
        } else {
          throw new Error(res.msg || '登录失败，请检查账号密码');
        }
      } catch (err) {
        this.token = '';
        console.error('登录异常：', err);
        ElMessage.error(err.message || '登录失败，请重试'); // 唯一错误提示
        throw err;
      }
    },

    logout() {
      const now = Date.now();
      // 1.5秒内重复退出直接拦截（核心去重）
      if (now - this.lastOperateTime < this.operateInterval) return;
      this.lastOperateTime = now;

      // 执行退出核心逻辑
      this.token = '';
      this.userInfo = { userId: '', username: '', role: '', nickname: '', status: '', phone: '' };
      removeToken();
      localStorage.removeItem('userInfo');
      
      ElMessage.success('退出登录成功！'); // 唯一退出提示
      router.replace('/login');
    }
  }
});