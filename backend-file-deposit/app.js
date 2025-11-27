const express = require('express');
const cors = require('cors');
const fileRoutes = require('./routes/fileRoutes');
const authRoutes = require('./routes/authRoutes'); // 新增：引入 auth 路由
const { testDbConnection } = require('./db/index'); // 新增：引入数据库测试
const { port } = require('./config/config');

// 1. 创建 Express 实例
const app = express();
// 2. 后端端口（避免和前端 Vue 冲突，用 3001）
const PORT = 3001;

// 新增：测试数据库连接
testDbConnection();

// 新增：解析 JSON 格式的请求体（前端传参用）👇 核心修改：解析 JSON 请求体时，明确设置字符集为 UTF-8（解决中文响应乱码）
app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf-8' })); // 补充：表单请求也加 UTF-8
// 3. 配置跨域（允许前端 Vue 项目访问）
app.use(cors({
  origin: 'http://localhost:5173', // 前端默认启动地址（后续会验证）
  credentials: true // 允许携带 Cookie（课程设计可选，不影响核心功能）
}));

// 4. 解析 JSON 请求（前端传 JSON 数据时需要）
//app.use(express.json());

// 5. 注册文件路由（接口前缀：/api/file，完整接口地址：/api/file/upload）
// 注册路由（新增 auth 路由）
app.use('/api/auth', authRoutes); // 模块一用户认证接口：/api/auth/xxx
app.use('/api/file', fileRoutes); // 模块二文件处理接口（之前的模块二路由）
app.use('/api/blockchain', require('./routes/blockchainRoutes'));//模块三 注册区块链模块路由（接口前缀：/api/blockchain）
app.use('/api/query-verify', require('./routes/queryVerifyRoutes')); // 模块四：查询验证

// 6. 启动服务
app.listen(PORT, () => {
  console.log(`后端服务启动成功！访问地址：http://localhost:${PORT}`);
});