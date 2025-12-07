const auth = firebase.auth();
let flashcards = [];
let shuffledCards = [];
let currentCard = 0;
let userAnswers = [];
let userId = null;

auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'auth.html';
    } else {
        userId = user.uid;
        loadCards();
    }
});

const addPage = document.getElementById('add-page');
const reviewPage = document.getElementById('review-page');
const resultsPage = document.getElementById('results-page');
const questionInput = document.getElementById('question-input');
const answerInput = document.getElementById('answer-input');
const addBtn = document.getElementById('add-btn');
const clearBtn = document.getElementById('clear-btn');
const startReviewBtn = document.getElementById('start-review-btn');
const cardList = document.getElementById('card-list');
const questionText = document.getElementById('question-text');
const userAnswerInput = document.getElementById('user-answer');
const submitAnswerBtn = document.getElementById('submit-answer-btn');
const counter = document.getElementById('card-counter');
const scoreText = document.getElementById('score-text');
const scoreMessage = document.getElementById('score-message');
const resultsList = document.getElementById('results-list');
const retryBtn = document.getElementById('retry-btn');
const backHomeBtn = document.getElementById('back-home-btn');
const clearModal = document.getElementById('clear-modal');
const cancelClear = document.getElementById('cancel-clear');
const confirmClear = document.getElementById('confirm-clear');

addBtn.addEventListener('click', addCard);
clearBtn.addEventListener('click', () => clearModal.classList.add('active'));
cancelClear.addEventListener('click', () => clearModal.classList.remove('active'));
confirmClear.addEventListener('click', clearAllCards);
startReviewBtn.addEventListener('click', startReview);
submitAnswerBtn.addEventListener('click', submitAnswer);
retryBtn.addEventListener('click', startReview);
backHomeBtn.addEventListener('click', () => showPage('add'));
questionInput.addEventListener('keypress', (e) => e.key === 'Enter' && answerInput.focus());
answerInput.addEventListener('keypress', (e) => e.key === 'Enter' && addCard());
userAnswerInput.addEventListener('keypress', (e) => e.key === 'Enter' && submitAnswer());
document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());

function showPage(page) {
    addPage.classList.remove('active');
    reviewPage.classList.remove('active');
    resultsPage.classList.remove('active');
    
    if (page === 'add') addPage.classList.add('active');
    else if (page === 'review') reviewPage.classList.add('active');
    else if (page === 'results') resultsPage.classList.add('active');
}

function addCard() {
    const question = questionInput.value.trim();
    const answer = answerInput.value.trim();
    
    if (question && answer) {
        db.collection('flashcards').add({
            userId,
            question,
            answer,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            questionInput.value = '';
            answerInput.value = '';
            questionInput.focus();
            loadCards();
        });
    }
}

function updateCardList() {
    cardList.innerHTML = flashcards.map((card, i) => `
        <div class="card-item">
            <span class="card-number">${i + 1}</span>
            <div class="card-content-preview">
                <strong>Q:</strong> ${card.question}
            </div>
            <button class="delete-btn" onclick="deleteCard('${card.id}')">×</button>
        </div>
    `).join('');
}

function deleteCard(id) {
    db.collection('flashcards').doc(id).delete().then(() => {
        loadCards();
    });
}

function clearAllCards() {
    db.collection('flashcards').where('userId', '==', userId).get().then(snapshot => {
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        return batch.commit();
    }).then(() => {
        loadCards();
        clearModal.classList.remove('active');
    });
}

function startReview() {
    currentCard = 0;
    userAnswers = [];
    shuffledCards = [...flashcards].sort(() => Math.random() - 0.5);
    showPage('review');
    showQuestion();
}

function showQuestion() {
    questionText.textContent = shuffledCards[currentCard].question;
    userAnswerInput.value = '';
    userAnswerInput.focus();
    counter.textContent = `${currentCard + 1} / ${shuffledCards.length}`;
    const progress = ((currentCard + 1) / shuffledCards.length) * 100;
    document.getElementById('progress-fill').style.width = progress + '%';
}

function submitAnswer() {
    const userAnswer = userAnswerInput.value.trim();
    if (!userAnswer) return;
    
    userAnswers.push({
        question: shuffledCards[currentCard].question,
        correctAnswer: shuffledCards[currentCard].answer,
        userAnswer: userAnswer,
        isCorrect: userAnswer.toLowerCase() === shuffledCards[currentCard].answer.toLowerCase()
    });
    
    currentCard++;
    
    if (currentCard < shuffledCards.length) {
        showQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    showPage('results');
    
    const correctCount = userAnswers.filter(a => a.isCorrect).length;
    const percentage = Math.round((correctCount / userAnswers.length) * 100);
    
    const resultTitle = document.getElementById('result-title');
    const resultMessage = document.getElementById('result-message');
    
    if (percentage === 100) {
        resultTitle.innerHTML = '<i class="bi bi-trophy-fill"></i> Perfect Score!';
        resultMessage.textContent = 'Outstanding! You got everything right!';
    } else if (percentage >= 80) {
        resultTitle.innerHTML = '<i class="bi bi-star-fill"></i> Excellent Work!';
        resultMessage.textContent = 'Great job! You\'re doing amazing!';
    } else if (percentage >= 60) {
        resultTitle.innerHTML = '<i class="bi bi-hand-thumbs-up-fill"></i> Good Effort!';
        resultMessage.textContent = 'Nice work! Keep practicing to improve!';
    } else if (percentage >= 40) {
        resultTitle.innerHTML = '<i class="bi bi-lightning-fill"></i> Keep Going!';
        resultMessage.textContent = 'You\'re making progress. Try again!';
    } else {
        resultTitle.innerHTML = '<i class="bi bi-book-fill"></i> Keep Learning!';
        resultMessage.textContent = 'Don\'t give up! Practice makes perfect!';
    }
    
    scoreText.textContent = `${percentage}%`;
    scoreMessage.textContent = `${correctCount} / ${userAnswers.length}`;
    
    const circumference = 2 * Math.PI * 80;
    const offset = circumference - (percentage / 100) * circumference;
    document.getElementById('score-progress').style.strokeDashoffset = offset;
    
    resultsList.innerHTML = userAnswers.map((answer, i) => `
        <div class="result-item ${answer.isCorrect ? 'correct' : 'incorrect'}">
            <div class="result-header">
                <span class="result-number">${i + 1}</span>
                <span class="result-status">${answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}</span>
            </div>
            <div class="result-content">
                <p><strong>Question:</strong> ${answer.question}</p>
                <p><strong>Your Answer:</strong> ${answer.userAnswer}</p>
                ${!answer.isCorrect ? `<p><strong>Correct Answer:</strong> ${answer.correctAnswer}</p>` : ''}
            </div>
        </div>
    `).join('');
}

function loadCards() {
    if (!userId) return;
    db.collection('flashcards').where('userId', '==', userId).orderBy('createdAt').get().then(snapshot => {
        flashcards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateCardList();
        startReviewBtn.disabled = flashcards.length === 0;
    });
}
