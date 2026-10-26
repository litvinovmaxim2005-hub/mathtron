// Состояние игры
let gameState = {
    operation: 'add',
    difficulty: 'easy',
    numberType: 'single',
    correct: 0,
    wrong: 0,
    elapsed: 0,
    totalQuestions: QUESTIONS_PER_GAME,
    questionIndex: 0,
    gameActive: false,
    currentQuestion: null,
    currentAnswers: [],
    questions: [],
    mistakes: [],
    timerInterval: null,
    sound: true
};

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function operationLabel(operation) {
    switch (operation) {
        case 'add':
            return 'сложение';
        case 'subtract':
            return 'вычитание';
        case 'multiply':
            return 'умножение';
        case 'divide':
            return 'деление';
        default:
            return 'смешанный';
    }
}

function difficultyLabel(difficulty) {
    switch (difficulty) {
        case 'easy':
            return 'лёгкий';
        case 'medium':
            return 'средний';
        case 'hard':
            return 'сложный';
        case 'mega':
            return 'мегасложный';
        default:
            return difficulty;
    }
}

function goToGame() {
    showScreen('settingsScreen');
}

function startGame() {
    gameState.operation = document.querySelector('input[name="operation"]:checked').value;
    gameState.difficulty = document.querySelector('input[name="difficulty"]:checked').value;
    gameState.numberType = document.querySelector('input[name="numberType"]:checked').value;
    gameState.correct = 0;
    gameState.wrong = 0;
    gameState.elapsed = 0;
    gameState.totalQuestions = QUESTIONS_PER_GAME;
    gameState.questionIndex = 0;
    gameState.gameActive = true;
    gameState.mistakes = [];
    gameState.questions = generateQuestionSet(
        QUESTIONS_PER_GAME,
        gameState.operation,
        gameState.difficulty,
        gameState.numberType
    );

    showScreen('gameScreen');
    loadQuestion();
    startTimer();
    updateDisplay();
}

function loadQuestion() {
    gameState.currentQuestion = gameState.questions[gameState.questionIndex];
    generateCurrentAnswers();
    displayQuestion();
}

function getCorrectAnswer() {
    return gameState.currentQuestion.answer;
}

function generateCurrentAnswers() {
    gameState.currentAnswers = generateAnswers(getCorrectAnswer(), gameState.difficulty);
}

function isFractionQuestion(question) {
    return Boolean(question && question.answer && typeof question.answer === 'object' && Number.isInteger(question.answer.n));
}

function formatAnswerForDisplay(value) {
    if (value && typeof value === 'object' && value.html) {
        return value.html;
    }
    if (value && typeof value === 'object' && Number.isInteger(value.n)) {
        return typeof formatFracHtml === 'function' ? formatFracHtml(value) : formatMixed(value);
    }
    return String(value);
}

function choicePayload(answer) {
    if (answer && typeof answer === 'object') {
        return answer.text || formatMixed(answer.frac || answer);
    }
    return answer;
}

function displayQuestion() {
    const question = gameState.currentQuestion;
    const promptEl = document.getElementById('questionPrompt');
    promptEl.textContent = question.prompt || '';
    promptEl.style.display = question.prompt ? 'block' : 'none';

    const questionEl = document.getElementById('question');
    const text = question.text;
    if (question.html) {
        questionEl.innerHTML = question.html;
    } else {
        questionEl.textContent = text;
    }
    questionEl.classList.toggle('question-long', text.length > 22 || question.kind === 'word' || question.kind === 'equation');

    const grid = document.getElementById('answersGrid');
    grid.innerHTML = '';
    gameState.currentAnswers.forEach((answer) => {
        const btn = document.createElement('button');
        btn.className = 'btn answer-btn';
        if (answer && typeof answer === 'object' && answer.html) {
            btn.innerHTML = answer.html;
        } else {
            btn.textContent = answer;
        }
        btn.onclick = () => checkAnswer(choicePayload(answer));
        grid.appendChild(btn);
    });

    const fractionMode = isFractionQuestion(question);
    document.getElementById('mixedInput').hidden = !fractionMode;

    const hint = document.getElementById('inputHint');
    hint.textContent = question.hint || (fractionMode
        ? 'Смешанное число: целая, пробел, дробь. Пример: 7 2/5. Можно 37/5.'
        : 'Введи целое число и нажми Enter.');

    ['ansWhole', 'ansNum', 'ansDen', 'userAnswer'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
            el.value = '';
        }
    });
    const userAnswer = document.getElementById('userAnswer');
    userAnswer.placeholder = question.placeholder || (fractionMode ? 'например 7 2/5' : 'Или введи ответ');
    if (fractionMode) {
        document.getElementById('ansWhole').focus();
    } else {
        userAnswer.focus();
    }
}

function finishCurrentAndContinue() {
    gameState.questionIndex += 1;
    if (gameState.questionIndex >= gameState.totalQuestions) {
        endGame();
        return;
    }
    if (gameState.gameActive) {
        loadQuestion();
        updateDisplay();
    }
}

function checkAnswer(answer) {
    if (!gameState.gameActive) {
        return;
    }

    const correct = getCorrectAnswer();
    const isCorrect = typeof answersEqual === 'function'
        ? answersEqual(answer, correct)
        : Number(answer) === Number(correct);

    if (isCorrect) {
        gameState.correct += 1;
        playSound('correct');
        showFeedback('correct', answer);
        updateDisplay();
        setTimeout(() => {
            if (gameState.gameActive) {
                finishCurrentAndContinue();
            }
        }, 400);
    } else {
        gameState.wrong += 1;
        playSound('wrong');
        gameState.mistakes.push({
            question: gameState.currentQuestion.text,
            userAnswer: typeof formatMixed === 'function' ? (formatMixed(coerceFrac(answer)) || String(answer)) : String(answer),
            correctAnswer: gameState.currentQuestion.answerText || (typeof formatMixed === 'function' ? formatMixed(correct) : correct)
        });
        showFeedback('wrong', correct);
        updateDisplay();
        setTimeout(() => {
            if (gameState.gameActive) {
                finishCurrentAndContinue();
            }
        }, 1500);
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        submitAnswer();
    }
}

function readMixedFields() {
    const wholeRaw = document.getElementById('ansWhole').value.trim();
    const numRaw = document.getElementById('ansNum').value.trim();
    const denRaw = document.getElementById('ansDen').value.trim();
    if (!wholeRaw && !numRaw && !denRaw) {
        return null;
    }
    if (numRaw && denRaw) {
        const whole = wholeRaw === '' ? 0 : parseInt(wholeRaw, 10);
        const n = parseInt(numRaw, 10);
        const d = parseInt(denRaw, 10);
        if ([whole, n, d].some((v) => Number.isNaN(v)) || d === 0) {
            return null;
        }
        return mixedToFrac(whole, n, d);
    }
    if (wholeRaw && !numRaw && !denRaw) {
        const whole = parseInt(wholeRaw, 10);
        return Number.isNaN(whole) ? null : frac(whole, 1);
    }
    return null;
}

function submitAnswer() {
    const mixed = readMixedFields();
    const typed = document.getElementById('userAnswer').value;
    const parsedText = typed ? parseFractionInput(typed) : null;
    const answer = mixed || parsedText;
    if (!answer) {
        const asInt = parseInt(typed, 10);
        if (!Number.isNaN(asInt) && String(typed).trim() !== '') {
            checkAnswer(asInt);
        }
        return;
    }
    document.getElementById('userAnswer').value = '';
    ['ansWhole', 'ansNum', 'ansDen'].forEach((id) => {
        document.getElementById(id).value = '';
    });
    checkAnswer(answer);
}

function showFeedback(type, value) {
    const question = document.getElementById('question');
    if (type === 'correct') {
        question.style.color = 'var(--success)';
        createConfetti();
    } else {
        question.style.color = 'var(--error)';
        const shown = gameState.currentQuestion.answerText || formatAnswerForDisplay(value);
        if (gameState.currentQuestion.html) {
            question.innerHTML = `${gameState.currentQuestion.html}<span class="op-sign">→</span>${typeof formatFracHtml === 'function' && coerceFrac(value) ? formatFracHtml(coerceFrac(value)) : shown}`;
        } else {
            question.textContent = `${gameState.currentQuestion.text} → ${shown}`;
        }
    }
    setTimeout(() => {
        question.style.color = 'var(--primary)';
    }, 1400);
}

function startTimer() {
    document.getElementById('timer').textContent = formatTime(gameState.elapsed);
    gameState.timerInterval = setInterval(() => {
        gameState.elapsed += 1;
        document.getElementById('timer').textContent = formatTime(gameState.elapsed);
    }, 1000);
}

function updateDisplay() {
    const answered = gameState.correct + gameState.wrong;
    const remaining = Math.max(0, gameState.totalQuestions - answered);
    document.getElementById('correct').textContent = `✅ ${gameState.correct}`;
    document.getElementById('wrong').textContent = `❌ ${gameState.wrong}`;
    document.getElementById('questionNum').textContent = `${Math.min(answered + 1, gameState.totalQuestions)} / ${gameState.totalQuestions}`;
    document.getElementById('remaining').textContent = `осталось ${remaining}`;

    const fill = document.getElementById('progressFill');
    const progress = Math.round((answered / gameState.totalQuestions) * 100);
    fill.style.width = progress + '%';
}

function endGame() {
    gameState.gameActive = false;
    clearInterval(gameState.timerInterval);
    showResults();
}

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
    document.getElementById('resTime').textContent = formatTime(gameState.elapsed);
    document.getElementById('resTotal').textContent = `${total} / ${gameState.totalQuestions}`;

    const mistakesDiv = document.getElementById('mistakesReview');
    if (gameState.mistakes.length > 0) {
        mistakesDiv.innerHTML = '<strong>Ошибки:</strong>';
        gameState.mistakes.slice(0, 12).forEach((mistake) => {
            const item = document.createElement('div');
            item.className = 'mistake-item';
            item.textContent = `${mistake.question} = ${mistake.correctAnswer} (ты ответил: ${mistake.userAnswer})`;
            mistakesDiv.appendChild(item);
        });
        if (gameState.mistakes.length > 12) {
            const more = document.createElement('div');
            more.className = 'mistake-item';
            more.textContent = `…и ещё ${gameState.mistakes.length - 12}`;
            mistakesDiv.appendChild(more);
        }
    } else {
        mistakesDiv.innerHTML = '';
    }

    saveRecord({
        operation: gameState.operation,
        difficulty: gameState.difficulty,
        correct: gameState.correct,
        wrong: gameState.wrong,
        accuracy,
        total: gameState.totalQuestions,
        time: gameState.elapsed,
        date: new Date().toLocaleString('ru-RU')
    });

    showScreen('resultsScreen');
}

function saveRecord(record) {
    let records = JSON.parse(localStorage.getItem('mathTronRecords') || '[]');
    records.unshift(record);
    records = records.slice(0, 20);
    localStorage.setItem('mathTronRecords', JSON.stringify(records));
}

function showRecords() {
    const records = JSON.parse(localStorage.getItem('mathTronRecords') || '[]');
    const list = document.getElementById('recordsList');

    if (records.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: var(--text-dim);">Нет рекордов. Начни игру!</p>';
    } else {
        list.innerHTML = records.map((record, i) => `
            <div class="record-item">
                <div>
                    <div class="record-name">Опыт ${i + 1}: ${operationLabel(record.operation)} (${difficultyLabel(record.difficulty)})</div>
                    <div style="font-size: 0.8rem; color: var(--text-dim);">${record.date}</div>
                </div>
                <div>
                    <div class="record-score">✅${record.correct} ❌${record.wrong}</div>
                    <div style="font-size: 0.8rem; color: var(--primary);">${record.accuracy}% · ${formatTime(record.time || 0)}</div>
                </div>
            </div>
        `).join('');
    }

    showScreen('recordsScreen');
}

function showSettings() {
    showScreen('settingsScreen');
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function backToMenu() {
    showScreen('menuScreen');
}

function quitGame() {
    gameState.gameActive = false;
    clearInterval(gameState.timerInterval);
    showScreen('menuScreen');
}

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

function playSound(type) {
    if (!gameState.sound) {
        return;
    }

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

window.addEventListener('DOMContentLoaded', () => {
    showScreen('menuScreen');
});
