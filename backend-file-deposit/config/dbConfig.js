// config/dbConfig.js
require('dotenv').config(); // 加载 .env 配置

module.exports = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10, // 连接池大小
  multipleStatements: true // 支持多语句查询
};