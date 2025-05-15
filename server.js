const express = require('express');
const app = express();
app.use(express.static('public'));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});
app.listen(3000, () => {
    console.log('服务器已启动：请打开 http://localhost:3000');
});