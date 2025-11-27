// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import { ElMessage } from 'element-plus';

// 导入页面组件
import LoginView from '@/views/LoginView.vue';
import RegisterView from '@/views/RegisterView.vue';
import ResetPwdView from '@/views/ResetPwdView.vue';
import ProfileView from '@/views/ProfileView.vue';
import UploadView from '@/views/UploadView.vue'; // 模块二的上传页面
//import VerifyView from '@/views/VerifyView.vue'; // 后续模块四的验证页面（先占位）
import QueryVerifyView from '@/views/QueryVerifyView.vue'; // 新增：模块四的查询验证页面（替换原 VerifyView）

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
  { 
    path: '/query-verify', 
    name: 'QueryVerify', 
    component: QueryVerifyView, 
    meta: { requiresAuth: true } // 仅需登录，不限制角色（页面内动态显示功能）
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守卫：验证登录状态和角色权限
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  const isLoggedIn = !!userStore.token; // 是否登录

 // 新增日志：打印关键信息（F12 控制台查看）
  console.log('当前路径：', to.path);
  console.log('是否已登录：', isLoggedIn);
  console.log('当前 Token：', userStore.token);
  console.log('当前用户信息：', userStore.userInfo);

  // 1. 已登录用户不能访问登录/注册/重置密码页面
  if (to.meta.requiresGuest && isLoggedIn) {
    ElMessage.warning('已登录，无需重复操作！');
    next('/profile'); // 跳个人信息页
    return;
  }

  // 2. 需登录的页面，未登录则跳登录页
  if (to.meta.requiresAuth && !isLoggedIn) {
    ElMessage.warning('请先登录！');
    next('/login');
    return;
  }

  // 3. 需特定角色的页面，验证角色权限（如上传页仅 uploader 可访问）
  if (to.meta.role && isLoggedIn) {
    if (userStore.userInfo.role !== to.meta.role) {
      ElMessage.warning('权限不足，无法访问！');
      next(from.path); // 回退到之前的页面
      return;
    }
  }

  // 4. 所有校验通过，放行
  next();
});

export default router;