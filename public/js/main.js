// 全局变量
let recognition = null;
let isRecognizing = false;
let finalTranscript = '';
let currentQuestion = null;

const questionBank = [
  {
    audio: "/audio/1.mp3",
    answer: "这是一个面向听觉障碍人群的语音识别康复系统",
    difficulty: 1
  },
  {
    audio: "/audio/2.mp3",
    answer: "生物医学工程学是一门理工医相结合的交叉学科", 
    difficulty: 2
  },
  {
    audio: "/audio/3.mp3",
    answer: "我们的项目是面向听觉障碍人群的语音识别康复系统",
    difficulty: 1
  }
];

// 初始化题目
const initQuestion = () => {
  const randomIndex = Math.floor(Math.random() * questionBank.length);
  currentQuestion = questionBank[randomIndex];
};


// 初始化语音识别
const initSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showErrorToast('当前浏览器不支持语音识别');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'zh-CN';

    recognition.onstart = () => {
        isRecognizing = true;
        updateUIState('recording');
    };

    recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interim += transcript;
            }
        }
        updateResultDisplay(finalTranscript, interim);
    };

    recognition.onerror = (event) => {
        handleRecognitionError(event.error);
    };

    recognition.onend = () => {
        isRecognizing = false;
        if (finalTranscript) {
            const accuracy = calculateAccuracy(finalTranscript, currentCorrectAnswer);
            showFinalResult(finalTranscript, accuracy);
        }
        resetSystem();
    };
};

// 开始识别
const startRecognition = () => {
    if (!recognition) initSpeechRecognition();

    finalTranscript = '';
    document.getElementById('realTimeResult').innerHTML = '<div class="prompt">正在聆听...</div>';
    document.getElementById('accuracyValue').textContent = '0%';
    document.querySelector('.progress-fill').style.width = '0%';

    try {
        recognition.start();
    } catch (e) {
        showErrorToast('无法启动录音');
        console.error('语音识别启动失败:', e);
    }
};

// 准确率计算函数
const calculateAccuracy = (input, target) => {
    const cleanStr = str => str.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').toLowerCase();
    const cleanInput = cleanStr(input);
    const cleanTarget = cleanStr(target);

    const m = cleanInput.length, n = cleanTarget.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = cleanInput[i - 1] === cleanTarget[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost
            );
        }
    }

    const maxLen = Math.max(m, n);
    const accuracy = ((1 - dp[m][n] / maxLen) * 100).toFixed(1);
    return Math.min(accuracy, 100);
};

// UI更新
const updateUIState = (state) => {
    const btn = document.getElementById('recordBtn');
    if (state === 'recording') {
        btn.innerHTML = '<img src="/images/stop-icon.png" alt="停止">识别中...';
        btn.style.backgroundColor = '#d32f2f';
    } else {
        btn.innerHTML = '<img src="/images/mic-icon.png" alt="麦克风">开始录音练习';
        btn.style.backgroundColor = '#2A5CAA';
    }
};

const updateResultDisplay = (final, interim) => {
  const box = document.getElementById('realTimeResult');
  
  // 添加卡片动画
  box.parentElement.classList.add('result-card-enter');
  setTimeout(() => {
    box.parentElement.classList.remove('result-card-enter');
  }, 300);

  // 动态生成内容
  box.innerHTML = `
    <div class="real-time-content">
      ${final ? `<div class="final">${final}</div>` : ''}
      ${interim ? `<div class="interim">${interim}</div>` : ''}
    </div>
  `;
};
// 结果显示函数修改
const showFinalResult = (userInput, accuracy) => {
  // 显示用户输入
  document.getElementById('userInputText').textContent = userInput;
  
  // 延迟0.5秒显示正确答案（实现渐现效果）
  setTimeout(() => {
    document.getElementById('correctAnswerText').textContent = currentQuestion.answer;
    document.getElementById('correctAnswerText').style.opacity = 1;
  }, 500);

  // 更新进度条
  const progress = document.querySelector('.progress-fill');
  progress.style.width = `${accuracy}%`;
  progress.style.backgroundColor = accuracy >= 80 ? '#4CAF50' : 
                                 accuracy >= 60 ? '#FFC107' : '#F44336';

  document.getElementById('accuracyValue').textContent = `${accuracy}%`;
};

const resetSystem = () => {
    finalTranscript = '';
    updateUIState('ready');
};

// 错误处理
const handleRecognitionError = (error) => {
    const errorMap = {
        'no-speech': '未检测到语音输入',
        'audio-capture': '麦克风访问失败',
        'not-allowed': '权限被拒绝'
    };
    showErrorToast(errorMap[error] || '语音识别错误');
};

const showErrorToast = (msg) => {
    const toast = document.getElementById('errorToast');
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
};

// 修改播放按钮事件监听
document.getElementById('playBtn').addEventListener('click', () => {
  // 每次点击都随机选择新题目
  const randomIndex = Math.floor(Math.random() * questionBank.length);
  currentQuestion = questionBank[randomIndex];
  
  // 更新正确答案显示（保持隐藏）
  document.getElementById('correctAnswerText').textContent = currentQuestion.answer;
  document.getElementById('correctAnswerText').style.opacity = 0;

  // 播放音频
  const audio = new Audio(currentQuestion.audio);
  audio.play().catch(err => {
    console.error('播放失败:', err);
    showErrorToast('音频播放失败');
  });
});

// 点击录音按钮
document.getElementById('recordBtn')?.addEventListener('click', () => {
    if (!isRecognizing) {
        startRecognition();
    } else {
        recognition?.stop();
    }
});

// 页面加载初始化
window.addEventListener('load', () => {
  initQuestion(); // 初始化第一题
  initSpeechRecognition();
  
  // 隐藏正确答案初始状态
  document.getElementById('correctAnswerText').style.opacity = 0;
});