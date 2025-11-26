const express = require('express');
const cors = require('cors');
const fileRoutes = require('./routes/fileRoutes');

// 1. 创建 Express 实例
const app = express();
// 2. 后端端口（避免和前端 Vue 冲突，用 3001）
const PORT = 3001;

// 3. 配置跨域（允许前端 Vue 项目访问）
app.use(cors({
  origin: 'http://localhost:5173', // 前端默认启动地址（后续会验证）
  credentials: true // 允许携带 Cookie（课程设计可选，不影响核心功能）
}));

// 4. 解析 JSON 请求（前端传 JSON 数据时需要）
app.use(express.json());

// 5. 注册文件路由（接口前缀：/api/file，完整接口地址：/api/file/upload）
app.use('/api/file', fileRoutes);

// 6. 启动服务
app.listen(PORT, () => {
  console.log(`后端服务启动成功！访问地址：http://localhost:${PORT}`);
});