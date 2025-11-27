// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 1. 用户注册：POST /api/auth/register
router.post('/register', authController.register);

// 2. 用户登录：POST /api/auth/login
router.post('/login', authController.login);

// 3. 密码重置：POST /api/auth/reset-password
router.post('/reset-password', authController.resetPassword);

// 4. 修改个人信息：PUT /api/auth/update-profile（需要登录验证）
router.put('/update-profile', authController.verifyLogin, authController.updateProfile);

module.exports = router;