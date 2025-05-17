const express = require('express');
const path = require('path');
const app = express();

// 正确配置静态资源中间件
app.use(express.static(path.join(__dirname, 'public'))); // 关键配置

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.listen(3000, () => {
  console.log('服务已启动：http://localhost:3000');
  console.log('正在监听音频路径：', path.join(__dirname, 'public/audio/1.mp3')); // 验证路径
});