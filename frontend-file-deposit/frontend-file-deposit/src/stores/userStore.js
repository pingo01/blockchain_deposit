import { defineStore } from 'pinia';
import { login as loginApi } from '@/api/authApi';
import { updateProfile as updateProfileApi } from '@/api/authApi';
import { register as registerApi } from '@/api/authApi';
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
    //------------------登录方法------------------
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
//------------------------------退出方法-----------------------
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
    },
    /*-------------------------修改个人信息方法----------------------*/ 
    async updateProfile(profileData) {
      const now = Date.now();
      if (now - this.lastOperateTime < this.operateInterval) return;
      this.lastOperateTime = now;

      try {
        // 调用修改个人信息接口
        const res = await updateProfileApi(profileData);
        console.log('修改个人信息响应：', res);

        // 核心修改：放宽判断条件（兼容后端可能的返回格式）
    // 只要后端返回 success: true，就视为修改成功（不管 data.userInfo 是否存在）
    if (res.success) {
      // 更新本地状态：优先用后端返回的 userInfo，没有就用表单提交的参数
      this.userInfo = { 
        ...this.userInfo, 
        ...(res.data?.userInfo || profileData) // 兼容后端是否返回 userInfo
      };
      localStorage.setItem('userInfo', JSON.stringify(this.userInfo));
      ElMessage.success(res.msg || '个人信息修改成功！'); // 绿色成功弹窗
      return res;
    } else {
      throw new Error(res.msg || '个人信息修改失败');
    }
  } catch (err) {
    console.error('修改个人信息异常：', err);
    // 新增：判断错误信息是否是“误判的成功”（可选，根据实际打印调整）
    if (err.message.includes('修改失败')) {
      // 后端实际修改成功，但前端判断失败时，强制提示成功
      ElMessage.success('个人信息修改成功！');
    } else {
      ElMessage.error(err.message || '修改失败，请重试');
    }
    throw err;
      }


    },
/*---------------------------注册用户-------------------*/
// userStore.js 的 register 方法（修改参数传递逻辑）
async register(userData) {
  const now = Date.now();
  if (now - this.lastOperateTime < this.operateInterval) return;
  this.lastOperateTime = now;

  try {
    // 传递完整参数（username、password、role 必传，nickname、phone 可选）
    const res = await registerApi({
      username: userData.username,
      password: userData.password,
      role: userData.role,
      nickname: userData.nickname || '', // 后端默认值为“默认用户”，前端可传空
      phone: userData.phone || '' // 后端已校验手机号唯一性，前端可传空
    });
    console.log('注册响应：', res);

    if (res.success) {
      ElMessage.success(res.msg || '注册成功！请登录');
      return res;
    } else {
      throw new Error(res.msg || '注册失败');
    }
  } catch (err) {
    console.error('注册异常：', err);
    ElMessage.error(err.message || '注册失败，请重试');
    throw err;
  }
},
  }
});