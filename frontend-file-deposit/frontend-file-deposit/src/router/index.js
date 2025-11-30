// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import { ElMessage } from 'element-plus';
import { getToken } from '@/utils/auth'; // 导入统一的 Token 工具函数

// 导入页面组件
import LoginView from '@/views/LoginView.vue';
import RegisterView from '@/views/RegisterView.vue';
import ResetPwdView from '@/views/ResetPwdView.vue';
import ProfileView from '@/views/ProfileView.vue';
import UploadView from '@/views/UploadView.vue'; // 模块二的上传页面
import QueryView from '@/views/QueryView.vue'; // 上传者专属查询页
import VerifyView from '@/views/VerifyView.vue'; // 验证者专属验证页
import DashboardView from '@/views/DashboardView.vue'; //个人主页


// 路由配置
const routes = [
  { path: '/', redirect: '/login' }, // 默认跳登录页
  { path: '/login', name: 'Login', component: LoginView, meta: { requiresGuest: true } }, // 游客可访问
  { path: '/register', name: 'Register', component: RegisterView, meta: { requiresGuest: true } }, // 游客可访问
  { path: '/reset-password', name: 'ResetPwd', component: ResetPwdView, meta: { requiresGuest: true } }, // 游客可访问
  { path: '/profile', name: 'Profile', component: ProfileView, meta: { requiresAuth: true } }, // 需登录
  { path: '/upload', name: 'Upload', component: UploadView, meta: { requiresAuth: true, role: 'uploader' } }, // 需登录+上传者角色
  //{ path: '/verify', name: 'Verify', component: VerifyView, meta: { requiresAuth: true, role: 'verifier' } } // 需登录+验证者角色
  // 新增：模块四「存证查询与验证」路由（双角色可访问，权限在页面内控制）
  { path: '/query', name: 'Query', component: QueryView, meta: { requiresAuth: true, role: 'uploader' } },
  { path: '/verify', name: 'Verify', component: VerifyView, meta: { requiresAuth: true, role: 'verifier' } }, // 严格限制：仅验证者可访问 
  { path: '/dashboard', name: 'Dashboard', component: DashboardView, meta: { requiresAuth: true } } // 个人中心主页面（所有用户登录后统一入口），仅需登录，无角色限制
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守卫：验证登录状态和角色权限
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  //  关键修改：已登录 = token 存在 + userInfo 存在（两者都满足才是真登录）
  const token = userStore.token || getToken(); // 用统一的 getToken 工具
  const userInfo = userStore.userInfo || JSON.parse(localStorage.getItem('userInfo')) || {};
  const isLoggedIn = !!token && Object.keys(userInfo).length > 0; // 双重判定
  const userRole = userInfo.role || '';

 // 新增日志：打印关键信息（F12 控制台查看）
  console.log('=== 路由守卫校验 ===');
  console.log('目标路径：', to.path);
  console.log('token 是否存在：', !!token);
  console.log('userInfo 是否存在：', Object.keys(userInfo).length > 0);
  console.log('是否真·已登录：', isLoggedIn);

  // 1. 已登录用户不能访问登录/注册/重置密码页面
  if (to.meta.requiresGuest && isLoggedIn) {
    ElMessage.warning('已登录，无需重复操作！');
    next('/dashboard'); // 跳个人信息页
    return;
  }

  // 2. 需登录的页面：未登录（token 或 userInfo 缺失）→ 跳登录页
  if (to.meta.requiresAuth) {
    if (!isLoggedIn) {
      ElMessage.warning('请先登录！');
      next('/login');
      return;
    }
  }

  // 3. 需特定角色的页面，验证角色权限（如上传页仅 uploader 可访问）
  if (to.meta.role && isLoggedIn) {
      // 用统一的 userRole 判定（避免重复读取 userStore.userInfo）
      if (userRole !== to.meta.role) {
        ElMessage.warning('权限不足，无法访问！');
        next('/dashboard');
        return;
      }
    }

  // 4. 所有校验通过，放行
  next();
});

export default router;