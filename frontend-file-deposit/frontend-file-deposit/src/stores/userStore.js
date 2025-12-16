import { defineStore } from 'pinia';
import { login as loginApi } from '@/api/authApi';
import { updateProfile as updateProfileApi } from '@/api/authApi';
import { register as registerApi } from '@/api/authApi';
import { resetPassword as resetPasswordApi} from '@/api/authApi';
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
        //throw err;
         return false; // 替换抛错，返回false
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
      //if (now - this.lastOperateTime < this.operateInterval) return;
       // 【修改】重复操作时，返回false而非空return，让前端感知
      if (now - this.lastOperateTime < this.operateInterval) {
        ElMessage.warning('操作太频繁，请稍后再试'); // 【新增】友好提示重复操作
        return false;
      }
      this.lastOperateTime = now;

      // 🌟 新增：昵称、手机号校验规则（和前端一致）
      const regex = {
        nickname: /^[^\s]{1,20}$/, // 1-20位，无空格
        phone: /^1[3-9]\d{9}$/     // 11位合法手机号
      };

       try {
        // 🌟 新增：执行前端预校验（之前漏了调用校验逻辑）
        // 1. 昵称校验（必填，因为前端表单设置为required）
        if (!regex.nickname.test(profileData.nickname)) {
          ElMessage.error('昵称需1-20位，不能包含空格！');
          return false;
        }

        // 2. 手机号校验（必填，因为前端表单设置为required）
        if (!regex.phone.test(profileData.phone)) {
          ElMessage.error('请输入合法的11位手机号！');
          return false;
        }

        // 调用修改个人信息接口
        const res = await updateProfileApi(profileData);
        console.log('修改个人信息响应：', res);

        if (res.success) {
          // 更新本地状态：优先用后端返回的 userInfo，没有就用表单提交的参数
          this.userInfo = { 
            ...this.userInfo, 
            ...(res.data?.userInfo || profileData)
          };
          localStorage.setItem('userInfo', JSON.stringify(this.userInfo));
          ElMessage.success(res.msg || '个人信息修改成功！');
          return res;
        } else {
           // 【修改】后端返回success:false时，不再抛错，直接提示并返回false（request.js已弹提示，这里可注释）
          // ElMessage.error(res.msg || '个人信息修改失败');
          return false;
        }
      } catch (err) {
        console.error('修改个人信息异常：', err);
        // 【删除】移除catch中的ElMessage（因为request.js已经弹了提示，避免重复）
        // ElMessage.error(err.message || '修改失败，请重试');
        // 【删除】移除抛错（避免ProfileView的catch二次处理）
        // throw err;
        return false; // 【新增】返回false，让前端感知失败
      }
    },
    
/*---------------------------注册用户-------------------*/
// userStore.js 的 register 方法（修改参数传递逻辑）
async register(userData) {
  const now = Date.now();
    // 【修改】重复操作时，返回false而非空return，让前端感知
      if (now - this.lastOperateTime < this.operateInterval) {
        ElMessage.warning('操作太频繁，请稍后再试'); // 【新增】友好提示重复操作
        return false;
      }
  this.lastOperateTime = now;

  try {
    // 传递完整参数（username、password、role 必传，nickname、phone 可选）
    const res = await registerApi({
      username: userData.username,
      password: userData.password,
      confirmPassword: userData.confirmPassword, // 新增：传递确认密码
      role: userData.role,
      nickname: userData.nickname || '', // 后端默认值为“默认用户”，前端可传空
      phone: userData.phone || '' // 后端已校验手机号唯一性，前端可传空
    });
    console.log('注册响应：', res);

    if (res.success) {
      ElMessage.success(res.msg || '注册成功！请登录');
      return res;
    } else {
       // 【修改】后端返回success:false时，不再抛错，直接返回false（request.js已弹提示）
          return false;
    }
  } catch (err) {
    console.error('注册异常：', err);
     // 保留原有注释，不再弹提示（request.js已处理）
        //ElMessage.error(err.message || '注册失败，请重试');
        // 【删除】移除抛错（避免RegisterView的catch二次处理）
        // throw err;
        return false; // 【新增】返回false，让前端感知失败
  }
},

// 🌟 密码重置方法（完整约束版，匹配后端最新逻辑）
    async resetPassword(resetData) {
      // 解构参数：包含 confirmNewPassword（与后端接收字段一致）
      const { phone, code, newPassword, confirmNewPassword } = resetData;
      const now = Date.now();
      if (now - this.lastOperateTime < this.operateInterval) {
        ElMessage.warning('操作太频繁，请稍后再试'); // 【新增】友好提示重复操作
        return false;
      }
      this.lastOperateTime = now;

      // 🌟 前端预校验（按约束规则：特殊字符仅 !@#$%&*()_+.，无空格）
      const regex = {
        phone: /^1[3-9]\d{9}$/, // 手机号：11位合法格式
        password: /^[A-Za-z0-9!@#$%&*()_+.]{6,20}$/, // 新密码：6-20位，指定字符集
        code:  /^[A-Za-z0-9]{4}$/ // 同步前端逻辑
      };

      try {
        // 1. 必填项校验（后端要求 4 个字段都必填）
        if (!phone || !code || !newPassword || !confirmNewPassword) {
          ElMessage.error('手机号、验证码、新密码、确认密码不能为空！');
          return false;
        }

        // 2. 手机号格式校验
        if (!regex.phone.test(phone)) {
          ElMessage.error('请输入合法的11位手机号！');
          return false;
        }

        // 3. 验证码格式校验（4位数字）
        if (!regex.code.test(code)) {
          ElMessage.error('验证码为4位大小写字母或数字！');
          return false;
        }

        // 4. 新密码格式校验（长度+字符集+无空格）
        if (!regex.password.test(newPassword)) {
          ElMessage.error('新密码需6-20位，仅限字母、数字及!@#$%&*()_+.，不能包含空格！');
          return false;
        }

        // 5. 确认密码一致性校验
        if (newPassword !== confirmNewPassword) {
          ElMessage.error('两次输入的新密码不一致！');
          return false;
        }

        // 脱敏打印参数
        console.log('开始重置密码：', { phone, code, newPassword: '******', confirmNewPassword: '******' });
        // 调用接口：传递完整参数（包含 confirmNewPassword，与后端匹配）
        const res = await resetPasswordApi({ phone, code, newPassword, confirmNewPassword });

        console.log('重置密码接口响应：', res);
        if (res.success) {
          ElMessage.success(res.msg || '密码重置成功！请重新登录');
          this.logout(); // 重置成功后强制退出登录
          return true;
        } else {
          throw new Error(res.msg || '密码重置失败');
        }
      } catch (err) {
        console.error('重置密码异常：', err);
        //ElMessage.error('密码重置失败：' + err.message);
        return false;
      }
    },
  }
});