// db/index.js
const mysql = require('mysql2/promise');
const dbConfig = require('../config/dbConfig');

// 创建数据库连接池（复用连接，提高性能）
const pool = mysql.createPool(dbConfig);

// 测试数据库连接
const testDbConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL 数据库连接成功！');
    connection.release(); // 释放连接
  } catch (err) {
    console.error('MySQL 数据库连接失败：', err.message);
  }
};

// 执行 SQL 语句的工具函数（统一处理结果）
const executeSql = async (sql, params = []) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(sql, params);
    return rows;
  } catch (err) {
    console.error('SQL 执行失败：', err.message, 'SQL:', sql);
    throw err; // 抛出错误，让控制器处理
  } finally {
    connection.release(); // 无论成功失败，都释放连接
  }
};

// 导出工具函数
module.exports = {
  testDbConnection,
  executeSql
};