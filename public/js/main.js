// 全局变量定义
let mediaRecorder = null;      // 媒体录音对象
let audioChunks = [];          // 存储录音片段
let isRecording = false;       // 录音状态标识
const correctAnswer = "今天天气真好我们一起去公园吧"; // 预设标准答案

// 预加载所需图标（可选）
const preloadImages = () => {
  const images = [
    '/images/play-icon.png',
    '/images/mic-icon.png',
    '/images/ear-icon.png',
    '/images/sound-wave.png'
  ];
  images.forEach(url => {
    new Image().src = url;
  });
};
window.addEventListener('load', preloadImages);

// ================= 音频播放功能 =================
document.getElementById('playBtn').addEventListener('click', () => {
  const audioPlayer = new Audio('/audio/sample_noisy.mp3');
  
  // 添加播放状态反馈
  audioPlayer.addEventListener('play', () => {
    document.getElementById('playBtn').classList.add('playing');
  });
  
  audioPlayer.addEventListener('ended', () => {
    document.getElementById('playBtn').classList.remove('playing');
  });
  
  audioPlayer.play().catch(error => {
    console.error('音频播放失败:', error);
    alert('请点击页面任意位置后重试播放！');
  });
});

// ================= 录音控制功能 =================
document.getElementById('recordBtn').addEventListener('click', async () => {
  if (!isRecording) {
    try {
      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      initMediaRecorder(stream);
      
      // 更新界面状态
      isRecording = true;
      document.getElementById('recordBtn').innerHTML = `
        <img src="/images/stop-icon.png" alt="停止">
        正在录音中...
      `;
    } catch (error) {
      handleRecordingError(error);
    }
  } else {
    // 停止录音
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
    
    // 重置状态
    isRecording = false;
    document.getElementById('recordBtn').innerHTML = `
      <img src="/images/mic-icon.png" alt="麦克风">
      开始录音练习
    `;
  }
});

// 初始化录音设备
const initMediaRecorder = (stream) => {
  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];

  // 数据收集处理
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      audioChunks.push(event.data);
    }
  };

  // 录音停止处理
  mediaRecorder.onstop = async () => {
    try {
      // 生成音频文件
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      
      // 语音识别
      const userSpeech = await recognizeSpeech(audioBlob);
      
      // 计算准确度
      const accuracy = calculateAccuracy(userSpeech, correctAnswer);
      
      // 显示结果
      showResult(userSpeech, accuracy);
      
      // 保存成绩（可扩展）
      // await saveScore(accuracy);
    } catch (error) {
      console.error('处理过程中发生错误:', error);
      showResult('', 0);
    }
  };

  // 开始录音
  mediaRecorder.start();
};

// ================= 语音识别功能 =================
const recognizeSpeech = (audioBlob) => {
  return new Promise((resolve, reject) => {
    // 创建识别实例
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;

    // 处理识别结果
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      resolve(transcript.trim());
    };

    // 错误处理
    recognition.onerror = (event) => {
      reject(new Error(`识别错误: ${event.error}`));
    };

    // 模拟音频输入（实际生产环境应发送到服务器处理）
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
    
    // 开始识别
    recognition.start();
  });
};

// ================= 准确度计算 =================
const calculateAccuracy = (input, target) => {
  if (!input || input.length === 0) return 0;
  
  const maxLen = Math.max(input.length, target.length);
  let matchCount = 0;
  
  // 逐字对比
  for (let i = 0; i < maxLen; i++) {
    if (input[i] && target[i] && input[i] === target[i]) {
      matchCount++;
    }
  }
  
  // 计算百分比
  const accuracy = (matchCount / target.length) * 100;
  return Math.min(Math.round(accuracy * 10) / 10, 100); // 限制最大值100%
};

// ================= 结果显示 =================
const showResult = (text, accuracy) => {
  const speechResult = document.getElementById('speechResult');
  const accuracyResult = document.getElementById('accuracyResult');
  const progressFill = accuracyResult.querySelector('.progress-fill');
  const accuracyValue = accuracyResult.querySelector('.accuracy-value');

  // 更新语音识别结果
  speechResult.innerHTML = text 
    ? `<p class="result-text">${text}</p>`
    : '<p class="empty-tip">❌ 未识别到有效语音输入</p>';

  // 更新进度条
  progressFill.style.width = `${accuracy}%`;
  accuracyValue.textContent = `${accuracy}%`;

  // 根据准确度改变颜色
  if (accuracy >= 80) {
    progressFill.style.backgroundColor = '#4CAF50';
  } else if (accuracy >= 60) {
    progressFill.style.backgroundColor = '#FFC107';
  } else {
    progressFill.style.backgroundColor = '#F44336';
  }
};

// ================= 错误处理 =================
const handleRecordingError = (error) => {
  console.error('录音错误:', error);
  let errorMessage = '录音功能初始化失败：';

  switch (error.name) {
    case 'NotAllowedError':
      errorMessage += '请允许麦克风访问权限';
      break;
    case 'NotFoundError':
      errorMessage += '未找到录音设备';
      break;
    default:
      errorMessage += '未知错误，请重试';
  }

  alert(errorMessage);
};

// 初始化提示
console.log('系统已初始化完成');