// Состояние игры
let gameState = {
    operation: 'add',
    difficulty: 'easy',
    numberType: 'single',
    correct: 0,
    wrong: 0,
    timeLeft: 60,
    gameActive: false,
    currentQuestion: null,
    currentAnswers: [],
    mistakes: [],
    timerInterval: null,
    sound: true
};

const DIFFICULTY_LIMITS = {
    easy: 50,
    medium: 100,
    hard: 200,
    mega: 500
};

// Переход на экран настроек
function goToGame() {
    showScreen('settingsScreen');
}

// Начало игры
function startGame() {
    gameState.operation = document.querySelector('input[name="operation"]:checked').value;
    gameState.difficulty = document.querySelector('input[name="difficulty"]:checked').value;
    gameState.numberType = document.querySelector('input[name="numberType"]:checked').value;
    gameState.correct = 0;
    gameState.wrong = 0;
    gameState.timeLeft = 60;
    gameState.gameActive = true;
    gameState.mistakes = [];

    showScreen('gameScreen');
    nextQuestion();
    startTimer();
}

// Генерация случайного числа в пределах лимита
function getRandomNumber(max) {
    return Math.floor(Math.random() * max) + 1;
}

// Генерация новой задачи
function nextQuestion() {
    const limit = DIFFICULTY_LIMITS[gameState.difficulty];
    let a, b, operation;

    if (gameState.operation === 'mixed') {
        const ops = ['add', 'subtract', 'multiply', 'divide'];
        operation = ops[Math.floor(Math.random() * ops.length)];
    } else {
        operation = gameState.operation;
    }

    // Определение размера чисел
    let maxA = limit;
    let maxB = limit;

    if (gameState.numberType === 'single') {
        maxA = 9;
        maxB = 9;
    } else if (gameState.numberType === 'mixed') {
        maxA = Math.random() > 0.5 ? 9 : limit;
        maxB = Math.random() > 0.5 ? 9 : limit;
    }

    a = getRandomNumber(maxA);
    b = getRandomNumber(maxB);

    // Для вычитания и деления убедимся в правильном порядке
    if (operation === 'subtract' && a < b) {
        [a, b] = [b, a];
    }

    if (operation === 'divide') {
        b = getRandomNumber(Math.min(9, maxB));
        a = b * getRandomNumber(Math.floor(limit / b));
    }

    gameState.currentQuestion = { a, b, operation };
    generateAnswers();
    displayQuestion();
}

// Получение правильного ответа
function getCorrectAnswer() {
    const { a, b, operation } = gameState.currentQuestion;
    switch (operation) {
        case 'add':
            return a + b;
        case 'subtract':
            return a - b;
        case 'multiply':
            return a * b;
        case 'divide':
            return Math.floor(a / b);
        default:
            return 0;
    }
}

// Генерация вариантов ответов
function generateAnswers() {
    const correct = getCorrectAnswer();
    const answers = [correct];
    const limit = DIFFICULTY_LIMITS[gameState.difficulty];

    while (answers.length < 6) {
        const wrong = getRandomNumber(limit * 2) - limit / 2;
        if (!answers.includes(wrong) && wrong !== correct && wrong > 0) {
            answers.push(wrong);
        }
    }

    gameState.currentAnswers = answers.sort(() => Math.random() - 0.5);
}

// Отображение вопроса
function displayQuestion() {
    const { a, b, operation } = gameState.currentQuestion;
    let symbol = '';
    switch (operation) {
        case 'add':
            symbol = '+';
            break;
        case 'subtract':
            symbol = '−';
            break;
        case 'multiply':
            symbol = '×';
            break;
        case 'divide':
            symbol = '÷';
            break;
    }

    document.getElementById('question').textContent = `${a} ${symbol} ${b}`;

    // Отображение вариантов ответов
    const grid = document.getElementById('answersGrid');
    grid.innerHTML = '';
    gameState.currentAnswers.forEach(answer => {
        const btn = document.createElement('button');
        btn.className = 'btn answer-btn';
        btn.textContent = answer;
        btn.onclick = () => checkAnswer(answer);
        grid.appendChild(btn);
    });
}

// Проверка ответа
function checkAnswer(answer) {
    if (!gameState.gameActive) return;

    const correct = getCorrectAnswer();
    const isCorrect = answer === correct;

    if (isCorrect) {
        gameState.correct++;
        playSound('correct');
        showFeedback('correct', answer);
        setTimeout(() => {
            if (gameState.gameActive) {
                nextQuestion();
                updateDisplay();
            }
        }, 1000);
    } else {
        gameState.wrong++;
        playSound('wrong');
        gameState.mistakes.push({
            question: `${gameState.currentQuestion.a} ${getOperationSymbol()} ${gameState.currentQuestion.b}`,
            userAnswer: answer,
            correctAnswer: correct
        });
        showFeedback('wrong', correct);
        setTimeout(() => {
            if (gameState.gameActive) {
                displayQuestion();
                updateDisplay();
            }
        }, 5000);
    }
}

// Ввод ответа с клавиатуры
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        submitAnswer();
    }
}

// Отправка введённого ответа
function submitAnswer() {
    const input = document.getElementById('userAnswer');
    const answer = parseInt(input.value);
    input.value = '';

    if (!isNaN(answer)) {
        checkAnswer(answer);
    }
}

// Получение символа операции
function getOperationSymbol() {
    switch (gameState.currentQuestion.operation) {
        case 'add':
            return '+';
        case 'subtract':
            return '−';
        case 'multiply':
            return '×';
        case 'divide':
            return '÷';
    }
}

// Обратная связь
function showFeedback(type, value) {
    const question = document.getElementById('question');
    if (type === 'correct') {
        question.style.color = 'var(--success)';
        createConfetti();
    } else {
        question.style.color = 'var(--error)';
        question.textContent += ` → Ответ: ${value}`;
    }
    setTimeout(() => {
        question.style.color = 'var(--primary)';
    }, 1500);
}

// Таймер
function startTimer() {
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        document.getElementById('timer').textContent = gameState.timeLeft;

        if (gameState.timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

// Обновление отображения
function updateDisplay() {
    document.getElementById('correct').textContent = `✅ ${gameState.correct}`;
    document.getElementById('wrong').textContent = `❌ ${gameState.wrong}`;

    const total = gameState.correct + gameState.wrong;
    const accuracy = total > 0 ? Math.round((gameState.correct / total) * 100) : 0;
    const fill = document.getElementById('progressFill');
    fill.style.width = accuracy + '%';
    fill.style.background = accuracy >= 60 
        ? 'linear-gradient(90deg, var(--success), var(--primary))' 
        : 'linear-gradient(90deg, var(--error), var(--secondary))';
}

// Завершение игры
function endGame() {
    gameState.gameActive = false;
    clearInterval(gameState.timerInterval);
    showResults();
}

// Показ результатов
function showResults() {
    const total = gameState.correct + gameState.wrong;
    const accuracy = total > 0 ? Math.round((gameState.correct / total) * 100) : 0;
    const stars = Math.min(5, Math.ceil(accuracy / 20));

    document.getElementById('resultTitle').textContent = 
        accuracy >= 80 ? '🎉 Отлично!' : accuracy >= 60 ? '👍 Хорошо!' : '📚 Повтори!';
    
    document.getElementById('stars').textContent = '⭐'.repeat(stars);
    document.getElementById('resCorrect').textContent = gameState.correct;
    document.getElementById('resWrong').textContent = gameState.wrong;
    document.getElementById('resAccuracy').textContent = accuracy + '%';

    // Разбор ошибок
    const mistakesDiv = document.getElementById('mistakesReview');
    if (gameState.mistakes.length > 0) {
        mistakesDiv.innerHTML = '<strong>Ошибки:</strong>';
        gameState.mistakes.slice(0, 5).forEach(mistake => {
            const item = document.createElement('div');
            item.className = 'mistake-item';
            item.innerHTML = `${mistake.question} = ${mistake.correctAnswer} (ты ответил: ${mistake.userAnswer})`;
            mistakesDiv.appendChild(item);
        });
    } else {
        mistakesDiv.innerHTML = '';
    }

    // Сохранение рекорда
    saveRecord({
        operation: gameState.operation,
        difficulty: gameState.difficulty,
        correct: gameState.correct,
        wrong: gameState.wrong,
        accuracy: accuracy,
        date: new Date().toLocaleString('ru-RU')
    });

    showScreen('resultsScreen');
}

// Сохранение рекорда в localStorage
function saveRecord(record) {
    let records = JSON.parse(localStorage.getItem('mathTronRecords') || '[]');
    records.unshift(record);
    records = records.slice(0, 20);
    localStorage.setItem('mathTronRecords', JSON.stringify(records));
}

// Показ рекордов
function showRecords() {
    const records = JSON.parse(localStorage.getItem('mathTronRecords') || '[]');
    const list = document.getElementById('recordsList');
    
    if (records.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: var(--text-dim);">Нет рекордов. Начни игру!</p>';
    } else {
        list.innerHTML = records.map((record, i) => `
            <div class="record-item">
                <div>
                    <div class="record-name">Опыт ${i + 1}: ${record.operation} (${record.difficulty})</div>
                    <div style="font-size: 0.8rem; color: var(--text-dim);">${record.date}</div>
                </div>
                <div>
                    <div class="record-score">✅${record.correct} ❌${record.wrong}</div>
                    <div style="font-size: 0.8rem; color: var(--primary);">${record.accuracy}%</div>
                </div>
            </div>
        `).join('');
    }
    
    showScreen('recordsScreen');
}

// Показ настроек
function showSettings() {
    showScreen('settingsScreen');
}

// Переключение экранов
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// Возврат в меню
function backToMenu() {
    showScreen('menuScreen');
}

// Выход из игры
function quitGame() {
    gameState.gameActive = false;
    clearInterval(gameState.timerInterval);
    showScreen('menuScreen');
}

// Конфетти
function createConfetti() {
    const container = document.getElementById('confetti');
    for (let i = 0; i < 20; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + '%';
        piece.style.backgroundColor = ['var(--primary)', 'var(--secondary)', 'var(--success)'][Math.floor(Math.random() * 3)];
        piece.style.delay = Math.random() * 0.2 + 's';
        container.appendChild(piece);
        setTimeout(() => piece.remove(), 2000);
    }
}

// Звук
function playSound(type) {
    if (!gameState.sound) return;
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'correct') {
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } else {
        oscillator.frequency.value = 300;
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
    }
}

// Инициализация
window.addEventListener('DOMContentLoaded', () => {
    showScreen('menuScreen');
});